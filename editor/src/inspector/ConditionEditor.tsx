import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Condition } from '../types';
import {
  Field,
  TextInput,
  NumberInput,
  Select,
  FlagInput,
  CharacterSelect,
  EvidenceSelect,
  ChapterSelect,
  SocialSelect,
  CommentSelect,
  NewsSelect,
  AccountSelect,
} from './fields';

const COND_LABEL: Record<Condition['type'], string> = {
  flag: 'Flag está ativa',
  flagEquals: 'Flag é igual a',
  gender: 'Gênero do jogador',
  trustAtLeast: 'Confiança ≥',
  trustBelow: 'Confiança <',
  hasEvidence: 'Tem evidência',
  choseOption: 'Escolheu opção',
  chapterCompleted: 'Capítulo concluído',
  moneyAtLeast: 'Saldo no banco ≥ (R$)',
  paidAtLeast: 'Transferiu ao personagem ≥ (R$)',
  likedPost: 'Curtiu um post (Mural)',
  likedComment: 'Curtiu um comentário (Mural)',
  viewedNews: 'Abriu uma notícia',
  followsProfile: 'Segue um perfil (Mural)',
  all: 'TODAS as condições (E)',
  any: 'QUALQUER condição (OU)',
  not: 'NÃO (negação)',
};

/** A Sim/Não toggle for the "did it / did not do it" social conditions. */
function YesNoField({
  value,
  onChange,
  verb,
}: {
  value: boolean | undefined;
  onChange: (b: boolean) => void;
  verb: string;
}) {
  return (
    <Field label="Condição">
      <Select
        value={value === false ? 'no' : 'yes'}
        onChange={(v) => onChange(v === 'yes')}
        options={[
          { value: 'yes', label: `Sim — ${verb}` },
          { value: 'no', label: `Não — não ${verb}` },
        ]}
      />
    </Field>
  );
}

function defaultCondition(type: Condition['type']): Condition {
  switch (type) {
    case 'flag':
      return { type, flag: '' };
    case 'flagEquals':
      return { type, flag: '', value: '' };
    case 'gender':
      return { type, value: 'm' };
    case 'trustAtLeast':
      return { type, character: '', value: 60 };
    case 'trustBelow':
      return { type, character: '', value: 40 };
    case 'hasEvidence':
      return { type, evidence: '' };
    case 'choseOption':
      return { type, option: '' };
    case 'chapterCompleted':
      return { type, chapter: '' };
    case 'moneyAtLeast':
      return { type, amount: 10 };
    case 'paidAtLeast':
      return { type, character: '', amount: 10 };
    case 'likedPost':
      return { type, post: '', value: true };
    case 'likedComment':
      return { type, comment: '', value: true };
    case 'viewedNews':
      return { type, news: '', value: true };
    case 'followsProfile':
      return { type, account: '', value: true };
    case 'all':
      return { type, conditions: [] };
    case 'any':
      return { type, conditions: [] };
    case 'not':
      return { type, condition: { type: 'flag', flag: '' } };
  }
}

