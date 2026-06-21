import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Play, Paperclip, Zap, Clock, Globe, Newspaper, Megaphone, VolumeX } from 'lucide-react';
import type { StoryNode } from '../types';
import { useEditor } from '../store';
import { NODE_ICON, NODE_ACCENT, EVENT_ICON, type LucideIcon } from '../ui/icons';

export type FlowNodeData = { story: StoryNode; isEntry: boolean };
export type FlowNode = Node<FlowNodeData>;

export function speakerName(id: string): string {
  if (id === 'player') return 'Jogador';
  if (id === 'system') return 'Narração';
  const c = useEditor.getState().bundle.characters[id];
  return c?.name ?? id ?? '?';
}

export function Shell({
  kind,
  title,
  icon: Ico,
  accent,
  isEntry,
  selected,
  children,
  hasOut = true,
  hasIn = true,
}: {
  kind: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  isEntry: boolean;
  selected?: boolean;
  children?: React.ReactNode;
  hasOut?: boolean;
  hasIn?: boolean;
}) {
  return (
    <div className={`fnode fnode-${kind} ${selected ? 'selected' : ''}`}>
      {hasIn ? <Handle type="target" position={Position.Top} /> : null}
      <div className="fnode-head">
        <span className="fnode-ico" style={{ background: `${accent}22`, color: accent }}>
          <Ico size={14} strokeWidth={1.75} />
        </span>
        <span className="fnode-kind">{title}</span>
        {isEntry ? (
          <span className="fnode-entry">
            <Play size={10} strokeWidth={1.75} /> INÍCIO
          </span>
        ) : null}
      </div>
      {children}
      {hasOut ? <Handle type="source" position={Position.Bottom} /> : null}
    </div>
  );
}

export function MessageFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'message') return null;
  return (
    <Shell kind="message" title={speakerName(n.speaker)} icon={NODE_ICON.message} accent={NODE_ACCENT.message} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{n.text ? n.text.slice(0, 90) : <i>(sem texto)</i>}</div>
      {n.attachment ? <div className="fnode-badge"><Paperclip size={12} strokeWidth={1.75} /> {n.attachment.kind}</div> : null}
      {n.effects?.length ? <div className="fnode-badge"><Zap size={12} strokeWidth={1.75} /> {n.effects.length} efeito(s)</div> : null}
    </Shell>
  );
}

export function ChoiceFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'choice') return null;
  return (
    <Shell kind="choice" title="Escolha do jogador" icon={NODE_ICON.choice} accent={NODE_ACCENT.choice} isEntry={data.isEntry} selected={selected} hasOut={false}>
      {n.options.map((o) => (
        <div key={o.id} className={`fnode-option ${o.silent ? 'silent' : ''}`}>
          <span>
            {o.silent ? <VolumeX size={12} strokeWidth={1.75} /> : null}
            {o.text.slice(0, 60) || '(vazia)'}
          </span>
          <Handle type="source" position={Position.Right} id={o.id} className="opt-handle" />
        </div>
      ))}
    </Shell>
  );
}

export function ActionFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'action') return null;
  return (
    <Shell kind="action" title="Ação" icon={NODE_ICON.action} accent={NODE_ACCENT.action} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{n.effects.length ? `${n.effects.length} efeito(s)` : <i>(sem efeitos)</i>}</div>
    </Shell>
  );
}

export function BranchFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'branch') return null;
  return (
    <Shell kind="branch" title="Condição" icon={NODE_ICON.branch} accent={NODE_ACCENT.branch} isEntry={data.isEntry} selected={selected} hasOut={false}>
      {n.branches.map((_, i) => (
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

export function UnlockMessageFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'unlockMessage') return null;
  return (
    <Shell kind="unlock" title="Liberar mensagem" icon={NODE_ICON.unlockMessage} accent={NODE_ACCENT.unlockMessage} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {n.character ? `Jogador pode chamar ${speakerName(n.character)}` : <i>(sem personagem)</i>}
      </div>
      {n.effects?.length ? <div className="fnode-badge"><Zap size={12} strokeWidth={1.75} /> {n.effects.length} efeito(s)</div> : null}
    </Shell>
  );
}

export function ShareContactFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'shareContact') return null;
  return (
    <Shell kind="contact" title={`${speakerName(n.speaker)} envia contato`} icon={NODE_ICON.shareContact} accent={NODE_ACCENT.shareContact} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {n.character ? `cartão de ${speakerName(n.character)}` : <i>(escolha o contato)</i>}
        {n.text ? ` — "${n.text.slice(0, 50)}"` : ''}
      </div>
      {n.effects?.length ? <div className="fnode-badge"><Zap size={12} strokeWidth={1.75} /> {n.effects.length} efeito(s)</div> : null}
    </Shell>
  );
}

