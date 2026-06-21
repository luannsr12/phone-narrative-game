import { create } from 'zustand';
import type {
  Bundle,
  Chapter,
  StoryNode,
  NodeType,
  CallSceneNode,
  CallStep,
  CallStepType,
  Character,
  Evidence,
  NewsArticle,
  Ending,
  SocialPost,
  SocialStoryItem,
  SocialNpc,
  Ad,
  BlogPost,
  PlayerProfile,
  MediaItem,
  WebPage,
} from './types';

const STORAGE_KEY = 'sinal-perdido-editor/v1';

export type Tab = 'chapters' | 'characters' | 'evidence' | 'media' | 'news' | 'pages' | 'social' | 'blog' | 'ads' | 'endings' | 'audit';

function emptyBundle(): Bundle {
  return {
    meta: { title: 'Ravenwood', version: '0.1.0', startChapter: 'prologue' },
    characters: {},
    evidence: {},
    media: {},
    news: {},
    pages: {},
    social: {},
    socialStories: {},
    socialNpcs: {},
    ads: {},
    blog: {},
    endings: {},
    chapters: {},
    chapterOrder: [],
    _editor: { layouts: {} },
  };
}

function loadInitial(): Bundle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Bundle;
      parsed.social = parsed.social ?? {};
      parsed.socialStories = parsed.socialStories ?? {};
      parsed.socialNpcs = parsed.socialNpcs ?? {};
      parsed.ads = parsed.ads ?? {};
      parsed.blog = parsed.blog ?? {};
      parsed.media = parsed.media ?? {};
      parsed.pages = parsed.pages ?? {};
      return parsed;
    }
  } catch {
    // corrupted autosave — start clean
  }
  return emptyBundle();
}

let uidCounter = 0;
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

function defaultNode(type: NodeType, id: string): StoryNode {
  switch (type) {
    case 'message':
      return { id, type, speaker: 'system', thread: '', text: '', typingMs: 1400 };
    case 'choice':
      return { id, type, thread: '', options: [{ id: `${id}_o1`, text: 'Opção 1', next: '' }] };
    case 'action':
      return { id, type, effects: [] };
    case 'branch':
      return { id, type, branches: [] };
    case 'unlockMessage':
      return { id, type, character: '' };
    case 'shareContact':
      return { id, type, speaker: '', thread: '', character: '', typingMs: 1400 };
    case 'delay':
      return { id, type, seconds: 60 };
    case 'activity':
      return { id, type, thread: '', speaker: '', kind: 'typing', seconds: 3 };
    case 'publishNews':
      return { id, type, news: '' };
    case 'publishPost':
      return { id, type, post: '' };
    case 'publishStory':
      return { id, type, story: '' };
    case 'offerBlog':
      return { id, type, blog: '' };
    case 'socialActivity':
      return { id, type, action: 'comment', author: '', post: '', text: '' };
    case 'socialFollow':
      return { id, type, account: '' };
    case 'bank':
      return { id, type, amount: 50 };
    case 'notification':
      return { id, type, app: 'news', title: '' };
    case 'call':
      return { id, type, caller: '', direction: 'incoming', transcript: [] };
    case 'callScene':
      return { id, type, caller: '', direction: 'incoming', entry: '', scene: {} };
    case 'event':
      return { id, type, event: 'playerCall', outcome: 'ringing' };
    case 'removeEvent':
      return { id, type, target: '' };
    case 'fork':
      return { id, type, outputs: ['', ''] };
    case 'chapterEnd':
      return { id, type };
  }
}

