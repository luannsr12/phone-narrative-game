/**
 * Story Engine.
 *
 * Pure, framework-free interpreter for the authored narrative graph. The
 * Zustand store (store/gameStore.ts) is the only place these functions are
 * called; screens never touch the graph directly.
 *
 * Execution model — a single global "playhead" (currentChapter + currentNode):
 *   - message  -> file a bubble into its thread, apply effects, move to `next`
 *   - action   -> apply effects, move to `next`
 *   - branch   -> jump to the first matching branch (or `fallback`)
 *   - unlockMessage -> open the character's (empty) thread so the PLAYER can
 *     message first, apply effects, move to `next`
 *   - shareContact -> file a contact card into its thread (saves the contact
 *     and frees the player to message them), move to `next`
 *   - choice   -> BLOCK (await player input via `choose`)
 *   - call     -> BLOCK (await answer/decline)
 *   - delay    -> BLOCK (the driver arms a wall-clock timer via armDelay and
 *     releases it with completeDelay)
 *   - chapterEnd -> close the chapter, then BLOCK on an interstitial
 *
 * Cross-thread routing falls out for free: if a node targets a thread other
 * than the one on screen, the bubble still files into its own thread and bumps
 * that thread's unread count — the world simply "moves" to another contact.
 */

import type {
  Story,
  StoryNode,
  Effect,
  ChoiceOption,
  EventNode,
  CallSceneNode,
  CallStep,
} from '@/types/story';
import type { GameState, ChatEntry, ThreadState, ForkHead, Gender } from '@/types/game';
import { evalCondition } from '@/utils/conditions';
import { uid } from '@/utils/format';
import { interpolate, type TemplateContext } from '@/utils/template';

export const SAVE_VERSION = 20;
const TRUST_DEFAULT = 50;

/** Template context (name + gender) for interpolating authored text. */
const tctx = (s: GameState): TemplateContext => ({ playerName: s.playerName, gender: s.playerGender });

/**
 * Build the pre-existing chat history (Character.initialChat) as already-read
 * threads. Without an explicit `minutesAgo` a message lands "yesterday-ish",
 * spaced in authored order; the transcripts read as everyday life that was
 * already on the phone before the unknown number ever wrote.
 */
function seedThreads(story: Story, ctx: TemplateContext, now: number): Record<string, ThreadState> {
  const DAY_MIN = 26 * 60; // default anchor: a bit over a day ago
  const threads: Record<string, ThreadState> = {};
  for (const c of Object.values(story.characters)) {
    if (!c.initialChat?.length) continue;
    const entries = c.initialChat
      .map((m, i) => ({
        id: uid('s'),
        nodeId: 'seed',
        thread: c.id,
        speaker: m.fromPlayer ? 'player' : c.id,
        text: interpolate(m.text, ctx),
        kind: (m.fromPlayer ? 'player' : 'message') as ChatEntry['kind'],
        at: now - (m.minutesAgo ?? DAY_MIN - i * 3) * 60_000,
      }))
      .sort((a, b) => a.at - b.at);
    threads[c.id] = {
      entries,
      unread: 0, // old history arrives already read
      lastActivity: entries[entries.length - 1].at,
    };
  }
  return threads;
}

export function initialState(
  playerName: string,
  gender: Gender,
  story: Story,
  now: number,
): GameState {
  const startingMoney = Math.max(0, story.meta.startingMoney ?? 0);
  const name = playerName.trim() || 'Você';
  // Family/friends marked `startsUnlocked` are already saved in the agenda,
  // like a real phone that comes with your people in it.
  const preSaved = Object.values(story.characters)
    .filter((c) => c.startsUnlocked)
    .map((c) => c.id);
  return {
    version: SAVE_VERSION,
    playerName: name,
    playerGender: gender,
    started: true,
    currentChapter: story.meta.startChapter,
    currentNode: story.chapters[story.meta.startChapter]?.entry ?? null,
    forks: [],
    flags: {},
    trust: Object.fromEntries(preSaved.map((id) => [id, TRUST_DEFAULT])),
    unlockedContacts: preSaved,
    messageUnlocks: [],
    threads: seedThreads(story, { playerName: name, gender }, now),
    evidence: [],
    news: [],
    scheduledNews: [],
    viewedNews: [],
    social: [],
    stories: [],
    seenStories: [],
    likedPosts: [],
    likedComments: [],
    postComments: {},
    postLikes: {},
    commentLikes: {},
    followStats: {},
    socialNotifications: [],
    // Some filler NPCs come pre-followed so the feed has life (admin decides
    // which via followedByDefault, default on); case characters are opt-in —
    // followed at start only when explicitly marked, else found via search.
    following: [
      ...Object.values(story.socialNpcs ?? {})
        .filter((n) => n.followedByDefault !== false)
        .map((n) => n.id),
      ...Object.values(story.characters ?? {})
        .filter((c) => c.social?.followedByDefault)
        .map((c) => c.id),
    ],
    timeline: [],
    blogDrafts: [],
    blog: [],
    blogShared: [],
    money: startingMoney,
    transactions: startingMoney
      ? [{ id: uid('tx'), amount: startingMoney, label: 'Saldo inicial', at: now }]
      : [],
    transfers: {},
    calls: [],
    armedEvents: [],
    activeCall: null,
    choicesMade: [],
    completedChapters: [],
    endingScores: {},
    forcedEnding: null,
    endingId: null,
    delayUntil: null,
    pendingReminder: null,
    presence: {},
    justCompletedChapter: null,
  };
}