function humanDuration(sec: number): string {
  if (!sec || sec <= 0) return '(sem tempo)';
  if (sec % 3600 === 0) return `${sec / 3600} h`;
  if (sec % 60 === 0) return `${sec / 60} min`;
  return `${sec} s`;
}

export function DelayFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'delay') return null;
  return (
    <Shell kind="delay" title="Tempo" icon={NODE_ICON.delay} accent={NODE_ACCENT.delay} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">espera {humanDuration(n.seconds)} e segue</div>
    </Shell>
  );
}

const ACTIVITY_KIND_LABEL: Record<string, string> = {
  typing: 'digitando',
  audio: 'gravando áudio',
  video: 'gravando vídeo',
};

export function ActivityFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'activity') return null;
  return (
    <Shell kind="activity" title={speakerName(n.speaker)} icon={NODE_ICON.activity} accent={NODE_ACCENT.activity} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{`${ACTIVITY_KIND_LABEL[n.kind] ?? n.kind} · ${n.seconds}s`}</div>
    </Shell>
  );
}

export function PublishNewsFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'publishNews') return null;
  const item = useEditor.getState().bundle.news[n.news];
  return (
    <Shell kind="news" title="Publicar notícia" icon={NODE_ICON.publishNews} accent={NODE_ACCENT.publishNews} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{item ? item.headline.slice(0, 70) : <i>(escolha a notícia)</i>}</div>
      {n.notifyDelaySec ? <div className="fnode-badge"><Clock size={12} strokeWidth={1.75} /> após {n.notifyDelaySec}s</div> : null}
    </Shell>
  );
}

export function PublishPostFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'publishPost') return null;
  const item = useEditor.getState().bundle.social[n.post];
  return (
    <Shell kind="post" title="Post no Mural" icon={NODE_ICON.publishPost} accent={NODE_ACCENT.publishPost} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {item ? `@${item.author}: ${item.caption.slice(0, 60)}` : <i>(escolha o post)</i>}
      </div>
    </Shell>
  );
}

export function PublishStoryFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'publishStory') return null;
  const item = useEditor.getState().bundle.socialStories[n.story];
  return (
    <Shell kind="story" title="Story no Mural" icon={NODE_ICON.publishStory} accent={NODE_ACCENT.publishStory} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {item ? `@${item.author}: ${(item.text ?? item.id).slice(0, 60)}` : <i>(escolha o story)</i>}
      </div>
    </Shell>
  );
}

export function OfferBlogFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'offerBlog') return null;
  const item = useEditor.getState().bundle.blog?.[n.blog];
  return (
    <Shell kind="blog" title="Liberar pauta (Blog)" icon={NODE_ICON.offerBlog} accent={NODE_ACCENT.offerBlog} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{item ? (item.title || item.id).slice(0, 70) : <i>(escolha a matéria)</i>}</div>
    </Shell>
  );
}

const SOCIAL_ACTION_LABEL: Record<string, string> = {
  comment: 'comentário',
  postLikes: 'curtidas do post',
  commentLikes: 'curtidas do comentário',
};

export function SocialActivityFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'socialActivity') return null;
  return (
    <Shell kind="socialact" title={`Mural: ${SOCIAL_ACTION_LABEL[n.action] ?? n.action}`} icon={NODE_ICON.socialActivity} accent={NODE_ACCENT.socialActivity} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {n.action === 'comment'
          ? n.post
            ? `${speakerName(n.author || 'player')} comenta em ${n.post}`
            : <i>(escolha o post)</i>
          : n.action === 'postLikes'
          ? n.post
            ? `${n.likes ?? 0} curtidas em ${n.post}`
            : <i>(escolha o post)</i>
          : n.comment
          ? `${n.likes ?? 0} curtidas no comentário`
          : <i>(escolha o comentário)</i>}
      </div>
    </Shell>
  );
}

