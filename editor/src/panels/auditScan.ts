/**
 * Shared scanning helpers for the audit dashboard. These walk the bundle's
 * chapter graph and registries collecting effects, conditions and text so the
 * four audit modes (Texto · Variáveis · Personagem · Bifurcações) can present
 * them. Pure functions — no React, no store.
 */
import type { Bundle, Condition, Effect, StoryNode, NodeType } from '../types';
import { NODE_LABEL } from '../types';

/** Case- and accent-insensitive normalization for text search. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// ---- effect / condition describers ----------------------------------------

/**
 * Resolve a registry id to the human name a writer recognizes (character name,
 * evidence/news/blog/ending title, …), falling back to the raw id when the
 * bundle isn't supplied or the entry is missing. Keeps the audit text readable
 * for a non-programmer instead of showing internal ids.
 */
function nameOf(
  bundle: Bundle | undefined,
  kind: 'character' | 'evidence' | 'ending' | 'news' | 'blog' | 'chapter' | 'post',
  id: string,
): string {
  if (!bundle) return id;
  switch (kind) {
    case 'character':
      return bundle.characters[id]?.name || id;
    case 'evidence':
      return bundle.evidence[id]?.title || id;
    case 'ending':
      return bundle.endings[id]?.title || id;
    case 'news':
      return bundle.news[id]?.headline || id;
    case 'blog':
      return bundle.blog?.[id]?.title || id;
    case 'chapter':
      return bundle.chapters[id]?.title || id;
    case 'post': {
      const cap = bundle.social[id]?.caption;
      if (!cap) return id;
      return cap.length > 36 ? `${cap.slice(0, 35)}…` : cap;
    }
  }
}

/**
 * Human-readable PT-BR description of one effect. Pass `bundle` to resolve ids
 * to the names/titles a writer recognizes (recommended in the audit UI).
 */
export function describeEffect(e: Effect, bundle?: Bundle): string {
  switch (e.type) {
    case 'trust':
      return `confiança ${e.delta >= 0 ? '+' : ''}${e.delta} → ${nameOf(bundle, 'character', e.character)}`;
    case 'setFlag':
      return `marcador "${e.flag}" = ${String(e.value ?? true)}`;
    case 'unlockContact':
      return `salva o contato de ${nameOf(bundle, 'character', e.character)}`;
    case 'addEvidence':
      return `entrega a evidência «${nameOf(bundle, 'evidence', e.evidence)}»`;
    case 'money':
      return `R$ ${e.amount}${e.reason ? ` (${e.reason})` : ''}`;
    case 'setPresence':
      return `${nameOf(bundle, 'character', e.character)} fica ${e.online ? 'online' : 'offline'}`;
    case 'lockEndingScore':
      return `final «${nameOf(bundle, 'ending', e.ending)}» ${e.delta >= 0 ? '+' : ''}${e.delta}`;
    case 'setEnding':
      return `força o final «${nameOf(bundle, 'ending', e.ending)}»`;
    case 'unlockNews':
      return `publica a notícia «${nameOf(bundle, 'news', e.news)}»`;
    case 'unlockSocial':
      return `publica o post «${nameOf(bundle, 'post', e.post)}»`;
    case 'unlockStory':
      return `publica um story (${e.story})`;
    case 'offerBlog':
      return `libera a pauta «${nameOf(bundle, 'blog', e.blog)}»`;
    case 'addTimeline':
      return `linha do tempo "${e.title}"`;
    default:
      return (e as { type: string }).type;
  }
}

/**
 * Human-readable PT-BR description of one leaf condition. Pass `bundle` to
 * resolve ids to the names/titles a writer recognizes.
 */
