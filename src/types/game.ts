/**
 * Runtime / save-state model.
 *
 * This is what gets persisted to AsyncStorage. It is deliberately a plain
 * serialisable object — the Story Engine reads the authored Story (content)
 * and mutates a GameState (progress).
 */

import type { Attachment } from './story';

/** A delivered chat bubble in a thread transcript. */
export interface ChatEntry {
  id: string;
  nodeId: string;
  thread: string;
  /** characterId | 'player' | 'system'. */
  speaker: string;
  text?: string;
  attachment?: Attachment;
  /** 'call-log' marks a missed/finished call summary line. */
  kind: 'message' | 'player' | 'system' | 'call-log';
  at: number;
}

export interface ThreadState {
  entries: ChatEntry[];
  unread: number;
  lastActivity: number;
}

export interface EvidenceInstance {
  id: string;
  receivedAt: number;
  from: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  detail?: string;
  at: number;
}

/** A logged OUTGOING call the player placed from the Telefone dialer. */
export interface CallRecord {
  id: string;
  /** Who was dialed: a characterId when saved, else the raw typed number. */
  target: string;
  /** Set when the dialed number resolved to a saved contact. */
  contact?: string;
  /** How it ended: rang out, was rejected, was answered, or just placed. */
  status: 'made' | 'declined' | 'missed' | 'answered';
  /** answered only: connected duration in seconds. */
  durationSec?: number;
  at: number;
}

/** One line of the bank-app statement (positive = credit, negative = debit). */
export interface BankTransaction {
  id: string;
  amount: number;
  label: string;
  at: number;
}

/**
 * A comment added to a Mural post at runtime — by the player (via a post's
 * `commentOptions`) OR by a character/NPC (via an `addComment` effect / Mural
 * activity node).
 */
export interface RuntimeComment {
  id: string;
  /** characterId | SocialNpc id | 'player'. */
  author: string;
  text: string;
  /** Reply target (another comment id), when posted as a reply. */
  replyTo?: string;
  /** Baseline like count for this comment (the player's like adds +1). */
  likes?: number;
}

/** One entry in the persistent Mural notification log. */
export interface SocialNotice {
  id: string;
  title: string;
  body: string;
  at: number;
  /** Tapping it opens this post, when set. */
  postId?: string;
  read: boolean;
}

/**
 * A parallel DELIVERY track spawned by a `fork` node. Lives within the current
 * chapter (forks are cleared at chapter boundaries) and advances on its own,
 * beside the main playhead.
 */
export interface ForkHead {
  id: string;
  /** This track's current node (null = finished; pruned on the next tick). */
  node: string | null;
  /** Wall-clock when this track's pending `delay` elapses (null = none armed). */
  delayUntil: number | null;
}

/** Flags may hold booleans or small scalars set by the story. */
export type FlagValue = boolean | string | number;

/** The gender the player picks at line activation. Immutable for the run. */
export type Gender = 'm' | 'f';

export interface GameState {
  /** Schema version for migrations. */
  version: number;
  playerName: string;
  /** Player-chosen gender (masculino/feminino) — drives the `gender` condition. */
  playerGender: Gender;
  started: boolean;

  currentChapter: string;
  /** null = playhead idle (awaiting navigation, chapter break, or ending). */
  currentNode: string | null;
  /** Extra parallel delivery tracks spawned by `fork` nodes (same chapter). */
  forks: ForkHead[];

  flags: Record<string, FlagValue>;
  /** characterId -> 0..100. */
  trust: Record<string, number>;