export function getNode(
  story: Story,
  chapterId: string,
  nodeId: string | null,
): StoryNode | undefined {
  if (!nodeId) return undefined;
  return story.chapters[chapterId]?.nodes[nodeId];
}

/** The node the playhead is currently parked on (if any). */
export function currentNode(state: GameState, story: Story): StoryNode | undefined {
  return getNode(story, state.currentChapter, state.currentNode);
}

/** True when the engine cannot self-advance and needs UI input (or a timer). */
export function isBlocking(node: StoryNode | undefined): boolean {
  if (!node) return true;
  return (
    node.type === 'choice' ||
    node.type === 'call' ||
    node.type === 'callScene' ||
    node.type === 'delay' ||
    node.type === 'chapterEnd'
  );
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export function applyEffects(
  state: GameState,
  effects: Effect[] | undefined,
  story: Story,
  now: number,
): GameState {
  if (!effects?.length) return state;
  let s = state;
  for (const effect of effects) s = applyEffect(s, effect, story, now);
  return s;
}

function applyEffect(state: GameState, effect: Effect, story: Story, now: number): GameState {
  switch (effect.type) {
    case 'setFlag':
      return { ...state, flags: { ...state.flags, [effect.flag]: effect.value ?? true } };

    case 'trust': {
      const cur = state.trust[effect.character] ?? TRUST_DEFAULT;
      const next = Math.max(0, Math.min(100, cur + effect.delta));
      return { ...state, trust: { ...state.trust, [effect.character]: next } };
    }

    case 'unlockContact': {
      if (state.unlockedContacts.includes(effect.character)) return state;
      return {
        ...state,
        unlockedContacts: [...state.unlockedContacts, effect.character],
        trust: {
          ...state.trust,
          [effect.character]: state.trust[effect.character] ?? TRUST_DEFAULT,
        },
      };
    }

    case 'addEvidence': {
      if (state.evidence.some((e) => e.id === effect.evidence)) return state;
      const meta = story.evidence[effect.evidence];
      return {
        ...state,
        evidence: [
          ...state.evidence,
          { id: effect.evidence, receivedAt: now, from: meta?.source ?? 'system' },
        ],
      };
    }

    case 'unlockNews': {
      // News goes through the scheduler (delay 0 = published on next tick),
      // which also fires the "Notícias" notification.
      if (state.news.includes(effect.news)) return state;
      if (state.scheduledNews.some((n) => n.news === effect.news)) return state;
      const delayMs = (effect.notifyDelaySec ?? 0) * 1000;
      return {
        ...state,
        scheduledNews: [...state.scheduledNews, { news: effect.news, at: now + delayMs }],
      };
    }

    case 'unlockSocial':
      if (state.social.includes(effect.post)) return state;
      return { ...state, social: [...state.social, effect.post] };

    case 'unlockStory':
      if (state.stories.includes(effect.story)) return state;
      return { ...state, stories: [...state.stories, effect.story] };

    case 'offerBlog':
      if (state.blogDrafts.includes(effect.blog)) return state;
      // Already published? Don't re-offer it as a draft.
      if (state.blog.some((b) => b.id === effect.blog)) return state;
      return { ...state, blogDrafts: [...state.blogDrafts, effect.blog] };

    case 'addTimeline': {
      if (state.timeline.some((t) => t.id === effect.id)) return state;
      return {
        ...state,
        timeline: [...state.timeline, { id: effect.id, title: effect.title, detail: effect.detail, at: now }],
      };
    }

    case 'money': {
      // Round to cents — the balance may carry centavos (e.g. R$ 12,90).
      const amount = Math.round(effect.amount * 100) / 100;
      if (!amount) return state;
      return {
        ...state,
        money: Math.max(0, Math.round((state.money + amount) * 100) / 100),
        transactions: [
          ...state.transactions,
          {
            id: uid('tx'),
            amount,
            label: effect.reason || (amount > 0 ? 'Transferência recebida' : 'Pagamento'),
            at: now,
          },
        ],
      };
    }

    case 'setPresence':
      return {
        ...state,
        presence: { ...state.presence, [effect.character]: { online: effect.online, at: now } },
      };

    case 'addComment': {
      const list = state.postComments[effect.post] ?? [];
      // If an explicit id is given and already present, don't duplicate it.
      if (effect.commentId && list.some((c) => c.id === effect.commentId)) return state;
      const comment = {
        id: effect.commentId || uid('cm'),
        author: effect.author,
        text: interpolate(effect.text, tctx(state)),
        replyTo: effect.replyTo,
        likes: effect.likes,
      };
      return {
        ...state,
        postComments: { ...state.postComments, [effect.post]: [...list, comment] },
      };
    }

    case 'setPostLikes':
      return { ...state, postLikes: { ...state.postLikes, [effect.post]: effect.likes } };

    case 'setCommentLikes':
      return { ...state, commentLikes: { ...state.commentLikes, [effect.comment]: effect.likes } };

    case 'setFollowStats': {
      const prev = state.followStats[effect.account] ?? {};
      return {
        ...state,
        followStats: {
          ...state.followStats,
          [effect.account]: {
            followers: effect.followers ?? prev.followers,
            following: effect.following ?? prev.following,
          },
        },
      };
    }

    case 'setEnding':
      return { ...state, forcedEnding: effect.ending };

    case 'lockEndingScore': {
      const cur = state.endingScores[effect.ending] ?? 0;
      return { ...state, endingScores: { ...state.endingScores, [effect.ending]: cur + effect.delta } };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Bubble filing
// ---------------------------------------------------------------------------

function fileEntry(state: GameState, entry: ChatEntry, markUnread: boolean): GameState {
  const prev = state.threads[entry.thread] ?? { entries: [], unread: 0, lastActivity: 0 };
  return {
    ...state,
    threads: {
      ...state.threads,
      [entry.thread]: {
        entries: [...prev.entries, entry],
        unread: markUnread ? prev.unread + 1 : prev.unread,
        lastActivity: entry.at,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Advancing the playhead
// ---------------------------------------------------------------------------

export interface AdvanceResult {
  state: GameState;
  /** true when the engine is now parked on a node that needs UI input. */
  blocked: boolean;
  /** The thread that just received a bubble, if any (for unread/animation). */
  deliveredThread?: string;
  /** A `notification` node just fired — the store surfaces it as a banner. */
  notice?: {
    app: 'messages' | 'news' | 'social' | 'bank' | 'blog' | 'custom';
    appName?: string;
    icon?: string;
    iconColor?: string;
    title: string;
    body?: string;
    durationSec?: number;
    news?: string;
    post?: string;
    url?: string;
  };
}

/** What stepping a single track from one node produced. */
interface StepResult {
  state: GameState;
  /** The track's next node (null = the track ends here). */
  next: string | null;
  /** Extra parallel tracks to spawn (a `fork` node's outputs beyond the first). */
  spawnForks?: string[];
  /** true = the node can't self-advance (choice/call/delay/chapterEnd/missing). */
  blocked: boolean;
  deliveredThread?: string;
  notice?: AdvanceResult['notice'];
}

/** Fresh parallel-track heads for the given node ids. */
function spawnForkHeads(nodeIds: string[]): ForkHead[] {
  return nodeIds.map((n) => ({ id: uid('fk'), node: n, delayUntil: null }));
}

function pruneFork(state: GameState, forkId: string): GameState {
  return { ...state, forks: state.forks.filter((f) => f.id !== forkId) };
}

/**
 * Process exactly one self-advancing node within the current chapter,
 * position-agnostic: works for the main playhead AND for parallel fork tracks.
 * Returns the global state changes plus where THIS track goes next; it never
 * writes a playhead position itself (the caller does). `blocked: true` (state
 * unchanged) when the node needs UI or a timer (choice/call/delay/chapterEnd)
 * or is missing.
 */
function stepNode(state: GameState, story: Story, nodeId: string | null, now: number): StepResult {
  const node = getNode(story, state.currentChapter, nodeId);
  if (!node || isBlocking(node)) return { state, next: nodeId ?? null, blocked: true };

  switch (node.type) {
    case 'message': {
      const entry: ChatEntry = {
        id: uid('m'),
        nodeId: node.id,
        thread: node.thread,
        speaker: node.speaker,
        text: interpolate(node.text, tctx(state)),
        attachment: node.attachment,
        kind: node.speaker === 'player' ? 'player' : node.speaker === 'system' ? 'system' : 'message',
        at: now,
      };
      let s = fileEntry(state, entry, node.speaker !== 'player');
      // Arm the no-reply nudge (replaces any previous one still pending).
      if (node.reminder?.text && node.reminder.afterSec > 0) {
        s = {
          ...s,
          pendingReminder: {
            thread: node.thread,
            speaker: node.speaker,
            text: node.reminder.text,
            at: now + node.reminder.afterSec * 1000,
          },
        };
      }
      s = applyEffects(s, node.effects, story, now);
      return { state: s, next: node.next ?? null, blocked: false, deliveredThread: node.thread };
    }

    case 'action': {
      const s = applyEffects(state, node.effects, story, now);
      return { state: s, next: node.next ?? null, blocked: false };
    }

    case 'branch': {
      const match = node.branches.find((b) => evalCondition(state, b.condition));
      return { state, next: match?.next ?? node.fallback ?? null, blocked: false };
    }

    case 'fork': {
      // Split into parallel tracks: the first output continues THIS line, the
      // rest spawn beside it. No outputs → this line just ends.
      return { state, next: node.outputs[0] ?? null, spawnForks: node.outputs.slice(1), blocked: false };
    }

    case 'activity': {
      // Pure presence ("digitando…"/"gravando…") — nothing is filed. The
      // playback driver holds the indicator for node.seconds; here we simply
      // move the track on.
      return { state, next: node.next ?? null, blocked: false };
    }

    case 'event': {
      // ARM a player-call event and move on (self-advancing). It fires later,
      // when the player places a matching call (see fireCallEvent). Effects
      // apply on FIRE, not here. Dedup so a re-visited node arms only once.
      let s = state;
      if (!s.armedEvents.some((e) => e.node === node.id)) {
        s = { ...s, armedEvents: [...s.armedEvents, { chapter: s.currentChapter, node: node.id }] };
      }
      return { state: s, next: node.next ?? null, blocked: false };
    }

    case 'removeEvent': {
      // Disarm the referenced event node (self-advancing).
      const s = { ...state, armedEvents: state.armedEvents.filter((e) => e.node !== node.target) };
      return { state: s, next: node.next ?? null, blocked: false };
    }

    // Standalone publish/balance blocks — sugar over the equivalent effects so
    // the authored flow can show them as first-class steps, detached from any
    // message bubble.
    case 'publishNews':
    case 'publishPost':
    case 'publishStory':
    case 'offerBlog':
    case 'bank': {
      const effect: Effect =
        node.type === 'publishNews'
          ? { type: 'unlockNews', news: node.news, notifyDelaySec: node.notifyDelaySec }
          : node.type === 'publishPost'
          ? { type: 'unlockSocial', post: node.post }
          : node.type === 'publishStory'
          ? { type: 'unlockStory', story: node.story }
          : node.type === 'offerBlog'
          ? { type: 'offerBlog', blog: node.blog }
          : { type: 'money', amount: node.amount, reason: node.reason };
      const s = applyEffects(state, [effect], story, now);
      return { state: s, next: node.next ?? null, blocked: false };
    }

    case 'socialActivity': {
      // Sugar over addComment / setPostLikes / setCommentLikes.
      const effect: Effect | null =
        node.action === 'comment'
          ? {
              type: 'addComment',
              post: node.post ?? '',
              author: node.author ?? 'player',
              text: node.text ?? '',
              replyTo: node.replyTo,
              commentId: node.commentId,
              likes: node.likes,
            }
          : node.action === 'postLikes'
          ? { type: 'setPostLikes', post: node.post ?? '', likes: node.likes ?? 0 }
          : node.action === 'commentLikes'
          ? { type: 'setCommentLikes', comment: node.comment ?? '', likes: node.likes ?? 0 }
          : null;
      const s = effect ? applyEffects(state, [effect], story, now) : state;
      return { state: s, next: node.next ?? null, blocked: false };
    }

    case 'socialFollow': {
      const s = applyEffects(
        state,
        [{ type: 'setFollowStats', account: node.account, followers: node.followers, following: node.following }],
        story,
        now,
      );
      return { state: s, next: node.next ?? null, blocked: false };
    }

    case 'notification': {
      return {
        state,
        next: node.next ?? null,
        blocked: false,
        notice: {
          app: node.app,
          appName: node.appName,
          icon: node.icon,
          iconColor: node.iconColor,
          title: interpolate(node.title, tctx(state)),
          body: interpolate(node.body, tctx(state)),
          durationSec: node.durationSec,
          news: node.news,
          post: node.post,
          url: node.url,
        },
      };
    }

    case 'shareContact': {
      const entry: ChatEntry = {
        id: uid('m'),
        nodeId: node.id,
        thread: node.thread,
        speaker: node.speaker,
        text: interpolate(node.text, tctx(state)),
        attachment: { kind: 'contact', character: node.character },
        kind: node.speaker === 'player' ? 'player' : 'message',
        at: now,
      };
      let s = fileEntry(state, entry, node.speaker !== 'player');
      // Receiving the card saves the contact (real name shows) and frees the
      // player to message them — like saving a number someone forwarded.
      s = applyEffects(s, [{ type: 'unlockContact', character: node.character }], story, now);
      if (!s.messageUnlocks.includes(node.character)) {
        s = { ...s, messageUnlocks: [...s.messageUnlocks, node.character] };
      }
      s = applyEffects(s, node.effects, story, now);
      return { state: s, next: node.next ?? null, blocked: false, deliveredThread: node.thread };
    }

    case 'unlockMessage': {
      let s = state;
      if (!s.messageUnlocks.includes(node.character)) {
        s = { ...s, messageUnlocks: [...s.messageUnlocks, node.character] };
      }
      // Materialise the (empty) thread so it shows up in the Messages app and
      // the contact's "Mensagem" button works before any bubble exists.
      if (!s.threads[node.character]) {
        s = {
          ...s,
          threads: {
            ...s.threads,
            [node.character]: { entries: [], unread: 0, lastActivity: now },
          },
        };
      }
      s = applyEffects(s, node.effects, story, now);
      return { state: s, next: node.next ?? null, blocked: false };
    }

    default:
      return { state, next: nodeId ?? null, blocked: true };
  }
}

/**
 * Process exactly one self-advancing node on the MAIN playhead and stop.
 * Returns `blocked: true` without mutating when parked on choice/call/end.
 * A `fork` node here spawns its extra outputs as parallel tracks.
 */
export function advance(state: GameState, story: Story, now: number): AdvanceResult {
  const r = stepNode(state, story, state.currentNode, now);
  if (r.blocked) return { state, blocked: true };
  let s: GameState = { ...r.state, currentNode: r.next };
  if (r.spawnForks?.length) s = { ...s, forks: [...s.forks, ...spawnForkHeads(r.spawnForks)] };
  return {
    state: s,
    blocked: isBlocking(currentNode(s, story)),
    deliveredThread: r.deliveredThread,
    notice: r.notice,
  };
}

/**
 * Advance one parallel fork track by a single step. A track that hits a dead
 * end or a MAIN-LINE-only node (choice/call/chapterEnd) just stops and is
 * pruned; `delay` is handled out of band (armForkDelay/completeForkDelay).
 */
export function advanceFork(
  state: GameState,
  story: Story,
  forkId: string,
  now: number,
): AdvanceResult {
  const fork = state.forks.find((f) => f.id === forkId);
  if (!fork) return { state, blocked: true };
  const node = getNode(story, state.currentChapter, fork.node);
  if (!node) return { state: pruneFork(state, forkId), blocked: true };
  if (node.type === 'delay') return { state, blocked: true }; // driver arms the wait
  if (isBlocking(node)) return { state: pruneFork(state, forkId), blocked: true };

  const r = stepNode(state, story, fork.node, now);
  let forks = r.state.forks.map((f) => (f.id === forkId ? { ...f, node: r.next, delayUntil: null } : f));
  if (r.spawnForks?.length) forks = [...forks, ...spawnForkHeads(r.spawnForks)];
  forks = forks.filter((f) => f.node != null); // prune finished tracks
  return {
    state: { ...r.state, forks },
    blocked: false,
    deliveredThread: r.deliveredThread,
    notice: r.notice,
  };
}

/** Drain self-advancing nodes that produce no bubble until reaching a stop. */
export function fastForward(state: GameState, story: Story, now: number): GameState {
  let s = state;
  let guard = 0;
  while (guard++ < 500) {
    const node = currentNode(s, story);
    if (
      !node ||
      isBlocking(node) ||
      node.type === 'message' ||
      node.type === 'shareContact' ||
      node.type === 'activity'
    )
      break;
    s = advance(s, story, now).state;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Player input
// ---------------------------------------------------------------------------

/** Options available for the choice the playhead is parked on. */
export function availableOptions(state: GameState, story: Story): ChoiceOption[] {
  const node = currentNode(state, story);
  if (!node || node.type !== 'choice') return [];
  return node.options.filter((o) => evalCondition(state, o.condition));
}

export function choose(state: GameState, story: Story, optionId: string, now: number): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'choice') return state;
  const option = node.options.find((o) => o.id === optionId);
  if (!option || !evalCondition(state, option.condition)) return state;

  let s = state;
  // Silent options register the decision without sending any bubble.
  if (!option.silent) {
    const entry: ChatEntry = {
      id: uid('p'),
      nodeId: node.id,
      thread: node.thread,
      speaker: 'player',
      text: interpolate(option.say ?? option.text, tctx(state)),
      kind: 'player',
      at: now,
    };
    s = fileEntry(s, entry, false);
  }
  s = { ...s, choicesMade: [...s.choicesMade, option.id] };
  s = applyEffects(s, option.effects, story, now);
  // The player answered — any armed "voce ta ai?" nudge is moot.
  s = { ...s, currentNode: option.next, pendingReminder: null };
  return s;
}

/** File the armed no-reply nudge once due (the player still hasn't answered). */
export function fireReminder(state: GameState, now: number): GameState {
  const r = state.pendingReminder;
  if (!r || now < r.at) return state;
  const entry: ChatEntry = {
    id: uid('rm'),
    nodeId: 'reminder',
    thread: r.thread,
    speaker: r.speaker,
    text: interpolate(r.text, tctx(state)),
    kind: r.speaker === 'player' ? 'player' : r.speaker === 'system' ? 'system' : 'message',
    at: now,
  };
  return { ...fileEntry(state, entry, r.speaker !== 'player'), pendingReminder: null };
}

// ---------------------------------------------------------------------------
// Delay nodes (real-time waits, driven by usePlaybackDriver)
// ---------------------------------------------------------------------------

/** Parked on a fresh `delay` node: stamp when it elapses. No-op otherwise. */
export function armDelay(state: GameState, story: Story, now: number): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'delay' || state.delayUntil != null) return state;
  return { ...state, delayUntil: now + Math.max(0, node.seconds) * 1000 };
}

/** Release an elapsed `delay` node and move the playhead on. No-op while early. */
export function completeDelay(state: GameState, story: Story, now: number): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'delay') return state;
  if (state.delayUntil == null || now < state.delayUntil) return state;
  return { ...state, delayUntil: null, currentNode: node.next ?? null };
}

/** Parked on a fresh `delay` in a fork track: stamp when it elapses. */
export function armForkDelay(state: GameState, story: Story, forkId: string, now: number): GameState {
  const fork = state.forks.find((f) => f.id === forkId);
  if (!fork || fork.delayUntil != null) return state;
  const node = getNode(story, state.currentChapter, fork.node);
  if (!node || node.type !== 'delay') return state;
  return {
    ...state,
    forks: state.forks.map((f) =>
      f.id === forkId ? { ...f, delayUntil: now + Math.max(0, node.seconds) * 1000 } : f,
    ),
  };
}

/** Release an elapsed fork `delay`, moving that track on (pruning if it ends). */
export function completeForkDelay(
  state: GameState,
  story: Story,
  forkId: string,
  now: number,
): GameState {
  const fork = state.forks.find((f) => f.id === forkId);
  if (!fork) return state;
  const node = getNode(story, state.currentChapter, fork.node);
  if (!node || node.type !== 'delay' || fork.delayUntil == null || now < fork.delayUntil) return state;
  const forks = state.forks
    .map((f) => (f.id === forkId ? { ...f, node: node.next ?? null, delayUntil: null } : f))
    .filter((f) => f.node != null);
  return { ...state, forks };
}

export function resolveCall(
  state: GameState,
  story: Story,
  answered: boolean,
  now: number,
): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'call') return state;
  const branch = answered ? node.onAnswer : node.onDecline;

  let s = state;
  if (!answered && node.voicemailText && node.thread) {
    s = fileEntry(
      s,
      {
        id: uid('c'),
        nodeId: node.id,
        thread: node.thread,
        speaker: node.caller,
        text: interpolate(node.voicemailText, tctx(state)),
        kind: 'call-log',
        at: now,
      },
      true,
    );
  }
  s = applyEffects(s, branch?.effects, story, now);
  s = { ...s, currentNode: branch?.next ?? null };
  return s;
}

// ---------------------------------------------------------------------------
// Interactive call (callScene) — walking the call's private sub-flow
// ---------------------------------------------------------------------------
//
// The main playhead PARKS on a `callScene` node (it is blocking). Two phases:
//   1. RINGING — activeCall is null while the playhead sits on the node. The
//      overlay shows Atender / Recusar. answerCallScene / declineCallScene
//      resolve it.
//   2. CONNECTED — activeCall = { node, step } walks the sub-flow. action/branch
//      steps self-advance (settleCall); audio/delay/choice steps wait for the
//      overlay (a timer or the player); hangup / dead end ends the call and the
//      main line continues at the callScene's `next`.
// activeCall persists, so a call resumes mid-sub-flow after an app restart
// instead of replaying and re-applying effects.

/** The `callScene` node currently on screen — ringing OR connected. */
export function callScene(state: GameState, story: Story): CallSceneNode | undefined {
  if (state.activeCall) {
    const n = getNode(story, state.activeCall.chapter, state.activeCall.node);
    return n?.type === 'callScene' ? n : undefined;
  }
  const n = currentNode(state, story);
  return n?.type === 'callScene' ? n : undefined;
}

/** The sub-flow step the connected call is parked on (undefined while ringing). */
export function callCurrentStep(state: GameState, story: Story): CallStep | undefined {
  if (!state.activeCall?.step) return undefined;
  const o = getNode(story, state.activeCall.chapter, state.activeCall.node);
  if (o?.type !== 'callScene') return undefined;
  return o.scene[state.activeCall.step];
}

function setCallStep(state: GameState, stepId: string | null): GameState {
  if (!state.activeCall) return state;
  return { ...state, activeCall: { ...state.activeCall, step: stepId } };
}

/** End the connected call: apply a hangup's effects, then resume the main line. */
function finishCall(
  state: GameState,
  story: Story,
  now: number,
  hangup?: Extract<CallStep, { type: 'hangup' }>,
): GameState {
  const outer = state.activeCall
    ? getNode(story, state.activeCall.chapter, state.activeCall.node)
    : undefined;
  let s = state;
  if (hangup?.effects) s = applyEffects(s, hangup.effects, story, now);
  const next = outer?.type === 'callScene' ? outer.next ?? null : null;
  return { ...s, activeCall: null, currentNode: next };
}

/**
 * Walk the self-advancing steps (action/branch) until the sub-flow lands on a
 * step the UI/timer must drive (audio/choice/delay) or the call ends (hangup /
 * dead end). Keeps the overlay simple: it only ever sees audio/choice/delay.
 */
function settleCall(state: GameState, story: Story, now: number): GameState {
  let s = state;
  let guard = 0;
  while (s.activeCall && guard++ < 200) {
    const step = callCurrentStep(s, story);
    if (!step) {
      s = finishCall(s, story, now);
      break;
    }
    if (step.type === 'hangup') {
      s = finishCall(s, story, now, step);
      break;
    }
    if (step.type === 'action') {
      s = applyEffects(s, step.effects, story, now);
      s = setCallStep(s, step.next ?? null);
      continue;
    }
    if (step.type === 'branch') {
      const match = step.branches.find((b) => evalCondition(s, b.condition));
      s = setCallStep(s, match?.next ?? step.fallback ?? null);
      continue;
    }
    break; // audio | choice | delay → the overlay drives it
  }
  return s;
}

/** Player answered an interactive call: connect, apply effects, enter the sub-flow. */
export function answerCallScene(state: GameState, story: Story, now: number): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'callScene' || state.activeCall) return state;
  let s = applyEffects(state, node.effects, story, now); // the call connected
  s = { ...s, activeCall: { chapter: state.currentChapter, node: node.id, step: node.entry } };
  return settleCall(s, story, now);
}

