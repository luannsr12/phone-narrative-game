import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Effect } from '../types';
import { Field, TextInput, TextArea, NumberInput, Select, FlagInput, CharacterSelect, EvidenceSelect, NewsSelect, SocialSelect, StorySelect, BlogSelect, EndingSelect, AccountSelect, CommentSelect } from './fields';

const EFFECT_LABEL: Record<Effect['type'], string> = {
  setFlag: 'Definir flag',
  trust: 'Alterar confiança',
  unlockContact: 'Desbloquear contato',
  addEvidence: 'Entregar evidência',
  unlockNews: 'Publicar notícia',
  unlockSocial: 'Publicar no Mural (rede social)',
  unlockStory: 'Publicar story no Mural',
  offerBlog: 'Liberar pauta (Blog)',
  addTimeline: 'Registrar na linha do tempo',
  money: 'Dinheiro (crédito ou cobrança no banco)',
  setEnding: 'Travar final',
  lockEndingScore: 'Pontuar final',
  setPresence: 'Presença (online / offline)',
  addComment: 'Mural: comentar em um post',
  setPostLikes: 'Mural: curtidas de um post',
  setCommentLikes: 'Mural: curtidas de um comentário',
  setFollowStats: 'Mural: seguidores / seguindo',
};

function defaultEffect(type: Effect['type']): Effect {
  switch (type) {
    case 'setFlag':
      return { type, flag: '' };
    case 'trust':
      return { type, character: '', delta: 5 };
    case 'unlockContact':
      return { type, character: '' };
    case 'addEvidence':
      return { type, evidence: '' };
    case 'unlockNews':
      return { type, news: '' };
    case 'unlockSocial':
      return { type, post: '' };
    case 'unlockStory':
      return { type, story: '' };
    case 'offerBlog':
      return { type, blog: '' };
    case 'addTimeline':
      return { type, id: `t_${Date.now().toString(36)}`, title: '' };
    case 'money':
      return { type, amount: 50 };
    case 'setEnding':
      return { type, ending: '' };
    case 'lockEndingScore':
      return { type, ending: '', delta: 1 };
    case 'setPresence':
      return { type, character: '', online: true };
    case 'addComment':
      return { type, post: '', author: '', text: '' };
    case 'setPostLikes':
      return { type, post: '', likes: 0 };
    case 'setCommentLikes':
      return { type, comment: '', likes: 0 };
    case 'setFollowStats':
      return { type, account: '' };
  }
}

