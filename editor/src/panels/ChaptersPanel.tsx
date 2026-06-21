import React, { useState } from 'react';
import {
  Plus,
  Play,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Trash2,
  PanelLeftOpen,
  PanelRightOpen,
} from 'lucide-react';
import { useEditor } from '../store';
import { FlowCanvas } from '../flow/FlowCanvas';
import { CallSceneCanvas } from '../flow/CallSceneCanvas';
import { Inspector } from '../inspector/Inspector';
import { CallStepInspector } from '../inspector/CallStepInspector';
import { Field, TextInput, TextArea } from '../inspector/fields';

function ChapterMetaForm({ chapterId }: { chapterId: string }) {
  const chapter = useEditor((s) => s.bundle.chapters[chapterId]);
  const update = useEditor((s) => s.updateChapterMeta);
  const remove = useEditor((s) => s.removeChapter);
  const selectChapter = useEditor((s) => s.selectChapter);
  const [open, setOpen] = useState(false);

  if (!chapter) return null;

  return (
    <div className="chapter-meta">
      <button className="btn small" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} strokeWidth={1.75} /> : <ChevronRight size={14} strokeWidth={1.75} />}
        dados do capítulo
      </button>
      {open ? (
        <div className="chapter-meta-form">
          <Field label="Título">
            <TextInput value={chapter.title} onChange={(v) => update(chapterId, { title: v })} />
          </Field>
          <Field label="Objetivo (aparece para o jogador)">
            <TextInput value={chapter.objective} onChange={(v) => update(chapterId, { objective: v })} />
          </Field>
          <Field label="Resumo (interstício de capítulo concluído)">
            <TextArea value={chapter.summary} onChange={(v) => update(chapterId, { summary: v })} rows={2} />
          </Field>
          <button
            className="btn danger small"
            onClick={() => {
              if (confirm(`Excluir o capítulo "${chapter.title}" e todos os seus nós?`)) {
                remove(chapterId);
                selectChapter(null);
              }
            }}
          >
            <Trash2 size={14} strokeWidth={1.75} /> excluir capítulo
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ChaptersPanel() {
  const bundle = useEditor((s) => s.bundle);
  const selectedChapterId = useEditor((s) => s.selectedChapterId);
  const selectChapter = useEditor((s) => s.selectChapter);
  const addChapter = useEditor((s) => s.addChapter);
  const moveChapter = useEditor((s) => s.moveChapter);

  const callEditor = useEditor((s) => s.callEditor);

  const [listOpen, setListOpen] = useState(true);
  const [inspOpen, setInspOpen] = useState(true);

  const inCall = !!callEditor && callEditor.chapterId === selectedChapterId;

  return (
    <div className="chapters-layout">
      {listOpen ? (
        <div className="chapters-list">
          <button
            className="btn accent"
            onClick={() => {
              const n = bundle.chapterOrder.length;
              const id = `chapter${String(n).padStart(2, '0')}` in bundle.chapters
                ? `chapter_${Date.now().toString(36)}`
                : `chapter${String(n).padStart(2, '0')}`;
              addChapter(id, `Capítulo ${n}`);
              selectChapter(id);
            }}
          >
            <Plus size={15} strokeWidth={1.75} /> Novo capítulo
          </button>
          <span className="chapters-caption field-label">Capítulos</span>
          {bundle.chapterOrder.map((id, i) => {
            const ch = bundle.chapters[id];
            if (!ch) return null;
            return (
              <div key={id} className={`chapter-item ${selectedChapterId === id ? 'active' : ''}`}>
                <button className="chapter-open" onClick={() => selectChapter(id)}>
                  <span className="list-title">{ch.title || id}</span>
                  <span className="list-sub">
                    {Object.keys(ch.nodes).length} nó(s)
                    {bundle.meta.startChapter === id ? (
                      <span className="chip-accent">
                        <Play size={11} strokeWidth={1.75} /> inicial
                      </span>
                    ) : null}
                  </span>
                </button>
                <div className="chapter-ord">
                  <button
                    className="btn tiny"
                    aria-label="mover para cima"
                    disabled={i === 0}
                    onClick={() => moveChapter(id, -1)}
                  >
                    <ChevronUp size={13} strokeWidth={1.75} />
                  </button>
                  <button
                    className="btn tiny"
                    aria-label="mover para baixo"
                    disabled={i === bundle.chapterOrder.length - 1}
                    onClick={() => moveChapter(id, 1)}
                  >
                    <ChevronDown size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="chapters-list rail" onClick={() => setListOpen(true)} title="abrir capítulos">
          <span className="rail-ico">
            <PanelLeftOpen size={16} strokeWidth={1.75} />
          </span>
          <span className="rail-label">capítulos</span>
        </div>
      )}

      {selectedChapterId && bundle.chapters[selectedChapterId] ? (
        <div className="chapter-editor">
          {inCall && callEditor ? (
            <CallSceneCanvas
              chapterId={callEditor.chapterId}
              nodeId={callEditor.nodeId}
              listOpen={listOpen}
              onToggleList={() => setListOpen((o) => !o)}
              inspOpen={inspOpen}
              onToggleInsp={() => setInspOpen((o) => !o)}
            />
          ) : (
            <>
              <ChapterMetaForm chapterId={selectedChapterId} />
              <FlowCanvas
                chapterId={selectedChapterId}
                listOpen={listOpen}
                onToggleList={() => setListOpen((o) => !o)}
                inspOpen={inspOpen}
                onToggleInsp={() => setInspOpen((o) => !o)}
              />
            </>
          )}
        </div>
      ) : (
        <div className="chapter-editor empty">
          <p className="hint">Selecione um capítulo à esquerda — ou crie o primeiro.</p>
        </div>
      )}

      <div className={`inspector-wrap ${inspOpen ? '' : 'collapsed'}`}>
        {inCall ? <CallStepInspector /> : <Inspector />}
      </div>
      {inspOpen ? null : (
        <div className="inspector rail" onClick={() => setInspOpen(true)} title="abrir inspetor">
          <span className="rail-ico">
            <PanelRightOpen size={16} strokeWidth={1.75} />
          </span>
          <span className="rail-label">inspetor</span>
        </div>
      )}
    </div>
  );
}