/**
 * Player declined an interactive call (taps Recusar) or it rang out (`timedOut`).
 * Files an optional voicemail line into the caller's thread, applies the route's
 * effects, and continues the main line at the route's `next` (else the node's).
 */
export function declineCallScene(
  state: GameState,
  story: Story,
  timedOut: boolean,
  now: number,
): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'callScene' || state.activeCall) return state;
  const route = timedOut && node.onTimeout ? node.onTimeout : node.onDecline;
  let s = applyEffects(state, route?.effects, story, now);
  const vm = route?.voicemailText;
  const thread = route?.thread ?? node.caller;
  if (vm && thread) {
    s = fileEntry(
      s,
      {
        id: uid('c'),
        nodeId: node.id,
        thread,
        speaker: node.caller,
        text: interpolate(vm, tctx(s)),
        kind: 'call-log',
        at: now,
      },
      true,
    );
  }
  return { ...s, currentNode: route?.next ?? node.next ?? null };
}

/** Options offered by the in-call `choice` step the call is parked on. */
export function callSceneOptions(state: GameState, story: Story): ChoiceOption[] {
  const step = callCurrentStep(state, story);
  if (!step || step.type !== 'choice') return [];
  return step.options.filter((o) => evalCondition(state, o.condition));
}

/** Player picked an in-call reply: record it, apply effects, advance the sub-flow. */
export function chooseCallStep(
  state: GameState,
  story: Story,
  optionId: string,
  now: number,
): GameState {
  const step = callCurrentStep(state, story);
  if (!step || step.type !== 'choice') return state;
  const option = step.options.find((o) => o.id === optionId);
  if (!option || !evalCondition(state, option.condition)) return state;
  let s = { ...state, choicesMade: [...state.choicesMade, option.id] };
  s = applyEffects(s, option.effects, story, now);
  s = setCallStep(s, option.next ?? null);
  return settleCall(s, story, now);
}

