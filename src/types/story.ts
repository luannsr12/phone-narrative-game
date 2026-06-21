/**
 * Authored content model.
 *
 * Everything the writers produce lives as JSON that conforms to these types:
 * characters, evidence, news, endings and the chapter dialogue graphs.
 * The Story Engine (src/services/storyEngine.ts) interprets this model at
 * runtime — no narrative logic is hard-coded in screens.
 */

// ---------------------------------------------------------------------------
// Shared identifiers
// ---------------------------------------------------------------------------

/** A character id, the literal player, or the narration/system voice. */
export type SpeakerId = string; // characterId | 'player' | 'system'

// ---------------------------------------------------------------------------
// Conditions — evaluated against runtime GameState (see utils/conditions.ts)
// ---------------------------------------------------------------------------

export type Condition =
  | { type: 'flag'; flag: string; value?: boolean }
  | { type: 'flagEquals'; flag: string; value: string | number | boolean }
  /** Player picked this gender at line activation ('m' = masculino, 'f' = feminino). */
  | { type: 'gender'; value: 'm' | 'f' }
  | { type: 'trustAtLeast'; character: string; value: number }
  | { type: 'trustBelow'; character: string; value: number }
  | { type: 'hasEvidence'; evidence: string }
  | { type: 'choseOption'; option: string }
  | { type: 'chapterCompleted'; chapter: string }
  /** Player's bank balance is at least this many R$. */
  | { type: 'moneyAtLeast'; amount: number }
  /** Player has transferred at least this many R$ to this character's account. */
  | { type: 'paidAtLeast'; character: string; amount: number }
  /** Player liked (value!==false) / did NOT like (value===false) this Mural post. */
  | { type: 'likedPost'; post: string; value?: boolean }
  /** Player liked / did not like this comment (by its stable comment id). */
  | { type: 'likedComment'; comment: string; value?: boolean }
  /** Player opened / did not open this news article. */
  | { type: 'viewedNews'; news: string; value?: boolean }
  /** Player follows / does not follow this Mural account/profile. */
  | { type: 'followsProfile'; account: string; value?: boolean }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

// ---------------------------------------------------------------------------
// Effects — mutate runtime GameState (see services/storyEngine.ts)
// ---------------------------------------------------------------------------

export type Effect =
  | { type: 'setFlag'; flag: string; value?: boolean | string | number }
  | { type: 'trust'; character: string; delta: number }
  | { type: 'unlockContact'; character: string }
  | { type: 'addEvidence'; evidence: string }
  /** Publishes after notifyDelaySec (default 0) and fires a notification. */
  | { type: 'unlockNews'; news: string; notifyDelaySec?: number }
  /** Makes a social post appear in the Mural feed (with a notification). */
  | { type: 'unlockSocial'; post: string }
  /** Publishes a Mural story (ring on top of the feed, with notification). */
  | { type: 'unlockStory'; story: string }
  /**
   * Offers a Blog "pauta" (draft) to the player: it appears under Rascunhos in
   * the Blog app so the player can compose and publish it. Narrative gate for
   * WHEN the player can publish a given article.
   */
  | { type: 'offerBlog'; blog: string }
  | { type: 'addTimeline'; id: string; title: string; detail?: string }
  /**
   * Credits (positive) or charges (negative) the player's bank account.
   * `reason` becomes the statement line in the bank app; a credit also fires
   * a bank notification ("a character sent you money").
   */
  | { type: 'money'; amount: number; reason?: string }
  | { type: 'setEnding'; ending: string }
  | { type: 'lockEndingScore'; ending: string; delta: number }
  /**
   * Override a contact's presence in the messenger header ("online" / "visto
   * por último…"). Authored state wins over the random heuristic and persists
   * until the next setPresence on the same character — narrative control over
   * who looks reachable.
   */
  | { type: 'setPresence'; character: string; online: boolean }
  /**
   * Posts a comment ON a Mural post AS a given account (character/NPC/'player').
   * No notification of its own (add a `notification` node if you want one).
   * `commentId` makes the comment targetable (e.g. by setCommentLikes/replyTo).
   */
  | { type: 'addComment'; post: string; author: string; text: string; replyTo?: string; commentId?: string; likes?: number }
  /** Sets the displayed like count of a Mural POST (the player's +1 still adds on top). */
  | { type: 'setPostLikes'; post: string; likes: number }
  /** Sets the displayed like count of a Mural COMMENT (by its id). */
  | { type: 'setCommentLikes'; comment: string; likes: number }
  /** Sets the displayed followers / following counts of a Mural account. */
  | { type: 'setFollowStats'; account: string; followers?: number; following?: number };

