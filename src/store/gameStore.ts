/**
 * Global game store (Zustand).
 *
 * The single source of truth for runtime progress. It wraps the pure Story
 * Engine and persists after every mutation. Screens read `state` and call
 * actions; they never import the engine directly.
 *
 * Playback is driven globally by usePlaybackDriver (hooks/usePlaybackDriver.ts)
 * so that messages are delivered into their threads — bumping unread counts —
 * even while the player is looking at another screen. That is what makes a new
 * contact "message you" out of the blue.
 */
import { create } from 'zustand';
import type { CallRecord, ForkHead, GameState, Gender } from '@/types/game';
import type {
  Ad,
  BlogContentOption,
  BlogPost,
  CallSceneNode,
  CallStep,
  ChoiceOption,
  EventNode,
  NewsArticle,
  StoryNode,
} from '@/types/story';
import { story } from '@/story';
import { blogImageUrl, blogOutletName } from '@/utils/blog';
import {
  initialState,
  advance,
  advanceFork,
  applyEffects,
  choose as engineChoose,
  resolveCall as engineResolveCall,
  answerCallScene as engineAnswerCallScene,
  declineCallScene as engineDeclineCallScene,
  chooseCallStep as engineChooseCallStep,
  completeCallStep as engineCompleteCallStep,
  timeoutCallStep as engineTimeoutCallStep,
  hangUpCallScene as engineHangUpCallScene,
  callScene as engineCallScene,
  callCurrentStep as engineCallCurrentStep,
  callSceneOptions as engineCallSceneOptions,
  fireCallEvent as engineFireCallEvent,
  findArmedCallEvent as engineFindArmedCallEvent,
  fireEvent as engineFireEvent,
  closeChapter as engineCloseChapter,
  startNextChapter,
  resolveEnding,
  currentNode as engineCurrentNode,
  getNode,
  availableOptions as engineAvailableOptions,
  chapterGateBlocked,
  armDelay,
  completeDelay,
  armForkDelay,
  completeForkDelay,
  fireReminder,
} from '@/services/storyEngine';
import { evalCondition } from '@/utils/conditions';
import { loadSave, persistSave, clearSave } from '@/services/persistence';
import { displayName } from '@/utils/people';
import { interpolate } from '@/utils/template';
import { money, uid } from '@/utils/format';

/** Transient heads-up notification (not persisted). */
export interface AppNotice {
  id: string;
  /** 'custom' = authored banner that impersonates no in-game app. */
  app: 'messages' | 'news' | 'social' | 'bank' | 'blog' | 'custom';
  /** custom only: "app" name, Ionicons icon and icon background color. */
  appName?: string;
  icon?: string;
  iconColor?: string;
  title: string;
  body: string;
  /** Time on screen before auto-dismissing (default in the banner). */
  durationMs?: number;
  /** For messages: deep link + suppression when that chat is open. */
  threadId?: string;
  /** Authored `notification` nodes: tap opens this article in the browser… */
  newsId?: string;
  /** …or the Mural feed… */
  postId?: string;
  /** …or a REAL external link (leaves the game). */
  url?: string;
  at: number;
}

interface GameStore {
  hydrated: boolean;
  state: GameState | null;
  lastNotice: AppNotice | null;

