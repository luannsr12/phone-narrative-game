/**
 * Inspector for a STEP inside a call's nested sub-flow (shown while the call
 * sub-canvas is open). Mirrors the chapter Inspector's structure, but edits the
 * selected CallStep via the call-step store actions.
 */
import React from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import { useEditor, uid } from '../store';
import type { CallStep } from '../types';
import { CALL_STEP_LABEL } from '../types';
import { CALL_STEP_ICON, CALL_STEP_ACCENT } from '../ui/icons';
import { EffectsEditor } from './EffectsEditor';
import { ConditionEditor } from './ConditionEditor';
import { OptionForm } from './Inspector';
import { Field, TextInput, TextArea, NumberInput, MediaSelect, CharacterSelect } from './fields';

function StepForm({
  step,
  set,
}: {
  step: CallStep;
  set: (s: CallStep) => void;
}) {
  switch (step.type) {
    case 'audio':
      return (
        <>
          <p className="hint">Toca um MP3 (link) e mostra a legenda. Some sozinho quando o áudio acaba.</p>
          <Field label="Quem fala (rótulo na tela)">
            <CharacterSelect value={step.speaker ?? ''} onChange={(v) => set({ ...step, speaker: v || undefined })} withSpecial allowEmpty="—" />
          </Field>
          <Field label="Áudio (mídia da biblioteca)">
            <MediaSelect
              kind="audio"
              value={step.media}
              onChange={(v) => set({ ...step, media: v })}
              allowEmpty="— escolher mídia (ou link abaixo) —"
            />
          </Field>
          <Field label="Ou link direto do MP3 (opcional)">
            <TextInput value={step.audioUrl ?? ''} onChange={(v) => set({ ...step, audioUrl: v || undefined })} placeholder="https://…/fala.mp3" />
          </Field>
          <Field label="Legenda (o que está sendo dito)">
            <TextArea value={step.text ?? ''} onChange={(v) => set({ ...step, text: v || undefined })} rows={3} />
          </Field>
          <Field label="Sem MP3: segurar a legenda por (segundos)">
            <NumberInput value={step.holdSec} onChange={(v) => set({ ...step, holdSec: v })} placeholder="4" />
          </Field>
          <EffectsEditor effects={step.effects} onChange={(e) => set({ ...step, effects: e })} />
          <p className="hint">Conecte a saída (embaixo) ao próximo passo da ligação.</p>
        </>
      );

    case 'choice':
      return (
        <>
          <Field label="Pergunta/contexto (opcional)">
            <TextInput value={step.prompt ?? ''} onChange={(v) => set({ ...step, prompt: v || undefined })} />
          </Field>
          <div className="subsection">
            <div className="subsection-head">
              <span>Respostas do jogador</span>
              <button
                className="btn small"
                onClick={() => set({ ...step, options: [...step.options, { id: uid('opt'), text: '', next: '' }] })}
              >
                <Plus size={14} strokeWidth={1.75} /> resposta
              </button>
            </div>
            {step.options.map((o, i) => (
              <div key={o.id} className="card">
                <div className="card-head">
                  <span className="tag">resposta {i + 1} · id: {o.id}</span>
                  <button
                    className="btn danger small"
                    onClick={() => set({ ...step, options: step.options.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> remover
                  </button>
                </div>
                <OptionForm
                  option={o}
                  onChange={(no) => set({ ...step, options: step.options.map((x, j) => (j === i ? no : x)) })}
                />
              </div>
            ))}
            <p className="hint">Ligue cada resposta ao próximo passo pelo canto direito dela.</p>
          </div>
          <Field label="Sem resposta após (segundos) — vazio/0 = espera para sempre">
            <NumberInput value={step.timeoutSec} onChange={(v) => set({ ...step, timeoutSec: v })} placeholder="ex.: 8" />
          </Field>
          <p className="hint">
            Se o jogador não responder no tempo, a ligação segue pela saída <b>"sem resposta"</b> do
            passo (ligue-a a outro passo no canvas). Sem ligar nada, a chamada <b>encerra</b>.
          </p>
        </>
      );

    case 'action':
      return (
        <>
          <p className="hint">Só aplica efeitos no meio da ligação e segue adiante.</p>
          <EffectsEditor effects={step.effects} onChange={(e) => set({ ...step, effects: e ?? [] })} />
        </>
      );

    case 'branch':
      return (
        <>
          <p className="hint">Avalia as condições em ordem; a primeira verdadeira define o caminho.</p>
          <div className="subsection">
            <div className="subsection-head">
              <span>Ramos</span>
              <button
                className="btn small"
                onClick={() => set({ ...step, branches: [...step.branches, { condition: { type: 'flag', flag: '' }, next: '' }] })}
              >
                <Plus size={14} strokeWidth={1.75} /> ramo
              </button>
            </div>
            {step.branches.map((br, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <span className="tag">ramo {i + 1}</span>
                  <button
                    className="btn danger small"
                    onClick={() => set({ ...step, branches: step.branches.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> remover
                  </button>
                </div>
                <ConditionEditor
                  value={br.condition}
                  onChange={(c) => set({ ...step, branches: step.branches.map((x, j) => (j === i ? { ...x, condition: c! } : x)) })}
                  required
                />
              </div>
            ))}
          </div>
        </>
      );

    case 'delay':
      return (
        <>
          <p className="hint">Um silêncio na ligação, depois segue.</p>
          <Field label="Segundos de silêncio">
            <NumberInput value={step.seconds} onChange={(v) => set({ ...step, seconds: v ?? 0 })} />
          </Field>
        </>
      );

    case 'hangup':
      return (
        <>
          <p className="hint">Desliga a ligação. A história continua no nó ligado em "depois da ligação".</p>
          <Field label="Legenda final (opcional)">
            <TextInput value={step.text ?? ''} onChange={(v) => set({ ...step, text: v || undefined })} placeholder="ex.: ligação encerrada" />
          </Field>
          <EffectsEditor effects={step.effects} onChange={(e) => set({ ...step, effects: e })} />
        </>
      );
  }
}

export function CallStepInspector() {
  const callEditor = useEditor((s) => s.callEditor);
  const selectedStepId = useEditor((s) => s.selectedStepId);
  const bundle = useEditor((s) => s.bundle);
  const updateCallStep = useEditor((s) => s.updateCallStep);
  const removeCallStep = useEditor((s) => s.removeCallStep);
  const setCallEntry = useEditor((s) => s.setCallEntry);
  const selectStep = useEditor((s) => s.selectStep);

  if (!callEditor) return null;
  const node = bundle.chapters[callEditor.chapterId]?.nodes[callEditor.nodeId];
  const callNode = node?.type === 'callScene' ? node : undefined;
  const step = selectedStepId ? callNode?.scene[selectedStepId] : undefined;

  if (!callNode || !step) {
    return (
      <aside className="inspector">
        <p className="hint">Selecione um passo da ligação no canvas para editar, ou adicione um pela barra superior.</p>
      </aside>
    );
  }

  const HeadIco = CALL_STEP_ICON[step.type];
  const set = (s: CallStep) => updateCallStep(callEditor.chapterId, callEditor.nodeId, step.id, s);

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <span className="inspector-head-tile" style={{ background: `${CALL_STEP_ACCENT[step.type]}22`, color: CALL_STEP_ACCENT[step.type] }}>
          <HeadIco size={14} strokeWidth={1.75} />
        </span>
        <span className="inspector-head-title">{CALL_STEP_LABEL[step.type]}</span>
        <code className="nodeid">{step.id}</code>
      </div>
      <div className="inspector-actions">
        {callNode.entry !== step.id ? (
          <button className="btn small" onClick={() => setCallEntry(callEditor.chapterId, callEditor.nodeId, step.id)}>
            <Play size={13} strokeWidth={1.75} /> definir como início
          </button>
        ) : (
          <span className="tag">
            <Play size={12} strokeWidth={1.75} /> início da ligação
          </span>
        )}
        <button
          className="btn danger small"
          onClick={() => {
            removeCallStep(callEditor.chapterId, callEditor.nodeId, step.id);
            selectStep(null);
          }}
        >
          <Trash2 size={14} strokeWidth={1.75} /> excluir passo
        </button>
      </div>
      <StepForm step={step} set={set} />
    </aside>
  );
}
