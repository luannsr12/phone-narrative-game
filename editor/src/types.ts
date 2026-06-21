/**
 * Mirror of the game's authored content model (src/types/story.ts in the app)
 * plus editor-only metadata. The exported story.json must satisfy the game
 * types exactly; `_editor` carries node positions and is ignored by the game.
 */

export type Condition =
  | { type: 'flag'; flag: string; value?: boolean }
  | { type: 'flagEquals'; flag: string; value: string | number | boolean }
  /** Player picked this gender at activation ('m' = masculino, 'f' = feminino). */
  | { type: 'gender'; value: 'm' | 'f' }
  | { type: 'trustAtLeast'; character: string; value: number }
  | { type: 'trustBelow'; character: string; value: number }
  | { type: 'hasEvidence'; evidence: string }
  | { type: 'choseOption'; option: string }
  | { type: 'chapterCompleted'; chapter: string }
  | { type: 'moneyAtLeast'; amount: number }
  | { type: 'paidAtLeast'; character: string; amount: number }
  | { type: 'likedPost'; post: string; value?: boolean }
  | { type: 'likedComment'; comment: string; value?: boolean }
  | { type: 'viewedNews'; news: string; value?: boolean }
  | { type: 'followsProfile'; account: string; value?: boolean }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

export type Effect =
  | { type: 'setFlag'; flag: string; value?: boolean | string | number }
  | { type: 'trust'; character: string; delta: number }
  | { type: 'unlockContact'; character: string }
  | { type: 'addEvidence'; evidence: string }
  | { type: 'unlockNews'; news: string; notifyDelaySec?: number }
  | { type: 'unlockSocial'; post: string }
  | { type: 'unlockStory'; story: string }
  | { type: 'addTimeline'; id: string; title: string; detail?: string }
  /** Positive = player receives money; negative = player is charged. */
  | { type: 'money'; amount: number; reason?: string }
  | { type: 'setEnding'; ending: string }
  | { type: 'lockEndingScore'; ending: string; delta: number }
  /** Force a contact "online"/"visto por último" in the messenger header. */
  | { type: 'setPresence'; character: string; online: boolean }
  /** Offer a Blog "pauta" (draft) to the player to compose and publish. */
  | { type: 'offerBlog'; blog: string }
  /** Post a comment on a Mural post as a character/NPC/'player' (no notification). */
  | { type: 'addComment'; post: string; author: string; text: string; replyTo?: string; commentId?: string; likes?: number }
  /** Set a Mural post's displayed like count. */
  | { type: 'setPostLikes'; post: string; likes: number }
  /** Set a Mural comment's displayed like count (by comment id). */
  | { type: 'setCommentLikes'; comment: string; likes: number }
  /** Set a Mural account's followers / following counts. */
  | { type: 'setFollowStats'; account: string; followers?: number; following?: number };

export interface Attachment {
  evidence?: string;
  kind: 'image' | 'audio' | 'video' | 'document' | 'location' | 'link' | 'contact';
  label?: string;
  durationSec?: number;
  url?: string;
  /** audio/video: a Media library id (its url wins over `url` at playback). */
  media?: string;
  /** Audio only: text revealed by the "transcrever" button in the game. */
  transcript?: string;
  /** Link only: opens this news article in the in-game browser. */
  news?: string;
  /** Link only (no `news`): authored page content; blank lines split paragraphs. */
  pageBody?: string;
  /** Contact only: the character whose card this is (tap opens their chat). */
  character?: string;
}

export interface MessageNode {
  id: string;
  type: 'message';
  speaker: string;
  thread: string;
  text?: string;
  attachment?: Attachment;
  typingMs?: number;
  /** No-reply nudge: sent into the thread if the player doesn't answer in time. */
  reminder?: { afterSec: number; text: string };
  effects?: Effect[];
  next?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  say?: string;
  /** The player chooses to say NOTHING — no bubble is sent to the chat. */
  silent?: boolean;
  condition?: Condition;
  effects?: Effect[];
  next: string;
}

export interface ChoiceNode {
  id: string;
  type: 'choice';
  thread: string;
  prompt?: string;
  options: ChoiceOption[];
}

export interface ActionNode {
  id: string;
  type: 'action';
  effects: Effect[];
  next?: string;
}

export interface BranchNode {
  id: string;
  type: 'branch';
  branches: { condition: Condition; next: string }[];
  fallback?: string;
}

/** Opens a contact's conversation so the PLAYER can message first. */
export interface UnlockMessageNode {
  id: string;
  type: 'unlockMessage';
  character: string;
  effects?: Effect[];
  next?: string;
}