/**
 * The current audio/delay step finished (its MP3 ended or the silence elapsed):
 * apply audio effects and advance the sub-flow. No-op on other steps.
 */
export function completeCallStep(state: GameState, story: Story, now: number): GameState {
  const step = callCurrentStep(state, story);
  if (!step || (step.type !== 'audio' && step.type !== 'delay')) return state;
  let s = state;
  if (step.type === 'audio') s = applyEffects(s, step.effects, story, now);
  s = setCallStep(s, step.next ?? null);
  return settleCall(s, story, now);
}

/**
 * The current in-call `choice` step timed out with no reply: route to its
 * `timeoutNext` (no option effects — the player didn't answer), or hang up when
 * none is set. No-op on any other step. Only fires when `timeoutSec` is set.
 */
export function timeoutCallStep(state: GameState, story: Story, now: number): GameState {
  const step = callCurrentStep(state, story);
  if (!step || step.type !== 'choice') return state;
  const s = setCallStep(state, step.timeoutNext ?? null);
  return settleCall(s, story, now);
}

/** Player hung up mid-call (the Encerrar button): end it and resume the main line. */
export function hangUpCallScene(state: GameState, story: Story, now: number): GameState {
  if (!state.activeCall) return state;
  return finishCall(state, story, now);
}

// ---------------------------------------------------------------------------
// Chapter transitions & endings
// ---------------------------------------------------------------------------

