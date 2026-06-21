import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Edge,
  type Connection,
  type NodeChange,
  applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus,
  ChevronDown,
  Search,
  CornerDownLeft,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useEditor } from '../store';
import { nodeTypes, type FlowNode } from './nodes';
import { DeletableEdge } from './DeletableEdge';
import { NODE_ICON } from '../ui/icons';
import type { NodeType, StoryNode } from '../types';
import { NODE_LABEL } from '../types';

/** Derive React Flow edges from the chapter graph (the single source of truth). */
function deriveEdges(nodes: Record<string, StoryNode>): Edge[] {
  const edges: Edge[] = [];
  const push = (source: string, handle: string | null, target?: string) => {
    if (!target) return;
    edges.push({
      id: `${source}:${handle ?? 'out'}->${target}`,
      source,
      sourceHandle: handle ?? undefined,
      target,
      type: 'deletable',
    });
  };
  for (const n of Object.values(nodes)) {
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
        push(n.id, null, n.next);
        break;
      case 'event':
        push(n.id, 'onEvent', n.onEvent);
        push(n.id, 'next', n.next);
        break;
      case 'choice':
        n.options.forEach((o) => push(n.id, o.id, o.next || undefined));
        break;
      case 'fork':
        n.outputs.forEach((o, i) => push(n.id, `o${i}`, o || undefined));
        break;
      case 'branch':
        n.branches.forEach((b, i) => push(n.id, `b${i}`, b.next || undefined));
        push(n.id, 'fallback', n.fallback);
        break;
      case 'call':
        push(n.id, 'answer', n.onAnswer?.next);
        push(n.id, 'decline', n.onDecline?.next);
        break;
      case 'callScene':
        push(n.id, 'after', n.next);
        push(n.id, 'decline', n.onDecline?.next);
        push(n.id, 'timeout', n.onTimeout?.next);
        break;
      default:
        break;
    }
  }
  return edges;
}

const NODE_GROUPS: { label: string; items: NodeType[] }[] = [
  { label: 'Conversa', items: ['message', 'choice', 'activity', 'shareContact', 'unlockMessage'] },
  { label: 'Fluxo', items: ['branch', 'fork', 'delay', 'action'] },
  { label: 'Apps / Mídia', items: ['publishNews', 'publishPost', 'publishStory', 'offerBlog', 'socialActivity', 'socialFollow', 'bank', 'notification'] },
  { label: 'Eventos', items: ['event', 'removeEvent', 'call', 'callScene'] },
  { label: 'Fim', items: ['chapterEnd'] },
];

// Dev-time safety: every NodeType must live in exactly one group, or it
// becomes unaddable. NODE_LABEL has one key per NodeType.
if (import.meta.env.DEV) {
  const flat = NODE_GROUPS.flatMap((g) => g.items);
  console.assert(
    flat.length === Object.keys(NODE_LABEL).length && new Set(flat).size === flat.length,
    'NODE_GROUPS must cover every NodeType exactly once',
  );
}

// Module scope so React Flow doesn't recreate the type map on every render.
const edgeTypes = { deletable: DeletableEdge };