export function SocialFollowFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'socialFollow') return null;
  const parts: string[] = [];
  if (n.followers != null) parts.push(`${n.followers} seguidores`);
  if (n.following != null) parts.push(`${n.following} seguindo`);
  return (
    <Shell kind="socialfollow" title="Mural: seguidores" icon={NODE_ICON.socialFollow} accent={NODE_ACCENT.socialFollow} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {n.account ? `${speakerName(n.account)} — ${parts.join(' · ') || '(sem mudança)'}` : <i>(escolha o perfil)</i>}
      </div>
    </Shell>
  );
}

export function BankFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'bank') return null;
  const credit = n.amount >= 0;
  return (
    <Shell kind="bank" title="Saldo (R$)" icon={NODE_ICON.bank} accent={NODE_ACCENT.bank} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {credit ? `jogador recebe R$ ${n.amount}` : `cobrança de R$ ${Math.abs(n.amount)}`}
        {n.reason ? ` — ${n.reason.slice(0, 40)}` : ''}
      </div>
    </Shell>
  );
}

const NOTIF_APP_LABEL: Record<string, string> = {
  messages: 'Mensagens',
  news: 'Notícias',
  social: 'Mural',
  bank: 'Tulu Bank',
  blog: 'Blog',
};

export function NotificationFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'notification') return null;
  const appLabel = n.app === 'custom' ? n.appName || 'Personalizada' : NOTIF_APP_LABEL[n.app] ?? n.app;
  return (
    <Shell kind="notification" title={appLabel} icon={NODE_ICON.notification} accent={NODE_ACCENT.notification} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">{n.title ? n.title.slice(0, 70) : <i>(sem título)</i>}</div>
      {n.url ? (
        <div className="fnode-badge"><Globe size={12} strokeWidth={1.75} /> link externo</div>
      ) : n.news ? (
        <div className="fnode-badge"><Newspaper size={12} strokeWidth={1.75} /> abre notícia</div>
      ) : n.post ? (
        <div className="fnode-badge"><Megaphone size={12} strokeWidth={1.75} /> abre post</div>
      ) : null}
    </Shell>
  );
}

export function CallFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'call') return null;
  return (
    <Shell kind="call" title={speakerName(n.caller)} icon={NODE_ICON.call} accent={NODE_ACCENT.call} isEntry={data.isEntry} selected={selected} hasOut={false}>
      <div className="fnode-option">
        <span>atendeu</span>
        <Handle type="source" position={Position.Right} id="answer" className="opt-handle" />
      </div>
      <div className="fnode-option">
        <span>recusou</span>
        <Handle type="source" position={Position.Right} id="decline" className="opt-handle" />
      </div>
    </Shell>
  );
}

export function CallSceneFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'callScene') return null;
  const steps = Object.keys(n.scene ?? {}).length;
  return (
    <Shell
      kind="call"
      title={speakerName(n.caller)}
      icon={NODE_ICON.callScene}
      accent={NODE_ACCENT.callScene}
      isEntry={data.isEntry}
      selected={selected}
      hasOut={false}
    >
      <div className="fnode-body">
        ligação interativa · {steps} passo(s)
        <br />
        <i>2 cliques para abrir o fluxo</i>
      </div>
      <div className="fnode-option">
        <span>depois da ligação</span>
        <Handle type="source" position={Position.Right} id="after" className="opt-handle" />
      </div>
      <div className="fnode-option">
        <span>recusou</span>
        <Handle type="source" position={Position.Right} id="decline" className="opt-handle" />
      </div>
      <div className="fnode-option">
        <span>não atendeu (tempo)</span>
        <Handle type="source" position={Position.Right} id="timeout" className="opt-handle" />
      </div>
    </Shell>
  );
}

const EVENT_OUTCOME_LABEL: Record<string, string> = {
  ringing: 'só chamando',
  dropped: 'cai',
  declined: 'recusada',
  answered: 'atendida',
};

const EVENT_TITLE: Record<string, string> = {
  playerCall: 'Evento: ligação',
  likePost: 'Evento: curtir post',
  viewNews: 'Evento: abrir notícia',
  followProfile: 'Evento: seguir perfil',
};