/** Simple top-down auto-layout (BFS from entry) for chapters with no layout. */
function autoLayout(chapter: Chapter): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  const depth = new Map<string, number>();
  const queue: string[] = chapter.entry ? [chapter.entry] : [];
  depth.set(chapter.entry, 0);

  const outgoing = (n: StoryNode): string[] => {
    switch (n.type) {
      case 'message':
      case 'action':
      case 'unlockMessage':
      case 'shareContact':
      case 'delay':
      case 'activity':
      case 'publishNews':
      case 'publishPost':
      case 'publishStory':
      case 'offerBlog':
      case 'socialActivity':
      case 'socialFollow':
      case 'bank':
      case 'notification':
      case 'removeEvent':
        return n.next ? [n.next] : [];
      case 'event':
        return [n.onEvent ?? '', n.next ?? ''].filter(Boolean);
      case 'choice':
        return n.options.map((o) => o.next).filter(Boolean);
      case 'fork':
        return n.outputs.filter(Boolean);
      case 'branch':
        return [...n.branches.map((b) => b.next), n.fallback ?? ''].filter(Boolean);
      case 'call':
        return [n.onAnswer?.next ?? '', n.onDecline?.next ?? ''].filter(Boolean);
      case 'callScene':
        return [n.next ?? '', n.onDecline?.next ?? '', n.onTimeout?.next ?? ''].filter(Boolean);
      default:
        return [];
    }
  };

  while (queue.length) {
    const id = queue.shift()!;
    const node = chapter.nodes[id];
    if (!node) continue;
    for (const t of outgoing(node)) {
      if (!depth.has(t)) {
        depth.set(t, (depth.get(id) ?? 0) + 1);
        queue.push(t);
      }
    }
  }

  const perLevel = new Map<number, number>();
  for (const id of Object.keys(chapter.nodes)) {
    const d = depth.get(id) ?? 99;
    const i = perLevel.get(d) ?? 0;
    perLevel.set(d, i + 1);
    layout[id] = { x: 80 + i * 360, y: 60 + d * 170 };
  }
  return layout;
}

/** Layout key for a call's nested sub-flow (kept under `_editor.layouts`). */
export function callLayoutKey(chapterId: string, nodeId: string): string {
  return `${chapterId}::call::${nodeId}`;
}

function defaultCallStep(type: CallStepType, id: string): CallStep {
  switch (type) {
    case 'audio':
      return { id, type, speaker: '', audioUrl: '', text: '' };
    case 'choice':
      return { id, type, options: [{ id: `${id}_o1`, text: 'Resposta 1', next: '' }] };
    case 'action':
      return { id, type, effects: [] };
    case 'branch':
      return { id, type, branches: [] };
    case 'delay':
      return { id, type, seconds: 2 };
    case 'hangup':
      return { id, type };
  }
}

/** BFS auto-layout for a call's sub-flow (mirrors the chapter version). */
function callAutoLayout(node: CallSceneNode): Record<string, { x: number; y: number }> {
  const layout: Record<string, { x: number; y: number }> = {};
  const scene = node.scene ?? {};
  const depth = new Map<string, number>();
  const queue: string[] = node.entry ? [node.entry] : [];
  if (node.entry) depth.set(node.entry, 0);

  const outgoing = (st: CallStep): string[] => {
    switch (st.type) {
      case 'audio':
      case 'action':
      case 'delay':
        return st.next ? [st.next] : [];
      case 'choice':
        return [...st.options.map((o) => o.next), st.timeoutNext ?? ''].filter(Boolean);
      case 'branch':
        return [...st.branches.map((b) => b.next), st.fallback ?? ''].filter(Boolean);
      default:
        return [];
    }
  };

  while (queue.length) {
    const id = queue.shift()!;
    const st = scene[id];
    if (!st) continue;
    for (const t of outgoing(st)) {
      if (!depth.has(t)) {
        depth.set(t, (depth.get(id) ?? 0) + 1);
        queue.push(t);
      }
    }
  }

  const perLevel = new Map<number, number>();
  for (const id of Object.keys(scene)) {
    const d = depth.get(id) ?? 99;
    const i = perLevel.get(d) ?? 0;
    perLevel.set(d, i + 1);
    layout[id] = { x: 80 + i * 340, y: 60 + d * 160 };
  }
  return layout;
}

interface EditorStore {
  bundle: Bundle;
  tab: Tab;
  selectedChapterId: string | null;
  selectedNodeId: string | null;
  /**
   * Which interactive call's nested sub-flow is open for editing (null = the
   * normal chapter canvas). A "flowchart inside the flowchart".
   */
  callEditor: { chapterId: string; nodeId: string } | null;
  /** Selected STEP inside the open call sub-flow (for the step inspector). */
  selectedStepId: string | null;
  /**
   * Bumped only by `goToNode` (search / Inspeção jumps). The canvas re-centers
   * the viewport when this changes — NOT on a plain node selection — so simply
   * clicking or dragging a node never yanks the camera around.
   */
  focusNonce: number;

  setTab: (t: Tab) => void;
  selectChapter: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  /** Jump to a node anywhere in the bundle: open its chapter on the Capítulos
   *  tab, select it, and request a viewport re-center (via focusNonce). */
  goToNode: (chapterId: string, nodeId: string) => void;

