# 📱 Editor de História — Guia Completo

Um guia completo e amigável do **editor visual de história** em [`editor/`](../editor) — a ferramenta estilo Typebot onde você cria e edita o **jogo inteiro como dados**, sem escrever código.

> 🌐 **Idiomas:** 🇧🇷 Português (esta página) · 🇬🇧 [English](EDITOR_GUIDE.md)

**Para quem é.** Roteiristas, designers, tradutores — qualquer pessoa que adicione ou altere conteúdo da história (personagens, capítulos, conversas ramificadas, evidências, notícias, posts, finais). Não precisa programar.

**A regra de ouro.** O editor gera um único arquivo — `story.json` — e o jogo lê tudo dele. O ciclo é sempre: *editar no visual → validar → exportar → colocar no jogo.*

> Primeira vez aqui? Leia a §1 e depois pule para o que precisar.

## Sumário

- [1. Visão geral e fluxo principal](#1-visão-geral-e-fluxo-principal)
- [2. O canvas de capítulos](#2-o-canvas-de-capítulos)
- [3. Tipos de nó](#3-tipos-de-nó)
- [4. Condições e efeitos](#4-condições-e-efeitos)
- [5. Cadastros](#5-cadastros)
- [6. Variáveis, links e emoji nas mensagens](#6-variáveis-links-e-emoji-nas-mensagens)
- [7. Ligações interativas](#7-ligações-interativas)
- [8. Validação e o painel de Inspeção](#8-validação-e-o-painel-de-inspeção)

---

## 1. Visão geral e fluxo principal

### O que é o editor

O **editor de história** é um pequeno aplicativo web de desktop, autônomo, feito em Vite + React, que vive na pasta `editor/` do projeto. Ele *não* faz parte do jogo em si — é uma ferramenta de autoria visual no estilo Typebot que você roda no navegador para construir e editar o **jogo inteiro como dados**.

O jogo e o editor conversam entre si por meio de um único arquivo: o jogo lê toda a sua narrativa de `src/story/story.json`, e a função do editor é produzir exatamente esse arquivo. Tudo o que o jogador chega a ver — capítulos, personagens, evidências, notícias, posts de rede social, um blog, anúncios, finais e todos os fluxos ramificados de mensagens — é escrito aqui e empacotado em um único documento JSON (internamente chamado de **bundle**). Não há banco de dados separado nem código a mexer: você edita visualmente, exporta o JSON e o solta dentro do jogo.

O título na barra superior (ao lado do ícone de rádio) sempre mostra o título do seu projeto com o subtítulo `editor de história`, então você confirma num relance qual história está carregada.

### Iniciando o editor

Em um terminal, rode estes comandos dentro da pasta `editor/`:

```bash
cd editor
npm install      # só na primeira vez — instala as dependências do próprio editor
npm run dev      # inicia o servidor de desenvolvimento do Vite
```

O terminal imprime uma URL local (normalmente `http://localhost:5173`). Abra-a no navegador e o editor carrega. Ele roda inteiramente no seu navegador — nada é enviado para lugar nenhum.

> **Dica:** O `npm install` do editor é separado do do jogo. O editor tem seu próprio `node_modules` dentro de `editor/`.

### A barra superior

A barra superior é a sua central de comando. Da esquerda para a direita:

| Elemento | O que é | O que faz |
| --- | --- | --- |
| Marca (ícone de rádio + título) | O nome do projeto + subtítulo `editor de história` | Mostra o `title` da história carregada no momento |
| Abas (`Capítulos`, `Personagens`, …) | Os onze espaços de trabalho | Alternam o que você está editando (veja a tabela abaixo) |
| `projeto` | Botão de alternância | Abre/fecha o painel de metadados do projeto |
| `⟳ carregar do jogo` | Botão de ação | Importa o `src/story/story.json` ativo que vem com o jogo |
| `importar` | Botão de ação | Carrega um arquivo `story.json` que você escolhe do disco |
| `✓ validar` | Botão de ação | Roda a verificação de integridade e mostra um relatório |
| `⬇ exportar story.json` | Botão de ação em destaque | Valida e, em seguida, baixa o `story.json` |

#### As abas

Cada aba é um registro ou espaço de trabalho dentro do bundle:

| Aba | Edita |
| --- | --- |
| `Capítulos` | Os fluxogramas de capítulo — o coração da história |
| `Personagens` | O elenco |
| `Evidências` | Os arquivos de evidência que o jogador coleta |
| `Mídias` | Recursos reutilizáveis de áudio/vídeo/imagem (URLs) |
| `Notícias` | Matérias de notícia |
| `Páginas Web` | Sites fictícios |
| `Rede Social` | Posts do "Mural", stories e contas de NPCs |
| `Blog` | Artigos de blog publicados pelo jogador |
| `Anúncios` | Anúncios patrocinados (rede social + navegador) |
| `Finais` | Os finais da história |
| `Inspeção` | Uma visão de auditoria/busca por todo o bundle |

### O painel de metadados `projeto`

Clique em `projeto` para abrir/fechar uma faixa horizontal de configurações globais, que valem para a história inteira. As edições aqui são salvas na hora. Os campos são:

- **`Título do jogo`** — o `title` do projeto; também aparece na marca da barra superior.
- **`Versão`** — uma string `version` de texto livre (ex.: `0.1.0`).
- **`Capítulo inicial`** — uma lista suspensa dos seus capítulos; define `startChapter`, onde um novo jogo começa.
- **`Saldo inicial do jogador (R$)`** — o `startingMoney` com que o jogador começa (placeholder `12.90`).
- **`Toque de chamada (URL do ringback)`** — um `ringbackUrl` opcional para o som tocado enquanto uma chamada está chamando. Deixe em branco para usar o padrão.
- **`Nome do blog`** — um rótulo `blogName` opcional para o blog dentro do jogo (placeholder `ex.: Sinal de Ravenwood`).

> **Pegadinha:** `Capítulo inicial` precisa apontar para um capítulo que realmente exista. Se estiver vazio ou apontar para um capítulo excluído, a validação reporta um erro (`Capítulo inicial "…" não existe`).

### Salvamento automático (e a chave `_editor`)

Você **não** salva manualmente. Toda alteração que você faz — em qualquer campo, nó, conexão ou layout — é gravada automaticamente no `localStorage` do seu navegador (sob a chave `sinal-perdido-editor/v1`). Quando você reabre o editor, ele restaura exatamente de onde você parou. Se esse salvamento automático em algum momento sumir ou corromper, o editor silenciosamente começa de uma história limpa e vazia.

O bundle inclui uma chave especial `_editor` que guarda a **posição no canvas (layout) de cada nó** (e o layout aninhado de quaisquer subfluxos de chamada). Isso é puramente para o canvas visual do editor — o jogo ignora a chave `_editor` por completo. Como ela viaja dentro do `story.json` exportado, os layouts dos seus fluxogramas sobrevivem ao ciclo de exportar → importar.

> **Ressalvas importantes sobre o salvamento automático:**
> - O salvamento automático é por navegador e por máquina. Ele **não** é um backup. Limpar os dados do site, trocar de navegador ou usar outro computador significa um editor em branco.
> - A verdadeira fonte da verdade é o `story.json` exportado no repositório do jogo. Exporte com frequência e faça commit dele — trate o salvamento automático do navegador apenas como estado de rascunho.

### O fluxo de ponta a ponta

Este é o ciclo que você vai repetir a cada sessão de edição:

1. **Carregue do jogo.** Clique em `⟳ carregar do jogo`. Isso puxa o `src/story/story.json` ativo, para você partir exatamente do que está publicado. Se o editor já tiver conteúdo, ele pergunta `Substituir o conteúdo atual do editor pela história que está no jogo?` — confirme para sobrescrever. *(Como alternativa, use `importar` para carregar um arquivo `story.json` que você tenha salvo em outro lugar.)*
2. **Edite.** Use as abas para escrever capítulos (fluxogramas de nós), personagens, evidências, mídias, notícias, páginas, rede social, blog, anúncios e finais. Tudo é salvo automaticamente conforme você trabalha.
3. **Valide.** Clique em `✓ validar`. Um modal de relatório abre listando quaisquer erros e avisos (detalhes abaixo). Corrija todos os erros.
4. **Exporte.** Clique em `⬇ exportar story.json`. O editor valida de novo e, **somente se houver zero erros**, baixa um arquivo `story.json`.
5. **Substitua o arquivo do jogo.** Mova/copie o `story.json` baixado por cima de `src/story/story.json` no repositório do jogo.
6. **Rode o validador do repositório.** Na raiz do repositório, rode `npm run validate-story`. Essa é a própria verificação de integridade referencial do jogo e a última barreira antes de a alteração ser considerada confiável.
7. **Recarregue o jogo.** Reinicie/recarregue o app Expo para jogar suas alterações.

> **Dica:** Os passos 3 e 4 se sobrepõem — o `⬇ exportar story.json` roda a validação por você e se recusa a baixar se houver erros. Você ainda pode clicar em `✓ validar` sozinho a qualquer momento para checar o progresso sem exportar.

### Detalhes de importação/exportação e o relatório de validação

**Modal do relatório de validação.** Tanto `✓ validar` quanto `⬇ exportar story.json` abrem a mesma sobreposição de relatório. Clique em qualquer lugar fora da caixa, ou no botão `fechar`, para dispensá-la.

- **Cabeçalho:** Se não houver erros, mostra um **`História válida`** verde. Se houver erros, mostra um **`N erro(s) — exporte só depois de corrigir`** vermelho.
- **Erros** (vermelho, ícone de alerta) **bloqueiam a exportação.** São problemas referenciais graves — por exemplo, um nó apontando para um destino `next` que não existe, um efeito referenciando um personagem/evidência/notícia/final inexistente, um capítulo sem nó de entrada, um item de mídia sem URL, uma mensagem sem thread, e assim por diante.
- **Avisos** (âmbar, ícone de triângulo) **não bloqueiam a exportação.** Eles sinalizam coisas que vale a pena olhar, mas que são legitimamente opcionais — por exemplo, um capítulo não listado na ordem de capítulos, um capítulo sem um nó de `Fim do capítulo`, uma mensagem sem nó seguinte ("a história trava aqui") ou um `chapterEnd` apontando para um próximo capítulo que ainda não existe.
- Se não houver erros nem avisos, o modal simplesmente exibe **`Nenhum problema encontrado.`**

**Exportação.** O `⬇ exportar story.json` gera um download `story.json` formatado e legível, com o nome exatamente `story.json` — o arquivo que você solta em `src/story/`. Se a validação encontrar **qualquer** erro, nada é baixado; corrija os erros listados e tente de novo.

**Importação.** O `importar` abre um seletor de arquivos (apenas JSON). O arquivo precisa conter ao menos `meta`, `chapters` e `characters`, ou você verá `Arquivo não parece ser um story.json válido.`. JSON malformado reporta `JSON inválido.`. Em uma importação bem-sucedida, quaisquer registros opcionais ausentes (rede social, stories, NPCs, anúncios, blog, páginas, mídias e os layouts do `_editor`) são preenchidos automaticamente como vazios, de modo que arquivos mais antigos ou parciais carregam sem problemas.

> **Pegadinha:** O `✓ validar` do editor espelha as regras do `npm run validate-story` do jogo, mas rode também o validador na raiz do repositório (passo 6) como verificação final antes de considerar uma alteração concluída — ele é a autoridade em que o jogo confia.

## 2. O canvas de capítulos

O canvas de capítulos é onde você constrói a história de verdade: um fluxograma de "nós" (blocos) ligados por conexões. Ele fica na aba `Capítulos` — a primeira aba que o editor abre. A aba inteira é dividida em três colunas: a **lista de capítulos** à esquerda, o **canvas de nós** no meio e o `inspetor` (o formulário que edita o nó selecionado) à direita. Esta seção cobre a lista e o canvas; o inspetor é documentado à parte.

### Dica: recolha os painéis laterais para ganhar espaço

As duas colunas laterais podem ser escondidas para dar ao canvas a largura total. Clique nos botões `capítulos` e `inspetor` na barra de ferramentas do canvas (canto superior direito), ou clique em uma faixa recolhida para reabri-la. Recolher é puramente visual — não muda nada na sua história.

### A lista de capítulos (barra lateral esquerda)

A coluna da esquerda lista todos os capítulos na ordem em que são jogados.

- **Criar um capítulo** — clique em `Novo capítulo`. Um capítulo novo e vazio é adicionado ao fim da lista e selecionado na hora. Ele recebe um id gerado automaticamente e um título provisório como `Capítulo 3`; renomeie-o no formulário de dados do capítulo (abaixo).
- **Abrir um capítulo** — clique no título de qualquer capítulo. O canvas central passa a mostrar o fluxograma daquele capítulo. A linha abaixo de cada título mostra quantos nós ele contém (por exemplo, `12 nó(s)`).
- **O capítulo inicial** — exatamente um capítulo carrega um chip `inicial` com um pequeno ícone de play. É o capítulo em que o jogo começa. (O chip reflete `meta.startChapter`; ele é definido em outro lugar, não a partir desta lista.)
- **Reordenar** — cada linha tem pequenas setas para cima/baixo (`mover para cima` / `mover para baixo`). Reordenar muda a ordem de jogo dos capítulos, que é o que o jogo segue quando um capítulo termina sem indicar um próximo alvo específico. A seta para cima fica desabilitada no primeiro capítulo, e a seta para baixo no último.

> **Atenção:** a ordem importa. Quando um nó `Fim do capítulo` não tem um próximo capítulo explícito, o jogo avança para o *próximo capítulo desta lista*. Se um capítulo parece estar levando ao lugar errado, confira a ordem da lista antes de culpar os nós.

### Dados do capítulo

Acima do canvas há uma barra recolhível chamada `dados do capítulo`. Clique nela para expandir o formulário do capítulo aberto:

| Campo | Rótulo no editor | O que faz |
| --- | --- | --- |
| Título | `Título` | O nome do capítulo. Aparece na lista e é usado como rótulo amigável nos resultados de busca. |
| Objetivo | `Objetivo (aparece para o jogador)` | Uma linha curta de meta que o **jogador realmente vê** no jogo. Mantenha-a diegética. |
| Resumo | `Resumo (interstício de capítulo concluído)` | O texto de recapitulação mostrado na tela de "capítulo concluído" entre os capítulos. |

No fim deste formulário fica `excluir capítulo`. Ele pede confirmação e então remove o capítulo **e todos os seus nós** (e quaisquer layouts de ligação aninhados). Não há como desfazer, então tenha certeza.

O **nó de entrada** ("início do capítulo") não é definido aqui — ele é definido no canvas, por nó (veja *Definindo o nó de entrada* abaixo).

### O canvas de nós

A coluna do meio é um fluxograma que dá para arrastar e dar zoom (construído sobre o React Flow).

- **Arrastar (pan)** — arraste uma parte vazia do canvas.
- **Zoom** — use scroll/pinça, ou os `Controls` de zoom no canto inferior esquerdo.
- **Minimapa** — o `MiniMap` no canto inferior direito é uma visão geral; ele é clicável e permite zoom, útil para capítulos grandes.
- **Selecionar um nó** — clique nele (isso o abre no inspetor). Clicar no canvas vazio desseleciona.
- **Mover um nó** — arraste-o. As posições são salvas automaticamente quando você solta o mouse, então o seu layout persiste entre as sessões.

Quando você abre pela primeira vez um capítulo que **não tem posições salvas** (por exemplo, conteúdo recém-importado), o editor organiza os nós automaticamente para você: uma árvore de cima para baixo a partir do nó de entrada, espalhando cada nível seguinte na sua própria linha. É um layout inicial sensato — fique à vontade para arrastar as coisas depois; a partir daí suas posições manuais são mantidas.

#### Adicionando um nó

Clique em `Adicionar nó` na barra de ferramentas. Um menu agrupado se abre:

| Grupo | Rótulo | O que tem dentro (tipos de nó) |
| --- | --- | --- |
| Conversa | `Conversa` | Mensagem, Escolha, Atividade, Enviar contato, Liberar mensagem |
| Fluxo | `Fluxo` | Condição (branch), Paralelo (fork), Tempo (delay), Ação |
| Apps / Mídia | `Apps / Mídia` | Publicar notícia, Post no Mural, Story no Mural, Liberar pauta (Blog), Mural comentário/curtidas, Mural seguidores, Saldo, Notificação |
| Eventos | `Eventos` | Evento, Remover evento, Chamada, Ligação interativa |
| Fim | `Fim` | Fim do capítulo |

Escolha um tipo e o novo bloco aparece **no centro do que você estiver olhando no momento** (com um pequeno deslocamento aleatório, para que adições repetidas não fiquem perfeitamente empilhadas umas sobre as outras). O novo nó é selecionado automaticamente, pronto para editar no inspetor. Pressione `Esc` ou clique fora para fechar o menu sem adicionar.

> **Nota:** o primeiro nó que você adiciona a um capítulo vazio vira automaticamente o nó de entrada.

#### Cores e ícones dos nós

Cada tipo de nó tem a sua própria cor de destaque e ícone, para você ler o fluxograma de relance. O bloco colorido fica no cabeçalho de cada bloco, e o mesmo tom tinge o cabeçalho do inspetor. Alguns que você verá com mais frequência:

- **Mensagem** — verde-azulado (teal), ícone de balão de fala. O cabeçalho mostra o *nome de quem fala*, e o corpo prevê o texto da mensagem. Pequenos selos sinalizam um anexo (clipe de papel) ou efeitos (raio).
- **Escolha** — âmbar, ícone de checklist. Lista as opções de resposta que o jogador pode escolher; uma opção muda/`silent` mostra um ícone de mudo.
- **Condição** (branch) — azul, ícone de bifurcação (git-branch). Roteia por condição.
- **Ação** — roxo, ícone de raio. Aplica efeitos sem mensagem.
- **Tempo** (delay) — laranja, ícone de relógio. Mostra quanto tempo ele espera.
- **Chamada / Ligação interativa** — azul-claro, ícones de telefone.
- **Fim do capítulo** — vermelho, ícone de bandeira. Mostra para onde leva (um final nomeado, um capítulo específico ou "próximo da ordem").

O nó de entrada exibe ainda um selo `INÍCIO` no cabeçalho.

### Conectando nós

Os nós são ligados pelos seus **handles** — os pontinhos na borda de cada nó. Um handle de `target` (a entrada) fica no **topo** de cada bloco. Os handles de `source` (saídas) ficam embaixo (**parte inferior**, para uma única saída simples) ou descem pela **lateral direita** (um por bifurcação/opção rotulada).

**Para conectar:** arraste a partir do handle de saída de um nó e solte sobre o handle de entrada (topo) de outro nó. A ligação é salva instantaneamente no grafo da história. Arraste de novo a partir da mesma saída para um nó diferente e a ligação simplesmente se move (cada saída aponta para exatamente um alvo).

Quais saídas um nó tem depende do seu tipo:

| Nó | Handle(s) de saída | Significado |
| --- | --- | --- |
| Mensagem, Ação, Tempo, Atividade, Enviar contato, Liberar mensagem, Publicar notícia, Post/Story no Mural, Liberar pauta, Mural comentário/seguidores, Saldo, Notificação, Remover evento | um `next` simples (embaixo) | continua para o próximo nó |
| Escolha | **um handle por opção**, à direita | cada resposta do jogador leva a algum lugar |
| Condição (branch) | um por condição (`se condição 1`, `se condição 2`, …) **mais** um fallback `senão (padrão)` | a primeira condição que casar vence; o fallback pega o resto |
| Paralelo (fork) | um por saída (`saída 1 (linha principal)`; depois `saída 2`, …) | todas as saídas disparam ao mesmo tempo |
| Chamada (call) | `atendeu` e `recusou` | bifurca conforme o jogador atende ou não |
| Ligação interativa (callScene) | `depois da ligação`, `recusou` e `não atendeu (tempo)` | três formas de a ligação interativa terminar |
| Evento (event) | `quando o evento acontecer` (= `onEvent`) e `continuar agora (vazio = espera)` (= `next`) | um caminho dispara quando o jogador faz a ação monitorada; o outro continua imediatamente, ou, se deixado vazio, pausa a história até o evento acontecer |
| Fim do capítulo (chapterEnd) | nenhuma | é um nó terminal |

> **Dica:** opções, condições e saídas de paralelo são adicionadas/removidas no **inspetor** (o formulário à direita), não no canvas — então o número de handles do lado direito muda conforme você edita o conteúdo daquele nó.

> **Atenção — ligações interativas têm um fluxograma interno escondido.** Um nó `Ligação interativa` é um fluxograma *dentro* de um fluxograma. O bloco diz `2 cliques para abrir o fluxo`; um duplo-clique mergulha em um sub-canvas separado com os passos da ligação (áudio, escolha, condição, tempo, desligar). Esse editor aninhado funciona igualzinho a este, mas é documentado à parte.

### Definindo o nó de entrada (início do capítulo)

Todo capítulo precisa de um **nó de entrada** — o bloco de onde a história parte quando o capítulo começa. É o bloco marcado com o selo `INÍCIO` e o que o layout automático trata como a raiz da árvore.

Para defini-lo: selecione um nó e, no inspetor, clique em `definir como início`. Se o nó já for a entrada, o inspetor mostra, em vez disso, uma marca `início do capítulo` não clicável. O primeiro nó adicionado a um capítulo vazio vira a entrada automaticamente.

> **Atenção:** se você excluir o nó de entrada atual, o capítulo fica *sem* entrada. Lembre-se de escolher um novo, senão o capítulo não terá um ponto de partida claro (e o layout automático perde a raiz).

### Excluindo nós e ligações

**Excluir uma ligação (uma conexão):** passe o mouse sobre a linha da conexão — um botão `×` aparece no meio dela (tooltip `Remover ligação`). Clique nele para cortar a ligação. Você também pode selecionar uma ligação e pressionar `Delete`. Remover uma ligação apenas limpa aquela saída; os dois nós permanecem.

**Excluir um nó:** selecione-o e pressione `Delete`, ou use o botão de excluir no inspetor. Excluir um nó é seguro — **o editor limpa automaticamente toda referência pendente a ele.** Qualquer `next`, opção de escolha, saída de paralelo, caminho de condição, fallback, atendeu/recusou de chamada, depois/recusou/tempo de ligação interativa, onEvent/next de evento, ou alvo de remover-evento de outro nó que apontava para o nó excluído é limpo de volta para vazio. Você não vai ficar com ligações apontando para o nada. Se o nó era a entrada do capítulo, a entrada é zerada (defina uma nova).

### Busca e ir-para-o-nó

A barra de ferramentas tem uma caixa de busca (`buscar nó por id…`). Digite ou escolha um id de nó e pressione `Enter` (ou clique em `ir`). O canvas vai:

1. Abrir o capítulo onde aquele nó vive (mudando para ele, se estiver em outro lugar),
2. selecionar o nó e
3. **centralizar a câmera** nele suavemente.

A caixa de busca tem autocompletar: ela lista todos os ids de nó de **todos** os capítulos (mostrando o título do capítulo de cada um) e alcança até os **passos dentro de ligações interativas** — escolher um desses mergulha direto no sub-fluxo daquela ligação e seleciona o passo. Isso é especialmente útil para caçar um id de nó apontado por um erro de validação. Se nada casar, você verá um aviso `nó não encontrado`.

> **Dica:** a câmera só recentraliza em uma busca/salto explícito — nunca quando você simplesmente clica ou arrasta um nó. Isso é proposital, para que um nó nunca "fuja" do seu cursor enquanto você o move.

## 3. Tipos de nó

Todo nó que você solta no canvas tem um **tipo**. O tipo decide o que o nó faz quando a história chega até ele e quais campos o inspetor (painel à direita) exibe. Selecione um nó para editá-lo; o cabeçalho do inspetor mostra o rótulo do tipo do nó (em português) e seu `id`. A partir do inspetor você também pode `definir como início` ou `excluir nó`.

Esta seção lista todos os tipos de nó, o que cada um faz e os campos que importam. Os rótulos são as strings reais da interface em português brasileiro do editor.

### Referência rápida

| Nó | Rótulo (UI) | O que faz |
| --- | --- | --- |
| `message` | `Mensagem` | Envia um balão de conversa (texto e/ou um anexo) para uma conversa. |
| `choice` | `Escolha` | Oferece botões de resposta; o jogador escolhe um. **Bloqueia** até ele responder. |
| `action` | `Ação` | Nó invisível: aplica efeitos e segue adiante. |
| `branch` | `Condição` | Escolhe um caminho com base em condições (confiança, flags, evidências…). |
| `unlockMessage` | `Liberar mensagem` | Abre a conversa vazia de um contato para que o *jogador* escreva primeiro. |
| `shareContact` | `Enviar contato` | Um personagem encaminha o cartão de contato de alguém para uma conversa. |
| `delay` | `Tempo` | Pausa em tempo real; o fluxo espera N segundos. **Bloqueia** (espera de relógio). |
| `activity` | `Atividade (digitando/gravando)` | Mostra "digitando…/gravando…" por N segundos, sem enviar nada. |
| `publishNews` | `Publicar notícia` | Publica uma matéria no app de Notícias. |
| `publishPost` | `Post no Mural` | Publica um post no Mural (a rede social do jogo). |
| `publishStory` | `Story no Mural` | Publica um story no Mural (anel no topo do feed). |
| `offerBlog` | `Liberar pauta (Blog)` | Solta um rascunho de pauta no app de Blog do jogador para redigir e publicar. |
| `socialActivity` | `Mural: comentário / curtidas` | Adiciona um comentário ou define a contagem de curtidas de um post/comentário. |
| `socialFollow` | `Mural: seguidores` | Define as contagens de seguidores/seguindo de um perfil. |
| `bank` | `Saldo (R$)` | Credita ou debita o saldo bancário do jogador. |
| `notification` | `Notificação` | Dispara um banner de alerta (com vibração) dentro do jogo. |
| `call` | `Chamada` | Uma ligação simples roteirizada, com desfechos de atender/recusar. **Bloqueia** (precisa de input). |
| `callScene` | `Ligação interativa` | Uma ligação com seu próprio subfluxo (áudios, escolhas de resposta…). **Bloqueia**. |
| `event` | `Evento` | Arma um ouvinte que dispara quando o jogador faz algo (ex.: faz uma ligação). |
| `removeEvent` | `Remover evento` | Desarma um nó `event` definido antes. |
| `fork` | `Paralelo (várias saídas)` | Roda várias trilhas de entrega ao mesmo tempo. |
| `chapterEnd` | `Fim do capítulo` | Encerra o capítulo; pode encaminhar para o próximo capítulo ou para um final. |

**Bloqueia vs avança sozinho (observação rápida):** a maioria dos nós *avança sozinha* — faz seu trabalho e a reprodução segue direto para o próximo nó. Alguns **bloqueiam** e esperam: `choice` e `call`/`callScene` precisam de input do jogador, `delay` espera segundos reais e `chapterEnd` é uma transição de capítulo. Isso é comportamento do jogo, não do editor — você não configura nada; só saiba que encadear uma longa sequência de nós que avançam sozinhos faz tudo "acontecer" numa rajada rápida, enquanto uma escolha ou ligação pausa o jogador ali.

> Dica de ligação: a maioria dos campos é definida no inspetor, mas **as conexões são desenhadas no canvas**. Arraste a partir da alça do lado direito de um nó até o próximo nó. Nós com várias saídas (`choice`, `branch`, `call`, `callScene`, `event`, `fork`) expõem uma alça por saída — conecte cada uma.

---

### `Mensagem` — message

O nó pau-pra-toda-obra: um balão de conversa de alguém, dentro de uma conversa.

- **`Quem envia`** — quem fala. Pode ser um personagem ou os especiais `Jogador` / `Sistema`. Escolha o jogador aqui para que o balão venha *do* jogador sem precisar de uma escolha.
- **`Conversa (thread) onde aparece`** — em qual conversa o balão cai. Escolher quem fala (se não for o jogador) preenche a conversa automaticamente com aquele personagem, mas você pode mudar (ex.: um personagem mandando mensagem dentro de outra conversa).
- **`Texto da mensagem`** — o texto do balão. Digite `{{` para inserir **variáveis** (nome/gênero do jogador) ou **links** (páginas web, notícias, posts/perfis do Mural); há um botão de carinha para emojis. Exemplo: `{{player_name}}` vira o nome escolhido pelo jogador; um link vira um endereço tocável na conversa. Uma mensagem pode ser só texto, só anexo, ou ambos.
- **`Tempo digitando (ms)`** — por quanto tempo o indicador "digitando…" aparece antes do balão surgir (padrão `1400`). Use para ritmar a entrega.
- **`Lembrete se não responder`** — cutucada opcional para quando não há resposta. Se o jogador não responder dentro de `Tempo sem resposta` (segundos; `180` = 3 min), o mesmo remetente solta um balão de acompanhamento (`Mensagem do lembrete`, ex.: "voce ta ai?"). Dispara uma única vez e é cancelado no instante em que o jogador responde. Ótimo para deixar os personagens com cara de impacientes.
- **`Efeitos`** — efeitos opcionais aplicados quando o balão é entregue (definir uma flag, mudar a confiança, adicionar evidência, etc.).

#### Anexo (`Anexo`)

Uma mensagem pode carregar **um** anexo. Clique em `adicionar anexo` para criá-lo e em `remover` para descartá-lo. O seletor `Tipo` define a categoria, e os campos mudam conforme:

- **`Imagem`** (aparece na conversa) — preencha `Link da imagem`. Renderiza embutido, como uma foto enviada.
- **`Áudio`** (player de mensagem de voz) — escolha um arquivo da biblioteca em `Mídia da biblioteca (áudio)` **ou** cole um link MP3 direto. Adicione `Duração (segundos)` e uma `Transcrição` (o botão "transcrever" do jogo a revela, como a transcrição de voz do WhatsApp).
- **`Vídeo`** (abre no jogo) — mesma escolha entre biblioteca de mídia ou link, mais a `Duração`.
- **`Documento`** (abre no jogo) — cole o link do arquivo (PDF etc.) e um `Nome do arquivo` exibido.
- **`Localização`** — uma URL/rótulo opcional.
- **`Link`** (abre no navegador do jogo) — defina um endereço exibido **fictício** (ex.: `gazetaderavenwood.com.br/…`) e um `Título do link` mostrado no balão. Você pode apontá-lo para uma matéria cadastrada (`Abrir notícia cadastrada`) ou deixar isso vazio e escrever o texto de uma página avulsa em `Conteúdo da página avulsa` (linhas em branco separam parágrafos).
- **`Contato`** — observação: para encaminhar um **cartão** de contato dentro do fluxo, prefira o nó dedicado `shareContact` abaixo; a categoria de contato no anexo de mensagem é a forma de baixo nível.

> **A biblioteca de mídia vence:** para áudio/vídeo, quando você escolhe um item da biblioteca *e* cola um link, a URL do item da biblioteca tem prioridade na reprodução.

> **Vincular à evidência:** `Vincular à evidência (vai para Arquivos do Caso)` amarra o anexo a um id de Evidência, de modo que abri-lo arquiva o item no acervo do caso do jogador. Cadastre a evidência na aba **Evidências** primeiro, depois selecione-a aqui.

---

### `Escolha` — choice

A vez do jogador falar. **Bloqueia** até ele escolher uma opção.

- **`Conversa (thread)`** — em qual conversa os chips de resposta aparecem.
- **`Pergunta/contexto`** (opcional) — uma frase curta de enquadramento.
- **`Opções de resposta`** — adicione quantas precisar. Cada opção (`OptionForm`) tem:
  - **`Texto do botão`** — o que o jogador vê.
  - **`Não dizer nada`** — uma opção silenciosa: escolhê-la **não** envia nenhum balão para a conversa.
  - **`Fala enviada`** — o balão de fato enviado; deixe em branco para reaproveitar o texto do botão. (Fica oculto quando "não dizer nada" está ativo.)
  - **`Só aparece se…`** — uma condição que decide se a opção é oferecida (ex.: confiança suficiente, uma flag, evidência em mãos).
  - **`Efeitos`** — efeitos aplicados quando essa opção é escolhida.
  - Cada opção é ligada ao seu próprio próximo nó **pela alça dela no canvas** — o inspetor lembra: "Conecte cada opção ao próximo nó pelo canto direito dela no canvas."

> **Pegadinha de coerência de roteiro:** o texto de uma opção precisa fazer sentido em *todos* os caminhos que podem chegar até ela. Se um fato só é conhecido em algumas rotas, ou restrinja a opção com `Só aparece se…`, ou escreva a frase de forma neutra.

---

### `Ação` — action

Um nó invisível que só aplica efeitos e segue. O inspetor diz claramente: "Nó invisível: só aplica efeitos e segue adiante." Use-o para mudar o estado (flags, confiança, evidências, dinheiro, pontuações de final) sem enviar nada para uma conversa. Só o editor de `Efeitos` e uma única saída.

### `Condição` — branch

Roteia o fluxo verificando condições. Ele "avalia as condições em ordem; a primeira verdadeira define o caminho" — avalia cada `Ramo` de cima para baixo e segue o primeiro cuja condição for verdadeira.

- Adicione linhas de `ramo`, cada uma com sua própria condição (confiança, flag, evidência, gênero, dinheiro…).
- Ligue cada ramo — e a alça opcional de **fallback** (usada quando nenhum ramo combina) — ao seu destino no canvas.

---

### `Liberar mensagem` — unlockMessage

Abre a conversa de um contato para que o **jogador** a inicie. A conversa do personagem aparece (vazia) no app de Mensagens sem que ele tenha escrito nada; o que o jogador acaba "dizendo" é definido pelos **próximos** nós — normalmente uma `choice` naquela conversa, ou uma `message` com o jogador como remetente.

- **`Personagem que o jogador pode chamar`**.
- **`Efeitos`** — opcional.
- **Pegadinha:** se o contato ainda não estiver salvo, ele aparece como um número desconhecido. Combine isso com um efeito `unlockContact`, ou marque o personagem como `já salvo` na aba Personagens.

### `Enviar contato` — shareContact

Um personagem encaminha o **cartão de contato de outra pessoa** para uma conversa — como encaminhar um número no WhatsApp. Na entrega, o contato é salvo na agenda (o nome real aparece) e o jogador fica livre para mandar mensagem; tocar no cartão dentro do jogo abre essa nova conversa.

- **`Quem envia o cartão`** — quem fala.
- **`Conversa (thread)`** — onde o cartão cai.
- **`Contato enviado`** — o personagem dono do cartão.
- **`Texto junto do cartão`** (opcional) e **`Tempo digitando (ms)`**.
- **`Efeitos`** — opcional.

---

### `Tempo` — delay

Uma pausa em tempo real: o fluxo só continua para o nó ligado depois da espera. **`Tempo de espera (segundos)`**. O relógio é de relógio de parede — segue contando mesmo com o jogo fechado, então um delay de 1 hora sobrevive ao app ser encerrado. **Bloqueia** por design.

### `Atividade (digitando/gravando)` — activity

Pura presença: mostra um personagem como `Digitando` / `Gravando áudio` / `Gravando vídeo` numa conversa por um tempo definido, e então continua **sem enviar nada**. Use-o para dar peso a uma pausa antes da próxima mensagem.

- **`Quem aparece na atividade`** — quem fala.
- **`Conversa (thread)`**.
- **`Indicador`** — digitando / gravando áudio / gravando vídeo.
- **`Duração (segundos)`**.

---

### Nós de publicação e sociais

Esses empurram conteúdo para os outros apps do jogo como um passo independente no fluxo (cada um é um atalho sobre o efeito equivalente, então você não precisa anexá-lo a uma mensagem).

- **`Publicar notícia`** (`publishNews`) — publica uma matéria cadastrada no app de Notícias (com uma notificação). `Notícia` (a matéria) + `Atraso até publicar (segundos)` (`0` = imediato).
- **`Post no Mural`** (`publishPost`) — publica um `Post` no Mural e notifica os seguidores do autor.
- **`Story no Mural`** (`publishStory`) — publica um `Story` no Mural (anel no topo do feed).
- **`Liberar pauta (Blog)`** (`offerBlog`) — libera uma `pauta` do Blog: o rascunho aparece em Rascunhos para o jogador escolher um ângulo e publicar. O texto do ângulo e os efeitos ficam na aba **Blog**; aqui você só escolhe a `Pauta (matéria do Blog)`.
- **`Mural: comentário / curtidas`** (`socialActivity`) — o seletor `O que faz` escolhe uma de:
  - **`Comentar em um post`** — escolha o `Post`, `Quem comenta` (personagem/NPC/jogador), `Texto do comentário`, um `Responder a` opcional (alvo da resposta), `Curtidas iniciais` e um `ID do comentário` opcional (para você definir as curtidas dele depois).
  - **`Definir curtidas de um post`** — escolha o `Post` e a contagem de `Curtidas`.
  - **`Definir curtidas de um comentário`** — escolha o `Comentário` e a contagem de `Curtidas`.
  - Nenhuma notificação é enviada; se quiser uma, adicione um nó `notification` separado.
- **`Mural: seguidores`** (`socialFollow`) — define as contagens de `Seguidores` e/ou `Seguindo` de um perfil. Deixe um campo em branco (`manter`) para não alterar aquela contagem.

---

### `Saldo (R$)` — bank

Credita ou debita o saldo bancário do jogador como um passo independente. **`Valor em R$`** (positivo = o jogador recebe dinheiro, com uma notificação do banco; negativo = um débito silencioso) e uma **`Descrição no extrato`** opcional (ex.: "Pix de Eron").

### `Notificação` — notification

Dispara um banner de alerta (banner + vibração) dentro do jogo.

- **`App da notificação`** — qual app do jogo ela simula: `Mensagens`, `Notícias`, `Mural`, `Tulu Bank`, `Blog` ou `Personalizada` (sem app do jogo). Para a personalizada, defina também o `Nome exibido do 'app'`, um `Ícone` (seletor de ícone) e a `Cor de fundo do ícone (hex)`.
- **`Título`** / **`Texto`** e **`Tempo na tela (segundos)`** (padrão ~4s).
- **Alvo do toque (ordem de prioridade):** `Link externo` (URL real — sai do jogo) > `Notícia` (abre no navegador do jogo) > `Post` (Mural) > caso contrário, apenas abre o app escolhido. Preencha o campo do comportamento que você quer.

---

### `Chamada` — call

Uma ligação simples roteirizada. **Bloqueia** enquanto toca.

- **`Quem liga`** e **`Direção`** — `Recebida` (recebida, toca para o jogador) ou `Realizada` (feita).
- **`Conversa para registrar a chamada perdida`** — conversa opcional onde uma chamada perdida é registrada.
- **`Falas da chamada`** (uma por linha) — o roteiro da transcrição.
- **`Mensagem de voz se recusar`** — recado de voz opcional caso a ligação seja recusada.
- **`Efeitos se ATENDER`** / **`Efeitos se RECUSAR`** — efeitos por desfecho. Ligue as alças **"atendeu"** e **"recusou"** aos seus próximos nós no canvas.

### `Ligação interativa` — callScene

Uma ligação de voz mais rica e interativa, que carrega seu **próprio subfluxo privado** (um fluxograma dentro do fluxograma): falas em áudio/MP3, escolhas de resposta durante a ligação, ações, condições e um passo de desligar. Ela **bloqueia** como uma ligação comum. O inspetor desse nó guarda só os ajustes gerais; o subfluxo é editado num canvas aninhado separado, aberto com **`Abrir fluxo da ligação`** — e está documentado em sua própria seção.

Ajustes gerais aqui: `Quem liga`, `Direção`, `Toca por (segundos)` (duração do toque; em branco = até atender/recusar), `Efeitos ao ATENDER`, além de `Se RECUSAR` (recado + conversa + efeitos) e `Se NÃO ATENDER` (timeout — deixe em branco para tratar como recusa, preencha para dar um rumo diferente a uma chamada perdida). No canvas, ligue **"depois da ligação"**, **"recusou"** e **"não atendeu"** aos nós do próximo capítulo.

---

### `Evento` — event

Arma um **ouvinte**: a partir daqui, sempre que o jogador fizer a ação escolhida que case com o alvo e uma condição opcional, o evento dispara. Diferente da maioria dos nós, ele *avança sozinho* — não bloqueia (veja as duas saídas abaixo).

- **`Evento (o que o jogador faz)`** — `Faz uma ligação`, `Curte um post`, `Abre uma notícia` ou `Segue um perfil`. Trocar o tipo limpa os campos do tipo anterior.
- **Alvo do casamento** (varia por evento): para uma ligação, `Quando o jogador ligar para` (um contato) e/ou `…ou número discado` (um número discado) — deixe ambos vazios para *qualquer* ligação; para os outros, escolha o post/notícia/perfil, ou deixe vazio para *qualquer um*.
- **`Condição`** — restrição opcional (confiança, evidência, flag…).
- **Para `playerCall`, `Desfecho`** — como a ligação se comporta na tela: `Só chamando` (toca, sem atender), `Cai` (cai), `Recusada` (recusada) ou `Atendida` (atendida). Para **atendida**, forneça o áudio da ligação (`Mídia da biblioteca` ou um link MP3 direto), uma `Transcrição` e `Encerrar após o áudio (ms)`.
- **`Efeitos quando o evento disparar`** — aplicados quando ele dispara.
- **Duas saídas para ligar:** `Quando o evento acontecer` (o que toca no gatilho) e `Continuar agora`. **Deixe `Continuar agora` vazio para fazer a história ESPERAR aqui** até o evento acontecer; ligue-o para deixar a história seguir enquanto o ouvinte roda em segundo plano. Um ouvinte em segundo plano fica armado até que um `removeEvent` o desarme.

### `Remover evento` — removeEvent

Desarma um nó `event` armado antes para que ele pare de disparar. Avança sozinho. Só **`Evento a remover`** — um seletor dos nós `event` deste capítulo (um alvo perdido/desconhecido continua visível, marcado como `evento não encontrado`, para que não se perca silenciosamente).

---

### `Paralelo (várias saídas)` — fork

Divide o fluxo em várias trilhas de entrega **paralelas** que rodam todas ao mesmo tempo. Use-o para entregar mensagens/efeitos/esperas simultaneamente (ex.: dois personagens digitando ao mesmo tempo).

- **`Saídas`** — a `Saída 1` é a **linha principal**; as demais rodam ao lado dela. Adicione com `adicionar saída` (mínimo de duas; você não pode remover abaixo de duas). Ligue cada saída ao seu próximo nó no canvas.
- **Pegadinha:** as trilhas paralelas são só de entrega. Escolhas, ligações e fins de capítulo pertencem à **linha principal** (saída 1). Uma saída que não leva a lugar nenhum simplesmente termina — tudo bem.

### `Fim do capítulo` — chapterEnd

Encerra o capítulo. **Bloqueia** (é uma transição de capítulo).

- **`Próximo capítulo`** — deixe em branco para continuar com o próximo capítulo na ordem, ou escolha um específico.
- **`Encerrar num final`** (opcional) — encaminha direto para um dos finais autorados.
- **`Efeitos`** — aplicados ao encerrar o capítulo.

> O nó por baixo também suporta um `requirement` de conclusão (um objetivo que o capítulo precisa cumprir antes de fechar) com uma nota só para o designer — escreva isso onde essa interface de gating estiver exposta.

---

### Padrões e limpeza (bom saber)

- **Nós novos já vêm com valores sensatos:** uma `message` nova é falada pelo sistema com `1400` ms de digitação; um `delay` começa em `60` s; uma `activity` em `3` s; um `bank` em `R$ 50`; uma `notification` assume o app de Notícias por padrão; um `fork` começa com duas saídas vazias. Ajuste no inspetor.
- **O primeiro nó que você adiciona vira o início do capítulo** automaticamente; use `definir como início` para mudar isso depois.
- **Excluir um nó limpa automaticamente as ligações para ele** em todos os outros nós (ponteiros de próximo, opções de escolha, alvos de ramo, saídas de fork, desfechos de ligação), então você nunca fica com referências soltas por causa de uma exclusão — mas sempre rode `npm run validate-story` após exportar para pegar quaisquer que você tenha ligado à mão.

## 4. Condições e efeitos

Condições e efeitos são as duas metades da *interatividade* da sua história. Uma **condição** é uma pergunta de sim/não que o jogo faz sobre o save atual ("o jogador já viu esta evidência?", "ele escolheu a resposta gentil?"); um **efeito** é uma mudança que o jogo grava nesse save ("lembrar desta flag", "entregar esta evidência", "dar R$50"). Tudo o que faz uma jogatina ser diferente de outra é construído a partir desses dois ingredientes — não há scripting, só o preenchimento de pequenos formulários no inspetor (o painel à direita quando você clica num nó).

Os dois editores são construtores de formulário recursivos: você escolhe um tipo num dropdown e os campos abaixo mudam de acordo. Você nunca digita código.

### Onde as condições são usadas

Uma condição aparece em qualquer lugar onde a história precisa *perguntar antes de agir*:

- **Opções de escolha — "só aparece se".** Cada chip de resposta num nó `Escolha` pode carregar uma condição. Se ela não for satisfeita, o jogador simplesmente nunca vê aquela opção. Este é o gate mais comum.
- **Nós `Condição` (branch).** Um nó de branch contém uma lista de ramos, cada um sendo `condition` → destino. O fluxo segue pelo **primeiro** ramo cuja condição seja verdadeira, e cai na saída `fallback` se nenhum corresponder. É assim que você divide a história em caminhos diferentes.
- **Gating de evento.** Um nó `Evento` — que fica à escuta de uma ação do jogador, como fazer uma ligação ou curtir um post — tem uma condição opcional que decide se o evento dispara quando acionado.
- **Requisito de fim de capítulo.** Um nó `Fim do capítulo` tem uma condição `requirement`: o capítulo não fecha enquanto essa condição não for verdadeira no jogo, o que permite segurar o jogador até que ele tenha feito algo (por exemplo, coletado uma evidência).
- **Finais, pautas do Blog, opções de comentário do Mural.** Os finais e as escolhas autorais do jogador (ângulos de matéria do Blog, opções de post comentável) também carregam condições.

Para adicionar uma condição onde ela é opcional, abra o dropdown que diz `sem condição (sempre) — + adicionar…`. Removê-la de novo (o botão `limpar`) significa "sempre verdadeiro".

### Todos os tipos de condição

Estas são as entradas do dropdown `+ adicionar…`, com seus rótulos exatos em português:

| Rótulo (no editor) | O que significa | Campos que você preenche |
|---|---|---|
| `Flag está ativa` | Uma flag nomeada foi definida. | o nome da flag |
| `Flag é igual a` | Uma flag tem um valor específico (texto, número, true/false). | nome da flag + valor |
| `Gênero do jogador` | O jogador escolheu este gênero ao começar. | `Masculino` / `Feminino` |
| `Confiança ≥` | A confiança oculta de um personagem é de pelo menos N. | personagem + valor 0–100 |
| `Confiança <` | A confiança de um personagem está abaixo de N. | personagem + valor 0–100 |
| `Tem evidência` | O jogador já possui este arquivo de evidência. | a evidência |
| `Escolheu opção` | O jogador escolheu antes a opção de escolha com este id. | o id da opção (digitado) |
| `Capítulo concluído` | Um dado capítulo foi finalizado. | o capítulo |
| `Saldo no banco ≥ (R$)` | O saldo bancário do jogador é de pelo menos este valor. | valor em R$ |
| `Transferiu ao personagem ≥ (R$)` | O total que o jogador pagou na conta de um personagem é de pelo menos isto. | personagem + valor |
| `Curtiu um post (Mural)` | O jogador curtiu (ou não) um post específico do Mural. | post + toggle Sim/Não |
| `Curtiu um comentário (Mural)` | O jogador curtiu (ou não) um comentário do Mural. | comentário + toggle Sim/Não |
| `Abriu uma notícia` | O jogador abriu (ou não) uma notícia. | notícia + toggle Sim/Não |
| `Segue um perfil (Mural)` | O jogador segue (ou não) um perfil do Mural. | perfil + toggle Sim/Não |
| `TODAS as condições (E)` | Todas as subcondições precisam ser verdadeiras. | uma lista aninhada |
| `QUALQUER condição (OU)` | Pelo menos uma subcondição precisa ser verdadeira. | uma lista aninhada |
| `NÃO (negação)` | Inverte uma única subcondição. | uma condição aninhada |

Notas sobre tipos específicos:

- **`Gênero do jogador`** lê o gênero que o jogador escolheu no início do jogo e é perfeito para trocar pronomes ou adaptar uma fala ("Masculino" = `m`, "Feminino" = `f`).
- **A confiança é oculta do jogador** — essas condições a leem, mas o número nunca é mostrado no jogo. Escolha um personagem e um limiar; lembre-se de que `Confiança ≥` e `Confiança <` são tipos separados, então uma faixa "entre dois valores" precisa dos dois dentro de um `TODAS as condições`.
- **`Escolheu opção`** casa pelo **id** da opção, que você digita à mão (por exemplo, `c_help`). Garanta que ele seja idêntico ao id que você deu à opção de escolha, ou a checagem silenciosamente nunca dispara.
- **`Transferiu ao personagem`** só funciona se aquele personagem tiver uma "Conta bancária" preenchida na aba Personagens — o editor lembra você disso com uma dica.
- **`Curtiu um comentário`** só funciona para comentários que tenham um **id** definido; o editor avisa "Só comentários com 'id' definido podem ser checados aqui."
- **As quatro condições do Mural** usam um toggle `Sim / Não` para que você possa testar tanto "fez" quanto "NÃO fez" — por exemplo, `Não — não segue`.

### Aninhamento: TODAS, QUALQUER, NÃO

Os três últimos tipos permitem combinar condições, e eles aninham livremente:

- `TODAS as condições (E)` — verdadeiro só quando **todas** as subcondições são verdadeiras (E lógico).
- `QUALQUER condição (OU)` — verdadeiro quando **pelo menos uma** é verdadeira (OU lógico).
- `NÃO (negação)` — inverte uma única subcondição.

Dentro de `TODAS`/`QUALQUER` você verá cartões numerados e um dropdown `+ adicionar sub-condição…`; cada subcondição pode, por sua vez, ser outro `TODAS`/`QUALQUER`/`NÃO`, então você consegue expressar coisas como "confiança ≥ 60 **E** (tem a foto **OU** escolheu ajudar)" aninhando caixas. Mantenha o aninhamento raso quando puder — uma árvore muito profunda é difícil de reler depois.

### Onde os efeitos se conectam

Os efeitos sempre vivem numa lista (o inspetor chama essa seção de `Efeitos`). Eles rodam **em ordem, de cima para baixo**, no momento em que o nó é processado. Você pode anexar uma lista de efeitos a quase todo nó e ponto de ramificação:

- **Nós `Mensagem`** — disparam efeitos conforme a mensagem é entregue (o clássico padrão "esta mensagem também te entrega a evidência").
- **Nós `Ação`** — um nó cujo *único* trabalho é rodar efeitos e seguir adiante.
- **Opções de escolha** — os efeitos numa resposta disparam quando o jogador a escolhe (é assim que uma escolha muda a confiança ou define uma flag).
- **`Chamada` / `Ligação interativa`** — efeitos ao atender/recusar, ao conectar a ligação, e dentro de etapas individuais da ligação.
- **Nós `Liberar mensagem` e `Enviar contato`** — carregam efeitos opcionais.
- **`Fim do capítulo`** — efeitos que disparam conforme o capítulo fecha.

Muitos efeitos também têm uma forma de nó independente (por exemplo, `Publicar notícia`, `Saldo (R$)`) que é só um atalho sobre o efeito correspondente — use o que ficar mais organizado no canvas.

### Todos os tipos de efeito

Abra o dropdown `+ adicionar…` na seção `Efeitos` para escolher um:

| Rótulo (no editor) | O que faz |
|---|---|
| `Definir flag` | Armazena uma flag. Deixar "Valor" em branco armazena `true`; você pode armazenar texto, um número ou true/false. |
| `Alterar confiança` | Soma (ou subtrai, com um negativo) confiança de um personagem. |
| `Desbloquear contato` | Salva um personagem na agenda (antes disso ele aparece como um número desconhecido). |
| `Entregar evidência` | Arquiva uma evidência na pasta do caso do jogador. |
| `Publicar notícia` | Libera uma notícia; `Atraso da notificação` opcional em segundos (0 = imediato). |
| `Publicar no Mural (rede social)` | Publica um post pré-autorado do Mural. |
| `Publicar story no Mural` | Libera um slide de story do Mural. |
| `Liberar pauta (Blog)` | Joga uma pauta de rascunho no app do Blog para o jogador redigir e publicar. |
| `Registrar na linha do tempo` | Adiciona um evento à linha do tempo (um título e um "Detalhe" opcional); um id é gerado automaticamente. |
| `Dinheiro (crédito ou cobrança no banco)` | Credita o jogador (R$ positivo) ou cobra dele (R$ negativo), com uma "Descrição no extrato" opcional. |
| `Travar final` | Força um final específico (um override rígido). |
| `Pontuar final` | Empurra a pontuação leve de um final para cima ou para baixo em N pontos. |
| `Presença (online / offline)` | Mostra um contato como `Online` ou `Offline (visto por último)` no cabeçalho do messenger. |
| `Mural: comentar em um post` | Posta um comentário como um personagem/NPC/o jogador; resposta-a opcional, curtidas iniciais e um id de comentário para edição posterior. |
| `Mural: curtidas de um post` | Define a contagem de curtidas exibida de um post. |
| `Mural: curtidas de um comentário` | Define a contagem de curtidas exibida de um comentário (pelo id do comentário). |
| `Mural: seguidores / seguindo` | Define as contagens de seguidores / seguindo de um perfil; deixe um campo em branco para manter o valor atual. |

Notas sobre efeitos específicos:

- **`Travar final` vs. `Pontuar final`.** "Pontuar final" adiciona pontos leves e deixa o final mais pontuado vencer no fim; "Travar final" é uma trava rígida que força um final independentemente da pontuação. Recorra à pontuação na maior parte da história e à trava só num verdadeiro ponto sem volta.
- **`Alterar confiança` e `Pontuar final`** recebem um valor `±` — digite um número negativo para subtrair.
- **`Mural: comentar em um post`** — se você der um id ao comentário (o campo opcional "ID do comentário"), pode depois mirá-lo com `Mural: curtidas de um comentário` ou com uma condição `likedComment`.
- **`Mural: seguidores / seguindo`** — campos vazios são lidos como "manter", então você pode aumentar só os seguidores sem mexer na contagem de seguindo.

### Flags: sem registro, é só digitar um nome

As flags são a memória de uso geral do editor, e são propositalmente leves: **uma flag passa a existir no instante em que você digita o nome dela num efeito `Definir flag` ou numa condição `Flag está ativa`.** Não há uma lista de "flags" separada para registrar ou declarar — dar o nome *é* criá-la.

Para manter os nomes consistentes, o campo de flag (usado nos dois editores) mostra a **lista de flags já usadas em qualquer lugar da história** conforme você digita, para que você reutilize uma existente em vez de inventar sem querer uma quase-duplicata.

Dois detalhes que vale internalizar:

- **A grafia é o contrato.** `falou_com_mae` e `falouComMae` são duas flags diferentes. Um erro de digitação numa condição faz o gate silenciosamente nunca abrir. Escolha o nome na lista de sugestões sempre que a flag já existir.
- **Defina antes de ler.** Uma condição `Flag está ativa` só enxerga flags que algum efeito anterior realmente definiu no caminho que o jogador percorreu. Se uma flag só é definida em *alguns* ramos, gatear uma fala posterior por ela é correto; gatear por uma flag que nunca foi definida em lugar nenhum só torna aquela opção permanentemente invisível.

### Exemplo prático 1 — gatear uma escolha por trás de uma flag

Objetivo: o jogador só pode dizer "Te encontro no píer" depois de ter concordado em ajudar.

1. Na **escolha** anterior em que o jogador concorda em ajudar, abra os `Efeitos` daquela opção e adicione `Definir flag`. Digite o nome da flag `aceitou_ajudar` (deixe "Valor" em branco → vira `true`).
2. Na **escolha** posterior, selecione a opção "te encontro no píer" e abra o dropdown de condição dela (`sem condição (sempre) — + adicionar…`). Escolha `Flag está ativa` e selecione/digite `aceitou_ajudar`.

Agora essa resposta só aparece para jogadores que concordaram antes; todos os demais nunca a veem, então nenhum caminho pode referenciar uma promessa que não foi feita (é exatamente a regra de coerência de roteiro com que o jogo se importa).

### Exemplo prático 2 — ramificar pelo gênero do jogador

Objetivo: um personagem se dirige ao jogador de forma diferente conforme o gênero.

1. Solte um nó `Condição` (branch) no fluxo.
2. No primeiro ramo dele, defina a condição como `Gênero do jogador` → `Feminino`, e aponte o `next` dele para o nó de mensagem que usa a redação no feminino.
3. Defina o `fallback` do branch (a saída pega-tudo) para o nó de mensagem com a redação no masculino.

Como um branch segue pela **primeira** condição que corresponde e, do contrário, pelo fallback, você só precisa autorar o único ramo feminino — todo outro jogador cai na fala no masculino. (Se preferir ser explícito, adicione um segundo ramo com `Gênero do jogador` → `Masculino` em vez de depender do fallback.)

> **Dica:** quando um caminho precisa *tanto* de uma mudança de memória *quanto* de um resultado visível — digamos, baixar a confiança de um personagem *e* marcar uma flag — basta empilhar vários efeitos na mesma lista `Efeitos`; eles rodam de cima para baixo num só momento, então ordene-os do jeito que você gostaria que fossem lidos.

## 5. Cadastros

Os cadastros são as **bibliotecas de conteúdo** do editor — tudo o que a história *referencia* mas que não faz parte do fluxograma em si: o elenco, as evidências, os arquivos de mídia, as notícias, os sites fictícios, a rede social, o blog do jogador, os anúncios e os finais. Você monta esses cadastros uma vez, dá a cada item um **ID** curto, e então os nós dos seus capítulos simplesmente apontam para esses IDs (por exemplo, um nó `message` anexa uma evidência pelo id, um efeito `addEvidence` indica uma, um link no chat abre uma página web pelo id). Manter o conteúdo em cadastros significa que você nunca cola o mesmo link de áudio ou nome de personagem duas vezes — você muda em um lugar só e todos os nós que o referenciam se atualizam.

> Dica — carregue antes de editar: os cadastros que você vê são os que estão atualmente na memória. Se você quer trabalhar no conteúdo do jogo ao vivo, comece cada sessão com `⟳ carregar do jogo` no topo do editor antes de mexer em qualquer coisa, e use `⬇ exportar story.json` quando terminar.

### O layout compartilhado dos cadastros (como cada aba funciona)

Quase toda aba de cadastro usa o mesmo layout de dois painéis, então depois que você aprende um, conhece todos:

- **Painel da esquerda — a lista.** Um botão grande `+ Novo…` / `+ Nova…` no topo cria um item novo com um ID inicial, seguido pela lista dos itens já existentes. Cada linha mostra um **título**, um **subtítulo** opcional e o `id` do item em monoespaçada embaixo. Clique numa linha para selecioná-la.
- **Painel da direita — o formulário.** A edição acontece ao vivo: cada tecla digitada é salva no pacote imediatamente (não há botão de "salvar" por item). No topo fica um botão vermelho `excluir` que remove o item selecionado e limpa o formulário.
- **Estado vazio.** Com nada selecionado, você verá *"Selecione um item à esquerda ou crie um novo."*

Algumas abas adicionam duas comodidades extras:

- **Agrupamento** — os itens são divididos em seções rotuladas (por exemplo, páginas web agrupadas por domínio, publicações agrupadas por autor). O cabeçalho do grupo mostra um selo de contagem. O agrupamento é puramente visual; não muda nada no arquivo exportado.
- **Filtro / busca** — uma barra de ferramentas fixa acima da lista (por exemplo, um seletor de autor mais uma busca por texto). O filtro só restringe o que você *vê*.

> Cuidado — renomear um ID é a única edição perigosa. Todo cadastro expõe um campo de **ID**. Editá-lo é permitido, mas o campo vem rotulado com um aviso por um motivo (para personagens, ele diz literalmente `ID (usado nos nós — cuidado ao mudar)`). Por baixo dos panos, renomear **apaga o id antigo e recria o item sob o novo**. O editor **não** reescreve os nós, efeitos, condições, links, anexos ou campos de autor que ainda apontam para o id antigo — essas referências quebram silenciosamente. Defina os IDs cedo; se precisar renomear um que já está conectado à história, rode `npm run validate-story` depois para pegar toda referência pendente. O id novo também é auto-slugificado (convertido para minúsculas, sem acentos, espaços → `_`, máx. ~24 caracteres), então o que você digita pode acabar ajustado.

---

### Personagens

O elenco. A lista mostra o **nome** de exibição de cada personagem com o **papel** como subtítulo. Esta aba define apenas a **identidade do personagem nos Contatos/chat** — o rosto e a bio dele nas conversas. A presença separada na rede social (o *Mural*) fica em `Rede Social → Perfis` (veja abaixo); o formulário lembra você disso.

Campos:

- **ID** — usado pelos nós; atenção ao aviso de renomeação acima. Personagens novos recebem um id automático como `p1`, `p2`.
- **Nome de exibição (no chat)** — o que aparece no mensageiro. Digitar um nome aqui preenche automaticamente as **iniciais** do avatar na primeira vez (as duas primeiras letras, em maiúsculas) se você ainda não as tiver definido.
- **Nome completo** e **Idade**.
- **Papel na história** — por exemplo, `Irmão de Lia`. Aparece como subtítulo da lista.
- **Capítulo em que surge (referência)** — um seletor de capítulo, apenas uma anotação para você.
- **Número de telefone** — mostrado como o número do contato *antes* de o jogador salvá-lo. Deixe em branco para um número fictício automático.
- **Já salvo na agenda desde o início** — a opção `startsUnlocked`. Marque-a para familiares/amigos que devem vir pré-salvos nos contatos do jogador no novo jogo (caso contrário, o personagem aparece como número desconhecido até que um efeito `unlockContact` o revele).
- **Conta bancária fictícia** — `bankAccount`. Se definida, transferências de dinheiro do jogador para *este número* são tratadas como se chegassem a este personagem.
- **Avatar** — três opções em camadas, verificadas por ordem de prioridade: **Iniciais do avatar** (máx. 2 caracteres) + **Cor do avatar (hex)** como alternativa; **Foto de perfil (mídia)**, que escolhe uma imagem da biblioteca de Mídias; ou **link direto da foto** como último recurso. A escolha de mídia vence o link.
- **Bio pública (sem spoiler)** — exibida no perfil dos Contatos, então mantenha-a livre de spoilers.
- **Estilo de escrita** — uma anotação para os roteiristas sobre a voz desse personagem nas mensagens. Nunca aparece no jogo.

Um **cartão de pré-visualização do perfil** ao vivo na direita (marcado com `pré-visualização`) renderiza o avatar, o nome, o papel e a bio à medida que você digita.

#### Conversa inicial (initialChat) — o chat pré-existente

No fim do formulário do personagem fica o editor `Conversa inicial (já existe ao começar o jogo)`. Use-o para semear algumas mensagens cotidianas **já lidas**, para que um contato salvo/conhecido não comece com uma conversa vazia. Cada mensagem tem:

- **Enviada pelo jogador** — caixa de marcação; desmarcada significa que o personagem a enviou.
- **Texto**.
- **Minutos atrás** — quanto tempo antes do início do jogo a mensagem foi enviada. A dica deixa claro: `1440 = um dia antes`. Mensagens novas recuam automaticamente no tempo para que fiquem em ordem.

> Dica: conversas iniciais funcionam melhor em contatos que *já estão salvos* (`startsUnlocked`), já que a ficção é que você e essa pessoa já se falam.

---

### Evidências

Os arquivos do caso que o jogador coleta. O título da lista é o **título** da evidência; o subtítulo é o tipo em formato legível. Campos:

- **ID**, **Tipo** — um entre `Foto`, `Vídeo`, `Áudio`, `Documento`, `Print`, `Localização`, `Reportagem`.
- **Título** e **Descrição curta**.
- **Quem envia (metadado)** — o personagem de origem, uma anotação de metadado.
- **Ligação com o caso (metadado)** — sua própria anotação sobre por que a evidência importa.
- **Mídia da biblioteca** — a imagem/áudio/vídeo da biblioteca de Mídias, ou um **link direto** como alternativa.
- **Cor da miniatura** (hex) — alternativa quando não há imagem.
- **Conteúdo/transcrição** — texto completo, para documentos ou transcrições de áudio.

> A evidência é *entregue* no jogo por um efeito `addEvidence` (geralmente junto de um anexo de mensagem) — cadastrá-la aqui só a define.

---

### Mídias

A biblioteca central de arquivos reutilizáveis. Cadastre um MP3/vídeo/imagem **uma vez** aqui e depois aponte para ele a partir de mensagens, chamadas, evidências, notícias, blog, publicações do Mural e fotos de perfil — em vez de colar a mesma URL em vários nós. O subtítulo da lista mostra o tipo e, se definida, a categoria. Campos:

- **ID**, **Nome**.
- **Tipo** — `Imagem`, `Áudio (MP3)` ou `Vídeo`.
- **Categoria** — um rótulo organizacional de texto livre (por exemplo, `Lia — fotos`). Ignorado pelo jogo. É um campo de **digitar-para-criar**: categorias existentes aparecem como sugestões de autocompletar, e digitar uma nova a cria na hora.
- **URL do arquivo** — onde o arquivo realmente fica.

---

### Notícias

Matérias para o navegador de notícias do jogo. O título da lista é a **manchete**, o subtítulo é o veículo. Campos:

- **ID**, **Veículo**, **Manchete**, **Data exibida** (texto livre, como `Quinta passada`).
- **Imagem da matéria** — escolha da biblioteca de Mídias ou um **link direto** como alternativa.
- **Texto da matéria** — uma linha em branco separa parágrafos no site do jogo.
- **Visível desde o início do jogo** — a opção `initial`, para notícias gerais/de preenchimento sem relação com o enredo.

> Cuidado: se uma matéria **não** estiver marcada como inicial, o formulário lembra que ela não aparecerá até que um nó a dispare — *"use o efeito 'Publicar notícia' em algum nó"*.

---

### Páginas Web

Sites fictícios que abrem no navegador do jogo quando um personagem joga um link no chat. As páginas são **agrupadas por domínio** (apenas organização). O subtítulo da lista é a URL completa. Campos:

- **ID** — note o rótulo do campo `ID (usado no link {{page:id}})`: a página é referenciada a partir do texto da mensagem pelo menu de link `{{`.
- **Domínio fictício** — também a chave de agrupamento; um campo de digitar-para-reutilizar com domínios existentes como sugestões (por exemplo, `ravenwoodgazette.com.br`).
- **Caminho (opcional)** — acrescentado depois do domínio. O formulário mostra o **Endereço exibido** resultante ao vivo.
- **Título da página**.
- **Imagem de capa** — escolha de Mídia ou link direto.
- **Conteúdo da página** — linhas em branco separam parágrafos.

> O passo a passo está na própria dica do formulário: um personagem envia o link numa mensagem — digite `{{` no texto da mensagem e escolha **Links**.

---

### Rede Social

O *Mural* (a rede social do jogo). Esta aba tem uma barra de ferramentas no topo com quatro submodos, cada um mostrando uma contagem ao vivo:

`Publicações` · `Stories` · `Perfis — Elenco` · `Perfis — NPCs`

Um conceito-chave os une: **um perfil do Mural é separado de uma identidade de chat.** O nome/foto de um personagem nas *Conversas* fica na aba `Personagens`; sua foto/bio/seguidores no *Mural* ficam aqui em `Perfis — Elenco`. O **autor** de qualquer publicação/story/comentário é um id de conta: um id de personagem, um id de NPC ou o especial `player`.

#### Publicações

As publicações do feed. A lista pode ser filtrada por um **seletor de autor** (`Todos os autores`) mais uma **busca por legenda** (`buscar legenda…`); sem filtro de autor, as publicações são agrupadas por autor. Campos da publicação:

- **ID**, **Autor** (seletor de personagem/NPC/player).
- **Imagem da publicação** (escolha de Mídia ou link; em branco = publicação só de texto).
- **Legenda**, **Curtidas (número base)**, **Data exibida**.
- **Visível desde o início do jogo** (`initial`) — caso contrário, a publicação entra no feed por um efeito/nó `publishPost`, que também notifica o jogador.
- **Comentários** — comentários autorados sob a publicação. Cada um tem um **Autor**, um **Texto**, um **ID** opcional (`opcional — necessário p/ ser curtido ou respondido`), uma contagem-base de curtidas, e um seletor **Responde ao comentário** que lista os outros IDs de comentário.
- **Comentários do jogador** — a seção `Comentários do jogador (opcional)`. Estes são **comentários pré-escritos que o jogador pode publicar**, e cada um é uma escolha narrativa: um **Texto** do botão, um **Comentário publicado** opcional (o que de fato é publicado; por padrão, igual ao texto do botão), um alvo de resposta opcional, uma condição `Só aparece se…` e **efeitos**. Uma publicação **sem** opções de comentário do jogador simplesmente não é comentável no jogo.

#### Stories

Slides de story do Mural. Mesmo filtro de autor/busca/agrupamento das publicações. Campos: **ID**, **Autor**, **Imagem de fundo** (Mídia ou link; em branco = gradiente com texto), **Texto sobreposto**, **Duração na tela (segundos)**, **Data exibida** e **Visível desde o início do jogo**. Vários stories do mesmo autor se encadeiam em uma sequência (várias barras de progresso). Stories não iniciais entram pelo efeito `publishStory` (com uma notificação).

#### Perfis — Elenco

Os perfis do Mural do **elenco da história** — o jogador mais a presença *opcional* de cada personagem no Mural. A lista da esquerda sempre começa com uma entrada **Você (o jogador)** (id `@player`), e em seguida o **Elenco** agrupado abaixo.

- **Perfil do jogador** (`PlayerMuralEditor`): a identidade do próprio jogador no Mural — **separada da identidade de chat**. Campos: `@ no Mural` (handle, padrão `voce`), **Nome** de exibição (padrão: o nome escolhido pelo jogador), **Bio** (é aqui que você estabelece *quem o jogador é* na história), avatar **Cor**/**mídia**/**link**, e as contagens de **Seguidores/Seguindo** (em branco = automático).
- **Perfil do personagem no Mural** (`CharacterMuralEditor`): a edição da presença de um membro do elenco no Mural acontece *aqui*, não em `Personagens`, porque um personagem pode ou não estar no Mural. Por padrão, um personagem **não tem perfil próprio** — se ele publicar, aparece com a foto e a bio das *Conversas*. Clique em `personalizar perfil no Mural` para dar a ele um handle, bio, contagens de seguidores e avatar separados (que, se deixados em branco, recaem no avatar do chat). Um botão `remover presença no Mural` o reverte para herdar do chat. Ambos os editores oferecem **O jogador já segue este perfil desde o início**.

Ambos os editores do elenco incluem uma seção de **publicações/stories** que lista o conteúdo de Mural já existente daquela conta, com botões rápidos `nova`/`novo` que **pré-preenchem o autor** e te levam direto ao editor de Publicações/Stories — é isto que liga visivelmente o conteúdo ao seu perfil.

#### Perfis — NPCs

Contas de Mural de preenchimento com **zero relevância para a história** — elas só deixam a rede mais viva. Campos: **ID** (vira o `@usuário`), **Nome do perfil**, avatar **Cor**/**URL**, **Bio**, e **O jogador já segue este perfil desde o início** (padrão: seguido; NPCs não seguidos só aparecem na busca do Mural). Como nos perfis do elenco, cada editor de NPC lista/cria as publicações e stories daquela conta.

> O gerador automático de NPCs: no topo da aba de NPCs, `Gerar perfis automaticamente` busca nomes brasileiros + fotos do `randomuser.me`. Informe uma quantidade (1–50) e clique em `gerar`. Ele cria NPCs com ids únicos, cores de avatar aleatórias e uma bio de clima interiorano — depois você edita as bios e adiciona as publicações deles. Precisa de internet; em caso de falha, mostra *"Falha ao gerar — verifique sua conexão e tente de novo."*

---

### Blog (matérias publicadas pelo jogador)

Matérias que o **jogador** pode publicar pelo app de Blog do jogo. O subtítulo da lista mostra o número de ângulos. Campos:

- **ID** — rotulado `usado no efeito/nó 'Liberar pauta'`: a matéria chega ao jogador como rascunho via o efeito/nó `offerBlog`, e então aparece em *Rascunhos*.
- **Título da matéria**.
- **Imagem da matéria** — uma pequena chave `Link` / `Evidência` mais uma escolha recomendada da **biblioteca de Mídias**. A prioridade no jogo é **mídia > link > evidência** (quando definida como *Evidência*, a mídia da evidência escolhida vira a capa).
- **Data / assinatura exibida** (opcional).
- **Story no Mural ao publicar** — um id opcional de `socialStories` (com autor `player`) que o jogador pode compartilhar após publicar.
- **Ângulos da matéria** — o coração do Blog. Cada ângulo é uma escolha editorial que o jogador faz ao compor: um **Rótulo** (por exemplo, ético vs. sensacionalista), o **Texto publicado** (uma linha em branco separa parágrafos), uma condição `Só aparece se…` e **efeitos**. O texto do ângulo escolhido vira o texto publicado e seus efeitos disparam — útil para pontuar finais.

---

### Anúncios

Anúncios pagos — pura **ambientação**, não conteúdo de história. Eles aparecem sozinhos, sem nó de fluxo: no Mural como uma publicação "Patrocinado" e no navegador como banners. O subtítulo da lista mostra o posicionamento (ou `pausado` se inativo). Campos:

- **ID**, **Marca / anunciante** (vira o nome e o @ do anúncio).
- **Logo da marca (URL)**, **Imagem do anúncio (URL)** (em branco = gradiente).
- **Texto do anúncio**, **Botão (call-to-action)**, **Endereço fictício** (aberto ao tocar).
- **Onde aparece** — `Mural + Navegador`, `Só no Mural` ou `Só no Navegador`.
- **Anúncio ativo** — desmarque para pausar um anúncio sem apagá-lo.

---

### Finais

Os finais possíveis da partida. O título da lista é o **título**, o subtítulo é a tagline. Campos: **ID**, **Título**, **Tagline**, **Resumo** e **Cenas finais** (uma por linha, reproduzidas em sequência). A dica do formulário explica como o jogo *chega* a um final: seja pelo efeito `setEnding` (`Travar final`, decisivo) ou pelo efeito `lockEndingScore` (`Pontuar final`, vence a maior soma total), combinado com um nó `chapterEnd` que nomeia este final.

> Cuidado: cadastrar um final aqui não o torna alcançável — você ainda precisa dos efeitos de travamento/pontuação mais um fim de capítulo que roteie até ele. Rode `npm run validate-story` para confirmar que nada referencia um id de final inexistente.

## 6. Variáveis, links e emoji nas mensagens

Quando você escreve a fala de um personagem em um nó **Mensagem**, o campo `Texto da mensagem` é bem mais do que uma caixa de texto comum. Ele consegue costurar o nome e o gênero do próprio jogador, inserir links clicáveis dentro do jogo e ainda deixar você espalhar emojis pelo texto — tudo sem digitar nenhuma linha de código. Esta seção explica cada recurso que o campo oferece, no que cada um se transforma de fato no jogo e as pequenas armadilhas que valem a pena ficar de olho.

### O menu `{{`

Digite duas chaves abertas — `{{` — em qualquer campo de texto e um pequeno menu suspenso aparece logo abaixo do campo. Esse é o **menu de inserção**. Ele é organizado em categorias, cada uma com seu próprio ícone e título:

- `Personagem`
- `Variáveis`
- `Links` — *somente no texto do nó de mensagem*

Cada linha mostra um pequeno chip de código (uma prévia do endereço ou do token) e um rótulo amigável. Clique em uma linha e o editor escreve o token correspondente na posição do cursor, substituindo o `{{` que você acabou de digitar. O cursor fica logo depois do token inserido, para você seguir digitando.

**Busca enquanto digita / filtro.** Depois de digitar `{{`, você pode continuar digitando algumas letras (por exemplo `{{play`, `{{post`, `{{ela`) e o menu vai filtrando as linhas correspondentes. O filtro considera o texto do token, o chip de código *e* o rótulo legível — então digitar parte do título de uma página ou do nome de um personagem também encontra o link certo. Pressione `Escape` (ou clique fora) para fechar o menu sem inserir nada.

> Dica: você não precisa digitar as chaves de fechamento. Escolher uma opção do menu sempre insere o token completo e bem formado, chaves e tudo.

### Personagem — o nome do jogador

O grupo `Personagem` tem dois tokens. Eles são preenchidos **na hora da entrega, dentro do jogo** — ou seja, o jogador vê o próprio nome, não o token:

| Token | Vira no jogo | Use para |
| --- | --- | --- |
| `{{player_name}}` | O nome completo que o jogador digitou no início (ex.: *Alex Moreno*) | Tratamento formal ou primeira vez |
| `{{player_first_name}}` | Só a primeira palavra desse nome (ex.: *Alex*) | O jeito casual, do dia a dia, como os personagens mandam mensagem |

Se o jogador digitou apenas uma palavra, `{{player_first_name}}` simplesmente equivale ao nome inteiro — não há risco de uma linha sair em branco.

### Variáveis — gênero

O grupo `Variáveis` cuida do gênero escolhido pelo jogador. Assim como os tokens de nome, eles são resolvidos **na hora em que a mensagem é entregue no jogo**, então sempre batem com quem está jogando.

| Token (o que é inserido) | Chip no menu | Vira no jogo |
| --- | --- | --- |
| `{{player_gender}}` | `{{player_gender}}` | o pronome `ele` / `ela` |
| `{{g:masculino\|feminino}}` | `{{g:masc\|fem}}` | a metade masculina antes do `\|`, ou a metade feminina depois dele |

- `{{player_gender}}` é uma troca fixa de pronome: vira `ele` para um jogador masculino e `ela` para uma jogadora feminina.
- `{{g:masculino|feminino}}` é o flexível — **você edita as duas metades**. O que você escrever antes do `|` aparece para um jogador masculino; o que estiver depois aparece para uma jogadora feminina. Por exemplo `{{g:obrigado|obrigada}}`, `{{g:ele mesmo|ela mesma}}` ou `{{g:meu caro|minha cara}}`.

> Atenção: depois de inserir `{{g:masculino|feminino}}` você precisa substituir as palavras de exemplo `masculino` e `feminino` pelas suas duas variantes reais. Se deixar como está, o jogador vai ler literalmente a palavra "masculino" ou "feminino". O rótulo do menu até lembra disso: `Texto por gênero (edite os dois)`.

> Atenção: mantenha exatamente um `|` entre as duas opções e não aninhe outros tokens dentro do par `g:`.

**Tokens desconhecidos ficam visíveis de propósito.** Se você escrever um token errado (digamos `{{player_nme}}`), o jogo não mexe nele e o mostra como está. Isso é proposital: um `{{...}}` saltando aos olhos durante o playtest é justamente como você pega um erro de digitação, em vez de uma linha sair silenciosamente em branco.

### Links — links clicáveis dentro do jogo

O grupo `Links` é especial e aparece **apenas no campo de texto do nó de mensagem**. Escolher um item insere um destes quatro tokens de link:

| Token | Aponta para | Abre no jogo |
| --- | --- | --- |
| `{{page:id}}` | Uma página web fictícia autorada (o registro `Páginas Web`) | o **navegador** do jogo |
| `{{news:id}}` | Uma notícia | o **navegador** do jogo (o site fictício da matéria) |
| `{{post:id}}` | Um post do Mural | o app **Mural** |
| `{{profile:id}}` | Um perfil do Mural — um personagem do caso, um NPC ou o próprio jogador | o app **Mural** |

O que o jogador vê: na bolha de chat, um token de link **não** é impresso como texto cru. Ele aparece como um **link clicável que mostra um endereço fictício**, e tocar nele abre a tela correspondente dentro do jogo. Nunca abre um site real. Alguns exemplos concretos dos endereços que o jogo mostra:

- um link de notícia aparece como `gazetaderavenwood.com.br/noticias/jovem-desaparecida`
- um link de post ou perfil aparece como `mural.app/@handle` (o handle do autor no Mural)
- um link de página aparece como seu próprio domínio mais o caminho (veja Páginas Web abaixo)

Como são links e não variáveis de texto, eles são deliberadamente deixados intactos pela substituição de nome/gênero — chegam intocados até o renderizador do chat, que é a única coisa que os transforma em links clicáveis. (É também por isso que a categoria Links não aparece em campos de texto comuns: um link só faz algo dentro de uma bolha de mensagem.)

> Dica: o chip de código do menu mostra uma prévia do endereço ou handle que o link vai exibir — por exemplo `notícia`, `post @lia`, `perfil @você` — então dá para confirmar de relance que você pegou o certo.

A lista de `{{profile:...}}` sempre inclui um `Perfil do jogador (Mural)` (o perfil do próprio jogador no Mural) no topo — inserido como `{{profile:player}}` — seguido por todos os personagens do caso e todos os NPCs do Mural.

### As Páginas Web alimentam o menu Links

O menu `Links` não inventa as opções — ele é montado ao vivo a partir dos seus registros. Especificamente, é o registro `Páginas Web` que preenche as entradas `{{page:...}}`:

- Cada página que você criou aparece como uma linha no grupo `Links`.
- O **chip de código da linha é o endereço fictício da página**, montado a partir do `domain` mais o `path` opcional (por exemplo `arquivoscorvo.org/dossie/lia`). Se a página não tiver caminho, mostra só o domínio.
- O **rótulo da linha é o título da página** (caindo de volta para o id da página caso ela não tenha título).

A mesma ligação ao vivo vale para os outros três tipos: as notícias alimentam `{{news:...}}`, os posts do Mural alimentam `{{post:...}}` e os personagens + NPCs + o jogador alimentam `{{profile:...}}`. Então o fluxo prático é: **crie primeiro a página / notícia / post / perfil no seu registro e depois volte para a mensagem e escolha-o no menu `{{`.** Um link que você ainda não autorou simplesmente não vai estar na lista.

> Sobre "agrupamento por domínio": o endereço que você vê no menu e no jogo é agrupado sob o domínio da própria página — páginas que compartilham um `domain` parecem viver no mesmo site fictício (por exemplo, várias páginas `arquivoscorvo.org/...`). Defina um `domain` consistente entre páginas relacionadas para que os endereços do navegador no jogo soem como um único site coerente.

> Atenção: se você renomear ou apagar uma página/post/perfil depois de referenciá-la, o token continua segurando o id antigo. Escolha de novo no menu (ou corrija o id) para o link resolver — e rode `npm run validate-story` para pegar referências quebradas antes que cheguem ao app.

### O botão de emoji

O campo de mensagem tem um pequeno botão de carinha sorridente (`Inserir emoji`) no canto. Clique nele para abrir um seletor de emoji; clique em qualquer emoji e ele é inserido **na posição do seu cursor** (exatamente onde você estava digitando), e o seletor fecha. O seletor tem sua própria caixa de busca, então você pode digitar para encontrar um emoji.

- O emoji é inserido exatamente como um caractere digitado — vira parte do texto da linha e aparece na bolha de chat como está.
- Emoji dentro do *texto da mensagem* de um personagem faz parte da voz dele nas mensagens e é totalmente aceitável. (A regra de "nada de emoji no chrome" é sobre a UI do app, não sobre as palavras que um personagem digita.)

> Dica: o seletor lembra onde estava o seu cursor mesmo enquanto está aberto, então o emoji sempre cai onde você parou — não precisa clicar de novo no texto antes.

### Onde cada recurso está disponível

Nem todo campo oferece tudo:

- **Campo `Texto da mensagem` do nó de mensagem** — o kit completo: `Personagem` + `Variáveis` + `Links` no menu `{{`, **mais** o botão de emoji. Este é o único lugar onde a categoria `Links` e o botão de emoji aparecem.
- **Outros campos de texto comuns** (texto do botão de escolha, a fala opcional, prompts, recados de voz, transcrições de chamada, texto de lembrete, etc.) — ainda oferecem o menu `{{` com `Personagem` e `Variáveis`, então `{{player_name}}`, `{{player_first_name}}`, `{{player_gender}}` e `{{g:...|...}}` também funcionam nessas linhas. Eles **não** oferecem a categoria `Links` nem o botão de emoji.

> Por que a divisão: as variáveis de nome e gênero fazem sentido em qualquer lugar onde o jogador lê um texto, então estão em todo lugar. Links só fazem algo como elemento clicável dentro de uma bolha de chat, então ficam reservados ao texto da mensagem — colocar um token `{{page:...}}` em, digamos, um botão de escolha apenas apareceria como texto literal e nunca viraria um link.

## 7. Ligações interativas

O nó `Ligação interativa` — tipo `callScene` nos dados — é a ferramenta narrativa mais poderosa do editor para cenas de voz. Diferente de uma troca de mensagens comum, ela *bloqueia* a história principal: o telefone toca, o jogador atende (ou não) e então um segundo fluxograma inteiro se desenrola **dentro** da ligação — falas em áudio, opções de resposta, ramificações, pausas — até que alguém desligue e a história siga em frente. Pense nisso como "um fluxograma dentro do fluxograma".

Esta seção cobre as duas camadas que você cria: o **nó externo da ligação** (quem liga, a chamada tocando, o que acontece ao atender/recusar/esgotar o tempo) e o **subfluxo interno** (a própria cena falada).

### 7.1 Qual nó de ligação usar?

Existem dois nós de ligação. Escolha com intenção.

| Nó | Rótulo no menu de adicionar | Use quando… |
| --- | --- | --- |
| `call` | `Chamada` | Você quer uma ligação *simples* e roteirizada: uma lista fixa de falas (uma por linha de texto), um recado de voz opcional caso recusada, e apenas duas saídas — `atendeu` / `recusou`. Sem escolhas do jogador durante a ligação, sem ramificações. |
| `callScene` | `Ligação interativa` | Você quer uma ligação *interativa*: o jogador escolhe respostas no meio da chamada, MP3s tocam, efeitos disparam em momentos específicos, a ligação pode ramificar conforme condições, e uma ligação perdida pode seguir um rumo diferente de uma recusada. |

Para a `Chamada` simples, você preenche `Falas da chamada (uma por linha)` direto no inspetor e liga `atendeu`/`recusou` no canvas — é só isso. Tudo abaixo trata da `Ligação interativa`, mais rica.

> **Dica:** Se você só precisa de "o personagem liga, diz algumas falas, o jogador não tem como responder de verdade", a `Chamada` simples é mais rápida e dá menos manutenção. Recorra à ligação interativa apenas quando o jogador realmente *responde* ou quando a chamada precisa ramificar.

### 7.2 O nó externo da ligação — configurações gerais

Adicione um nó `Ligação interativa` a um capítulo, selecione-o, e o inspetor mostra sua **configuração geral** (a cena falada fica em outro lugar — veja 7.3). Campos:

- **`Quem liga`** — o personagem na linha. Obrigatório para o nome/avatar na tela.
- **`Direção`** — escolha:
  - `Recebida (toca para o jogador)` — o padrão.
  - `Realizada` — o jogador é quem faz a ligação.
- **`Toca por (segundos — vazio = até atender/recusar)`** — por quanto tempo o telefone toca antes de se tornar automaticamente uma chamada perdida. Deixe **vazio** (ou `0`) para tocar até o jogador agir; defina por exemplo `20` para deixar a ligação "esgotar o tempo" e virar uma chamada perdida.
- **`Efeitos ao ATENDER (conectar)`** — efeitos que disparam no momento em que o jogador aceita e a chamada conecta (por exemplo, aumentar confiança, marcar uma flag). Eles rodam *antes* do subfluxo tocar.

Depois, dois blocos de desfecho para quando o jogador **não** aceita a ligação:

- **`Se RECUSAR`** — o jogador toca em recusar. Você pode criar:
  - `Recado de voz (opcional)` — texto deixado em uma conversa como recado de chamada perdida.
  - `Conversa do recado (vazio = a de quem ligou)` — em qual conversa o recado aparece; por padrão, a própria conversa de quem ligou.
  - `Efeitos se RECUSAR`.
- **`Se NÃO ATENDER (tempo esgotou)`** — dispara só quando o `ringSeconds` se esgota sem nenhuma ação. Tem seu próprio `Recado de voz` e `Efeitos se NÃO ATENDER`. **Deixe este bloco vazio para tratar o tempo esgotado exatamente como uma recusa**; preencha-o só quando quiser que uma chamada perdida siga um rumo diferente (outro recado, outros efeitos, outro nó seguinte).

> **Pegadinha:** O bloco de tempo esgotado só importa se você definir um valor em `Toca por`. Sem limite de toque, a ligação espera para sempre e `Se NÃO ATENDER` nunca é acionado.

### 7.3 Entrando no subfluxo da própria ligação

No topo do inspetor do `callScene` há um grande botão de destaque:

> `Abrir fluxo da ligação (N passo(s))` — **abre o fluxo da ligação (N passo(s))**

Clique nele para entrar no **sub-canvas aninhado** — um segundo fluxograma que pertence apenas a esta ligação. É aqui que você roteiriza o que de fato é *dito e escolhido* depois que a chamada conecta. O contador do botão mostra quantos passos a cena já tem.

Uma vez dentro, surge uma barra de navegação (breadcrumb) com **`Ligação de <quem liga> · subfluxo`**. Para voltar ao capítulo, clique em **`voltar ao capítulo`** à esquerda dessa barra. (Os botões `capítulos` e `inspetor` na mesma barra apenas mostram/escondem os painéis laterais — eles **não** saem do subfluxo.)

O sub-canvas se comporta exatamente como o canvas do capítulo: arraste os passos, conecte-os arrastando a partir da alça na borda direita de um passo, apague uma conexão selecionando-a e pressionando `Delete`, e use os controles de minimapa/zoom. As posições dos passos são salvas separadamente do layout do capítulo, então o fluxo aninhado mantém sua própria organização arrumadinha.

### 7.4 Os tipos de PASSO da ligação

Dentro do subfluxo você não adiciona *nós* de história — você adiciona **passos** de ligação via **`Adicionar passo`**, agrupados em **`Passos da ligação`**. São seis, cada um editável no inspetor de passo à direita:

| Passo | Rótulo (`CALL_STEP_LABEL`) | O que faz |
| --- | --- | --- |
| `audio` | `Áudio / MP3` | Uma fala. Toca um MP3 (opcional) e mostra uma legenda, depois avança sozinho. |
| `choice` | `Escolha de resposta` | Opções de resposta no meio da chamada para o jogador escolher, com tempo esgotado opcional caso não responda. |
| `action` | `Ação (efeitos)` | Aplica efeitos no meio da ligação e segue em frente. Invisível para o jogador. |
| `branch` | `Condição` | Encaminha a ligação pela primeira condição que bater. |
| `delay` | `Pausa (silêncio)` | Um instante de silêncio de N segundos, depois continua. |
| `hangup` | `Encerrar ligação` | Encerra a chamada; a história retoma no nó externo. |

#### `Áudio / MP3` (a fala)

O carro-chefe de uma ligação. Campos:

- **`Quem fala (rótulo na tela)`** — um personagem, ou os especiais `player`/`system`. Define o nome mostrado enquanto a fala toca. Opcional.
- **`Áudio (mídia da biblioteca)`** — escolha um item de áudio registrado. Preferível, para não repetir o mesmo arquivo em vários passos.
- **`Ou link direto do MP3 (opcional)`** — cole uma URL no lugar. Se um item da biblioteca for escolhido, a URL *dele* prevalece sobre este link.
- **`Legenda (o que está sendo dito)`** — o texto/legenda na tela.
- **`Sem MP3: segurar a legenda por (segundos)`** — quando não há áudio, por quanto tempo a legenda permanece antes de avançar (padrão ~4s).
- **`Efeitos`** — disparam quando esta fala toca.

Conecte sua única saída inferior ao próximo passo.

> **Dica:** Um passo de áudio só com legenda (sem MP3, apenas `holdSec`) é um jeito limpo de roteirizar uma fala para a qual você ainda não tem gravação — a ligação ainda "fala" via texto. Adicione o MP3 real depois sem precisar refazer nenhuma ligação.

#### `Escolha de resposta` (resposta do jogador)

Dá ao jogador opções de resposta *durante* a ligação. Campos:

- **`Pergunta/contexto (opcional)`** — texto de enquadramento opcional.
- **`Respostas do jogador`** — adicione opções com `resposta`. Cada uma usa o formulário padrão de opção: texto do botão, uma fala falada opcional (`Fala enviada` — vazio = igual ao botão), uma opção silenciosa `Não dizer nada`, uma condição `Só aparece se…`, e efeitos por opção.
- **`Sem resposta após (segundos) — vazio/0 = espera para sempre`** — tempo esgotado para encaminhamento automático.

Cada resposta tem sua **própria** alça na borda direita no canvas — ligue cada uma ao seu passo seguinte. Há também uma saída separada **`sem resposta`**: se o tempo se esgotar e você a tiver conectado, a ligação a segue; **se você a deixar desconectada, a ligação desliga.**

> **Pegadinha:** Este passo (assim como `Condição`) não tem uma única saída — apenas as alças por resposta mais a alça de tempo esgotado. Uma resposta desconectada não leva a lugar nenhum; o roteirista precisa conectar cada uma explicitamente.

#### `Ação (efeitos)`, `Pausa (silêncio)`, `Condição`

- **`Ação`** — apenas aplica efeitos e segue sua única saída. Use para aumentos de confiança no meio da ligação, flags, evidências etc.
- **`Pausa`** — `Segundos de silêncio` e depois continua. Bom para momentos dramáticos.
- **`Condição`** — adicione linhas de `ramo`, cada uma com uma condição; no canvas, cada ramo ganha uma alça `se condição N` mais uma alça `senão (padrão)`. As condições são avaliadas de cima para baixo; a primeira verdadeira vence, senão vai pelo padrão.

#### `Encerrar ligação` (desligar)

Encerra a chamada. Campos: uma `Legenda final` opcional (por exemplo, "ligação encerrada") e os `Efeitos` que disparam ao desconectar. Não tem **nenhuma saída** — quando executa, o controle volta ao nó *externo* e a história continua em **`depois da ligação`**.

> **Importante:** Todo caminho pelo seu subfluxo deve chegar a um `Encerrar ligação`. Sem isso, a ligação não tem como terminar de forma limpa e voltar para a história. Ramos e opções de resposta que terminam em becos sem saída simplesmente travam a ligação.

### 7.5 Definindo o passo inicial e conectando os passos

- **Passo inicial:** O primeiro passo que a ligação toca depois que o jogador atende. O primeiro passo que você adiciona é marcado automaticamente como o inicial. Para trocar, selecione um passo e clique em **`definir como início`** no inspetor de passo; o passo inicial atual exibe o selo **`início da ligação`**.
- **Conectando:** Arraste da alça da borda direita de um passo até o passo de destino. O store registra isso no campo correspondente (`next`, o destino de uma resposta, `timeoutNext`, o `next` de um ramo, ou o `fallback` do ramo). Apagar um passo limpa automaticamente quaisquer alças que apontavam para ele, então você não deixa conexões soltas.

### 7.6 As saídas externas — para onde a história vai a seguir

De volta ao canvas do **capítulo**, o nó `Ligação interativa` expõe três saídas para ligar ao restante do capítulo (o inspetor lembra: *"ligue 'depois da ligação', 'recusou' e 'não atendeu' aos próximos nós"*):

- **`depois da ligação`** — a linha principal. A história continua aqui assim que um `Encerrar ligação` finaliza a chamada conectada. É o `next` do nó.
- **`recusou`** — seguida quando o jogador recusa a ligação (faz par com o bloco `Se RECUSAR`).
- **`não atendeu`** — seguida quando a ligação toca até o fim sem ser atendida (faz par com `Se NÃO ATENDER`). Se você deixou aquele bloco vazio, trate isto como o caminho da recusa.

> **Dica:** Sempre ligue `depois da ligação` — é a espinha dorsal do capítulo. As saídas `recusou`/`não atendeu` podem ficar desconectadas se esses desfechos devem simplesmente ficar em silêncio, mas se recusar a ligação for uma escolha narrativa *de verdade*, dê a ela um lugar significativo para ir.

### 7.7 Checklist rápido

1. Adicione uma `Ligação interativa`, defina `Quem liga` e `Direção`.
2. Decida o `Toca por` (e preencha `Se NÃO ATENDER` só se uma chamada perdida deve ser diferente).
3. Clique em `Abrir fluxo da ligação`, monte a cena com passos de `Áudio / MP3` + `Escolha de resposta`, marque o `início da ligação`, e encerre todo caminho com `Encerrar ligação`.
4. `voltar ao capítulo`, então ligue `depois da ligação` / `recusou` / `não atendeu`.
5. Rode **`✓ validar`** antes de exportar — ele detecta alças de resposta/ramo e saídas externas que não apontam para lugar nenhum.

## 8. Validação e o painel de Inspeção

Toda história que você escreve é um grafo de nós ligados entre si por destinos `next`, somado a uma teia de referências a personagens, evidências, notícias, posts e finais. Um único erro de digitação num id e o jogo pode chegar a um beco sem saída ou travar. O editor oferece duas redes de segurança complementares: um painel **`Inspeção`** ao vivo, que examina a história inteira em busca de problemas de saúde, e um botão **`✓ validar`** de uso pontual, que roda exatamente as mesmas regras de integridade que o próprio jogo usa antes de liberar a exportação. Use os dois e você nunca vai publicar um `story.json` quebrado.

### A aba `Inspeção` — um painel de saúde vivo

`Inspeção` é a última aba da barra superior. Ela nunca te bloqueia e nunca abre um modal — é um raio-X somente leitura da história que você tem carregada no momento, recalculado automaticamente conforme você edita. Tem cinco subabas (submodos) no topo:

- `Visão geral` — o tamanho da história, o tempo estimado de jogo e, mais importante, a saúde de QA.
- `Texto` — busca de texto completo em todo o roteiro e nos registros.
- `Variáveis` — onde uma flag/trust/evidência/etc. é alterada versus onde ela decide um caminho.
- `Personagem` — a confiança, as liberações e os gates de um personagem, capítulo a capítulo.
- `Bifurcações` — um mapa de toda escolha do jogador e de toda ramificação automática.

Para o trabalho de validação, a que mais importa é a `Visão geral`. Role até a última faixa, **`Saúde da história`**. Quando está tudo limpo, você vê um único cartão verde **`tudo certo`**, dizendo "nenhum nó solto, inalcançável ou capítulo sem fim". Caso contrário, o painel lista exatamente três classes de problema:

| O que ele encontra | Como aparece | O que significa |
|---|---|---|
| **Nós inalcançáveis** | uma lista por capítulo sob cada título de capítulo, cada linha marcada como `nó nunca alcançado a partir da entrada` | o nó existe no canvas, mas nenhum caminho de setas `next` partindo do nó de entrada do capítulo chega até ele — conteúdo morto, invisível no jogo |
| **Capítulos sem fim** | sob `Capítulos sem fim de capítulo`, cada um dizendo `nenhum nó "Fim do capítulo" — nunca passa adiante` | o capítulo não tem nó `Fim do capítulo`, então o jogo nunca consegue avançar a partir dele |
| **Destinos quebrados** | sob `Destinos quebrados`, cada um dizendo `aponta para «X» (inexistente)` | o `next` de um nó (ou destino de opção/ramificação) aponta para um id que não existe naquele capítulo |

Os mesmos avisos também aparecem de forma compacta na tabela **`Por capítulo`**, na coluna `Saúde`: um pequeno chip `N inalcançável`, um chip `sem fim`, ou um check verde quando o capítulo está limpo.

#### Pulando direto para o nó problemático

Toda linha do painel de Inspeção é um botão. **Clique nela e o editor salta para aquele nó exato** — ele troca para a aba `Capítulos`, abre o capítulo certo e seleciona/centraliza o nó no canvas (via `goToNode`). Isso funciona em todo lugar: nas linhas de destino quebrado, nas linhas de nó inalcançável, nas linhas da tabela por capítulo, nos resultados de busca de `Texto`, nas listas de "onde muda / onde decide" de `Variáveis`, nas entradas da linha do tempo de `Personagem` e nas origens e destinos das bifurcações de `Bifurcações`. Você nunca precisa caçar um id na mão — deixe que uma linha te leve até ele.

> Dica: as outras subabas são ouro de diagnóstico mesmo quando nada está "quebrado". `Variáveis` vai te avisar que uma flag é definida mas **`nunca decide nada — talvez sobre`**, o que normalmente significa que um erro de digitação dividiu uma flag em duas grafias. `Bifurcações` desenha um selo vermelho `destino inexistente` em qualquer opção de escolha ou ramo de bifurcação que aponte para o nada — uma prévia amigável dos mesmos destinos quebrados nos quais o validador vai travar de vez.

### O botão `✓ validar` e o modal de relatório

`✓ validar` fica na barra de ferramentas no canto superior direito, ao lado de `⬇ exportar story.json`. Apertá-lo roda a verificação de integridade completa (`validateBundle`) e abre um **modal de relatório** centralizado. Feche-o clicando no fundo ou no botão `fechar`.

O relatório separa as constatações em dois grupos, e essa diferença é o ponto principal:

- **ERROS** (vermelho, ícone `AlertCircle`) — quebras reais de referência. O cabeçalho fica vermelho e diz **`N erro(s) — exporte só depois de corrigir`**. **Erros bloqueiam a exportação.**
- **AVISOS** (âmbar, ícone `AlertTriangle`) — coisas que provavelmente estão erradas ou inacabadas, mas que não vão travar o jogo. **Avisos nunca bloqueiam a exportação.**

Como o portão funciona na prática: `✓ validar` apenas *mostra* o relatório. O portão de verdade é o botão de exportar — apertar `⬇ exportar story.json` roda a mesma validação de novo e **só baixa o arquivo se houver zero erros** (`r.errors.length === 0`). Se houver erros, ele te mostra o relatório em vez do download. Avisos, por mais que sejam, nunca impedem o download.

Quando a história está limpa, o cabeçalho fica verde e diz **`História válida`**; se também não houver avisos, você vê **`Nenhum problema encontrado`**.

> O validador roda em cima do que está carregado *no editor neste exato momento*. Depois que você aperta `⟳ carregar do jogo` ou `importar`, o relatório anterior é apagado — revalide antes de confiar nele.

### Mensagens comuns de validação e como corrigi-las

As mensagens estão em português e vêm prefixadas com uma localização tipo `cap_03/n12` (id do capítulo / id do nó) ou um caminho de registro como `Mural/p2`. Esse prefixo é o seu mapa para o problema. As mais frequentes:

| Mensagem | Severidade | O que está errado / como corrigir |
|---|---|---|
| `…/nó: destino "X" não existe` | **erro** | Um destino de `next`/opção/ramificação aponta para um id de nó ausente naquele capítulo. Redesenhe a seta ou corrija o id. (O mesmo que uma linha de `Destinos quebrados` na Inspeção.) |
| `Capítulo inicial "X" não existe` | **erro** | `meta.startChapter` (definido em `projeto` → `Capítulo inicial`) nomeia um capítulo que não existe. Escolha um capítulo existente. |
| `chapterOrder contém capítulo inexistente "X"` | **erro** | A ordem dos capítulos lista um id sem capítulo. Remova-o ou crie o capítulo. |
| `X: capítulo sem nó de entrada definido` / `entrada "Y" não existe` | **erro** | O capítulo não tem nó de entrada, ou a entrada dele aponta para o nada. Marque um nó inicial como a entrada do capítulo. |
| `…: evidência inexistente "X"` | **erro** | Um efeito `addEvidence` ou um anexo de mensagem referencia um id de evidência que não existe. Crie-o em `Evidências` ou corrija o id. |
| `…: personagem inexistente "X"` / `remetente desconhecido "X"` | **erro** | Um efeito `trust`/`unlockContact`/`setPresence`, um `speaker` de mensagem, um `caller` ou um contato compartilhado nomeia um personagem desconhecido. Adicione o personagem ou corrija o id (`player`/`system` são sempre válidos). |
| `…: notícia inexistente "X"` | **erro** | Um `unlockNews`/`publishNews`, uma notificação ou um link `{{news:id}}` referencia um id de notícia ausente. |
| `…: post inexistente "X"` | **erro** | Um `unlockSocial`/`publishPost`, uma ação de comentário/curtida, uma notificação ou um link `{{post:id}}` referencia um id de post do Mural ausente. |
| `…: story inexistente "X"` | **erro** | Um `unlockStory`/`publishStory` referencia um id de story do Mural ausente. |
| `…: final inexistente "X"` | **erro** | Um efeito `setEnding`/`lockEndingScore` ou o `ending` de um `chapterEnd` nomeia um final ausente. Crie-o em `Finais` ou corrija o id. |
| `…: link aponta página inexistente "X"` | **erro** | Um token de link `{{page:id}}` dentro de uma mensagem aponta para uma página web ausente (`Páginas Web`). O validador também checa os tokens `{{news:…}}`, `{{post:…}}`, `{{profile:…}}`. |
| `…: escolha sem opções` / `opção "…" sem destino` | **erro** | Um nó de escolha não tem opções, ou uma opção não tem `next`. Toda escolha precisa de ao menos uma opção, e toda opção precisa de um destino. |
| `…: mensagem sem conversa (thread)` | **erro** | Uma mensagem/escolha/shareContact não tem `thread` definida — ela não sabe em qual chat se arquivar. |
| `Mural/X: comentário responde a id inexistente "Y"` | **erro** | O `replyTo` de um comentário aponta para um comentário sem id correspondente. Dê um id ao comentário alvo. |
| `Mídia/X: sem URL do arquivo` / `mídia inexistente "X"` | **erro** | Uma entrada de mídia não tem URL, ou algo referencia um id de mídia que não está em `Mídias`. |
| `X: capítulo sem nó "Fim do capítulo"` | **aviso** | O capítulo não tem nó de Fim do capítulo — tudo bem enquanto você rascunha, mas ele não consegue passar para o próximo capítulo até ter um. |
| `…/nó: mensagem sem próximo nó (a história trava aqui)` | **aviso** | Uma mensagem/delay/shareContact não tem `next` — o jogo para de vez aqui. Ligue-a adiante, a menos que esta seja realmente a última batida. |
| `…: próximo capítulo "X" ainda não existe` | **aviso** | Um `chapterEnd` aponta para um capítulo que você ainda não escreveu. Esperado durante a produção; resolva antes do lançamento. |
| `Capítulo "X" não está na ordem de capítulos` | **aviso** | O capítulo existe, mas não está em `chapterOrder`, então ele pode nunca entrar em sequência no jogo. |
| `…: ligação sem passo "Encerrar"…` | **aviso** | Uma cena de ligação interativa não tem passo de desligar e pode chegar a um beco sem saída. Adicione um passo `Encerrar`. |

> Repare na assimetria que confunde as pessoas: um **`next` solto é um ERRO** (destino quebrado), mas um **`next` ausente é só um AVISO** ("a história trava aqui"). Um capítulo sem final também é apenas um aviso. Ou seja, uma história pode exportar "limpa" (zero erros) e ainda estar inacabada — é por isso que a faixa `Saúde da história` do painel `Inspeção` e a lista de avisos importam mesmo quando a exportação está liberada.

### A regra de ouro: valide no repositório também

O validador do editor espelha a verificação do próprio jogo (`scripts/validateStory.mjs`), mas o script do repositório é a autoridade final. Depois de exportar e colocar o arquivo no lugar, **sempre rode a verificação do repositório antes de considerar a história pronta:**

1. No editor, corrija todos os erros até `✓ validar` mostrar o verde `História válida`.
2. Aperte `⬇ exportar story.json` (ele se recusa a baixar enquanto houver erros).
3. Substitua `src/story/story.json` no repositório pelo arquivo baixado.
4. Na raiz do repositório, rode **`npm run validate-story`**.
5. Exporte/publique só quando esse comando reportar tudo limpo.

Essa segunda passada pega qualquer coisa que tenha escapado e confirma que o arquivo do jogo de verdade — não só a cópia em memória do editor — está sólido.

### Boas práticas para uma história saudável

- **Revalide depois de cada carregamento.** `⟳ carregar do jogo`, `importar` e `exportar` todos apagam ou atualizam o relatório — nunca confie num check verde velho.
- **Trate a faixa `Saúde da história` como seu painel de pré-voo.** Mire no cartão verde único `tudo certo` antes de exportar. Nós inalcançáveis são silenciosos — parecem ok no canvas, mas nunca rodam.
- **Clique, não cace.** Toda linha da Inspeção salta para o seu nó. Corrija em `Capítulos` e depois volte para `Inspeção` para confirmar que sumiu.
- **Use `Variáveis` para pegar erros de digitação que os erros não enxergam.** Uma flag definida mas nunca lida (`nunca decide nada — talvez sobre`) quase sempre significa que a mesma flag está escrita de duas formas. O validador não consegue sinalizar isso — só o painel consegue.
- **Use `Bifurcações` para flagrar escolhas mortas cedo.** O selo vermelho `destino inexistente` antecipa um destino quebrado antes mesmo de você apertar validar.
- **Não ignore avisos só porque a exportação funciona.** "A história trava aqui", "capítulo sem fim" e "próximo capítulo ainda não existe" são justamente como uma história inacabada fica em silêncio no jogo sem avisar. Limpe-os antes de dar um capítulo por concluído.
- **Termine com `npm run validate-story`.** O sinal verde do editor é necessário; o sinal verde do repositório é o que de fato vai pro ar.

Arquivos-fonte relevantes: `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/io.ts` (as regras de `validateBundle` + `exportBundle`), `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/App.tsx` (os botões `validar`/`exportar` e o modal de relatório), `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/panels/AuditPanel.tsx` (a UI da aba `Inspeção`) e `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/panels/auditScan.ts` (os scanners `scanDangling`/`chapterStats`/de alcançabilidade por trás da faixa de saúde).

---

_Achou divergência entre este guia e o editor? O código-fonte é a fonte da verdade — abra uma issue ou PR. 💛_
