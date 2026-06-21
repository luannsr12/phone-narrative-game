import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, BookmarkCheck, User, Newspaper, Megaphone, Globe } from 'lucide-react';
import { useEditor, uid } from '../store';
import type { Character, CharacterSocial, Evidence, MediaItem, NewsArticle, WebPage, Ending, EvidenceKind, SeedMessage, SocialPost, SocialStoryItem, SocialNpc, Ad, BlogPost, BlogContentOption, PostComment, PostCommentOption, PlayerProfile } from '../types';
import { EVIDENCE_KIND_LABEL } from '../types';
import { Field, TextInput, NumberInput, TextArea, Select, MediaSelect, CharacterSelect, AccountSelect, ChapterSelect, StorySelect, EvidenceSelect } from '../inspector/fields';
import { EffectsEditor } from '../inspector/EffectsEditor';
import { ConditionEditor } from '../inspector/ConditionEditor';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || `item_${Date.now().toString(36)}`;
}

function ListForm<T extends { id: string }>(props: {
  items: Record<string, T>;
  titleOf: (t: T) => string;
  subtitleOf?: (t: T) => string;
  /** When set, the list is split into labelled sections by the returned key. */
  groupBy?: (t: T) => { key: string; label: string };
  /** Keep only items that pass (search / author filter); applied before grouping. */
  filter?: (t: T) => boolean;
  /** A sticky toolbar (search/filter) pinned above the scrolling list. */
  listHeader?: React.ReactNode;
  onCreate: () => void;
  onRemove: (id: string) => void;
  renderForm: (item: T) => React.ReactNode;
  createLabel: string;
  topExtra?: React.ReactNode;
  /** Let the form use the full width (preview-beside-form layouts). */
  wide?: boolean;
  /** Controlled selection (e.g. cross-tab "open this post"); omit for internal. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  emptyHint?: string;
}) {
  const [internalSel, setInternalSel] = useState<string | null>(null);
  const controlled = props.selectedId !== undefined;
  const selected = controlled ? props.selectedId ?? null : internalSel;
  const setSelected = (id: string | null) => {
    props.onSelect?.(id);
    if (!controlled) setInternalSel(id);
  };
  const item = selected ? props.items[selected] : undefined;
  const all = Object.values(props.items).filter(props.filter ?? (() => true));

  const renderItem = (it: T) => (
    <button
      key={it.id}
      className={`list-item ${selected === it.id ? 'active' : ''}`}
      onClick={() => setSelected(it.id)}
    >
      <span className="list-title">{props.titleOf(it)}</span>
      {props.subtitleOf ? <span className="list-sub">{props.subtitleOf(it)}</span> : null}
      <code className="list-id">{it.id}</code>
    </button>
  );

  // Group items (preserving first-seen order, then sorted by label) when asked.
  const groups: { key: string; label: string; items: T[] }[] = [];
  if (props.groupBy) {
    const index = new Map<string, number>();
    for (const it of all) {
      const g = props.groupBy(it);
      let i = index.get(g.key);
      if (i === undefined) {
        i = groups.length;
        index.set(g.key, i);
        groups.push({ key: g.key, label: g.label, items: [] });
      }
      groups[i].items.push(it);
    }
    groups.sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <div className="registry">
      <div className="registry-list">
        <button className="btn accent" onClick={props.onCreate}>
          <Plus size={15} strokeWidth={1.75} /> {props.createLabel.replace(/^\+\s*/, '')}
        </button>
        {props.topExtra}
        {props.listHeader ? <div className="list-toolbar">{props.listHeader}</div> : null}
        {all.length === 0 ? (
          <p className="hint" style={{ padding: '4px 2px' }}>
            {props.emptyHint ?? 'Nada por aqui ainda.'}
          </p>
        ) : props.groupBy ? (
          groups.map((g) => (
            <React.Fragment key={g.key}>
              <div className="registry-group-title">
                {g.label} <span>{g.items.length}</span>
              </div>
              {g.items.map(renderItem)}
            </React.Fragment>
          ))
        ) : (
          all.map(renderItem)
        )}
      </div>
      <div className={`registry-form ${props.wide ? 'wide' : ''}`}>
        {item ? (
          <>
            <div className="inspector-actions">
              <button
                className="btn danger small"
                onClick={() => {
                  props.onRemove(item.id);
                  setSelected(null);
                }}
              >
                <Trash2 size={14} strokeWidth={1.75} /> excluir
              </button>
            </div>
            {props.renderForm(item)}
          </>
        ) : (
          <p className="hint">Selecione um item à esquerda ou crie um novo.</p>
        )}
      </div>
    </div>
  );
}

/** Cross-tab navigation between Mural posts/stories and the profile editors. */
interface SocialNav {
  openPosts: (author: string) => void;
  openStories: (author: string) => void;
  openPost: (id: string, author: string) => void;
  openStory: (id: string, author: string) => void;
  newPost: (author: string) => void;
  newStory: (author: string) => void;
}

/**
 * Inside a profile editor: that account's Mural publications and stories, with
 * quick jumps to edit them and "+ nova/novo" that pre-fills the author. This is
 * what visibly LINKS publications to their profile — and lets a character post
 * under their chat identity without needing a custom Mural profile.
 */
function ProfileContentSection({ author, nav }: { author: string; nav: SocialNav }) {
  const social = useEditor((s) => s.bundle.social);
  const stories = useEditor((s) => s.bundle.socialStories);
  const posts = Object.values(social).filter((p) => p.author === author);
  const sts = Object.values(stories).filter((s) => s.author === author);

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Publicações no Mural <span className="count-chip">{posts.length}</span></span>
        <button className="btn small" onClick={() => nav.newPost(author)}>
          <Plus size={14} strokeWidth={1.75} /> nova
        </button>
      </div>
      {posts.length ? (
        posts.map((p) => (
          <button key={p.id} className="link-row" onClick={() => nav.openPost(p.id, author)}>
            <span className="link-row-title">{p.caption.slice(0, 64) || '(sem legenda)'}</span>
            <span className="link-row-sub">{p.date || 'sem data'} · {p.likes} curtidas</span>
          </button>
        ))
      ) : (
        <p className="hint">Nenhuma publicação deste perfil ainda.</p>
      )}

      <div className="subsection-head" style={{ marginTop: 'var(--s3)' }}>
        <span>Stories <span className="count-chip">{sts.length}</span></span>
        <button className="btn small" onClick={() => nav.newStory(author)}>
          <Plus size={14} strokeWidth={1.75} /> novo
        </button>
      </div>
      {sts.length ? (
        sts.map((p) => (
          <button key={p.id} className="link-row" onClick={() => nav.openStory(p.id, author)}>
            <span className="link-row-title">{p.text?.slice(0, 64) || '(story sem texto)'}</span>
            <span className="link-row-sub">{p.date || 'sem data'}</span>
          </button>
        ))
      ) : (
        <p className="hint">Nenhum story deste perfil ainda.</p>
      )}
    </div>
  );
}

/** Resolve a Media library id (or fallback url) to a usable image src. */
function useMediaResolver() {
  const media = useEditor((s) => s.bundle.media);
  return (id?: string, url?: string) => (id ? media?.[id]?.url : undefined) || url || undefined;
}

/** Human label for a Mural account id (player / character / NPC). */
function useAccountLabeler() {
  const characters = useEditor((s) => s.bundle.characters);
  const npcs = useEditor((s) => s.bundle.socialNpcs);
  return (author: string) => {
    if (author === 'player') return 'Você (o jogador)';
    const c = characters[author];
    if (c) return c.name || author;
    const n = npcs[author];
    if (n) return `NPC · ${n.name || author}`;
    return author ? `@${author}` : '(sem autor)';
  };
}