/**
 * A character sends someone's CONTACT CARD into a chat. Delivery saves the
 * contact in the agenda and frees the player to message them; tapping the
 * card in the game opens that contact's chat.
 */
export interface ShareContactNode {
  id: string;
  type: 'shareContact';
  speaker: string;
  /** Conversation thread the card lands in. */
  thread: string;
  /** The contact being shared. */
  character: string;
  /** Optional caption bubble text above the card. */
  text?: string;
  typingMs?: number;
  effects?: Effect[];
  next?: string;
}

/** Real-time pause: the flow follows `next` after `seconds` of wall clock. */
export interface DelayNode {
  id: string;
  type: 'delay';
  seconds: number;
  next?: string;
}

/**
 * Pure-presence node: shows a character as "digitando…" / "gravando áudio…" /
 * "gravando vídeo…" in a conversation for `seconds`, then continues WITHOUT
 * sending any message. Self-advancing.
 */
export interface ActivityNode {
  id: string;
  type: 'activity';
  /** Conversation where the indicator appears. */
  thread: string;
  /** A characterId (player/system show nothing). */
  speaker: string;
  kind: 'typing' | 'audio' | 'video';
  /** How long the indicator lingers. */
  seconds: number;
  next?: string;
}

/** Publish a news article, standalone in the flow. */
export interface PublishNewsNode {
  id: string;
  type: 'publishNews';
  news: string;
  notifyDelaySec?: number;
  next?: string;
}

/** Publish a Mural post, standalone in the flow. */
export interface PublishPostNode {
  id: string;
  type: 'publishPost';
  post: string;
  next?: string;
}

/** Publish a Mural story, standalone in the flow. */
export interface PublishStoryNode {
  id: string;
  type: 'publishStory';
  story: string;
  next?: string;
}

/**
 * Offer a Blog "pauta" (draft) to the player, standalone in the flow — sugar
 * over the `offerBlog` effect. The draft shows up in the Blog app for the
 * player to compose (pick an angle) and publish.
 */
export interface OfferBlogNode {
  id: string;
  type: 'offerBlog';
  blog: string;
  next?: string;
}

/**
 * Mural activity, standalone in the flow — sugar over addComment / setPostLikes /
 * setCommentLikes. `action` selects what it does.
 */
export interface SocialActivityNode {
  id: string;
  type: 'socialActivity';
  action: 'comment' | 'postLikes' | 'commentLikes';
  post?: string;
  comment?: string;
  author?: string;
  text?: string;
  replyTo?: string;
  commentId?: string;
  likes?: number;
  next?: string;
}

/** Set a Mural account's followers / following counts, standalone in the flow. */
export interface SocialFollowNode {
  id: string;
  type: 'socialFollow';
  account: string;
  followers?: number;
  following?: number;
  next?: string;
}

/** Credit/charge the player's bank balance, standalone in the flow. */
export interface BankNode {
  id: string;
  type: 'bank';
  amount: number;
  reason?: string;
  next?: string;
}

/**
 * In-game heads-up notification. Tap priority: url (external, leaves the
 * game) > news (in-game browser) > post (Mural) > the app itself. `custom`
 * impersonates no in-game app — the author styles name/icon/color.
 */
export interface NotificationNode {
  id: string;
  type: 'notification';
  app: 'messages' | 'news' | 'social' | 'bank' | 'blog' | 'custom';
  /** custom only. */
  appName?: string;
  icon?: string;
  iconColor?: string;
  title: string;
  body?: string;
  /** Seconds on screen (default ~4s). */
  durationSec?: number;
  news?: string;
  post?: string;
  url?: string;
  next?: string;
}

export interface CallNode {
  id: string;
  type: 'call';
  caller: string;
  direction: 'incoming' | 'outgoing';
  thread?: string;
  transcript?: string[];
  voicemailText?: string;
  onAnswer?: { effects?: Effect[]; next?: string };
  onDecline?: { effects?: Effect[]; next?: string };
}

// --- Interactive call (callScene) sub-flow ---------------------------------
// A "flowchart inside the flowchart": the call carries its OWN step graph,
// edited in a nested canvas. Step `next`/branch/option targets reference STEP
// ids inside the call, never chapter node ids.

