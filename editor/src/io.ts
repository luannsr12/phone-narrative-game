import type { Bundle, Effect, StoryNode } from './types';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/** Same integrity rules as the game's scripts/validateStory.mjs. */
export function validateBundle(b: Bundle): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  const charOk = (id: string) => id === 'player' || id === 'system' || id in b.characters;
  const mediaOk = (id: string) => id in (b.media ?? {});

  if (!b.chapters[b.meta.startChapter]) {
    err(`Capítulo inicial "${b.meta.startChapter}" não existe`);
  }
  for (const id of b.chapterOrder) {
    if (!b.chapters[id]) err(`chapterOrder contém capítulo inexistente "${id}"`);
  }
  for (const id of Object.keys(b.chapters)) {
    if (!b.chapterOrder.includes(id)) warnings.push(`Capítulo "${id}" não está na ordem de capítulos`);
  }

  // 'player' (the protagonist) is a valid Mural author/commenter.
  const accountOk = (id: string) => id === 'player' || id in b.characters || id in (b.socialNpcs ?? {});

  // Every comment id that exists — authored or created at runtime by an
  // addComment effect / socialActivity node.
  const allCommentIds = new Set<string>();
  for (const p of Object.values(b.social ?? {})) {
    for (const c of p.comments ?? []) if (c.id) allCommentIds.add(c.id);
  }
  const collectCommentIds = (v: unknown) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) return void v.forEach(collectCommentIds);
    const o = v as Record<string, unknown>;
    if (o.type === 'socialActivity' && o.action === 'comment' && typeof o.commentId === 'string') allCommentIds.add(o.commentId);
    if (o.type === 'addComment' && typeof o.commentId === 'string') allCommentIds.add(o.commentId);
    for (const k in o) {
      if (k === '_editor') continue;
      collectCommentIds(o[k]);
    }
  };
  collectCommentIds(b.chapters);

  const checkEffects = (where: string, effects?: Effect[]) => {
    for (const e of effects ?? []) {
      if (e.type === 'addEvidence' && !(e.evidence in b.evidence)) err(`${where}: evidência inexistente "${e.evidence}"`);
      if (e.type === 'unlockContact' && !(e.character in b.characters)) err(`${where}: personagem inexistente "${e.character}"`);
      if (e.type === 'trust' && !(e.character in b.characters)) err(`${where}: personagem inexistente "${e.character}"`);
      if (e.type === 'setPresence' && !(e.character in b.characters)) err(`${where}: personagem inexistente "${e.character}"`);
      if (e.type === 'unlockNews' && !(e.news in b.news)) err(`${where}: notícia inexistente "${e.news}"`);
      if (e.type === 'unlockSocial' && !(e.post in b.social)) err(`${where}: post inexistente "${e.post}"`);
      if (e.type === 'unlockStory' && !(e.story in b.socialStories)) err(`${where}: story inexistente "${e.story}"`);
      if (e.type === 'offerBlog' && !(e.blog in (b.blog ?? {}))) err(`${where}: matéria de blog inexistente "${e.blog}"`);
      if (e.type === 'setEnding' && !(e.ending in b.endings)) err(`${where}: final inexistente "${e.ending}"`);
      if (e.type === 'lockEndingScore' && !(e.ending in b.endings)) err(`${where}: final inexistente "${e.ending}"`);
      if (e.type === 'addComment') {
        if (!(e.post in b.social)) err(`${where}: addComment -> post inexistente "${e.post}"`);
        if (!accountOk(e.author)) err(`${where}: addComment -> autor inexistente "${e.author}"`);
        if (e.replyTo && !allCommentIds.has(e.replyTo)) err(`${where}: addComment -> responde a comentário inexistente "${e.replyTo}"`);
      }
      if (e.type === 'setPostLikes' && !(e.post in b.social)) err(`${where}: setPostLikes -> post inexistente "${e.post}"`);
      if (e.type === 'setCommentLikes' && !allCommentIds.has(e.comment)) err(`${where}: setCommentLikes -> comentário inexistente "${e.comment}"`);
      if (e.type === 'setFollowStats' && !accountOk(e.account)) err(`${where}: setFollowStats -> perfil inexistente "${e.account}"`);
    }
  };

  // Inline message links: {{page:id}} / {{news:id}} / {{post:id}} / {{profile:id}}.
  const checkLinkTokens = (where: string, text?: string) => {
    if (!text || !text.includes('{{')) return;
    const re = /\{\{\s*(page|news|post|profile)\s*:\s*([^{}|]+?)\s*\}\}/gi;
    for (const m of text.matchAll(re)) {
      const kind = m[1].toLowerCase();
      const id = m[2].trim();
      if (kind === 'page' && !(id in (b.pages ?? {}))) err(`${where}: link aponta página inexistente "${id}"`);
      if (kind === 'news' && !(id in b.news)) err(`${where}: link aponta notícia inexistente "${id}"`);
      if (kind === 'post' && !(id in b.social)) err(`${where}: link aponta post inexistente "${id}"`);
      if (kind === 'profile' && !accountOk(id)) err(`${where}: link aponta perfil inexistente "${id}"`);
    }
  };

  for (const st of Object.values(b.socialStories ?? {})) {
    if (!accountOk(st.author)) err(`Mural-story/${st.id}: autor inexistente "${st.author}"`);
  }

  for (const p of Object.values(b.social ?? {})) {
    if (!accountOk(p.author)) err(`Mural/${p.id}: autor inexistente "${p.author}"`);
    // Authored comment ids (a `replyTo` can only target one of these).
    const commentIds = new Set<string>();
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
  for (const bl of Object.values(b.blog ?? {})) {
    if (!bl.title) err(`Blog/${bl.id}: matéria sem título`);
    if (!Array.isArray(bl.options) || !bl.options.length)
      err(`Blog/${bl.id}: matéria sem opções de conteúdo`);
    for (const o of bl.options ?? []) {
      if (!o.id) err(`Blog/${bl.id}: opção sem id`);
      if (!o.label) err(`Blog/${bl.id}: opção "${o.id}" sem rótulo (label)`);
      if (!o.body) err(`Blog/${bl.id}: opção "${o.id}" sem texto (body)`);
      checkEffects(`Blog/${bl.id}/${o.id ?? '?'}`, o.effects);
    }
    if (bl.muralStory) {
      if (!(bl.muralStory in (b.socialStories ?? {})))
        err(`Blog/${bl.id}: muralStory -> story inexistente "${bl.muralStory}"`);
      else if (b.socialStories[bl.muralStory].author !== 'player')
        warnings.push(`Blog ${bl.id}: muralStory "${bl.muralStory}" não é do autor 'player'`);
    }
  }

  for (const c of Object.values(b.characters)) {
    (c.initialChat ?? []).forEach((m, i) => {
      if (!m.text) warnings.push(`Personagem ${c.id}: mensagem ${i + 1} da conversa inicial sem texto`);
    });
  }

  for (const m of Object.values(b.media ?? {})) {
    if (!m.url) err(`Mídia/${m.id}: sem URL do arquivo`);
    if (!['audio', 'video', 'image'].includes(m.kind))
      err(`Mídia/${m.id}: tipo inválido "${m.kind}" (use áudio, vídeo ou imagem)`);
  }
  // Media references across the registries.
  for (const ev of Object.values(b.evidence)) {
    if (ev.media && !mediaOk(ev.media)) err(`Evidência/${ev.id}: mídia inexistente "${ev.media}"`);
  }
  for (const n of Object.values(b.news)) {
    if (n.imageMedia && !mediaOk(n.imageMedia)) err(`Notícia/${n.id}: mídia inexistente "${n.imageMedia}"`);
  }
  for (const p of Object.values(b.pages ?? {})) {
    if (!p.domain) err(`Página/${p.id}: sem domínio fictício`);
    if (!p.title) warnings.push(`Página ${p.id}: sem título`);
    if (p.imageMedia && !mediaOk(p.imageMedia)) err(`Página/${p.id}: mídia inexistente "${p.imageMedia}"`);
  }
  for (const p of Object.values(b.social ?? {})) {
    if (p.imageMedia && !mediaOk(p.imageMedia)) err(`Mural/${p.id}: mídia inexistente "${p.imageMedia}"`);
  }
  for (const st of Object.values(b.socialStories ?? {})) {
    if (st.imageMedia && !mediaOk(st.imageMedia)) err(`Mural-story/${st.id}: mídia inexistente "${st.imageMedia}"`);
  }
  for (const bl of Object.values(b.blog ?? {})) {
    if (bl.imageMedia && !mediaOk(bl.imageMedia)) err(`Blog/${bl.id}: mídia inexistente "${bl.imageMedia}"`);
  }
  for (const c of Object.values(b.characters)) {
    if (c.avatarMedia && !mediaOk(c.avatarMedia)) err(`Personagem/${c.id}: foto (mídia) inexistente "${c.avatarMedia}"`);
    if (c.social?.avatarMedia && !mediaOk(c.social.avatarMedia))
      err(`Personagem/${c.id}: foto do Mural (mídia) inexistente "${c.social.avatarMedia}"`);
  }
  if (b.playerProfile?.avatarMedia && !mediaOk(b.playerProfile.avatarMedia))
    err(`Perfil do jogador: foto (mídia) inexistente "${b.playerProfile.avatarMedia}"`);

  const adPlacements = new Set(['social', 'browser', 'both']);
  for (const a of Object.values(b.ads ?? {})) {
    if (!a.brand) err(`Anúncio/${a.id}: sem marca (brand)`);
    if (!a.caption) warnings.push(`Anúncio ${a.id}: sem texto (caption)`);
    if (a.placement && !adPlacements.has(a.placement))
      err(`Anúncio/${a.id}: placement inválido "${a.placement}"`);
  }

  for (const ch of Object.values(b.chapters)) {
    const ids = new Set(Object.keys(ch.nodes));
    const ref = (target: string | undefined, where: string) => {
      if (!target) return;
      if (!ids.has(target)) err(`${ch.id}/${where}: destino "${target}" não existe`);
    };

    if (!ch.entry) err(`${ch.id}: capítulo sem nó de entrada definido`);
    else if (!ids.has(ch.entry)) err(`${ch.id}: entrada "${ch.entry}" não existe`);

    let hasEnd = false;
    for (const node of Object.values(ch.nodes) as StoryNode[]) {
      const where = node.id;
      switch (node.type) {
        case 'message':
          if (!charOk(node.speaker)) err(`${ch.id}/${where}: remetente desconhecido "${node.speaker}"`);
          if (!node.thread) err(`${ch.id}/${where}: mensagem sem conversa (thread)`);
          if (node.attachment?.evidence && !(node.attachment.evidence in b.evidence))
            err(`${ch.id}/${where}: anexo aponta evidência inexistente "${node.attachment.evidence}"`);
          if (node.attachment?.media && !mediaOk(node.attachment.media))
            err(`${ch.id}/${where}: anexo aponta mídia inexistente "${node.attachment.media}"`);
          if (node.attachment?.kind === 'link' && node.attachment.news && !(node.attachment.news in b.news))
            err(`${ch.id}/${where}: link aponta notícia inexistente "${node.attachment.news}"`);
          checkLinkTokens(`${ch.id}/${where}`, node.text);
          if (node.reminder) {
            if (!node.reminder.text) err(`${ch.id}/${where}: lembrete sem texto`);
            if (!(node.reminder.afterSec > 0)) err(`${ch.id}/${where}: lembrete sem tempo (segundos > 0)`);
          }
          checkEffects(`${ch.id}/${where}`, node.effects);
          ref(node.next, where);
          if (!node.next) warnings.push(`${ch.id}/${where}: mensagem sem próximo nó (a história trava aqui)`);
          break;
        case 'action':
          checkEffects(`${ch.id}/${where}`, node.effects);
          ref(node.next, where);
          break;
        case 'choice':
          if (!node.thread) err(`${ch.id}/${where}: escolha sem conversa (thread)`);
          if (!node.options.length) err(`${ch.id}/${where}: escolha sem opções`);
          for (const o of node.options) {
            checkEffects(`${ch.id}/${where}/${o.id}`, o.effects);
            if (!o.next) err(`${ch.id}/${where}: opção "${o.text}" sem destino`);
            else ref(o.next, `${where}/${o.id}`);
          }
          break;
        case 'branch':
          for (const [i, br] of node.branches.entries()) {
            if (!br.next) err(`${ch.id}/${where}: ramo ${i + 1} sem destino`);
            else ref(br.next, where);
          }
          // O "senão" (fallback) é OPCIONAL: sem ele, se nenhuma condição bater,
          // esse caminho simplesmente termina. Só validamos o destino se houver.
          ref(node.fallback, where);
          break;
        case 'unlockMessage':
          if (!node.character) err(`${ch.id}/${where}: liberar mensagem sem personagem`);
          else if (!(node.character in b.characters))
            err(`${ch.id}/${where}: personagem inexistente "${node.character}"`);
          checkEffects(`${ch.id}/${where}`, node.effects);
          ref(node.next, where);
          break;
        case 'shareContact':
          if (!charOk(node.speaker)) err(`${ch.id}/${where}: remetente desconhecido "${node.speaker}"`);
          if (!node.thread) err(`${ch.id}/${where}: enviar contato sem conversa (thread)`);
          if (!node.character) err(`${ch.id}/${where}: enviar contato sem contato escolhido`);
          else if (!(node.character in b.characters))
            err(`${ch.id}/${where}: contato inexistente "${node.character}"`);
          if (node.character && node.character === node.thread)
            warnings.push(`${ch.id}/${where}: contato compartilhado na própria conversa dele`);
          checkEffects(`${ch.id}/${where}`, node.effects);
          ref(node.next, where);
          if (!node.next) warnings.push(`${ch.id}/${where}: enviar contato sem próximo nó (a história trava aqui)`);
          break;
        case 'delay':
          if (!(node.seconds > 0)) err(`${ch.id}/${where}: nó de tempo sem duração (segundos > 0)`);
          ref(node.next, where);
          if (!node.next) warnings.push(`${ch.id}/${where}: nó de tempo sem próximo nó (a história trava aqui)`);
          break;
        case 'publishNews':
          if (!node.news) err(`${ch.id}/${where}: publicar notícia sem notícia escolhida`);
          else if (!(node.news in b.news)) err(`${ch.id}/${where}: notícia inexistente "${node.news}"`);
          ref(node.next, where);
          break;
        case 'publishPost':
          if (!node.post) err(`${ch.id}/${where}: post no Mural sem post escolhido`);
          else if (!(node.post in b.social)) err(`${ch.id}/${where}: post inexistente "${node.post}"`);
          ref(node.next, where);
          break;
        case 'publishStory':
          if (!node.story) err(`${ch.id}/${where}: story no Mural sem story escolhido`);
          else if (!(node.story in b.socialStories)) err(`${ch.id}/${where}: story inexistente "${node.story}"`);
          ref(node.next, where);
          break;
        case 'offerBlog':
          if (!node.blog) err(`${ch.id}/${where}: liberar pauta sem matéria escolhida`);
          else if (!(node.blog in (b.blog ?? {}))) err(`${ch.id}/${where}: matéria de blog inexistente "${node.blog}"`);
          ref(node.next, where);
          break;
        case 'socialActivity':
          if (node.action === 'comment') {
            if (!node.post || !(node.post in b.social)) err(`${ch.id}/${where}: Mural comentário -> post inexistente "${node.post ?? ''}"`);
            if (!accountOk(node.author ?? '')) err(`${ch.id}/${where}: Mural comentário -> autor inexistente "${node.author ?? ''}"`);
            if (!node.text) err(`${ch.id}/${where}: Mural comentário sem texto`);
            if (node.replyTo && !allCommentIds.has(node.replyTo)) err(`${ch.id}/${where}: Mural comentário responde a id inexistente "${node.replyTo}"`);
          } else if (node.action === 'postLikes') {
            if (!node.post || !(node.post in b.social)) err(`${ch.id}/${where}: Mural curtidas -> post inexistente "${node.post ?? ''}"`);
          } else if (node.action === 'commentLikes') {
            if (!node.comment || !allCommentIds.has(node.comment)) err(`${ch.id}/${where}: Mural curtidas -> comentário inexistente "${node.comment ?? ''}"`);
          }
          ref(node.next, where);
          break;
        case 'socialFollow':
          if (!accountOk(node.account)) err(`${ch.id}/${where}: Mural seguidores -> perfil inexistente "${node.account}"`);
          ref(node.next, where);
          break;
        case 'bank':
          if (!node.amount) warnings.push(`${ch.id}/${where}: nó de saldo com valor 0 (não faz nada)`);
          ref(node.next, where);
          break;
        case 'notification':
          if (!node.title) err(`${ch.id}/${where}: notificação sem título`);
          if (node.app === 'custom' && !node.appName)
            err(`${ch.id}/${where}: notificação personalizada sem nome do "app"`);
          if (node.durationSec !== undefined && !(node.durationSec > 0))
            err(`${ch.id}/${where}: tempo na tela deve ser maior que 0 (ou vazio para o padrão)`);
          if (node.news && !(node.news in b.news)) err(`${ch.id}/${where}: notificação -> notícia inexistente "${node.news}"`);
          if (node.post && !(node.post in b.social)) err(`${ch.id}/${where}: notificação -> post inexistente "${node.post}"`);
          ref(node.next, where);
          break;
        case 'call':
          if (!charOk(node.caller)) err(`${ch.id}/${where}: quem liga é desconhecido "${node.caller}"`);
          checkEffects(`${ch.id}/${where}/atendeu`, node.onAnswer?.effects);
          checkEffects(`${ch.id}/${where}/recusou`, node.onDecline?.effects);
          ref(node.onAnswer?.next, where);
          ref(node.onDecline?.next, where);
          break;
        case 'callScene': {
          if (!charOk(node.caller)) err(`${ch.id}/${where}: quem liga é desconhecido "${node.caller}"`);
          const scene = node.scene ?? {};
          const stepIds = new Set(Object.keys(scene));
          if (!stepIds.size) {
            err(`${ch.id}/${where}: ligação interativa sem subfluxo (adicione passos)`);
          } else {
            const sref = (target: string | undefined, sw: string) => {
              if (!target) return;
              if (!stepIds.has(target)) err(`${ch.id}/${where}/${sw}: destino "${target}" não existe no subfluxo da ligação`);
            };
            if (!node.entry || !stepIds.has(node.entry))
              err(`${ch.id}/${where}: início da ligação "${node.entry}" não existe no subfluxo`);
            let hasHangup = false;
            for (const st of Object.values(scene)) {
              const sw = st.id;
              switch (st.type) {
                case 'audio':
                  if (st.speaker && !charOk(st.speaker)) err(`${ch.id}/${where}/${sw}: locutor desconhecido "${st.speaker}"`);
                  if (st.media && !mediaOk(st.media)) err(`${ch.id}/${where}/${sw}: áudio -> mídia inexistente "${st.media}"`);
                  if (!st.audioUrl && !st.media && !st.text) warnings.push(`${ch.id}/${where}/${sw}: áudio sem mídia/MP3 nem legenda`);
                  checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                  sref(st.next, sw);
                  break;
                case 'choice':
                  if (!st.options.length) err(`${ch.id}/${where}/${sw}: escolha da ligação sem respostas`);
                  for (const o of st.options) {
                    if (!o.text) err(`${ch.id}/${where}/${sw}: resposta "${o.id}" sem texto`);
                    checkEffects(`${ch.id}/${where}/${sw}/${o.id}`, o.effects);
                    if (!o.next) err(`${ch.id}/${where}/${sw}: resposta "${o.text || o.id}" sem destino`);
                    else sref(o.next, `${sw}/${o.id}`);
                  }
                  if (st.timeoutNext) sref(st.timeoutNext, `${sw}/sem-resposta`);
                  break;
                case 'action':
                  checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                  sref(st.next, sw);
                  break;
                case 'branch':
                  for (const [i, br] of st.branches.entries()) {
                    if (!br.next) err(`${ch.id}/${where}/${sw}: ramo ${i + 1} sem destino`);
                    else sref(br.next, sw);
                  }
                  sref(st.fallback, sw);
                  break;
                case 'delay':
                  if (!(st.seconds > 0)) err(`${ch.id}/${where}/${sw}: pausa da ligação sem duração (segundos > 0)`);
                  sref(st.next, sw);
                  break;
                case 'hangup':
                  hasHangup = true;
                  checkEffects(`${ch.id}/${where}/${sw}`, st.effects);
                  break;
              }
            }
            if (!hasHangup)
              warnings.push(`${ch.id}/${where}: ligação sem passo "Encerrar" — termina ao chegar num beco sem saída`);
          }
          checkEffects(`${ch.id}/${where}/atender`, node.effects);
          checkEffects(`${ch.id}/${where}/recusou`, node.onDecline?.effects);
          checkEffects(`${ch.id}/${where}/tempo`, node.onTimeout?.effects);
          if (node.onDecline?.thread && !(node.onDecline.thread in b.characters))
            err(`${ch.id}/${where}: recado de voz em conversa inexistente "${node.onDecline.thread}"`);
          ref(node.next, where);
          ref(node.onDecline?.next, where);
          ref(node.onTimeout?.next, where);
          break;
        }
        case 'event':
          if (!['playerCall', 'likePost', 'viewNews', 'followProfile'].includes(node.event))
            err(`${ch.id}/${where}: evento inválido "${node.event}"`);
          if (node.event === 'playerCall') {
            if (node.contact && !charOk(node.contact))
              err(`${ch.id}/${where}: contato desconhecido "${node.contact}"`);
            if (node.media && !mediaOk(node.media))
              err(`${ch.id}/${where}: ligação -> mídia inexistente "${node.media}"`);
            if (node.hangUpAfterMs !== undefined && !(node.hangUpAfterMs > 0))
              err(`${ch.id}/${where}: encerrar após o áudio deve ser maior que 0 (ou vazio)`);
          }
          if (node.event === 'likePost' && node.post && !(node.post in b.social))
            err(`${ch.id}/${where}: curtir -> post inexistente "${node.post}"`);
          if (node.event === 'viewNews' && node.news && !(node.news in b.news))
            err(`${ch.id}/${where}: abrir notícia -> notícia inexistente "${node.news}"`);
          if (node.event === 'followProfile' && node.account && !accountOk(node.account))
            err(`${ch.id}/${where}: seguir -> perfil inexistente "${node.account}"`);
          checkEffects(`${ch.id}/${where}`, node.effects);
          ref(node.next, where);
          ref(node.onEvent, where);
          break;
        case 'removeEvent':
          if (!node.target) err(`${ch.id}/${where}: remover evento sem evento escolhido`);
          else if (!ids.has(node.target))
            err(`${ch.id}/${where}: evento "${node.target}" não existe`);
          else if (ch.nodes[node.target].type !== 'event')
            err(`${ch.id}/${where}: alvo "${node.target}" não é um nó de Evento`);
          ref(node.next, where);
          break;
        case 'fork':
          if (!Array.isArray(node.outputs) || node.outputs.length === 0)
            err(`${ch.id}/${where}: nó paralelo sem saídas`);
          else {
            if (node.outputs.length < 2)
              warnings.push(`${ch.id}/${where}: nó paralelo com só uma saída (sem paralelismo)`);
            node.outputs.forEach((out) => ref(out, where));
          }
          break;
        case 'chapterEnd':
          hasEnd = true;
          checkEffects(`${ch.id}/${where}`, node.effects);
          if (node.next && !b.chapters[node.next])
            warnings.push(`${ch.id}/${where}: próximo capítulo "${node.next}" ainda não existe`);
          if (node.ending && !(node.ending in b.endings)) err(`${ch.id}/${where}: final inexistente "${node.ending}"`);
          break;
      }
    }
    if (!hasEnd) warnings.push(`${ch.id}: capítulo sem nó "Fim do capítulo"`);
  }

  return { errors, warnings };
}

/** Download the bundle as story.json — the file dropped into src/story/. */
export function exportBundle(b: Bundle): void {
  const blob = new Blob([JSON.stringify(b, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'story.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importBundleFile(file: File): Promise<Bundle> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Bundle;
        if (!parsed.meta || !parsed.chapters || !parsed.characters) {
          reject(new Error('Arquivo não parece ser um story.json válido.'));
          return;
        }
        parsed._editor = parsed._editor ?? { layouts: {} };
        parsed.social = parsed.social ?? {};
        parsed.socialStories = parsed.socialStories ?? {};
        parsed.socialNpcs = parsed.socialNpcs ?? {};
        parsed.ads = parsed.ads ?? {};
        parsed.blog = parsed.blog ?? {};
        parsed.pages = parsed.pages ?? {};
        resolve(parsed);
      } catch {
        reject(new Error('JSON inválido.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsText(file);
  });
}