  setBundle: (b: Bundle) => void;
  updateMeta: (patch: Partial<Bundle['meta']>) => void;

  upsertCharacter: (c: Character) => void;
  removeCharacter: (id: string) => void;
  upsertEvidence: (e: Evidence) => void;
  removeEvidence: (id: string) => void;
  upsertMedia: (m: MediaItem) => void;
  removeMedia: (id: string) => void;
  upsertNews: (n: NewsArticle) => void;
  removeNews: (id: string) => void;
  upsertPage: (p: WebPage) => void;
  removePage: (id: string) => void;
  upsertSocial: (p: SocialPost) => void;
  removeSocial: (id: string) => void;
  upsertStory: (p: SocialStoryItem) => void;
  removeStory: (id: string) => void;
  upsertNpc: (p: SocialNpc) => void;
  removeNpc: (id: string) => void;
  upsertAd: (a: Ad) => void;
  removeAd: (id: string) => void;
  upsertBlog: (p: BlogPost) => void;
  removeBlog: (id: string) => void;
  setPlayerProfile: (p: PlayerProfile | undefined) => void;
  upsertEnding: (e: Ending) => void;
  removeEnding: (id: string) => void;

  addChapter: (id: string, title: string) => void;
  removeChapter: (id: string) => void;
  updateChapterMeta: (id: string, patch: Partial<Omit<Chapter, 'nodes'>>) => void;
  moveChapter: (id: string, dir: -1 | 1) => void;

  addNode: (chapterId: string, type: NodeType, pos: { x: number; y: number }) => string;
  removeNode: (chapterId: string, nodeId: string) => void;
  updateNode: (chapterId: string, nodeId: string, node: StoryNode) => void;
  setNodePos: (chapterId: string, nodeId: string, pos: { x: number; y: number }) => void;
  setEntry: (chapterId: string, nodeId: string) => void;
  connect: (chapterId: string, source: string, sourceHandle: string | null, target: string) => void;
  disconnect: (chapterId: string, source: string, sourceHandle: string | null) => void;

  // --- Call sub-flow ("flowchart inside the call") -------------------------
  /** Drill into a call node's nested sub-flow canvas. */
  enterCallEditor: (chapterId: string, nodeId: string) => void;
  /** Jump straight to a STEP inside a call's sub-flow (search / Inspeção). */
  goToCallStep: (chapterId: string, nodeId: string, stepId: string) => void;
  /** Back out to the chapter canvas. */
  exitCallEditor: () => void;
  selectStep: (id: string | null) => void;
  addCallStep: (chapterId: string, nodeId: string, type: CallStepType, pos: { x: number; y: number }) => string;
  removeCallStep: (chapterId: string, nodeId: string, stepId: string) => void;
  updateCallStep: (chapterId: string, nodeId: string, stepId: string, step: CallStep) => void;
  setCallStepPos: (chapterId: string, nodeId: string, stepId: string, pos: { x: number; y: number }) => void;
  setCallEntry: (chapterId: string, nodeId: string, stepId: string) => void;
  connectCallStep: (chapterId: string, nodeId: string, source: string, sourceHandle: string | null, target: string) => void;
  disconnectCallStep: (chapterId: string, nodeId: string, source: string, sourceHandle: string | null) => void;
}