/** A spoken line in a call: plays an MP3 (optional) + caption, then advances. */
export interface CallAudioStep {
  id: string;
  type: 'audio';
  /** Who speaks (characterId | 'player' | 'system') — for the on-screen label. */
  speaker?: string;
  /** Remote MP3 played during the call. */
  audioUrl?: string;
  /** Media library id; its url wins over `audioUrl`. */
  media?: string;
  /** Caption shown while it plays. */
  text?: string;
  /** With no audio, hold the caption this long (seconds, default ~4). */
  holdSec?: number;
  effects?: Effect[];
  next?: string;
}

/** In-call reply chips for the player (next points to a step in this call). */
export interface CallChoiceStep {
  id: string;
  type: 'choice';
  prompt?: string;
  options: ChoiceOption[];
  /** Seconds to wait for a reply before auto-routing (0/absent = wait forever). */
  timeoutSec?: number;
  /** Step to go to if `timeoutSec` elapses with no reply (absent = hang up). */
  timeoutNext?: string;
}

export interface CallActionStep {
  id: string;
  type: 'action';
  effects: Effect[];
  next?: string;
}

export interface CallBranchStep {
  id: string;
  type: 'branch';
  branches: { condition: Condition; next: string }[];
  fallback?: string;
}

/** A silent beat in the call (seconds), then continue. */
export interface CallDelayStep {
  id: string;
  type: 'delay';
  seconds: number;
  next?: string;
}

