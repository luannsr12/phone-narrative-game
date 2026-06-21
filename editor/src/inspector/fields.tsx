import React, { useId, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Plus, Check, X, Variable, Smile, User, Hash, Link2 } from 'lucide-react';
import { useEditor, uid } from '../store';

// Heavy emoji grid — only pulled in when a picker actually opens.
const EmojiPicker = lazy(() => import('emoji-picker-react'));

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/** One insertable token in the `{{` menu. `insert` is the literal text written. */
export interface VarItem {
  insert: string;
  /** Code shown in the menu (usually the token). */
  code: string;
  label: string;
}
/** A labelled group of tokens (Personagem / Variáveis / Links). */
export interface VarGroup {
  title: string;
  icon: 'char' | 'var' | 'link';
  items: VarItem[];
}

const GROUP_ICON = { char: User, var: Hash, link: Link2 } as const;

/** Always-available identity/variable tokens (every text field offers these). */
const BASE_GROUPS: VarGroup[] = [
  {
    title: 'Personagem',
    icon: 'char',
    items: [
      { insert: '{{player_name}}', code: '{{player_name}}', label: 'Nome do jogador' },
      { insert: '{{player_first_name}}', code: '{{player_first_name}}', label: 'Primeiro nome' },
    ],
  },
  {
    title: 'Variáveis',
    icon: 'var',
    items: [
      { insert: '{{player_gender}}', code: '{{player_gender}}', label: 'Gênero → ele/ela' },
      { insert: '{{g:masculino|feminino}}', code: '{{g:masc|fem}}', label: 'Texto por gênero (edite os dois)' },
    ],
  },
];

interface VarMenuState {
  /** Index in the value where the `{{` trigger starts. */
  start: number;
  filter: string;
}

/**
 * Shared `{{` autocomplete for text fields. Typing `{{` (optionally followed by
 * part of a token) opens a categorised dropdown (Personagem / Variáveis, plus
 * the `extra` groups — Links — passed by the message field). Picking an item
 * writes its token at the cursor. `insertAtCaret` is reused by the emoji button.
 */