export const useEditor = create<EditorStore>((set, get) => {
  const mutate = (fn: (b: Bundle) => void) => {
    const next = structuredClone(get().bundle);
    fn(next);
    set({ bundle: next });
  };

  /** Guarantee a layout exists for `id` so the canvas always has positions. */
  const ensureLayout = (id: string | null) => {
    if (!id) return;
    const b = get().bundle;
    const ch = b.chapters[id];
    if (!ch) return;
    const layouts = b._editor?.layouts ?? {};
    const existing = layouts[id] ?? {};
    const missing = Object.keys(ch.nodes).filter((n) => !existing[n]);
    if (missing.length) {
      mutate((nb) => {
        nb._editor = nb._editor ?? { layouts: {} };
        const auto = autoLayout(ch);
        nb._editor.layouts[id] = { ...auto, ...existing };
      });
    }
  };

  /** Guarantee a layout exists for every step of a call's sub-flow. */
  const ensureCallLayout = (chapterId: string, nodeId: string) => {
    const b = get().bundle;
    const node = b.chapters[chapterId]?.nodes[nodeId];
    if (!node || node.type !== 'callScene') return;
    const key = callLayoutKey(chapterId, nodeId);
    const existing = b._editor?.layouts[key] ?? {};
    const missing = Object.keys(node.scene ?? {}).filter((s) => !existing[s]);
    if (missing.length) {
      mutate((nb) => {
        nb._editor = nb._editor ?? { layouts: {} };
        const auto = callAutoLayout(node);
        nb._editor.layouts[key] = { ...auto, ...existing };
      });
    }
  };

  return {
    bundle: loadInitial(),
    tab: 'chapters',
    selectedChapterId: null,
    selectedNodeId: null,
    callEditor: null,
    selectedStepId: null,
    focusNonce: 0,

    setTab: (tab) => set({ tab }),
    selectChapter: (id) => {
      ensureLayout(id);
      set({ selectedChapterId: id, selectedNodeId: null, callEditor: null, selectedStepId: null });
    },
    selectNode: (id) => set({ selectedNodeId: id }),
    goToNode: (chapterId, nodeId) => {
      // Ensure layout, switch to the chapters tab, open the chapter and select
      // the node — all in one shot so selectedNodeId isn't cleared mid-way. The
      // focusNonce bump is what tells the canvas to re-center on it.
      ensureLayout(chapterId);
      set({
        tab: 'chapters',
        selectedChapterId: chapterId,
        selectedNodeId: nodeId,
        callEditor: null,
        selectedStepId: null,
        focusNonce: get().focusNonce + 1,
      });
    },

    setBundle: (b) =>
      set({ bundle: b, selectedChapterId: null, selectedNodeId: null, callEditor: null, selectedStepId: null }),
    updateMeta: (patch) => mutate((b) => Object.assign(b.meta, patch)),

    upsertCharacter: (c) => mutate((b) => void (b.characters[c.id] = c)),
    removeCharacter: (id) => mutate((b) => void delete b.characters[id]),
    upsertEvidence: (e) => mutate((b) => void (b.evidence[e.id] = e)),
    removeEvidence: (id) => mutate((b) => void delete b.evidence[id]),
    upsertMedia: (m) => mutate((b) => void ((b.media = b.media ?? {}), (b.media[m.id] = m))),
    removeMedia: (id) => mutate((b) => void delete b.media[id]),
    upsertNews: (n) => mutate((b) => void (b.news[n.id] = n)),
    removeNews: (id) => mutate((b) => void delete b.news[id]),
    upsertPage: (p) => mutate((b) => void ((b.pages = b.pages ?? {}), (b.pages[p.id] = p))),
    removePage: (id) => mutate((b) => void delete b.pages?.[id]),
    upsertSocial: (p) => mutate((b) => void (b.social[p.id] = p)),
    removeSocial: (id) => mutate((b) => void delete b.social[id]),
    upsertStory: (p) => mutate((b) => void (b.socialStories[p.id] = p)),
    removeStory: (id) => mutate((b) => void delete b.socialStories[id]),
    upsertNpc: (p) => mutate((b) => void (b.socialNpcs[p.id] = p)),
    removeNpc: (id) => mutate((b) => void delete b.socialNpcs[id]),
    upsertAd: (a) => mutate((b) => void ((b.ads = b.ads ?? {}), (b.ads[a.id] = a))),
    removeAd: (id) => mutate((b) => void delete b.ads[id]),
    upsertBlog: (p) => mutate((b) => void ((b.blog = b.blog ?? {}), (b.blog[p.id] = p))),
    removeBlog: (id) => mutate((b) => void delete b.blog[id]),
    setPlayerProfile: (p) => mutate((b) => void (b.playerProfile = p)),
    upsertEnding: (e) => mutate((b) => void (b.endings[e.id] = e)),
    removeEnding: (id) => mutate((b) => void delete b.endings[id]),

    addChapter: (id, title) =>
      mutate((b) => {
        b.chapters[id] = {
          id,
          index: b.chapterOrder.length,
          title,
          objective: '',
          summary: '',
          entry: '',
          nodes: {},
        };
        b.chapterOrder.push(id);
      }),
    removeChapter: (id) =>
      mutate((b) => {
        // Drop nested call sub-flow layouts for any callScene nodes in this chapter.
        const ch = b.chapters[id];
        if (ch && b._editor) {
          for (const [nid, n] of Object.entries(ch.nodes)) {
            if (n.type === 'callScene') delete b._editor.layouts[callLayoutKey(id, nid)];
          }
        }
        delete b.chapters[id];
        b.chapterOrder = b.chapterOrder.filter((c) => c !== id);
        if (b._editor) delete b._editor.layouts[id];
      }),
    updateChapterMeta: (id, patch) =>
      mutate((b) => {
        const ch = b.chapters[id];
        if (ch) Object.assign(ch, patch);
      }),
    moveChapter: (id, dir) =>
      mutate((b) => {
        const i = b.chapterOrder.indexOf(id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= b.chapterOrder.length) return;
        [b.chapterOrder[i], b.chapterOrder[j]] = [b.chapterOrder[j], b.chapterOrder[i]];
        b.chapterOrder.forEach((cid, idx) => {
          if (b.chapters[cid]) b.chapters[cid].index = idx;
        });
      }),

    addNode: (chapterId, type, pos) => {
      const id = uid(type === 'chapterEnd' ? 'end' : type.slice(0, 3));
      mutate((b) => {
        const ch = b.chapters[chapterId];
        if (!ch) return;
        ch.nodes[id] = defaultNode(type, id);
        if (!ch.entry) ch.entry = id;
        b._editor = b._editor ?? { layouts: {} };
        b._editor.layouts[chapterId] = { ...(b._editor.layouts[chapterId] ?? {}), [id]: pos };
      });
      return id;
    },
    removeNode: (chapterId, nodeId) =>
      mutate((b) => {
        const ch = b.chapters[chapterId];
        if (!ch) return;
        const removed = ch.nodes[nodeId];
        delete ch.nodes[nodeId];
        if (ch.entry === nodeId) ch.entry = '';
        // Clear dangling references to the removed node.
        for (const n of Object.values(ch.nodes)) {
          if (
            (n.type === 'message' ||
              n.type === 'action' ||
              n.type === 'unlockMessage' ||
              n.type === 'shareContact' ||
              n.type === 'delay' ||
              n.type === 'activity' ||
              n.type === 'publishNews' ||
              n.type === 'publishPost' ||
              n.type === 'publishStory' ||
              n.type === 'offerBlog' ||
              n.type === 'socialActivity' ||
              n.type === 'socialFollow' ||
              n.type === 'bank' ||
              n.type === 'notification' ||
              n.type === 'event' ||
              n.type === 'removeEvent') &&
            n.next === nodeId
          )
            n.next = undefined;
          if (n.type === 'choice') n.options.forEach((o) => o.next === nodeId && (o.next = ''));
          if (n.type === 'event' && n.onEvent === nodeId) n.onEvent = undefined;
          if (n.type === 'fork') n.outputs = n.outputs.map((o) => (o === nodeId ? '' : o));
          if (n.type === 'branch') {
            n.branches.forEach((br) => br.next === nodeId && (br.next = ''));
            if (n.fallback === nodeId) n.fallback = undefined;
          }
          if (n.type === 'call') {
            if (n.onAnswer?.next === nodeId) n.onAnswer.next = undefined;
            if (n.onDecline?.next === nodeId) n.onDecline.next = undefined;
          }
          if (n.type === 'callScene') {
            if (n.next === nodeId) n.next = undefined;
            if (n.onDecline?.next === nodeId) n.onDecline.next = undefined;
            if (n.onTimeout?.next === nodeId) n.onTimeout.next = undefined;
          }
          if (n.type === 'removeEvent' && n.target === nodeId) n.target = '';
        }
        if (b._editor?.layouts[chapterId]) delete b._editor.layouts[chapterId][nodeId];
        // Drop the call's nested sub-flow layout too (no orphaned layout state).
        if (removed?.type === 'callScene' && b._editor?.layouts)
          delete b._editor.layouts[callLayoutKey(chapterId, nodeId)];
      }),
    updateNode: (chapterId, nodeId, node) =>
      mutate((b) => {
        const ch = b.chapters[chapterId];
        if (ch) ch.nodes[nodeId] = node;
      }),
    setNodePos: (chapterId, nodeId, pos) =>
      mutate((b) => {
        b._editor = b._editor ?? { layouts: {} };
        b._editor.layouts[chapterId] = { ...(b._editor.layouts[chapterId] ?? {}), [nodeId]: pos };
      }),
    setEntry: (chapterId, nodeId) =>
      mutate((b) => {
        const ch = b.chapters[chapterId];
        if (ch) ch.entry = nodeId;
      }),

    connect: (chapterId, source, sourceHandle, target) =>
      mutate((b) => {
        const n = b.chapters[chapterId]?.nodes[source];
        if (!n) return;
        switch (n.type) {
          case 'message':
          case 'action':
          case 'unlockMessage':
          case 'shareContact':
          case 'delay':
          case 'activity':
          case 'publishNews':
          case 'publishPost':
          case 'publishStory':
          case 'offerBlog':
          case 'bank':
          case 'notification':
          case 'removeEvent':
            n.next = target;
            break;
          case 'event':
            if (sourceHandle === 'onEvent') n.onEvent = target;
            else n.next = target;
            break;
          case 'choice': {
            const opt = n.options.find((o) => o.id === sourceHandle);
            if (opt) opt.next = target;
            break;
          }
          case 'fork': {
            const i = Number(sourceHandle?.replace('o', ''));
            if (Number.isInteger(i) && i >= 0 && i < n.outputs.length) n.outputs[i] = target;
            break;
          }
          case 'branch': {
            if (sourceHandle === 'fallback') n.fallback = target;
            else {
              const i = Number(sourceHandle?.replace('b', ''));
              if (n.branches[i]) n.branches[i].next = target;
            }
            break;
          }
          case 'call': {
            if (sourceHandle === 'answer') n.onAnswer = { ...(n.onAnswer ?? {}), next: target };
            if (sourceHandle === 'decline') n.onDecline = { ...(n.onDecline ?? {}), next: target };
            break;
          }
          case 'callScene': {
            if (sourceHandle === 'decline') n.onDecline = { ...(n.onDecline ?? {}), next: target };
            else if (sourceHandle === 'timeout') n.onTimeout = { ...(n.onTimeout ?? {}), next: target };
            else n.next = target;
            break;
          }
          default:
            break;
        }
      }),
    disconnect: (chapterId, source, sourceHandle) =>
      mutate((b) => {
        const n = b.chapters[chapterId]?.nodes[source];
        if (!n) return;
        switch (n.type) {
          case 'message':
          case 'action':
          case 'unlockMessage':
          case 'shareContact':
          case 'delay':
          case 'activity':
          case 'publishNews':
          case 'publishPost':
          case 'publishStory':
          case 'offerBlog':
          case 'bank':
          case 'notification':
          case 'removeEvent':
            n.next = undefined;
            break;
          case 'event':
            if (sourceHandle === 'onEvent') n.onEvent = undefined;
            else n.next = undefined;
            break;
          case 'choice': {
            const opt = n.options.find((o) => o.id === sourceHandle);
            if (opt) opt.next = '';
            break;
          }
          case 'fork': {
            const i = Number(sourceHandle?.replace('o', ''));
            if (Number.isInteger(i) && i >= 0 && i < n.outputs.length) n.outputs[i] = '';
            break;
          }
          case 'branch': {
            if (sourceHandle === 'fallback') n.fallback = undefined;
            else {
              const i = Number(sourceHandle?.replace('b', ''));
              if (n.branches[i]) n.branches[i].next = '';
            }
            break;
          }
          case 'call': {
            if (sourceHandle === 'answer' && n.onAnswer) n.onAnswer.next = undefined;
            if (sourceHandle === 'decline' && n.onDecline) n.onDecline.next = undefined;
            break;
          }
          case 'callScene': {
            if (sourceHandle === 'decline') {
              if (n.onDecline) n.onDecline.next = undefined;
            } else if (sourceHandle === 'timeout') {
              if (n.onTimeout) n.onTimeout.next = undefined;
            } else n.next = undefined;
            break;
          }
          default:
            break;
        }
      }),

    // --- Call sub-flow (the nested "flowchart inside the call") --------------
    enterCallEditor: (chapterId, nodeId) => {
      ensureCallLayout(chapterId, nodeId);
      set({ callEditor: { chapterId, nodeId }, selectedStepId: null });
    },
    goToCallStep: (chapterId, nodeId, stepId) => {
      ensureLayout(chapterId);
      ensureCallLayout(chapterId, nodeId);
      set({
        tab: 'chapters',
        selectedChapterId: chapterId,
        selectedNodeId: nodeId,
        callEditor: { chapterId, nodeId },
        selectedStepId: stepId,
        focusNonce: get().focusNonce + 1,
      });
    },
    exitCallEditor: () => set({ callEditor: null, selectedStepId: null }),
    selectStep: (id) => set({ selectedStepId: id }),

    addCallStep: (chapterId, nodeId, type, pos) => {
      const id = uid(`cs_${type.slice(0, 3)}`);
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (!node || node.type !== 'callScene') return;
        node.scene = node.scene ?? {};
        node.scene[id] = defaultCallStep(type, id);
        if (!node.entry) node.entry = id;
        const key = callLayoutKey(chapterId, nodeId);
        b._editor = b._editor ?? { layouts: {} };
        b._editor.layouts[key] = { ...(b._editor.layouts[key] ?? {}), [id]: pos };
      });
      return id;
    },
    removeCallStep: (chapterId, nodeId, stepId) =>
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (!node || node.type !== 'callScene') return;
        delete node.scene[stepId];
        if (node.entry === stepId) node.entry = '';
        for (const st of Object.values(node.scene)) {
          if ((st.type === 'audio' || st.type === 'action' || st.type === 'delay') && st.next === stepId)
            st.next = undefined;
          if (st.type === 'choice') {
            st.options.forEach((o) => o.next === stepId && (o.next = ''));
            if (st.timeoutNext === stepId) st.timeoutNext = undefined;
          }
          if (st.type === 'branch') {
            st.branches.forEach((br) => br.next === stepId && (br.next = ''));
            if (st.fallback === stepId) st.fallback = undefined;
          }
        }
        const key = callLayoutKey(chapterId, nodeId);
        if (b._editor?.layouts[key]) delete b._editor.layouts[key][stepId];
      }),
    updateCallStep: (chapterId, nodeId, stepId, step) =>
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (node && node.type === 'callScene') node.scene[stepId] = step;
      }),
    setCallStepPos: (chapterId, nodeId, stepId, pos) =>
      mutate((b) => {
        const key = callLayoutKey(chapterId, nodeId);
        b._editor = b._editor ?? { layouts: {} };
        b._editor.layouts[key] = { ...(b._editor.layouts[key] ?? {}), [stepId]: pos };
      }),
    setCallEntry: (chapterId, nodeId, stepId) =>
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (node && node.type === 'callScene') node.entry = stepId;
      }),
    connectCallStep: (chapterId, nodeId, source, sourceHandle, target) =>
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (!node || node.type !== 'callScene') return;
        const st = node.scene[source];
        if (!st) return;
        switch (st.type) {
          case 'audio':
          case 'action':
          case 'delay':
            st.next = target;
            break;
          case 'choice': {
            if (sourceHandle === '__timeout') st.timeoutNext = target;
            else {
              const opt = st.options.find((o) => o.id === sourceHandle);
              if (opt) opt.next = target;
            }
            break;
          }
          case 'branch': {
            if (sourceHandle === 'fallback') st.fallback = target;
            else {
              const i = Number(sourceHandle?.replace('b', ''));
              if (st.branches[i]) st.branches[i].next = target;
            }
            break;
          }
          default:
            break;
        }
      }),
    disconnectCallStep: (chapterId, nodeId, source, sourceHandle) =>
      mutate((b) => {
        const node = b.chapters[chapterId]?.nodes[nodeId];
        if (!node || node.type !== 'callScene') return;
        const st = node.scene[source];
        if (!st) return;
        switch (st.type) {
          case 'audio':
          case 'action':
          case 'delay':
            st.next = undefined;
            break;
          case 'choice': {
            if (sourceHandle === '__timeout') st.timeoutNext = undefined;
            else {
              const opt = st.options.find((o) => o.id === sourceHandle);
              if (opt) opt.next = '';
            }
            break;
          }
          case 'branch': {
            if (sourceHandle === 'fallback') st.fallback = undefined;
            else {
              const i = Number(sourceHandle?.replace('b', ''));
              if (st.branches[i]) st.branches[i].next = '';
            }
            break;
          }
          default:
            break;
        }
      }),
  };
});

// Autosave every change to localStorage.
useEditor.subscribe((s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s.bundle));
  } catch {
    // storage full — keep editing in memory
  }
});