  hydrate: () => Promise<void>;
  startGame: (name: string, gender: Gender) => void;
  advanceOnce: () => void;
  /** Advance one parallel fork track (spawned by a `fork` node) by a step. */
  advanceForkOnce: (forkId: string) => void;
  /** Arm a fresh `delay` node, or release it once its wall-clock time passed. */
  tickDelay: () => void;
  /** Arm/release a `delay` inside a specific parallel fork track. */
  tickForkDelay: (forkId: string) => void;
  choose: (optionId: string) => void;
  answerCall: (answered: boolean) => void;
  /** Player answered an interactive `callScene` — connect and enter its sub-flow. */
  answerCallScene: () => void;
  /** Player declined a `callScene` (Recusar), or it rang out (`timedOut`). */
  declineCallScene: (timedOut: boolean) => void;
  /** Player picked an in-call reply chip in a `callScene`. */
  chooseCallStep: (optionId: string) => void;
  /** The current in-call audio/silence step finished — advance the sub-flow. */
  completeCallStep: () => void;
  /** An in-call `choice` got no reply within its timeout — auto-route it. */
  timeoutCallStep: () => void;
  /** Player hung up mid-call (Encerrar) — end the call and resume the main line. */
  hangUpCallScene: () => void;
  /**
   * An outgoing (fake) call from Telefone just ended: log it to the call
   * records and fire any matching `call` trigger's follow-up sequence. The
   * Telefone UI drives the call itself (ringing / answered audio); this only
   * records the outcome and advances the story.
   */
  endCall: (payload: {
    contact: string | null;
    number: string;
    status: CallRecord['status'];
    durationSec?: number;
  }) => void;
  closeCurrentChapter: () => void;
  goToNextChapter: () => void;
  playResolvedEnding: () => void;
  markThreadRead: (threadId: string) => void;
  processDueNews: () => void;
  /** Fire the armed no-reply nudge ("voce ta ai?") once its time comes. */
  processReminder: () => void;
  markStorySeen: (itemId: string) => void;
  toggleLike: (postId: string) => void;
  toggleFollow: (accountId: string) => void;
  /** Register that the player opened a news article (fires `viewNews` events). */
  viewNews: (newsId: string) => void;
  /** Post a pre-defined comment (a post's `commentOption`) as the player. */
  commentOnPost: (postId: string, optionId: string) => void;
  /** Like / unlike a comment in the comments drawer. */
  toggleCommentLike: (commentId: string) => void;
  /** Mark every Mural notification as read (on opening the bell screen). */
  markSocialNotificationsRead: () => void;
  /** Publish an offered Blog draft, picking one content option (angle). */
  publishBlog: (blogId: string, optionId: string) => void;
  /** Share a published Blog article to a Mural story. */
  shareBlogToMural: (blogId: string) => void;
  /** Direct balance change from UI flows (Pares bets) — no bank notification. */
  bankTransact: (amount: number, label: string) => void;
  /**
   * Player-initiated transfer to a character's account: debits the balance and
   * accumulates in `transfers[characterId]` so the story can gate on
   * `paidAtLeast`. The UI validates account/amount before calling.
   */
  bankTransfer: (characterId: string, amount: number, label: string) => void;
  resetGame: () => void;
}

function now(): number {
  return Date.now();
}

let noticeCounter = 0;
function noticeId(): string {
  noticeCounter += 1;
  return `n_${Date.now().toString(36)}_${noticeCounter}`;
}