  unlockedContacts: string[];
  /** Characters whose conversation the player may start (unlockMessage nodes). */
  messageUnlocks: string[];
  threads: Record<string, ThreadState>;
  evidence: EvidenceInstance[];
  news: string[];
  /** News scheduled to publish (and notify) at a future timestamp. */
  scheduledNews: { news: string; at: number }[];
  /** News articles the player has opened (for the `viewedNews` condition). */
  viewedNews: string[];
  /** Social posts unlocked by the story (besides `initial` ones). */
  social: string[];
  /** Mural stories unlocked by the story (besides `initial` ones). */
  stories: string[];
  /** Story slides the player already watched (gray ring when all seen). */
  seenStories: string[];
  /** Posts the player liked in the Mural app. */
  likedPosts: string[];
  /** Comment ids the player liked (authored or runtime, in the comments drawer). */
  likedComments: string[];
  /**
   * Comments added at runtime (by the player via `commentOptions`, or by a
   * character/NPC via an `addComment` effect), keyed by post id. Merged with the
   * post's authored `comments` when rendering.
   */
  postComments: Record<string, RuntimeComment[]>;
  /**
   * Runtime override of a post's displayed like count (set by `setPostLikes`).
   * Wins over the authored `post.likes`; the player's own like still adds +1.
   */
  postLikes: Record<string, number>;
  /** Runtime override of a comment's like count, by comment id (`setCommentLikes`). */
  commentLikes: Record<string, number>;
  /** Runtime override of an account's Mural followers/following (`setFollowStats`). */
  followStats: Record<string, { followers?: number; following?: number }>;
  /** Mural accounts the player follows (feed/stories only show these). */
  following: string[];
  /** Persistent Mural notification log (kept even after read). */
  socialNotifications: SocialNotice[];
  timeline: TimelineEntry[];

  /** Blog "pautas" offered to the player (shown under Rascunhos), not yet published. */
  blogDrafts: string[];
  /** Blog articles the player published, with the chosen content option. */
  blog: { id: string; optionId: string; at: number }[];
  /** Published Blog articles whose Mural story has already been shared. */
  blogShared: string[];

  /** Bank balance in R$ — earned in Pares bets or sent by characters. */
  money: number;
  /** Bank statement, oldest first. */
  transactions: BankTransaction[];
  /** Total R$ the player transferred to each character (by account number). */
  transfers: Record<string, number>;

  /** Outgoing calls placed from the Telefone dialer (newest appended). */
  calls: CallRecord[];
  /**
   * Player-call `event` nodes currently ARMED: each fires when the player makes
   * a matching call, until a `removeEvent` node disarms it. Stored as a
   * reference to the authored node (chapter + node id).
   */
  armedEvents: { chapter: string; node: string }[];

  /**
   * The interactive call (`callScene`) the player is currently CONNECTED to, if
   * any. The inner playhead persists so a call survives an app restart (resume
   * mid-call) instead of replaying its sub-flow and re-applying effects. When
   * null while the main playhead sits on a `callScene`, the call is "ringing"
   * (not yet answered); set means "answered and in the sub-flow".
   */
  activeCall: {
    chapter: string;
    /** The outer `callScene` node id. */
    node: string;
    /** Current step id in that node's sub-flow (null = sub-flow ended). */
    step: string | null;
  } | null;

  /** Chosen ChoiceOption ids, in order. */
  choicesMade: string[];
  completedChapters: string[];

  /** Soft scoring used to resolve which ending the finale routes to. */
  endingScores: Record<string, number>;
  /** A hard ending lock set by the story (overrides scores). */
  forcedEnding: string | null;
  /** Set when an ending sequence is active. */
  endingId: string | null;

  /** Wall-clock timestamp when the pending `delay` node elapses (null = none armed). */
  delayUntil: number | null;

  /** Armed no-reply nudge (message `reminder`); cleared when the player answers. */
  pendingReminder: { thread: string; speaker: string; text: string; at: number } | null;

  /**
   * Authored online/offline override per contact (the `setPresence` effect).
   * When set, it wins over the random presence heuristic in the chat header.
   * `at` is when it was authored, used as the "visto por último" timestamp.
   */
  presence: Record<string, { online: boolean; at: number }>;

  /** Transient UI signal: id of the just-completed chapter (for interstitial). */
  justCompletedChapter: string | null;
}
