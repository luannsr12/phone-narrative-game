import React, { useMemo, useState } from 'react';
import {
  Search,
  BarChart3,
  User,
  GitFork,
  MessageSquare,
  FolderOpen,
  Pencil,
  Sigma,
  Flag,
  Handshake,
  Repeat,
  Lock,
  Contact,
  MessagesSquare,
  FileText,
  Clapperboard,
  Banknote,
  Circle,
  CircleDot,
  CircleSlash,
  PenLine,
  BookMarked,
  Newspaper,
  Megaphone,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Zap,
  VolumeX,
  LayoutDashboard,
  Timer,
  Layers,
  Boxes,
  Type,
  Users,
  BookOpen,
  Hourglass,
  Stethoscope,
  EyeOff,
  FlagOff,
  CheckCircle2,
  Unplug,
  Info,
  Phone,
  ListChecks,
  Radio,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { useEditor } from '../store';
import type { Bundle, Condition, Effect, StoryNode } from '../types';
import { NODE_LABEL } from '../types';
import { Field, TextInput, Select, CharacterSelect } from '../inspector/fields';
import {
  describeCondition,
  describeEffect,
  normalize,
  orderedNodeIds,
  scanConditions,
  scanEffects,
  sortEffectHits,
  netNumericDelta,
  deltaSeries,
  enumerateFork,
  targetInfo,
  type VarMagnitudeKind,
  type ForkPath,
} from './auditScan';
import { NODE_ICON, NODE_ACCENT } from '../ui/icons';
import {
  storyTotals, chapterStats, nodeTypeCounts, scanDangling, fmtDuration,
  DEFAULT_PACE, type PaceCategory,
} from './auditScan';

type Mode = 'overview' | 'text' | 'vars' | 'character' | 'branches';

const MODES: { value: Mode; label: string; icon: LucideIcon }[] = [
  { value: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { value: 'text', label: 'Texto', icon: Search },
  { value: 'vars', label: 'Variáveis', icon: BarChart3 },
  { value: 'character', label: 'Personagem', icon: User },
  { value: 'branches', label: 'Bifurcações', icon: GitFork },
];

const LEDE: Record<Mode, string> = {
  overview: 'Um retrato da história inteira — tamanho, ritmo e tempo de jogo estimado.',
  text: 'Procure qualquer palavra na história — ignora acentos e maiúsculas.',
  vars: 'Veja quantas vezes uma variável muda, quando muda pela última vez e onde decide um caminho.',
  character: 'Acompanhe um personagem capítulo a capítulo: confiança, desbloqueio e travas.',
  branches: 'Veja os caminhos que se abrem a partir de cada escolha do jogador ou decisão automática.',
};

export function AuditPanel() {
  const [mode, setMode] = useState<Mode>('overview');
  return (
    <div className="audit">
      <div className="audit-modes">
        {MODES.map((m) => {
          const Ico = m.icon;
          return (
            <button
              key={m.value}
              className={`tab ${mode === m.value ? 'active' : ''}`}
              aria-current={mode === m.value ? 'page' : undefined}
              onClick={() => setMode(m.value)}
            >
              <Ico size={14} strokeWidth={1.75} /> {m.label}
            </button>
          );
        })}
      </div>
      <p className="audit-lede">{LEDE[mode]}</p>
      {mode === 'overview' ? <OverviewMode /> : null}
      {mode === 'text' ? <TextMode /> : null}
      {mode === 'vars' ? <VarsMode /> : null}
      {mode === 'character' ? <CharacterMode /> : null}
      {mode === 'branches' ? <BranchesMode /> : null}
    </div>
  );
}

const PACE_CAT_META: { key: PaceCategory; label: string; ico: LucideIcon }[] = [
  { key: 'leitura', label: 'leitura', ico: BookOpen },
  { key: 'ritmo', label: 'ritmo do chat', ico: MessagesSquare },
  { key: 'esperas', label: 'esperas', ico: Hourglass },
  { key: 'atividades', label: 'atividades', ico: PenLine },
  { key: 'ligacoes', label: 'ligações', ico: Phone },
  { key: 'escolhas', label: 'escolhas', ico: ListChecks },
  { key: 'exploracao', label: 'exploração (apps)', ico: Compass },
];

/** Visão geral — story-wide stats, predicted playtime and QA health. */
function OverviewMode() {
  const bundle = useEditor((s) => s.bundle);
  const goToNode = useEditor((s) => s.goToNode);

  const t = useMemo(() => storyTotals(bundle, DEFAULT_PACE), [bundle]);
  const chs = useMemo(() => chapterStats(bundle, DEFAULT_PACE), [bundle]);
  const types = useMemo(() => nodeTypeCounts(bundle), [bundle]);
  const dangling = useMemo(() => scanDangling(bundle), [bundle]);
  const maxWords = useMemo(() => Math.max(1, ...chs.map((c) => c.words)), [chs]);

  const noEnd = chs.filter((c) => !c.hasChapterEnd);
  const withUnreachable = chs.filter((c) => c.unreachable.length);
  const allClean = !dangling.length && !noEnd.length && !withUnreachable.length;

  return (
    <div className="audit-results">
      {/* BAND 1 — HERO */}
      <div className="audit-hero">
        <StatCard ico={Timer} variant="is-accent"
          num={fmtDuration(t.pathSeconds).label}
          label="de gameplay (caminho típico)"
          foot={<><Layers size={11} strokeWidth={1.75} /> completo: {fmtDuration(t.fullSeconds).label} · todas as ramificações</>} />
        <StatCard ico={BookMarked} num={t.chapters} label="capítulos" />
        <StatCard ico={Boxes} num={t.nodes} label="nós no total" />
        <StatCard ico={Type} num={t.words.toLocaleString('pt-BR')} label="palavras" />
        <StatCard ico={ListChecks} variant="is-pos" num={t.choices} label="escolhas do jogador" />
        <StatCard ico={GitFork} variant="is-warn" num={t.branches + t.forks}
          label="ramificações automáticas" foot={`${t.branches} condição · ${t.forks} paralelo`} />
        <StatCard ico={Users} variant="is-blue" num={t.characters} label="personagens" />
        <StatCard ico={FileText} num={t.evidence} label="evidências" />
        <StatCard ico={Clapperboard} num={t.endings} label="finais" />
        {t.events > 0 ? <StatCard ico={Radio} num={t.events} label="eventos" /> : null}
      </div>

      {/* BAND 2 — RITMO / PRESSUPOSTOS */}
      <div className="audit-assume">
        {PACE_CAT_META.map(({ key, label, ico: Ico }) => (
          <span key={key} className="audit-assume-chip">
            <Ico size={12} strokeWidth={1.75} /> {label} {fmtDuration(t.pathBreakdown[key]).label}
          </span>
        ))}
        <span className="audit-assume-note">
          <Info size={11} strokeWidth={1.75} /> Estimativas — leitura a {DEFAULT_PACE.wpm} ppm (ficção ~260 ppm, Brysbaert 2019, −~22% por ser em tela), digitação ~{Math.round(DEFAULT_PACE.defaultTypingMs / 1000 * 10) / 10}s, decisão ~{DEFAULT_PACE.choiceThinkMs / 1000}s.
          Exploração ({fmtDuration(t.explorationSeconds).label}) assume que o jogador lê as notícias/posts/blog e abre as evidências.
          {t.truncatedByLoop ? ' O caminho típico parou num laço — número parcial.' : ''}
        </span>
      </div>

      {/* BAND 3 — TIPOS DE NÓ */}
      <h4 className="audit-group-title"><Boxes size={13} strokeWidth={1.75} /> Tipos de nó</h4>
      <div className="audit-typebar">
        {types.map((tc) => {
          const Ico = NODE_ICON[tc.type];
          return (
            <div key={tc.type} className="audit-typebar-item"
              style={{ ['--accent' as string]: NODE_ACCENT[tc.type] }}>
              <span className="audit-typebar-ico"><Ico size={13} strokeWidth={1.75} /></span>
              <span className="audit-typebar-n">{tc.count}</span>
              <span className="audit-typebar-l">{tc.label}</span>
            </div>
          );
        })}
      </div>

      {/* BAND 4 — POR CAPÍTULO */}
      <h4 className="audit-group-title"><BookMarked size={13} strokeWidth={1.75} /> Por capítulo</h4>
      <div className="audit-table">
        <div className="audit-table-head">
          <span>Capítulo</span><span>Nós</span><span>Palavras</span><span>≈ tempo</span><span>Escolhas</span><span>Saúde</span>
        </div>
        {chs.map((c) => (
          <button key={c.id} className="audit-table-row" onClick={() => goToNode(c.id, c.entry)}>
            <span className="audit-table-name">
              {c.title} <IdChip id={c.id} />
              <span className="audit-table-bar"><span style={{ width: `${(c.words / maxWords) * 100}%` }} /></span>
            </span>
            <span>{c.nodeCount}</span>
            <span>{c.words.toLocaleString('pt-BR')}</span>
            <span>{fmtDuration(c.fullSeconds).label}</span>
            <span>{c.choices}</span>
            <span className="audit-table-health">
              {c.unreachable.length ? <span className="audit-warn-chip"><AlertTriangle size={11} strokeWidth={1.75} /> {c.unreachable.length} inalcançável</span> : null}
              {!c.hasChapterEnd ? <span className="audit-warn-chip"><FlagOff size={11} strokeWidth={1.75} /> sem fim</span> : null}
              {c.unreachable.length === 0 && c.hasChapterEnd ? <CheckCircle2 size={13} strokeWidth={1.75} style={{ color: 'var(--positive)' }} /> : null}
            </span>
          </button>
        ))}
      </div>

      {/* BAND 5 — SAÚDE DA HISTÓRIA */}
      <h4 className="audit-group-title"><Stethoscope size={13} strokeWidth={1.75} /> Saúde da história</h4>
      {allClean ? (
        <div className="audit-hero">
          <StatCard ico={CheckCircle2} variant="is-empty" num="tudo certo"
            label="nenhum nó solto, inalcançável ou capítulo sem fim" />
        </div>
      ) : (
        <>
          {withUnreachable.map((c) => (
            <div key={c.id} className="audit-tl-chapter">
              <h4 className="audit-group-title">{c.title} <IdChip id={c.id} /></h4>
              <div className="audit-timeline">
                {c.unreachable.map((nid) => {
                  const nt = bundle.chapters[c.id]?.nodes[nid]?.type;
                  return (
                    <button key={nid} className="audit-tl-row" onClick={() => goToNode(c.id, nid)}>
                      <span className="audit-dot gray" />
                      <span className="audit-tl-ico gray"><EyeOff size={13} strokeWidth={1.75} /></span>
                      <span className="audit-tl-text">nó nunca alcançado a partir da entrada</span>
                      <span className="audit-tl-node">
                        <IdChip id={nid} />{nt ? ` · ${NODE_LABEL[nt]}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {noEnd.length ? (
            <>
              <h4 className="audit-group-title"><FlagOff size={13} strokeWidth={1.75} /> Capítulos sem fim de capítulo ({noEnd.length})</h4>
              {noEnd.map((c) => (
                <button key={c.id} className="audit-row" onClick={() => goToNode(c.id, c.entry)}>
                  <span className="audit-where">{c.title} <IdChip id={c.id} /></span>
                  <span className="audit-desc cond"><FlagOff size={12} strokeWidth={1.75} /> nenhum nó "Fim do capítulo" — nunca passa adiante</span>
                </button>
              ))}
            </>
          ) : null}
          {dangling.length ? (
            <>
              <h4 className="audit-group-title"><Unplug size={13} strokeWidth={1.75} /> Destinos quebrados ({dangling.length})</h4>
              {dangling.map((h, i) => (
                <button key={`${h.chapterId}:${h.nodeId}:${i}`} className="audit-row" onClick={() => goToNode(h.chapterId, h.nodeId)}>
                  <span className="audit-where">{h.chapterTitle} <span className="audit-sub">· <IdChip id={h.nodeId} /> · {NODE_LABEL[h.nodeType]}</span></span>
                  <span className="audit-desc cond"><AlertTriangle size={12} strokeWidth={1.75} /> aponta para «{h.target}» (inexistente)</span>
                </button>
              ))}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Small clickable node reference used across modes. */
function NodeRef({
  chapterId,
  nodeId,
  nodeType,
}: {
  chapterId: string;
  nodeId: string;
  nodeType: string;
}) {
  const goToNode = useEditor((s) => s.goToNode);
  return (
    <button className="audit-noderef" onClick={() => goToNode(chapterId, nodeId)}>
      <IdChip id={nodeId} /> · {NODE_LABEL[nodeType as keyof typeof NODE_LABEL] ?? nodeType}
    </button>
  );
}

/** Secondary, dim id chip — used everywhere a raw id appears. */
function IdChip({ id }: { id: string }) {
  return <code className="audit-id">{id}</code>;
}

/** Hero stat card. Renders a button when `onClick` is set, else a div. */
function StatCard({
  ico: Ico,
  num,
  label,
  foot,
  variant,
  onClick,
  title,
}: {
  ico: LucideIcon;
  num: React.ReactNode;
  label: string;
  foot?: React.ReactNode;
  variant?: string;
  onClick?: () => void;
  title?: string;
}) {
  const cls = `audit-stat${variant ? ` ${variant}` : ''}`;
  const body = (
    <>
      <span className="audit-stat-ico">
        <Ico size={16} strokeWidth={1.75} />
      </span>
      <span className="audit-stat-num">{num}</span>
      <span className="audit-stat-label">{label}</span>
      {foot ? <span className="audit-stat-foot">{foot}</span> : null}
    </>
  );
  return onClick ? (
    <button className={cls} onClick={onClick} title={title}>
      {body}
    </button>
  ) : (
    <div className={cls} title={title}>
      {body}
    </div>
  );
}

// ============================================================================
// Mode "Texto" — full-text search
// ============================================================================

interface FlowTextHit {
  key: string;
  chapterId: string;
  chapterTitle: string;
  nodeId: string;
  nodeType: string;
  where: string;
  snippet: React.ReactNode;
}
interface RegistryTextHit {
  key: string;
  registry: string;
  id: string;
  where: string;
  snippet: React.ReactNode;
}

/** Build a ~60-char snippet around the first match, with the match in <mark>. */
function snippetAround(text: string, q: string): React.ReactNode | null {
  const norm = normalize(text);
  const idx = norm.indexOf(q);
  if (idx < 0) return null;
  const pad = 30;
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + q.length + pad);
  const before = (start > 0 ? '…' : '') + text.slice(start, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length, end) + (end < text.length ? '…' : '');
  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}

function TextMode() {
  const bundle = useEditor((s) => s.bundle);
  const [query, setQuery] = useState('');

  const { flow, registry } = useMemo(() => {
    const q = normalize(query.trim());
    const flowHits: FlowTextHit[] = [];
    const regHits: RegistryTextHit[] = [];
    if (!q) return { flow: flowHits, registry: regHits };

    const tryFlow = (
      text: string | undefined,
      ctx: { chapterId: string; chapterTitle: string; nodeId: string; nodeType: string; where: string },
      suffix: string,
    ) => {
      if (!text) return;
      const snip = snippetAround(text, q);
      if (snip) flowHits.push({ key: `${ctx.chapterId}:${ctx.nodeId}:${ctx.where}:${suffix}`, ...ctx, snippet: snip });
    };
    const tryReg = (text: string | undefined, registryName: string, id: string, where: string) => {
      if (!text) return;
      const snip = snippetAround(text, q);
      if (snip) regHits.push({ key: `${registryName}:${id}:${where}`, registry: registryName, id, where, snippet: snip });
    };

    // ---- flow nodes ----
    for (const chapter of Object.values(bundle.chapters)) {
      const base = { chapterId: chapter.id, chapterTitle: chapter.title };
      for (const node of Object.values(chapter.nodes)) {
        const n = { ...base, nodeId: node.id, nodeType: node.type };
        switch (node.type) {
          case 'message':
            tryFlow(node.text, { ...n, where: 'texto' }, 'text');
            break;
          case 'choice':
            tryFlow(node.prompt, { ...n, where: 'pergunta' }, 'prompt');
            node.options.forEach((o, i) => {
              tryFlow(o.text, { ...n, where: `opção ${i + 1}` }, `o${i}t`);
              tryFlow(o.say, { ...n, where: `opção ${i + 1} (fala)` }, `o${i}s`);
            });
            break;
          case 'shareContact':
            tryFlow(node.text, { ...n, where: 'legenda' }, 'text');
            break;
          case 'notification':
            tryFlow(node.title, { ...n, where: 'título' }, 'title');
            tryFlow(node.body, { ...n, where: 'corpo' }, 'body');
            break;
          case 'call':
            (node.transcript ?? []).forEach((line, i) =>
              tryFlow(line, { ...n, where: `transcrição ${i + 1}` }, `t${i}`),
            );
            tryFlow(node.voicemailText, { ...n, where: 'recado de voz' }, 'vm');
            break;
          case 'event':
            tryFlow(node.text, { ...n, where: 'texto do evento' }, 'text');
            break;
          default:
            break;
        }
      }
    }

    // ---- registries ----
    for (const c of Object.values(bundle.characters)) {
      tryReg(c.name, 'Personagem', c.id, 'nome');
      tryReg(c.fullName, 'Personagem', c.id, 'nome completo');
    }
    for (const e of Object.values(bundle.evidence)) {
      tryReg(e.title, 'Evidência', e.id, 'título');
      tryReg(e.description, 'Evidência', e.id, 'descrição');
      tryReg(e.body, 'Evidência', e.id, 'conteúdo');
    }
    for (const n of Object.values(bundle.news)) {
      tryReg(n.headline, 'Notícia', n.id, 'manchete');
      tryReg(n.body, 'Notícia', n.id, 'corpo');
    }
    for (const p of Object.values(bundle.blog ?? {})) {
      tryReg(p.title, 'Blog', p.id, 'título');
      (p.options ?? []).forEach((o, i) => tryReg(o.body, 'Blog', p.id, `ângulo ${i + 1}`));
    }
    for (const p of Object.values(bundle.social)) {
      tryReg(p.caption, 'Mural (post)', p.id, 'legenda');
    }

    return { flow: flowHits, registry: regHits };
  }, [bundle, query]);

  const total = flow.length + registry.length;

  return (
    <>
      <div className="audit-controls">
        <Field label="Buscar palavra ou trecho">
          <TextInput value={query} onChange={setQuery} placeholder="ex.: farol, irmã, Lia…" />
        </Field>
        <div className="audit-count">
          {query.trim() ? `${total} resultado${total === 1 ? '' : 's'}` : ''}
        </div>
      </div>
      {query.trim() && total > 0 ? (
        <div className="audit-hero">
          <StatCard ico={Search} num={total} label="trechos encontrados" variant="is-accent" />
          <StatCard ico={MessageSquare} num={flow.length} label="no roteiro" variant="is-blue" />
          <StatCard ico={FolderOpen} num={registry.length} label="nos registros" variant={undefined} />
        </div>
      ) : null}
      <div className="audit-results">
        {!query.trim() ? (
          <p className="hint">Digite uma palavra — ex.: farol, irmã, Lia. Ignora acentos e maiúsculas.</p>
        ) : total === 0 ? (
          <p className="hint">Nenhum resultado.</p>
        ) : (
          <>
            {flow.length ? (
              <div className="audit-group">
                <h4 className="audit-group-title"><MessageSquare size={13} strokeWidth={1.75} /> No roteiro ({flow.length})</h4>
                {flow.map((h) => (
                  <div key={h.key} className="audit-row static">
                    <span className="audit-where">
                      {h.chapterTitle} — <IdChip id={h.chapterId} />
                    </span>
                    <NodeRef chapterId={h.chapterId} nodeId={h.nodeId} nodeType={h.nodeType} />
                    <span className="audit-sub">{h.where}</span>
                    <span className="audit-snippet">{h.snippet}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {registry.length ? (
              <div className="audit-group">
                <h4 className="audit-group-title"><FolderOpen size={13} strokeWidth={1.75} /> Nos registros ({registry.length})</h4>
                {registry.map((h) => (
                  <div key={h.key} className="audit-row static">
                    <span className="audit-where">
                      {h.registry} — <IdChip id={h.id} /> <span className="audit-sub">· {h.where}</span>
                    </span>
                    <span className="audit-snippet">{h.snippet}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Mode "Variáveis" — where altered vs where used as condition
// ============================================================================

type VarKind =
  | 'flag'
  | 'trust'
  | 'evidence'
  | 'option'
  | 'ending'
  | 'money'
  | 'presence'
  | 'news'
  | 'post'
  | 'story'
  | 'blog'
  | 'timeline'
  | 'chapter';

const VAR_KINDS: { value: VarKind; label: string }[] = [
  { value: 'flag', label: 'Flag' },
  { value: 'trust', label: 'Confiança' },
  { value: 'evidence', label: 'Evidência' },
  { value: 'option', label: 'Opção escolhida' },
  { value: 'ending', label: 'Final' },
  { value: 'money', label: 'Dinheiro' },
  { value: 'presence', label: 'Presença' },
  { value: 'news', label: 'Notícia' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'blog', label: 'Pauta' },
  { value: 'timeline', label: 'Linha do tempo' },
  { value: 'chapter', label: 'Capítulo' },
];

const VAR_META: Record<VarKind, { icon: LucideIcon; word: string }> = {
  flag: { icon: Flag, word: 'liga/desliga' },
  trust: { icon: Handshake, word: 'confiança' },
  evidence: { icon: FileText, word: 'entrega evidência' },
  option: { icon: MessageSquare, word: 'escolha do jogador' },
  ending: { icon: Clapperboard, word: 'pontos de final' },
  money: { icon: Banknote, word: 'dinheiro' },
  presence: { icon: Circle, word: 'online/offline' },
  news: { icon: Newspaper, word: 'publica notícia' },
  post: { icon: Megaphone, word: 'publica post' },
  story: { icon: CircleDot, word: 'publica story' },
  blog: { icon: PenLine, word: 'libera pauta' },
  timeline: { icon: Clock, word: 'linha do tempo' },
  chapter: { icon: BookMarked, word: 'capítulo' },
};
const NUMERIC_KINDS: VarMagnitudeKind[] = ['trust', 'ending', 'money'];

/** All flag names discovered across setFlag / flag / flagEquals. */
function collectFlags(bundle: Bundle): string[] {
  const set = new Set<string>();
  for (const h of scanEffects(bundle)) if (h.effect.type === 'setFlag') set.add(h.effect.flag);
  for (const h of scanConditions(bundle)) {
    if (h.condition.type === 'flag' || h.condition.type === 'flagEquals') set.add(h.condition.flag);
  }
  return [...set].sort();
}

/** All choice-option ids across the story. */
function collectOptionIds(bundle: Bundle): string[] {
  const set = new Set<string>();
  for (const ch of Object.values(bundle.chapters)) {
    for (const node of Object.values(ch.nodes)) {
      if (node.type === 'choice') node.options.forEach((o) => set.add(o.id));
    }
  }
  return [...set].sort();
}

/** Does this effect target the chosen variable/value? */
function effectMatches(e: Effect, kind: VarKind, value: string): boolean {
  const v = value.trim();
  switch (kind) {
    case 'flag':
      return e.type === 'setFlag' && (!v || e.flag === v);
    case 'trust':
      return (
        (e.type === 'trust' || e.type === 'unlockContact' || e.type === 'setPresence') &&
        (!v || e.character === v)
      );
    case 'evidence':
      return e.type === 'addEvidence' && (!v || e.evidence === v);
    case 'ending':
      return (e.type === 'lockEndingScore' || e.type === 'setEnding') && (!v || e.ending === v);
    case 'money':
      return e.type === 'money';
    case 'presence':
      return e.type === 'setPresence' && (!v || e.character === v);
    case 'news':
      return e.type === 'unlockNews' && (!v || e.news === v);
    case 'post':
      return e.type === 'unlockSocial' && (!v || e.post === v);
    case 'story':
      return e.type === 'unlockStory' && (!v || e.story === v);
    case 'blog':
      return e.type === 'offerBlog' && (!v || e.blog === v);
    case 'timeline':
      return e.type === 'addTimeline' && (!v || e.id === v);
    case 'option':
    case 'chapter':
      return false; // not produced by effects
  }
}

/** Does this condition reference the chosen variable/value? */
function conditionMatches(c: Condition, kind: VarKind, value: string): boolean {
  const v = value.trim();
  switch (kind) {
    case 'flag':
      return (c.type === 'flag' || c.type === 'flagEquals') && (!v || c.flag === v);
    case 'trust':
      return (
        (c.type === 'trustAtLeast' || c.type === 'trustBelow' || c.type === 'paidAtLeast') &&
        (!v || c.character === v)
      );
    case 'presence':
      return false; // presence isn't a condition
    case 'evidence':
      return c.type === 'hasEvidence' && (!v || c.evidence === v);
    case 'option':
      return c.type === 'choseOption' && (!v || c.option === v);
    case 'money':
      return c.type === 'moneyAtLeast' || c.type === 'paidAtLeast';
    case 'chapter':
      return c.type === 'chapterCompleted' && (!v || c.chapter === v);
    case 'ending':
    case 'news':
    case 'post':
    case 'story':
    case 'blog':
    case 'timeline':
      return false; // not used as conditions
  }
}

function VarsMode() {
  const bundle = useEditor((s) => s.bundle);
  const goToNode = useEditor((s) => s.goToNode);
  const [kind, setKind] = useState<VarKind>('flag');
  const [value, setValue] = useState('');

  const flags = useMemo(() => collectFlags(bundle), [bundle]);
  const optionIds = useMemo(() => collectOptionIds(bundle), [bundle]);

  const altered = useMemo(
    () => scanEffects(bundle).filter((h) => effectMatches(h.effect, kind, value)),
    [bundle, kind, value],
  );
  const used = useMemo(
    () => scanConditions(bundle).filter((h) => conditionMatches(h.condition, kind, value)),
    [bundle, kind, value],
  );

  const stats = useMemo(() => {
    const sorted = sortEffectHits(bundle, altered);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const numeric = NUMERIC_KINDS.includes(kind as VarMagnitudeKind)
      ? (kind as VarMagnitudeKind)
      : null;
    const net = numeric ? netNumericDelta(altered, numeric) : null;
    const series = numeric ? deltaSeries(bundle, altered, numeric) : [];
    return { first, last, net, numeric, series };
  }, [bundle, altered, kind]);

  // The context-value control depends on the chosen kind.
  const valueControl = (() => {
    switch (kind) {
      case 'trust':
      case 'presence':
        return <CharacterSelect value={value} onChange={setValue} allowEmpty="— qualquer —" />;
      case 'flag':
        return <DatalistInput value={value} onChange={setValue} listId="audit-flags" options={flags} />;
      case 'evidence':
        return (
          <DatalistInput
            value={value}
            onChange={setValue}
            listId="audit-evidence"
            options={Object.keys(bundle.evidence)}
          />
        );
      case 'option':
        return <DatalistInput value={value} onChange={setValue} listId="audit-options" options={optionIds} />;
      case 'ending':
        return (
          <DatalistInput
            value={value}
            onChange={setValue}
            listId="audit-endings"
            options={Object.keys(bundle.endings)}
          />
        );
      case 'chapter':
        return (
          <DatalistInput
            value={value}
            onChange={setValue}
            listId="audit-chapters"
            options={bundle.chapterOrder}
          />
        );
      case 'news':
        return (
          <DatalistInput value={value} onChange={setValue} listId="audit-news" options={Object.keys(bundle.news)} />
        );
      case 'post':
        return (
          <DatalistInput value={value} onChange={setValue} listId="audit-posts" options={Object.keys(bundle.social)} />
        );
      case 'story':
        return (
          <DatalistInput
            value={value}
            onChange={setValue}
            listId="audit-stories"
            options={Object.keys(bundle.socialStories)}
          />
        );
      case 'blog':
        return (
          <DatalistInput
            value={value}
            onChange={setValue}
            listId="audit-blogs"
            options={Object.keys(bundle.blog ?? {})}
          />
        );
      case 'money':
        return <p className="hint" style={{ paddingTop: 8 }}>Dinheiro não usa um valor específico.</p>;
      case 'timeline':
        return <TextInput value={value} onChange={setValue} placeholder="id da linha do tempo (opcional)" />;
    }
  })();

  const lastType = stats.last
    ? NODE_LABEL[stats.last.nodeType as keyof typeof NODE_LABEL] ?? stats.last.nodeType
    : '';
  const netLabel = stats.numeric === 'trust'
    ? 'saldo de confiança somando todos os caminhos'
    : stats.numeric === 'ending'
      ? 'pontos somados a este final'
      : 'saldo em R$';

  return (
    <>
      <div className="audit-controls">
        <Field label="Tipo">
          <Select value={kind} onChange={(v) => { setKind(v as VarKind); setValue(''); }} options={VAR_KINDS} />
        </Field>
        <Field label={kind === 'trust' || kind === 'presence' ? 'Personagem' : 'Valor (vazio = qualquer)'}>
          {valueControl}
        </Field>
      </div>

      <div className="audit-hero">
        {altered.length === 0 && used.length === 0 ? (
          <StatCard
            ico={VAR_META[kind].icon}
            num="—"
            label="Esta variável não é tocada em lugar nenhum."
            variant="is-empty"
          />
        ) : (
          <>
            <StatCard
              ico={Pencil}
              num={altered.length}
              label="vezes que esta variável é alterada"
              variant="is-accent"
            />
            <StatCard
              ico={GitFork}
              num={used.length}
              label="vezes que o jogo a consulta numa condição"
              variant="is-blue"
              foot={used.length === 0 ? 'nunca decide nada — talvez sobre' : undefined}
            />
            {stats.numeric ? (
              <StatCard
                ico={Sigma}
                num={(stats.net! >= 0 ? '+' : '') + stats.net}
                label={netLabel}
                variant={stats.net! >= 0 ? 'is-pos' : 'is-neg'}
              />
            ) : (
              <StatCard
                ico={VAR_META[kind].icon}
                num={VAR_META[kind].word}
                label="tipo de mudança"
              />
            )}
            <StatCard
              ico={Flag}
              num={stats.last ? stats.last.chapterTitle : '—'}
              label="última vez que muda"
              foot={
                stats.last ? (
                  <>
                    <IdChip id={stats.last.nodeId} /> · {lastType}
                    {stats.first &&
                    (stats.first.chapterId !== stats.last.chapterId ||
                      stats.first.nodeId !== stats.last.nodeId)
                      ? ` · 1ª vez: ${stats.first.chapterTitle}`
                      : ''}
                  </>
                ) : undefined
              }
              onClick={stats.last ? () => goToNode(stats.last!.chapterId, stats.last!.nodeId) : undefined}
            />
          </>
        )}
      </div>

      {stats.numeric && stats.series.length ? (
        <div className="audit-track">
          {stats.series.map((d, i) => (
            <span key={i} className={`audit-chip ${d >= 0 ? 'pos' : 'neg'}`}>
              {d >= 0 ? '+' : ''}
              {d}
            </span>
          ))}
        </div>
      ) : null}

      <div className="audit-cols">
        <div className="audit-col">
          <h4 className="audit-group-title"><Pencil size={13} strokeWidth={1.75} /> Onde muda ({altered.length})</h4>
          {altered.length === 0 ? (
            <p className="hint">Nenhum efeito altera isto.</p>
          ) : (
            altered.map((h, i) => (
              <button
                key={`${h.chapterId}:${h.nodeId}:${h.where}:${i}`}
                className="audit-row"
                onClick={() => useEditor.getState().goToNode(h.chapterId, h.nodeId)}
              >
                <span className="audit-where">
                  {h.chapterTitle} <span className="audit-sub">· {h.where}</span>
                </span>
                <span className="audit-node">
                  <IdChip id={h.nodeId} /> · {NODE_LABEL[h.nodeType as keyof typeof NODE_LABEL] ?? h.nodeType}
                </span>
                <span className="audit-desc">{describeEffect(h.effect, bundle)}</span>
              </button>
            ))
          )}
        </div>
        <div className="audit-col">
          <h4 className="audit-group-title"><GitFork size={13} strokeWidth={1.75} /> Onde decide um caminho ({used.length})</h4>
          {used.length === 0 ? (
            <p className="hint">Nenhuma condição usa isto.</p>
          ) : (
            used.map((h, i) =>
              h.chapterId && h.nodeId ? (
                <button
                  key={`${h.chapterId}:${h.nodeId}:${h.where}:${i}`}
                  className="audit-row"
                  onClick={() => useEditor.getState().goToNode(h.chapterId!, h.nodeId!)}
                >
                  <span className="audit-where">
                    {h.chapterTitle} <span className="audit-sub">· {h.where}</span>
                  </span>
                  <span className="audit-node">
                    <IdChip id={h.nodeId} /> ·{' '}
                    {NODE_LABEL[h.nodeType as keyof typeof NODE_LABEL] ?? h.nodeType}
                  </span>
                  <span className="audit-desc cond">{describeCondition(h.condition, bundle)}</span>
                </button>
              ) : (
                <div key={`reg:${h.where}:${i}`} className="audit-row static">
                  <span className="audit-where">{h.where}</span>
                  <span className="audit-desc cond">{describeCondition(h.condition, bundle)}</span>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </>
  );
}

/** A text input backed by a <datalist> of suggestions. */
function DatalistInput({
  value,
  onChange,
  listId,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  listId: string;
  options: string[];
}) {
  return (
    <>
      <input
        className="input"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="— qualquer —"
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

// ============================================================================
// Mode "Personagem" — visual timeline / evolution
// ============================================================================

interface TimelineEntry {
  nodeId: string;
  nodeType: string;
  kind: 'trust' | 'unlock' | 'presence' | 'gate';
  delta?: number; // trust
  dot: 'green' | 'red' | 'blue' | 'gray';
  text: string;
}

/** Lucide glyph for a timeline entry, by kind/value. */
function timelineIcon(e: TimelineEntry): LucideIcon {
  switch (e.kind) {
    case 'trust':
      return (e.delta ?? 0) >= 0 ? TrendingUp : TrendingDown;
    case 'unlock':
      return Contact;
    case 'presence':
      return e.text === 'online' ? Circle : CircleSlash;
    case 'gate':
      return Lock;
  }
}

function CharacterMode() {
  const bundle = useEditor((s) => s.bundle);
  const goToNode = useEditor((s) => s.goToNode);
  const [character, setCharacter] = useState('');

  const data = useMemo(() => {
    if (!character) return null;
    const effects = scanEffects(bundle).filter(
      (h) =>
        (h.effect.type === 'trust' ||
          h.effect.type === 'unlockContact' ||
          h.effect.type === 'setPresence') &&
        (h.effect as { character?: string }).character === character,
    );
    const conds = scanConditions(bundle).filter(
      (h) =>
        (h.condition.type === 'trustAtLeast' ||
          h.condition.type === 'trustBelow' ||
          h.condition.type === 'paidAtLeast') &&
        (h.condition as { character?: string }).character === character &&
        h.chapterId,
    );

    // Group entries per chapter, ordered by chapterOrder, nodes by BFS.
    const perChapter = new Map<string, TimelineEntry[]>();
    const ensure = (chId: string) => {
      if (!perChapter.has(chId)) perChapter.set(chId, []);
      return perChapter.get(chId)!;
    };

    for (const h of effects) {
      const e = h.effect;
      let entry: TimelineEntry;
      if (e.type === 'trust') {
        entry = {
          nodeId: h.nodeId,
          nodeType: h.nodeType,
          kind: 'trust',
          delta: e.delta,
          dot: e.delta >= 0 ? 'green' : 'red',
          text: `confiança ${e.delta >= 0 ? '+' : ''}${e.delta}${h.where !== 'nó' ? ` (${h.where})` : ''}`,
        };
      } else if (e.type === 'unlockContact') {
        entry = { nodeId: h.nodeId, nodeType: h.nodeType, kind: 'unlock', dot: 'blue', text: 'desbloqueado' };
      } else {
        entry = {
          nodeId: h.nodeId,
          nodeType: h.nodeType,
          kind: 'presence',
          dot: 'gray',
          text: e.type === 'setPresence' && e.online ? 'online' : 'offline',
        };
      }
      ensure(h.chapterId).push(entry);
    }
    for (const h of conds) {
      ensure(h.chapterId!).push({
        nodeId: h.nodeId!,
        nodeType: h.nodeType!,
        kind: 'gate',
        dot: 'gray',
        text: `só passa se ${describeCondition(h.condition, bundle)}`,
      });
    }

    // Per-chapter message counts where speaker === character.
    const msgCount = new Map<string, number>();
    for (const ch of Object.values(bundle.chapters)) {
      let n = 0;
      for (const node of Object.values(ch.nodes)) {
        if (node.type === 'message' && node.speaker === character) n += 1;
      }
      if (n) msgCount.set(ch.id, n);
    }

    // Sort each chapter's entries by node BFS order.
    for (const [chId, entries] of perChapter) {
      const ch = bundle.chapters[chId];
      if (!ch) continue;
      const order = orderedNodeIds(ch);
      const rank = new Map(order.map((id, i) => [id, i]));
      entries.sort((a, b) => (rank.get(a.nodeId) ?? 999) - (rank.get(b.nodeId) ?? 999));
    }

    // Chapters in order: those in chapterOrder first, then leftovers.
    const chapterIds = [
      ...bundle.chapterOrder.filter((id) => perChapter.has(id) || msgCount.has(id)),
      ...[...perChapter.keys(), ...msgCount.keys()].filter((id) => !bundle.chapterOrder.includes(id)),
    ].filter((id, i, arr) => arr.indexOf(id) === i);

    // Summary stats — in chapterOrder/BFS sequence for the sparkline.
    const trustDeltas: number[] = [];
    for (const chId of chapterIds) {
      for (const e of perChapter.get(chId) ?? []) {
        if (e.kind === 'trust' && typeof e.delta === 'number') trustDeltas.push(e.delta);
      }
    }
    const netTrust = trustDeltas.reduce((a, b) => a + b, 0);
    const gateCount = conds.length;
    const unlocks = effects.filter((h) => h.effect.type === 'unlockContact');

    return { perChapter, msgCount, chapterIds, trustDeltas, netTrust, gateCount, unlocks };
  }, [bundle, character]);

  return (
    <>
      <div className="audit-controls">
        <Field label="Personagem">
          <CharacterSelect value={character} onChange={setCharacter} allowEmpty="— selecione —" />
        </Field>
      </div>
      <div className="audit-results">
        {!character ? (
          <p className="hint">Escolha um personagem para ver sua linha do tempo.</p>
        ) : !data ? null : (
          <>
            <div className="audit-hero">
              <StatCard
                ico={Handshake}
                num={(data.netTrust >= 0 ? '+' : '') + data.netTrust}
                label="saldo de confiança somando todos os caminhos"
                variant={data.netTrust >= 0 ? 'is-pos' : 'is-neg'}
              />
              <StatCard
                ico={Repeat}
                num={data.trustDeltas.length}
                label="mudanças de confiança"
                variant="is-accent"
              />
              <StatCard
                ico={Lock}
                num={data.gateCount}
                label="travas de confiança"
                variant="is-warn"
              />
              <StatCard
                ico={Contact}
                num={data.unlocks.length ? 'sim' : 'não'}
                label="contato desbloqueado"
                foot={
                  data.unlocks.length
                    ? `em ${data.unlocks.map((u) => u.chapterId).join(', ')}`
                    : 'ainda não'
                }
                variant="is-blue"
              />
            </div>

            {data.trustDeltas.length ? (
              <div className="audit-spark">
                {data.trustDeltas.map((d, i) => (
                  <span key={i} className={`audit-chip ${d >= 0 ? 'pos' : 'neg'}`}>
                    {d >= 0 ? '+' : ''}
                    {d}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="hint" style={{ margin: '4px 0 12px' }}>
              Nem todo jogo passa por tudo isto — é o conjunto de tudo que pode tocar este personagem.
            </p>

            {data.chapterIds.length === 0 ? (
              <p className="hint">Nada referencia este personagem.</p>
            ) : (
              data.chapterIds.map((chId) => {
                const ch = bundle.chapters[chId];
                const entries = data.perChapter.get(chId) ?? [];
                const msgs = data.msgCount.get(chId);
                return (
                  <div key={chId} className="audit-tl-chapter">
                    <h4 className="audit-group-title">
                      {ch?.title ?? chId} <IdChip id={chId} />
                      {msgs ? <span className="audit-sub"> · {msgs} mensagem{msgs === 1 ? '' : 's'}</span> : null}
                    </h4>
                    {entries.length ? (
                      <div className="audit-timeline">
                        {entries.map((e, i) => {
                          const TlIco = timelineIcon(e);
                          return (
                            <button
                              key={`${e.nodeId}:${i}`}
                              className="audit-tl-row"
                              onClick={() => goToNode(chId, e.nodeId)}
                            >
                              <span className={`audit-dot ${e.dot}`} />
                              <span className={`audit-tl-ico ${e.dot}`}>
                                <TlIco size={13} strokeWidth={1.75} />
                              </span>
                              <span className="audit-tl-text">{e.text}</span>
                              <span className="audit-tl-node">
                                <IdChip id={e.nodeId} /> ·{' '}
                                {NODE_LABEL[e.nodeType as keyof typeof NODE_LABEL] ?? e.nodeType}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="hint" style={{ marginLeft: 12 }}>
                        só mensagens neste capítulo.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Mode "Bifurcações" — choice branching map
// ============================================================================

/** One target/path row inside a fork diagram. */
function ForkPathRow({
  p,
  kind,
  chId,
  nodes,
}: {
  p: ForkPath;
  kind: 'choice' | 'branch';
  chId: string;
  nodes: Record<string, StoryNode>;
}) {
  const goToNode = useEditor((s) => s.goToNode);
  const bundle = useEditor((s) => s.bundle);
  const tgt = targetInfo(p.target, nodes);
  return (
    <div className={`audit-fork-path${p.fallback ? ' is-fallback' : ''}`}>
      {kind === 'choice' ? (
        p.silent ? (
          <span className="audit-path-label is-silent">
            <VolumeX size={12} strokeWidth={1.75} /> (fica em silêncio)
          </span>
        ) : (
          <span className="audit-path-label is-say">{p.label}</span>
        )
      ) : p.fallback ? (
        <span className="audit-path-label">senão (qualquer outro caso)</span>
      ) : (
        <span className="audit-path-label is-cond">se {describeCondition(p.branchCond!, bundle)}</span>
      )}
      {p.gate ? (
        <span className="audit-badge">
          <Lock size={11} strokeWidth={1.75} /> só se {describeCondition(p.gate, bundle)}
        </span>
      ) : null}
      <span className="audit-fork-arrow">
        <ArrowRight size={13} strokeWidth={1.75} />
      </span>
      {tgt.ok ? (
        <button className="audit-fork-tgt" onClick={() => goToNode(chId, p.target)}>
          <IdChip id={p.target} /> · {tgt.label}
        </button>
      ) : (
        <span className="audit-fork-tgt is-broken">
          <AlertTriangle size={12} strokeWidth={1.75} /> {tgt.label}
        </span>
      )}
      {p.effects && p.effects.length ? (
        <span className="audit-fork-fx">
          <Zap size={11} strokeWidth={1.75} /> faz: {p.effects.map((e) => describeEffect(e, bundle)).join(' · ')}
        </span>
      ) : null}
    </div>
  );
}

function BranchesMode() {
  const bundle = useEditor((s) => s.bundle);
  const goToNode = useEditor((s) => s.goToNode);

  const { chapters, choiceCount, branchCount } = useMemo(() => {
    let choices = 0;
    let branches = 0;
    const chs = bundle.chapterOrder
      .map((chId) => bundle.chapters[chId])
      .filter(Boolean)
      .map((ch) => {
        const order = orderedNodeIds(ch);
        const nodes = order
          .map((id) => ch.nodes[id])
          .filter((n) => n && (n.type === 'choice' || n.type === 'branch'));
        for (const n of nodes) {
          if (n.type === 'choice') choices += 1;
          else if (n.type === 'branch') branches += 1;
        }
        return { ch, nodes };
      })
      .filter((c) => c.nodes.length);
    return { chapters: chs, choiceCount: choices, branchCount: branches };
  }, [bundle]);

  return (
    <div className="audit-results">
      <div className="audit-hero">
        <StatCard
          ico={MessagesSquare}
          num={choiceCount}
          label="pontos onde O JOGADOR decide"
          variant="is-pos"
        />
        <StatCard
          ico={GitFork}
          num={branchCount}
          label="pontos onde O JOGO decide sozinho conforme variáveis"
          variant="is-warn"
        />
      </div>
      <div className="audit-legend">
        <span className="swatch choice"><MessagesSquare size={13} strokeWidth={1.75} /> jogador escolhe</span>
        <span className="swatch branch"><GitFork size={13} strokeWidth={1.75} /> jogo decide</span>
      </div>
      {chapters.length === 0 ? (
        <p className="hint">Nenhuma escolha ou ramificação na história.</p>
      ) : (
        chapters.map(({ ch, nodes }) => (
          <div key={ch.id} className="audit-tl-chapter">
            <h4 className="audit-group-title">
              {ch.title} <IdChip id={ch.id} />
            </h4>
            {nodes.map((node) => {
              const fork = enumerateFork(node);
              if (!fork) return null;
              return (
                <div
                  key={fork.nodeId}
                  className={`audit-fork ${fork.kind === 'choice' ? 'is-choice' : 'is-branch'}`}
                >
                  <div
                    className={`audit-fork-src ${fork.kind === 'choice' ? 'is-choice' : 'is-branch'}`}
                  >
                    <span className="audit-fork-kicker">
                      {fork.kind === 'choice' ? (
                        <>
                          <MessagesSquare size={13} strokeWidth={1.75} /> O JOGADOR ESCOLHE
                        </>
                      ) : (
                        <>
                          <GitFork size={13} strokeWidth={1.75} /> O JOGO DECIDE SOZINHO
                        </>
                      )}
                    </span>
                    <span className="audit-fork-title">
                      {fork.kind === 'choice'
                        ? fork.prompt || '(sem pergunta)'
                        : 'conforme as variáveis abaixo'}
                    </span>
                    <button className="audit-fork-id" onClick={() => goToNode(ch.id, fork.nodeId)}>
                      <IdChip id={fork.nodeId} /> ·{' '}
                      {NODE_LABEL[fork.nodeType as keyof typeof NODE_LABEL] ?? fork.nodeType}
                    </button>
                  </div>
                  <div className="audit-fork-paths">
                    {fork.paths.map((p, i) => (
                      <ForkPathRow key={i} p={p} kind={fork.kind} chId={ch.id} nodes={ch.nodes} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