function NodeAddMenu({ onAdd }: { onAdd: (t: NodeType) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="node-menu-wrap" ref={wrapRef}>
      <button className="btn accent small" onClick={() => setOpen((o) => !o)}>
        <Plus size={15} strokeWidth={1.75} /> Adicionar nó
        <ChevronDown size={14} strokeWidth={1.75} className={`node-menu-chevron ${open ? 'open' : ''}`} />
      </button>
      {open ? (
        <div className="node-menu">
          {NODE_GROUPS.map((g) => (
            <div className="node-menu-group" key={g.label}>
              <div className="node-menu-group-title">{g.label}</div>
              {g.items.map((t) => {
                const Ico = NODE_ICON[t];
                return (
                  <button
                    key={t}
                    className="node-menu-item"
                    onClick={() => {
                      onAdd(t);
                      setOpen(false);
                    }}
                  >
                    <Ico size={15} strokeWidth={1.75} />
                    {NODE_LABEL[t]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FlowCanvasProps {
  chapterId: string;
  listOpen: boolean;
  onToggleList: () => void;
  inspOpen: boolean;
  onToggleInsp: () => void;
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({ chapterId, listOpen, onToggleList, inspOpen, onToggleInsp }: FlowCanvasProps) {
  const bundle = useEditor((s) => s.bundle);
  const selectNode = useEditor((s) => s.selectNode);
  const selectedNodeId = useEditor((s) => s.selectedNodeId);
  const focusNonce = useEditor((s) => s.focusNonce);
  const goToNode = useEditor((s) => s.goToNode);
  const goToCallStep = useEditor((s) => s.goToCallStep);
  const addNode = useEditor((s) => s.addNode);
  const removeNode = useEditor((s) => s.removeNode);
  const setNodePos = useEditor((s) => s.setNodePos);
  const connect = useEditor((s) => s.connect);
  const disconnect = useEditor((s) => s.disconnect);
  const enterCallEditor = useEditor((s) => s.enterCallEditor);

  const { screenToFlowPosition, setCenter } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);

  const chapter = bundle.chapters[chapterId];
  const layout = bundle._editor?.layouts[chapterId] ?? {};

  const derived: FlowNode[] = useMemo(
    () =>
      Object.values(chapter?.nodes ?? {}).map((n) => ({
        id: n.id,
        type: n.type,
        position: layout[n.id] ?? { x: 60, y: 60 },
        selected: n.id === selectedNodeId,
        data: { story: n, isEntry: chapter?.entry === n.id },
      })),
    [chapter, layout, selectedNodeId],
  );

  // Local copy for smooth dragging (controlled React Flow pattern); resynced
  // from the store whenever chapter content changes, keeping live positions.
  const [rfNodes, setRfNodes] = useState<FlowNode[]>(derived);
  useEffect(() => {
    setRfNodes((cur) => {
      const pos = new Map(cur.map((n) => [n.id, n.position]));
      return derived.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position }));
    });
  }, [derived]);

  // Center the viewport on a node ONLY after an explicit jump (search/Inspeção
  // bumps focusNonce). Plain selection — clicking or grabbing a node to drag —
  // must NOT move the camera, or the node fights the cursor while you drag it.
  useEffect(() => {
    if (!focusNonce || !selectedNodeId) return;
    const pos = layout[selectedNodeId];
    if (!pos) return;
    setCenter(pos.x + 130, pos.y + 50, { zoom: 1.1, duration: 450 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce]);

  // Global index of every node id -> the chapter it lives in (for search).
  const nodeIndex = useMemo(() => {
    const index: Record<string, string> = {};
    for (const ch of Object.values(bundle.chapters)) {
      for (const nid of Object.keys(ch.nodes)) index[nid] = ch.id;
    }
    return index;
  }, [bundle.chapters]);

  // Index of ids living INSIDE call sub-flows — step ids AND their option ids —
  // each mapped to the call to drill into. Lets search reach a nested step that
  // a validation error points at (e.g. "prologo/cal_…/cs_cho_… resposta sem texto").
  const callStepIndex = useMemo(() => {
    const index: Record<string, { chapterId: string; nodeId: string; stepId: string }> = {};
    for (const ch of Object.values(bundle.chapters)) {
      for (const n of Object.values(ch.nodes)) {
        if (n.type !== 'callScene') continue;
        for (const st of Object.values(n.scene ?? {})) {
          index[st.id] = { chapterId: ch.id, nodeId: n.id, stepId: st.id };
          if (st.type === 'choice')
            for (const o of st.options) index[o.id] = { chapterId: ch.id, nodeId: n.id, stepId: st.id };
        }
      }
    }
    return index;
  }, [bundle.chapters]);

  const [search, setSearch] = useState('');
  const [notFound, setNotFound] = useState(false);

  const runSearch = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      const targetChapter = nodeIndex[q];
      if (targetChapter) {
        setNotFound(false);
        goToNode(targetChapter, q);
      } else if (callStepIndex[q]) {
        setNotFound(false);
        const { chapterId, nodeId, stepId } = callStepIndex[q];
        goToCallStep(chapterId, nodeId, stepId);
      } else {
        setNotFound(true);
      }
    },
    [nodeIndex, callStepIndex, goToNode, goToCallStep],
  );

  const edges = useMemo(() => deriveEdges(chapter?.nodes ?? {}), [chapter]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      setRfNodes((cur) => applyNodeChanges(changes, cur));
      for (const c of changes) {
        if (c.type === 'position' && c.position && c.dragging === false) {
          setNodePos(chapterId, c.id, c.position);
        }
        if (c.type === 'select' && c.selected) selectNode(c.id);
        if (c.type === 'remove') removeNode(chapterId, c.id);
      }
    },
    [chapterId, setNodePos, selectNode, removeNode],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        connect(chapterId, params.source, params.sourceHandle ?? null, params.target);
      }
    },
    [chapterId, connect],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const e of deleted) disconnect(chapterId, e.source, e.sourceHandle ?? null);
    },
    [chapterId, disconnect],
  );

  // Double-clicking an interactive call drills into its nested sub-flow canvas.
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, rn: FlowNode) => {
      if (chapter?.nodes[rn.id]?.type === 'callScene') enterCallEditor(chapterId, rn.id);
    },
    [chapter, chapterId, enterCallEditor],
  );

  // New blocks land at the center of whatever the admin is currently viewing,
  // with a little jitter so consecutive adds don't stack perfectly.
  const addAtViewportCenter = useCallback(
    (t: NodeType) => {
      const rect = paneRef.current?.getBoundingClientRect();
      let pos = { x: 120, y: 120 };
      if (rect) {
        const center = screenToFlowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        pos = {
          x: center.x - 120 + (Math.random() - 0.5) * 60,
          y: center.y - 50 + (Math.random() - 0.5) * 60,
        };
      }
      const id = addNode(chapterId, t, pos);
      selectNode(id);
    },
    [chapterId, addNode, selectNode, screenToFlowPosition],
  );

  if (!chapter) return null;

  return (
    <div className="canvas-wrap">
      <div className="flow-toolbar">
        <NodeAddMenu onAdd={addAtViewportCenter} />
        <span className="search-wrap">
          <span className="search-ico">
            <Search size={14} strokeWidth={1.75} />
          </span>
          <input
            className="input small"
            list="flow-node-ids"
            placeholder="buscar nó por id…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setNotFound(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch(search);
            }}
          />
        </span>
        <datalist id="flow-node-ids">
          {Object.entries(nodeIndex).map(([nid, chId]) => (
            <option key={nid} value={nid}>
              {bundle.chapters[chId]?.title ?? chId}
            </option>
          ))}
          {Object.entries(callStepIndex).map(([sid, ref]) => (
            <option key={sid} value={sid}>
              ligação {ref.nodeId} · {bundle.chapters[ref.chapterId]?.title ?? ref.chapterId}
            </option>
          ))}
        </datalist>
        <button className="btn small" onClick={() => runSearch(search)}>
          <CornerDownLeft size={14} strokeWidth={1.75} /> ir
        </button>
        {notFound ? (
          <span className="flow-search-miss">
            <AlertCircle size={13} strokeWidth={1.75} /> nó não encontrado
          </span>
        ) : null}
        <span className="flow-toolbar-spacer" />
        <button className="btn small" onClick={onToggleList}>
          {listOpen ? (
            <PanelLeftClose size={15} strokeWidth={1.75} />
          ) : (
            <PanelLeftOpen size={15} strokeWidth={1.75} />
          )}
          capítulos
        </button>
        <button className="btn small" onClick={onToggleInsp}>
          {inspOpen ? (
            <PanelRightClose size={15} strokeWidth={1.75} />
          ) : (
            <PanelRightOpen size={15} strokeWidth={1.75} />
          )}
          inspetor
        </button>
      </div>
      <ReactFlow
        ref={paneRef}
        nodes={rfNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={() => selectNode(null)}
        fitView
        deleteKeyCode={['Delete']}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} color="rgba(255,255,255,.04)" />
        <Controls />
        <MiniMap pannable zoomable maskColor="rgba(0,0,0,.55)" />
      </ReactFlow>
    </div>
  );
}