export function describeCondition(c: Condition, bundle?: Bundle): string {
  switch (c.type) {
    case 'flag':
      return `marcador "${c.flag}"${c.value === false ? ' (desligado)' : ' ligado'}`;
    case 'flagEquals':
      return `marcador "${c.flag}" == ${String(c.value)}`;
    case 'trustAtLeast':
      return `confiança de ${nameOf(bundle, 'character', c.character)} ≥ ${c.value}`;
    case 'trustBelow':
      return `confiança de ${nameOf(bundle, 'character', c.character)} < ${c.value}`;
    case 'hasEvidence':
      return `já tem a evidência «${nameOf(bundle, 'evidence', c.evidence)}»`;
    case 'choseOption':
      return `escolheu "${c.option}"`;
    case 'chapterCompleted':
      return `concluiu o capítulo «${nameOf(bundle, 'chapter', c.chapter)}»`;
    case 'moneyAtLeast':
      return `R$ ≥ ${c.amount}`;
    case 'paidAtLeast':
      return `pagou ${nameOf(bundle, 'character', c.character)} ≥ ${c.amount}`;
    case 'likedPost':
      return `${c.value === false ? 'NÃO curtiu' : 'curtiu'} o post ${c.post}`;
    case 'likedComment':
      return `${c.value === false ? 'NÃO curtiu' : 'curtiu'} o comentário ${c.comment}`;
    case 'viewedNews':
      return `${c.value === false ? 'NÃO abriu' : 'abriu'} a notícia «${nameOf(bundle, 'news', c.news)}»`;
    case 'followsProfile':
      return `${c.value === false ? 'NÃO segue' : 'segue'} ${nameOf(bundle, 'character', c.account)}`;
    case 'all':
      return `TODAS (${c.conditions.map((x) => describeCondition(x, bundle)).join(' e ')})`;
    case 'any':
      return `QUALQUER (${c.conditions.map((x) => describeCondition(x, bundle)).join(' ou ')})`;
    case 'not':
      return `NÃO (${describeCondition(c.condition, bundle)})`;
    default:
      return (c as { type: string }).type;
  }
}

/** Flatten an authored condition to its leaf (non-logical) conditions. */
export function flattenCondition(c: Condition | undefined): Condition[] {
  if (!c) return [];
  switch (c.type) {
    case 'all':
    case 'any':
      return c.conditions.flatMap(flattenCondition);
    case 'not':
      return flattenCondition(c.condition);
    default:
      return [c];
  }
}

// ---- effect / condition location scanning ---------------------------------

export interface EffectHit {
  chapterId: string;
  chapterTitle: string;
  nodeId: string;
  nodeType: string;
  where: string;
  effect: Effect;
}

export interface ConditionHit {
  /** Absent for registry-level conditions (endings) — those are not jumpable. */
  chapterId?: string;
  chapterTitle?: string;
  nodeId?: string;
  nodeType?: string;
  where: string;
  condition: Condition;
}

/** Walk every chapter node and collect ALL effects with their location. */
export function scanEffects(bundle: Bundle): EffectHit[] {
  const out: EffectHit[] = [];
  const push = (
    effects: Effect[] | undefined,
    ctx: { chapterId: string; chapterTitle: string; nodeId: string; nodeType: string; where: string },
  ) => {
    if (!effects) return;
    for (const effect of effects) out.push({ ...ctx, effect });
  };

  for (const chapter of Object.values(bundle.chapters)) {
    const base = { chapterId: chapter.id, chapterTitle: chapter.title };
    for (const node of Object.values(chapter.nodes)) {
      const n = { ...base, nodeId: node.id, nodeType: node.type };
      switch (node.type) {
        case 'message':
        case 'action':
        case 'unlockMessage':
        case 'shareContact':
        case 'event':
        case 'chapterEnd':
          push(node.effects, { ...n, where: 'nó' });
          break;
        case 'choice':
          node.options.forEach((opt) =>
            push(opt.effects, { ...n, where: `opção "${opt.text || opt.id}"` }),
          );
          break;
        case 'call':
          push(node.onAnswer?.effects, { ...n, where: 'ao atender' });
          push(node.onDecline?.effects, { ...n, where: 'ao recusar' });
          break;
        case 'callScene':
          push(node.effects, { ...n, where: 'ligação · ao atender' });
          push(node.onDecline?.effects, { ...n, where: 'ligação · ao recusar' });
          push(node.onTimeout?.effects, { ...n, where: 'ligação · ao não atender' });
          for (const st of Object.values(node.scene ?? {})) {
            if (st.type === 'audio' || st.type === 'action' || st.type === 'hangup')
              push(st.effects, { ...n, where: `ligação · ${st.type} "${st.id}"` });
            else if (st.type === 'choice')
              st.options.forEach((opt) =>
                push(opt.effects, { ...n, where: `ligação · resposta "${opt.text || opt.id}"` }),
              );
          }
          break;
        default:
          break;
      }
    }
  }
  return out;
}