// ---------------------------------------------------------------------------
// Attachments (media delivered inside chat)
// ---------------------------------------------------------------------------

export interface Attachment {
  /** References an Evidence id so the item also lands in Arquivos do Caso. */
  evidence?: string;
  kind: 'image' | 'audio' | 'video' | 'document' | 'location' | 'link' | 'contact';
  label?: string;
  /** For audio/video, the simulated duration in seconds. */
  durationSec?: number;
  /**
   * Remote media URL — the game ships no assets; everything is linked.
   * For `link`, this is the FICTIONAL address shown in the preview/browser
   * (e.g. "gazetaderavenwood.com.br/…"), not a real site.
   */
  url?: string;
  /**
   * audio/video only: a Media library id (story.media). When set, its url is
   * used for playback instead of `url` — so the same file isn't pasted as a
   * loose link in many nodes. `url` stays as a fallback for legacy content.
   */
  media?: string;
  /** Audio only: text revealed by the "transcrever" button under the player. */
  transcript?: string;
  /** Link only: opens this news article in the in-game browser. */
  news?: string;
  /** Link only (no `news`): authored page content; blank lines split paragraphs. */
  pageBody?: string;
  /** Contact only: the character whose card this is (tap opens their chat). */
  character?: string;
}

// ---------------------------------------------------------------------------
// Story graph nodes
// ---------------------------------------------------------------------------

interface BaseNode {
  id: string;
}

/** A chat bubble. speaker 'system' renders as a centered narration card. */
export interface MessageNode extends BaseNode {
  type: 'message';
  speaker: SpeakerId;
  /** Conversation thread the bubble is filed under (usually a characterId). */
  thread: string;
  text?: string;
  attachment?: Attachment;
  /** Simulated "typing…" delay (ms) shown before the bubble lands. */
  typingMs?: number;
  /**
   * Optional no-reply nudge: if the player still hasn't answered (no choice
   * picked) `afterSec` seconds after this bubble lands, `text` is sent into
   * the same thread by the same speaker — "voce ta ai?". Fires once.
   */
  reminder?: { afterSec: number; text: string };
  effects?: Effect[];
  next?: string;
}

export interface ChoiceOption {
  /** Stable id, recorded in GameState.choicesMade when picked. */
  id: string;
  /** Button label (also becomes the player's sent bubble unless `say` is set). */
  text: string;
  say?: string;
  /** The player chooses to say NOTHING — no bubble is sent to the chat. */
  silent?: boolean;
  /** Option only offered when this evaluates true. */
  condition?: Condition;
  effects?: Effect[];
  next: string;
}

export interface ChoiceNode extends BaseNode {
  type: 'choice';
  thread: string;
  prompt?: string;
  options: ChoiceOption[];
}

/** Side effects only; no visible bubble. */
export interface ActionNode extends BaseNode {
  type: 'action';
  effects: Effect[];
  next?: string;
}

/** Conditional routing. First matching branch wins; else `fallback`. */
export interface BranchNode extends BaseNode {
  type: 'branch';
  branches: { condition: Condition; next: string }[];
  fallback?: string;
}

/**
 * Opens a contact's conversation for the PLAYER to message first: the thread
 * appears in the Messages app (empty) without the character ever having
 * written. What the player actually sends is authored by the nodes that
 * follow (typically a `choice` in that thread, or `message` with speaker
 * 'player'). Self-advancing, like `action`.
 */
export interface UnlockMessageNode extends BaseNode {
  type: 'unlockMessage';
  /** Character whose conversation the player may now start. */
  character: string;
  effects?: Effect[];
  next?: string;
}

/**
 * A character forwards someone's CONTACT CARD into a chat — like sharing a
 * number on a real messenger. Delivery saves the contact in the agenda and
 * frees the player to message them; tapping the card opens that chat.
 */
export interface ShareContactNode extends BaseNode {
  type: 'shareContact';
  speaker: SpeakerId;
  /** Conversation thread the card lands in. */
  thread: string;
  /** The contact being shared. */
  character: string;
  /** Optional caption bubble text above the card ("fala com ela"). */
  text?: string;
  /** Simulated "typing…" delay (ms) shown before the card lands. */
  typingMs?: number;
  effects?: Effect[];
  next?: string;
}

/** Real-time pause: the playhead waits `seconds` (wall clock, survives app restarts) before following `next`. */
export interface DelayNode extends BaseNode {
  type: 'delay';
  seconds: number;
  next?: string;
}

/**
 * Pure presence — shows a character as busy ("digitando…" / "gravando áudio…" /
 * "gravando vídeo…") in a thread for `seconds`, then moves on WITHOUT sending
 * anything. Lets the author make someone *almost* answer, hesitate, or record
 * and give up. Self-advancing; the indicator only shows while the player is in
 * that conversation, like a real messenger.
 */