/**
 * True while the playhead is parked on a `chapterEnd` whose objective gate is
 * still unmet — the chapter cannot complete until the player fulfils it (e.g.
 * earns enough money in Pares, or receives an evidence on a side path).
 */
export function chapterGateBlocked(state: GameState, story: Story): boolean {
  const node = currentNode(state, story);
  return (
    !!node &&
    node.type === 'chapterEnd' &&
    !!node.requirement &&
    !evalCondition(state, node.requirement)
  );
}

/** Resolve a `chapterEnd` node: close the chapter and decide where to go. */
export function closeChapter(state: GameState, story: Story, now: number): GameState {
  const node = currentNode(state, story);
  if (!node || node.type !== 'chapterEnd') return state;
  // Objective gate unmet — stay parked; the driver re-checks as state changes.
  if (node.requirement && !evalCondition(state, node.requirement)) return state;

  let s = applyEffects(state, node.effects, story, now);
  const finished = s.currentChapter;
  if (!s.completedChapters.includes(finished)) {
    s = { ...s, completedChapters: [...s.completedChapters, finished] };
  }

  // Route to an ending if this beat or the run has decided one. Parallel tracks
  // do not survive a chapter boundary — drop any still running.
  const ending = node.ending ?? s.forcedEnding;
  if (ending) {
    return { ...s, endingId: ending, currentNode: null, forks: [], justCompletedChapter: finished };
  }

  return { ...s, currentNode: null, forks: [], justCompletedChapter: finished };
}