/** Walk every chapter node + endings registry and collect ALL leaf conditions. */
export function scanConditions(bundle: Bundle): ConditionHit[] {
  const out: ConditionHit[] = [];
  const push = (
    cond: Condition | undefined,
    ctx: { chapterId: string; chapterTitle: string; nodeId: string; nodeType: string; where: string },
  ) => {
    for (const leaf of flattenCondition(cond)) out.push({ ...ctx, condition: leaf });
  };

  for (const chapter of Object.values(bundle.chapters)) {
    const base = { chapterId: chapter.id, chapterTitle: chapter.title };
    for (const node of Object.values(chapter.nodes)) {
      const n = { ...base, nodeId: node.id, nodeType: node.type };
      switch (node.type) {
        case 'choice':
          node.options.forEach((opt) =>
            push(opt.condition, { ...n, where: `opção "${opt.text || opt.id}"` }),
          );
          break;
        case 'branch':
          node.branches.forEach((br, i) =>
            push(br.condition, { ...n, where: `ramo ${i + 1}` }),
          );
          break;
        case 'event':
          push(node.condition, { ...n, where: 'evento' });
          break;
        case 'chapterEnd':
          push(node.requirement, { ...n, where: 'requisito do capítulo' });
          break;
        case 'callScene':
          for (const st of Object.values(node.scene ?? {})) {
            if (st.type === 'choice')
              st.options.forEach((opt) =>
                push(opt.condition, { ...n, where: `ligação · resposta "${opt.text || opt.id}"` }),
              );
            else if (st.type === 'branch')
              st.branches.forEach((br, i) =>
                push(br.condition, { ...n, where: `ligação · ramo ${i + 1}` }),
              );
          }
          break;
        default:
          break;
      }
    }
  }

  // Registry-level: ending conditions (not tied to a node → not clickable).
  for (const ending of Object.values(bundle.endings)) {
    for (const leaf of flattenCondition(ending.condition)) {
      out.push({ where: `final "${ending.title || ending.id}"`, condition: leaf });
    }
  }

  return out;
}

// ---- node ordering (BFS from chapter entry) -------------------------------

/** Outgoing target node ids for a node (the flow's forward edges). */
export function outgoingTargets(n: StoryNode): string[] {
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
    case 'chapterEnd':
      return n.next ? [n.next] : [];
    case 'event':
      return [n.onEvent ?? '', n.next ?? ''].filter(Boolean);
    case 'fork':
      return n.outputs.filter(Boolean);
    case 'choice':
      return n.options.map((o) => o.next).filter(Boolean);
    case 'branch':
      return [...n.branches.map((b) => b.next), n.fallback ?? ''].filter(Boolean);
    case 'call':
      return [n.onAnswer?.next ?? '', n.onDecline?.next ?? ''].filter(Boolean);
    default:
      return [];
  }
}

/**
 * Node ids of a chapter ordered by a BFS from `entry` following forward edges,
 * with any unreached nodes appended in object order.
 */
export function orderedNodeIds(chapter: { entry: string; nodes: Record<string, StoryNode> }): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const queue: string[] = chapter.entry && chapter.nodes[chapter.entry] ? [chapter.entry] : [];
  if (queue.length) seen.add(queue[0]);

  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    const node = chapter.nodes[id];
    if (!node) continue;
    for (const t of outgoingTargets(node)) {
      if (!seen.has(t) && chapter.nodes[t]) {
        seen.add(t);
        queue.push(t);
      }
    }
  }
  // Append unreached nodes in object order.
  for (const id of Object.keys(chapter.nodes)) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}

// ---- story-order ranking ---------------------------------------------------

/** Per-chapter map: chapterId → (nodeId → BFS index). Built once, reused. */
export function buildNodeRanks(bundle: Bundle): Map<string, Map<string, number>> {
  const m = new Map<string, Map<string, number>>();
  for (const ch of Object.values(bundle.chapters)) {
    m.set(ch.id, new Map(orderedNodeIds(ch).map((id, i) => [id, i])));
  }
  return m;
}

/** chapterId → position in chapterOrder (chapters outside it sort last, stable). */
export function chapterRank(bundle: Bundle): Map<string, number> {
  return new Map(bundle.chapterOrder.map((id, i) => [id, i]));
}

const BIG = Number.MAX_SAFE_INTEGER;

/** Global story-order key for a hit. Lexicographic compare gives play order. */
export function orderKeyOf(
  hit: { chapterId?: string; nodeId?: string },
  chRank: Map<string, number>,
  nodeRanks: Map<string, Map<string, number>>,
): [number, number] {
  const c = hit.chapterId ? chRank.get(hit.chapterId) ?? BIG : BIG;
  const n =
    hit.chapterId && hit.nodeId ? nodeRanks.get(hit.chapterId)?.get(hit.nodeId) ?? BIG : BIG;
  return [c, n];
}

export function compareOrderKey(a: [number, number], b: [number, number]): number {
  return a[0] - b[0] || a[1] - b[1];
}

// ---- effect-hit ordering + first/last/net ---------------------------------

/** Sort a copy of effect hits into story order. */
export function sortEffectHits(
  bundle: Bundle,
  hits: EffectHit[],
  chRank = chapterRank(bundle),
  nodeRanks = buildNodeRanks(bundle),
): EffectHit[] {
  return [...hits].sort((a, b) =>
    compareOrderKey(orderKeyOf(a, chRank, nodeRanks), orderKeyOf(b, chRank, nodeRanks)),
  );
}