function useVarMenu(
  value: string,
  onChange: (v: string) => void,
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  extra?: VarGroup[],
) {
  const [menu, setMenu] = useState<VarMenuState | null>(null);
  const groups = useMemo(() => [...BASE_GROUPS, ...(extra ?? [])], [extra]);

  const refresh = () => {
    const el = ref.current;
    if (!el) return setMenu(null);
    const pos = el.selectionStart ?? 0;
    const before = el.value.slice(0, pos);
    // Match `{{` plus an optional partial token (letters, digits, _ : -).
    const m = before.match(/\{\{\s*([a-zA-Z0-9_:-]*)$/);
    if (m && m.index !== undefined) setMenu({ start: m.index, filter: m[1].toLowerCase() });
    else setMenu(null);
  };

  /** Insert arbitrary text at the caret (used by the emoji button). */
  const insertAtCaret = (text: string) => {
    const el = ref.current;
    const pos = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? pos;
    const next = value.slice(0, pos) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const caret = pos + text.length;
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const pick = (item: VarItem) => {
    const el = ref.current;
    if (!el || menu === null) return;
    const pos = el.selectionStart ?? value.length;
    const next = value.slice(0, menu.start) + item.insert + value.slice(pos);
    onChange(next);
    setMenu(null);
    requestAnimationFrame(() => {
      const caret = menu.start + item.insert.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const matches = (it: VarItem) =>
    !menu?.filter ||
    it.code.toLowerCase().includes(menu.filter) ||
    it.insert.toLowerCase().includes(menu.filter) ||
    it.label.toLowerCase().includes(menu.filter);

  const visible = menu
    ? groups.map((g) => ({ ...g, items: g.items.filter(matches) })).filter((g) => g.items.length)
    : [];

  const dropdown =
    visible.length ? (
      <div className="var-menu">
        {visible.map((g) => {
          const Ico = GROUP_ICON[g.icon];
          return (
            <React.Fragment key={g.title}>
              <div className="var-group-title">
                <Ico size={11} strokeWidth={2} /> {g.title}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.insert + it.label}
                  className="var-item"
                  // mousedown beats the field's blur, so the click always lands
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(it);
                  }}
                >
                  <span className="var-pre">
                    <Variable size={13} strokeWidth={1.75} />
                  </span>
                  <code>{it.code}</code>
                  <span>{it.label}</span>
                </button>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    ) : null;

  return {
    dropdown,
    insertAtCaret,
    onInput: refresh,
    onBlur: () => setMenu(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    },
  };
}

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const vars = useVarMenu(props.value, props.onChange, ref);
  return (
    <div className="var-wrap">
      <input
        ref={ref}
        className="input"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => {
          props.onChange(e.target.value);
          vars.onInput();
        }}
        onKeyUp={vars.onInput}
        onClick={vars.onInput}
        onBlur={vars.onBlur}
        onKeyDown={vars.onKeyDown}
      />
      {vars.dropdown}
    </div>
  );
}

/** A small floating emoji button + picker, inserting at the field's caret. */
function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="emoji-wrap">
      <button
        type="button"
        className={`emoji-btn ${open ? 'active' : ''}`}
        title="Inserir emoji"
        aria-label="Inserir emoji"
        // mousedown would blur the textarea (losing the caret) before the click —
        // use onClick and keep focus by preventing the button's own mousedown.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <Smile size={15} strokeWidth={1.75} />
      </button>
      {open ? (
        <>
          <div className="emoji-backdrop" onMouseDown={() => setOpen(false)} />
          {/* No preventDefault here: the picker's own search box needs focus; the
              textarea keeps its last caret position even while blurred, so the
              insert still lands where the writer was typing. */}
          <div className="emoji-pop">
            <Suspense fallback={<div className="emoji-loading">carregando…</div>}>
              <EmojiPicker
                onEmojiClick={(e: { emoji: string }) => {
                  onPick(e.emoji);
                  setOpen(false);
                }}
                width={300}
                height={380}
                theme={'dark' as never}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
              />
            </Suspense>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * The MESSAGE text field: the full `{{` menu including the Links category
 * (fictional pages, news, Mural posts and profiles a character can send) PLUS an
 * emoji picker. Used only for `message` node text — other fields use TextArea.
 */
export function MessageTextArea(props: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const pages = useEditor((s) => s.bundle.pages);
  const news = useEditor((s) => s.bundle.news);
  const social = useEditor((s) => s.bundle.social);
  const characters = useEditor((s) => s.bundle.characters);
  const npcs = useEditor((s) => s.bundle.socialNpcs);

  const linkGroup = useMemo<VarGroup[]>(() => {
    const items: VarItem[] = [];
    for (const p of Object.values(pages ?? {})) {
      const url = (p.domain || 'site') + (p.path ? `/${p.path.replace(/^\/+/, '')}` : '');
      items.push({ insert: `{{page:${p.id}}}`, code: url, label: p.title || p.id });
    }
    for (const n of Object.values(news)) {
      items.push({ insert: `{{news:${n.id}}}`, code: `notícia`, label: n.headline || n.id });
    }
    for (const p of Object.values(social)) {
      items.push({ insert: `{{post:${p.id}}}`, code: `post @${p.author}`, label: p.caption.slice(0, 40) || p.id });
    }
    items.push({ insert: `{{profile:player}}`, code: 'perfil @você', label: 'Perfil do jogador (Mural)' });
    for (const c of Object.values(characters)) {
      items.push({ insert: `{{profile:${c.id}}}`, code: `perfil @${c.id}`, label: c.name || c.id });
    }
    for (const n of Object.values(npcs)) {
      items.push({ insert: `{{profile:${n.id}}}`, code: `perfil @${n.id}`, label: `NPC: ${n.name || n.id}` });
    }
    return items.length ? [{ title: 'Links', icon: 'link', items }] : [];
  }, [pages, news, social, characters, npcs]);

  const vars = useVarMenu(props.value, props.onChange, ref, linkGroup);

  return (
    <div className="var-wrap rich-area">
      <textarea
        ref={ref}
        className="input"
        rows={props.rows ?? 4}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => {
          props.onChange(e.target.value);
          vars.onInput();
        }}
        onKeyUp={vars.onInput}
        onClick={vars.onInput}
        onBlur={vars.onBlur}
        onKeyDown={vars.onKeyDown}
      />
      <EmojiButton onPick={vars.insertAtCaret} />
      {vars.dropdown}
    </div>
  );
}

export function NumberInput(props: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="input"
      type="number"
      value={props.value ?? ''}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  );
}

export function TextArea(props: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const vars = useVarMenu(props.value, props.onChange, ref);
  return (
    <div className="var-wrap">
      <textarea
        ref={ref}
        className="input"
        rows={props.rows ?? 3}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => {
          props.onChange(e.target.value);
          vars.onInput();
        }}
        onKeyUp={vars.onInput}
        onClick={vars.onInput}
        onBlur={vars.onBlur}
        onKeyDown={vars.onKeyDown}
      />
      {vars.dropdown}
    </div>
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allowEmpty?: string;
}) {
  return (
    <select className="input" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.allowEmpty !== undefined ? <option value="">{props.allowEmpty}</option> : null}
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Character picker; `withSpecial` adds player/system voices. */
export function CharacterSelect(props: {
  value: string;
  onChange: (v: string) => void;
  withSpecial?: boolean;
  allowEmpty?: string;
}) {
  const characters = useEditor((s) => s.bundle.characters);
  const opts = [
    ...(props.withSpecial
      ? [
          { value: 'player', label: 'Jogador' },
          { value: 'system', label: 'Narração/Sistema' },
        ]
      : []),
    ...Object.values(characters).map((c) => ({ value: c.id, label: `${c.name} (${c.id})` })),
  ];
  return <Select value={props.value} onChange={props.onChange} options={opts} allowEmpty={props.allowEmpty} />;
}

export function EvidenceSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const evidence = useEditor((s) => s.bundle.evidence);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(evidence).map((e) => ({ value: e.id, label: `${e.title} (${e.id})` }))}
    />
  );
}

export function NewsSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const news = useEditor((s) => s.bundle.news);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(news).map((n) => ({ value: n.id, label: `${n.headline} (${n.id})` }))}
    />
  );
}