export const useGameStore = create<GameStore>((set, get) => {
  // Append to the persistent Mural notification log (the bell's screen).
  const logSocial = (s: GameState, title: string, body: string, postId?: string): GameState => ({
    ...s,
    socialNotifications: [
      ...s.socialNotifications,
      { id: noticeId(), title, body, at: now(), postId, read: false },
    ],
  });

  const commit = (nextArg: GameState, opts?: { quietBank?: boolean }) => {
    const prev = get().state;
    let next = nextArg;

    // A story effect just credited the player's account ("a character sent
    // you money") — surface it like a payment-app push. Debits stay silent:
    // the player initiated those via a choice. UI bets pass quietBank.
    if (prev && !opts?.quietBank && next.transactions.length > prev.transactions.length) {
      const tx = next.transactions[next.transactions.length - 1];
      if (tx.amount > 0) {
        set({
          lastNotice: {
            id: noticeId(),
            app: 'bank',
            title: `Você recebeu ${money(tx.amount)}`,
            body: `${tx.label} · saldo ${money(next.money)}`,
            at: now(),
          },
        });
      }
    }

    // A story effect just published a Mural post — surface it as a heads-up
    // (only if the player follows the author) AND log it to the Mural bell.
    if (prev && next.social.length > prev.social.length) {
      const postId = next.social[next.social.length - 1];
      const post = story.social[postId];
      // The player's own posts never notify.
      if (post && post.author !== 'player' && next.following.includes(post.author)) {
        const author = story.characters[post.author];
        const title = `${author?.name ?? post.author} publicou no Mural`;
        const body = post.caption.slice(0, 90);
        set({ lastNotice: { id: noticeId(), app: 'social', title, body, postId, at: now() } });
        next = logSocial(next, title, body, postId);
      }
    }

    // Same for a freshly published Mural story — including the player's own
    // (shared from the Blog), which shows as "Você adicionou um story".
    if (prev && next.stories.length > prev.stories.length) {
      const storyId = next.stories[next.stories.length - 1];
      const item = story.socialStories[storyId];
      if (item && (item.author === 'player' || next.following.includes(item.author))) {
        const isPlayer = item.author === 'player';
        const author = story.characters[item.author];
        const title = isPlayer
          ? 'Você adicionou um story'
          : `${author?.name ?? item.author} adicionou um story`;
        const body = item.text?.slice(0, 90) ?? 'Toque para ver no Mural.';
        set({ lastNotice: { id: noticeId(), app: 'social', title, body, at: now() } });
        next = logSocial(next, title, body);
      }
    }

    set({ state: next });
    void persistSave(next);
  };

  // Surface an advance result's notice + delivered-message banner (shared by
  // the main playhead and parallel fork tracks), returning the next state to
  // commit. Side-effects only touch `lastNotice`; persistence happens in commit.
  const surfaceAdvance = (res: ReturnType<typeof advance>): GameState => {
    let next = res.state;
    const { deliveredThread, notice } = res;

    // Authored `notification` node — surface it verbatim, and log it to the
    // Mural bell when it impersonates the Mural ("fulano curtiu sua foto").
    if (notice) {
      set({
        lastNotice: {
          id: noticeId(),
          app: notice.app,
          appName: notice.appName,
          icon: notice.icon,
          iconColor: notice.iconColor,
          title: notice.title,
          body: notice.body ?? '',
          durationMs: notice.durationSec ? notice.durationSec * 1000 : undefined,
          newsId: notice.news,
          postId: notice.post,
          url: notice.url,
          at: now(),
        },
      });
      if (notice.app === 'social') {
        next = logSocial(next, notice.title, notice.body ?? '', notice.post);
      }
    }

    // Surface character messages (not player echoes / narration) to the
    // heads-up banner.
    if (deliveredThread) {
      const entries = next.threads[deliveredThread]?.entries ?? [];
      const entry = entries[entries.length - 1];
      if (entry && entry.kind === 'message') {
        set({
          lastNotice: {
            id: noticeId(),
            app: 'messages',
            title: displayName(next, entry.speaker),
            body: entry.text ?? (entry.attachment ? 'Anexo' : ''),
            threadId: deliveredThread,
            at: entry.at,
          },
        });
      }
    }
    return next;
  };

  return {
    hydrated: false,
    state: null,
    lastNotice: null,

    hydrate: async () => {
      const saved = await loadSave();
      set({ state: saved, hydrated: true });
    },

    startGame: (name: string, gender: Gender) => {
      commit(initialState(name, gender, story, now()));
    },

    advanceOnce: () => {
      const { state } = get();
      if (!state) return;
      commit(surfaceAdvance(advance(state, story, now())));
    },

    advanceForkOnce: (forkId: string) => {
      const { state } = get();
      if (!state) return;
      commit(surfaceAdvance(advanceFork(state, story, forkId, now())));
    },

    tickDelay: () => {
      const { state } = get();
      if (!state) return;
      const t = now();
      const armed = armDelay(state, story, t);
      if (armed !== state) {
        commit(armed);
        return;
      }
      const done = completeDelay(state, story, t);
      if (done !== state) commit(done);
    },

    tickForkDelay: (forkId: string) => {
      const { state } = get();
      if (!state) return;
      const t = now();
      const armed = armForkDelay(state, story, forkId, t);
      if (armed !== state) {
        commit(armed);
        return;
      }
      const done = completeForkDelay(state, story, forkId, t);
      if (done !== state) commit(done);
    },

    choose: (optionId: string) => {
      const { state } = get();
      if (!state) return;
      commit(engineChoose(state, story, optionId, now()));
    },

    answerCall: (answered: boolean) => {
      const { state } = get();
      if (!state) return;
      commit(engineResolveCall(state, story, answered, now()));
    },

    answerCallScene: () => {
      const { state } = get();
      if (!state) return;
      commit(engineAnswerCallScene(state, story, now()));
    },

    declineCallScene: (timedOut: boolean) => {
      const { state } = get();
      if (!state) return;
      commit(engineDeclineCallScene(state, story, timedOut, now()));
    },

    chooseCallStep: (optionId: string) => {
      const { state } = get();
      if (!state) return;
      commit(engineChooseCallStep(state, story, optionId, now()));
    },

    completeCallStep: () => {
      const { state } = get();
      if (!state) return;
      commit(engineCompleteCallStep(state, story, now()));
    },

    timeoutCallStep: () => {
      const { state } = get();
      if (!state) return;
      commit(engineTimeoutCallStep(state, story, now()));
    },

    hangUpCallScene: () => {
      const { state } = get();
      if (!state) return;
      commit(engineHangUpCallScene(state, story, now()));
    },

    endCall: ({ contact, number, status, durationSec }) => {
      const { state } = get();
      if (!state) return;
      const record: CallRecord = {
        id: uid('call'),
        target: contact ?? number,
        contact: contact ?? undefined,
        status,
        durationSec,
        at: now(),
      };
      let next: GameState = { ...state, calls: [...state.calls, record] };
      // If an armed `playerCall` event matches this call, it fires (its effects
      // apply); no-op otherwise. The event stays armed until a removeEvent node.
      next = engineFireCallEvent(next, story, contact ?? null, number, now());
      commit(next);
    },

    closeCurrentChapter: () => {
      const { state } = get();
      if (!state) return;
      commit(engineCloseChapter(state, story, now()));
    },

    goToNextChapter: () => {
      const { state } = get();
      if (!state) return;
      const next = startNextChapter(state, story);
      // No further chapter authored and no ending set -> route to the
      // soft-scored ending.
      if (next.currentNode === null && !next.endingId && !next.justCompletedChapter) {
        commit({ ...next, endingId: resolveEnding(next, story) });
        return;
      }
      commit(next);
    },

    playResolvedEnding: () => {
      const { state } = get();
      if (!state) return;
      commit({ ...state, endingId: resolveEnding(state, story), justCompletedChapter: null });
    },

    markThreadRead: (threadId: string) => {
      const { state } = get();
      if (!state) return;
      const thread = state.threads[threadId];
      if (!thread || thread.unread === 0) return;
      commit({
        ...state,
        threads: { ...state.threads, [threadId]: { ...thread, unread: 0 } },
      });
    },

    /** Publish every scheduled news item whose time has come (+ notify). */
    processDueNews: () => {
      const { state } = get();
      if (!state || !state.scheduledNews.length) return;
      const t = now();
      const due = state.scheduledNews.filter((n) => n.at <= t);
      if (!due.length) return;

      const rest = state.scheduledNews.filter((n) => n.at > t);
      let news = state.news;
      for (const d of due) {
        if (!news.includes(d.news)) news = [...news, d.news];
      }

      const latest = story.news[due[due.length - 1].news];
      if (latest) {
        set({
          lastNotice: {
            id: noticeId(),
            app: 'news',
            title: latest.outlet,
            body: latest.headline,
            at: t,
          },
        });
      }
      commit({ ...state, news, scheduledNews: rest });
    },

    processReminder: () => {
      const { state } = get();
      if (!state?.pendingReminder) return;
      const thread = state.pendingReminder.thread;
      const next = fireReminder(state, now());
      if (next === state) return;

      // Surface it exactly like a normal incoming message.
      const entries = next.threads[thread]?.entries ?? [];
      const entry = entries[entries.length - 1];
      if (entry && entry.kind === 'message') {
        set({
          lastNotice: {
            id: noticeId(),
            app: 'messages',
            title: displayName(next, entry.speaker),
            body: entry.text ?? '',
            threadId: thread,
            at: entry.at,
          },
        });
      }
      commit(next);
    },

    markStorySeen: (itemId: string) => {
      const { state } = get();
      if (!state || state.seenStories.includes(itemId)) return;
      commit({ ...state, seenStories: [...state.seenStories, itemId] });
    },

    toggleLike: (postId: string) => {
      const { state } = get();
      if (!state) return;
      const liked = state.likedPosts.includes(postId);
      let next: GameState = {
        ...state,
        likedPosts: liked
          ? state.likedPosts.filter((p) => p !== postId)
          : [...state.likedPosts, postId],
      };
      // Liking (not un-liking) fires any armed `likePost` event.
      if (!liked) next = engineFireEvent(next, story, { event: 'likePost', post: postId }, now());
      commit(next);
    },

    toggleFollow: (accountId: string) => {
      const { state } = get();
      if (!state) return;
      const followed = state.following.includes(accountId);
      let next: GameState = {
        ...state,
        following: followed
          ? state.following.filter((a) => a !== accountId)
          : [...state.following, accountId],
      };
      // Following (not un-following) fires any armed `followProfile` event.
      if (!followed)
        next = engineFireEvent(next, story, { event: 'followProfile', account: accountId }, now());
      commit(next);
    },

    viewNews: (newsId: string) => {
      const { state } = get();
      if (!state) return;
      // Record the view (for the `viewedNews` condition) and fire any armed
      // `viewNews` event. Only persist when something actually changed.
      let next = state;
      if (!(state.viewedNews ?? []).includes(newsId)) {
        next = { ...next, viewedNews: [...(next.viewedNews ?? []), newsId] };
      }
      next = engineFireEvent(next, story, { event: 'viewNews', news: newsId }, now());
      if (next !== state) commit(next);
    },

    commentOnPost: (postId: string, optionId: string) => {
      const { state } = get();
      if (!state) return;
      // Each comment option can be used once (a top-level comment or a reply).
      if (state.choicesMade.includes(optionId)) return;
      const post = story.social[postId];
      const option = post?.commentOptions?.find((o) => o.id === optionId);
      if (!option || !evalCondition(state, option.condition)) return;

      const text = interpolate(option.say ?? option.text, {
        playerName: state.playerName,
        gender: state.playerGender,
      });
      const comment = { id: uid('cm'), author: 'player', text, replyTo: option.replyTo };
      let next: GameState = {
        ...state,
        postComments: {
          ...state.postComments,
          [postId]: [...(state.postComments[postId] ?? []), comment],
        },
        choicesMade: [...state.choicesMade, option.id],
      };
      next = applyEffects(next, option.effects, story, now());
      commit(next);
    },

    toggleCommentLike: (commentId: string) => {
      const { state } = get();
      if (!state) return;
      const liked = state.likedComments.includes(commentId);
      commit({
        ...state,
        likedComments: liked
          ? state.likedComments.filter((c) => c !== commentId)
          : [...state.likedComments, commentId],
      });
    },

    markSocialNotificationsRead: () => {
      const { state } = get();
      if (!state) return;
      if (!state.socialNotifications.some((n) => !n.read)) return;
      commit({
        ...state,
        socialNotifications: state.socialNotifications.map((n) => (n.read ? n : { ...n, read: true })),
      });
    },

    publishBlog: (blogId: string, optionId: string) => {
      const { state } = get();
      if (!state) return;
      if (!state.blogDrafts.includes(blogId)) return;
      if (state.blog.some((b) => b.id === blogId)) return;
      const draft = story.blog[blogId];
      const option = draft?.options.find((o) => o.id === optionId);
      if (!option || !evalCondition(state, option.condition)) return;

      let next: GameState = {
        ...state,
        blogDrafts: state.blogDrafts.filter((id) => id !== blogId),
        blog: [...state.blog, { id: blogId, optionId, at: now() }],
        choicesMade: [...state.choicesMade, option.id],
      };
      next = applyEffects(next, option.effects, story, now());
      set({
        lastNotice: {
          id: noticeId(),
          app: 'blog',
          title: 'Matéria publicada',
          body: draft.title,
          at: now(),
        },
      });
      commit(next);
    },

    shareBlogToMural: (blogId: string) => {
      const { state } = get();
      if (!state) return;
      if (!state.blog.some((b) => b.id === blogId)) return;
      if (state.blogShared.includes(blogId)) return;
      const draft = story.blog[blogId];
      if (!draft?.muralStory) return;

      let next: GameState = { ...state, blogShared: [...state.blogShared, blogId] };
      // Reuse the Mural story machinery: the slide (author 'player') lights up
      // the "Seu story" ring on the feed. commit() surfaces & logs the
      // "Você adicionou um story" notice (story count grew for author 'player').
      next = applyEffects(next, [{ type: 'unlockStory', story: draft.muralStory }], story, now());
      commit(next);
    },

    bankTransact: (amount: number, label: string) => {
      const { state } = get();
      const rounded = Math.round(amount * 100) / 100;
      if (!state || !rounded) return;
      commit(
        {
          ...state,
          money: Math.max(0, Math.round((state.money + rounded) * 100) / 100),
          transactions: [
            ...state.transactions,
            { id: uid('tx'), amount: rounded, label, at: now() },
          ],
        },
        { quietBank: true },
      );
    },

    bankTransfer: (characterId: string, amount: number, label: string) => {
      const { state } = get();
      const value = Math.round(amount * 100) / 100;
      if (!state || value <= 0 || value > state.money) return;
      commit(
        {
          ...state,
          money: Math.round((state.money - value) * 100) / 100,
          transactions: [
            ...state.transactions,
            { id: uid('tx'), amount: -value, label, at: now() },
          ],
          transfers: {
            ...state.transfers,
            [characterId]: Math.round(((state.transfers[characterId] ?? 0) + value) * 100) / 100,
          },
        },
        { quietBank: true },
      );
    },

    resetGame: () => {
      void clearSave();
      set({ state: null, lastNotice: null });
    },
  };
});