export type VarMagnitudeKind = 'trust' | 'ending' | 'money';

/**
 * Signed numeric net for kinds that have a magnitude; null otherwise so the UI
 * knows to render the descriptor card instead of a number.
 *   trust  → sum of trust.delta
 *   ending → sum of lockEndingScore.delta (setEnding contributes 0)
 *   money  → sum of money.amount
 */
export function netNumericDelta(hits: EffectHit[], kind: VarMagnitudeKind): number {
  let sum = 0;
  for (const h of hits) {
    const e = h.effect;
    if (kind === 'trust' && e.type === 'trust') sum += e.delta;
    else if (kind === 'ending' && e.type === 'lockEndingScore') sum += e.delta;
    else if (kind === 'money' && e.type === 'money') sum += e.amount;
  }
  return sum;
}

/** In story order, the signed magnitude of each hit that carries one (trust/ending/money). */
export function deltaSeries(
  bundle: Bundle,
  hits: EffectHit[],
  kind: VarMagnitudeKind,
): number[] {
  return sortEffectHits(bundle, hits)
    .map((h) => {
      const e = h.effect;
      if (kind === 'trust' && e.type === 'trust') return e.delta;
      if (kind === 'ending' && e.type === 'lockEndingScore') return e.delta;
      if (kind === 'money' && e.type === 'money') return e.amount;
      return null;
    })
    .filter((d): d is number => d !== null);
}

// ---- fork enumeration (Bifurcações diagram) -------------------------------

export interface ForkPath {
  /** Player-spoken/displayed label for a choice option; rule text for a branch ramo. */
  label: string;
  /** True when this option produces NO bubble (player stays silent). */
  silent?: boolean;
  /** Condition gating a choice option (a lock) — undefined if always available. */
  gate?: Condition;
  /** For branch ramos: the condition that routes here. */
  branchCond?: Condition;
  /** Effects fired by a choice option (for "faz: …"). */
  effects?: Effect[];
  /** Target node id ('' when unset). */
  target: string;
  /** True for the branch's fallback ("senão") row. */
  fallback?: boolean;
}

export interface Fork {
  kind: 'choice' | 'branch';
  nodeId: string;
  nodeType: string;
  /** choice → its prompt (or ''); branch → '' (UI supplies the fixed subtitle). */
  prompt: string;
  paths: ForkPath[];
}

/** Enumerate a choice/branch node into a uniform fork shape. Returns null otherwise. */
export function enumerateFork(node: StoryNode): Fork | null {
  if (node.type === 'choice') {
    return {
      kind: 'choice',
      nodeId: node.id,
      nodeType: node.type,
      prompt: node.prompt ?? '',
      paths: node.options.map((o) => ({
        label: o.silent ? '' : o.say || o.text || o.id,
        silent: o.silent,
        gate: o.condition,
        effects: o.effects,
        target: o.next,
      })),
    };
  }
  if (node.type === 'branch') {
    const paths: ForkPath[] = node.branches.map((b) => ({
      label: '',
      branchCond: b.condition,
      target: b.next,
    }));
    paths.push({ label: '', target: node.fallback ?? '', fallback: true });
    return { kind: 'branch', nodeId: node.id, nodeType: node.type, prompt: '', paths };
  }
  return null;
}

/** Short human label for a target node: its NODE_LABEL, or 'inexistente'/'sem destino'. */
export function targetInfo(
  target: string,
  nodes: Record<string, StoryNode>,
): { ok: boolean; label: string } {
  if (!target) return { ok: false, label: 'sem destino' };
  const n = nodes[target];
  if (!n) return { ok: false, label: 'destino inexistente' };
  return { ok: true, label: NODE_LABEL[n.type as keyof typeof NODE_LABEL] ?? n.type };
}

// ============================================================================
// Playtime model + story-wide stats + QA (Visão geral)
// ============================================================================