function ConditionBody({ value, onChange }: { value: Condition; onChange: (c: Condition) => void }) {
  switch (value.type) {
    case 'flag':
      return (
        <Field label="Flag">
          <FlagInput value={value.flag} onChange={(v) => onChange({ ...value, flag: v })} />
        </Field>
      );
    case 'flagEquals':
      return (
        <>
          <Field label="Flag">
            <FlagInput value={value.flag} onChange={(v) => onChange({ ...value, flag: v })} />
          </Field>
          <Field label="Valor">
            <TextInput
              value={String(value.value)}
              onChange={(v) => onChange({ ...value, value: v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) || v === '' ? v : Number(v) })}
            />
          </Field>
        </>
      );
    case 'gender':
      return (
        <Field label="Gênero escolhido pelo jogador">
          <Select
            value={value.value}
            onChange={(v) => onChange({ ...value, value: v as 'm' | 'f' })}
            options={[
              { value: 'm', label: 'Masculino' },
              { value: 'f', label: 'Feminino' },
            ]}
          />
        </Field>
      );
    case 'trustAtLeast':
    case 'trustBelow':
      return (
        <>
          <Field label="Personagem">
            <CharacterSelect value={value.character} onChange={(v) => onChange({ ...value, character: v })} allowEmpty="—" />
          </Field>
          <Field label="Valor (0–100)">
            <NumberInput value={value.value} onChange={(v) => onChange({ ...value, value: v ?? 0 })} />
          </Field>
        </>
      );
    case 'hasEvidence':
      return (
        <Field label="Evidência">
          <EvidenceSelect value={value.evidence} onChange={(v) => onChange({ ...value, evidence: v })} allowEmpty="—" />
        </Field>
      );
    case 'choseOption':
      return (
        <Field label="ID da opção escolhida">
          <TextInput value={value.option} onChange={(v) => onChange({ ...value, option: v })} placeholder="ex.: c_help" />
        </Field>
      );
    case 'chapterCompleted':
      return (
        <Field label="Capítulo">
          <ChapterSelect value={value.chapter} onChange={(v) => onChange({ ...value, chapter: v })} allowEmpty="—" />
        </Field>
      );
    case 'moneyAtLeast':
      return (
        <Field label="Saldo mínimo (R$)">
          <NumberInput value={value.amount} onChange={(v) => onChange({ ...value, amount: v ?? 0 })} />
        </Field>
      );
    case 'paidAtLeast':
      return (
        <>
          <Field label="Personagem (dono da conta de destino)">
            <CharacterSelect value={value.character} onChange={(v) => onChange({ ...value, character: v })} allowEmpty="—" />
          </Field>
          <Field label="Total transferido mínimo (R$)">
            <NumberInput value={value.amount} onChange={(v) => onChange({ ...value, amount: v ?? 0 })} />
          </Field>
          <p className="hint">Só funciona se o personagem tiver "Conta bancária" preenchida na aba Personagens.</p>
        </>
      );
    case 'likedPost':
      return (
        <>
          <Field label="Post (Mural)">
            <SocialSelect value={value.post} onChange={(v) => onChange({ ...value, post: v })} allowEmpty="—" />
          </Field>
          <YesNoField value={value.value} onChange={(b) => onChange({ ...value, value: b })} verb="curtiu" />
        </>
      );
    case 'likedComment':
      return (
        <>
          <Field label="Comentário (Mural)">
            <CommentSelect value={value.comment} onChange={(v) => onChange({ ...value, comment: v })} allowEmpty="—" />
          </Field>
          <p className="hint">Só comentários com "id" definido podem ser checados aqui.</p>
          <YesNoField value={value.value} onChange={(b) => onChange({ ...value, value: b })} verb="curtiu" />
        </>
      );
    case 'viewedNews':
      return (
        <>
          <Field label="Notícia">
            <NewsSelect value={value.news} onChange={(v) => onChange({ ...value, news: v })} allowEmpty="—" />
          </Field>
          <YesNoField value={value.value} onChange={(b) => onChange({ ...value, value: b })} verb="abriu" />
        </>
      );
    case 'followsProfile':
      return (
        <>
          <Field label="Perfil (Mural)">
            <AccountSelect value={value.account} onChange={(v) => onChange({ ...value, account: v })} allowEmpty="—" />
          </Field>
          <YesNoField value={value.value} onChange={(b) => onChange({ ...value, value: b })} verb="segue" />
        </>
      );
    case 'all':
    case 'any':
      return (
        <div className="nested">
          {value.conditions.map((c, i) => (
            <div key={i} className="card">
              <div className="card-head">
                <span className="tag">{i + 1}</span>
                <button
                  className="btn danger small"
                  onClick={() => onChange({ ...value, conditions: value.conditions.filter((_, j) => j !== i) })}
                >
                  <Trash2 size={14} strokeWidth={1.75} /> remover
                </button>
              </div>
              <ConditionEditor
                value={c}
                onChange={(nc) => onChange({ ...value, conditions: value.conditions.map((x, j) => (j === i ? nc! : x)) })}
                required
              />
            </div>
          ))}
          <select
            className="input small"
            value=""
            onChange={(e) => {
              const t = e.target.value as Condition['type'];
              if (t) onChange({ ...value, conditions: [...value.conditions, defaultCondition(t)] });
            }}
          >
            <option value="">+ adicionar sub-condição…</option>
            {(Object.keys(COND_LABEL) as Condition['type'][]).map((t) => (
              <option key={t} value={t}>
                {COND_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      );
    case 'not':
      return (
        <div className="nested">
          <ConditionEditor value={value.condition} onChange={(nc) => onChange({ ...value, condition: nc! })} required />
        </div>
      );
  }
}

/**
 * Recursive condition builder. When `required` is false, the condition can be
 * removed entirely (undefined = always true).
 */
export function ConditionEditor({
  value,
  onChange,
  required = false,
  title,
}: {
  value: Condition | undefined;
  onChange: (c: Condition | undefined) => void;
  required?: boolean;
  title?: string;
}) {
  if (!value) {
    return (
      <div className="subsection">
        {title ? <div className="subsection-head"><span>{title}</span></div> : null}
        <select
          className="input small"
          value=""
          onChange={(e) => {
            const t = e.target.value as Condition['type'];
            if (t) onChange(defaultCondition(t));
          }}
        >
          <option value="">sem condição (sempre) — + adicionar…</option>
          {(Object.keys(COND_LABEL) as Condition['type'][]).map((t) => (
            <option key={t} value={t}>
              {COND_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="subsection">
      {title ? <div className="subsection-head"><span>{title}</span></div> : null}
      <div className="row">
        <Select
          value={value.type}
          onChange={(t) => onChange(defaultCondition(t as Condition['type']))}
          options={(Object.keys(COND_LABEL) as Condition['type'][]).map((t) => ({ value: t, label: COND_LABEL[t] }))}
        />
        {!required ? (
          <button className="btn danger small" onClick={() => onChange(undefined)}>
            <Trash2 size={14} strokeWidth={1.75} /> limpar
          </button>
        ) : null}
      </div>
      <ConditionBody value={value} onChange={onChange as (c: Condition) => void} />
    </div>
  );
}