// --- Selector helpers -------------------------------------------------------

export function selectCurrentNode(state: GameState | null) {
  if (!state) return undefined;
  return engineCurrentNode(state, story);
}

/** Active parallel delivery tracks (spawned by `fork` nodes); drives the fork clock. */
export function selectForks(state: GameState | null): ForkHead[] {
  return state?.forks ?? [];
}

/** The authored node a parallel fork track is currently parked on. */
export function selectForkNode(state: GameState | null, fork: ForkHead): StoryNode | undefined {
  if (!state) return undefined;
  return getNode(story, state.currentChapter, fork.node);
}

/**
 * The node that should drive THIS thread's "digitando…/gravando…" indicator —
 * scanning the main playhead AND every parallel fork, since any track may be
 * delivering here. Returns the node only while it's in its visible typing phase
 * (its id present in `typingIds`).
 */
export function selectThreadIndicator(
  state: GameState | null,
  threadId: string,
  typingIds: string[],
): StoryNode | undefined {
  if (!state) return undefined;
  const indicatorAt = (nodeId: string | null): StoryNode | undefined => {
    const node = getNode(story, state.currentChapter, nodeId);
    if (
      node &&
      (node.type === 'message' || node.type === 'shareContact' || node.type === 'activity') &&
      node.thread === threadId &&
      node.speaker !== 'player' &&
      node.speaker !== 'system' &&
      typingIds.includes(node.id)
    ) {
      return node;
    }
    return undefined;
  };
  const primary = indicatorAt(state.currentNode);
  if (primary) return primary;
  for (const f of state.forks) {
    const n = indicatorAt(f.node);
    if (n) return n;
  }
  return undefined;
}