/** Advance to the chapter the just-finished one points at. */
export function startNextChapter(state: GameState, story: Story): GameState {
  const finished = state.justCompletedChapter ?? state.currentChapter;
  const node = getNode(story, finished, lastChapterEndNodeId(story, finished));

  let nextId: string | undefined;
  if (node && node.type === 'chapterEnd' && node.next) {
    nextId = node.next;
  } else {
    const order = story.chapterOrder;
    const i = order.indexOf(finished);
    nextId = i >= 0 ? order[i + 1] : undefined;
  }

  if (!nextId || !story.chapters[nextId]) {
    // No more chapters — fall back to whatever ending was scored/forced.
    return { ...state, justCompletedChapter: null };
  }

  return {
    ...state,
    currentChapter: nextId,
    currentNode: story.chapters[nextId].entry,
    forks: [],
    justCompletedChapter: null,
  };
}

// ---------------------------------------------------------------------------
// Armed events (registered by `event` nodes; fired by a matching player action)
// ---------------------------------------------------------------------------

/** Compare two phone numbers by their digits only (ignores +55, spaces, …). */
function digitsEqual(a: string, b: string): boolean {
  const da = a.replace(/\D/g, '');
  const db = b.replace(/\D/g, '');
  return da.length > 0 && da === db;
}