export interface ActivityNode extends BaseNode {
  type: 'activity';
  /** Conversation thread where the indicator appears. */
  thread: string;
  /** Who appears busy (a characterId — player/system show nothing). */
  speaker: SpeakerId;
  /** typing = digitando…, audio = gravando áudio…, video = gravando vídeo… */
  kind: 'typing' | 'audio' | 'video';
  /** How long the indicator lingers before the flow continues, in seconds. */
  seconds: number;
  next?: string;
}

/** Publish a news article (with notification), standalone in the flow. */
export interface PublishNewsNode extends BaseNode {
  type: 'publishNews';
  news: string;
  /** Seconds before it actually lands (default 0 = next tick). */
  notifyDelaySec?: number;
  next?: string;
}

/** Publish a Mural post, standalone in the flow. */
export interface PublishPostNode extends BaseNode {
  type: 'publishPost';
  post: string;
  next?: string;
}

/** Publish a Mural story (ring on top of the feed), standalone in the flow. */
export interface PublishStoryNode extends BaseNode {
  type: 'publishStory';
  story: string;
  next?: string;
}

/**
 * Offer a Blog "pauta" to the player, standalone in the flow — sugar over the
 * `offerBlog` effect. The draft shows up in the Blog app for the player to
 * compose (pick an angle) and publish.
 */
export interface OfferBlogNode extends BaseNode {
  type: 'offerBlog';
  blog: string;
  next?: string;
}

/**
 * Mural activity, standalone in the flow — sugar over the addComment /
 * setPostLikes / setCommentLikes effects. `action` picks what it does:
 *   - 'comment'      : `author` posts `text` on `post` (optionally a `replyTo`).
 *   - 'postLikes'    : sets `post`'s like count to `likes`.
 *   - 'commentLikes' : sets `comment`'s like count to `likes`.
 * No notification of its own — add a `notification` node if you want one.
 */
export interface SocialActivityNode extends BaseNode {
  type: 'socialActivity';
  action: 'comment' | 'postLikes' | 'commentLikes';
  /** comment / postLikes: the target post. */
  post?: string;
  /** commentLikes: the target comment id. */
  comment?: string;
  /** comment: who posts it (characterId | SocialNpc id | 'player'). */
  author?: string;
  /** comment: the comment text. */
  text?: string;
  /** comment: reply to another comment id (optional). */
  replyTo?: string;
  /** comment: stable id so this comment can be targeted later (optional). */
  commentId?: string;
  /** postLikes / commentLikes (and optional baseline for a new comment). */
  likes?: number;
  next?: string;
}

/**
 * Set a Mural account's followers / following counts, standalone in the flow —
 * sugar over the `setFollowStats` effect.
 */
export interface SocialFollowNode extends BaseNode {
  type: 'socialFollow';
  account: string;
  followers?: number;
  following?: number;
  next?: string;
}

/** Credit (positive) or charge (negative) the player's bank balance, standalone in the flow. */
export interface BankNode extends BaseNode {
  type: 'bank';
  amount: number;
  /** Statement line in the bank app. */
  reason?: string;
  next?: string;
}

/**
 * Fire an in-game heads-up notification, standalone in the flow. Tapping it
 * deep-links by priority: `url` (REAL external link — leaves the game) >
 * `news` (article page in the in-game browser) > `post` (Mural) > the app.
 * `custom` impersonates no in-game app — the author styles it (system
 * messages, "avalie o jogo", fictional services…).
 */
export interface NotificationNode extends BaseNode {
  type: 'notification';
  /** Which app the heads-up impersonates. */
  app: 'messages' | 'news' | 'social' | 'bank' | 'blog' | 'custom';
  /** custom only: the "app" name shown in the banner header. */
  appName?: string;
  /** custom only: Ionicons icon name (default "notifications"). */
  icon?: string;
  /** custom only: background color of the little app icon (hex). */
  iconColor?: string;
  title: string;
  body?: string;
  /** Seconds on screen before auto-dismissing (default ~4s). */
  durationSec?: number;
  news?: string;
  post?: string;
  url?: string;
  next?: string;
}

/** Simulated voice call / voicemail. */
export interface CallNode extends BaseNode {
  type: 'call';
  caller: string;
  direction: 'incoming' | 'outgoing';
  thread?: string;
  /** Captions shown while the call "plays". */
  transcript?: string[];
  /** Shown if the player declines (also stored as a missed-call log). */
  voicemailText?: string;
  onAnswer?: { effects?: Effect[]; next?: string };
  onDecline?: { effects?: Effect[]; next?: string };
}

