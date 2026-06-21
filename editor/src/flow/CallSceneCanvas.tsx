/**
 * The NESTED call sub-flow canvas — a "flowchart inside the flowchart". Opens
 * when the admin drills into a `callScene` node (store.callEditor). Mirrors the
 * chapter FlowCanvas, but operates on the call's private `scene` graph and uses
 * the call-step store actions. A breadcrumb bar backs out to the chapter.
 */
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
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useEditor, callLayoutKey } from '../store';
import { callStepNodeTypes, type CallFlowNode } from './callNodes';
import { speakerName } from './nodes';
import { DeletableEdge } from './DeletableEdge';
import { CALL_STEP_ICON } from '../ui/icons';
import type { CallStep, CallStepType } from '../types';
import { CALL_STEP_LABEL } from '../types';

const STEP_TYPES: CallStepType[] = ['audio', 'choice', 'action', 'branch', 'delay', 'hangup'];

const edgeTypes = { deletable: DeletableEdge };

/** Edges from the call's step graph (the single source of truth). */
function deriveCallEdges(scene: Record<string, CallStep>): Edge[] {
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
  for (const s of Object.values(scene)) {
    switch (s.type) {
      case 'audio':
      case 'action':
      case 'delay':
        push(s.id, null, s.next);
        break;
      case 'choice':
        s.options.forEach((o) => push(s.id, o.id, o.next || undefined));
        push(s.id, '__timeout', s.timeoutNext || undefined);
        break;
      case 'branch':
        s.branches.forEach((b, i) => push(s.id, `b${i}`, b.next || undefined));
        push(s.id, 'fallback', s.fallback);
        break;
      default:
        break;
    }
  }
  return edges;
}

function StepAddMenu({ onAdd }: { onAdd: (t: CallStepType) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
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
        <Plus size={15} strokeWidth={1.75} /> Adicionar passo
        <ChevronDown size={14} strokeWidth={1.75} className={`node-menu-chevron ${open ? 'open' : ''}`} />
      </button>
      {open ? (
        <div className="node-menu">
          <div className="node-menu-group">
            <div className="node-menu-group-title">Passos da ligação</div>
            {STEP_TYPES.map((t) => {
              const Ico = CALL_STEP_ICON[t];
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
                  {CALL_STEP_LABEL[t]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface Props {
  chapterId: string;
  nodeId: string;
  listOpen: boolean;
  onToggleList: () => void;
  inspOpen: boolean;
  onToggleInsp: () => void;
}

export function CallSceneCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}

function Inner({ chapterId, nodeId, listOpen, onToggleList, inspOpen, onToggleInsp }: Props) {
  const bundle = useEditor((s) => s.bundle);
  const selectedStepId = useEditor((s) => s.selectedStepId);
  const selectStep = useEditor((s) => s.selectStep);
  const exitCallEditor = useEditor((s) => s.exitCallEditor);
  const addCallStep = useEditor((s) => s.addCallStep);
  const removeCallStep = useEditor((s) => s.removeCallStep);
  const setCallStepPos = useEditor((s) => s.setCallStepPos);
  const connectCallStep = useEditor((s) => s.connectCallStep);
  const disconnectCallStep = useEditor((s) => s.disconnectCallStep);

  const { screenToFlowPosition } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);

  const node = bundle.chapters[chapterId]?.nodes[nodeId];
  const callNode = node?.type === 'callScene' ? node : undefined;
  const scene = callNode?.scene ?? {};
  const layout = bundle._editor?.layouts[callLayoutKey(chapterId, nodeId)] ?? {};

  const derived: CallFlowNode[] = useMemo(
    () =>
      Object.values(scene).map((s) => ({
        id: s.id,
        type: s.type,
        position: layout[s.id] ?? { x: 60, y: 60 },
        selected: s.id === selectedStepId,
        data: { step: s, isEntry: callNode?.entry === s.id },
      })),
    [scene, layout, selectedStepId, callNode?.entry],
  );

  const [rfNodes, setRfNodes] = useState<CallFlowNode[]>(derived);
  useEffect(() => {
    setRfNodes((cur) => {
      const pos = new Map(cur.map((n) => [n.id, n.position]));
      return derived.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position }));
    });
  }, [derived]);

  const edges = useMemo(() => deriveCallEdges(scene), [scene]);

  const onNodesChange = useCallback(
    (changes: NodeChange<CallFlowNode>[]) => {
      setRfNodes((cur) => applyNodeChanges(changes, cur));
      for (const c of changes) {
        if (c.type === 'position' && c.position && c.dragging === false)
          setCallStepPos(chapterId, nodeId, c.id, c.position);
        if (c.type === 'select' && c.selected) selectStep(c.id);
        if (c.type === 'remove') removeCallStep(chapterId, nodeId, c.id);
      }
    },
    [chapterId, nodeId, setCallStepPos, selectStep, removeCallStep],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target)
        connectCallStep(chapterId, nodeId, params.source, params.sourceHandle ?? null, params.target);
    },
    [chapterId, nodeId, connectCallStep],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const e of deleted) disconnectCallStep(chapterId, nodeId, e.source, e.sourceHandle ?? null);
    },
    [chapterId, nodeId, disconnectCallStep],
  );

  const addAtCenter = useCallback(
    (t: CallStepType) => {
      const rect = paneRef.current?.getBoundingClientRect();
      let pos = { x: 120, y: 120 };
      if (rect) {
        const center = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        pos = { x: center.x - 120 + (Math.random() - 0.5) * 60, y: center.y - 50 + (Math.random() - 0.5) * 60 };
      }
      const id = addCallStep(chapterId, nodeId, t, pos);
      selectStep(id);
    },
    [chapterId, nodeId, addCallStep, selectStep, screenToFlowPosition],
  );

  if (!callNode) return null;

  return (
    <div className="canvas-wrap">
      <div className="flow-toolbar">
        <button className="btn small" onClick={exitCallEditor}>
          <ArrowLeft size={15} strokeWidth={1.75} /> voltar ao capítulo
        </button>
        <span className="call-breadcrumb">
          Ligação de <b>{speakerName(callNode.caller)}</b> · subfluxo
        </span>
        <StepAddMenu onAdd={addAtCenter} />
        <span className="flow-toolbar-spacer" />
        <button className="btn small" onClick={onToggleList}>
          {listOpen ? <PanelLeftClose size={15} strokeWidth={1.75} /> : <PanelLeftOpen size={15} strokeWidth={1.75} />}
          capítulos
        </button>
        <button className="btn small" onClick={onToggleInsp}>
          {inspOpen ? <PanelRightClose size={15} strokeWidth={1.75} /> : <PanelRightOpen size={15} strokeWidth={1.75} />}
          inspetor
        </button>
      </div>
      <ReactFlow
        ref={paneRef}
        nodes={rfNodes}
        edges={edges}
        nodeTypes={callStepNodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onPaneClick={() => selectStep(null)}
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