export function selectAvailableOptions(state: GameState | null) {
  if (!state) return [];
  return engineAvailableOptions(state, story);
}

/**
 * The armed `playerCall` event an outgoing dial to `contactId`/`number` would
 * fire, if any — drives the Telefone call UI (which outcome to play). Undefined
 * when no armed event matches this call.
 */
export function selectActiveCallEvent(
  state: GameState | null,
  contactId: string | null,
  number: string,
): EventNode | undefined {
  if (!state) return undefined;
  return engineFindArmedCallEvent(state, story, contactId, number);
}

/**
 * The interactive `callScene` node currently on screen (ringing OR connected),
 * if any — drives the CallSceneOverlay. Ringing when this is set but
 * `state.activeCall` is null; connected once the player answers.
 */
export function selectCallScene(state: GameState | null): CallSceneNode | undefined {
  if (!state) return undefined;
  return engineCallScene(state, story);
}

/** The sub-flow step the connected call is parked on (undefined while ringing). */
export function selectCallStep(state: GameState | null): CallStep | undefined {
  if (!state) return undefined;
  return engineCallCurrentStep(state, story);
}

/** Options offered by the in-call `choice` step the call is parked on. */
export function selectCallStepOptions(state: GameState | null): ChoiceOption[] {
  if (!state) return [];
  return engineCallSceneOptions(state, story);
}