/** Mural account picker: case characters + filler NPCs. */
export function AccountSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const characters = useEditor((s) => s.bundle.characters);
  const npcs = useEditor((s) => s.bundle.socialNpcs);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={[
        { value: 'player', label: 'Você (o jogador) (@voce)' },
        ...Object.values(characters).map((c) => ({ value: c.id, label: `${c.name} (@${c.id})` })),
        ...Object.values(npcs).map((n) => ({ value: n.id, label: `NPC: ${n.name} (@${n.id})` })),
      ]}
    />
  );
}

export function SocialSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const social = useEditor((s) => s.bundle.social);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(social).map((p) => ({
        value: p.id,
        label: `${p.caption.slice(0, 40) || p.id} (@${p.author})`,
      }))}
    />
  );
}

/** Lists every authored Mural comment that has a stable id (only those can be liked/referenced). */
export function CommentSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const social = useEditor((s) => s.bundle.social);
  const options: { value: string; label: string }[] = [];
  for (const post of Object.values(social)) {
    for (const c of post.comments ?? []) {
      if (!c.id) continue;
      options.push({
        value: c.id,
        label: `@${c.author}: ${(c.text || '').slice(0, 32)} — em ${post.id}`,
      });
    }
  }
  return (
    <Select value={props.value} onChange={props.onChange} allowEmpty={props.allowEmpty} options={options} />
  );
}

export function BlogSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const blog = useEditor((s) => s.bundle.blog);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(blog ?? {}).map((p) => ({ value: p.id, label: `${p.title || p.id} (${p.id})` }))}
    />
  );
}

export function StorySelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const stories = useEditor((s) => s.bundle.socialStories);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(stories).map((p) => ({
        value: p.id,
        label: `@${p.author}: ${(p.text ?? p.id).slice(0, 40)}`,
      }))}
    />
  );
}

export function EndingSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const endings = useEditor((s) => s.bundle.endings);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={Object.values(endings).map((e) => ({ value: e.id, label: `${e.title} (${e.id})` }))}
    />
  );
}

/**
 * Every flag name used ANYWHERE in the project — collected from `setFlag`
 * effects and `flag`/`flagEquals` conditions, wherever they live (nodes, choice
 * options, call sub-flows, comment options, blog options…). There is no flag
 * registry; this is the de-facto list of "created" flags.
 */
function collectFlagNames(bundle: unknown): string[] {
  const set = new Set<string>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    const o = v as Record<string, unknown>;
    if (
      (o.type === 'setFlag' || o.type === 'flag' || o.type === 'flagEquals') &&
      typeof o.flag === 'string' &&
      o.flag.trim()
    ) {
      set.add(o.flag);
    }
    for (const k in o) {
      if (k === '_editor') continue; // layout data, no flags
      walk(o[k]);
    }
  };
  walk(bundle);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Flag picker: a free text input PLUS a visible, clickable list of every flag
 * already used in the project — pick one (no typos) or type a brand-new one
 * (flags are "created" by typing them in a setFlag effect). The chips are the
 * always-visible list; the datalist gives type-ahead too. The datalist id is
 * sanitized (useId() emits colons, which break the input↔datalist link).
 */