/** A player action that may fire armed `event` listeners. */
export type EventTrigger =
  | { event: 'playerCall'; contactId: string | null; number: string }
  | { event: 'likePost'; post: string }
  | { event: 'viewNews'; news: string }
  | { event: 'followProfile'; account: string };

/** Does the player action `trigger` match this event node's type + target? */
export function eventMatches(node: EventNode, trigger: EventTrigger): boolean {
  if (node.event !== trigger.event) return false;
  switch (trigger.event) {
    case 'playerCall':
      if (node.contact) return node.contact === trigger.contactId;
      if (node.number) return digitsEqual(node.number, trigger.number);
      return true; // no target → any call the player makes matches it
    case 'likePost':
      return !node.post || node.post === trigger.post;
    case 'viewNews':
      return !node.news || node.news === trigger.news;
    case 'followProfile':
      return !node.account || node.account === trigger.account;
  }
}

/**
 * The currently-armed `event` (if any) that the player action `trigger` would
 * fire: it must match the target AND satisfy its `condition`. Armed events are
 * checked in the order they were armed, so the FIRST whose condition holds wins
 * — arm several for the same target with different conditions to make the
 * outcome depend on trust/evidence/flags.
 */
export function findArmedEvent(
  state: GameState,
  story: Story,
  trigger: EventTrigger,
): EventNode | undefined {
  for (const ref of state.armedEvents) {
    const node = story.chapters[ref.chapter]?.nodes[ref.node];
    if (!node || node.type !== 'event') continue;
    if (!eventMatches(node, trigger)) continue;
    if (!evalCondition(state, node.condition)) continue;
    return node;
  }
  return undefined;
}