/** Outgoing call records, newest first (the Telefone "Recentes" tab). */
export function selectCallRecords(state: GameState | null): CallRecord[] {
  if (!state) return [];
  return [...state.calls].reverse();
}

export function selectTotalUnread(state: GameState | null): number {
  if (!state) return 0;
  return Object.values(state.threads).reduce((sum, t) => sum + t.unread, 0);
}

/** Thread currently waiting on a player reply, if any (for list hints). */
export function selectPendingChoiceThread(state: GameState | null): string | null {
  const node = selectCurrentNode(state);
  return node?.type === 'choice' ? node.thread : null;
}

/** True while the chapter's objective gate keeps the chapterEnd from closing. */
export function selectChapterGateBlocked(state: GameState | null): boolean {
  if (!state) return false;
  return chapterGateBlocked(state, story);
}

/**
 * The player's PUBLISHED Blog matérias, rendered as news articles (their own
 * outlet) so they surface in the Notícias app and the browser — with the
 * matéria's thumbnail. Newest first. The synthetic id is prefixed `blog_` so it
 * never collides with an authored news id (see selectNewsArticle).
 */
export function selectBlogNews(state: GameState | null): NewsArticle[] {
  if (!state) return [];
  return selectPublishedBlog(state).map(({ post, option }) => ({
    id: `blog_${post.id}`,
    outlet: blogOutletName(),
    headline: post.title,
    date: post.date ?? 'agora',
    body: option.body,
    imageUrl: blogImageUrl(post),
  }));
}