/** A small Instagram-style profile preview card (avatar + name + bio + stats). */
function ProfilePreview(props: {
  avatarUrl?: string;
  initials?: string;
  avatarColor?: string;
  name: string;
  handle?: string;
  sub?: string;
  bio?: string;
  stats?: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="profile-card">
      <span className="profile-card-tag">pré-visualização</span>
      <span className="profile-card-avatar" style={{ background: props.avatarColor || '#2a3344' }}>
        {props.avatarUrl ? <img src={props.avatarUrl} alt="" /> : <span>{props.initials || '?'}</span>}
      </span>
      <div className="profile-card-name">{props.name || '(sem nome)'}</div>
      {props.handle ? <div className="profile-card-handle">@{props.handle}</div> : null}
      {props.sub ? <div className="profile-card-sub">{props.sub}</div> : null}
      {props.stats?.length ? (
        <div className="profile-card-stats">
          {props.stats.map((s) => (
            <div key={s.label} className="profile-card-stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {props.bio ? <div className="profile-card-bio">{props.bio}</div> : <div className="profile-card-empty">sem bio</div>}
    </div>
  );
}

export function CharactersPanel() {
  const characters = useEditor((s) => s.bundle.characters);
  const upsert = useEditor((s) => s.upsertCharacter);
  const remove = useEditor((s) => s.removeCharacter);

  return (
    <ListForm
      items={characters}
      titleOf={(c) => c.name || '(sem nome)'}
      subtitleOf={(c) => c.role}
      createLabel="+ Novo personagem"
      onCreate={() => {
        const id = slugify(`p${Object.keys(characters).length + 1}`);
        upsert({
          id,
          name: '',
          fullName: '',
          role: '',
          introChapter: '',
          initials: '?',
          avatarColor: '#6C8AE4',
          bio: '',
          writingStyle: '',
        });
      }}
      onRemove={remove}
      wide
      renderForm={(c: Character) => <CharacterForm character={c} onChange={upsert} onRename={remove} />}
    />
  );
}

/** Contact/chat identity form for a character, with a live profile preview. */
function CharacterForm({
  character: c,
  onChange,
  onRename,
}: {
  character: Character;
  onChange: (c: Character) => void;
  onRename: (oldId: string) => void;
}) {
  const resolve = useMediaResolver();
  return (
    <div className="profile-edit">
      <div className="profile-edit-main">
        <Field label="ID (usado nos nós — cuidado ao mudar)">
          <TextInput value={c.id} onChange={(v) => { onRename(c.id); onChange({ ...c, id: slugify(v) || c.id }); }} />
        </Field>
        <Field label="Nome de exibição (no chat)">
          <TextInput value={c.name} onChange={(v) => onChange({ ...c, name: v, initials: c.initials === '?' && v ? v.slice(0, 2).toUpperCase() : c.initials })} />
        </Field>
        <Field label="Nome completo">
          <TextInput value={c.fullName} onChange={(v) => onChange({ ...c, fullName: v })} />
        </Field>
        <div className="field-row">
          <Field label="Idade">
            <NumberInput value={c.age} onChange={(v) => onChange({ ...c, age: v })} />
          </Field>
          <Field label="Papel na história">
            <TextInput value={c.role} onChange={(v) => onChange({ ...c, role: v })} placeholder="ex.: Irmão de Lia" />
          </Field>
        </div>
        <Field label="Capítulo em que surge (referência)">
          <ChapterSelect value={c.introChapter} onChange={(v) => onChange({ ...c, introChapter: v })} allowEmpty="—" />
        </Field>
        <Field label="Número de telefone (mostrado antes de salvar o contato; vazio = número automático)">
          <TextInput
            value={c.phone ?? ''}
            onChange={(v) => onChange({ ...c, phone: v || undefined })}
            placeholder="ex.: +55 11 91234-5678"
          />
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={Boolean(c.startsUnlocked)}
            onChange={(e) => onChange({ ...c, startsUnlocked: e.target.checked || undefined })}
          />
          <span className="check-ico"><BookmarkCheck size={14} strokeWidth={1.75} /></span>
          <span>Já salvo na agenda desde o início (família, amigos do jogador)</span>
        </label>
        <Field label="Conta bancária fictícia (transferências do jogador para este número chegam ao personagem)">
          <TextInput
            value={c.bankAccount ?? ''}
            onChange={(v) => onChange({ ...c, bankAccount: v || undefined })}
            placeholder="ex.: 21407-3"
          />
        </Field>
        <div className="field-row">
          <Field label="Iniciais do avatar">
            <TextInput value={c.initials} onChange={(v) => onChange({ ...c, initials: v.slice(0, 2).toUpperCase() })} />
          </Field>
          <Field label="Cor do avatar (hex)">
            <TextInput value={c.avatarColor} onChange={(v) => onChange({ ...c, avatarColor: v })} placeholder="#6C8AE4" />
          </Field>
        </div>
        <Field label="Foto de perfil (mídia — Contatos/conversas)">
          <MediaSelect kind="image" value={c.avatarMedia} onChange={(v) => onChange({ ...c, avatarMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
        </Field>
        <Field label="Ou link direto da foto (opcional)">
          <TextInput value={c.avatarUrl ?? ''} onChange={(v) => onChange({ ...c, avatarUrl: v || undefined })} placeholder="https://…" />
        </Field>
        <Field label="Bio pública (sem spoiler — aparece no perfil de Contatos)">
          <TextArea value={c.bio} onChange={(v) => onChange({ ...c, bio: v })} />
        </Field>
        <Field label="Estilo de escrita (nota para os roteiristas)">
          <TextArea value={c.writingStyle} onChange={(v) => onChange({ ...c, writingStyle: v })} />
        </Field>
        <InitialChatEditor character={c} onChange={onChange} />
      </div>
      <aside className="profile-edit-aside">
        <ProfilePreview
          avatarUrl={resolve(c.avatarMedia, c.avatarUrl)}
          initials={c.initials}
          avatarColor={c.avatarColor}
          name={c.name}
          sub={c.role || c.fullName}
          bio={c.bio}
        />
        <p className="hint">
          Identidade nas <b>Conversas/Contatos</b>. A presença no <b>Mural</b> (foto, bio, seguidores)
          é separada e fica na aba <b>Rede Social → Perfis</b>.
        </p>
      </aside>
    </div>
  );
}

/**
 * Pre-existing conversation with this contact when the game starts (already
 * read). "Minutos atrás" counts back from the moment the player starts a new
 * game — e.g. 1440 = um dia antes.
 */
function InitialChatEditor({
  character,
  onChange,
}: {
  character: Character;
  onChange: (c: Character) => void;
}) {
  const list = character.initialChat ?? [];
  const set = (next: SeedMessage[]) =>
    onChange({ ...character, initialChat: next.length ? next : undefined });

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Conversa inicial (já existe ao começar o jogo)</span>
        <button
          className="btn small"
          onClick={() =>
            set([...list, { text: '', minutesAgo: (list[list.length - 1]?.minutesAgo ?? 1445) - 5 }])
          }
        >
          <Plus size={14} strokeWidth={1.75} /> mensagem
        </button>
      </div>
      {list.length ? (
        <p className="hint">
          Histórico cotidiano que já está no celular (lido, sem badge). "Minutos atrás" conta a
          partir do início do jogo — 1440 = um dia antes.
        </p>
      ) : null}
      {list.map((m, i) => (
        <div key={i} className="card">
          <div className="card-head">
            <span className="tag">mensagem {i + 1}</span>
            <button className="btn danger small" onClick={() => set(list.filter((_, j) => j !== i))}>
              <Trash2 size={14} strokeWidth={1.75} /> remover
            </button>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(m.fromPlayer)}
              onChange={(e) =>
                set(list.map((x, j) => (j === i ? { ...x, fromPlayer: e.target.checked || undefined } : x)))
              }
            />
            <span className="check-ico"><User size={14} strokeWidth={1.75} /></span>
            <span>Enviada pelo jogador (senão, pelo personagem)</span>
          </label>
          <Field label="Texto">
            <TextArea
              value={m.text}
              onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, text: v } : x)))}
              rows={2}
            />
          </Field>
          <Field label="Minutos atrás (1440 = um dia antes)">
            <NumberInput
              value={m.minutesAgo}
              onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, minutesAgo: v } : x)))}
              placeholder="1440"
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

export function EvidencePanel() {
  const evidence = useEditor((s) => s.bundle.evidence);
  const upsert = useEditor((s) => s.upsertEvidence);
  const remove = useEditor((s) => s.removeEvidence);

  return (
    <ListForm
      items={evidence}
      titleOf={(e) => e.title || '(sem título)'}
      subtitleOf={(e) => EVIDENCE_KIND_LABEL[e.kind]}
      createLabel="+ Nova evidência"
      onCreate={() => {
        const id = `ev_${Date.now().toString(36)}`;
        upsert({ id, kind: 'photo', title: '', description: '', source: 'system', caseRelevance: '' });
      }}
      onRemove={remove}
      renderForm={(e: Evidence) => (
        <>
          <Field label="ID">
            <TextInput value={e.id} onChange={(v) => { remove(e.id); upsert({ ...e, id: slugify(v) || e.id }); }} />
          </Field>
          <Field label="Tipo">
            <Select
              value={e.kind}
              onChange={(v) => upsert({ ...e, kind: v as EvidenceKind })}
              options={Object.entries(EVIDENCE_KIND_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <Field label="Título">
            <TextInput value={e.title} onChange={(v) => upsert({ ...e, title: v })} />
          </Field>
          <Field label="Descrição curta">
            <TextArea value={e.description} onChange={(v) => upsert({ ...e, description: v })} rows={2} />
          </Field>
          <Field label="Quem envia (metadado)">
            <CharacterSelect value={e.source} onChange={(v) => upsert({ ...e, source: v })} withSpecial allowEmpty="—" />
          </Field>
          <Field label="Ligação com o caso (metadado)">
            <TextArea value={e.caseRelevance} onChange={(v) => upsert({ ...e, caseRelevance: v })} rows={2} />
          </Field>
          <Field label="Mídia da biblioteca (imagem/áudio/vídeo)">
            <MediaSelect value={e.media} onChange={(v) => upsert({ ...e, media: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
          </Field>
          <Field label="Ou link direto da mídia (opcional)">
            <TextInput value={e.url ?? ''} onChange={(v) => upsert({ ...e, url: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Cor da miniatura (hex, fallback sem imagem)">
            <TextInput value={e.thumbnailColor ?? ''} onChange={(v) => upsert({ ...e, thumbnailColor: v || undefined })} placeholder="#1C2230" />
          </Field>
          <Field label="Conteúdo/transcrição (texto integral)">
            <TextArea value={e.body ?? ''} onChange={(v) => upsert({ ...e, body: v || undefined })} rows={4} />
          </Field>
        </>
      )}
    />
  );
}

const MEDIA_KIND_LABEL: Record<string, string> = { audio: 'Áudio', video: 'Vídeo', image: 'Imagem' };

export function MediaPanel() {
  const media = useEditor((s) => s.bundle.media);
  const upsert = useEditor((s) => s.upsertMedia);
  const remove = useEditor((s) => s.removeMedia);

  // Existing categories (for the "create category by typing" datalist).
  const categories = Array.from(
    new Set(Object.values(media ?? {}).map((m) => m.category).filter(Boolean) as string[]),
  ).sort();

  return (
    <ListForm
      items={media}
      titleOf={(m) => m.name || '(sem nome)'}
      subtitleOf={(m) => `${MEDIA_KIND_LABEL[m.kind] ?? m.kind}${m.category ? ` · ${m.category}` : ''}`}
      createLabel="+ Nova mídia"
      topExtra={
        <p className="hint">
          Centralize aqui os MP3/vídeos/imagens linkados. Mensagens, ligações, evidências, notícias,
          blog, Mural e fotos de perfil passam a <b>escolher uma mídia</b> daqui. Use a
          <b> categoria</b> só pra organizar (ex.: "Lia — fotos").
        </p>
      }
      onCreate={() => {
        const id = `media_${Date.now().toString(36)}`;
        upsert({ id, name: '', kind: 'image', url: '' });
      }}
      onRemove={remove}
      renderForm={(m: MediaItem) => (
        <>
          <Field label="ID">
            <TextInput value={m.id} onChange={(v) => { remove(m.id); upsert({ ...m, id: slugify(v) || m.id }); }} />
          </Field>
          <Field label="Nome">
            <TextInput value={m.name} onChange={(v) => upsert({ ...m, name: v })} placeholder="ex.: Lia — foto de perfil" />
          </Field>
          <Field label="Tipo">
            <Select
              value={m.kind}
              onChange={(v) => upsert({ ...m, kind: v as MediaItem['kind'] })}
              options={[
                { value: 'image', label: 'Imagem' },
                { value: 'audio', label: 'Áudio (MP3)' },
                { value: 'video', label: 'Vídeo' },
              ]}
            />
          </Field>
          <Field label="Categoria (organização — opcional)">
            <input
              className="input"
              list="media-categories"
              value={m.category ?? ''}
              onChange={(e) => upsert({ ...m, category: e.target.value || undefined })}
              placeholder="ex.: Lia — fotos, Evidências…"
            />
            <datalist id="media-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="URL do arquivo">
            <TextInput value={m.url} onChange={(v) => upsert({ ...m, url: v })} placeholder="https://…" />
          </Field>
        </>
      )}
    />
  );
}

export function NewsPanel() {
  const news = useEditor((s) => s.bundle.news);
  const upsert = useEditor((s) => s.upsertNews);
  const remove = useEditor((s) => s.removeNews);

  return (
    <ListForm
      items={news}
      titleOf={(n) => n.headline || '(sem manchete)'}
      subtitleOf={(n) => n.outlet}
      createLabel="+ Nova notícia"
      onCreate={() => {
        const id = `news_${Date.now().toString(36)}`;
        upsert({ id, outlet: '', headline: '', date: '', body: '' });
      }}
      onRemove={remove}
      renderForm={(n: NewsArticle) => (
        <>
          <Field label="ID">
            <TextInput value={n.id} onChange={(v) => { remove(n.id); upsert({ ...n, id: slugify(v) || n.id }); }} />
          </Field>
          <Field label="Veículo">
            <TextInput value={n.outlet} onChange={(v) => upsert({ ...n, outlet: v })} placeholder="ex.: Gazeta de Ravenwood" />
          </Field>
          <Field label="Manchete">
            <TextInput value={n.headline} onChange={(v) => upsert({ ...n, headline: v })} />
          </Field>
          <Field label="Data exibida">
            <TextInput value={n.date} onChange={(v) => upsert({ ...n, date: v })} placeholder="ex.: Quinta passada" />
          </Field>
          <Field label="Imagem da matéria (mídia)">
            <MediaSelect kind="image" value={n.imageMedia} onChange={(v) => upsert({ ...n, imageMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
          </Field>
          <Field label="Ou link direto da imagem (opcional)">
            <TextInput value={n.imageUrl ?? ''} onChange={(v) => upsert({ ...n, imageUrl: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Texto da matéria (linha em branco separa parágrafos no site)">
            <TextArea value={n.body} onChange={(v) => upsert({ ...n, body: v })} rows={6} />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(n.initial)}
              onChange={(e) => upsert({ ...n, initial: e.target.checked || undefined })}
            />
            <span className="check-ico"><Newspaper size={14} strokeWidth={1.75} /></span>
            <span>Visível desde o início do jogo (notícia geral, sem relação com a trama)</span>
          </label>
          {!n.initial ? (
            <p className="hint">Para a notícia aparecer no jogo, use o efeito "Publicar notícia" em algum nó.</p>
          ) : null}
        </>
      )}
    />
  );
}

/** Fictional web pages openable in the in-game browser (chat links → kind `page`). */
export function PagesPanel() {
  const pages = useEditor((s) => s.bundle.pages ?? {});
  const upsert = useEditor((s) => s.upsertPage);
  const remove = useEditor((s) => s.removePage);

  // Existing domains feed the "type to reuse a domain" datalist.
  const domains = Array.from(
    new Set(Object.values(pages).map((p) => p.domain).filter(Boolean)),
  ).sort();

  const fullUrl = (p: WebPage) => {
    const d = (p.domain || 'site.com').replace(/\/+$/, '');
    const path = (p.path ?? '').replace(/^\/+/, '');
    return path ? `${d}/${path}` : d;
  };

  return (
    <ListForm
      items={pages}
      titleOf={(p) => p.title || '(sem título)'}
      subtitleOf={(p) => fullUrl(p)}
      groupBy={(p) => ({ key: p.domain || '(sem domínio)', label: p.domain || '(sem domínio)' })}
      createLabel="+ Nova página"
      topExtra={
        <p className="hint">
          <Globe size={13} strokeWidth={1.75} /> Sites fictícios que abrem no navegador do jogo. Um
          personagem manda o link numa mensagem (digite <code>{'{{'}</code> no texto → <b>Links</b>).
          Páginas do mesmo <b>domínio</b> ficam agrupadas só pra organização.
        </p>
      }
      onCreate={() => {
        const id = `page_${Date.now().toString(36)}`;
        upsert({ id, domain: '', title: '', body: '' });
      }}
      onRemove={remove}
      renderForm={(p: WebPage) => (
        <>
          <Field label="ID (usado no link {{page:id}})">
            <TextInput value={p.id} onChange={(v) => { remove(p.id); upsert({ ...p, id: slugify(v) || p.id }); }} />
          </Field>
          <Field label="Domínio fictício (agrupa as páginas)">
            <input
              className="input"
              list="page-domains"
              value={p.domain}
              onChange={(e) => upsert({ ...p, domain: e.target.value })}
              placeholder="ex.: ravenwoodgazette.com.br"
            />
            <datalist id="page-domains">
              {domains.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Caminho (opcional — vai depois do domínio)">
            <TextInput value={p.path ?? ''} onChange={(v) => upsert({ ...p, path: v || undefined })} placeholder="ex.: perfil/lia" />
          </Field>
          <p className="hint">Endereço exibido: <code>{fullUrl(p)}</code></p>
          <Field label="Título da página">
            <TextInput value={p.title} onChange={(v) => upsert({ ...p, title: v })} placeholder="ex.: Perfil — Lia Moreaux" />
          </Field>
          <Field label="Imagem de capa (mídia)">
            <MediaSelect kind="image" value={p.imageMedia} onChange={(v) => upsert({ ...p, imageMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
          </Field>
          <Field label="Ou link direto da imagem (opcional)">
            <TextInput value={p.imageUrl ?? ''} onChange={(v) => upsert({ ...p, imageUrl: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Conteúdo da página (linha em branco separa parágrafos)">
            <TextArea value={p.body ?? ''} onChange={(v) => upsert({ ...p, body: v || undefined })} rows={8} />
          </Field>
        </>
      )}
    />
  );
}

export function SocialPanel() {
  const [mode, setMode] = useState<'posts' | 'stories' | 'cast' | 'npcs'>('posts');
  // Shared so a profile editor can jump straight to (or create) its content.
  const [postAuthor, setPostAuthor] = useState('');
  const [storyAuthor, setStoryAuthor] = useState('');
  const [postSel, setPostSel] = useState<string | null>(null);
  const [storySel, setStorySel] = useState<string | null>(null);
  const upsertSocial = useEditor((s) => s.upsertSocial);
  const upsertStory = useEditor((s) => s.upsertStory);

  const nPosts = useEditor((s) => Object.keys(s.bundle.social).length);
  const nStories = useEditor((s) => Object.keys(s.bundle.socialStories).length);
  const nCast = useEditor((s) => Object.keys(s.bundle.characters).length + 1);
  const nNpcs = useEditor((s) => Object.keys(s.bundle.socialNpcs).length);

  const nav: SocialNav = {
    openPosts: (author) => { setPostAuthor(author); setPostSel(null); setMode('posts'); },
    openStories: (author) => { setStoryAuthor(author); setStorySel(null); setMode('stories'); },
    openPost: (id, author) => { setPostAuthor(author); setPostSel(id); setMode('posts'); },
    openStory: (id, author) => { setStoryAuthor(author); setStorySel(id); setMode('stories'); },
    newPost: (author) => {
      const id = `post_${Date.now().toString(36)}`;
      upsertSocial({ id, author, caption: '', likes: 0, date: '', comments: [] });
      setPostAuthor(author);
      setPostSel(id);
      setMode('posts');
    },
    newStory: (author) => {
      const id = `story_${Date.now().toString(36)}`;
      upsertStory({ id, author, text: '', date: '', durationSec: 5 });
      setStoryAuthor(author);
      setStorySel(id);
      setMode('stories');
    },
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="palette">
        <button className={`btn ${mode === 'posts' ? 'accent' : ''}`} onClick={() => setMode('posts')}>
          Publicações ({nPosts})
        </button>
        <button className={`btn ${mode === 'stories' ? 'accent' : ''}`} onClick={() => setMode('stories')}>
          Stories ({nStories})
        </button>
        <button className={`btn ${mode === 'cast' ? 'accent' : ''}`} onClick={() => setMode('cast')}>
          Perfis — Elenco ({nCast})
        </button>
        <button className={`btn ${mode === 'npcs' ? 'accent' : ''}`} onClick={() => setMode('npcs')}>
          Perfis — NPCs ({nNpcs})
        </button>
      </div>
      {mode === 'posts' ? (
        <SocialPostsPanel author={postAuthor} setAuthor={setPostAuthor} sel={postSel} setSel={setPostSel} />
      ) : mode === 'stories' ? (
        <SocialStoriesPanel author={storyAuthor} setAuthor={setStoryAuthor} sel={storySel} setSel={setStorySel} />
      ) : mode === 'cast' ? (
        <SocialCastProfilesPanel nav={nav} />
      ) : (
        <SocialNpcProfilesPanel nav={nav} />
      )}
    </div>
  );
}

/** Author dropdown + caption search shared by the posts & stories lists. */
function AuthorFilterBar(props: {
  author: string;
  setAuthor: (v: string) => void;
  query: string;
  setQuery: (v: string) => void;
  authors: { id: string; label: string; count: number }[];
  totalLabel: string;
  searchPlaceholder: string;
}) {
  return (
    <>
      <Select
        value={props.author}
        onChange={props.setAuthor}
        allowEmpty={props.totalLabel}
        options={props.authors.map((a) => ({ value: a.id, label: `${a.label} (${a.count})` }))}
      />
      <input
        className="input"
        placeholder={props.searchPlaceholder}
        value={props.query}
        onChange={(e) => props.setQuery(e.target.value)}
      />
    </>
  );
}

// ---- NPC generator (free API) -----------------------------------------------

const NPC_COLORS = ['#7CA8C4', '#C48A7C', '#8AC47C', '#C4B07C', '#A07CC4', '#7CC4B8', '#C47CA4', '#90A0B8'];

/** Small-town flavor bios — generated NPCs have ZERO story relevance. */
const NPC_BIOS = [
  'Vivendo um dia de cada vez em Ravenwood.',
  'Café passado, chuva na serra e boas conversas.',
  'Fotografo a cidade quando o sol deixa.',
  'Pescaria no fim de semana, paz no resto.',
  'Doces por encomenda 🧁 chama na DM',
  'Trilhas, mirantes e estradas de terra.',
  'Mecânica de segunda a sábado. Domingo é sagrado.',
  'Plantando o que como 🌱',
  'Som na praça toda sexta à noite.',
  'Professora aposentada, jardineira em tempo integral.',
  'Corrida às 6h, não importa o frio.',
  'Brechó da rua principal — peças novas toda semana.',
  'Time do bairro ⚽ ninguém nos vence no campinho.',
  'Receitas da minha avó, uma por vez.',
];

interface RandomUser {
  name: { first: string; last: string };
  login: { username: string };
  picture: { large: string };
}

function NpcGenerator() {
  const upsert = useEditor((s) => s.upsertNpc);
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const n = Math.min(Math.max(Math.round(count) || 1, 1), 50);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `https://randomuser.me/api/?results=${n}&nat=br&inc=name,login,picture&noinfo`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { results: RandomUser[] };

      const b = useEditor.getState().bundle;
      const taken = new Set([...Object.keys(b.socialNpcs), ...Object.keys(b.characters)]);
      const offset = Object.keys(b.socialNpcs).length;

      data.results.forEach((r, i) => {
        let id = slugify(r.login.username) || `npc_${Date.now().toString(36)}${i}`;
        while (taken.has(id)) id = `${id}_${Math.floor(Math.random() * 90 + 10)}`;
        taken.add(id);
        upsert({
          id,
          name: `${r.name.first} ${r.name.last}`,
          avatarColor: NPC_COLORS[(offset + i) % NPC_COLORS.length],
          avatarUrl: r.picture.large,
          bio: NPC_BIOS[(offset + i) % NPC_BIOS.length],
        });
      });
    } catch {
      setError('Falha ao gerar — verifique sua conexão e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gen-box">
      <span className="gen-title">
        <Sparkles size={14} strokeWidth={1.75} /> Gerar perfis automaticamente
      </span>
      <div className="gen-row">
        <input
          className="input small"
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={busy}
        />
        <button className="btn small" disabled={busy} onClick={() => void generate()}>
          {busy ? 'gerando…' : 'gerar'}
        </button>
      </div>
      {error ? (
        <p className="gen-error">{error}</p>
      ) : (
        <p className="gen-hint">
          nomes e fotos brasileiros via randomuser.me — depois edite a bio e adicione as
          publicações de cada um
        </p>
      )}
    </div>
  );
}

/**
 * Mural profiles of the STORY CAST: the player plus each character's
 * OPTIONAL Mural presence (separate from their chat identity). Editing a
 * character's Mural profile lives HERE — not in the Personagens tab — because a
 * character may or may not be on the Mural. NPC profiles live in their own tab.
 */
function SocialCastProfilesPanel({ nav }: { nav: SocialNav }) {
  const characters = useEditor((s) => s.bundle.characters);

  type Sel = { kind: 'player' } | { kind: 'character'; id: string };
  const [sel, setSel] = useState<Sel>({ kind: 'player' });
  const active = sel.kind === 'player' ? 'player' : `character:${sel.id}`;
  const charSel = sel.kind === 'character' ? characters[sel.id] : undefined;

  const muralSub = (c: Character) => {
    const s = c.social;
    const hasIdentity =
      s && (s.handle || s.bio || s.avatarMedia || s.avatarUrl || s.avatarColor || s.followers != null || s.following != null);
    if (hasIdentity) return c.social?.followedByDefault ? 'perfil próprio · seguido' : 'perfil próprio no Mural';
    return s?.followedByDefault ? 'seguido desde o início' : 'herda das conversas';
  };

  return (
    <div className="registry">
      <div className="registry-list">
        <div className="registry-group-title">Você</div>
        <button
          className={`list-item ${active === 'player' ? 'active' : ''}`}
          onClick={() => setSel({ kind: 'player' })}
        >
          <span className="list-title">Você (o jogador)</span>
          <span className="list-sub">perfil do jogador no Mural</span>
          <code className="list-id">@player</code>
        </button>

        <div className="registry-group-title">
          Elenco <span>{Object.keys(characters).length}</span>
        </div>
        {Object.values(characters).map((c) => (
          <button
            key={c.id}
            className={`list-item ${active === `character:${c.id}` ? 'active' : ''}`}
            onClick={() => setSel({ kind: 'character', id: c.id })}
          >
            <span className="list-title">{c.name || '(sem nome)'}</span>
            <span className="list-sub">{muralSub(c)}</span>
            <code className="list-id">@{c.social?.handle || c.id}</code>
          </button>
        ))}
        <p className="hint">
          Personagens são criados na aba <b>Personagens</b>. Aqui você define só a presença deles no
          <b> Mural</b> (foto, bio, seguidores) e se o jogador já os segue desde o início.
        </p>
      </div>

      <div className="registry-form wide">
        {sel.kind === 'player' ? (
          <PlayerMuralEditor nav={nav} />
        ) : charSel ? (
          <CharacterMuralEditor character={charSel} nav={nav} />
        ) : (
          <p className="hint">Selecione um perfil à esquerda.</p>
        )}
      </div>
    </div>
  );
}

/** Filler Mural accounts (no story relevance) — their own tab. */
function SocialNpcProfilesPanel({ nav }: { nav: SocialNav }) {
  const npcs = useEditor((s) => s.bundle.socialNpcs);
  const upsertNpc = useEditor((s) => s.upsertNpc);
  const removeNpc = useEditor((s) => s.removeNpc);

  const [sel, setSel] = useState<string | null>(null);
  const npcSel = sel ? npcs[sel] : undefined;

  const createNpc = () => {
    const id = `npc_${Date.now().toString(36)}`;
    upsertNpc({ id, name: '', avatarColor: '#7CA8C4', bio: '' });
    setSel(id);
  };

  return (
    <div className="registry">
      <div className="registry-list">
        <button className="btn accent" onClick={createNpc}>
          <Plus size={15} strokeWidth={1.75} /> Novo perfil NPC
        </button>
        <NpcGenerator />
        {Object.values(npcs).map((n) => (
          <button
            key={n.id}
            className={`list-item ${sel === n.id ? 'active' : ''}`}
            onClick={() => setSel(n.id)}
          >
            <span className="list-title">{n.name || '(sem nome)'}</span>
            <span className="list-sub">{n.followedByDefault !== false ? 'seguido desde o início' : 'só pela busca'}</span>
            <code className="list-id">@{n.id}</code>
          </button>
        ))}
      </div>

      <div className="registry-form wide">
        {npcSel ? (
          <NpcEditor
            npc={npcSel}
            nav={nav}
            onRemove={() => {
              removeNpc(npcSel.id);
              setSel(null);
            }}
          />
        ) : (
          <p className="hint">Selecione um NPC à esquerda ou crie um novo.</p>
        )}
      </div>
    </div>
  );
}

/** The player's own Mural identity (author id 'player'). */
function PlayerMuralEditor({ nav }: { nav: SocialNav }) {
  const profile = useEditor((s) => s.bundle.playerProfile);
  const setProfile = useEditor((s) => s.setPlayerProfile);
  const resolve = useMediaResolver();
  const p: PlayerProfile = profile ?? { bio: '' };

  return (
    <div className="profile-edit">
      <div className="profile-edit-main">
        <p className="hint">
          Identidade do jogador no Mural (@ padrão "voce"). É o autor dos posts, comentários e
          stories atribuídos a "Você (o jogador)". Quem o jogador é na história, defina pela bio.
        </p>
        <Field label="@ no Mural (vazio = 'voce')">
          <TextInput value={p.handle ?? ''} onChange={(v) => setProfile({ ...p, handle: v || undefined })} placeholder="voce" />
        </Field>
        <Field label="Nome exibido (vazio = nome escolhido pelo jogador)">
          <TextInput value={p.name ?? ''} onChange={(v) => setProfile({ ...p, name: v || undefined })} />
        </Field>
        <Field label="Bio do perfil do jogador no Mural (define quem ele é)">
          <TextArea value={p.bio} onChange={(v) => setProfile({ ...p, bio: v })} rows={3} />
        </Field>
        <Field label="Cor do avatar (hex)">
          <TextInput value={p.avatarColor ?? ''} onChange={(v) => setProfile({ ...p, avatarColor: v || undefined })} placeholder="#6C8AE4" />
        </Field>
        <Field label="Foto de perfil (mídia)">
          <MediaSelect kind="image" value={p.avatarMedia} onChange={(v) => setProfile({ ...p, avatarMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
        </Field>
        <Field label="Ou link direto da foto (opcional)">
          <TextInput value={p.avatarUrl ?? ''} onChange={(v) => setProfile({ ...p, avatarUrl: v || undefined })} placeholder="https://…" />
        </Field>
        <div className="field-row">
          <Field label="Seguidores (vazio = automático)">
            <NumberInput value={p.followers} onChange={(v) => setProfile({ ...p, followers: v })} placeholder="auto" />
          </Field>
          <Field label="Seguindo (vazio = automático)">
            <NumberInput value={p.following} onChange={(v) => setProfile({ ...p, following: v })} placeholder="auto" />
          </Field>
        </div>
        <ProfileContentSection author="player" nav={nav} />
      </div>
      <aside className="profile-edit-aside">
        <ProfilePreview
          avatarUrl={resolve(p.avatarMedia, p.avatarUrl)}
          initials={(p.name || 'Você').slice(0, 2).toUpperCase()}
          avatarColor={p.avatarColor}
          name={p.name || 'Você (o jogador)'}
          handle={p.handle || 'voce'}
          bio={p.bio}
          stats={[
            { label: 'seguidores', value: p.followers ?? 'auto' },
            { label: 'seguindo', value: p.following ?? 'auto' },
          ]}
        />
      </aside>
    </div>
  );
}

/** A cast member's OPTIONAL Mural presence — separate from the chat identity. */
function CharacterMuralEditor({ character: c, nav }: { character: Character; nav: SocialNav }) {
  const upsert = useEditor((s) => s.upsertCharacter);
  const resolve = useMediaResolver();
  const s = c.social;
  const set = (patch: Partial<CharacterSocial>) => upsert({ ...c, social: { ...(s ?? {}), ...patch } });
  // Mural avatar falls back to the chat avatar when not customised.
  const muralAvatar = resolve(s?.avatarMedia, s?.avatarUrl) ?? resolve(c.avatarMedia, c.avatarUrl);

  return (
    <div className="profile-edit">
      <div className="profile-edit-main">
        <div className="subsection-head" style={{ marginTop: 0 }}>
          <span>Perfil no Mural — {c.name || c.id}</span>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={Boolean(s?.followedByDefault)}
            onChange={(e) => set({ followedByDefault: e.target.checked || undefined })}
          />
          <span className="check-ico"><BookmarkCheck size={14} strokeWidth={1.75} /></span>
          <span>O jogador já segue este perfil desde o início do jogo</span>
        </label>
        {s ? (
          <>
            <p className="hint">
              Presença no Mural <b>separada</b> da foto/bio das Conversas. Os posts/stories deste
              personagem são criados nas abas <b>Publicações</b> e <b>Stories</b> com ele como autor.
            </p>
            <Field label="@handle (vazio = id)">
              <TextInput value={s.handle ?? ''} onChange={(v) => set({ handle: v || undefined })} placeholder={c.id} />
            </Field>
            <Field label="Bio do Mural (vazio = usa a bio de contato)">
              <TextArea value={s.bio ?? ''} onChange={(v) => set({ bio: v || undefined })} rows={2} />
            </Field>
            <div className="field-row">
              <Field label="Seguidores (vazio = automático)">
                <NumberInput value={s.followers} onChange={(v) => set({ followers: v })} placeholder="auto" />
              </Field>
              <Field label="Seguindo (vazio = automático)">
                <NumberInput value={s.following} onChange={(v) => set({ following: v })} placeholder="auto" />
              </Field>
            </div>
            <Field label="Foto do Mural (mídia — separada da foto de contato)">
              <MediaSelect kind="image" value={s.avatarMedia} onChange={(v) => set({ avatarMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
            </Field>
            <Field label="Ou link direto da foto do Mural (opcional)">
              <TextInput value={s.avatarUrl ?? ''} onChange={(v) => set({ avatarUrl: v || undefined })} placeholder="https://…" />
            </Field>
            <Field label="Cor do avatar do Mural (hex, opcional)">
              <TextInput value={s.avatarColor ?? ''} onChange={(v) => set({ avatarColor: v || undefined })} placeholder="#6C8AE4" />
            </Field>
            <button className="btn danger small" onClick={() => upsert({ ...c, social: undefined })}>
              <Trash2 size={14} strokeWidth={1.75} /> remover presença no Mural
            </button>
          </>
        ) : (
          <>
            <p className="hint">
              Este personagem ainda <b>não tem perfil próprio</b> no Mural. Se publicar (como autor de
              um post/story), aparece com a foto e bio das <b>Conversas</b>. Personalize abaixo para dar
              a ele uma identidade de Mural separada.
            </p>
            <button className="btn accent small" onClick={() => upsert({ ...c, social: {} })}>
              <Plus size={14} strokeWidth={1.75} /> personalizar perfil no Mural
            </button>
          </>
        )}
        <ProfileContentSection author={c.id} nav={nav} />
      </div>
      <aside className="profile-edit-aside">
        <ProfilePreview
          avatarUrl={muralAvatar}
          initials={c.initials}
          avatarColor={s?.avatarColor || c.avatarColor}
          name={c.name}
          handle={s?.handle || c.id}
          bio={s?.bio || c.bio}
          stats={[
            { label: 'seguidores', value: s?.followers ?? 'auto' },
            { label: 'seguindo', value: s?.following ?? 'auto' },
          ]}
        />
        <p className="hint">Nome e foto de contato ficam na aba <b>Personagens</b>.</p>
      </aside>
    </div>
  );
}

/** A filler Mural account (no story relevance). */
function NpcEditor({ npc: n, onRemove, nav }: { npc: SocialNpc; onRemove: () => void; nav: SocialNav }) {
  const upsert = useEditor((s) => s.upsertNpc);
  const removeNpc = useEditor((s) => s.removeNpc);
  const social = useEditor((s) => s.bundle.social);
  const stories = useEditor((s) => s.bundle.socialStories);
  const posts = Object.values(social).filter((p) => p.author === n.id).length;
  const storyCount = Object.values(stories).filter((s) => s.author === n.id).length;

  return (
    <div className="profile-edit">
      <div className="profile-edit-main">
        <div className="inspector-actions">
          <button className="btn danger small" onClick={onRemove}>
            <Trash2 size={14} strokeWidth={1.75} /> excluir NPC
          </button>
        </div>
        <Field label="ID (vira o @usuário)">
          <TextInput value={n.id} onChange={(v) => { removeNpc(n.id); upsert({ ...n, id: slugify(v) || n.id }); }} />
        </Field>
        <Field label="Nome do perfil">
          <TextInput value={n.name} onChange={(v) => upsert({ ...n, name: v })} placeholder="ex.: Vivi Doces & Cia" />
        </Field>
        <div className="field-row">
          <Field label="Cor do avatar (hex)">
            <TextInput value={n.avatarColor} onChange={(v) => upsert({ ...n, avatarColor: v })} placeholder="#7CA8C4" />
          </Field>
          <Field label="Foto do perfil (URL)">
            <TextInput value={n.avatarUrl ?? ''} onChange={(v) => upsert({ ...n, avatarUrl: v || undefined })} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Bio">
          <TextArea value={n.bio} onChange={(v) => upsert({ ...n, bio: v })} rows={2} />
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={n.followedByDefault !== false}
            onChange={(e) => upsert({ ...n, followedByDefault: e.target.checked ? undefined : false })}
          />
          <span>O jogador já segue este perfil desde o início do jogo</span>
        </label>
        <p className="hint">
          NPCs dão vida à rede e NÃO têm relevância na história — só estas informações públicas.
          Perfis não seguidos por padrão só aparecem pela busca do Mural.
        </p>
        <ProfileContentSection author={n.id} nav={nav} />
      </div>
      <aside className="profile-edit-aside">
        <ProfilePreview
          avatarUrl={n.avatarUrl}
          initials={(n.name || '?').slice(0, 2).toUpperCase()}
          avatarColor={n.avatarColor}
          name={n.name}
          handle={n.id}
          bio={n.bio}
          stats={[
            { label: 'publicações', value: posts },
            { label: 'stories', value: storyCount },
          ]}
        />
      </aside>
    </div>
  );
}

/** Distinct authors present in a record's items, with counts, label-sorted. */
function useAuthorOptions(items: Record<string, { author: string }>) {
  const labelOf = useAccountLabeler();
  const counts = new Map<string, number>();
  for (const it of Object.values(items)) counts.set(it.author, (counts.get(it.author) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: labelOf(id), count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function SocialStoriesPanel(props: {
  author: string;
  setAuthor: (v: string) => void;
  sel: string | null;
  setSel: (v: string | null) => void;
}) {
  const stories = useEditor((s) => s.bundle.socialStories);
  const upsert = useEditor((s) => s.upsertStory);
  const remove = useEditor((s) => s.removeStory);
  const labelOf = useAccountLabeler();
  const authors = useAuthorOptions(stories);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();

  return (
    <ListForm
      items={stories}
      titleOf={(p) => p.text?.slice(0, 48) || '(story sem texto)'}
      subtitleOf={(p) => `@${p.author} · ${p.date}`}
      groupBy={props.author ? undefined : (p) => ({ key: p.author || '', label: labelOf(p.author) })}
      filter={(p) =>
        (!props.author || p.author === props.author) &&
        (!ql || (p.text ?? '').toLowerCase().includes(ql) || p.id.toLowerCase().includes(ql))
      }
      listHeader={
        <AuthorFilterBar
          author={props.author}
          setAuthor={(v) => { props.setAuthor(v); props.setSel(null); }}
          query={q}
          setQuery={setQ}
          authors={authors}
          totalLabel={`Todos os autores (${Object.keys(stories).length})`}
          searchPlaceholder="buscar texto do story…"
        />
      }
      selectedId={props.sel}
      onSelect={props.setSel}
      emptyHint="Nenhum story para este filtro."
      createLabel="+ Novo story"
      onCreate={() => {
        const id = `story_${Date.now().toString(36)}`;
        upsert({ id, author: props.author || '', text: '', date: '', durationSec: 5 });
        props.setSel(id);
      }}
      onRemove={remove}
      renderForm={(p: SocialStoryItem) => (
        <>
          <Field label="ID">
            <TextInput value={p.id} onChange={(v) => { remove(p.id); upsert({ ...p, id: slugify(v) || p.id }); }} />
          </Field>
          <Field label="Autor (personagem ou NPC)">
            <AccountSelect
              value={p.author}
              onChange={(v) => {
                upsert({ ...p, author: v });
                // Keep the just-edited item visible: follow it with the active filter.
                if (props.author) props.setAuthor(v);
              }}
              allowEmpty="—"
            />
          </Field>
          <Field label="Imagem de fundo (mídia — vazio = gradiente com texto)">
            <MediaSelect kind="image" value={p.imageMedia} onChange={(v) => upsert({ ...p, imageMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
          </Field>
          <Field label="Ou link direto (opcional, vertical 720x1280)">
            <TextInput value={p.imageUrl ?? ''} onChange={(v) => upsert({ ...p, imageUrl: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Texto sobreposto">
            <TextArea value={p.text ?? ''} onChange={(v) => upsert({ ...p, text: v || undefined })} rows={3} />
          </Field>
          <Field label="Duração na tela (segundos)">
            <NumberInput value={p.durationSec} onChange={(v) => upsert({ ...p, durationSec: v })} placeholder="5" />
          </Field>
          <Field label="Data exibida">
            <TextInput value={p.date} onChange={(v) => upsert({ ...p, date: v })} placeholder="ex.: há 3 h" />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(p.initial)}
              onChange={(e) => upsert({ ...p, initial: e.target.checked || undefined })}
            />
            <span>Visível desde o início do jogo</span>
          </label>
          <p className="hint">
            Vários stories do mesmo autor viram uma sequência (várias barrinhas). Stories
            não-iniciais entram pelo efeito "Publicar story no Mural" — com notificação.
          </p>
        </>
      )}
    />
  );
}

function SocialPostsPanel(props: {
  author: string;
  setAuthor: (v: string) => void;
  sel: string | null;
  setSel: (v: string | null) => void;
}) {
  const social = useEditor((s) => s.bundle.social);
  const upsert = useEditor((s) => s.upsertSocial);
  const remove = useEditor((s) => s.removeSocial);
  const labelOf = useAccountLabeler();
  const authors = useAuthorOptions(social);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();

  return (
    <ListForm
      items={social}
      titleOf={(p) => p.caption.slice(0, 48) || '(sem legenda)'}
      subtitleOf={(p) => `@${p.author} · ${p.date}`}
      groupBy={props.author ? undefined : (p) => ({ key: p.author || '', label: labelOf(p.author) })}
      filter={(p) =>
        (!props.author || p.author === props.author) &&
        (!ql || p.caption.toLowerCase().includes(ql) || p.id.toLowerCase().includes(ql))
      }
      listHeader={
        <AuthorFilterBar
          author={props.author}
          setAuthor={(v) => { props.setAuthor(v); props.setSel(null); }}
          query={q}
          setQuery={setQ}
          authors={authors}
          totalLabel={`Todos os autores (${Object.keys(social).length})`}
          searchPlaceholder="buscar legenda…"
        />
      }
      selectedId={props.sel}
      onSelect={props.setSel}
      emptyHint="Nenhuma publicação para este filtro."
      createLabel="+ Nova publicação"
      onCreate={() => {
        const id = `post_${Date.now().toString(36)}`;
        upsert({ id, author: props.author || '', caption: '', likes: 0, date: '', comments: [] });
        props.setSel(id);
      }}
      onRemove={remove}
      renderForm={(p: SocialPost) => (
        <>
          <Field label="ID">
            <TextInput value={p.id} onChange={(v) => { remove(p.id); upsert({ ...p, id: slugify(v) || p.id }); }} />
          </Field>
          <Field label="Autor (personagem ou NPC)">
            <AccountSelect
              value={p.author}
              onChange={(v) => {
                upsert({ ...p, author: v });
                // Keep the just-edited item visible: follow it with the active filter.
                if (props.author) props.setAuthor(v);
              }}
              allowEmpty="—"
            />
          </Field>
          <Field label="Imagem da publicação (mídia — vazio = post só de texto)">
            <MediaSelect kind="image" value={p.imageMedia} onChange={(v) => upsert({ ...p, imageMedia: v })} allowEmpty="— escolher mídia (ou link abaixo) —" />
          </Field>
          <Field label="Ou link direto da imagem (opcional)">
            <TextInput value={p.imageUrl ?? ''} onChange={(v) => upsert({ ...p, imageUrl: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Legenda">
            <TextArea value={p.caption} onChange={(v) => upsert({ ...p, caption: v })} rows={3} />
          </Field>
          <Field label="Curtidas (número base)">
            <NumberInput value={p.likes} onChange={(v) => upsert({ ...p, likes: v ?? 0 })} />
          </Field>
          <Field label="Data exibida">
            <TextInput value={p.date} onChange={(v) => upsert({ ...p, date: v })} placeholder="ex.: há 2 dias" />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(p.initial)}
              onChange={(e) => upsert({ ...p, initial: e.target.checked || undefined })}
            />
            <span>Visível desde o início do jogo (sem precisar de efeito)</span>
          </label>

          <div className="subsection">
            <div className="subsection-head">
              <span>Comentários</span>
              <button
                className="btn small"
                onClick={() => upsert({ ...p, comments: [...p.comments, { author: '', text: '' }] })}
              >
                <Plus size={14} strokeWidth={1.75} /> comentário
              </button>
            </div>
            {p.comments.map((c, i) => {
              const setComment = (patch: Partial<PostComment>) =>
                upsert({ ...p, comments: p.comments.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              // Other comments on this post that have an id (valid reply targets).
              const replyTargets = p.comments
                .filter((x, j) => j !== i && x.id)
                .map((x) => ({ value: x.id as string, label: `${x.id} — ${x.text.slice(0, 32) || '(sem texto)'}` }));
              return (
                <div key={i} className="card">
                  <div className="card-head">
                    <span className="tag">comentário {i + 1}{c.id ? ` · id: ${c.id}` : ''}</span>
                    <button
                      className="btn danger small"
                      onClick={() => upsert({ ...p, comments: p.comments.filter((_, j) => j !== i) })}
                    >
                      <Trash2 size={14} strokeWidth={1.75} /> remover
                    </button>
                  </div>
                  <Field label="Autor">
                    <AccountSelect
                      value={c.author}
                      onChange={(v) => setComment({ author: v })}
                      allowEmpty="—"
                    />
                  </Field>
                  <Field label="Texto">
                    <TextInput value={c.text} onChange={(v) => setComment({ text: v })} />
                  </Field>
                  <Field label="ID (opcional — necessário p/ ser curtido ou respondido)">
                    <TextInput
                      value={c.id ?? ''}
                      onChange={(v) => setComment({ id: v || undefined })}
                      placeholder="ex.: c1"
                    />
                  </Field>
                  <Field label="Curtidas (número base)">
                    <NumberInput value={c.likes ?? 0} onChange={(v) => setComment({ likes: v || undefined })} />
                  </Field>
                  <Field label="Responde ao comentário (vazio = comentário principal)">
                    <Select
                      value={c.replyTo ?? ''}
                      onChange={(v) => setComment({ replyTo: v || undefined })}
                      options={replyTargets}
                      allowEmpty="—"
                    />
                  </Field>
                </div>
              );
            })}
          </div>

          <CommentOptionsEditor post={p} onChange={upsert} />

          <p className="hint">
            Posts não-iniciais entram no feed pelo efeito "Publicar no Mural" em qualquer nó — o jogador
            recebe uma notificação.
          </p>
        </>
      )}
    />
  );
}

/**
 * Pre-written comments the PLAYER may post on this Mural post — narrative
 * choices. A post with no commentOptions simply isn't commentable in-game.
 */
function CommentOptionsEditor({
  post,
  onChange,
}: {
  post: SocialPost;
  onChange: (p: SocialPost) => void;
}) {
  const list = post.commentOptions ?? [];
  const set = (next: PostCommentOption[]) =>
    onChange({ ...post, commentOptions: next.length ? next : undefined });
  // This post's authored comments that have an id (valid reply targets).
  const replyTargets = (post.comments ?? [])
    .filter((c) => c.id)
    .map((c) => ({ value: c.id as string, label: `${c.id} — ${c.text.slice(0, 32) || '(sem texto)'}` }));

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Comentários do jogador (opcional)</span>
        <button
          className="btn small"
          onClick={() => set([...list, { id: uid('cmt'), text: '' }])}
        >
          <Plus size={14} strokeWidth={1.75} /> opção
        </button>
      </div>
      {list.length ? (
        <p className="hint">
          Comentários pré-definidos que o jogador pode publicar neste post — cada um é uma escolha
          narrativa (aplica efeitos). Sem opções aqui, o post não é comentável.
        </p>
      ) : null}
      {list.map((o, i) => (
        <div key={o.id} className="card">
          <div className="card-head">
            <span className="tag">opção {i + 1} · id: {o.id}</span>
            <button className="btn danger small" onClick={() => set(list.filter((_, j) => j !== i))}>
              <Trash2 size={14} strokeWidth={1.75} /> remover
            </button>
          </div>
          <Field label="Texto do botão (o que o jogador vê)">
            <TextInput value={o.text} onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
          </Field>
          <Field label="Comentário publicado (vazio = igual ao botão)">
            <TextInput
              value={o.say ?? ''}
              onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, say: v || undefined } : x)))}
            />
          </Field>
          <Field label="Resposta ao comentário (vazio = comentário principal)">
            <Select
              value={o.replyTo ?? ''}
              onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, replyTo: v || undefined } : x)))}
              options={replyTargets}
              allowEmpty="—"
            />
          </Field>
          <ConditionEditor
            title="Só aparece se…"
            value={o.condition}
            onChange={(c) => set(list.map((x, j) => (j === i ? { ...x, condition: c } : x)))}
          />
          <EffectsEditor
            effects={o.effects}
            onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, effects: e } : x)))}
          />
        </div>
      ))}
    </div>
  );
}

const AD_PLACEMENT_LABEL: Record<'both' | 'social' | 'browser', string> = {
  both: 'Mural + Navegador',
  social: 'Só no Mural',
  browser: 'Só no Navegador',
};

export function AdsPanel() {
  const ads = useEditor((s) => s.bundle.ads);
  const upsert = useEditor((s) => s.upsertAd);
  const remove = useEditor((s) => s.removeAd);

  return (
    <ListForm
      items={ads}
      titleOf={(a) => a.brand || '(sem marca)'}
      subtitleOf={(a) =>
        a.active === false ? 'pausado' : AD_PLACEMENT_LABEL[a.placement ?? 'both']
      }
      createLabel="+ Novo anúncio"
      onCreate={() => {
        const id = `ad_${Date.now().toString(36)}`;
        upsert({ id, brand: '', caption: '', placement: 'both' });
      }}
      onRemove={remove}
      renderForm={(a: Ad) => (
        <>
          <Field label="ID">
            <TextInput value={a.id} onChange={(v) => { remove(a.id); upsert({ ...a, id: slugify(v) || a.id }); }} />
          </Field>
          <Field label="Marca / anunciante (vira o nome e o @ do anúncio)">
            <TextInput value={a.brand} onChange={(v) => upsert({ ...a, brand: v })} placeholder="ex.: Tulu Bank" />
          </Field>
          <Field label="Logo da marca (URL — avatar)">
            <TextInput value={a.avatarUrl ?? ''} onChange={(v) => upsert({ ...a, avatarUrl: v || undefined })} placeholder="https://…" />
          </Field>
          <Field label="Imagem do anúncio (URL — vazio = fundo gradiente)">
            <TextInput value={a.imageUrl ?? ''} onChange={(v) => upsert({ ...a, imageUrl: v || undefined })} placeholder="https://… (quadrada 600x600)" />
          </Field>
          <Field label="Texto do anúncio">
            <TextArea value={a.caption} onChange={(v) => upsert({ ...a, caption: v })} rows={3} />
          </Field>
          <Field label="Botão (call-to-action)">
            <TextInput value={a.cta ?? ''} onChange={(v) => upsert({ ...a, cta: v || undefined })} placeholder="Saiba mais" />
          </Field>
          <Field label="Endereço fictício (aberto ao tocar)">
            <TextInput value={a.url ?? ''} onChange={(v) => upsert({ ...a, url: v || undefined })} placeholder="ex.: tulubank.com.br" />
          </Field>
          <Field label="Onde aparece">
            <Select
              value={a.placement ?? 'both'}
              onChange={(v) => upsert({ ...a, placement: v as Ad['placement'] })}
              options={Object.entries(AD_PLACEMENT_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={a.active !== false}
              onChange={(e) => upsert({ ...a, active: e.target.checked ? undefined : false })}
            />
            <span className="check-ico"><Megaphone size={14} strokeWidth={1.75} /></span>
            <span>Anúncio ativo (desmarque para pausar sem excluir)</span>
          </label>
          <p className="hint">
            Anúncios são ambientação — não fazem parte da história e aparecem sozinhos (sem nó de
            fluxo). No Mural entram como post "Patrocinado" (na 2ª posição e a cada poucos posts);
            no navegador, como banner na home e dentro das matérias.
          </p>
        </>
      )}
    />
  );
}

export function EndingsPanel() {
  const endings = useEditor((s) => s.bundle.endings);
  const upsert = useEditor((s) => s.upsertEnding);
  const remove = useEditor((s) => s.removeEnding);

  return (
    <ListForm
      items={endings}
      titleOf={(e) => e.title || '(sem título)'}
      subtitleOf={(e) => e.tagline}
      createLabel="+ Novo final"
      onCreate={() => {
        const id = `ending_${Date.now().toString(36)}`;
        upsert({ id, title: '', tagline: '', summary: '', scenes: [''] });
      }}
      onRemove={remove}
      renderForm={(e: Ending) => (
        <>
          <Field label="ID">
            <TextInput value={e.id} onChange={(v) => { remove(e.id); upsert({ ...e, id: slugify(v) || e.id }); }} />
          </Field>
          <Field label="Título">
            <TextInput value={e.title} onChange={(v) => upsert({ ...e, title: v })} placeholder="ex.: Final I — A Corrente Quebrada" />
          </Field>
          <Field label="Tagline">
            <TextInput value={e.tagline} onChange={(v) => upsert({ ...e, tagline: v })} />
          </Field>
          <Field label="Resumo">
            <TextArea value={e.summary} onChange={(v) => upsert({ ...e, summary: v })} rows={2} />
          </Field>
          <Field label="Cenas finais (uma por linha — aparecem em sequência)">
            <TextArea value={e.scenes.join('\n')} onChange={(v) => upsert({ ...e, scenes: v.split('\n') })} rows={6} />
          </Field>
          <p className="hint">
            Para chegar neste final: efeito "Travar final" (decisivo) ou "Pontuar final" (o mais pontuado
            vence) + nó "Fim do capítulo" com este final.
          </p>
        </>
      )}
    />
  );
}

/**
 * The Blog tab hosts the player-published articles (matérias). The player's own
 * Mural identity is edited under Rede Social → Perfis.
 */
export function BlogPanel() {
  return <BlogPostsPanel />;
}

/** Angles the player can pick when composing a Blog article. */
function BlogContentOptionsEditor({
  post,
  onChange,
}: {
  post: BlogPost;
  onChange: (p: BlogPost) => void;
}) {
  const list = post.options ?? [];
  const set = (next: BlogContentOption[]) => onChange({ ...post, options: next });

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Ângulos da matéria (o jogador escolhe um para publicar)</span>
        <button
          className="btn small"
          onClick={() => set([...list, { id: uid('ang'), label: '', body: '' }])}
        >
          <Plus size={14} strokeWidth={1.75} /> ângulo
        </button>
      </div>
      <p className="hint">
        Cada ângulo é uma escolha de redação (ético, sensacionalista…). O texto e os efeitos do
        ângulo escolhido valem ao publicar — bom para pontuar finais.
      </p>
      {list.map((o, i) => (
        <div key={o.id} className="card">
          <div className="card-head">
            <span className="tag">ângulo {i + 1} · id: {o.id}</span>
            <button className="btn danger small" onClick={() => set(list.filter((_, j) => j !== i))}>
              <Trash2 size={14} strokeWidth={1.75} /> remover
            </button>
          </div>
          <Field label="Rótulo (aparece na escolha de redação)">
            <TextInput value={o.label} onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
          </Field>
          <Field label="Texto publicado (linha em branco separa parágrafos)">
            <TextArea
              value={o.body}
              onChange={(v) => set(list.map((x, j) => (j === i ? { ...x, body: v } : x)))}
              rows={5}
            />
          </Field>
          <ConditionEditor
            title="Só aparece se…"
            value={o.condition}
            onChange={(c) => set(list.map((x, j) => (j === i ? { ...x, condition: c } : x)))}
          />
          <EffectsEditor
            effects={o.effects}
            onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, effects: e } : x)))}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Image-source control for a matéria: the cover/thumbnail is EITHER a direct
 * link (`imageUrl`) OR an evidence whose media is reused (`imageEvidence`).
 * Only one is kept at a time; `imageUrl` wins in the game if both were set.
 */
function BlogImageSource({
  post,
  onChange,
}: {
  post: BlogPost;
  onChange: (p: BlogPost) => void;
}) {
  // Default to whichever is set; "link" if both/neither.
  const mode: 'link' | 'evidence' =
    post.imageEvidence && !post.imageUrl ? 'evidence' : 'link';

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Imagem da matéria (capa/miniatura — opcional)</span>
        <div className="palette" style={{ padding: 0, border: 0, background: 'transparent' }}>
          <button
            className={`btn small ${mode === 'link' ? 'accent' : ''}`}
            onClick={() => onChange({ ...post, imageEvidence: undefined })}
          >
            Link
          </button>
          <button
            className={`btn small ${mode === 'evidence' ? 'accent' : ''}`}
            onClick={() => onChange({ ...post, imageUrl: undefined })}
          >
            Evidência
          </button>
        </div>
      </div>
      <Field label="Mídia da biblioteca (recomendado — vence link/evidência)">
        <MediaSelect kind="image" value={post.imageMedia} onChange={(v) => onChange({ ...post, imageMedia: v })} allowEmpty="— escolher mídia (ou link/evidência abaixo) —" />
      </Field>
      <p className="hint">Prioridade no jogo: mídia &gt; link &gt; evidência.</p>
      {mode === 'link' ? (
        <Field label="URL da imagem (link direto)">
          <TextInput
            value={post.imageUrl ?? ''}
            onChange={(v) => onChange({ ...post, imageUrl: v || undefined })}
            placeholder="https://…"
          />
        </Field>
      ) : (
        <Field label="Evidência (a mídia dela vira a imagem da matéria)">
          <EvidenceSelect
            value={post.imageEvidence ?? ''}
            onChange={(v) => onChange({ ...post, imageEvidence: v || undefined })}
            allowEmpty="—"
          />
        </Field>
      )}
    </div>
  );
}

function BlogPostsPanel() {
  const blog = useEditor((s) => s.bundle.blog ?? {});
  const upsert = useEditor((s) => s.upsertBlog);
  const remove = useEditor((s) => s.removeBlog);

  return (
    <ListForm
      items={blog}
      titleOf={(p) => p.title || '(sem título)'}
      subtitleOf={(p) => `${p.options?.length ?? 0} ângulo(s)`}
      createLabel="+ Nova matéria"
      onCreate={() => {
        const id = `blog_${Date.now().toString(36)}`;
        upsert({ id, title: '', options: [{ id: uid('ang'), label: '', body: '' }] });
      }}
      onRemove={remove}
      renderForm={(p: BlogPost) => (
        <>
          <Field label="ID (usado no efeito/nó 'Liberar pauta')">
            <TextInput value={p.id} onChange={(v) => { remove(p.id); upsert({ ...p, id: slugify(v) || p.id }); }} />
          </Field>
          <Field label="Título da matéria">
            <TextInput value={p.title} onChange={(v) => upsert({ ...p, title: v })} placeholder="ex.: O silêncio de Ravenwood" />
          </Field>
          <BlogImageSource post={p} onChange={upsert} />
          <Field label="Data / assinatura exibida (opcional)">
            <TextInput value={p.date ?? ''} onChange={(v) => upsert({ ...p, date: v || undefined })} placeholder="ex.: por Você · hoje" />
          </Field>
          <Field label="Story no Mural ao publicar (autor 'player' — opcional)">
            <StorySelect value={p.muralStory ?? ''} onChange={(v) => upsert({ ...p, muralStory: v || undefined })} allowEmpty="nenhum" />
          </Field>
          <BlogContentOptionsEditor post={p} onChange={upsert} />
          <p className="hint">
            A matéria entra em Rascunhos pelo efeito ou nó "Liberar pauta (Blog)". O jogador escolhe
            um ângulo e publica; depois pode compartilhar o story do Mural vinculado acima.
          </p>
        </>
      )}
    />
  );
}

