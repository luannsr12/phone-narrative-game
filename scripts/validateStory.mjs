#!/usr/bin/env node
/**
 * Story integrity checker (no TypeScript / no deps).
 *
 *   node scripts/validateStory.mjs
 *
 * Validates the single story bundle (src/story/story.json — the file the
 * visual editor exports). Fails (exit 1) on dangling references: node
 * `next`/branch/option targets that don't exist, attachments or effects that
 * point at unknown evidence/character/news/ending ids, missing entry nodes,
 * and chapters with no chapterEnd. Run it after replacing story.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'story');
const bundle = JSON.parse(readFileSync(join(root, 'story.json'), 'utf8'));

const { characters, evidence, news, endings, chapters, chapterOrder, meta } = bundle;
const social = bundle.social ?? {};
const socialStories = bundle.socialStories ?? {};
const socialNpcs = bundle.socialNpcs ?? {};
const blog = bundle.blog ?? {};
const ads = bundle.ads ?? {};
const media = bundle.media ?? {};
const pages = bundle.pages ?? {};

const errors = [];
const warn = [];
const err = (m) => errors.push(m);

const charOk = (id) => id === 'player' || id === 'system' || id in characters;
const mediaOk = (id) => id in media;

// Media library: each item needs a url and a valid kind. (category is free-form.)
for (const m of Object.values(media)) {
  if (!m.url) err(`Mídia/${m.id}: sem URL do arquivo`);
  if (!['audio', 'video', 'image'].includes(m.kind))
    err(`Mídia/${m.id}: tipo inválido "${m.kind}" (use audio, video ou image)`);
}

if (!chapters[meta?.startChapter]) err(`meta.startChapter "${meta?.startChapter}" não existe`);
for (const id of chapterOrder) {
  if (!chapters[id]) err(`chapterOrder contém capítulo inexistente "${id}"`);
}
for (const id of Object.keys(chapters)) {
  if (!chapterOrder.includes(id)) warn.push(`capítulo "${id}" não está em chapterOrder`);
}

// 'player' (the protagonist) is a valid Mural author/commenter.
const accountOk = (id) => id === 'player' || id in characters || id in socialNpcs;

// Every comment id that "exists" — authored, or created at runtime by an
// `addComment` effect / `socialActivity` node (so setCommentLikes/replyTo can
// target them).
const allCommentIds = new Set();
for (const p of Object.values(social)) {
  for (const c of p.comments ?? []) if (c.id) allCommentIds.add(c.id);
}
const collectCommentIds = (v) => {
  if (!v || typeof v !== 'object') return;
  if (Array.isArray(v)) return void v.forEach(collectCommentIds);
  if (v.type === 'socialActivity' && v.action === 'comment' && v.commentId) allCommentIds.add(v.commentId);
  if (v.type === 'addComment' && v.commentId) allCommentIds.add(v.commentId);
  for (const k in v) {
    if (k === '_editor') continue;
    collectCommentIds(v[k]);
  }
};
collectCommentIds(chapters);

for (const st of Object.values(socialStories)) {
  if (!accountOk(st.author)) err(`Mural-story/${st.id}: autor inexistente "${st.author}"`);
}

for (const p of Object.values(social)) {
  if (!accountOk(p.author)) err(`Mural/${p.id}: autor inexistente "${p.author}"`);
  // Authored comment ids (a `replyTo` can only target one of these).
  const commentIds = new Set();
  for (const c of p.comments ?? []) {
    if (!accountOk(c.author)) err(`Mural/${p.id}: comentário de autor inexistente "${c.author}"`);
    if (c.id) {
      if (commentIds.has(c.id)) err(`Mural/${p.id}: id de comentário duplicado "${c.id}"`);
      commentIds.add(c.id);
    }
  }
  for (const c of p.comments ?? []) {
    if (c.replyTo && !commentIds.has(c.replyTo))
      err(`Mural/${p.id}: comentário responde a id inexistente "${c.replyTo}"`);
  }
  for (const o of p.commentOptions ?? []) {
    if (!o.id) err(`Mural/${p.id}: opção de comentário sem id`);
    if (!o.text) err(`Mural/${p.id}: opção de comentário "${o.id}" sem texto`);
    if (o.replyTo && !commentIds.has(o.replyTo))
      err(`Mural/${p.id}: opção "${o.id}" responde a comentário inexistente "${o.replyTo}" (defina um id no comentário-alvo)`);
    checkEffects(`Mural/${p.id}/comentário/${o.id ?? '?'}`, o.effects);
  }
}

// Blog (player-published matérias).
for (const b of Object.values(blog)) {
  if (!b.title) err(`Blog/${b.id}: matéria sem título`);
  if (!Array.isArray(b.options) || !b.options.length)
    err(`Blog/${b.id}: matéria sem opções de conteúdo`);
  for (const o of b.options ?? []) {
    if (!o.id) err(`Blog/${b.id}: opção sem id`);
    if (!o.label) err(`Blog/${b.id}: opção "${o.id}" sem rótulo (label)`);
    if (!o.body) err(`Blog/${b.id}: opção "${o.id}" sem texto (body)`);
    checkEffects(`Blog/${b.id}/${o.id ?? '?'}`, o.effects);
  }
  if (b.imageEvidence && !(b.imageEvidence in evidence))
    err(`Blog/${b.id}: imageEvidence -> evidência inexistente "${b.imageEvidence}"`);
  if (b.muralStory) {
    if (!(b.muralStory in socialStories))
      err(`Blog/${b.id}: muralStory -> story inexistente "${b.muralStory}"`);
    else if (socialStories[b.muralStory].author !== 'player')
      warn.push(`Blog ${b.id}: muralStory "${b.muralStory}" não é do autor 'player'`);
  }
}

for (const c of Object.values(characters)) {
  (c.initialChat ?? []).forEach((m, i) => {
    if (!m.text) warn.push(`personagem ${c.id}: mensagem ${i + 1} da conversa inicial sem texto`);
  });
}

const AD_PLACEMENTS = new Set(['social', 'browser', 'both']);
for (const a of Object.values(ads)) {
  if (!a.brand) err(`Anúncio/${a.id}: sem marca (brand)`);
  if (!a.caption) warn.push(`anúncio ${a.id}: sem texto (caption)`);
  if (a.placement && !AD_PLACEMENTS.has(a.placement))
    err(`Anúncio/${a.id}: placement inválido "${a.placement}" (use social, browser ou both)`);
}

// Media references across the registries (images/photos centralised in `media`).
for (const ev of Object.values(evidence)) {
  if (ev.media && !mediaOk(ev.media)) err(`Evidência/${ev.id}: mídia inexistente "${ev.media}"`);
}
for (const n of Object.values(news)) {
  if (n.imageMedia && !mediaOk(n.imageMedia)) err(`Notícia/${n.id}: mídia inexistente "${n.imageMedia}"`);
}
for (const p of Object.values(pages)) {
  if (!p.domain) err(`Página/${p.id}: sem domínio fictício`);
  if (!p.title) warn.push(`Página ${p.id}: sem título`);
  if (p.imageMedia && !mediaOk(p.imageMedia)) err(`Página/${p.id}: mídia inexistente "${p.imageMedia}"`);
}
for (const p of Object.values(social)) {
  if (p.imageMedia && !mediaOk(p.imageMedia)) err(`Mural/${p.id}: mídia inexistente "${p.imageMedia}"`);
}

// Inline message links: {{page:id}} / {{news:id}} / {{post:id}} / {{profile:id}}.
const checkLinkTokens = (where, text) => {
  if (!text || !text.includes('{{')) return;
  const re = /\{\{\s*(page|news|post|profile)\s*:\s*([^{}|]+?)\s*\}\}/gi;
  for (const m of text.matchAll(re)) {
    const kind = m[1].toLowerCase();
    const id = m[2].trim();
    if (kind === 'page' && !(id in pages)) err(`${where}: link -> página inexistente "${id}"`);
    if (kind === 'news' && !(id in news)) err(`${where}: link -> notícia inexistente "${id}"`);
    if (kind === 'post' && !(id in social)) err(`${where}: link -> post inexistente "${id}"`);
    if (kind === 'profile' && !accountOk(id)) err(`${where}: link -> perfil inexistente "${id}"`);
  }
};
for (const st of Object.values(socialStories)) {
  if (st.imageMedia && !mediaOk(st.imageMedia)) err(`Mural-story/${st.id}: mídia inexistente "${st.imageMedia}"`);
}
for (const b of Object.values(blog)) {
  if (b.imageMedia && !mediaOk(b.imageMedia)) err(`Blog/${b.id}: mídia inexistente "${b.imageMedia}"`);
}
for (const c of Object.values(characters)) {
  if (c.avatarMedia && !mediaOk(c.avatarMedia)) err(`Personagem/${c.id}: foto (mídia) inexistente "${c.avatarMedia}"`);
  if (c.social?.avatarMedia && !mediaOk(c.social.avatarMedia))
    err(`Personagem/${c.id}: foto do Mural (mídia) inexistente "${c.social.avatarMedia}"`);
}
if (bundle.playerProfile?.avatarMedia && !mediaOk(bundle.playerProfile.avatarMedia))
  err(`Perfil do jogador: foto (mídia) inexistente "${bundle.playerProfile.avatarMedia}"`);

function checkEffects(where, effects = []) {
  for (const e of effects) {
    if (e.type === 'addEvidence' && !(e.evidence in evidence)) err(`${where}: addEvidence -> evidência inexistente "${e.evidence}"`);
    if (e.type === 'unlockContact' && !(e.character in characters)) err(`${where}: unlockContact -> personagem inexistente "${e.character}"`);
    if (e.type === 'trust' && !(e.character in characters)) err(`${where}: trust -> personagem inexistente "${e.character}"`);
    if (e.type === 'setPresence' && !(e.character in characters)) err(`${where}: setPresence -> personagem inexistente "${e.character}"`);
    if (e.type === 'unlockNews' && !(e.news in news)) err(`${where}: unlockNews -> notícia inexistente "${e.news}"`);
    if (e.type === 'unlockSocial' && !(e.post in social)) err(`${where}: unlockSocial -> post inexistente "${e.post}"`);
    if (e.type === 'unlockStory' && !(e.story in socialStories)) err(`${where}: unlockStory -> story inexistente "${e.story}"`);
    if (e.type === 'offerBlog' && !(e.blog in blog)) err(`${where}: offerBlog -> matéria inexistente "${e.blog}"`);
    if (e.type === 'setEnding' && !(e.ending in endings)) err(`${where}: setEnding -> final inexistente "${e.ending}"`);
    if (e.type === 'lockEndingScore' && !(e.ending in endings)) err(`${where}: lockEndingScore -> final inexistente "${e.ending}"`);
    if (e.type === 'addComment') {
      if (!(e.post in social)) err(`${where}: addComment -> post inexistente "${e.post}"`);
      if (!accountOk(e.author)) err(`${where}: addComment -> autor inexistente "${e.author}"`);
      if (e.replyTo && !allCommentIds.has(e.replyTo)) err(`${where}: addComment -> responde a comentário inexistente "${e.replyTo}"`);
    }
    if (e.type === 'setPostLikes' && !(e.post in social)) err(`${where}: setPostLikes -> post inexistente "${e.post}"`);
    if (e.type === 'setCommentLikes' && !allCommentIds.has(e.comment)) err(`${where}: setCommentLikes -> comentário inexistente "${e.comment}"`);
    if (e.type === 'setFollowStats' && !accountOk(e.account)) err(`${where}: setFollowStats -> perfil inexistente "${e.account}"`);
  }
}

// Every `event` node id (so a removeEvent can only target a real event node).
const eventNodeIds = new Set();
for (const ch of Object.values(chapters)) {
  for (const node of Object.values(ch.nodes ?? {})) {
    if (node.type === 'event') eventNodeIds.add(node.id);
  }
}

for (const ch of Object.values(chapters)) {
  const ids = new Set(Object.keys(ch.nodes ?? {}));
  const ref = (target, where) => {
    if (target == null) return;
    if (!ids.has(target)) err(`${ch.id}/${where}: next "${target}" não existe neste capítulo`);
  };

  if (!ids.has(ch.entry)) err(`${ch.id}: entry "${ch.entry}" não existe`);

  let hasEnd = false;
  for (const node of Object.values(ch.nodes ?? {})) {
    const where = node.id;
    if (node.attachment?.evidence && !(node.attachment.evidence in evidence))
      err(`${ch.id}/${where}: attachment -> evidência inexistente "${node.attachment.evidence}"`);
    if (node.attachment?.media && !mediaOk(node.attachment.media))
      err(`${ch.id}/${where}: attachment -> mídia inexistente "${node.attachment.media}"`);
    if (node.attachment?.kind === 'link' && node.attachment.news && !(node.attachment.news in news))
      err(`${ch.id}/${where}: link -> notícia inexistente "${node.attachment.news}"`);
    if (node.attachment?.kind === 'contact' && !(node.attachment.character in characters))
      err(`${ch.id}/${where}: cartão de contato -> personagem inexistente "${node.attachment.character}"`);

    switch (node.type) {
      case 'message':
        if (!charOk(node.speaker)) err(`${ch.id}/${where}: speaker desconhecido "${node.speaker}"`);
        checkLinkTokens(`${ch.id}/${where}`, node.text);
        if (node.reminder) {
          if (!node.reminder.text) err(`${ch.id}/${where}: reminder sem texto`);
          if (!(Number(node.reminder.afterSec) > 0)) err(`${ch.id}/${where}: reminder sem tempo (afterSec > 0)`);
        }
        checkEffects(`${ch.id}/${where}`, node.effects);
        ref(node.next, where);
        break;
      case 'action':
        checkEffects(`${ch.id}/${where}`, node.effects);
        ref(node.next, where);
        break;
      case 'choice':
        if (!node.options?.length) err(`${ch.id}/${where}: choice sem opções`);
        for (const o of node.options ?? []) {
          checkEffects(`${ch.id}/${where}/${o.id}`, o.effects);
          ref(o.next, `${where}/${o.id}`);
        }
        break;
      case 'branch':
        for (const b of node.branches ?? []) ref(b.next, where);
        ref(node.fallback, where);
        break;
      case 'unlockMessage':
        if (!(node.character in characters))
          err(`${ch.id}/${where}: unlockMessage -> personagem inexistente "${node.character}"`);
        checkEffects(`${ch.id}/${where}`, node.effects);
        ref(node.next, where);
        break;
      case 'shareContact':
        if (!charOk(node.speaker)) err(`${ch.id}/${where}: speaker desconhecido "${node.speaker}"`);
        if (!(node.character in characters))
          err(`${ch.id}/${where}: shareContact -> personagem inexistente "${node.character}"`);
        if (node.character === node.thread)
          warn.push(`${ch.id}/${where}: contato compartilhado na própria conversa dele`);
        checkEffects(`${ch.id}/${where}`, node.effects);
        ref(node.next, where);
        break;
      case 'delay':
        if (!(Number(node.seconds) > 0)) err(`${ch.id}/${where}: delay sem duração (seconds > 0)`);
        ref(node.next, where);
        if (!node.next) warn.push(`${ch.id}/${where}: nó de tempo sem próximo nó (a história trava aqui)`);
        break;
      case 'activity':
        if (!charOk(node.speaker)) err(`${ch.id}/${where}: speaker desconhecido "${node.speaker}"`);
        if (!node.thread) err(`${ch.id}/${where}: atividade sem conversa (thread)`);
        if (!['typing', 'audio', 'video'].includes(node.kind))
          err(`${ch.id}/${where}: atividade com tipo inválido "${node.kind}" (use typing, audio ou video)`);
        if (!(Number(node.seconds) > 0)) err(`${ch.id}/${where}: atividade sem duração (seconds > 0)`);
        ref(node.next, where);
        if (!node.next) warn.push(`${ch.id}/${where}: atividade sem próximo nó (a história trava aqui)`);
        break;
      case 'publishNews':
        if (!(node.news in news)) err(`${ch.id}/${where}: publishNews -> notícia inexistente "${node.news}"`);
        ref(node.next, where);
        break;
      case 'publishPost':
        if (!(node.post in social)) err(`${ch.id}/${where}: publishPost -> post inexistente "${node.post}"`);
        ref(node.next, where);
        break;
      case 'publishStory':
        if (!(node.story in socialStories)) err(`${ch.id}/${where}: publishStory -> story inexistente "${node.story}"`);
        ref(node.next, where);
        break;
      case 'offerBlog':
        if (!(node.blog in blog)) err(`${ch.id}/${where}: offerBlog -> matéria inexistente "${node.blog}"`);
        ref(node.next, where);
        break;
      case 'socialActivity':
        if (node.action === 'comment') {
          if (!(node.post in social)) err(`${ch.id}/${where}: Mural comentário -> post inexistente "${node.post}"`);
          if (!accountOk(node.author ?? '')) err(`${ch.id}/${where}: Mural comentário -> autor inexistente "${node.author}"`);
          if (!node.text) err(`${ch.id}/${where}: Mural comentário sem texto`);
          if (node.replyTo && !allCommentIds.has(node.replyTo)) err(`${ch.id}/${where}: Mural comentário responde a id inexistente "${node.replyTo}"`);
        } else if (node.action === 'postLikes') {
          if (!(node.post in social)) err(`${ch.id}/${where}: Mural curtidas -> post inexistente "${node.post}"`);
        } else if (node.action === 'commentLikes') {
          if (!allCommentIds.has(node.comment)) err(`${ch.id}/${where}: Mural curtidas -> comentário inexistente "${node.comment}"`);
        } else {
          err(`${ch.id}/${where}: Mural atividade com ação inválida "${node.action}"`);
        }
        ref(node.next, where);
        break;
      case 'socialFollow':
        if (!accountOk(node.account)) err(`${ch.id}/${where}: Mural seguidores -> perfil inexistente "${node.account}"`);
        ref(node.next, where);
        break;
      case 'bank':
        if (!node.amount) warn.push(`${ch.id}/${where}: nó de saldo com valor 0 (não faz nada)`);
        ref(node.next, where);
        break;
      case 'notification':
        if (!node.title) err(`${ch.id}/${where}: notification sem título`);
        if (node.app === 'custom' && !node.appName)
          err(`${ch.id}/${where}: notification personalizada sem appName`);
        if (node.durationSec !== undefined && !(Number(node.durationSec) > 0))
          err(`${ch.id}/${where}: notification com durationSec inválido (> 0 ou ausente)`);
        if (node.news && !(node.news in news)) err(`${ch.id}/${where}: notification -> notícia inexistente "${node.news}"`);
        if (node.post && !(node.post in social)) err(`${ch.id}/${where}: notification -> post inexistente "${node.post}"`);
        ref(node.next, where);
        break;
      case 'call':
        if (!charOk(node.caller)) err(`${ch.id}/${where}: caller desconhecido "${node.caller}"`);
        checkEffects(`${ch.id}/${where}/onAnswer`, node.onAnswer?.effects);
        checkEffects(`${ch.id}/${where}/onDecline`, node.onDecline?.effects);
        ref(node.onAnswer?.next, where);
        ref(node.onDecline?.next, where);
        break;
      case 'callScene': {
        if (!charOk(node.caller)) err(`${ch.id}/${where}: caller desconhecido "${node.caller}"`);
        const scene = node.scene && typeof node.scene === 'object' ? node.scene : null;
        if (!scene || !Object.keys(scene).length) {
          err(`${ch.id}/${where}: ligação interativa sem subfluxo (scene)`);
        } else {
          const stepIds = new Set(Object.keys(scene));
          // Sub-flow targets reference STEP ids inside this call, not chapter nodes.
          const sref = (target, sw) => {
            if (target == null) return;
            if (!stepIds.has(target))
              err(`${ch.id}/${where}/${sw}: destino "${target}" não existe no subfluxo da ligação`);
          };
          if (!node.entry || !stepIds.has(node.entry))
            err(`${ch.id}/${where}: entry da ligação "${node.entry}" não existe no subfluxo`);
          let hasHangup = false;
          for (const st of Object.values(scene)) {
            const sw = st.id;
            switch (st.type) {
              case 'audio':
                if (st.speaker !== undefined && !charOk(st.speaker))
                  err(`${ch.id}/${where}/${sw}: locutor desconhecido "${st.speaker}"`);
                if (st.media && !mediaOk(st.media))
                  err(`${ch.id}/${where}/${sw}: áudio -> mídia inexistente "${st.media}"`);
                if (!st.audioUrl && !st.media && !st.text)
                  warn.push(`${ch.id}/${where}/${sw}: áudio da ligação sem mídia/MP3 nem legenda (text)`);
                checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                sref(st.next, sw);
                break;
              case 'choice':
                if (!st.options?.length) err(`${ch.id}/${where}/${sw}: escolha da ligação sem opções`);
                for (const o of st.options ?? []) {
                  if (!o.id) err(`${ch.id}/${where}/${sw}: opção da ligação sem id`);
                  if (!o.text) err(`${ch.id}/${where}/${sw}: opção "${o.id}" sem texto`);
                  checkEffects(`${ch.id}/${where}/${sw}/${o.id ?? '?'}`, o.effects);
                  sref(o.next, `${sw}/${o.id ?? '?'}`);
                }
                // No-reply timeout route (optional; absent = hang up on timeout).
                if (st.timeoutNext) sref(st.timeoutNext, `${sw}/sem-resposta`);
                break;
              case 'action':
                checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                sref(st.next, sw);
                break;
              case 'branch':
                for (const b of st.branches ?? []) sref(b.next, sw);
                sref(st.fallback, sw);
                break;
              case 'delay':
                if (!(Number(st.seconds) > 0))
                  err(`${ch.id}/${where}/${sw}: pausa da ligação sem duração (seconds > 0)`);
                sref(st.next, sw);
                break;
              case 'hangup':
                hasHangup = true;
                checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                break;
              default:
                err(`${ch.id}/${where}/${sw}: passo de ligação desconhecido "${st.type}"`);
            }
          }
          if (!hasHangup)
            warn.push(`${ch.id}/${where}: ligação sem nó "encerrar" — termina ao chegar num beco sem saída`);
        }
        // Outer routes/effects point at chapter nodes (the main line).
        checkEffects(`${ch.id}/${where}/atender`, node.effects);
        for (const route of ['onDecline', 'onTimeout']) {
          const r = node[route];
          if (!r) continue;
          checkEffects(`${ch.id}/${where}/${route}`, r.effects);
          ref(r.next, where);
          if (r.thread && !(r.thread in characters))
            err(`${ch.id}/${where}/${route}: recado de voz em conversa inexistente "${r.thread}"`);
        }
        ref(node.next, where);
        break;
      }
      case 'event':
        if (!['playerCall', 'likePost', 'viewNews', 'followProfile'].includes(node.event))
          err(`${ch.id}/${where}: evento inválido "${node.event}" (suportado: playerCall, likePost, viewNews, followProfile)`);
        if (node.event === 'playerCall') {
          if (node.contact && !(node.contact in characters))
            err(`${ch.id}/${where}: evento -> contato inexistente "${node.contact}"`);
          if (node.outcome && !['ringing', 'dropped', 'declined', 'answered'].includes(node.outcome))
            err(`${ch.id}/${where}: outcome inválido "${node.outcome}" (use ringing, dropped, declined ou answered)`);
          if (node.media && !mediaOk(node.media))
            err(`${ch.id}/${where}: evento -> mídia inexistente "${node.media}"`);
          if (node.outcome === 'answered' && !node.audioUrl && !node.media && !node.text)
            warn.push(`${ch.id}/${where}: chamada atendida sem áudio (mídia/audioUrl) nem texto`);
        }
        if (node.event === 'likePost' && node.post && !(node.post in social))
          err(`${ch.id}/${where}: evento curtir -> post inexistente "${node.post}"`);
        if (node.event === 'viewNews' && node.news && !(node.news in news))
          err(`${ch.id}/${where}: evento abrir notícia -> notícia inexistente "${node.news}"`);
        if (node.event === 'followProfile' && node.account && !accountOk(node.account))
          err(`${ch.id}/${where}: evento seguir -> perfil inexistente "${node.account}"`);
        checkEffects(`${ch.id}/${where}`, node.effects);
        ref(node.next, where);
        ref(node.onEvent, where);
        if (!node.next && !node.onEvent)
          warn.push(`${ch.id}/${where}: nó de evento sem saídas (nem "quando acontecer" nem "continuar agora")`);
        break;
      case 'removeEvent':
        if (!node.target) err(`${ch.id}/${where}: removeEvent sem evento-alvo (target)`);
        else if (!eventNodeIds.has(node.target))
          err(`${ch.id}/${where}: removeEvent -> nó de evento inexistente "${node.target}"`);
        ref(node.next, where);
        if (!node.next) warn.push(`${ch.id}/${where}: removeEvent sem próximo nó (o fluxo trava aqui)`);
        break;
      case 'fork':
        if (!Array.isArray(node.outputs) || node.outputs.length === 0)
          err(`${ch.id}/${where}: nó paralelo (fork) sem saídas`);
        else {
          if (node.outputs.length < 2)
            warn.push(`${ch.id}/${where}: nó paralelo com só uma saída (sem paralelismo real)`);
          for (const out of node.outputs) ref(out, where);
        }
        break;
      case 'chapterEnd':
        hasEnd = true;
        checkEffects(`${ch.id}/${where}`, node.effects);
        if (node.next && !chapters[node.next]) warn.push(`${ch.id}/${where}: próximo capítulo "${node.next}" ainda não existe`);
        if (node.ending && !(node.ending in endings)) err(`${ch.id}/${where}: ending "${node.ending}" inexistente`);
        break;
      default:
        err(`${ch.id}/${where}: tipo de nó desconhecido "${node.type}"`);
    }
  }
  if (!hasEnd) err(`${ch.id}: nenhum nó chapterEnd encontrado`);
}

for (const w of warn) console.log(`aviso  ${w}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} erro(s) de integridade na história:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `\n✓ História íntegra: ${Object.keys(chapters).length} capítulos, ${Object.keys(characters).length} personagens, ${Object.keys(evidence).length} evidências, ${Object.keys(endings).length} finais.`,
);