/**
 * Articles visible in the news app/browser: the player's own published Blog
 * matérias first (their latest journalism), then story-unlocked news (latest on
 * top), then the initial general-interest filler that exists since game start.
 */
export function selectPublishedNews(state: GameState | null): NewsArticle[] {
  if (!state) return [];
  const unlocked = state.news
    .map((id) => story.news[id])
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .reverse();
  const initial = Object.values(story.news).filter(
    (n) => n.initial && !state.news.includes(n.id),
  );
  return [...selectBlogNews(state), ...unlocked, ...initial];
}

/** Resolve a news article by id from authored news OR the player's Blog matérias. */
export function selectNewsArticle(
  state: GameState | null,
  id: string | undefined,
): NewsArticle | undefined {
  if (!id) return undefined;
  if (story.news[id]) return story.news[id];
  return selectBlogNews(state).find((n) => n.id === id);
}

/**
 * Posts that exist on the network, MOST RECENT FIRST: story-unlocked posts in
 * reverse unlock order (the newest publication tops the feed), then the
 * initial pre-game posts as the older tail.
 */
export function selectPublishedPosts(state: GameState | null) {
  if (!state) return [];
  const unlocked = [...state.social]
    .reverse()
    .flatMap((id) => (story.social[id] ? [story.social[id]] : []));
  const initial = Object.values(story.social).filter(
    (p) => p.initial && !state.social.includes(p.id),
  );
  return [...unlocked, ...initial];
}

/** The player's feed: published posts from accounts they follow. */
export function selectVisiblePosts(state: GameState | null) {
  if (!state) return [];
  return selectPublishedPosts(state).filter((p) => state.following.includes(p.author));
}

/** Published posts of one account (for its profile grid). */
export function selectProfilePosts(state: GameState | null, account: string) {
  if (!state) return [];
  return selectPublishedPosts(state).filter((p) => p.author === account);
}

