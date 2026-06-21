import React, { useRef, useState } from 'react';
import { useEditor, type Tab } from './store';
import { ChaptersPanel } from './panels/ChaptersPanel';
import { CharactersPanel, EvidencePanel, MediaPanel, NewsPanel, PagesPanel, SocialPanel, BlogPanel, AdsPanel, EndingsPanel } from './panels/RegistryPanels';
import { AuditPanel } from './panels/AuditPanel';
import { validateBundle, exportBundle, importBundleFile, type ValidationResult } from './io';
import type { Bundle } from './types';
import { ChapterSelect, Field, NumberInput, TextInput } from './inspector/fields';
import {
  Radio,
  Settings,
  RefreshCw,
  Upload,
  CheckCheck,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

// The game's live story — lets the editor start from what's already shipped.
import gameStory from '../../src/story/story.json';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chapters', label: 'Capítulos' },
  { id: 'characters', label: 'Personagens' },
  { id: 'evidence', label: 'Evidências' },
  { id: 'media', label: 'Mídias' },
  { id: 'news', label: 'Notícias' },
  { id: 'pages', label: 'Páginas Web' },
  { id: 'social', label: 'Rede Social' },
  { id: 'blog', label: 'Blog' },
  { id: 'ads', label: 'Anúncios' },
  { id: 'endings', label: 'Finais' },
  { id: 'audit', label: 'Inspeção' },
];

export default function App() {
  const bundle = useEditor((s) => s.bundle);
  const tab = useEditor((s) => s.tab);
  const setTab = useEditor((s) => s.setTab);
  const setBundle = useEditor((s) => s.setBundle);
  const updateMeta = useEditor((s) => s.updateMeta);

  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<ValidationResult | null>(null);
  const [showMeta, setShowMeta] = useState(false);

  const doValidate = () => setReport(validateBundle(bundle));

  const doExport = () => {
    const r = validateBundle(bundle);
    setReport(r);
    if (r.errors.length === 0) exportBundle(bundle);
  };

  const doImport = async (file: File) => {
    try {
      const b = await importBundleFile(file);
      setBundle(b);
      setReport(null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const loadFromGame = () => {
    if (
      Object.keys(bundle.chapters).length === 0 ||
      confirm('Substituir o conteúdo atual do editor pela história que está no jogo?')
    ) {
      const b = structuredClone(gameStory) as unknown as Bundle;
      b._editor = b._editor ?? { layouts: {} };
      b.social = b.social ?? {};
      b.socialStories = b.socialStories ?? {};
      b.socialNpcs = b.socialNpcs ?? {};
      b.ads = b.ads ?? {};
      b.blog = b.blog ?? {};
      b.media = b.media ?? {};
      b.pages = b.pages ?? {};
      setBundle(b);
      setReport(null);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Radio size={18} strokeWidth={1.75} />
          </span>
          <span className="brand-text">
            <strong>{bundle.meta.title || 'Sem título'}</strong>
            <span className="brand-sub">editor de história</span>
          </span>
        </div>
        <span className="topbar-divider" />
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <span className="topbar-divider" />
          <button className="btn small" onClick={() => setShowMeta(!showMeta)}>
            <Settings size={14} strokeWidth={1.75} /> projeto
          </button>
          <button className="btn small" onClick={loadFromGame}>
            <RefreshCw size={14} strokeWidth={1.75} /> carregar do jogo
          </button>
          <button className="btn small" onClick={() => fileRef.current?.click()}>
            <Upload size={14} strokeWidth={1.75} /> importar
          </button>
          <button className="btn small" onClick={doValidate}>
            <CheckCheck size={14} strokeWidth={1.75} /> validar
          </button>
          <button className="btn accent small" onClick={doExport}>
            <Download size={14} strokeWidth={1.75} /> exportar story.json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      {showMeta ? (
        <div className="meta-bar">
          <Field label="Título do jogo">
            <TextInput value={bundle.meta.title} onChange={(v) => updateMeta({ title: v })} />
          </Field>
          <Field label="Versão">
            <TextInput value={bundle.meta.version} onChange={(v) => updateMeta({ version: v })} />
          </Field>
          <Field label="Capítulo inicial">
            <ChapterSelect value={bundle.meta.startChapter} onChange={(v) => updateMeta({ startChapter: v })} allowEmpty="—" />
          </Field>
          <Field label="Saldo inicial do jogador (R$)">
            <NumberInput
              value={bundle.meta.startingMoney}
              onChange={(v) => updateMeta({ startingMoney: v })}
              placeholder="12.90"
            />
          </Field>
          <Field label="Toque de chamada (URL do ringback)">
            <TextInput
              value={bundle.meta.ringbackUrl ?? ''}
              onChange={(v) => updateMeta({ ringbackUrl: v || undefined })}
            />
          </Field>
          <Field label="Nome do blog">
            <TextInput
              value={bundle.meta.blogName ?? ''}
              onChange={(v) => updateMeta({ blogName: v || undefined })}
              placeholder="ex.: Sinal de Ravenwood"
            />
          </Field>
        </div>
      ) : null}

      <main className="content">
        {tab === 'chapters' ? <ChaptersPanel /> : null}
        {tab === 'characters' ? <CharactersPanel /> : null}
        {tab === 'evidence' ? <EvidencePanel /> : null}
        {tab === 'media' ? <MediaPanel /> : null}
        {tab === 'news' ? <NewsPanel /> : null}
        {tab === 'pages' ? <PagesPanel /> : null}
        {tab === 'social' ? <SocialPanel /> : null}
        {tab === 'blog' ? <BlogPanel /> : null}
        {tab === 'ads' ? <AdsPanel /> : null}
        {tab === 'endings' ? <EndingsPanel /> : null}
        {tab === 'audit' ? <AuditPanel /> : null}
      </main>

      {report ? (
        <div className="report" onClick={() => setReport(null)}>
          <div className="report-box" onClick={(e) => e.stopPropagation()}>
            <div className="report-head">
              <span className="report-title">
                {report.errors.length === 0 ? (
                  <>
                    <CheckCircle2 size={18} strokeWidth={1.75} color="var(--positive)" />
                    História válida
                  </>
                ) : (
                  <>
                    <XCircle size={18} strokeWidth={1.75} color="var(--danger)" />
                    {report.errors.length} erro(s) — exporte só depois de corrigir
                  </>
                )}
              </span>
              <button className="btn small" aria-label="fechar" onClick={() => setReport(null)}>
                <X size={14} strokeWidth={1.75} /> fechar
              </button>
            </div>
            {report.errors.map((e, i) => (
              <p key={i} className="report-error">
                <AlertCircle size={14} strokeWidth={1.75} />
                {e}
              </p>
            ))}
            {report.warnings.map((w, i) => (
              <p key={i} className="report-warn">
                <AlertTriangle size={14} strokeWidth={1.75} />
                {w}
              </p>
            ))}
            {report.errors.length === 0 && report.warnings.length === 0 ? (
              <p className="hint">
                <CheckCircle2 size={14} strokeWidth={1.75} color="var(--positive)" />
                Nenhum problema encontrado.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