export function FlagInput(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const bundle = useEditor((s) => s.bundle);
  const flags = useMemo(() => collectFlagNames(bundle), [bundle]);
  const listId = 'flags-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <>
      <input
        className="input"
        list={listId}
        value={props.value}
        placeholder={props.placeholder ?? 'ex.: has_notebook'}
        onChange={(e) => props.onChange(e.target.value)}
      />
      <datalist id={listId}>
        {flags.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      {flags.length ? (
        <div className="flag-picks">
          {flags.map((f) => (
            <button
              key={f}
              type="button"
              className={`flag-pick ${props.value === f ? 'active' : ''}`}
              onClick={() => props.onChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      ) : (
        <span className="hint">Nenhuma flag criada ainda — crie uma com o efeito "Definir flag".</span>
      )}
    </>
  );
}

/**
 * Media picker: choose a file from the Media library — or create one inline
 * (name + URL) without leaving the flow. `kind` filters the list and stamps new
 * items; omit to allow any. Stores the media id.
 */
export function MediaSelect(props: {
  value?: string;
  onChange: (v: string | undefined) => void;
  kind?: 'audio' | 'video' | 'image';
  allowEmpty?: string;
}) {
  const media = useEditor((s) => s.bundle.media);
  const upsertMedia = useEditor((s) => s.upsertMedia);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  // When the field doesn't fix a kind (e.g. evidence accepts any), let the
  // inline-create choose it instead of silently defaulting to audio.
  const [newKind, setNewKind] = useState<'audio' | 'video' | 'image'>('image');

  const items = Object.values(media ?? {}).filter((m) => !props.kind || m.kind === props.kind);
  // Group by category for the dropdown (uncategorised first).
  const uncategorised = items.filter((m) => !m.category);
  const byCategory = new Map<string, typeof items>();
  for (const m of items) {
    if (!m.category) continue;
    const list = byCategory.get(m.category) ?? [];
    list.push(m);
    byCategory.set(m.category, list);
  }
  const optLabel = (m: (typeof items)[number]) => (m.name || m.id) + (props.kind ? '' : ` · ${m.kind}`);

  const add = () => {
    if (!url.trim()) return;
    const id = uid('media');
    upsertMedia({ id, name: name.trim() || id, kind: props.kind ?? newKind, url: url.trim() });
    props.onChange(id);
    setCreating(false);
    setName('');
    setUrl('');
  };

  if (creating) {
    return (
      <div className="media-create">
        {!props.kind ? (
          <select
            className="input"
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as 'audio' | 'video' | 'image')}
          >
            <option value="image">Imagem</option>
            <option value="audio">Áudio (MP3)</option>
            <option value="video">Vídeo</option>
          </select>
        ) : null}
        <input className="input" placeholder="nome da mídia" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input"
          placeholder="URL do arquivo (mp3/vídeo)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <div className="media-create-actions">
          <button className="btn accent small" type="button" onClick={add} disabled={!url.trim()}>
            <Check size={14} strokeWidth={1.75} /> adicionar
          </button>
          <button
            className="btn small"
            type="button"
            onClick={() => {
              setCreating(false);
              setName('');
              setUrl('');
            }}
          >
            <X size={14} strokeWidth={1.75} /> cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-select">
      <select
        className="input"
        value={props.value ?? ''}
        onChange={(e) => props.onChange(e.target.value || undefined)}
      >
        <option value="">{props.allowEmpty ?? '— escolher mídia —'}</option>
        {uncategorised.map((m) => (
          <option key={m.id} value={m.id}>
            {optLabel(m)}
          </option>
        ))}
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <optgroup key={cat} label={cat}>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {optLabel(m)}
              </option>
            ))}
          </optgroup>
        ))}
        {props.value && !media?.[props.value] ? (
          <option value={props.value}>{props.value} (mídia não encontrada)</option>
        ) : null}
      </select>
      <button className="btn small" type="button" onClick={() => setCreating(true)} title="criar nova mídia">
        <Plus size={14} strokeWidth={1.75} /> nova
      </button>
    </div>
  );
}

export function ChapterSelect(props: { value: string; onChange: (v: string) => void; allowEmpty?: string }) {
  const bundle = useEditor((s) => s.bundle);
  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowEmpty={props.allowEmpty}
      options={bundle.chapterOrder.map((id) => ({
        value: id,
        label: `${bundle.chapters[id]?.title ?? id} (${id})`,
      }))}
    />
  );
}
