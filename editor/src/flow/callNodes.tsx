/**
 * Node renderers for the NESTED call sub-flow canvas (the "flowchart inside the
 * call"). Mirrors flow/nodes.tsx but for CallStep types: audio / choice /
 * action / branch / delay / hangup. Reuses the chapter canvas's Shell + handles.
 */
import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Paperclip, Zap, VolumeX } from 'lucide-react';
import type { CallStep } from '../types';
import { Shell, speakerName } from './nodes';
import { CALL_STEP_ICON, CALL_STEP_ACCENT } from '../ui/icons';

export type CallFlowNodeData = { step: CallStep; isEntry: boolean };
export type CallFlowNode = Node<CallFlowNodeData>;

function humanSecs(sec: number): string {
  if (!sec || sec <= 0) return '(sem tempo)';
  return `${sec} s`;
}

export function AudioStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'audio') return null;
  return (
    <Shell
      kind="message"
      title={s.speaker ? speakerName(s.speaker) : 'Áudio'}
      icon={CALL_STEP_ICON.audio}
      accent={CALL_STEP_ACCENT.audio}
      isEntry={data.isEntry}
      selected={selected}
    >
      <div className="fnode-body">{s.text ? s.text.slice(0, 90) : <i>(sem legenda)</i>}</div>
      {s.audioUrl ? (
        <div className="fnode-badge">
          <Paperclip size={12} strokeWidth={1.75} /> MP3
        </div>
      ) : null}
      {s.effects?.length ? (
        <div className="fnode-badge">
          <Zap size={12} strokeWidth={1.75} /> {s.effects.length} efeito(s)
        </div>
      ) : null}
    </Shell>
  );
}

export function ChoiceStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'choice') return null;
  return (
    <Shell
      kind="choice"
      title="Resposta do jogador"
      icon={CALL_STEP_ICON.choice}
      accent={CALL_STEP_ACCENT.choice}
      isEntry={data.isEntry}
      selected={selected}
      hasOut={false}
    >
      {s.options.map((o) => (
        <div key={o.id} className={`fnode-option ${o.silent ? 'silent' : ''}`}>
          <span>
            {o.silent ? <VolumeX size={12} strokeWidth={1.75} /> : null}
            {o.text.slice(0, 60) || '(vazia)'}
          </span>
          <Handle type="source" position={Position.Right} id={o.id} className="opt-handle" />
        </div>
      ))}
      <div className="fnode-option fallback">
        <span>{s.timeoutSec ? `sem resposta em ${s.timeoutSec}s` : 'sem resposta (defina o tempo)'}</span>
        <Handle type="source" position={Position.Right} id="__timeout" className="opt-handle" />
      </div>
    </Shell>
  );
}

export function ActionStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'action') return null;
  return (
    <Shell
      kind="action"
      title="Ação"
      icon={CALL_STEP_ICON.action}
      accent={CALL_STEP_ACCENT.action}
      isEntry={data.isEntry}
      selected={selected}
    >
      <div className="fnode-body">{s.effects.length ? `${s.effects.length} efeito(s)` : <i>(sem efeitos)</i>}</div>
    </Shell>
  );
}

export function BranchStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'branch') return null;
  return (
    <Shell
      kind="branch"
      title="Condição"
      icon={CALL_STEP_ICON.branch}
      accent={CALL_STEP_ACCENT.branch}
      isEntry={data.isEntry}
      selected={selected}
      hasOut={false}
    >
      {s.branches.map((_, i) => (
        <div key={i} className="fnode-option">
          <span>se condição {i + 1}</span>
          <Handle type="source" position={Position.Right} id={`b${i}`} className="opt-handle" />
        </div>
      ))}
      <div className="fnode-option fallback">
        <span>senão (padrão)</span>
        <Handle type="source" position={Position.Right} id="fallback" className="opt-handle" />
      </div>
    </Shell>
  );
}

export function DelayStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'delay') return null;
  return (
    <Shell
      kind="delay"
      title="Pausa (silêncio)"
      icon={CALL_STEP_ICON.delay}
      accent={CALL_STEP_ACCENT.delay}
      isEntry={data.isEntry}
      selected={selected}
    >
      <div className="fnode-body">silêncio de {humanSecs(s.seconds)}</div>
    </Shell>
  );
}

export function HangupStepNode({ data, selected }: NodeProps<CallFlowNode>) {
  const s = data.step;
  if (s.type !== 'hangup') return null;
  return (
    <Shell
      kind="end"
      title="Encerrar ligação"
      icon={CALL_STEP_ICON.hangup}
      accent={CALL_STEP_ACCENT.hangup}
      isEntry={data.isEntry}
      selected={selected}
      hasOut={false}
    >
      <div className="fnode-body">{s.text ? s.text.slice(0, 70) : 'desliga e volta à história'}</div>
    </Shell>
  );
}

export const callStepNodeTypes = {
  audio: AudioStepNode,
  choice: ChoiceStepNode,
  action: ActionStepNode,
  branch: BranchStepNode,
  delay: DelayStepNode,
  hangup: HangupStepNode,
};