/** Word count of a string: trimmed, split on whitespace, empty → 0. */
export function wordCount(s: string | undefined): number {
  if (!s) return 0;
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Every PLAYER-READ string of a node, in 'all' (full-content) or 'first'
 * (typical-path: choice counts prompt + first option only; call drops the
 * voicemail line because the typical path answers). Author-only fields excluded.
 */
export function nodeReadStrings(n: StoryNode, mode: 'first' | 'all'): string[] {
  switch (n.type) {
    case 'message':
      return [n.text, n.attachment?.label].filter(Boolean) as string[];
    case 'choice': {
      const opts = mode === 'all'
        ? n.options.map((o) => o.say || o.text)
        : n.options.length ? [n.options[0].say || n.options[0].text] : [];
      return [n.prompt, ...opts].filter(Boolean) as string[];
    }
    case 'shareContact':
      return [n.text].filter(Boolean) as string[];
    case 'call': {
      const lines = [...(n.transcript ?? [])];
      if (mode === 'all' && n.voicemailText) lines.push(n.voicemailText);
      return lines.filter(Boolean);
    }
    case 'notification':
      return [n.title, n.body].filter(Boolean) as string[];
    case 'event':
      return [n.text].filter(Boolean) as string[];
    default:
      return [];
  }
}

/** Word count of all player-read text in a node (full-content counting). */
export function nodeWords(n: StoryNode): number {
  return nodeReadStrings(n, 'all').reduce((a, s) => a + wordCount(s), 0);
}

/**
 * Predicted-playtime tuning. Times in ms unless the field says "Sec".
 * Conservative (never under-promise). Surfaced verbatim in the UI as
 * "pressupostos" so the estimate is auditable.
 */
export interface PaceModel {
  /**
   * Player reading speed, words/min. 200 ≈ adult fiction silent-reading (~260 wpm,
   * Brysbaert 2019 meta-analysis of 190 studies) minus ~20–25% for reading on a
   * phone screen (screen reading is consistently ~20–25% slower than paper).
   */
  wpm: number;
  reactionMs: number;      // gap after a bubble lands before the player reacts. 1200.
  defaultTypingMs: number; // message/shareContact typing fallback when no typingMs. 1400 (game default).
  choiceThinkMs: number;   // deliberation at a choice, on top of reading the options. 4000.
  callBaseMs: number;      // fixed ring/connect/greeting/hangup overhead per answered call. 8000.
  notificationMs: number;  // glance cost of a heads-up banner when no durationSec. 1500.
  activityFallbackSec: number; // activity node with no seconds. 3.
  delayFallbackSec: number;    // delay node with no seconds. 5.
  itemOpenMs: number;      // open/navigate/glance to one app item (news/post/blog/evidence). 3000.
  photoViewSec: number;    // extra time looking at a photo/screenshot evidence. 4.
}
export const DEFAULT_PACE: PaceModel = {
  wpm: 200, reactionMs: 1200, defaultTypingMs: 1400, choiceThinkMs: 4000,
  callBaseMs: 8000, notificationMs: 1500, activityFallbackSec: 3, delayFallbackSec: 5,
  itemOpenMs: 3000, photoViewSec: 4,
};

export type PaceCategory = 'leitura' | 'ritmo' | 'esperas' | 'atividades' | 'ligacoes' | 'escolhas' | 'exploracao';
export type Breakdown = Record<PaceCategory, number>; // all ms

export function emptyBreakdown(): Breakdown {
  return { leitura: 0, ritmo: 0, esperas: 0, atividades: 0, ligacoes: 0, escolhas: 0, exploracao: 0 };
}
export function addBreakdown(a: Breakdown, b: Breakdown): Breakdown {
  return {
    leitura: a.leitura + b.leitura, ritmo: a.ritmo + b.ritmo, esperas: a.esperas + b.esperas,
    atividades: a.atividades + b.atividades, ligacoes: a.ligacoes + b.ligacoes,
    escolhas: a.escolhas + b.escolhas, exploracao: a.exploracao + b.exploracao,
  };
}
export function sumBreakdown(b: Breakdown): number {
  return b.leitura + b.ritmo + b.esperas + b.atividades + b.ligacoes + b.escolhas + b.exploracao;
}
function readMs(words: number, m: PaceModel): number {
  return (words / m.wpm) * 60000;
}

/**
 * In-game time cost of ONE node, bucketed into the 6 categories.
 * `branch='first'` = typical-path (one choice option); `branch='all'` = full content.
 */
export function nodeCost(n: StoryNode, m: PaceModel, branch: 'first' | 'all'): Breakdown {
  const b = emptyBreakdown();
  const words = nodeReadStrings(n, branch).reduce((a, s) => a + wordCount(s), 0);
  switch (n.type) {
    case 'message':
      b.ritmo += (n.typingMs ?? m.defaultTypingMs) + m.reactionMs;
      b.leitura += readMs(words, m);
      if (n.attachment && (n.attachment.kind === 'audio' || n.attachment.kind === 'video')) {
        b.atividades += (n.attachment.durationSec ?? 0) * 1000; // player listens/watches
      }
      break;
    case 'shareContact':
      b.ritmo += (n.typingMs ?? m.defaultTypingMs) + m.reactionMs;
      b.leitura += readMs(words, m);
      break;
    case 'choice':
      b.leitura += readMs(words, m);   // prompt + option(s) on screen
      b.escolhas += m.choiceThinkMs;
      break;
    case 'call':
      b.ligacoes += m.callBaseMs;
      b.leitura += readMs(words, m);   // reading the on-screen lines
      break;
    case 'notification':
      b.ritmo += n.durationSec ? n.durationSec * 1000 : m.notificationMs;
      b.leitura += readMs(words, m);
      break;
    case 'activity':
      b.atividades += (n.seconds ?? m.activityFallbackSec) * 1000;
      break;
    case 'delay':
      b.esperas += (n.seconds ?? m.delayFallbackSec) * 1000;
      break;
    case 'event':
      // Only an answered player-call event shows on-screen time; otherwise structural.
      if (n.outcome === 'answered') {
        b.ligacoes += n.hangUpAfterMs ?? 0;
        b.leitura += readMs(words, m);
      }
      break;
    // action, branch, unlockMessage, publishNews, publishPost, publishStory,
    // offerBlog, bank, removeEvent, fork, chapterEnd → instant/structural, 0.
    default:
      break;
  }
  return b;
}

/** nodeId → owning chapterId (first owner wins) — lets the walk resolve cross-chapter `next`. */
export function buildGlobalNodeIndex(bundle: Bundle): Map<string, string> {
  const idx = new Map<string, string>();
  for (const ch of Object.values(bundle.chapters)) {
    for (const id of Object.keys(ch.nodes)) if (!idx.has(id)) idx.set(id, ch.id);
  }
  return idx;
}

/** The single next node a typical playthrough takes from `n` (or '' to end this leg). */
function typicalNext(n: StoryNode): string {
  switch (n.type) {
    case 'choice':
      return n.options[0]?.next ?? '';
    case 'branch':
      return n.branches.find((b) => b.next)?.next ?? n.fallback ?? '';
    case 'fork':
      return n.outputs.find(Boolean) ?? '';
    case 'call':
      return n.onAnswer?.next ?? n.onDecline?.next ?? '';
    case 'event':
      return n.next || n.onEvent || '';
    case 'chapterEnd':
      return ''; // handled by the chapter hop in walkTypicalPath
    default:
      return (n as { next?: string }).next ?? '';
  }
}

export interface PlaytimeResult {
  cost: Breakdown;
  nodeCount: number;
  chaptersVisited: string[];
  truncatedByLoop: boolean;
  reachedEnd: boolean;
}

/** Walk ONE representative path from meta.startChapter, visited-guarded. */
export function walkTypicalPath(bundle: Bundle, m: PaceModel): PlaytimeResult {
  const idx = buildGlobalNodeIndex(bundle);
  let cost = emptyBreakdown();
  let nodeCount = 0;
  const chaptersVisited: string[] = [];
  const visited = new Set<string>();

  let chId = bundle.meta.startChapter && bundle.chapters[bundle.meta.startChapter]
    ? bundle.meta.startChapter
    : bundle.chapterOrder.find((id) => bundle.chapters[id]) ?? '';
  let ch = bundle.chapters[chId];
  if (!ch) return { cost, nodeCount, chaptersVisited, truncatedByLoop: false, reachedEnd: false };
  chaptersVisited.push(chId);
  let cur = ch.entry;

  const advanceChapter = (fromEnd?: StoryNode): boolean => {
    // chapterEnd with `next` may point into another chapter (or same); else go to next in chapterOrder.
    if (fromEnd && fromEnd.type === 'chapterEnd') {
      if (fromEnd.ending) return false; // ending → stop
      if (fromEnd.next) {
        const targetCh = idx.get(fromEnd.next);
        if (targetCh && bundle.chapters[targetCh]) {
          chId = targetCh; ch = bundle.chapters[chId];
          if (!chaptersVisited.includes(chId)) chaptersVisited.push(chId);
          cur = fromEnd.next; return true;
        }
      }
    }
    const i = bundle.chapterOrder.indexOf(chId);
    const nextId = i >= 0 ? bundle.chapterOrder[i + 1] : undefined;
    if (!nextId || !bundle.chapters[nextId]) return false;
    chId = nextId; ch = bundle.chapters[chId]; chaptersVisited.push(chId); cur = ch.entry;
    return true;
  };

  while (cur) {
    const key = `${chId}:${cur}`;
    if (visited.has(key)) {
      return { cost, nodeCount, chaptersVisited, truncatedByLoop: true, reachedEnd: false };
    }
    visited.add(key);
    const node = ch.nodes[cur];
    if (!node) {
      // cur may be a bare id in another chapter (cross-chapter next)
      const owner = idx.get(cur);
      if (owner && owner !== chId && bundle.chapters[owner]) {
        chId = owner; ch = bundle.chapters[chId];
        if (!chaptersVisited.includes(chId)) chaptersVisited.push(chId);
        continue; // re-resolve with the same cur
      }
      break;
    }
    cost = addBreakdown(cost, nodeCost(node, m, 'first'));
    nodeCount += 1;

    if (node.type === 'chapterEnd') {
      if (!advanceChapter(node)) return { cost, nodeCount, chaptersVisited, truncatedByLoop: false, reachedEnd: true };
      continue;
    }
    const next = typicalNext(node);
    if (next && ch.nodes[next]) { cur = next; continue; }
    if (next) {
      // resolve cross-chapter
      const owner = idx.get(next);
      if (owner && bundle.chapters[owner]) {
        chId = owner; ch = bundle.chapters[chId];
        if (!chaptersVisited.includes(chId)) chaptersVisited.push(chId);
        cur = next; continue;
      }
    }
    // no in-chapter next → try to roll to the next chapter; else stop
    if (!advanceChapter()) return { cost, nodeCount, chaptersVisited, truncatedByLoop: false, reachedEnd: true };
  }
  return { cost, nodeCount, chaptersVisited, truncatedByLoop: false, reachedEnd: true };
}

/** Sum nodeCost(...,'all') over EVERY node in EVERY chapter — explicit upper bound. */
export function fullContentCost(bundle: Bundle, m: PaceModel): Breakdown {
  let total = emptyBreakdown();
  for (const ch of Object.values(bundle.chapters)) {
    for (const node of Object.values(ch.nodes)) total = addBreakdown(total, nodeCost(node, m, 'all'));
  }
  return total;
}

/**
 * Time (ms) the player spends EXPLORING the phone apps — reading published news,
 * the Mural feed (post captions + comments), blog articles and opening evidence
 * files (incl. glancing at photos) — plus a per-item open/navigate cost. This IS
 * gameplay (investigating through the phone), so storyTotals folds it into the
 * estimate under the 'exploracao' bucket.
 */
export function explorationCost(bundle: Bundle, m: PaceModel): number {
  let words = 0;
  let opens = 0;
  let photoSec = 0;
  for (const n of Object.values(bundle.news)) {
    words += wordCount(n.headline) + wordCount(n.body);
    opens += 1;
  }
  for (const p of Object.values(bundle.blog ?? {})) {
    words += wordCount(p.title);
    if (p.options?.[0]) words += wordCount(p.options[0].body); // one angle to avoid double-count
    opens += 1;
  }
  for (const p of Object.values(bundle.social)) {
    words += wordCount(p.caption);
    for (const c of p.comments ?? []) words += wordCount(c.text);
    opens += 1;
  }
  for (const e of Object.values(bundle.evidence)) {
    words += wordCount(e.title) + wordCount(e.description) + wordCount(e.body) + wordCount(e.caseRelevance);
    opens += 1;
    if (e.kind === 'photo' || e.kind === 'screenshot') photoSec += m.photoViewSec;
  }
  return readMs(words, m) + opens * m.itemOpenMs + photoSec * 1000;
}

/** Node ids reached by BFS from entry (the clean reachable SET; orderedNodeIds appends unreached). */
export function reachableNodeIds(chapter: { entry: string; nodes: Record<string, StoryNode> }): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = chapter.entry && chapter.nodes[chapter.entry] ? [chapter.entry] : [];
  if (queue.length) seen.add(queue[0]);
  while (queue.length) {
    const node = chapter.nodes[queue.shift()!];
    if (!node) continue;
    for (const t of outgoingTargets(node)) {
      if (t && !seen.has(t) && chapter.nodes[t]) { seen.add(t); queue.push(t); }
    }
  }
  return seen;
}