/**
 * A player action happened (a call, a like, a news view, a follow). If an armed
 * `event` matches it (target + condition), the event FIRES: its `effects` apply
 * AND its `onEvent` output sequence runs.
 *
 * - WAIT events (no `next`): the main line had parked here. On fire the main
 *   line resumes at `onEvent` (full power — the output may have choices/calls),
 *   and the event is consumed (one-shot).
 * - BACKGROUND events (a `next` continue path was taken): the main line is
 *   elsewhere, so `onEvent` runs as a parallel delivery track; the event stays
 *   armed (a `removeEvent` node disarms it).
 *
 * No-op when nothing matches.
 */
export function fireEvent(
  state: GameState,
  story: Story,
  trigger: EventTrigger,
  now: number,
): GameState {
  const node = findArmedEvent(state, story, trigger);
  if (!node) return state;

  let s = applyEffects(state, node.effects, story, now);

  if (node.onEvent) {
    if (!node.next && s.currentNode == null) {
      // Wait mode, main line idle → resume it at the output (full power).
      s = { ...s, currentNode: node.onEvent };
    } else {
      // Background (or main line busy) → run the output as a parallel track.
      s = { ...s, forks: [...s.forks, ...spawnForkHeads([node.onEvent])] };
    }
  }

  // Wait events are one-shot; background events keep listening until removed.
  if (!node.next) {
    s = { ...s, armedEvents: s.armedEvents.filter((e) => e.node !== node.id) };
  }

  return s;
}

/**
 * The armed `playerCall` event an outgoing call to `contactId`/`number` would
 * fire. The Telefone UI needs the matched node to know how the call plays out
 * (outcome/audio/transcript), so this returns it rather than just firing.
 */
export function findArmedCallEvent(
  state: GameState,
  story: Story,
  contactId: string | null,
  number: string,
): EventNode | undefined {
  return findArmedEvent(state, story, { event: 'playerCall', contactId, number });
}

/** The player placed an outgoing call from Telefone — fire any matching event. */
export function fireCallEvent(
  state: GameState,
  story: Story,
  contactId: string | null,
  number: string,
  now: number,
): GameState {
  return fireEvent(state, story, { event: 'playerCall', contactId, number }, now);
}

/** Find the chapterEnd node a chapter terminated on (there is exactly one path). */
function lastChapterEndNodeId(story: Story, chapterId: string): string | null {
  const ch = story.chapters[chapterId];
  if (!ch) return null;
  const found = Object.values(ch.nodes).find((n) => n.type === 'chapterEnd');
  return found?.id ?? null;
}

/**
 * Pick the ending to play when the story funnels into the finale without a
 * forced lock: highest soft score wins, ties break by authored order.
 */
export function resolveEnding(state: GameState, story: Story): string | null {
  if (state.forcedEnding) return state.forcedEnding;
  const order = Object.keys(story.endings);
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const id of order) {
    // Honor the optional availability gate: a condition-locked ending can only
    // win the soft-score race once its gate is actually satisfied. Ungated
    // endings (no condition) are always eligible.
    const cond = story.endings[id]?.condition;
    if (cond && !evalCondition(state, cond)) continue;
    const score = state.endingScores[id] ?? 0;
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best ?? order[0] ?? null;
}