export function EventFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'event') return null;
  let body: string;
  switch (n.event) {
    case 'likePost':
      body = n.post ? `curtir ${n.post}` : 'curtir qualquer post';
      break;
    case 'viewNews':
      body = n.news ? `abrir ${n.news}` : 'abrir qualquer notícia';
      break;
    case 'followProfile':
      body = n.account ? `seguir ${speakerName(n.account)}` : 'seguir qualquer perfil';
      break;
    default: {
      const target = n.contact ? speakerName(n.contact) : n.number ? n.number : 'qualquer ligação';
      body = `${target} · ${EVENT_OUTCOME_LABEL[n.outcome ?? 'ringing'] ?? n.outcome}`;
    }
  }
  return (
    <Shell
      kind="event"
      title={EVENT_TITLE[n.event] ?? 'Evento'}
      icon={EVENT_ICON[n.event] ?? NODE_ICON.event}
      accent={NODE_ACCENT.event}
      isEntry={data.isEntry}
      selected={selected}
      hasOut={false}
    >
      <div className="fnode-body">{body}</div>
      {n.effects?.length ? <div className="fnode-badge"><Zap size={12} strokeWidth={1.75} /> {n.effects.length} efeito(s)</div> : null}
      <div className="fnode-option">
        <span>quando o evento acontecer</span>
        <Handle type="source" position={Position.Right} id="onEvent" className="opt-handle" />
      </div>
      <div className="fnode-option">
        <span>continuar agora (vazio = espera)</span>
        <Handle type="source" position={Position.Right} id="next" className="opt-handle" />
      </div>
    </Shell>
  );
}

export function RemoveEventFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'removeEvent') return null;
  return (
    <Shell kind="removeEvent" title="Remover evento" icon={NODE_ICON.removeEvent} accent={NODE_ACCENT.removeEvent} isEntry={data.isEntry} selected={selected}>
      <div className="fnode-body">
        {n.target ? `desarma ${n.target}` : <i>(escolha o evento)</i>}
      </div>
    </Shell>
  );
}

export function ForkFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'fork') return null;
  return (
    <Shell kind="branch" title="Paralelo (ao mesmo tempo)" icon={NODE_ICON.fork} accent={NODE_ACCENT.fork} isEntry={data.isEntry} selected={selected} hasOut={false}>
      {n.outputs.map((o, i) => (
        <div key={i} className="fnode-option">
          <span>{i === 0 ? 'saída 1 (linha principal)' : `saída ${i + 1}`}</span>
          <Handle type="source" position={Position.Right} id={`o${i}`} className="opt-handle" />
        </div>
      ))}
    </Shell>
  );
}

export function EndFlowNode({ data, selected }: NodeProps<FlowNode>) {
  const n = data.story;
  if (n.type !== 'chapterEnd') return null;
  return (
    <Shell kind="end" title="Fim do capítulo" icon={NODE_ICON.chapterEnd} accent={NODE_ACCENT.chapterEnd} isEntry={data.isEntry} selected={selected} hasOut={false}>
      <div className="fnode-body">
        {n.ending ? `→ final: ${n.ending}` : n.next ? `→ ${n.next}` : '→ próximo da ordem'}
      </div>
    </Shell>
  );
}

export const nodeTypes = {
  message: MessageFlowNode,
  choice: ChoiceFlowNode,
  action: ActionFlowNode,
  branch: BranchFlowNode,
  unlockMessage: UnlockMessageFlowNode,
  shareContact: ShareContactFlowNode,
  delay: DelayFlowNode,
  activity: ActivityFlowNode,
  publishNews: PublishNewsFlowNode,
  publishPost: PublishPostFlowNode,
  publishStory: PublishStoryFlowNode,
  offerBlog: OfferBlogFlowNode,
  socialActivity: SocialActivityFlowNode,
  socialFollow: SocialFollowFlowNode,
  bank: BankFlowNode,
  notification: NotificationFlowNode,
  call: CallFlowNode,
  callScene: CallSceneFlowNode,
  event: EventFlowNode,
  removeEvent: RemoveEventFlowNode,
  fork: ForkFlowNode,
  chapterEnd: EndFlowNode,
};