// ---------------------------------------------------------------------------
// Interactive call (callScene) — a scripted voice call with its OWN sub-flow.
// A "flowchart inside the flowchart": separate from the chapter's node graph.
// ---------------------------------------------------------------------------

interface CallStepBase {
  id: string;
}

/**
 * A spoken line inside a call: plays an MP3 (optional) and shows its caption,
 * then auto-advances when the audio ends (or after `holdSec` when silent). This
 * is the call's equivalent of a chat `message`.
 */
export interface CallAudioStep extends CallStepBase {
  type: 'audio';
  /** Who is speaking (a characterId | 'player' | 'system') — for the label. */
  speaker?: SpeakerId;
  /** Remote MP3 played during the call (the game ships no audio). */
  audioUrl?: string;
  /** Media library id (story.media); its url wins over `audioUrl` when set. */
  media?: string;
  /** Caption shown while it plays (what is being said). */
  text?: string;
  /** With no audio, hold the caption this long, in seconds (default ~4). */
  holdSec?: number;
  effects?: Effect[];
  next?: string;
}

/**
 * In-call reply choices for the PLAYER (like a chat `choice`, but spoken). Each
 * option's `next` points to another step in THIS call's sub-flow.
 *
 * No-reply timeout: if the player doesn't pick within `timeoutSec` seconds, the
 * call follows `timeoutNext` (another step) — or hangs up when it's absent. Lets
 * an unanswered prompt take its own path (the caller gives up, presses, etc.).
 */
export interface CallChoiceStep extends CallStepBase {
  type: 'choice';
  prompt?: string;
  options: ChoiceOption[];
  /** Seconds to wait for a reply before auto-routing (0/absent = wait forever). */
  timeoutSec?: number;
  /** Step to go to if `timeoutSec` elapses with no reply (absent = hang up). */
  timeoutNext?: string;
}

/** Effects only, no UI — mid-call state change. */
export interface CallActionStep extends CallStepBase {
  type: 'action';
  effects: Effect[];
  next?: string;
}

/** Conditional routing inside the call (first match wins, else `fallback`). */
export interface CallBranchStep extends CallStepBase {
  type: 'branch';
  branches: { condition: Condition; next: string }[];
  fallback?: string;
}

/** A silent beat in the call (seconds), then continue. */
export interface CallDelayStep extends CallStepBase {
  type: 'delay';
  seconds: number;
  next?: string;
}

/** Hang up — ends the call; the MAIN line continues at the callScene's `next`. */
export interface CallHangupStep extends CallStepBase {
  type: 'hangup';
  /** Optional final caption shown briefly ("ligação encerrada"). */
  text?: string;
  effects?: Effect[];
}

export type CallStep =
  | CallAudioStep
  | CallChoiceStep
  | CallActionStep
  | CallBranchStep
  | CallDelayStep
  | CallHangupStep;

/**
 * A scripted INTERACTIVE voice call with its own private sub-flow graph — a
 * "flowchart inside the flowchart". Blocks the main playhead like `call`: the
 * call overlay rings (for `ringSeconds`), and on answer it walks `scene`
 * starting at `entry` — playing MP3 lines, offering in-call reply choices,
 * applying effects, branching — until a `hangup` (or a dead end) ends it, after
 * which the MAIN line continues at `next`. Everything (ring time, what decline
 * does, the whole conversation) is authored PER CALL in the editor's sub-canvas.
 *
 * Outer effects fire when the call CONNECTS (the player answers). Declining (or
 * ringing out) runs `onDecline`/`onTimeout`. The existing `call`/`event` nodes
 * are untouched — this is an additional kind.
 */
export interface CallSceneNode extends BaseNode {
  type: 'callScene';
  caller: string;
  direction?: 'incoming' | 'outgoing';
  /** Seconds the phone rings before it auto-misses (0/absent = until acted on). */
  ringSeconds?: number;
  /** Entry step of the sub-flow — the first line AFTER the player answers. */
  entry: string;
  /** The call's private step graph (separate from the chapter's nodes). */
  scene: Record<string, CallStep>;
  /** Applied when the call CONNECTS (the player answers). */
  effects?: Effect[];
  /** Player declines (taps Recusar): optional voicemail + where to continue. */
  onDecline?: { effects?: Effect[]; voicemailText?: string; thread?: string; next?: string };
  /** Ring-out (timeout): defaults to `onDecline`; set to diverge a missed call. */
  onTimeout?: { effects?: Effect[]; voicemailText?: string; thread?: string; next?: string };
  /** Where the MAIN line continues after the call ends (hangup / dead end). */
  next?: string;
}