function EffectRow({ effect, onChange }: { effect: Effect; onChange: (e: Effect) => void }) {
  switch (effect.type) {
    case 'setFlag':
      return (
        <>
          <Field label="Flag">
            <FlagInput value={effect.flag} onChange={(v) => onChange({ ...effect, flag: v })} />
          </Field>
          <Field label="Valor (vazio = true)">
            <TextInput
              value={effect.value === undefined ? '' : String(effect.value)}
              onChange={(v) => onChange({ ...effect, value: v === '' ? undefined : v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v) })}
            />
          </Field>
        </>
      );
    case 'trust':
      return (
        <>
          <Field label="Personagem">
            <CharacterSelect value={effect.character} onChange={(v) => onChange({ ...effect, character: v })} allowEmpty="—" />
          </Field>
          <Field label="Variação (±)">
            <NumberInput value={effect.delta} onChange={(v) => onChange({ ...effect, delta: v ?? 0 })} />
          </Field>
        </>
      );
    case 'unlockContact':
      return (
        <Field label="Personagem">
          <CharacterSelect value={effect.character} onChange={(v) => onChange({ ...effect, character: v })} allowEmpty="—" />
        </Field>
      );
    case 'addEvidence':
      return (
        <Field label="Evidência">
          <EvidenceSelect value={effect.evidence} onChange={(v) => onChange({ ...effect, evidence: v })} allowEmpty="—" />
        </Field>
      );
    case 'unlockNews':
      return (
        <>
          <Field label="Notícia">
            <NewsSelect value={effect.news} onChange={(v) => onChange({ ...effect, news: v })} allowEmpty="—" />
          </Field>
          <Field label="Atraso da notificação (segundos — 0 = imediato)">
            <NumberInput
              value={effect.notifyDelaySec}
              onChange={(v) => onChange({ ...effect, notifyDelaySec: v })}
              placeholder="0"
            />
          </Field>
        </>
      );
    case 'unlockSocial':
      return (
        <Field label="Publicação">
          <SocialSelect value={effect.post} onChange={(v) => onChange({ ...effect, post: v })} allowEmpty="—" />
        </Field>
      );
    case 'unlockStory':
      return (
        <Field label="Story">
          <StorySelect value={effect.story} onChange={(v) => onChange({ ...effect, story: v })} allowEmpty="—" />
        </Field>
      );
    case 'offerBlog':
      return (
        <Field label="Pauta (matéria do Blog)">
          <BlogSelect value={effect.blog} onChange={(v) => onChange({ ...effect, blog: v })} allowEmpty="—" />
        </Field>
      );
    case 'addTimeline':
      return (
        <>
          <Field label="Título do evento">
            <TextInput value={effect.title} onChange={(v) => onChange({ ...effect, title: v })} />
          </Field>
          <Field label="Detalhe">
            <TextInput value={effect.detail ?? ''} onChange={(v) => onChange({ ...effect, detail: v || undefined })} />
          </Field>
        </>
      );
    case 'money':
      return (
        <>
          <Field label="Valor em R$ (positivo = jogador recebe; negativo = cobrança)">
            <NumberInput value={effect.amount} onChange={(v) => onChange({ ...effect, amount: v ?? 0 })} />
          </Field>
          <Field label="Descrição no extrato (opcional)">
            <TextInput value={effect.reason ?? ''} onChange={(v) => onChange({ ...effect, reason: v || undefined })} placeholder="ex.: Pix de Eron" />
          </Field>
        </>
      );
    case 'setEnding':
      return (
        <Field label="Final">
          <EndingSelect value={effect.ending} onChange={(v) => onChange({ ...effect, ending: v })} allowEmpty="—" />
        </Field>
      );
    case 'lockEndingScore':
      return (
        <>
          <Field label="Final">
            <EndingSelect value={effect.ending} onChange={(v) => onChange({ ...effect, ending: v })} allowEmpty="—" />
          </Field>
          <Field label="Pontos (±)">
            <NumberInput value={effect.delta} onChange={(v) => onChange({ ...effect, delta: v ?? 0 })} />
          </Field>
        </>
      );
    case 'setPresence':
      return (
        <>
          <Field label="Personagem">
            <CharacterSelect value={effect.character} onChange={(v) => onChange({ ...effect, character: v })} allowEmpty="—" />
          </Field>
          <Field label="Estado no app de mensagens">
            <Select
              value={effect.online ? 'online' : 'offline'}
              onChange={(v) => onChange({ ...effect, online: v === 'online' })}
              options={[
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline (visto por último)' },
              ]}
            />
          </Field>
        </>
      );
    case 'addComment':
      return (
        <>
          <Field label="Publicação">
            <SocialSelect value={effect.post} onChange={(v) => onChange({ ...effect, post: v })} allowEmpty="—" />
          </Field>
          <Field label="Quem comenta (personagem / NPC / jogador)">
            <AccountSelect value={effect.author} onChange={(v) => onChange({ ...effect, author: v })} allowEmpty="—" />
          </Field>
          <Field label="Texto do comentário">
            <TextArea value={effect.text} onChange={(v) => onChange({ ...effect, text: v })} rows={2} />
          </Field>
          <Field label="Responder a (comentário — vazio = comentário principal)">
            <CommentSelect value={effect.replyTo ?? ''} onChange={(v) => onChange({ ...effect, replyTo: v || undefined })} allowEmpty="—" />
          </Field>
          <Field label="Curtidas iniciais (opcional)">
            <NumberInput value={effect.likes} onChange={(v) => onChange({ ...effect, likes: v })} placeholder="0" />
          </Field>
          <Field label="ID do comentário (opcional — p/ editar as curtidas dele depois)">
            <TextInput value={effect.commentId ?? ''} onChange={(v) => onChange({ ...effect, commentId: v || undefined })} placeholder="ex.: c_boato" />
          </Field>
        </>
      );
    case 'setPostLikes':
      return (
        <>
          <Field label="Publicação">
            <SocialSelect value={effect.post} onChange={(v) => onChange({ ...effect, post: v })} allowEmpty="—" />
          </Field>
          <Field label="Curtidas">
            <NumberInput value={effect.likes} onChange={(v) => onChange({ ...effect, likes: v ?? 0 })} />
          </Field>
        </>
      );
    case 'setCommentLikes':
      return (
        <>
          <Field label="Comentário">
            <CommentSelect value={effect.comment} onChange={(v) => onChange({ ...effect, comment: v })} allowEmpty="—" />
          </Field>
          <Field label="Curtidas">
            <NumberInput value={effect.likes} onChange={(v) => onChange({ ...effect, likes: v ?? 0 })} />
          </Field>
        </>
      );
    case 'setFollowStats':
      return (
        <>
          <Field label="Perfil (personagem / NPC / jogador)">
            <AccountSelect value={effect.account} onChange={(v) => onChange({ ...effect, account: v })} allowEmpty="—" />
          </Field>
          <Field label="Seguidores (vazio = não altera)">
            <NumberInput value={effect.followers} onChange={(v) => onChange({ ...effect, followers: v })} placeholder="manter" />
          </Field>
          <Field label="Seguindo (vazio = não altera)">
            <NumberInput value={effect.following} onChange={(v) => onChange({ ...effect, following: v })} placeholder="manter" />
          </Field>
        </>
      );
  }
}

export function EffectsEditor({
  effects,
  onChange,
  title = 'Efeitos',
}: {
  effects: Effect[] | undefined;
  onChange: (e: Effect[] | undefined) => void;
  title?: string;
}) {
  const list = effects ?? [];
  const set = (next: Effect[]) => onChange(next.length ? next : undefined);

  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>{title}</span>
        <select
          className="input small"
          value=""
          onChange={(e) => {
            const t = e.target.value as Effect['type'];
            if (t) set([...list, defaultEffect(t)]);
          }}
        >
          <option value="">+ adicionar…</option>
          {(Object.keys(EFFECT_LABEL) as Effect['type'][]).map((t) => (
            <option key={t} value={t}>
              {EFFECT_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      {list.map((eff, i) => (
        <div key={i} className="card">
          <div className="card-head">
            <span className="tag">{EFFECT_LABEL[eff.type]}</span>
            <button className="btn danger small" onClick={() => set(list.filter((_, j) => j !== i))}>
              <Trash2 size={14} strokeWidth={1.75} /> remover
            </button>
          </div>
          <EffectRow effect={eff} onChange={(ne) => set(list.map((x, j) => (j === i ? ne : x)))} />
        </div>
      ))}
    </div>
  );
}