export interface ChapterStat {
  id: string; title: string; entry: string;
  nodeCount: number; words: number; choices: number;
  fullSeconds: number;          // sum of node full-content cost (sec)
  unreachable: string[];        // node ids not reached from entry (clickable)
  hasChapterEnd: boolean;
}
/** Per-chapter rollup in chapterOrder (leftovers appended stably). */
export function chapterStats(bundle: Bundle, m: PaceModel): ChapterStat[] {
  const order = [
    ...bundle.chapterOrder.filter((id) => bundle.chapters[id]),
    ...Object.keys(bundle.chapters).filter((id) => !bundle.chapterOrder.includes(id)),
  ];
  return order.map((id) => {
    const ch = bundle.chapters[id];
    const nodes = Object.values(ch.nodes);
    const reached = reachableNodeIds(ch);
    let ms = 0;
    for (const n of nodes) ms += sumBreakdown(nodeCost(n, m, 'all'));
    return {
      id, title: ch.title, entry: ch.entry,
      nodeCount: nodes.length,
      words: nodes.reduce((a, n) => a + nodeWords(n), 0),
      choices: nodes.filter((n) => n.type === 'choice').length,
      fullSeconds: ms / 1000,
      unreachable: Object.keys(ch.nodes).filter((nid) => !reached.has(nid)),
      hasChapterEnd: nodes.some((n) => n.type === 'chapterEnd'),
    };
  });
}

