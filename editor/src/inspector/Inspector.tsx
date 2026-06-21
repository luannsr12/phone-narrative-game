import React from 'react';
import {
  Plus,
  Trash2,
  Play,
  PhoneCall,
  AlarmClock,
  VolumeX,
  Bell,
  Star,
  Heart,
  Gamepad2,
  Gift,
  Megaphone,
  Download,
  Cloud,
  ShieldCheck,
  AlertTriangle,
  BatteryCharging,
  Settings,
  Sparkles,
  Trophy,
  Smile,
  type LucideIcon,
} from 'lucide-react';
import { useEditor, uid } from '../store';
import type { StoryNode, Attachment, ChoiceOption, RemoveEventNode } from '../types';
import { NODE_LABEL } from '../types';
import { NODE_ICON, NODE_ACCENT } from '../ui/icons';
import { EffectsEditor } from './EffectsEditor';
import { ConditionEditor } from './ConditionEditor';
import {
  Field,
  TextInput,
  NumberInput,
  TextArea,
  MessageTextArea,
  Select,
  MediaSelect,
  CharacterSelect,
  EvidenceSelect,
  EndingSelect,
  ChapterSelect,
  NewsSelect,
  SocialSelect,
  AccountSelect,
  CommentSelect,
  StorySelect,
  BlogSelect,
} from './fields';

// Custom-notification icon options. The VALUE is the game-side Ionicon name;
// the preview here is the matching lucide icon (never an emoji).
const NOTIF_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'notifications', label: 'Sino (padrão)', Icon: Bell },
  { value: 'star', label: 'Estrela (avaliar)', Icon: Star },
  { value: 'heart', label: 'Coração', Icon: Heart },
  { value: 'game-controller', label: 'Controle (jogo)', Icon: Gamepad2 },
  { value: 'gift', label: 'Presente', Icon: Gift },
  { value: 'megaphone', label: 'Megafone (anúncio)', Icon: Megaphone },
  { value: 'download', label: 'Download', Icon: Download },
  { value: 'cloud-done', label: 'Nuvem (backup)', Icon: Cloud },
  { value: 'shield-checkmark', label: 'Escudo (segurança)', Icon: ShieldCheck },
  { value: 'warning', label: 'Alerta', Icon: AlertTriangle },
  { value: 'battery-charging', label: 'Bateria', Icon: BatteryCharging },
  { value: 'settings', label: 'Sistema', Icon: Settings },
  { value: 'sparkles', label: 'Novidade', Icon: Sparkles },
  { value: 'trophy', label: 'Troféu', Icon: Trophy },
];

function NotifIconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = value || 'notifications';
  return (
    <div className="icon-pick">
      {NOTIF_ICONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          className={`icon-pick-btn ${cur === v ? 'active' : ''}`}
          title={label}
          aria-label={label}
          aria-pressed={cur === v}
          onClick={() => onChange(v)}
        >
          <Icon size={16} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function AttachmentEditor({
  value,
  onChange,
}: {
  value: Attachment | undefined;
  onChange: (a: Attachment | undefined) => void;
}) {
  if (!value) {
    return (
      <div className="subsection">
        <div className="subsection-head">
          <span>Anexo</span>
          <button className="btn small" onClick={() => onChange({ kind: 'image' })}>
            <Plus size={14} strokeWidth={1.75} /> adicionar anexo
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="subsection">
      <div className="subsection-head">
        <span>Anexo</span>
        <button className="btn danger small" onClick={() => onChange(undefined)}>
          <Trash2 size={14} strokeWidth={1.75} /> remover
        </button>
      </div>
      <Field label="Tipo">
        <Select
          value={value.kind}
          onChange={(v) => onChange({ ...value, kind: v as Attachment['kind'] })}
          options={[
            { value: 'image', label: 'Imagem (mostra no chat)' },
            { value: 'audio', label: 'Áudio (player de mensagem de voz)' },
            { value: 'video', label: 'Vídeo (abre no jogo)' },
            { value: 'document', label: 'Documento (abre no jogo)' },
            { value: 'location', label: 'Localização' },
            { value: 'link', label: 'Link (abre no navegador do jogo)' },
          ]}
        />
      </Field>
      {value.kind === 'audio' || value.kind === 'video' ? (
        <Field label={`Mídia da biblioteca (${value.kind === 'video' ? 'vídeo' : 'áudio'})`}>
          <MediaSelect
            kind={value.kind}
            value={value.media}
            onChange={(v) => onChange({ ...value, media: v })}
            allowEmpty="— escolher mídia (ou link abaixo) —"
          />
        </Field>
      ) : null}
      <Field
        label={
          value.kind === 'audio'
            ? 'Ou link direto do MP3 (opcional)'
            : value.kind === 'image'
            ? 'Link da imagem'
            : value.kind === 'video'
            ? 'Ou link direto do vídeo (opcional)'
            : value.kind === 'document'
            ? 'Link do documento (PDF etc.)'
            : value.kind === 'link'
            ? 'Endereço FICTÍCIO exibido (ex.: gazetaderavenwood.com.br/…)'
            : 'URL (opcional)'
        }
      >
        <TextInput value={value.url ?? ''} onChange={(v) => onChange({ ...value, url: v || undefined })} placeholder={value.kind === 'link' ? 'site-ficticio.com.br/pagina' : 'https://…'} />
      </Field>
      <Field label={value.kind === 'link' ? 'Título do link (aparece no balão)' : 'Nome do arquivo exibido'}>
        <TextInput value={value.label ?? ''} onChange={(v) => onChange({ ...value, label: v || undefined })} placeholder={value.kind === 'link' ? 'ex.: Jovem é dada como desaparecida' : 'ex.: IMG_0214.jpg'} />
      </Field>
      {value.kind === 'link' ? (
        <>
          <Field label="Abrir notícia cadastrada (deixe vazio para página avulsa)">
            <NewsSelect value={value.news ?? ''} onChange={(v) => onChange({ ...value, news: v || undefined })} allowEmpty="nenhuma — página avulsa" />
          </Field>
          {!value.news ? (
            <Field label="Conteúdo da página avulsa (linha em branco separa parágrafos)">
              <TextArea
                value={value.pageBody ?? ''}
                onChange={(v) => onChange({ ...value, pageBody: v || undefined })}
                rows={5}
                placeholder="O que aparece quando o jogador abre o link no navegador…"
              />
            </Field>
          ) : null}
        </>
      ) : null}
      {value.kind === 'audio' || value.kind === 'video' ? (
        <Field label="Duração (segundos)">
          <NumberInput value={value.durationSec} onChange={(v) => onChange({ ...value, durationSec: v })} />
        </Field>
      ) : null}
      {value.kind === 'audio' ? (
        <Field label="Transcrição (botão 'transcrever' no jogo, como no WhatsApp)">
          <TextArea
            value={value.transcript ?? ''}
            onChange={(v) => onChange({ ...value, transcript: v || undefined })}
            rows={3}
            placeholder="O que é dito no áudio…"
          />
        </Field>
      ) : null}
      <Field label="Vincular à evidência (vai para Arquivos do Caso)">
        <EvidenceSelect value={value.evidence ?? ''} onChange={(v) => onChange({ ...value, evidence: v || undefined })} allowEmpty="nenhuma" />
      </Field>
    </div>
  );
}

function ThreadSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Conversa (thread) onde aparece">
      <CharacterSelect value={value} onChange={onChange} allowEmpty="— escolher personagem —" />
    </Field>
  );
}

function NodeForm({ chapterId, node }: { chapterId: string; node: StoryNode }) {
  const updateNode = useEditor((s) => s.updateNode);
  const enterCallEditor = useEditor((s) => s.enterCallEditor);
  const set = (n: StoryNode) => updateNode(chapterId, node.id, n);

  switch (node.type) {
    case 'message':
      return (
        <>
          <Field label="Quem envia">
            <CharacterSelect value={node.speaker} onChange={(v) => set({ ...node, speaker: v, thread: node.thread || (v !== 'player' && v !== 'system' ? v : node.thread) })} withSpecial allowEmpty="—" />
          </Field>
          <ThreadSelect value={node.thread} onChange={(v) => set({ ...node, thread: v })} />
          <Field label="Texto da mensagem">
            <MessageTextArea value={node.text ?? ''} onChange={(v) => set({ ...node, text: v || undefined })} rows={4} />
          </Field>
          <p className="hint">
            Digite <code>{'{{'}</code> para inserir <b>variáveis</b> (nome/gênero do jogador) ou{' '}
            <b>links</b> (páginas web, notícias, posts e perfis do Mural). Use o botão{' '}
            <Smile size={12} strokeWidth={1.75} /> para emojis. Ex.: <code>{'{{player_name}}'}</code>{' '}
            vira o nome do jogador; um link vira um endereço clicável no chat.
          </p>
          <Field label="Tempo digitando (ms)">
            <NumberInput value={node.typingMs} onChange={(v) => set({ ...node, typingMs: v })} placeholder="1400" />
          </Field>
          <div className="subsection">
            <div className="subsection-head">
              <span>
                <AlarmClock size={14} strokeWidth={1.75} /> Lembrete se não responder (opcional)
              </span>
              {node.reminder ? (
                <button className="btn danger small" onClick={() => set({ ...node, reminder: undefined })}>
                  <Trash2 size={14} strokeWidth={1.75} /> remover
                </button>
              ) : (
                <button
                  className="btn small"
                  onClick={() => set({ ...node, reminder: { afterSec: 180, text: '' } })}
                >
                  <Plus size={14} strokeWidth={1.75} /> adicionar
                </button>
              )}
            </div>
            {node.reminder ? (
              <>
                <p className="hint">
                  Se o jogador não responder em tempo, quem enviou esta mensagem manda o texto
                  abaixo na mesma conversa (ex.: "voce ta ai?"). Dispara uma vez e é cancelado
                  assim que o jogador responde.
                </p>
                <Field label="Tempo sem resposta (segundos — 180 = 3 min)">
                  <NumberInput
                    value={node.reminder.afterSec}
                    onChange={(v) => set({ ...node, reminder: { ...node.reminder!, afterSec: v ?? 0 } })}
                    placeholder="180"
                  />
                </Field>
                <Field label="Mensagem do lembrete">
                  <TextArea
                    value={node.reminder.text}
                    onChange={(v) => set({ ...node, reminder: { ...node.reminder!, text: v } })}
                    rows={2}
                    placeholder="voce ta ai?"
                  />
                </Field>
              </>
            ) : null}
          </div>
          <AttachmentEditor value={node.attachment} onChange={(a) => set({ ...node, attachment: a })} />
          <EffectsEditor effects={node.effects} onChange={(e) => set({ ...node, effects: e })} />
        </>
      );

    case 'choice':
      return (
        <>
          <ThreadSelect value={node.thread} onChange={(v) => set({ ...node, thread: v })} />
          <Field label="Pergunta/contexto (opcional)">
            <TextInput value={node.prompt ?? ''} onChange={(v) => set({ ...node, prompt: v || undefined })} />
          </Field>
          <div className="subsection">
            <div className="subsection-head">
              <span>Opções de resposta</span>
              <button
                className="btn small"
                onClick={() =>
                  set({ ...node, options: [...node.options, { id: uid('opt'), text: '', next: '' }] })
                }
              >
                <Plus size={14} strokeWidth={1.75} /> opção
              </button>
            </div>
            {node.options.map((o, i) => (
              <div key={o.id} className="card">
                <div className="card-head">
                  <span className="tag">opção {i + 1} · id: {o.id}</span>
                  <button
                    className="btn danger small"
                    onClick={() => set({ ...node, options: node.options.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> remover
                  </button>
                </div>
                <OptionForm
                  option={o}
                  onChange={(no) => set({ ...node, options: node.options.map((x, j) => (j === i ? no : x)) })}
                />
              </div>
            ))}
            <p className="hint">Conecte cada opção ao próximo nó pelo canto direito dela no canvas.</p>
          </div>
        </>
      );

    case 'action':
      return (
        <>
          <p className="hint">Nó invisível: só aplica efeitos e segue adiante.</p>
          <EffectsEditor effects={node.effects} onChange={(e) => set({ ...node, effects: e ?? [] })} />
        </>
      );

    case 'branch':
      return (
        <>
          <p className="hint">
            Avalia as condições em ordem; a primeira verdadeira define o caminho. Conecte cada ramo no
            canvas.
          </p>
          <div className="subsection">
            <div className="subsection-head">
              <span>Ramos</span>
              <button
                className="btn small"
                onClick={() =>
                  set({ ...node, branches: [...node.branches, { condition: { type: 'flag', flag: '' }, next: '' }] })
                }
              >
                <Plus size={14} strokeWidth={1.75} /> ramo
              </button>
            </div>
            {node.branches.map((br, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <span className="tag">ramo {i + 1}</span>
                  <button
                    className="btn danger small"
                    onClick={() => set({ ...node, branches: node.branches.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> remover
                  </button>
                </div>
                <ConditionEditor
                  value={br.condition}
                  onChange={(c) =>
                    set({
                      ...node,
                      branches: node.branches.map((x, j) => (j === i ? { ...x, condition: c! } : x)),
                    })
                  }
                  required
                />
              </div>
            ))}
          </div>
        </>
      );

    case 'unlockMessage':
      return (
        <>
          <p className="hint">
            Libera o jogador para puxar conversa: a conversa do personagem passa a aparecer no app
            Mensagens (vazia) sem o personagem ter escrito nada. O que o jogador envia é definido
            pelos próximos nós — normalmente uma <b>Escolha</b> nessa conversa, ou uma{' '}
            <b>Mensagem</b> com remetente Jogador.
          </p>
          <Field label="Personagem que o jogador pode chamar">
            <CharacterSelect
              value={node.character}
              onChange={(v) => set({ ...node, character: v })}
              allowEmpty="— escolher personagem —"
            />
          </Field>
          <p className="hint">
            Se o contato ainda não estiver salvo na agenda, ele aparece como número desconhecido —
            combine com o efeito "desbloquear contato" ou marque o personagem como "já salvo" na
            aba Personagens.
          </p>
          <EffectsEditor effects={node.effects} onChange={(e) => set({ ...node, effects: e })} />
        </>
      );

    case 'shareContact':
      return (
        <>
          <p className="hint">
            Um personagem envia o <b>cartão de contato</b> de outro na conversa — como encaminhar
            um número no WhatsApp. Ao chegar, o contato é salvo na agenda (nome real aparece) e o
            jogador fica liberado para puxar conversa com ele. No jogo, tocar no cartão abre o
            chat desse novo contato.
          </p>
          <Field label="Quem envia o cartão">
            <CharacterSelect
              value={node.speaker}
              onChange={(v) => set({ ...node, speaker: v, thread: node.thread || (v !== 'player' && v !== 'system' ? v : node.thread) })}
              withSpecial
              allowEmpty="—"
            />
          </Field>
          <ThreadSelect value={node.thread} onChange={(v) => set({ ...node, thread: v })} />
          <Field label="Contato enviado (o personagem do cartão)">
            <CharacterSelect
              value={node.character}
              onChange={(v) => set({ ...node, character: v })}
              allowEmpty="— escolher contato —"
            />
          </Field>
          <Field label="Texto junto do cartão (opcional)">
            <TextInput
              value={node.text ?? ''}
              onChange={(v) => set({ ...node, text: v || undefined })}
              placeholder='ex.: "fala com ela, diz que fui eu que passei"'
            />
          </Field>
          <Field label="Tempo digitando (ms)">
            <NumberInput value={node.typingMs} onChange={(v) => set({ ...node, typingMs: v })} placeholder="1400" />
          </Field>
          <EffectsEditor effects={node.effects} onChange={(e) => set({ ...node, effects: e })} />
        </>
      );

    case 'delay':
      return (
        <>
          <p className="hint">
            Pausa em tempo real: o fluxo só segue para o nó conectado depois do tempo abaixo. O
            tempo é de relógio — continua contando mesmo com o jogo fechado.
          </p>
          <Field label="Tempo de espera (segundos)">
            <NumberInput
              value={node.seconds}
              onChange={(v) => set({ ...node, seconds: v ?? 0 })}
              placeholder="60"
            />
          </Field>
        </>
      );

    case 'activity':
      return (
        <>
          <p className="hint">
            Mostra o personagem como "digitando…" / "gravando áudio…" / "gravando vídeo…" na
            conversa pelo tempo abaixo e <b>segue o fluxo sem enviar nada</b>. Útil para dar peso a
            uma pausa antes da próxima mensagem.
          </p>
          <Field label="Quem aparece na atividade">
            <CharacterSelect
              value={node.speaker}
              onChange={(v) => set({ ...node, speaker: v, thread: node.thread || (v !== 'player' && v !== 'system' ? v : node.thread) })}
              withSpecial
              allowEmpty="—"
            />
          </Field>
          <ThreadSelect value={node.thread} onChange={(v) => set({ ...node, thread: v })} />
          <Field label="Indicador">
            <Select
              value={node.kind}
              onChange={(v) => set({ ...node, kind: v as typeof node.kind })}
              options={[
                { value: 'typing', label: 'Digitando' },
                { value: 'audio', label: 'Gravando áudio' },
                { value: 'video', label: 'Gravando vídeo' },
              ]}
            />
          </Field>
          <Field label="Duração (segundos)">
            <NumberInput
              value={node.seconds}
              onChange={(v) => set({ ...node, seconds: v ?? 0 })}
              placeholder="3"
            />
          </Field>
        </>
      );

    case 'publishNews':
      return (
        <>
          <p className="hint">
            Publica a notícia no app Notícias (com notificação), como um passo próprio do fluxo —
            sem precisar prender o efeito a uma mensagem.
          </p>
          <Field label="Notícia">
            <NewsSelect value={node.news} onChange={(v) => set({ ...node, news: v })} allowEmpty="— escolher notícia —" />
          </Field>
          <Field label="Atraso até publicar (segundos — 0 = imediato)">
            <NumberInput
              value={node.notifyDelaySec}
              onChange={(v) => set({ ...node, notifyDelaySec: v })}
              placeholder="0"
            />
          </Field>
        </>
      );

    case 'publishPost':
      return (
        <>
          <p className="hint">Publica o post no Mural (notifica quem segue o autor) e segue o fluxo.</p>
          <Field label="Post">
            <SocialSelect value={node.post} onChange={(v) => set({ ...node, post: v })} allowEmpty="— escolher post —" />
          </Field>
        </>
      );

    case 'publishStory':
      return (
        <>
          <p className="hint">Publica o story no Mural (anel no topo do feed) e segue o fluxo.</p>
          <Field label="Story">
            <StorySelect value={node.story} onChange={(v) => set({ ...node, story: v })} allowEmpty="— escolher story —" />
          </Field>
        </>
      );

    case 'offerBlog':
      return (
        <>
          <p className="hint">
            Libera uma <b>pauta</b> para o jogador no app Blog: a matéria entra em Rascunhos para o
            jogador escolher um ângulo e publicar. O texto e os efeitos de cada ângulo são
            definidos na aba <b>Blog</b>.
          </p>
          <Field label="Pauta (matéria do Blog)">
            <BlogSelect value={node.blog} onChange={(v) => set({ ...node, blog: v })} allowEmpty="— escolher matéria —" />
          </Field>
        </>
      );

    case 'socialActivity':
      return (
        <>
          <p className="hint">
            Mexe no Mural sem precisar de notificação (se quiser uma, use um nó de Notificação à parte):
            um personagem/NPC comenta num post, ou você define o número de curtidas de um post ou comentário.
          </p>
          <Field label="O que faz">
            <Select
              value={node.action}
              onChange={(v) => set({ ...node, action: v as typeof node.action })}
              options={[
                { value: 'comment', label: 'Comentar em um post' },
                { value: 'postLikes', label: 'Definir curtidas de um post' },
                { value: 'commentLikes', label: 'Definir curtidas de um comentário' },
              ]}
            />
          </Field>
          {node.action === 'comment' ? (
            <>
              <Field label="Post">
                <SocialSelect value={node.post ?? ''} onChange={(v) => set({ ...node, post: v })} allowEmpty="— escolher post —" />
              </Field>
              <Field label="Quem comenta (personagem / NPC / jogador)">
                <AccountSelect value={node.author ?? ''} onChange={(v) => set({ ...node, author: v })} allowEmpty="—" />
              </Field>
              <Field label="Texto do comentário">
                <TextArea value={node.text ?? ''} onChange={(v) => set({ ...node, text: v })} rows={2} />
              </Field>
              <Field label="Responder a (comentário — vazio = comentário principal)">
                <CommentSelect value={node.replyTo ?? ''} onChange={(v) => set({ ...node, replyTo: v || undefined })} allowEmpty="—" />
              </Field>
              <Field label="Curtidas iniciais (opcional)">
                <NumberInput value={node.likes} onChange={(v) => set({ ...node, likes: v })} placeholder="0" />
              </Field>
              <Field label="ID do comentário (opcional — p/ editar as curtidas dele depois)">
                <TextInput value={node.commentId ?? ''} onChange={(v) => set({ ...node, commentId: v || undefined })} placeholder="ex.: c_boato" />
              </Field>
            </>
          ) : node.action === 'postLikes' ? (
            <>
              <Field label="Post">
                <SocialSelect value={node.post ?? ''} onChange={(v) => set({ ...node, post: v })} allowEmpty="— escolher post —" />
              </Field>
              <Field label="Curtidas">
                <NumberInput value={node.likes} onChange={(v) => set({ ...node, likes: v ?? 0 })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Comentário">
                <CommentSelect value={node.comment ?? ''} onChange={(v) => set({ ...node, comment: v })} allowEmpty="— escolher comentário —" />
              </Field>
              <Field label="Curtidas">
                <NumberInput value={node.likes} onChange={(v) => set({ ...node, likes: v ?? 0 })} />
              </Field>
            </>
          )}
        </>
      );

    case 'socialFollow':
      return (
        <>
          <p className="hint">
            Define os números de <b>seguidores</b> e <b>seguindo</b> de um perfil no Mural. Deixe um
            campo vazio para não alterá-lo.
          </p>
          <Field label="Perfil (personagem / NPC / jogador)">
            <AccountSelect value={node.account} onChange={(v) => set({ ...node, account: v })} allowEmpty="—" />
          </Field>
          <Field label="Seguidores (vazio = não altera)">
            <NumberInput value={node.followers} onChange={(v) => set({ ...node, followers: v })} placeholder="manter" />
          </Field>
          <Field label="Seguindo (vazio = não altera)">
            <NumberInput value={node.following} onChange={(v) => set({ ...node, following: v })} placeholder="manter" />
          </Field>
        </>
      );

    case 'bank':
      return (
        <>
          <p className="hint">
            Mexe no saldo do jogador como um passo próprio do fluxo. Valor positivo = jogador
            recebe (com notificação do banco); negativo = cobrança silenciosa.
          </p>
          <Field label="Valor em R$ (use negativo para cobrar)">
            <NumberInput value={node.amount} onChange={(v) => set({ ...node, amount: v ?? 0 })} />
          </Field>
          <Field label="Descrição no extrato (opcional)">
            <TextInput value={node.reason ?? ''} onChange={(v) => set({ ...node, reason: v || undefined })} placeholder="ex.: Pix de Eron" />
          </Field>
        </>
      );

    case 'notification':
      return (
        <>
          <p className="hint">
            Dispara uma notificação heads-up dentro do jogo (banner + vibração). Ao tocar, vale a
            prioridade: <b>link externo</b> &gt; <b>notícia</b> &gt; <b>post</b> &gt; abre o app
            escolhido.
          </p>
          <Field label="App da notificação">
            <Select
              value={node.app}
              onChange={(v) => set({ ...node, app: v as typeof node.app })}
              options={[
                { value: 'messages', label: 'Mensagens' },
                { value: 'news', label: 'Notícias' },
                { value: 'social', label: 'Mural' },
                { value: 'bank', label: 'Tulu Bank' },
                { value: 'blog', label: 'Blog' },
                { value: 'custom', label: 'Personalizada (sem app do jogo)' },
              ]}
            />
          </Field>
          {node.app === 'custom' ? (
            <>
              <Field label="Nome exibido do 'app'">
                <TextInput
                  value={node.appName ?? ''}
                  onChange={(v) => set({ ...node, appName: v || undefined })}
                  placeholder="ex.: Ravenwood, Sistema, Operadora…"
                />
              </Field>
              <Field label="Ícone">
                <NotifIconPicker
                  value={node.icon ?? 'notifications'}
                  onChange={(v) => set({ ...node, icon: v })}
                />
              </Field>
              <Field label="Cor de fundo do ícone (hex)">
                <TextInput
                  value={node.iconColor ?? ''}
                  onChange={(v) => set({ ...node, iconColor: v || undefined })}
                  placeholder="#5C6678"
                />
              </Field>
            </>
          ) : null}
          <Field label="Título">
            <TextInput value={node.title} onChange={(v) => set({ ...node, title: v })} placeholder="ex.: Gazeta de Ravenwood" />
          </Field>
          <Field label="Texto">
            <TextArea value={node.body ?? ''} onChange={(v) => set({ ...node, body: v || undefined })} rows={2} />
          </Field>
          <Field label="Tempo na tela (segundos — vazio = padrão ~4s)">
            <NumberInput
              value={node.durationSec}
              onChange={(v) => set({ ...node, durationSec: v })}
              placeholder="4"
            />
          </Field>
          <Field label="Ao tocar, abrir notícia (opcional)">
            <NewsSelect value={node.news ?? ''} onChange={(v) => set({ ...node, news: v || undefined })} allowEmpty="nenhuma" />
          </Field>
          <Field label="Ao tocar, abrir post do Mural (opcional)">
            <SocialSelect value={node.post ?? ''} onChange={(v) => set({ ...node, post: v || undefined })} allowEmpty="nenhum" />
          </Field>
          <Field label="Ao tocar, abrir LINK EXTERNO real (sai do jogo — opcional)">
            <TextInput value={node.url ?? ''} onChange={(v) => set({ ...node, url: v || undefined })} placeholder="https://…" />
          </Field>
        </>
      );

    case 'call':
      return (
        <>
          <Field label="Quem liga">
            <CharacterSelect value={node.caller} onChange={(v) => set({ ...node, caller: v })} allowEmpty="—" />
          </Field>
          <Field label="Direção">
            <Select
              value={node.direction}
              onChange={(v) => set({ ...node, direction: v as 'incoming' | 'outgoing' })}
              options={[
                { value: 'incoming', label: 'Recebida (toca para o jogador)' },
                { value: 'outgoing', label: 'Realizada' },
              ]}
            />
          </Field>
          <Field label="Conversa para registrar a chamada perdida (opcional)">
            <CharacterSelect value={node.thread ?? ''} onChange={(v) => set({ ...node, thread: v || undefined })} allowEmpty="nenhuma" />
          </Field>
          <Field label="Falas da chamada (uma por linha)">
            <TextArea
              value={(node.transcript ?? []).join('\n')}
              onChange={(v) => set({ ...node, transcript: v ? v.split('\n') : undefined })}
              rows={5}
            />
          </Field>
          <Field label="Mensagem de voz se recusar (opcional)">
            <TextArea value={node.voicemailText ?? ''} onChange={(v) => set({ ...node, voicemailText: v || undefined })} rows={2} />
          </Field>
          <EffectsEditor
            title="Efeitos se ATENDER"
            effects={node.onAnswer?.effects}
            onChange={(e) => set({ ...node, onAnswer: { ...(node.onAnswer ?? {}), effects: e } })}
          />
          <EffectsEditor
            title="Efeitos se RECUSAR"
            effects={node.onDecline?.effects}
            onChange={(e) => set({ ...node, onDecline: { ...(node.onDecline ?? {}), effects: e } })}
          />
          <p className="hint">Conecte "atendeu" e "recusou" aos próximos nós no canvas.</p>
        </>
      );

    case 'callScene':
      return (
        <>
          <button className="btn accent" style={{ width: '100%', justifyContent: 'center' }} onClick={() => enterCallEditor(chapterId, node.id)}>
            <PhoneCall size={15} strokeWidth={1.75} /> Abrir fluxo da ligação ({Object.keys(node.scene ?? {}).length} passo(s))
          </button>
          <p className="hint">
            Esta ligação tem o <b>próprio fluxograma</b> (áudios/MP3, escolhas de resposta, ações,
            condições e "encerrar"). Abra-o no botão acima. Aqui ficam só as configurações gerais.
          </p>
          <Field label="Quem liga">
            <CharacterSelect value={node.caller} onChange={(v) => set({ ...node, caller: v })} allowEmpty="—" />
          </Field>
          <Field label="Direção">
            <Select
              value={node.direction ?? 'incoming'}
              onChange={(v) => set({ ...node, direction: v as 'incoming' | 'outgoing' })}
              options={[
                { value: 'incoming', label: 'Recebida (toca para o jogador)' },
                { value: 'outgoing', label: 'Realizada' },
              ]}
            />
          </Field>
          <Field label="Toca por (segundos — vazio = até atender/recusar)">
            <NumberInput
              value={node.ringSeconds}
              onChange={(v) => set({ ...node, ringSeconds: v })}
              placeholder="ex.: 20"
            />
          </Field>
          <EffectsEditor
            title="Efeitos ao ATENDER (conectar)"
            effects={node.effects}
            onChange={(e) => set({ ...node, effects: e })}
          />
          <div className="subsection">
            <div className="subsection-head"><span>Se RECUSAR</span></div>
            <Field label="Recado de voz (opcional)">
              <TextArea
                value={node.onDecline?.voicemailText ?? ''}
                onChange={(v) => set({ ...node, onDecline: { ...(node.onDecline ?? {}), voicemailText: v || undefined } })}
                rows={2}
              />
            </Field>
            <Field label="Conversa do recado (vazio = a de quem ligou)">
              <CharacterSelect
                value={node.onDecline?.thread ?? ''}
                onChange={(v) => set({ ...node, onDecline: { ...(node.onDecline ?? {}), thread: v || undefined } })}
                allowEmpty="quem ligou"
              />
            </Field>
            <EffectsEditor
              title="Efeitos se RECUSAR"
              effects={node.onDecline?.effects}
              onChange={(e) => set({ ...node, onDecline: { ...(node.onDecline ?? {}), effects: e } })}
            />
          </div>
          <div className="subsection">
            <div className="subsection-head"><span>Se NÃO ATENDER (tempo esgotou)</span></div>
            <p className="hint">Deixe vazio para tratar igual a recusar. Preencha para divergir a chamada perdida.</p>
            <Field label="Recado de voz (opcional)">
              <TextArea
                value={node.onTimeout?.voicemailText ?? ''}
                onChange={(v) => set({ ...node, onTimeout: { ...(node.onTimeout ?? {}), voicemailText: v || undefined } })}
                rows={2}
              />
            </Field>
            <EffectsEditor
              title="Efeitos se NÃO ATENDER"
              effects={node.onTimeout?.effects}
              onChange={(e) => set({ ...node, onTimeout: { ...(node.onTimeout ?? {}), effects: e } })}
            />
          </div>
          <p className="hint">
            Na tela, ligue <b>"depois da ligação"</b>, <b>"recusou"</b> e <b>"não atendeu"</b> aos
            próximos nós do capítulo.
          </p>
        </>
      );

    case 'event': {
      const eventWord =
        node.event === 'playerCall'
          ? 'fizer uma ligação'
          : node.event === 'likePost'
            ? 'curtir um post no Mural'
            : node.event === 'viewNews'
              ? 'abrir uma notícia'
              : 'seguir um perfil no Mural';
      return (
        <>
          <p className="hint">
            <b>Instala um ouvinte.</b> A partir daqui, quando o JOGADOR {eventWord} que case com o alvo
            e com a condição abaixo, a saída <b>"Quando o evento acontecer"</b> roda (e os efeitos são
            aplicados{node.event === 'playerCall' ? ', com o desfecho tocando na tela' : ''}).
            <br />
            As duas saídas (ligue-as na tela do fluxo): <b>"Quando o evento acontecer"</b> = o que toca
            no disparo; <b>"Continuar agora"</b> = deixe <b>vazio</b> para a história ESPERAR aqui até o
            evento (e seguir com poder total), ou ligue para a história SEGUIR e o evento rodar em
            paralelo (segundo plano) quando acontecer. No modo segundo plano o ouvinte fica ativo até um
            nó <b>Remover evento</b> desarmá-lo.
          </p>
          <Field label="Evento (o que o jogador faz)">
            <Select
              value={node.event}
              onChange={(v) =>
                // Trocar o tipo descarta os campos específicos do tipo anterior.
                set({
                  ...node,
                  event: v as typeof node.event,
                  contact: undefined,
                  number: undefined,
                  post: undefined,
                  news: undefined,
                  account: undefined,
                  outcome: undefined,
                  audioUrl: undefined,
                  text: undefined,
                  hangUpAfterMs: undefined,
                })
              }
              options={[
                { value: 'playerCall', label: 'Faz uma ligação' },
                { value: 'likePost', label: 'Curte um post (Mural)' },
                { value: 'viewNews', label: 'Abre uma notícia' },
                { value: 'followProfile', label: 'Segue um perfil (Mural)' },
              ]}
            />
          </Field>

          {node.event === 'playerCall' ? (
            <>
              <Field label="Quando o jogador ligar para:">
                <CharacterSelect
                  value={node.contact ?? ''}
                  onChange={(v) => set({ ...node, contact: v || undefined })}
                  allowEmpty="— qualquer personagem —"
                />
              </Field>
              <Field label="…ou número discado">
                <TextInput
                  value={node.number ?? ''}
                  onChange={(v) => set({ ...node, number: v || undefined })}
                  placeholder="ex.: 190"
                />
              </Field>
              {!node.contact && !node.number ? (
                <p className="hint">vazio = qualquer ligação</p>
              ) : null}
            </>
          ) : null}

          {node.event === 'likePost' ? (
            <Field label="Quando o jogador curtir o post:">
              <SocialSelect
                value={node.post ?? ''}
                onChange={(v) => set({ ...node, post: v || undefined })}
                allowEmpty="— qualquer post —"
              />
            </Field>
          ) : null}

          {node.event === 'viewNews' ? (
            <Field label="Quando o jogador abrir a notícia:">
              <NewsSelect
                value={node.news ?? ''}
                onChange={(v) => set({ ...node, news: v || undefined })}
                allowEmpty="— qualquer notícia —"
              />
            </Field>
          ) : null}

          {node.event === 'followProfile' ? (
            <Field label="Quando o jogador seguir o perfil:">
              <AccountSelect
                value={node.account ?? ''}
                onChange={(v) => set({ ...node, account: v || undefined })}
                allowEmpty="— qualquer perfil —"
              />
            </Field>
          ) : null}

          <ConditionEditor
            title="Condição (confiança, evidência, flag…)"
            value={node.condition}
            onChange={(c) => set({ ...node, condition: c || undefined })}
          />

          {node.event === 'playerCall' ? (
            <>
              <Field label="Desfecho:">
                <Select
                  value={node.outcome ?? 'ringing'}
                  onChange={(v) =>
                    set(
                      v === 'answered'
                        ? { ...node, outcome: 'answered' }
                        : // só chamando/cai/recusada não usam áudio/texto/encerramento — descarta.
                          {
                            ...node,
                            outcome: v as 'ringing' | 'dropped' | 'declined',
                            audioUrl: undefined,
                            text: undefined,
                            hangUpAfterMs: undefined,
                          },
                    )
                  }
                  options={[
                    { value: 'ringing', label: 'Só chamando' },
                    { value: 'dropped', label: 'Cai' },
                    { value: 'declined', label: 'Recusada' },
                    { value: 'answered', label: 'Atendida' },
                  ]}
                />
              </Field>
              {node.outcome === 'answered' ? (
                <>
                  <Field label="Áudio da ligação (mídia da biblioteca)">
                    <MediaSelect
                      kind="audio"
                      value={node.media}
                      onChange={(v) => set({ ...node, media: v })}
                      allowEmpty="— escolher mídia (ou link abaixo) —"
                    />
                  </Field>
                  <Field label="Ou link direto do mp3 (opcional)">
                    <TextInput
                      value={node.audioUrl ?? ''}
                      onChange={(v) => set({ ...node, audioUrl: v || undefined })}
                      placeholder="https://…/ligacao.mp3"
                    />
                  </Field>
                  <Field label="Transcrição do áudio">
                    <TextArea
                      value={node.text ?? ''}
                      onChange={(v) => set({ ...node, text: v || undefined })}
                      rows={3}
                    />
                  </Field>
                  <Field label="Encerrar após o áudio (ms)">
                    <NumberInput
                      value={node.hangUpAfterMs}
                      onChange={(v) => set({ ...node, hangUpAfterMs: v })}
                      placeholder="ex.: 1500"
                    />
                  </Field>
                </>
              ) : null}
            </>
          ) : null}

          <EffectsEditor
            title="Efeitos quando o evento disparar"
            effects={node.effects}
            onChange={(e) => set({ ...node, effects: e })}
          />
        </>
      );
    }

    case 'removeEvent':
      return <RemoveEventForm chapterId={chapterId} node={node} set={set} />;

    case 'fork':
      return (
        <>
          <p className="hint">
            <b>Dispara todas as saídas AO MESMO TEMPO</b> (em paralelo). Ligue cada saída a um próximo
            nó pela tela do fluxo. As trilhas paralelas servem para ENTREGA — mensagens, efeitos,
            esperas; escolhas e ligações ficam na <b>linha principal</b> (a 1ª saída). Saída que não
            leva a nada: tudo bem, ela só termina.
          </p>
          <Field label={`Saídas (${node.outputs.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {node.outputs.map((out, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="hint" style={{ flex: 1 }}>
                    {i === 0 ? 'Saída 1 (linha principal)' : `Saída ${i + 1}`}
                    {out ? ` → ${out}` : ' — ligue na tela do fluxo'}
                  </span>
                  <button
                    className="btn danger small"
                    disabled={node.outputs.length <= 2}
                    onClick={() => set({ ...node, outputs: node.outputs.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> remover
                  </button>
                </div>
              ))}
            </div>
          </Field>
          <button className="btn small" onClick={() => set({ ...node, outputs: [...node.outputs, ''] })}>
            <Plus size={14} strokeWidth={1.75} /> adicionar saída
          </button>
        </>
      );

    case 'chapterEnd':
      return (
        <>
          <Field label="Próximo capítulo (vazio = seguinte na ordem)">
            <ChapterSelect value={node.next ?? ''} onChange={(v) => set({ ...node, next: v || undefined })} allowEmpty="seguinte na ordem" />
          </Field>
          <Field label="Encerrar num final (opcional)">
            <EndingSelect value={node.ending ?? ''} onChange={(v) => set({ ...node, ending: v || undefined })} allowEmpty="não encerrar" />
          </Field>
          <EffectsEditor effects={node.effects} onChange={(e) => set({ ...node, effects: e })} />
        </>
      );
  }
}

export function OptionForm({ option, onChange }: { option: ChoiceOption; onChange: (o: ChoiceOption) => void }) {
  return (
    <>
      <Field label="Texto do botão (o que o jogador vê)">
        <TextInput value={option.text} onChange={(v) => onChange({ ...option, text: v })} />
      </Field>
      <label className="check">
        <input
          type="checkbox"
          checked={Boolean(option.silent)}
          onChange={(e) =>
            onChange({ ...option, silent: e.target.checked || undefined, say: e.target.checked ? undefined : option.say })
          }
        />
        <span className="check-ico"><VolumeX size={14} strokeWidth={1.75} /></span>
        <span>Não dizer nada — nenhuma mensagem é enviada no chat</span>
      </label>
      {!option.silent ? (
        <Field label="Fala enviada (vazio = igual ao botão)">
          <TextInput value={option.say ?? ''} onChange={(v) => onChange({ ...option, say: v || undefined })} />
        </Field>
      ) : null}
      <ConditionEditor
        title="Só aparece se…"
        value={option.condition}
        onChange={(c) => onChange({ ...option, condition: c })}
      />
      <EffectsEditor effects={option.effects} onChange={(e) => onChange({ ...option, effects: e })} />
    </>
  );
}

function eventNodeLabel(n: StoryNode): string {
  if (n.type !== 'event') return n.id;
  let where: string;
  switch (n.event) {
    case 'likePost':
      where = n.post ? `curtir ${n.post}` : 'curtir qualquer post';
      break;
    case 'viewNews':
      where = n.news ? `abrir ${n.news}` : 'abrir qualquer notícia';
      break;
    case 'followProfile':
      where = n.account ? `seguir ${n.account}` : 'seguir qualquer perfil';
      break;
    default:
      where = n.contact ? `→ ${n.contact}` : n.number ? `→ ${n.number}` : '→ qualquer ligação';
  }
  return `${n.id} (${where})`;
}

function RemoveEventForm({
  chapterId,
  node,
  set,
}: {
  chapterId: string;
  node: RemoveEventNode;
  set: (n: StoryNode) => void;
}) {
  const chapter = useEditor((s) => s.bundle.chapters[chapterId]);
  const events = Object.values(chapter?.nodes ?? {}).filter((n) => n.type === 'event');
  // Keep a dangling/out-of-chapter target visible so it isn't silently lost.
  const known = new Set(events.map((e) => e.id));
  const options = [
    ...events.map((e) => ({ value: e.id, label: eventNodeLabel(e) })),
    ...(node.target && !known.has(node.target)
      ? [{ value: node.target, label: `${node.target} (evento não encontrado)` }]
      : []),
  ];
  return (
    <>
      <p className="hint">
        Desarma um nó de <b>Evento</b> armado antes, para ele parar de disparar nas ligações do
        jogador. Segue o fluxo na hora.
      </p>
      <Field label="Evento a remover">
        <Select
          value={node.target}
          onChange={(v) => set({ ...node, target: v })}
          options={options}
          allowEmpty={events.length ? '— escolher evento —' : '(nenhum evento neste capítulo)'}
        />
      </Field>
    </>
  );
}

export function Inspector() {
  const bundle = useEditor((s) => s.bundle);
  const chapterId = useEditor((s) => s.selectedChapterId);
  const nodeId = useEditor((s) => s.selectedNodeId);
  const setEntry = useEditor((s) => s.setEntry);
  const removeNode = useEditor((s) => s.removeNode);
  const selectNode = useEditor((s) => s.selectNode);

  if (!chapterId) return null;
  const chapter = bundle.chapters[chapterId];
  const node = nodeId ? chapter?.nodes[nodeId] : undefined;

  if (!chapter || !node) {
    return (
      <aside className="inspector">
        <p className="hint">Selecione um nó no canvas para editar, ou adicione um novo pela barra superior.</p>
      </aside>
    );
  }

  const HeadIco = NODE_ICON[node.type];

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <span
          className="inspector-head-tile"
          style={{ background: `${NODE_ACCENT[node.type]}22`, color: NODE_ACCENT[node.type] }}
        >
          <HeadIco size={14} strokeWidth={1.75} />
        </span>
        <span className="inspector-head-title">{NODE_LABEL[node.type]}</span>
        <code className="nodeid">{node.id}</code>
      </div>
      <div className="inspector-actions">
        {chapter.entry !== node.id ? (
          <button className="btn small" onClick={() => setEntry(chapterId, node.id)}>
            <Play size={13} strokeWidth={1.75} /> definir como início
          </button>
        ) : (
          <span className="tag">
            <Play size={12} strokeWidth={1.75} /> início do capítulo
          </span>
        )}
        <button
          className="btn danger small"
          onClick={() => {
            removeNode(chapterId, node.id);
            selectNode(null);
          }}
        >
          <Trash2 size={14} strokeWidth={1.75} /> excluir nó
        </button>
      </div>
      <NodeForm chapterId={chapterId} node={node} />
    </aside>
  );
}