/**
 * ARMS a player-call event and continues (SELF-ADVANCING — it does NOT block).
 * From here on, whenever the player places an outgoing call from Telefone that
 * matches `contact`/`number` AND satisfies `condition`, the call plays out per
 * `outcome` and the event's `effects` apply. The event stays armed until a
 * `removeEvent` node disarms it (by this node's id) — so it can fire on every
 * matching call; gate with a flag + `condition` for once-only.
 *
 * `event` is the discriminant — more event kinds may be added later.
 *
 * Condition (`contact`/`number`): a call matches when it goes to `contact` (a
 * characterId) or is dialed to `number` (digits). With NEITHER, ANY call the
 * player makes matches. `condition` is an EXTRA standard game Condition (trust,
 * hasEvidence, flag, …) deciding whether THIS event applies — arm several
 * events for the same contact with different conditions to make the outcome
 * depend on game state.
 *
 * outcome (default 'ringing'):
 *   - 'ringing':  keeps ringing, nobody answers (the player hangs up).
 *   - 'dropped':  the call drops / fails ("a ligação caiu").
 *   - 'declined': the other side rejects it.
 *   - 'answered': it connects and plays `audioUrl` while showing the `text`
 *                 transcript, hanging up `hangUpAfterMs` after the audio ends.
 */
export interface EventNode extends BaseNode {
  type: 'event';
  /**
   * Which player action arms this node. Persistent listener: once armed it fires
   * every time the player performs the action, until a `removeEvent` disarms it.
   * Extensible (more kinds may be added).
   */
  event: 'playerCall' | 'likePost' | 'viewNews' | 'followProfile';
  /** playerCall: matches a call to this character. */
  contact?: string;
  /** playerCall: matches a call dialed to this number (digits compared). */
  number?: string;
  /** likePost: matches a like on this Mural post (omit = any post). */
  post?: string;
  /** viewNews: matches opening this news article (omit = any article). */
  news?: string;
  /** followProfile: matches following this Mural account/profile (omit = any). */
  account?: string;
  /** Standard game Condition gating whether this event fires when triggered. */
  condition?: Condition;
  /** playerCall: how the call plays out on screen (default 'ringing'). */
  outcome?: 'ringing' | 'dropped' | 'declined' | 'answered';
  /** playerCall + answered: remote mp3 played during the connected call. */
  audioUrl?: string;
  /** playerCall + answered: Media library id; its url wins over `audioUrl`. */
  media?: string;
  /** playerCall + answered: transcript shown on screen during the call. */
  text?: string;
  /** playerCall + answered: ms to stay connected AFTER the audio ends (default ~1500). */
  hangUpAfterMs?: number;
  /** Applied when the event FIRES (the matching player action happens). */
  effects?: Effect[];
  /**
   * The sequence that runs WHEN the event fires (the matching player action
   * happens). With NO `next` (below), the main line waits at this node and then
   * continues here on fire (full power). With a `next`, this runs as a parallel
   * delivery track when the event fires.
   */
  onEvent?: string;
  /**
   * "Continue now" path: where the MAIN line goes immediately after arming.
   * Leave empty to WAIT here until the event fires (then `onEvent` runs on the
   * main line). Set it to keep the story going while the event listens in the
   * background (then `onEvent` runs in parallel on fire).
   */
  next?: string;
}

/**
 * Disarms an `event` node armed earlier (referenced by its node id), so it no
 * longer fires on the player's calls. Self-advancing.
 */
export interface RemoveEventNode extends BaseNode {
  type: 'removeEvent';
  /** The id of the `event` node to disarm. */
  target: string;
  next?: string;
}

/**
 * Splits the flow into several PARALLEL delivery tracks: every output starts
 * running at the same time (messages from different threads interleave,
 * effects/waits run side by side). Outputs that lead nowhere simply end — that
 * is fine. Parallel tracks are delivery-only (message/action/effect/delay/…);
 * choices, calls and chapter ends belong to the MAIN line, so a parallel track
 * that reaches one just stops there. By convention the FIRST output continues
 * the current (main) line; the rest run beside it.
 */
export interface ForkNode extends BaseNode {
  type: 'fork';
  /** Node ids that all begin running in parallel when this node is reached. */
  outputs: string[];
}

/** Marks the end of a chapter and where the story goes next. */
export interface ChapterEndNode extends BaseNode {
  type: 'chapterEnd';
  /** Explicit next chapter id; defaults to the next chapter by index. */
  next?: string;
  unlocks?: string[];
  /** If set, route to this Ending instead of continuing to a chapter. */
  ending?: string;
  /**
   * Objective gate: the chapter only completes once this condition is true
   * (e.g. holding an evidence, or bank balance ≥ X). While unmet the playhead
   * waits here — the script itself must tell the player what is missing.
   */
  requirement?: Condition;
  /** Designer-facing note about the gate; never shown in-game. */
  requirementNote?: string;
  effects?: Effect[];
}