export interface NodeTypeCount { type: NodeType; label: string; count: number; }
/** Count of nodes per type across all chapters, DESC by count then label; zeros omitted. */
export function nodeTypeCounts(bundle: Bundle): NodeTypeCount[] {
  const counts = new Map<NodeType, number>();
  for (const ch of Object.values(bundle.chapters)) {
    for (const n of Object.values(ch.nodes)) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, label: NODE_LABEL[type], count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export interface StoryTotals {
  chapters: number; nodes: number; words: number; choices: number;
  branches: number; forks: number; events: number;
  characters: number; evidence: number; endings: number;
  pathSeconds: number; fullSeconds: number; explorationSeconds: number;
  pathBreakdown: Breakdown;     // typical-path category split (sec per category)
  truncatedByLoop: boolean; reachedEnd: boolean;
}
export function storyTotals(bundle: Bundle, m: PaceModel = DEFAULT_PACE): StoryTotals {
  const allNodes = Object.values(bundle.chapters).flatMap((c) => Object.values(c.nodes));
  const walk = walkTypicalPath(bundle, m);
  const full = fullContentCost(bundle, m);
  // App exploration (news/feed/blog/evidence) is path-independent here, so it's
  // added to BOTH the typical path and the full-content figure.
  const exploreMs = explorationCost(bundle, m);
  const pathCost: Breakdown = { ...walk.cost, exploracao: walk.cost.exploracao + exploreMs };
  const fullCost: Breakdown = { ...full, exploracao: full.exploracao + exploreMs };
  const toSec = (b: Breakdown): Breakdown => ({
    leitura: b.leitura / 1000, ritmo: b.ritmo / 1000, esperas: b.esperas / 1000,
    atividades: b.atividades / 1000, ligacoes: b.ligacoes / 1000, escolhas: b.escolhas / 1000,
    exploracao: b.exploracao / 1000,
  });
  return {
    chapters: Object.keys(bundle.chapters).length,
    nodes: allNodes.length,
    words: allNodes.reduce((a, n) => a + nodeWords(n), 0),
    choices: allNodes.filter((n) => n.type === 'choice').length,
    branches: allNodes.filter((n) => n.type === 'branch').length,
    forks: allNodes.filter((n) => n.type === 'fork').length,
    events: allNodes.filter((n) => n.type === 'event').length,
    characters: Object.keys(bundle.characters).length,
    evidence: Object.keys(bundle.evidence).length,
    endings: Object.keys(bundle.endings).length,
    pathSeconds: sumBreakdown(pathCost) / 1000,
    fullSeconds: sumBreakdown(fullCost) / 1000,
    explorationSeconds: exploreMs / 1000,
    pathBreakdown: toSec(pathCost),
    truncatedByLoop: walk.truncatedByLoop,
    reachedEnd: walk.reachedEnd,
  };
}

export interface DanglingHit { chapterId: string; chapterTitle: string; nodeId: string; nodeType: NodeType; target: string; }
/** Every outgoingTargets() entry pointing at a node id absent from its chapter ('' targets ignored). */
export function scanDangling(bundle: Bundle): DanglingHit[] {
  const out: DanglingHit[] = [];
  for (const ch of Object.values(bundle.chapters)) {
    for (const node of Object.values(ch.nodes)) {
      for (const t of outgoingTargets(node)) {
        if (t && !ch.nodes[t]) out.push({ chapterId: ch.id, chapterTitle: ch.title, nodeId: node.id, nodeType: node.type, target: t });
      }
    }
  }
  return out;
}

/** Friendly duration. <90s → "< 2 min"; ≥1h rolls over. Returns rounded mins + label. */
export function fmtDuration(seconds: number): { mins: number; label: string } {
  if (!isFinite(seconds) || seconds < 90) return { mins: seconds < 60 ? 1 : Math.round(seconds / 60), label: '< 2 min' };
  const mins = Math.round(seconds / 60);
  if (mins < 60) return { mins, label: `≈ ${mins} min` };
  const h = Math.floor(mins / 60), r = mins % 60;
  return { mins, label: r ? `≈ ${h} h ${r} min` : `≈ ${h} h` };
}