/** Hang up — ends the call; the main line continues at the callScene's `next`. */
export interface CallHangupStep {
  id: string;
  type: 'hangup';
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

export type CallStepType = CallStep['type'];

/**
 * A scripted interactive voice call with its OWN private sub-flow graph. Blocks
 * the main line like `call`: it rings (`ringSeconds`), and on answer it walks
 * `scene` from `entry` — MP3 lines, reply choices, effects, branches — until a
 * `hangup` ends it, after which the main line continues at `next`. Everything is
 * authored per call in the editor's nested sub-canvas.
 */
export interface CallSceneNode {
  id: string;
  type: 'callScene';
  caller: string;
  direction?: 'incoming' | 'outgoing';
  /** Seconds the phone rings before auto-missing (0/absent = until acted on). */
  ringSeconds?: number;
  /** Entry step of the sub-flow (the first line AFTER answering). */
  entry: string;
  /** The call's private step graph (separate from the chapter's nodes). */
  scene: Record<string, CallStep>;
  /** Applied when the call CONNECTS (the player answers). */
  effects?: Effect[];
  /** Player declines: optional voicemail + where the main line continues. */
  onDecline?: { effects?: Effect[]; voicemailText?: string; thread?: string; next?: string };
  /** Ring-out: defaults to onDecline; set to diverge a missed call. */
  onTimeout?: { effects?: Effect[]; voicemailText?: string; thread?: string; next?: string };
  /** Where the MAIN line continues after the call ends. */
  next?: string;
}

/**
 * ARMS a player-call event and continues (SELF-ADVANCING — it does NOT block).
 * `event` selects which event kind arms (only `playerCall` for now). From here
 * on, whenever the player places an outgoing call matching `contact`/`number`
 * (neither = any call) AND satisfying `condition`, the call plays out per
 * `outcome` and the event's `effects` apply. The event stays armed until a
 * `removeEvent` node disarms it (by this node's id). `outcome` (default
 * 'ringing'):
 *   - 'ringing':  keeps ringing, nobody answers.
 *   - 'dropped':  the call drops / fails.
 *   - 'declined': the other side rejects it.
 *   - 'answered': it connects and plays `audioUrl` while showing `text`,
 *                 hanging up `hangUpAfterMs` after the audio ends.
 */
export interface EventNode {
  id: string;
  type: 'event';
  /**
   * Which player action arms this node. Persistent listener: once armed it fires
   * every time the player performs the action, until a `removeEvent` disarms it.
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
  /** playerCall + answered: ms to stay connected AFTER the audio ends. */
  hangUpAfterMs?: number;
  /** Applied when the event FIRES (the matching player action happens). */
  effects?: Effect[];
  /** The sequence that runs WHEN the event fires. */
  onEvent?: string;
  /** "Continue now" path: empty = WAIT here until the event fires. */
  next?: string;
}

/**
 * Disarms an `event` node armed earlier (referenced by its node id), so it no
 * longer fires on the player's calls. Self-advancing.
 */
export interface RemoveEventNode {
  id: string;
  type: 'removeEvent';
  /** The id of the `event` node to disarm. */
  target: string;
  next?: string;
}

/**
 * Splits the flow into several PARALLEL delivery tracks: every output runs at
 * the same time. Outputs that lead nowhere simply end. Parallel tracks are
 * delivery-only — choices/calls/chapter-ends belong to the main line (the first
 * output continues it; the rest run beside it).
 */
export interface ForkNode {
  id: string;
  type: 'fork';
  /** Node ids that all begin running in parallel ('' = an unwired slot). */
  outputs: string[];
}

export interface ChapterEndNode {
  id: string;
  type: 'chapterEnd';
  next?: string;
  unlocks?: string[];
  ending?: string;
  /** Objective gate: the chapter only completes once this is true in-game. */
  requirement?: Condition;
  /** Designer note about the gate (never shown to the player). */
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

export type NodeType = StoryNode['type'];

export interface Chapter {
  id: string;
  index: number;
  title: string;
  objective: string;
  summary: string;
  entry: string;
  nodes: Record<string, StoryNode>;
}

/** A bubble that already exists in a contact's chat when the game starts. */
export interface SeedMessage {
  /** true = sent by the player; false/absent = sent by the character. */
  fromPlayer?: boolean;
  text: string;
  /** How many minutes before game start it was sent. */
  minutesAgo?: number;
}

export interface Character {
  id: string;
  name: string;
  fullName: string;
  age?: number;
  role: string;
  introChapter: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  /** Media library id (image) for the Contacts/chat photo; wins over `avatarUrl`. */
  avatarMedia?: string;
  bio: string;
  writingStyle: string;
  /** Phone number shown while the contact is unknown; blank = auto fake number. */
  phone?: string;
  /** Already saved in the player's agenda at game start (family, friends). */
  startsUnlocked?: boolean;
  /** Pre-existing chat history with this contact at game start (read, no unread). */
  initialChat?: SeedMessage[];
  /** Fictional bank account; player transfers to it reach this character. */
  bankAccount?: string;
  /** Mural presence (photo/bio/followers), separate from the chat identity. */
  social?: CharacterSocial;
}

/** A character's Mural presence — separate from the Contacts/chat identity. */
export interface CharacterSocial {
  handle?: string;
  bio?: string;
  followers?: number;
  following?: number;
  avatarUrl?: string;
  /** Media library id (image) for the Mural photo; wins over `avatarUrl`. */
  avatarMedia?: string;
  avatarColor?: string;
  /** Player already follows this character's Mural profile at game start (opt-in; default off). */
  followedByDefault?: boolean;
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
  source: string;
  caseRelevance: string;
  thumbnailColor?: string;
  body?: string;
  url?: string;
  /** Media library id; its url wins over `url`. */
  media?: string;
}

/**
 * A reusable audio/video file the narrative plays — registered once in the
 * Media library and referenced by id from audio messages and calls (so the same
 * link isn't pasted loose across many nodes).
 */
export interface MediaItem {
  id: string;
  name: string;
  kind: 'audio' | 'video' | 'image';
  url: string;
  /** Optional organisational label (ignored by the game). */
  category?: string;
}

export interface NewsArticle {
  id: string;
  outlet: string;
  headline: string;
  date: string;
  body: string;
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  /** Published from the start of the game (general/filler news — no unlock effect). */
  initial?: boolean;
}

/**
 * An authored FICTIONAL web page openable in the in-game browser. A character
 * can drop its link into a chat (message text, `{{` menu → Links). Pages that
 * share a `domain` are grouped together in the editor for organisation only.
 */
export interface WebPage {
  id: string;
  /** Fictional domain, e.g. "ravenwoodgazette.com.br" — also the editor grouping key. */
  domain: string;
  /** Path after the domain (full URL = domain + '/' + path). */
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

/** A paid ad — ambience, not story content (Mural feed + browser banners). */
export interface Ad {
  id: string;
  brand: string;
  avatarUrl?: string;
  imageUrl?: string;
  caption: string;
  cta?: string;
  url?: string;
  placement?: 'social' | 'browser' | 'both';
  active?: boolean;
}

export interface Ending {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  condition?: Condition;
  scenes: string[];
}

/** A filler Mural account with no story relevance. */
export interface SocialNpc {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  bio: string;
  /** Player already follows this NPC at game start (default: true). */
  followedByDefault?: boolean;
}

/** One slide of a Mural story. */
export interface SocialStoryItem {
  id: string;
  author: string;
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  text?: string;
  durationSec?: number;
  date: string;
  initial?: boolean;
}

/**
 * A pre-written comment the PLAYER may post on a SocialPost. Only posts that
 * define `commentOptions` are commentable; each option is a narrative choice.
 */
export interface PostCommentOption {
  id: string;
  text: string;
  say?: string;
  /** When set, this option is offered as a REPLY to that comment id (not in the main composer). */
  replyTo?: string;
  condition?: Condition;
  effects?: Effect[];
}

/** A pre-authored comment shown under a SocialPost. */
export interface PostComment {
  /** Stable id — required to be liked or to be a reply target. */
  id?: string;
  /** characterId | SocialNpc id | 'player'. */
  author: string;
  text: string;
  /** Baseline like count (player like adds +1). */
  likes?: number;
  /** When set, this comment is a reply to another comment's id. */
  replyTo?: string;
}

/** A post on Mural, the in-game social network. */
export interface SocialPost {
  id: string;
  author: string;
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`. */
  imageMedia?: string;
  caption: string;
  likes: number;
  date: string;
  comments: PostComment[];
  /** Pre-defined comments the player may post here (absent = not commentable). */
  commentOptions?: PostCommentOption[];
  initial?: boolean;
}

/**
 * The PLAYER's own Mural identity (author id 'player') — whatever role the story
 * gives them. Their bio/name/photo are authored here, not assumed by the editor.
 */
export interface PlayerProfile {
  /** @handle on Mural (default 'voce'). */
  handle?: string;
  /** Display name override; defaults to the player's chosen name. */
  name?: string;
  /** Bio shown on the player's Mural profile. */
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
 * chosen option's `body` becomes the published text and its `effects` fire.
 */
export interface BlogContentOption {
  id: string;
  label: string;
  body: string;
  condition?: Condition;
  effects?: Effect[];
}

/**
 * A Blog article the player can publish. Offered to the player via `offerBlog`
 * (then it shows under Rascunhos). After publishing it can be shared to a Mural
 * story (`muralStory`, a socialStories id with author 'player').
 */
export interface BlogPost {
  id: string;
  title: string;
  options: BlogContentOption[];
  /** Direct link used as the matéria's thumbnail/header (wins over imageEvidence). */
  imageUrl?: string;
  /** Media library id (image); its url wins over `imageUrl`/`imageEvidence`. */
  imageMedia?: string;
  /** Evidence id whose media is reused as the matéria's thumbnail/header image. */
  imageEvidence?: string;
  muralStory?: string;
  date?: string;
}

export interface EditorMeta {
  layouts: Record<string, Record<string, { x: number; y: number }>>;
}

export interface Bundle {
  meta: {
    title: string;
    version: string;
    startChapter: string;
    /** Player's opening bank balance in R$ (default 0). */
    startingMoney?: number;
    /** Wrong matches allowed per "Pares" round (default 8). */
    minigameAttempts?: number;
    /** Remote URL of the ringback tone played during an outgoing call. */
    ringbackUrl?: string;
    /** Name of the player's news blog/outlet (Blog app header + News outlet). */
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
  ads: Record<string, Ad>;
  /** Articles the player publishes from the Blog app (offered via `offerBlog`). */
  blog: Record<string, BlogPost>;
  /** The player's own Mural identity. */
  playerProfile?: PlayerProfile;
  endings: Record<string, Ending>;
  chapters: Record<string, Chapter>;
  chapterOrder: string[];
  _editor?: EditorMeta;
}

export const NODE_LABEL: Record<NodeType, string> = {
  message: 'Mensagem',
  choice: 'Escolha',
  action: 'Ação',
  branch: 'Condição',
  unlockMessage: 'Liberar mensagem',
  shareContact: 'Enviar contato',
  delay: 'Tempo',
  activity: 'Atividade (digitando/gravando)',
  publishNews: 'Publicar notícia',
  publishPost: 'Post no Mural',
  publishStory: 'Story no Mural',
  offerBlog: 'Liberar pauta (Blog)',
  socialActivity: 'Mural: comentário / curtidas',
  socialFollow: 'Mural: seguidores',
  bank: 'Saldo (R$)',
  notification: 'Notificação',
  call: 'Chamada',
  callScene: 'Ligação interativa',
  event: 'Evento',
  removeEvent: 'Remover evento',
  fork: 'Paralelo (várias saídas)',
  chapterEnd: 'Fim do capítulo',
};

export const CALL_STEP_LABEL: Record<CallStepType, string> = {
  audio: 'Áudio / MP3',
  choice: 'Escolha de resposta',
  action: 'Ação (efeitos)',
  branch: 'Condição',
  delay: 'Pausa (silêncio)',
  hangup: 'Encerrar ligação',
};

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  photo: 'Foto',
  video: 'Vídeo',
  audio: 'Áudio',
  document: 'Documento',
  screenshot: 'Print',
  location: 'Localização',
  report: 'Reportagem',
};