export type StoryNode =
  | MessageNode
  | ChoiceNode
  | ActionNode
  | BranchNode
  | UnlockMessageNode
  | ShareContactNode
  | DelayNode
  | ActivityNode
  | PublishNewsNode
  | PublishPostNode
  | PublishStoryNode
  | OfferBlogNode
  | SocialActivityNode
  | SocialFollowNode
  | BankNode
  | NotificationNode
  | CallNode
  | CallSceneNode
  | EventNode
  | RemoveEventNode
  | ForkNode
  | ChapterEndNode;

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export interface Chapter {
  id: string;
  index: number;
  title: string;
  /** Player-facing objective shown when the chapter opens. */
  objective: string;
  /** Designer-facing one-line summary. */
  summary: string;
  /** Entry node id — where the chapter begins. */
  entry: string;
  nodes: Record<string, StoryNode>;
}

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

/**
 * A bubble that already exists in a contact's chat when the game starts —
 * everyday history (family, friends) that makes the phone feel lived-in.
 * Timestamps are relative so the transcript always lands in the recent past.
 */
export interface SeedMessage {
  /** true = sent by the player; false/absent = sent by the character. */
  fromPlayer?: boolean;
  text: string;
  /** How many minutes before game start it was sent (default: ~1 day ago, in order). */
  minutesAgo?: number;
}

/**
 * A character's Mural (social network) presence — DELIBERATELY separate from
 * the Contacts/chat identity, so the photo, bio and follower counts on the
 * social app can differ from the messenger. Only characters with a Mural
 * presence need this; absent fields fall back (avatar → chat photo, bio → chat
 * bio, counts → a deterministic fake). Their posts are the `social` entries
 * authored with this character as `author`.
 */
export interface CharacterSocial {
  /** @handle on Mural (default = character id). */
  handle?: string;
  /** Mural bio (separate from the Contacts bio). */
  bio?: string;
  /** Displayed follower count (fallback: a deterministic fake). */
  followers?: number;
  /** Displayed following count (fallback: a deterministic fake). */
  following?: number;
  /** Mural profile photo URL — separate from the chat avatar. */
  avatarUrl?: string;
  /** Media library id (image) for the Mural photo; wins over `avatarUrl`. */
  avatarMedia?: string;
  avatarColor?: string;
  /** Player already follows this character's Mural profile at game start (opt-in; default off). */
  followedByDefault?: boolean;
}

export interface Character {
  id: string;
  name: string;
  fullName: string;
  age?: number;
  role: string;
  /** First chapter the player can encounter them (design reference). */
  introChapter: string;
  initials: string;
  avatarColor: string;
  /** Remote profile-photo URL (Contacts/chat); falls back to initials when absent. */
  avatarUrl?: string;
  /** Media library id (image) for the Contacts/chat photo; wins over `avatarUrl`. */
  avatarMedia?: string;
  /** Spoiler-free public bio shown in the Contacts profile. */
  bio: string;
  /** Author note: voice/typing personality so no two write alike. */
  writingStyle: string;
  /**
   * Phone number shown for this contact while still unknown (before it's saved
   * to the agenda). Authored in the admin; when blank the game falls back to a
   * deterministic fake number (see utils/people.ts → contactPhone).
   */
  phone?: string;
  /** Already saved in the player's agenda at game start (family, friends). */
  startsUnlocked?: boolean;
  /** Pre-existing chat history with this contact at game start (read, no unread). */
  initialChat?: SeedMessage[];
  /**
   * Fictional bank account (e.g. "21407-3"). Player transfers to this number
   * reach this character — gate story beats with the `paidAtLeast` condition.
   * The script must surface the number (a character texts it, a document…).
   */
  bankAccount?: string;
  /** Mural presence (photo/bio/followers/posts), separate from the chat identity. */
  social?: CharacterSocial;
}

export type EvidenceKind =
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'screenshot'
  | 'location'
  | 'report';

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  description: string;
  /** characterId or 'system'. */
  source: string;
  /** "Ligação com o caso". */
  caseRelevance: string;
  thumbnailColor?: string;
  /** Full text for documents/reports; transcript for audio/video. */
  body?: string;
  /** Remote media URL (image to render, audio/video to open). */
  url?: string;
  /** Media library id; its url wins over `url` at render/playback. */
  media?: string;
}