/**
 * Accounts that "exist" on Mural: every NPC, plus any character with at least
 * one published post or story — so searching never reveals someone the story
 * hasn't surfaced yet.
 */
export function selectSearchableAccounts(state: GameState | null): string[] {
  if (!state) return [];
  const ids = new Set<string>(Object.keys(story.socialNpcs));
  for (const p of selectPublishedPosts(state)) ids.add(p.author);
  for (const s of Object.values(story.socialStories)) {
    if (s.initial || state.stories.includes(s.id)) ids.add(s.author);
  }
  return [...ids];
}

export interface StoryGroup {
  author: string;
  items: (typeof story.socialStories)[string][];
  /** Every slide already watched → gray ring. */
  seen: boolean;
}

/**
 * Visible Mural stories (followed accounts only), grouped per author. The
 * player's own stories are excluded here — they surface as the "Seu story" ring
 * (see selectPlayerStory).
 */
export function selectStoryGroups(state: GameState | null): StoryGroup[] {
  if (!state) return [];
  const visible = Object.values(story.socialStories).filter(
    (s) =>
      s.author !== 'player' &&
      (s.initial || state.stories.includes(s.id)) &&
      state.following.includes(s.author),
  );
  const byAuthor = new Map<string, StoryGroup>();
  for (const item of visible) {
    const g = byAuthor.get(item.author) ?? { author: item.author, items: [], seen: true };
    g.items.push(item);
    if (!state.seenStories.includes(item.id)) g.seen = false;
    byAuthor.set(item.author, g);
  }
  return [...byAuthor.values()];
}

/**
 * The player's own Mural story (author 'player'), if any slide is unlocked —
 * shared from the Blog app. Drives the "Seu story" ring and StoryViewer for
 * the player. Not gated by `following` (you don't follow yourself).
 */
export function selectPlayerStory(state: GameState | null): StoryGroup | null {
  if (!state) return null;
  const items = Object.values(story.socialStories).filter(
    (s) => s.author === 'player' && (s.initial || state.stories.includes(s.id)),
  );
  if (!items.length) return null;
  const seen = items.every((it) => state.seenStories.includes(it.id));
  return { author: 'player', items, seen };
}

/** Persistent Mural notifications, newest first (the bell screen reads this). */
export function selectSocialNotifications(state: GameState | null) {
  if (!state) return [];
  return [...state.socialNotifications].reverse();
}

/** Count of unread Mural notifications (for the bell badge). */
export function selectUnreadSocialCount(state: GameState | null): number {
  if (!state) return 0;
  return state.socialNotifications.reduce((n, x) => n + (x.read ? 0 : 1), 0);
}

/** Blog "pautas" offered to the player but not yet published (Rascunhos). */
export function selectBlogDrafts(state: GameState | null): BlogPost[] {
  if (!state) return [];
  return state.blogDrafts
    .map((id) => story.blog[id])
    .filter((b): b is BlogPost => Boolean(b));
}

export interface PublishedBlogEntry {
  post: BlogPost;
  option: BlogContentOption;
  at: number;
  shared: boolean;
}

/** Blog articles the player published, newest first, with the chosen angle. */
export function selectPublishedBlog(state: GameState | null): PublishedBlogEntry[] {
  if (!state) return [];
  return [...state.blog].reverse().flatMap((b) => {
    const post = story.blog[b.id];
    const option = post?.options.find((o) => o.id === b.optionId);
    if (!post || !option) return [];
    return [{ post, option, at: b.at, shared: state.blogShared.includes(b.id) }];
  });
}

/**
 * Active ads for a surface. Ads are ambience, not gated by story progress — an
 * ad shows unless it's switched off (`active: false`). `placement` 'both'
 * (default) appears everywhere; otherwise it must match the surface.
 */
export function selectAds(placement: 'social' | 'browser'): Ad[] {
  return Object.values(story.ads ?? {}).filter((a) => {
    if (a.active === false) return false;
    const p = a.placement ?? 'both';
    return p === 'both' || p === placement;
  });
}