/**
 * A reusable audio/video file the narrative plays — registered once in the
 * Media library and referenced by id from audio messages and calls, so the same
 * link isn't pasted loose across many nodes. Bundled app sounds (ringtone,
 * notification chime) are NOT here — only the linked narrative media.
 */
export interface MediaItem {
  id: string;
  /** Friendly name shown in the picker (e.g. "Áudio da Lia — recado"). */
  name: string;
  kind: 'audio' | 'video' | 'image';
  /** Remote file URL. */
  url: string;
  /** Optional organisational label (e.g. "Lia — fotos"); ignored by the game. */
  category?: string;
}

/**
 * An authored FICTIONAL web page that opens inside the in-game browser — a
 * character can drop its link into a chat (the editor's `{{` menu, kind
 * `page`). Pages that share a `domain` are grouped together in the editor for
 * organisation only; the game just renders title + body (+ optional image).
 */
export interface WebPage {
  id: string;
  /** Fictional domain, e.g. "ravenwoodgazette.com.br" — also the editor grouping key. */
  domain: string;
  /** Path after the domain, e.g. "perfil/lia"; full URL = domain + '/' + path. */
  path?: string;
  /** Page headline/title. */
  title: string;
  /** Page body; blank lines split paragraphs. */
  body?: string;
  /** Optional header image URL. */
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
}

export interface NewsArticle {
  id: string;
  outlet: string;
  headline: string;
  date: string;
  body: string;
  /** Remote header-image URL. */
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  /** Published from the start of the game (general/filler news — no unlock effect). */
  initial?: boolean;
}

/** A comment on a Mural post (authored). */
export interface PostComment {
  /** Stable id — required to be liked or to be the target of a reply. */
  id?: string;
  /** Author id: a characterId, a SocialNpc id, or 'player'. */
  author: string;
  text: string;
  /** Baseline like count (the player's own like adds +1). */
  likes?: number;
  /** When set, this comment is a reply to another comment (its id). */
  replyTo?: string;
}

/**
 * A pre-written comment the PLAYER may post on a SocialPost. Only posts that
 * define `commentOptions` are commentable ("nem todos os posts"); each option
 * is a narrative choice — picking one files the player's comment and applies
 * its effects. The player comments at most once per post (or per replied-to
 * comment).
 */
export interface PostCommentOption {
  /** Stable id, recorded in GameState.choicesMade when picked. */
  id: string;
  /** Button label (also the comment text unless `say` is set). */
  text: string;
  say?: string;
  /**
   * When set, this option is a REPLY to that comment id — it is offered under
   * that specific comment in the drawer instead of in the main composer.
   */
  replyTo?: string;
  /** Option only offered when this evaluates true. */
  condition?: Condition;
  effects?: Effect[];
}

/** A post on Mural, the in-game social network (Instagram-inspired). */
export interface SocialPost {
  id: string;
  /** Author id: a characterId, a SocialNpc id, or 'player' (the journalist). */
  author: string;
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  caption: string;
  /** Baseline like count (the player's own like adds +1 on top). */
  likes: number;
  /** Display label, e.g. "há 2 dias". */
  date: string;
  comments: PostComment[];
  /** Pre-defined comments the player may post here (absent = not commentable). */
  commentOptions?: PostCommentOption[];
  /** Visible from the start of the game (no unlock effect needed). */
  initial?: boolean;
}

/**
 * The PLAYER's own Mural identity (author id 'player'). The player is an
 * investigative journalist with a pre-existing online life. `name` falls back
 * to GameState.playerName when omitted.
 */
export interface PlayerProfile {
  /** @handle on Mural (default 'voce'). */
  handle?: string;
  /** Display name override; defaults to the player's chosen name. */
  name?: string;
  /** Bio shown on the player's Mural profile — establishes "jornalista investigativo". */
  bio: string;
  avatarColor?: string;
  avatarUrl?: string;
  /** Media library id (image) for the player's Mural photo; wins over `avatarUrl`. */
  avatarMedia?: string;
  /** Displayed follower / following counts (fallback: a deterministic fake). */
  followers?: number;
  following?: number;
}

/**
 * One angle/option the player can pick when composing a Blog article. The
 * chosen option's `body` becomes the published text and its `effects` fire
 * (e.g. ethical vs. sensational journalism scoring an ending).
 */
export interface BlogContentOption {
  /** Stable id, recorded in GameState.choicesMade when published. */
  id: string;
  /** Label shown in the compose chooser. */
  label: string;
  /** Published article body; blank lines split paragraphs. */
  body: string;
  condition?: Condition;
  effects?: Effect[];
}

/**
 * A Blog article the player can publish. Offered to the player via `offerBlog`
 * (then it shows under Rascunhos). The player picks one `options` angle to
 * publish; afterwards it can be shared to a Mural story (`muralStory`).
 */
export interface BlogPost {
  id: string;
  title: string;
  /** Narrative-defined content the player chooses from when composing. */
  options: BlogContentOption[];
  /**
   * Thumbnail/header image of the matéria — used in the Blog app AND when the
   * published post surfaces in the Notícias app. Either a direct link
   * (`imageUrl`) or an Evidence whose media is reused (`imageEvidence`);
   * `imageUrl` wins when both are set.
   */
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`/`imageEvidence`. */
  imageMedia?: string;
  /** Evidence id whose media (url) is reused as the matéria's image. */
  imageEvidence?: string;
  /** Mural story slide (a socialStories id, author 'player') to share after publishing. */
  muralStory?: string;
  /** Byline/date label shown on the article. */
  date?: string;
}

/**
 * A filler account on Mural with no story relevance — background life for the
 * network. NPCs are followed by the player from the start; case characters
 * must be searched and followed manually.
 */
export interface SocialNpc {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  bio: string;
  /** Player already follows this NPC at game start (default: true). */
  followedByDefault?: boolean;
}

/** One slide of a Mural story (Instagram-style ephemeral content). */
export interface SocialStoryItem {
  id: string;
  /** characterId of the author. */
  author: string;
  /** Fullscreen background image; without it, a gradient + text card. */
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  /** Overlay text. */
  text?: string;
  /** Seconds on screen before auto-advancing (default 5). */
  durationSec?: number;
  /** Display label, e.g. "há 3 h". */
  date: string;
  /** Visible from the start of the game (no unlock effect needed). */
  initial?: boolean;
}

/**
 * A paid advertisement — background ambience, NOT story content. Ads are always
 * "on" (no flow node unlocks them): they surface passively in the Mural feed
 * (Instagram-style sponsored post) and as banners inside the in-game browser,
 * the way real apps show ads. Fully authored/edited in the admin editor.
 */
export interface Ad {
  id: string;
  /** Sponsor/brand name (shown as the account name + @handle and on banners). */
  brand: string;
  /** Brand logo used as the avatar. */
  avatarUrl?: string;
  /** Creative image; without it a gradient placeholder is shown. */
  imageUrl?: string;
  /** Ad copy / caption. */
  caption: string;
  /** Call-to-action button label (default "Saiba mais"). */
  cta?: string;
  /** Fictional landing address shown/opened on tap, e.g. "tulubank.com.br". */
  url?: string;
  /** Where it may appear (default 'both'). */
  placement?: 'social' | 'browser' | 'both';
  /** Set false to pause the ad without deleting it (default: active). */
  active?: boolean;
}

export interface Ending {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  /** Optional availability gate. */
  condition?: Condition;
  /** Ordered paragraphs of the finale sequence. */
  scenes: string[];
}

// ---------------------------------------------------------------------------
// The assembled story bundle the engine loads.
// ---------------------------------------------------------------------------

export interface Story {
  meta: {
    title: string;
    version: string;
    startChapter: string;
    /** Player's opening bank balance in R$ (default 0). */
    startingMoney?: number;
    /** Wrong matches allowed per "Pares" round before the bet is lost (default 8). */
    minigameAttempts?: number;
    /**
     * Remote URL of the ringback tone ("truu… truu…") played while an
     * outgoing call from the Telefone app is "chamando…". The game ships no
     * audio — when blank, the call rings silently (vibration cadence only).
     */
    ringbackUrl?: string;
    /**
     * Name of the player's news blog/outlet — shown in the Blog app header and
     * used as the outlet when a published matéria appears in the Notícias app.
     */
    blogName?: string;
  };
  characters: Record<string, Character>;
  evidence: Record<string, Evidence>;
  /** Reusable audio/video files referenced by audio messages and calls. */
  media: Record<string, MediaItem>;
  news: Record<string, NewsArticle>;
  /** Authored fictional web pages openable in the in-game browser (chat links). */
  pages?: Record<string, WebPage>;
  social: Record<string, SocialPost>;
  socialStories: Record<string, SocialStoryItem>;
  socialNpcs: Record<string, SocialNpc>;
  /** Articles the player publishes from the Blog app (offered via `offerBlog`). */
  blog: Record<string, BlogPost>;
  /** The player's own Mural profile (the journalist). */
  playerProfile?: PlayerProfile;
  /** Paid ads (Mural feed + browser banners) — ambience, not story content. */
  ads: Record<string, Ad>;
  endings: Record<string, Ending>;
  chapters: Record<string, Chapter>;
  /** Chapter ids in play order. */
  chapterOrder: string[];
}
