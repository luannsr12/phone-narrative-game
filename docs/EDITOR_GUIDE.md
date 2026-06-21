# 📱 The Story Editor — Complete Guide

A friendly, end-to-end guide to the **visual story editor** in [`editor/`](../editor) — the Typebot-style tool where you build and edit the **entire game as data**, with zero code.

> 🌐 **Languages:** 🇬🇧 English (this page) · 🇧🇷 [Português](EDITOR_GUIDE.pt-BR.md)

**Who it's for.** Writers, designers, translators — anyone adding or changing story content (characters, chapters, branching conversations, evidence, news, social posts, endings). No programming required.

**The one rule.** The editor produces a single file — `story.json` — and the game reads everything from it. The loop is always: *edit visually → validate → export → drop it into the game.*

> New here? Read §1 first, then jump to whatever you need.

## Contents

- [1. Overview and core workflow](#1-overview-and-core-workflow)
- [2. The chapter canvas](#2-the-chapter-canvas)
- [3. Node types](#3-node-types)
- [4. Conditions and effects](#4-conditions-and-effects)
- [5. Registries](#5-registries)
- [6. Message variables, links and emoji](#6-message-variables-links-and-emoji)
- [7. Interactive calls](#7-interactive-calls)
- [8. Validation and the Inspection panel](#8-validation-and-the-inspection-panel)

---

## 1. Overview and core workflow

### What the editor is

The **editor de história** (story editor) is a small, standalone Vite + React desktop web app that lives in the `editor/` folder of the project. It is *not* part of the game itself — it is a Typebot-style visual authoring tool you run in your browser to build and edit the **entire game as data**.

The game and the editor talk to each other through a single file: the game reads its whole narrative from `src/story/story.json`, and the editor's job is to produce that exact file. Everything the player ever sees — chapters, characters, evidence, news, social posts, a blog, ads, endings, and all the branching message flows — is authored here and bundled into one JSON document (internally called the **bundle**). There is no separate database and no code to touch: edit visually, export the JSON, drop it into the game.

The top bar's title (next to the radio icon) always shows your project's title with the subtitle `editor de história`, so you can confirm at a glance which story you have loaded.

### Launching the editor

From a terminal, run these commands inside the `editor/` folder:

```bash
cd editor
npm install      # first time only — installs the editor's own dependencies
npm run dev      # starts the Vite dev server
```

The terminal prints a local URL (typically `http://localhost:5173`). Open it in your browser and the editor loads. It runs entirely in your browser — nothing is uploaded anywhere.

> **Tip:** The editor's `npm install` is separate from the game's. The editor has its own `node_modules` inside `editor/`.

### The top bar

The top bar is your command center. From left to right:

| Element | What it is | What it does |
| --- | --- | --- |
| Brand (radio icon + title) | The project name + `editor de história` subtitle | Shows the currently loaded story's `title` |
| Tabs (`Capítulos`, `Personagens`, …) | The eleven workspaces | Switch what you're editing (see table below) |
| `projeto` (project) | Toggle button | Opens/closes the project meta panel |
| `⟳ carregar do jogo` (load from game) | Action button | Imports the live `src/story/story.json` that ships with the game |
| `importar` (import) | Action button | Loads a `story.json` file you pick from disk |
| `✓ validar` (validate) | Action button | Runs the integrity check and shows a report |
| `⬇ exportar story.json` (export story.json) | Accent action button | Validates, then downloads `story.json` |

#### The tabs

Each tab is one registry or workspace within the bundle:

| Tab | Edits |
| --- | --- |
| `Capítulos` (Chapters) | The chapter flowcharts — the heart of the story |
| `Personagens` (Characters) | The cast |
| `Evidências` (Evidence) | Evidence files the player collects |
| `Mídias` (Media) | Reusable audio/video/image assets (URLs) |
| `Notícias` (News) | News articles |
| `Páginas Web` (Web Pages) | Fictional websites |
| `Rede Social` (Social Network) | "Mural" posts, stories, and NPC accounts |
| `Blog` | Player-published blog articles |
| `Anúncios` (Ads) | Sponsored ads (social + browser) |
| `Finais` (Endings) | The story's endings |
| `Inspeção` (Audit/Inspection) | A cross-bundle audit/search view |

### The `projeto` (project) meta panel

Click `projeto` to toggle a horizontal strip of global, story-wide settings. Edits here save instantly. The fields are:

- **`Título do jogo`** (Game title) — the project's `title`; also shown in the top-bar brand.
- **`Versão`** (Version) — a free-text `version` string (e.g. `0.1.0`).
- **`Capítulo inicial`** (Starting chapter) — a dropdown of your chapters; sets `startChapter`, where a new game begins.
- **`Saldo inicial do jogador (R$)`** (Player's starting money) — the `startingMoney` the player starts with (placeholder `12.90`).
- **`Toque de chamada (URL do ringback)`** (Ringback / call tone URL) — an optional `ringbackUrl` for the sound played while a call is ringing. Leave blank to use the default.
- **`Nome do blog`** (Blog name) — an optional `blogName` label for the in-game blog (placeholder `ex.: Sinal de Ravenwood`).

> **Gotcha:** `Capítulo inicial` must point to a chapter that actually exists. If it's empty or points to a deleted chapter, validation reports an error (`Capítulo inicial "…" não existe`).

### Autosave (and the `_editor` key)

You do **not** save manually. Every change you make — to any field, node, connection, or layout — is automatically written to your browser's `localStorage` (under the key `sinal-perdido-editor/v1`). When you reopen the editor, it restores exactly where you left off. If that autosave is ever missing or corrupted, the editor quietly starts from a clean, empty story.

The bundle includes a special `_editor` key that stores the **on-canvas position (layout) of every node** (and the nested layout of any call sub-flows). This is purely for the editor's visual canvas — the game ignores `_editor` entirely. Because it travels inside the exported `story.json`, your flowchart layouts survive an export → import round-trip.

> **Important caveats about autosave:**
> - Autosave is per-browser and per-machine. It is **not** a backup. Clearing site data, switching browsers, or using a different computer means a blank editor.
> - The real source of truth is the exported `story.json` in the game repo. Export regularly and commit it — treat the browser autosave as scratch state only.

### The end-to-end workflow

This is the loop you'll repeat for every editing session:

1. **Load from the game.** Click `⟳ carregar do jogo`. This pulls in the live `src/story/story.json` so you start from exactly what's shipped. If the editor already has content, it asks `Substituir o conteúdo atual do editor pela história que está no jogo?` (Replace the editor's current content with the story in the game?) — confirm to overwrite. *(Alternatively, use `importar` to load a `story.json` file you have saved elsewhere.)*
2. **Edit.** Use the tabs to author chapters (node flowcharts), characters, evidence, media, news, pages, social, blog, ads, and endings. Everything autosaves as you go.
3. **Validate.** Click `✓ validar`. A report modal opens listing any errors and warnings (details below). Fix every error.
4. **Export.** Click `⬇ exportar story.json`. The editor validates again and, **only if there are zero errors**, downloads a `story.json` file.
5. **Replace the game's file.** Move/copy the downloaded `story.json` over `src/story/story.json` in the game repo.
6. **Run the repo's validator.** From the repo root, run `npm run validate-story`. This is the game's own referential-integrity check and the final gate before the change is trusted.
7. **Reload the game.** Restart/reload the Expo app to play your changes.

> **Tip:** Steps 3 and 4 overlap — `⬇ exportar story.json` runs validation for you and refuses to download if there are errors. You can still click `✓ validar` on its own at any time to check progress without exporting.

### Import / export details and the validation report

**Validation report modal.** Both `✓ validar` and `⬇ exportar story.json` open the same report overlay. Click anywhere outside the box, or the `fechar` (close) button, to dismiss it.

- **Header:** If there are no errors, it shows a green **`História válida`** (Story valid). If there are errors, it shows a red **`N erro(s) — exporte só depois de corrigir`** (N error(s) — only export after fixing).
- **Errors** (red, alert icon) **block export.** These are hard referential problems — e.g. a node pointing at a `next` target that doesn't exist, an effect referencing a missing character/evidence/news/ending, a chapter with no entry node, a media item with no URL, a message with no thread, and so on.
- **Warnings** (amber, triangle icon) **do not block export.** They flag things worth a look but legitimately optional — e.g. a chapter not listed in the chapter order, a chapter missing a `Fim do capítulo` (chapter-end) node, a message with no next node ("a história trava aqui" — the story gets stuck here), or a `chapterEnd` pointing at a next chapter that doesn't exist yet.
- If there are no errors and no warnings, the modal simply reads **`Nenhum problema encontrado.`** (No problems found.)

**Export.** `⬇ exportar story.json` produces a pretty-printed `story.json` download named exactly `story.json` — the file you drop into `src/story/`. If validation finds **any** error, nothing downloads; fix the listed errors and try again.

**Import.** `importar` opens a file picker (JSON only). The file must at least contain `meta`, `chapters`, and `characters`, or you'll get `Arquivo não parece ser um story.json válido.` (This file doesn't look like a valid story.json). Malformed JSON reports `JSON inválido.` On a successful import, any missing optional registries (social, stories, NPCs, ads, blog, pages, media, and the `_editor` layouts) are auto-filled as empty, so older or partial files load cleanly.

> **Gotcha:** The editor's `✓ validar` mirrors the game's `npm run validate-story` rules, but always run the repo-root validator too (step 6) as the final check before considering a change done — it's the authority the game trusts.

## 2. The chapter canvas

The chapter canvas is where you build the actual story: a flowchart of "nodes" (blocks) wired together with connections. It lives on the `Capítulos` (Chapters) tab — the first tab the editor opens to. The whole tab is split into three columns: the **chapter list** on the left, the **node canvas** in the middle, and the **inspetor** (inspector, the form that edits the selected node) on the right. This section covers the list and the canvas; the inspector is documented separately.

### Tip: collapse the side panels for more room

Both side columns can be tucked away to give the canvas the full width. Click the `capítulos` and `inspetor` buttons in the canvas toolbar (top-right), or click a collapsed rail to reopen it. Collapsing is purely visual — it changes nothing in your story.

### The chapter list (left sidebar)

The left column lists every chapter in play order.

- **Create a chapter** — click `Novo capítulo` (New chapter). A fresh, empty chapter is added at the end of the list and immediately selected. It gets an auto-generated id and a placeholder title like `Capítulo 3`; rename it in the chapter meta form (below).
- **Open a chapter** — click any chapter's title. The middle canvas switches to that chapter's flowchart. The sub-line under each title shows how many nodes it holds (e.g. `12 nó(s)`).
- **The starting chapter** — exactly one chapter carries a `inicial` (initial) chip with a small play icon. That is the chapter the game boots into. (The chip reflects `meta.startChapter`; it is set elsewhere, not from this list.)
- **Reorder** — each row has small up/down arrows (`mover para cima` / `mover para baixo` = move up / move down). Reordering changes the chapter play order, which is what the game follows when a chapter ends without naming a specific next target. The up arrow is disabled on the first chapter, the down arrow on the last.

> **Gotcha:** order matters. When a `Fim do capítulo` node has no explicit next chapter, the game advances to the *next chapter in this list*. If a chapter feels like it's leading into the wrong place, check the list order before blaming the nodes.

### Chapter meta fields (dados do capítulo)

Above the canvas sits a collapsible bar labelled `dados do capítulo` (chapter data). Click it to expand the form for the open chapter:

| Field | Label in the editor | What it does |
| --- | --- | --- |
| Title | `Título` | The chapter's name. Shown in the list and used as a friendly label in search results. |
| Objective | `Objetivo (aparece para o jogador)` (Objective — shown to the player) | A short goal line the **player actually sees** in-game. Keep it diegetic. |
| Summary | `Resumo (interstício de capítulo concluído)` (Summary — chapter-complete interstitial) | The recap text shown on the "chapter complete" screen between chapters. |

At the bottom of this form is `excluir capítulo` (delete chapter). It asks for confirmation, then removes the chapter **and all of its nodes** (and any nested call layouts). There is no undo, so be sure.

The **entry node** ("início do capítulo" = chapter start) is not set here — it's set on the canvas, per node (see *Setting the entry node* below).

### The node canvas

The middle column is a pannable, zoomable flowchart (built on React Flow).

- **Pan** — drag an empty part of the canvas.
- **Zoom** — scroll/pinch, or use the zoom `Controls` in the bottom-left corner.
- **Mini-map** — the bottom-right `MiniMap` is a bird's-eye view; it's clickable and zoomable, handy for large chapters.
- **Select a node** — click it (this opens it in the inspector). Clicking empty canvas deselects.
- **Move a node** — drag it. Positions are saved automatically when you release the mouse, so your layout persists between sessions.

When you first open a chapter that has **no saved positions** (for example, freshly imported content), the editor auto-arranges the nodes for you: a top-down tree starting from the entry node, fanning each downstream level into its own row. It's a sensible starting layout — feel free to drag things around afterward; your manual positions are kept from then on.

#### Adding a node

Click `Adicionar nó` (Add node) in the toolbar. A grouped menu drops down:

| Group | Label | What's inside (node types) |
| --- | --- | --- |
| Conversation | `Conversa` | Mensagem, Escolha, Atividade, Enviar contato, Liberar mensagem |
| Flow | `Fluxo` | Condição (branch), Paralelo (fork), Tempo (delay), Ação |
| Apps / Media | `Apps / Mídia` | Publicar notícia, Post no Mural, Story no Mural, Liberar pauta (Blog), Mural comentário/curtidas, Mural seguidores, Saldo, Notificação |
| Events | `Eventos` | Evento, Remover evento, Chamada, Ligação interativa |
| End | `Fim` | Fim do capítulo |

Pick a type and the new block appears **at the center of whatever you're currently looking at** (with a tiny random offset so repeated adds don't stack perfectly on top of each other). The new node is auto-selected, ready to edit in the inspector. Press `Esc` or click outside to close the menu without adding.

> **Note:** the very first node you add to an empty chapter is automatically made the entry node.

#### Node colors and icons

Every node type has its own accent color and icon so you can read the chart at a glance. The colored tile sits in each block's header, and the same hue tints the inspector header. A few you'll see most:

- **Mensagem** (message) — teal, speech-bubble icon. Its header shows the *speaker's name*, and the body previews the message text. Small badges flag an attachment (paperclip) or effects (lightning bolt).
- **Escolha** (choice) — amber, checklist icon. Lists the reply options the player can pick; a muted/`silent` option shows a mute icon.
- **Condição** (branch) — blue, git-branch icon. Routes by condition.
- **Ação** (action) — purple, lightning icon. Applies effects with no message.
- **Tempo** (delay) — orange, clock icon. Shows how long it waits.
- **Chamada / Ligação interativa** (call / interactive call) — light blue, phone icons.
- **Fim do capítulo** (chapter end) — red, flag icon. Shows where it leads (a named ending, a specific chapter, or "próximo da ordem" = next in order).

The entry node additionally shows an `INÍCIO` (start) badge in its header.

### Connecting nodes

Nodes are wired by their **handles** — the little dots on a node's edge. A `target` handle (the input) sits on the **top** of every block. `source` handles (outputs) sit on the **bottom** (for a single plain output) or down the **right side** (one per labelled branch/option).

**To connect:** drag from a node's output handle and drop onto another node's top input handle. The link is saved instantly into the story graph. Drag again from the same output to a different node and the link simply moves (each output points to exactly one target).

Which outputs a node has depends on its type:

| Node | Output handle(s) | Meaning |
| --- | --- | --- |
| Mensagem, Ação, Tempo, Atividade, Enviar contato, Liberar mensagem, Publicar notícia, Post/Story no Mural, Liberar pauta, Mural comentário/seguidores, Saldo, Notificação, Remover evento | one plain `next` (bottom) | continue to the next node |
| Escolha (choice) | **one handle per option**, on the right | each player reply leads somewhere |
| Condição (branch) | one per branch (`se condição 1`, `se condição 2`, …) **plus** a `senão (padrão)` (else / default) fallback | first matching condition wins; fallback catches the rest |
| Paralelo (fork) | one per output (`saída 1 (linha principal)` = output 1, main line; then `saída 2`, …) | all outputs fire at the same time |
| Chamada (call) | `atendeu` (answered) and `recusou` (declined) | branch on whether the player picks up |
| Ligação interativa (callScene) | `depois da ligação` (after the call), `recusou` (declined), and `não atendeu (tempo)` (didn't answer / timeout) | three ways the interactive call can end |
| Evento (event) | `quando o evento acontecer` (when the event happens = `onEvent`) and `continuar agora (vazio = espera)` (continue now; empty = wait = `next`) | one path fires when the player does the tracked action; the other continues immediately, or, if left empty, pauses the story until the event happens |
| Fim do capítulo (chapterEnd) | none | this is a terminal node |

> **Tip:** options, branches, and fork outputs are added/removed in the **inspector** (the right-hand form), not on the canvas — so the number of right-side handles changes as you edit that node's content.

> **Gotcha — interactive calls have a hidden inner flowchart.** A `Ligação interativa` node is a flowchart *inside* a flowchart. Its block says `2 cliques para abrir o fluxo` (double-click to open the flow); double-clicking drills into a separate sub-canvas of call steps (audio, choice, branch, delay, hangup). That nested editor works just like this one but is documented separately.

### Setting the entry node (início do capítulo)

Every chapter needs one **entry node** — the block the story starts from when the chapter begins. It's the block tagged with the `INÍCIO` badge and the one the auto-layout treats as the root of the tree.

To set it: select a node, then in the inspector click `definir como início` (set as start). If the node is already the entry, the inspector shows a non-clickable `início do capítulo` (chapter start) tag instead. The first node added to an empty chapter becomes the entry automatically.

> **Gotcha:** if you delete the current entry node, the chapter is left with *no* entry. Remember to pick a new one, or the chapter won't have a clear starting point (and the auto-layout loses its root).

### Deleting nodes and edges

**Delete an edge (a connection):** hover over the connection line — an `×` button appears at its midpoint (tooltip `Remover ligação` = remove connection). Click it to sever the link. You can also select an edge and press `Delete`. Removing an edge just clears that one output; both nodes stay.

**Delete a node:** select it and press `Delete`, or use the delete button in the inspector. Deleting a node is safe — **the editor automatically scrubs every dangling reference to it.** Any other node's `next`, choice option, fork output, branch path, fallback, call answered/declined, callScene after/declined/timeout, event onEvent/next, or remove-event target that pointed at the deleted node is cleared back to empty. You won't be left with edges pointing into the void. If the node was the chapter's entry, the entry is reset to empty (set a new one).

### Search and jump-to-node

The toolbar has a search box (`buscar nó por id…` = search node by id). Type or pick a node id and press `Enter` (or click `ir` = go). The canvas will:

1. Open the chapter that node lives in (switching there if it's elsewhere),
2. select the node, and
3. smoothly **center the camera** on it.

The search box has autocomplete: it lists every node id across **all** chapters (showing each one's chapter title), and even reaches **steps inside interactive calls** — picking one of those drills straight into that call's sub-flow and selects the step. This is especially useful for chasing down a node id that a validation error points at. If nothing matches, you'll see a `nó não encontrado` (node not found) warning.

> **Tip:** the camera only re-centers on an explicit search/jump — never when you simply click or drag a node. That's deliberate, so a node never "runs away" from your cursor while you're moving it.

## 3. Node types

Every node you drop on the canvas has a **type**. The type decides what the node does when the story reaches it, and which fields the inspector (right-hand panel) shows. Select a node to edit it; the inspector header shows the node's Portuguese type label and its `id`. From the inspector you can also `definir como início` (set as chapter start) or `excluir nó` (delete node).

This section lists every node type, what it does, and the fields that matter. Labels are the real Brazilian-Portuguese UI strings from the editor.

### Quick reference

| Node | Label (UI) | What it does |
| --- | --- | --- |
| `message` | `Mensagem` (Message) | Sends one chat bubble (text and/or one attachment) into a conversation. |
| `choice` | `Escolha` (Choice) | Offers reply buttons; the player picks one. **Blocks** until they answer. |
| `action` | `Ação` (Action) | Invisible node: applies effects and moves on. |
| `branch` | `Condição` (Condition) | Picks a path based on conditions (trust, flags, evidence…). |
| `unlockMessage` | `Liberar mensagem` (Unlock messaging) | Opens a contact's empty chat so the *player* can write first. |
| `shareContact` | `Enviar contato` (Send contact) | A character forwards someone's contact card into a chat. |
| `delay` | `Tempo` (Time) | Real-time pause; the flow waits N seconds. **Blocks** (wall-clock wait). |
| `activity` | `Atividade (digitando/gravando)` (Activity) | Shows "digitando…/gravando…" for N seconds, sends nothing. |
| `publishNews` | `Publicar notícia` (Publish news) | Publishes a news article to the News app. |
| `publishPost` | `Post no Mural` (Mural post) | Publishes a post on Mural (the in-game social network). |
| `publishStory` | `Story no Mural` (Mural story) | Publishes a Mural story (ring at the top of the feed). |
| `offerBlog` | `Liberar pauta (Blog)` (Unlock a story pitch) | Drops a Blog draft into the player's Blog app to compose and publish. |
| `socialActivity` | `Mural: comentário / curtidas` (Mural: comment / likes) | Adds a comment, or sets a post's/comment's like count. |
| `socialFollow` | `Mural: seguidores` (Mural: followers) | Sets a profile's followers/following counts. |
| `bank` | `Saldo (R$)` (Balance) | Credits or charges the player's bank balance. |
| `notification` | `Notificação` (Notification) | Fires a heads-up banner (with vibration) inside the game. |
| `call` | `Chamada` (Call) | A simple scripted call with answer/decline outcomes. **Blocks** (needs input). |
| `callScene` | `Ligação interativa` (Interactive call) | A call with its own sub-flow (audios, reply choices…). **Blocks**. |
| `event` | `Evento` (Event) | Arms a listener that fires when the player does something (e.g. places a call). |
| `removeEvent` | `Remover evento` (Remove event) | Disarms an `event` node set earlier. |
| `fork` | `Paralelo (várias saídas)` (Parallel) | Runs several delivery tracks at the same time. |
| `chapterEnd` | `Fim do capítulo` (Chapter end) | Closes the chapter; can route to a next chapter or an ending. |

**Blocking vs self-advancing (light note):** most nodes are *self-advancing* — they do their job and the playback moves straight to the next node. A few **block** and wait: `choice` and `call`/`callScene` need player input, `delay` waits real seconds, and `chapterEnd` is a chapter transition. This is the game's behaviour, not the editor's — you don't configure it; just know that wiring a long chain of self-advancing nodes will all "happen" in a quick burst, while a choice or call pauses the player there.

> Wiring tip: most fields are set in the inspector, but **connections are drawn on the canvas**. Drag from a node's right-side handle to the next node. Nodes with multiple exits (`choice`, `branch`, `call`, `callScene`, `event`, `fork`) expose one handle per exit — connect each one.

---

### `Mensagem` — message

The workhorse node: one chat bubble from someone, into one conversation.

- **`Quem envia`** (Who sends) — the speaker. Can be a character, or the special `Jogador` (player) / `Sistema` (system). Pick the player here to make the bubble come *from* the player without a choice.
- **`Conversa (thread) onde aparece`** (Conversation/thread where it appears) — which chat the bubble lands in. Picking a non-player speaker auto-fills the thread with that character, but you can change it (e.g. a character messaging inside a different thread).
- **`Texto da mensagem`** (Message text) — the bubble text. Type `{{` to insert **variables** (player name/gender) or **links** (web pages, news, Mural posts/profiles); there's a smile button for emojis. Example: `{{player_name}}` becomes the player's chosen name; a link becomes a tappable address in the chat. A message can be text-only, attachment-only, or both.
- **`Tempo digitando (ms)`** (Typing time, ms) — how long the "typing…" indicator shows before the bubble appears (default `1400`). Use it to pace delivery.
- **`Lembrete se não responder`** (Reminder if no reply) — optional no-reply nudge. If the player doesn't answer within `Tempo sem resposta` (seconds; `180` = 3 min), the same sender drops a follow-up bubble (`Mensagem do lembrete`, e.g. "voce ta ai?"). It fires once and cancels the moment the player replies. Great for making characters feel impatient.
- **`Efeitos`** (Effects) — optional effects applied when the bubble is delivered (set a flag, change trust, add evidence, etc.).

#### Attachment (`Anexo`)

A message can carry **one** attachment. Click `adicionar anexo` (add attachment) to create it, `remover` (remove) to drop it. The `Tipo` (Type) dropdown sets the kind, and the fields change accordingly:

- **`Imagem`** (Image — shows in the chat) — fill `Link da imagem`. Renders inline like a sent photo.
- **`Áudio`** (Audio — voice-message player) — pick a library file in `Mídia da biblioteca (áudio)` **or** paste a direct MP3 link. Add `Duração (segundos)` and a `Transcrição` (the in-game "transcrever" button reveals it, like WhatsApp voice transcription).
- **`Vídeo`** (Video — opens in-game) — same media-library-or-link choice plus `Duração`.
- **`Documento`** (Document — opens in-game) — paste the file link (PDF etc.) and a displayed `Nome do arquivo`.
- **`Localização`** (Location) — an optional URL/label.
- **`Link`** (opens in the in-game browser) — set a **fictional** displayed address (e.g. `gazetaderavenwood.com.br/…`) and a `Título do link` shown in the bubble. You can point it at a registered news article (`Abrir notícia cadastrada`), or leave that empty and author standalone page text in `Conteúdo da página avulsa` (blank lines split paragraphs).
- **`Contato`** (Contact) — note: to forward a contact **card** in-flow, prefer the dedicated `shareContact` node below; the message attachment's contact kind is the low-level form.

> **Media library wins:** for audio/video, when you pick a library item *and* paste a link, the library item's URL takes priority at playback.

> **Link to evidence:** `Vincular à evidência (vai para Arquivos do Caso)` (Link to evidence — goes to the Case Files) ties the attachment to an Evidence id, so opening it files the item into the player's case archive. Register the evidence on the **Evidências** tab first, then select it here.

---

### `Escolha` — choice

The player's turn to talk. **Blocks** until they pick an option.

- **`Conversa (thread)`** — which chat the reply chips appear in.
- **`Pergunta/contexto`** (Prompt/context, optional) — a short framing line.
- **`Opções de resposta`** (Reply options) — add as many as you need. Each option (`OptionForm`) has:
  - **`Texto do botão`** (Button text) — what the player sees.
  - **`Não dizer nada`** (Say nothing) — a silent option: choosing it sends **no** bubble to the chat.
  - **`Fala enviada`** (Sent line) — the bubble actually sent; leave blank to reuse the button text. (Hidden when "say nothing" is on.)
  - **`Só aparece se…`** (Only show if…) — a condition gating whether the option is offered (e.g. enough trust, a flag, evidence held).
  - **`Efeitos`** — effects applied when this option is chosen.
  - Each option is wired to its own next node **from its handle on the canvas** — the inspector reminds you: "Conecte cada opção ao próximo nó pelo canto direito dela no canvas."

> **Script-coherence gotcha:** an option's text must make sense on *every* path that can reach it. If a fact is only known on some routes, either gate the option with `Só aparece se…` or phrase it neutrally.

---

### `Ação` — action

An invisible node that only applies effects, then continues. The inspector says it plainly: "Nó invisível: só aplica efeitos e segue adiante." Use it to change state (flags, trust, evidence, money, ending scores) without sending anything to a chat. Just the `Efeitos` editor and a single exit.

### `Condição` — branch

Routes the flow by checking conditions. It "avalia as condições em ordem; a primeira verdadeira define o caminho" — evaluates each `Ramo` (branch) top-to-bottom and takes the first whose condition is true.

- Add `ramo` (branch) rows, each with its own condition (trust, flag, evidence, gender, money…).
- Wire each branch — and the optional **fallback** handle (used when no branch matches) — to its target on the canvas.

---

### `Liberar mensagem` — unlockMessage

Opens a contact's conversation so the **player** can start it. The character's thread appears (empty) in the Messages app without them having written anything; what the player ends up "saying" is authored by the **next** nodes — usually a `choice` in that thread, or a `message` with the player as sender.

- **`Personagem que o jogador pode chamar`** (Character the player can message).
- **`Efeitos`** — optional.
- **Gotcha:** if the contact isn't saved yet it shows as an unknown number. Pair this with an `unlockContact` effect, or mark the character `já salvo` (starts unlocked) on the Personagens tab.

### `Enviar contato` — shareContact

A character forwards **someone else's contact card** into a chat — like forwarding a number on WhatsApp. On delivery the contact is saved to the agenda (real name shows) and the player is freed to message them; tapping the card in-game opens that new chat.

- **`Quem envia o cartão`** (Who sends the card) — speaker.
- **`Conversa (thread)`** — where the card lands.
- **`Contato enviado`** (Contact being shared) — the character whose card it is.
- **`Texto junto do cartão`** (Caption, optional) and **`Tempo digitando (ms)`**.
- **`Efeitos`** — optional.

---

### `Tempo` — delay

A real-time pause: the flow only continues to the wired node after the wait. **`Tempo de espera (segundos)`** (Wait time in seconds). The clock is wall-clock — it keeps counting even with the game closed, so a 1-hour delay survives the app being shut. **Blocks** by design.

### `Atividade (digitando/gravando)` — activity

Pure presence: shows a character as `Digitando` / `Gravando áudio` / `Gravando vídeo` in a thread for a set time, then continues **without sending anything**. Use it to add weight to a pause before the next message.

- **`Quem aparece na atividade`** (Who's shown) — speaker.
- **`Conversa (thread)`**.
- **`Indicador`** (Indicator) — typing / recording audio / recording video.
- **`Duração (segundos)`**.

---

### Publishing & social nodes

These push content into the game's other apps as a standalone step in the flow (each is sugar over the equivalent effect, so you don't have to attach it to a message).

- **`Publicar notícia`** (`publishNews`) — publishes a registered news article to the News app (with a notification). `Notícia` (the article) + `Atraso até publicar (segundos)` (delay, `0` = immediate).
- **`Post no Mural`** (`publishPost`) — publishes a Mural `Post` and notifies the author's followers.
- **`Story no Mural`** (`publishStory`) — publishes a Mural `Story` (ring at the top of the feed).
- **`Liberar pauta (Blog)`** (`offerBlog`) — unlocks a Blog **pauta** (pitch): the draft appears under Rascunhos for the player to pick an angle and publish. The angle text and effects live on the **Blog** tab; here you only pick the `Pauta (matéria do Blog)`.
- **`Mural: comentário / curtidas`** (`socialActivity`) — the `O que faz` (What it does) dropdown chooses one of:
  - **`Comentar em um post`** — pick the `Post`, `Quem comenta` (character/NPC/player), `Texto do comentário`, an optional `Responder a` (reply target), `Curtidas iniciais`, and an optional `ID do comentário` (so you can set its likes later).
  - **`Definir curtidas de um post`** — pick the `Post` and the `Curtidas` count.
  - **`Definir curtidas de um comentário`** — pick the `Comentário` and the `Curtidas` count.
  - No notification is sent; if you want one, add a separate `notification` node.
- **`Mural: seguidores`** (`socialFollow`) — set a profile's `Seguidores` and/or `Seguindo` counts. Leave a field blank (`manter`) to leave that count unchanged.

---

### `Saldo (R$)` — bank

Credits or charges the player's bank balance as a standalone step. **`Valor em R$`** (positive = the player receives money, with a bank notification; negative = a silent charge) and an optional **`Descrição no extrato`** (statement description, e.g. "Pix de Eron").

### `Notificação` — notification

Fires a heads-up banner (banner + vibration) inside the game.

- **`App da notificação`** — which in-game app it impersonates: `Mensagens`, `Notícias`, `Mural`, `Tulu Bank`, `Blog`, or `Personalizada` (custom — no in-game app). For custom, also set `Nome exibido do 'app'`, an `Ícone` (icon picker), and `Cor de fundo do ícone (hex)`.
- **`Título`** / **`Texto`** (Title / body) and **`Tempo na tela (segundos)`** (default ~4s).
- **Tap target (priority order):** `Link externo` (real URL — leaves the game) > `Notícia` (opens in the in-game browser) > `Post` (Mural) > otherwise just opens the chosen app. Fill the field for the behaviour you want.

---

### `Chamada` — call

A simple scripted call. **Blocks** while it rings.

- **`Quem liga`** (Who calls) and **`Direção`** — `Recebida` (incoming, rings for the player) or `Realizada` (outgoing).
- **`Conversa para registrar a chamada perdida`** — optional thread where a missed call is logged.
- **`Falas da chamada`** (Call lines — one per line) — the scripted transcript.
- **`Mensagem de voz se recusar`** — optional voicemail if declined.
- **`Efeitos se ATENDER`** / **`Efeitos se RECUSAR`** — effects per outcome. Wire the **"atendeu"** (answered) and **"recusou"** (declined) handles to their next nodes on the canvas.

### `Ligação interativa` — callScene

A richer, interactive voice call that carries its **own private sub-flow** (a flowchart inside the flowchart): audio/MP3 lines, in-call reply choices, actions, conditions, and a hang-up step. It **blocks** like a regular call. This node's inspector holds only the general settings; the sub-flow is edited in a separate nested canvas opened with **`Abrir fluxo da ligação`** (Open the call's flow) — and is documented in its own section.

General settings here: `Quem liga`, `Direção`, `Toca por (segundos)` (ring duration; blank = until answered/declined), `Efeitos ao ATENDER`, plus `Se RECUSAR` (voicemail + thread + effects) and `Se NÃO ATENDER` (timeout — leave blank to treat like declined, fill to diverge a missed call). On the canvas, wire **"depois da ligação"** (after the call), **"recusou"** (declined) and **"não atendeu"** (no answer) to the next chapter nodes.

---

### `Evento` — event

Arms a **listener**: from this point on, whenever the player does a chosen action that matches the target and an optional condition, the event fires. Unlike most nodes it is *self-advancing* — it doesn't block (see the two exits below).

- **`Evento (o que o jogador faz)`** — `Faz uma ligação` (places a call), `Curte um post`, `Abre uma notícia`, or `Segue um perfil`. Switching the type clears the previous type's fields.
- **Match target** (varies by event): for a call, `Quando o jogador ligar para` (a contact) and/or `…ou número discado` (a dialed number) — leave both empty for *any* call; for the others, pick the post/news/profile, or leave empty for *any*.
- **`Condição`** — optional gating (trust, evidence, flag…).
- **For `playerCall`, `Desfecho`** (Outcome) — how the call plays on screen: `Só chamando` (rings, no answer), `Cai` (drops), `Recusada` (declined), or `Atendida` (answered). For **answered**, supply the call audio (`Mídia da biblioteca` or a direct MP3 link), a `Transcrição`, and `Encerrar após o áudio (ms)`.
- **`Efeitos quando o evento disparar`** — applied when it fires.
- **Two exits to wire:** `Quando o evento acontecer` (When the event happens — what plays on the trigger) and `Continuar agora` (Continue now). **Leave `Continuar agora` empty to make the story WAIT here** until the event happens; wire it to let the story continue while the listener runs in the background. A backgrounded listener stays armed until a `removeEvent` disarms it.

### `Remover evento` — removeEvent

Disarms an `event` node armed earlier so it stops firing. Self-advancing. Just **`Evento a remover`** — a dropdown of the `event` nodes in this chapter (a dangling/unknown target is kept visible, marked `evento não encontrado`, so it isn't silently lost).

---

### `Paralelo (várias saídas)` — fork

Splits the flow into several **parallel** delivery tracks that all run at the same time. Use it to deliver messages/effects/waits concurrently (e.g. two characters texting at once).

- **`Saídas`** (Outputs) — `Saída 1` is the **main line**; the rest run beside it. Add with `adicionar saída` (minimum two; you can't remove below two). Wire each output to its next node on the canvas.
- **Gotcha:** parallel tracks are delivery-only. Choices, calls and chapter-ends belong to the **main line** (output 1). An output that leads nowhere simply ends — that's fine.

### `Fim do capítulo` — chapterEnd

Closes the chapter. **Blocks** (it's a chapter transition).

- **`Próximo capítulo`** (Next chapter) — leave blank to continue with the next chapter in order, or pick a specific one.
- **`Encerrar num final`** (End on an ending, optional) — route straight to one of the authored endings.
- **`Efeitos`** — applied as the chapter closes.

> The underlying node also supports a completion `requirement` (an objective gate the chapter must satisfy before it closes) with a designer-only note — author these where that gating UI is exposed.

---

### Defaults & cleanup (good to know)

- **New nodes start sensibly:** a fresh `message` is system-spoken with `1400` ms typing; a `delay` starts at `60` s; an `activity` at `3` s; a `bank` at `R$ 50`; a `notification` defaults to the News app; a `fork` starts with two empty outputs. Adjust in the inspector.
- **The first node you add becomes the chapter's start** automatically; use `definir como início` to change it later.
- **Deleting a node auto-clears links to it** from every other node (next pointers, choice options, branch targets, fork outputs, call outcomes), so you never get dangling references from a delete — but always run `npm run validate-story` after exporting to catch any you wired by hand.

## 4. Conditions and effects

Conditions and effects are the two halves of *interactivity* in your story. A **condition** is a yes/no question the game asks about the current save ("has the player seen this evidence?", "did they pick the kind reply?"); an **effect** is a change the game writes into that save ("remember this flag", "deliver this evidence", "give R$50"). Everything that makes one playthrough differ from another is built from these two ingredients — there is no scripting, only filling in small forms in the inspector (the panel on the right when you click a node).

Both editors are recursive form builders: you pick a type from a dropdown, and the fields below change to match. You never type code.

### Where conditions are used

A condition appears anywhere the story needs to *ask before doing*:

- **Choice options — "só aparece se" (only appears if).** Each reply chip on a `Escolha` (Choice) node can carry one condition. If it isn't satisfied, the player simply never sees that option. This is the most common gate.
- **`Condição` / branch nodes (Branch).** A branch node holds a list of ramos (branches), each a `condition` → destination. The flow takes the **first** branch whose condition is true, and falls through to the `fallback` exit if none match. This is how you split the story down different paths.
- **Event gating.** An `Evento` (Event) node — which listens for a player action like placing a call or liking a post — has an optional condition that decides whether the event fires when triggered.
- **Chapter-end requirement.** A `Fim do capítulo` (Chapter end) node has a `requirement` condition: the chapter will not close until that condition is true in-game, letting you hold the player until they've done something (e.g. collected a piece of evidence).
- **Endings, Blog angles, Mural comment options.** Endings and the player-authored choices (Blog article angles, commentable-post options) also carry conditions.

To add a condition where one is optional, open the dropdown reading `sem condição (sempre) — + adicionar…` (no condition (always) — add). Removing it again (the `limpar` / clear button) means "always true."

### Every condition type

These are the entries in the `+ adicionar…` (add) dropdown, with their exact Portuguese labels:

| Label (in the editor) | Plain meaning | Fields you fill |
|---|---|---|
| `Flag está ativa` (flag is active) | A named flag has been set. | the flag name |
| `Flag é igual a` (flag equals) | A flag holds a specific value (text, number, true/false). | flag name + value |
| `Gênero do jogador` (player's gender) | The player picked this gender when starting. | `Masculino` / `Feminino` |
| `Confiança ≥` (trust ≥) | A character's hidden trust is at least N. | character + value 0–100 |
| `Confiança <` (trust <) | A character's trust is below N. | character + value 0–100 |
| `Tem evidência` (has evidence) | The player already holds this evidence file. | the evidence |
| `Escolheu opção` (chose option) | The player previously picked the choice option with this id. | the option id (typed) |
| `Capítulo concluído` (chapter completed) | A given chapter has been finished. | the chapter |
| `Saldo no banco ≥ (R$)` (bank balance ≥) | The player's bank balance is at least this amount. | amount in R$ |
| `Transferiu ao personagem ≥ (R$)` (transferred to character ≥) | Total the player has paid into a character's account is at least this. | character + amount |
| `Curtiu um post (Mural)` (liked a post) | The player has (or hasn't) liked a specific Mural post. | post + Sim/Não toggle |
| `Curtiu um comentário (Mural)` (liked a comment) | The player has (or hasn't) liked a Mural comment. | comment + Sim/Não toggle |
| `Abriu uma notícia` (opened a news article) | The player has (or hasn't) opened a news article. | news + Sim/Não toggle |
| `Segue um perfil (Mural)` (follows a profile) | The player does (or doesn't) follow a Mural profile. | profile + Sim/Não toggle |
| `TODAS as condições (E)` (ALL — AND) | All sub-conditions must be true. | a nested list |
| `QUALQUER condição (OU)` (ANY — OR) | At least one sub-condition must be true. | a nested list |
| `NÃO (negação)` (NOT — negation) | Inverts a single sub-condition. | one nested condition |

Notes on specific types:

- **`Gênero do jogador`** reads the gender the player chose at the start of the game and is perfect for swapping pronouns or tailoring a line ("Masculino" = `m`, "Feminino" = `f`).
- **Trust is hidden from the player** — these conditions read it but the number is never shown in-game. Pick a character and a threshold; remember that `Confiança ≥` and `Confiança <` are separate types, so a "between" range needs both inside a `TODAS as condições`.
- **`Escolheu opção`** matches by the option's **id**, which you type by hand (e.g. `c_help`). Make sure it matches the id you gave the choice option exactly, or the check silently never fires.
- **`Transferiu ao personagem`** only works if that character has a "Conta bancária" (bank account) filled in on the Personagens (Characters) tab — the editor reminds you with a hint.
- **`Curtiu um comentário`** only works for comments that have an **id** set; the editor notes "Só comentários com 'id' definido podem ser checados aqui." (only comments with a defined id can be checked here).
- **The four Mural conditions** use a `Sim / Não` (Yes / No) toggle so you can test either "did do it" or "did NOT do it" — e.g. `Não — não segue` (No — does not follow).

### Nesting: TODAS, QUALQUER, NÃO

The last three types let you combine conditions, and they nest freely:

- `TODAS as condições (E)` — true only when **every** sub-condition is true (logical AND).
- `QUALQUER condição (OU)` — true when **at least one** is true (logical OR).
- `NÃO (negação)` — flips a single sub-condition.

Inside `TODAS`/`QUALQUER` you'll see numbered cards and a `+ adicionar sub-condição…` (add sub-condition) dropdown; each sub-condition can itself be another `TODAS`/`QUALQUER`/`NÃO`, so you can express things like "trust ≥ 60 **AND** (has the photo **OR** chose to help)" by nesting boxes. Keep nesting shallow when you can — a deep tree is hard to re-read later.

### Where effects attach

Effects always live in a list (the inspector calls the section `Efeitos`). They run **in order, top to bottom**, the moment the node is processed. You can attach an effects list to almost every node and branch point:

- **`Mensagem` (Message) nodes** — fire effects as the message is delivered (the classic "this message also hands you the evidence" pattern).
- **`Ação` (Action) nodes** — a node whose *only* job is to run effects, then continue.
- **Choice options** — effects on a reply fire when the player picks it (this is how a choice changes trust or sets a flag).
- **`Chamada` / `Ligação interativa` (Call / interactive call)** — effects on answer/decline, on call connect, and inside individual call steps.
- **`Liberar mensagem` (Unlock message)** and **`Enviar contato` (Share contact)** nodes carry optional effects.
- **`Fim do capítulo` (Chapter end)** — effects that fire as the chapter closes.

Many effects also have a standalone node form (e.g. `Publicar notícia`, `Saldo (R$)`) that is just sugar over the matching effect — use whichever is tidier on the canvas.

### Every effect type

Open the `+ adicionar…` (add) dropdown in the `Efeitos` section to pick one:

| Label (in the editor) | What it does |
|---|---|
| `Definir flag` (set flag) | Stores a flag. Leaving "Valor" (value) blank stores `true`; you may store text, a number, or true/false. |
| `Alterar confiança` (change trust) | Adds (or subtracts, with a negative) trust for a character. |
| `Desbloquear contato` (unlock contact) | Saves a character into the agenda (before this they show as an unknown number). |
| `Entregar evidência` (deliver evidence) | Files an evidence item into the player's case folder. |
| `Publicar notícia` (publish news) | Releases a news article; optional `Atraso da notificação` (notification delay) in seconds (0 = immediate). |
| `Publicar no Mural (rede social)` (publish to Mural) | Posts a pre-authored Mural post. |
| `Publicar story no Mural` (publish Mural story) | Releases a Mural story slide. |
| `Liberar pauta (Blog)` (release Blog draft) | Drops a draft article into the Blog app for the player to compose and publish. |
| `Registrar na linha do tempo` (add to timeline) | Adds a timeline event (a title and optional "Detalhe"); an id is auto-generated. |
| `Dinheiro (crédito ou cobrança no banco)` (money) | Credits the player (positive R$) or charges them (negative R$), with an optional statement "Descrição no extrato" (reason). |
| `Travar final` (lock ending) | Forces a specific ending (a hard override). |
| `Pontuar final` (score ending) | Nudges an ending's soft score up or down by N points. |
| `Presença (online / offline)` (presence) | Shows a contact as `Online` or `Offline (visto por último)` (last seen) in the messenger header. |
| `Mural: comentar em um post` (comment on a post) | Posts a comment as a character/NPC/the player; optional reply-to, starting likes, and a comment id for later editing. |
| `Mural: curtidas de um post` (post likes) | Sets a post's displayed like count. |
| `Mural: curtidas de um comentário` (comment likes) | Sets a comment's displayed like count (by comment id). |
| `Mural: seguidores / seguindo` (followers / following) | Sets a profile's follower / following counts; leave a field blank to keep its current value. |

Notes on specific effects:

- **`Travar final` vs `Pontuar final`.** "Pontuar final" adds soft points and lets the strongest-scoring ending win at the end; "Travar final" is a hard lock that forces one ending regardless of score. Reach for scoring for most of the story and locking only for a true point-of-no-return.
- **`Alterar confiança` and `Pontuar final`** take a `±` value — type a negative number to subtract.
- **`Mural: comentar em um post`** — if you give the comment an id (the optional "ID do comentário" field), you can later target it with `Mural: curtidas de um comentário` or a `likedComment` condition.
- **`Mural: seguidores / seguindo`** — empty fields read as "manter" (keep), so you can bump just followers without touching the following count.

### Flags: no registry, just type a name

Flags are the editor's general-purpose memory, and they are intentionally lightweight: **a flag exists the instant you type its name into a `Definir flag` effect or a `Flag está ativa` condition.** There is no separate "flags" list to register or declare — naming it *is* creating it.

To keep names consistent, the flag field (used in both editors) shows the **list of flags already used anywhere in the story** as you type, so you can reuse an existing one instead of accidentally inventing a near-duplicate.

Two gotchas worth internalizing:

- **Spelling is the contract.** `falou_com_mae` and `falouComMae` are two different flags. A typo in a condition means the gate silently never opens. Pick the name from the suggestion list whenever the flag already exists.
- **Set it before you read it.** A `Flag está ativa` condition only sees flags that some earlier effect actually set on the path the player took. If a flag is only set on *some* branches, gating a later line on it is correct; gating on a flag that was never set anywhere just makes that option permanently invisible.

### Worked example 1 — gate a choice behind a flag

Goal: the player can only say "I'll meet you at the pier" after they've agreed to help.

1. On the earlier **choice** where the player agrees to help, open that option's `Efeitos` and add `Definir flag`. Type the flag name `aceitou_ajudar` (leave "Valor" blank → it becomes `true`).
2. On the later **choice**, select the "meet you at the pier" option and open its condition dropdown (`sem condição (sempre) — + adicionar…`). Pick `Flag está ativa` and choose/type `aceitou_ajudar`.

Now that reply only appears for players who agreed earlier; everyone else never sees it, so no path can reference a promise that wasn't made (this is exactly the script-coherence rule the game cares about).

### Worked example 2 — branch on the player's gender

Goal: a character addresses the player differently by gender.

1. Drop a `Condição` (Branch) node into the flow.
2. In its first ramo (branch), set the condition to `Gênero do jogador` → `Feminino`, and point its `next` at the message node that uses feminine wording.
3. Set the branch's `fallback` (the catch-all exit) to the masculine-wording message node.

Because a branch takes the **first** matching condition and otherwise the fallback, you only need to author the one feminine branch — every other player falls through to the masculine line. (If you'd rather be explicit, add a second ramo with `Gênero do jogador` → `Masculino` instead of relying on the fallback.)

> **Tip:** when a path needs *both* a memory change and a visible result — say, lower a character's trust *and* mark a flag — just stack multiple effects in the same `Efeitos` list; they run top to bottom in one beat, so order them the way you'd want them to read.

## 5. Registries

Registries are the editor's **content libraries** — everything the story *refers to* but that isn't part of the flowchart itself: the cast, the evidence, the media files, the news, the fake websites, the social network, the player's blog, the ads and the endings. You build these registries once, give each item a short **ID**, and then your chapter nodes simply point at those IDs (e.g. a `message` node attaches an evidence by its id, an `addEvidence` effect names one, a chat link opens a web page by its id). Keeping content in registries means you never paste the same audio link or character name twice — you change it in one place and every node that references it updates.

> Tip — load before you edit: the registries you see are whatever is currently in memory. If you want to work on the live game's content, start every session with `⟳ carregar do jogo` (reload from the game) at the top of the editor before touching anything, and `⬇ exportar story.json` (export story.json) when you're done.

### The shared registry layout (how every tab works)

Almost every registry tab uses the same two-pane layout, so once you learn one you know them all:

- **Left pane — the list.** A big `+ Novo…` / `+ Nova…` (New…) button at the top creates a fresh item and a starter ID, followed by the list of existing items. Each row shows a **title**, an optional **subtitle**, and the item's `id` in monospace at the bottom. Click a row to select it.
- **Right pane — the form.** Editing happens live: every keystroke is saved into the bundle immediately (there's no "save" button per item). At the top sits a red `excluir` (delete) button that removes the selected item and clears the form.
- **Empty state.** With nothing selected you'll see *"Selecione um item à esquerda ou crie um novo."* (Select an item on the left or create a new one.)

Some tabs add two extra conveniences:

- **Grouping** — items are split into labelled sections (e.g. web pages grouped by domain, posts grouped by author). The group header shows a count chip. Grouping is purely visual; it changes nothing in the exported file.
- **Filtering / search** — a sticky toolbar above the list (e.g. an author dropdown plus a text search). Filtering only narrows what you *see*.

> Gotcha — renaming an ID is the one dangerous edit. Every registry exposes an **ID** field. Editing it is allowed, but the field is labelled with a warning for a reason (for characters it reads literally `ID (usado nos nós — cuidado ao mudar)` — *ID (used by nodes — be careful changing it)*). Under the hood a rename **deletes the old id and recreates the item under the new one**. The editor does **not** rewrite the nodes, effects, conditions, links, attachments or author fields that still point at the old id — those references silently break. Decide on IDs early; if you must rename one that's already wired into the story, run `npm run validate-story` afterward to catch every dangling reference. The new id is also auto-slugified (lowercased, accents stripped, spaces → `_`, max ~24 chars), so what you type may be cleaned up.

---

### Personagens (Characters)

The cast. The list shows each character's display **name** with their **role** as subtitle. This tab defines a character's **Contacts/chat identity** only — their face and bio inside conversations. Their separate presence on the social feed (the *Mural*) lives in `Rede Social → Perfis` (see below); the form reminds you of this.

Fields:

- **ID** — used by nodes; mind the rename warning above. New characters get an auto id like `p1`, `p2`.
- **Nome de exibição (no chat)** (display name in chat) — what shows in the messenger. Typing a name here auto-fills the avatar **initials** the first time (first two letters, uppercased) if you haven't set them.
- **Nome completo** (full name) and **Idade** (age).
- **Papel na história** (role in the story) — e.g. `Irmão de Lia`. Shown as the list subtitle.
- **Capítulo em que surge (referência)** (chapter where they appear — reference only) — a chapter picker, purely a note for you.
- **Número de telefone** (phone number) — shown as the contact's number *before* the player saves them. Leave blank for an automatic fake number.
- **Já salvo na agenda desde o início** (already saved in the agenda from the start) — the `startsUnlocked` checkbox. Check it for family/friends who should be pre-saved in the player's contacts at new-game (otherwise the character appears as an unknown number until an `unlockContact` effect reveals them).
- **Conta bancária fictícia** (fictional bank account) — `bankAccount`. If set, player money transfers to *this number* are treated as reaching this character.
- **Avatar** — three layered options, checked in priority order: **Iniciais do avatar** (avatar initials, max 2 chars) + **Cor do avatar (hex)** (avatar color) as the fallback; **Foto de perfil (mídia)** (profile photo — media), which picks an image from the Media library; or **link direto da foto** (direct photo link) as a last resort. The media pick wins over the link.
- **Bio pública (sem spoiler)** (public bio — no spoilers) — shown on the Contacts profile, so keep it spoiler-free.
- **Estilo de escrita** (writing style) — a note to the writers about this character's texting voice. It never appears in-game.

A live **profile preview card** on the right (tagged `pré-visualização`) renders the avatar, name, role and bio as you type.

#### Conversa inicial (initialChat) — the pre-existing chat

At the bottom of the character form is the `Conversa inicial (já existe ao começar o jogo)` (initial conversation — already exists when the game begins) editor. Use it to seed a few **already-read** everyday messages so a saved/known contact doesn't start with an empty thread. Each message has:

- **Enviada pelo jogador** (sent by the player) — checkbox; unchecked means the character sent it.
- **Texto** (text).
- **Minutos atrás** (minutes ago) — how long before game start the message was sent. The hint spells it out: `1440 = um dia antes` (one day before). New messages auto-step backward in time so they stay in order.

> Tip: initial chats read best on contacts that are *already saved* (`startsUnlocked`), since the fiction is that you and this person already talk.

---

### Evidências (Evidence)

The case files the player collects. List title is the evidence **title**; subtitle is its human-readable kind. Fields:

- **ID**, **Tipo** (type) — one of `Foto`, `Vídeo`, `Áudio`, `Documento`, `Print` (screenshot), `Localização`, `Reportagem`.
- **Título** (title) and **Descrição curta** (short description).
- **Quem envia (metadado)** (who sends it — metadata) — the source character, a metadata note.
- **Ligação com o caso (metadado)** (relevance to the case — metadata) — your own note on why it matters.
- **Mídia da biblioteca** (library media) — the image/audio/video from the Media library, or a **link direto** (direct link) fallback.
- **Cor da miniatura** (thumbnail color, hex) — fallback when there's no image.
- **Conteúdo/transcrição** (content/transcript) — full text, for documents or audio transcripts.

> Evidence is *delivered* in-game by an `addEvidence` effect (usually riding alongside a message attachment) — registering it here only defines it.

---

### Mídias (Media library)

The central library of reusable files. Register an MP3/video/image **once** here, then point at it from messages, calls, evidence, news, blog, Mural posts and profile photos — instead of pasting the same URL across many nodes. List subtitle shows the kind and, if set, the category. Fields:

- **ID**, **Nome** (name).
- **Tipo** (type) — `Imagem`, `Áudio (MP3)` or `Vídeo`.
- **Categoria** (category) — a free-text organizational label (e.g. `Lia — fotos`). Ignored by the game. It's a **type-to-create** field: existing categories appear as autocomplete suggestions, and typing a brand-new one creates it on the spot.
- **URL do arquivo** (file URL) — where the file actually lives.

---

### Notícias (News)

Articles for the in-game news browser. List title is the **headline**, subtitle is the outlet. Fields:

- **ID**, **Veículo** (outlet), **Manchete** (headline), **Data exibida** (displayed date — free text like `Quinta passada`).
- **Imagem da matéria** (article image) — Media library pick or a **link direto** fallback.
- **Texto da matéria** (article body) — a blank line splits paragraphs on the in-game site.
- **Visível desde o início do jogo** (visible from the start) — the `initial` checkbox, for general/filler news unrelated to the plot.

> Gotcha: if an article is **not** marked initial, the form reminds you it won't appear until a node fires it — *"use o efeito 'Publicar notícia' em algum nó"* (use the "Publish news" effect on some node).

---

### Páginas Web (Web Pages)

Fictional websites that open in the in-game browser when a character drops a link into a chat. Pages are **grouped by domain** (organization only). List subtitle is the full URL. Fields:

- **ID** — note the field label `ID (usado no link {{page:id}})`: the page is referenced from message text via the `{{` link menu.
- **Domínio fictício** (fictional domain) — also the grouping key; a type-to-reuse field with existing domains as suggestions (e.g. `ravenwoodgazette.com.br`).
- **Caminho (opcional)** (optional path) — appended after the domain. The form shows the resulting **Endereço exibido** (displayed address) live.
- **Título da página** (page title).
- **Imagem de capa** (cover image) — Media pick or direct link.
- **Conteúdo da página** (page content) — blank lines split paragraphs.

> The how-to is in the form's own tip: a character sends the link in a message — type `{{` in the message text and choose **Links**.

---

### Rede Social (Social)

The *Mural* (the in-game social network). This tab has a top toolbar with four sub-modes, each showing a live count:

`Publicações` (posts) · `Stories` · `Perfis — Elenco` (Profiles — Cast) · `Perfis — NPCs` (Profiles — NPCs)

A key concept binds them together: **a Mural profile is separate from a chat identity.** A character's name/photo in *Conversas* lives in the `Personagens` tab; their photo/bio/followers on the *Mural* live here under `Perfis — Elenco`. The **author** of any post/story/comment is an account id: a character id, an NPC id, or the special `player`.

#### Publicações (posts)

The feed posts. The list can be filtered by an **author dropdown** (`Todos os autores` = all authors) plus a **caption search** (`buscar legenda…`); with no author filter, posts are grouped by author. Post fields:

- **ID**, **Autor** (author — character/NPC/player picker).
- **Imagem da publicação** (post image — Media pick or link; blank = text-only post).
- **Legenda** (caption), **Curtidas (número base)** (likes — base count), **Data exibida** (date).
- **Visível desde o início do jogo** (`initial`) — otherwise the post enters the feed via a `publishPost` effect/node, which also notifies the player.
- **Comentários** (comments) — authored comments under the post. Each has an **Autor**, **Texto**, an optional **ID** (`opcional — necessário p/ ser curtido ou respondido` — required only if it must be likeable or a reply target), a base like count, and a **Responde ao comentário** (replies to comment) dropdown listing the other commented IDs.
- **Comentários do jogano** — the `Comentários do jogador (opcional)` (player comments — optional) section. These are **pre-written comments the player may post**, and each is a narrative choice: a button **Texto** (button text), an optional **Comentário publicado** (what actually gets posted, defaults to the button text), an optional reply target, a `Só aparece se…` (only appears if…) condition, and **effects**. A post with **no** player comment options simply isn't commentable in-game.

#### Stories

Mural story slides. Same author filter/search/grouping as posts. Fields: **ID**, **Autor**, **Imagem de fundo** (background image — Media or link; blank = gradient with text), **Texto sobreposto** (overlaid text), **Duração na tela (segundos)** (on-screen duration), **Data exibida**, and **Visível desde o início do jogo**. Several stories by the same author chain into one sequence (multiple progress bars). Non-initial stories enter via the `publishStory` effect (with a notification).

#### Perfis — Elenco (Cast profiles)

The Mural profiles of the **story cast** — the player plus each character's *optional* Mural presence. The left list always starts with a **Você (o jogador)** (You — the player) entry (id `@player`), then the **Elenco** (cast) grouped below.

- **Player profile** (`PlayerMuralEditor`): the player's own Mural identity — **separate from their chat identity**. Fields: `@ no Mural` (handle, default `voce`), display **Nome** (defaults to the player's chosen name), **Bio** (this is where you establish *who the player is* in the story), avatar **Cor**/**mídia**/**link**, and **Seguidores/Seguindo** counts (blank = automatic).
- **Character Mural profile** (`CharacterMuralEditor`): editing a cast member's Mural presence happens *here*, not in `Personagens`, because a character may or may not be on the Mural. By default a character has **no own profile** — if they post, they appear with their *Conversas* photo and bio. Click `personalizar perfil no Mural` (customize Mural profile) to give them a separate handle, bio, follower counts and avatar (which falls back to the chat avatar if left blank). A `remover presença no Mural` (remove Mural presence) button reverts them to inheriting from chat. Both editors offer **O jogador já segue este perfil desde o início** (the player already follows this profile from the start).

Both cast editors include a **publicações/stories** section that lists that account's existing Mural content with quick `nova`/`novo` buttons that **pre-fill the author** and jump you straight into the Publicações/Stories editor — this is what visibly links content to its profile.

#### Perfis — NPCs (NPC profiles)

Filler Mural accounts with **zero story relevance** — they just make the network feel alive. Fields: **ID** (becomes the `@usuário`), **Nome do perfil**, avatar **Cor**/**URL**, **Bio**, and **O jogador já segue este perfil desde o início** (default: followed; unfollowed NPCs only surface through Mural search). Like cast profiles, each NPC editor lists/creates that account's posts and stories.

> The auto NPC generator: at the top of the NPC tab, `Gerar perfis automaticamente` (generate profiles automatically) fetches Brazilian names + photos from `randomuser.me`. Enter a count (1–50) and hit `gerar`. It creates NPCs with unique ids, random avatar colors and a small-town flavor bio — then you edit bios and add their posts. It needs internet; on failure it shows *"Falha ao gerar — verifique sua conexão e tente de novo."*

---

### Blog (player-published matérias)

Articles the **player** can publish from the in-game Blog app. The list subtitle shows the number of angles. Fields:

- **ID** — labelled `usado no efeito/nó 'Liberar pauta'`: the article reaches the player as a draft via the `offerBlog` effect/node, then appears under *Rascunhos* (drafts).
- **Título da matéria** (article title).
- **Imagem da matéria** (article image) — a small `Link` / `Evidência` toggle plus a recommended **Media library** pick. Priority in-game is **mídia > link > evidência** (when set to *Evidência*, the chosen evidence's media becomes the cover).
- **Data / assinatura exibida** (displayed date/byline — optional).
- **Story no Mural ao publicar** (publish to a Mural story) — optional `socialStories` id (with author `player`) the player can share after publishing.
- **Ângulos da matéria** (article angles) — the heart of the Blog. Each angle is an editorial choice the player picks when composing: a **Rótulo** (label, e.g. ethical vs. sensationalist), the **Texto publicado** (published body — blank line splits paragraphs), a `Só aparece se…` condition, and **effects**. The chosen angle's body becomes the published text and its effects fire — handy for scoring endings.

---

### Anúncios (Ads)

Paid ads — pure **ambience**, not story content. They appear on their own with no flow node: in the Mural as a "Patrocinado" (sponsored) post and in the browser as banners. List subtitle shows the placement (or `pausado` if inactive). Fields:

- **ID**, **Marca / anunciante** (brand — becomes the ad's name and @).
- **Logo da marca (URL)** (brand logo), **Imagem do anúncio (URL)** (ad image; blank = gradient).
- **Texto do anúncio** (ad text), **Botão (call-to-action)**, **Endereço fictício** (fictional address opened on tap).
- **Onde aparece** (where it appears) — `Mural + Navegador` (both), `Só no Mural` (social only), or `Só no Navegador` (browser only).
- **Anúncio ativo** (active) — uncheck to pause an ad without deleting it.

---

### Finais (Endings)

The run's possible endings. List title is the **título**, subtitle the tagline. Fields: **ID**, **Título**, **Tagline**, **Resumo** (summary), and **Cenas finais** (final scenes — one per line, played in sequence). The form's tip explains how the game *reaches* an ending: either the `setEnding` effect (`Travar final` — lock ending, decisive) or the `lockEndingScore` effect (`Pontuar final` — score ending, highest total wins), combined with a `chapterEnd` node that names this ending.

> Gotcha: registering an ending here doesn't make it reachable — you still need the locking/scoring effects plus a chapter-end that routes to it. Run `npm run validate-story` to confirm nothing references a non-existent ending id.

## 6. Message variables, links and emoji

When you write a character's line in a **Mensagem** (message) node, the `Texto da mensagem` (message text) field is more than a plain box. It can weave in the player's own name and gender, drop in tappable in-game links, and let you sprinkle in emoji — all without typing any code by hand. This section explains every helper the field offers, what each one becomes in the actual game, and the small traps to watch for.

### The `{{` menu

Type two open braces — `{{` — anywhere in a text field and a small dropdown pops up right under the field. This is the **insert menu**. It is grouped into categories, each with its own icon and heading:

- `Personagem` (Character)
- `Variáveis` (Variables)
- `Links` (Links) — *only on the message node text*

Each row shows a little code chip (the address or token preview) and a friendly label. Click a row and the editor writes the matching token at your cursor, replacing the `{{` you just typed. Your cursor is left right after the inserted token so you can keep typing.

**Type-ahead / filtering.** After you type `{{` you can keep typing a few letters (e.g. `{{play`, `{{post`, `{{ela`) and the menu narrows to matching rows. The filter looks at the token text, the code chip, *and* the human label — so typing part of a page title or a character's name also finds the right link. Press `Escape` (or click away) to dismiss the menu without inserting anything.

> Tip: you don't have to type the closing braces. Picking from the menu always inserts the complete, correctly-formed token, braces and all.

### Personagem — the player's name

The `Personagem` group has two tokens. They are filled in **at delivery time in the game** — that is, the player sees their own name, not the token:

| Token | Becomes in-game | Use it for |
| --- | --- | --- |
| `{{player_name}}` | The full name the player typed at the start (e.g. *Alex Moreno*) | Formal or first-time address |
| `{{player_first_name}}` | Just the first word of that name (e.g. *Alex*) | The casual, everyday way characters text |

If the player only entered a single word, `{{player_first_name}}` simply equals the whole name — there's no risk of an empty line.

### Variáveis — gender

The `Variáveis` group handles the player's chosen gender. Like the name tokens, these resolve **when the message is delivered in the game**, so they always match whoever is playing.

| Token (what gets inserted) | Menu chip | Becomes in-game |
| --- | --- | --- |
| `{{player_gender}}` | `{{player_gender}}` | the pronoun `ele` / `ela` |
| `{{g:masculino\|feminino}}` | `{{g:masc\|fem}}` | the masculine half before the `\|`, or the feminine half after it |

- `{{player_gender}}` is a fixed pronoun swap: it renders `ele` for a male player and `ela` for a female player.
- `{{g:masculino|feminino}}` is the flexible one — **you edit both halves yourself**. Whatever you write before the `|` shows for a male player; whatever you write after shows for a female player. For example `{{g:obrigado|obrigada}}`, `{{g:ele mesmo|ela mesma}}`, or `{{g:meu caro|minha cara}}`.

> Gotcha: after inserting `{{g:masculino|feminino}}` you must replace the placeholder words `masculino` and `feminino` with your real two variants. If you leave them, the player will literally read the word "masculino" or "feminino". The menu label even reminds you: `Texto por gênero (edite os dois)` (gendered text — edit both).

> Gotcha: keep exactly one `|` between the two options, and don't nest other tokens inside the `g:` pair.

**Unknown tokens stay visible on purpose.** If you misspell a token (say `{{player_nme}}`), the game leaves it untouched and shows it as-is. That's a feature: a stray `{{...}}` jumping out at you during playtesting is how you catch a typo, instead of a line silently going blank.

### Links — tappable in-game links

The `Links` group is special and appears **only on the message node text field**. Picking an item inserts one of four link tokens:

| Token | Points at | Opens in-game |
| --- | --- | --- |
| `{{page:id}}` | An authored fictional web page (the `Páginas Web` registry) | the in-game **browser** |
| `{{news:id}}` | A news article | the in-game **browser** (the article's fictional site) |
| `{{post:id}}` | A Mural post | the **Mural** app |
| `{{profile:id}}` | A Mural profile — a case character, an NPC, or the player | the **Mural** app |

What the player sees: in the chat bubble, a link token is **not** printed as raw text. It renders as a **tappable link showing a fictional address**, and tapping it opens the matching in-game screen. It never opens a real website. A few concrete examples of the addresses the game shows:

- a news link reads like `gazetaderavenwood.com.br/noticias/jovem-desaparecida`
- a post or profile link reads like `mural.app/@handle` (the author's Mural handle)
- a page link reads like its own domain plus path (see Web Pages below)

Because these are links and not text variables, they are deliberately left alone by the name/gender substitution — they survive untouched all the way to the chat renderer, which is the only thing that turns them into clickable links. (That's also why the Links category isn't offered on plain text fields: a link only does anything inside a message bubble.)

> Tip: the menu's code chip previews the address or handle the link will show — e.g. `notícia`, `post @lia`, `perfil @você` — so you can confirm you grabbed the right one at a glance.

The `{{profile:...}}` list always includes a `Perfil do jogador (Mural)` (the player's own Mural profile) at the top — inserted as `{{profile:player}}` — followed by every case character and every Mural NPC.

### Web Pages feed the Links menu

The `Links` menu doesn't invent its options — it is built live from your registries. Specifically, the `Páginas Web` (Web Pages) registry is what populates the `{{page:...}}` entries:

- Every page you've created appears as one row in the `Links` group.
- The row's **code chip is the page's fictional address**, assembled from its `domain` plus its optional `path` (for example `arquivoscorvo.org/dossie/lia`). If a page has no path, just the domain shows.
- The row's **label is the page title** (falling back to the page id if it has no title).

The same live wiring applies to the other three kinds: news articles feed `{{news:...}}`, Mural posts feed `{{post:...}}`, and characters + NPCs + the player feed `{{profile:...}}`. So the practical workflow is: **create the page / news / post / profile first in its registry, then come back to the message and pick it from the `{{` menu.** A link you haven't authored yet simply won't be in the list.

> About "domain grouping": the address you see in the menu and in-game is grouped under the page's own domain — pages that share a `domain` read as living on the same fictional site (e.g. several `arquivoscorvo.org/...` pages). Set a consistent `domain` across related pages so the in-game browser addresses feel like one coherent website.

> Gotcha: if you rename or delete a page/post/profile after referencing it, the token still holds the old id. Re-pick from the menu (or fix the id) so the link resolves — and run `npm run validate-story` to catch dangling references before they reach the app.

### The emoji button

The message field has a small smiley button (`Inserir emoji` / "Insert emoji") tucked in its corner. Click it to open an emoji picker; click any emoji and it is dropped in **at your cursor position** (right where you were typing), then the picker closes. The picker has its own search box, so you can type to find an emoji.

- The emoji is inserted exactly like a typed character — it becomes part of the line's text and shows in the chat bubble as-is.
- Emoji inside a character's *message text* is part of their texting voice and is perfectly fine. (The rule about "no emoji in chrome" is about the app's UI, not the words a character types.)

> Tip: the picker remembers where your cursor was even while it's open, so the emoji always lands where you left off — no need to re-click into the text first.

### Where each helper is available

Not every field offers everything:

- **Message node `Texto da mensagem`** — the full kit: `Personagem` + `Variáveis` + `Links` in the `{{` menu, **plus** the emoji button. This is the only place the `Links` category and the emoji button appear.
- **Other plain text fields** (choice button text, the optional spoken line, prompts, voicemails, call transcripts, reminder text, etc.) — still offer the `{{` menu with `Personagem` and `Variáveis`, so `{{player_name}}`, `{{player_first_name}}`, `{{player_gender}}` and `{{g:...|...}}` work in those lines too. They do **not** offer the `Links` category or the emoji button.

> Why the split: name and gender variables make sense anywhere a player reads text, so they're everywhere. Links only do something as a tappable element inside a chat bubble, so they're reserved for the message text — putting a `{{page:...}}` token in, say, a choice button would just show as literal text and never become a link.

## 7. Interactive calls

The `Ligação interativa` (interactive call) node — type `callScene` in the data — is the most powerful storytelling tool in the editor for voice scenes. Unlike an ordinary chat exchange, it *blocks* the main story: the phone rings, the player answers (or doesn't), and then a whole second flowchart plays out **inside** the call — audio lines, reply choices, branches, pauses — until someone hangs up and the story resumes. Think of it as "a flowchart inside the flowchart."

This section covers the two layers you author: the **outer call node** (who calls, ringing, what happens on answer/decline/timeout) and the **inner sub-flow** (the spoken scene itself).

### 7.1 Which call node should I use?

There are two call nodes. Pick deliberately.

| Node | Label in the add menu | Use it when… |
| --- | --- | --- |
| `call` | `Chamada` (Call) | You want a *simple* scripted call: a fixed list of spoken lines (one per line of text), an optional voicemail if refused, and just two outputs — `atendeu` (answered) / `recusou` (refused). No in-call player choices, no branching. |
| `callScene` | `Ligação interativa` (Interactive call) | You want an *interactive* call: the player picks replies mid-call, audio MP3s play, effects fire at specific beats, the call can branch on conditions, and a missed call can diverge from a refused one. |

For the plain `Chamada`, you fill `Falas da chamada (uma por linha)` (call lines, one per line) directly in the inspector and wire `atendeu`/`recusou` on the canvas — that's it. Everything below is about the richer `Ligação interativa`.

> **Tip:** If you only need "character calls, says a couple of lines, player can't really respond," the simple `Chamada` is faster and less to maintain. Reach for the interactive call only when the player actually *talks back* or the call needs to branch.

### 7.2 The outer call node — general settings

Add a `Ligação interativa` node to a chapter, select it, and the inspector shows its **general configuration** (the spoken scene lives elsewhere — see 7.3). Fields:

- **`Quem liga` (Who's calling)** — the character on the line. Required for the on-screen name/avatar.
- **`Direção` (Direction)** — choose:
  - `Recebida (toca para o jogador)` (Incoming — rings for the player) — the default.
  - `Realizada` (Outgoing) — the player is placing the call.
- **`Toca por (segundos — vazio = até atender/recusar)` (Rings for N seconds — empty = until answered/refused)** — how long the phone rings before it auto-misses. Leave it **empty** (or `0`) to ring until the player acts; set e.g. `20` to let the call "time out" into a missed call.
- **`Efeitos ao ATENDER (conectar)` (Effects on ANSWER / connect)** — effects that fire the moment the player accepts and the call connects (e.g. raise trust, set a flag). These run *before* the sub-flow plays.

Then two outcome blocks for when the player does **not** take the call:

- **`Se RECUSAR` (If REFUSED)** — the player taps decline. You can author:
  - `Recado de voz (opcional)` (Voicemail, optional) — text left in a chat as a missed-call voicemail.
  - `Conversa do recado (vazio = a de quem ligou)` (Voicemail thread — empty = the caller's) — which conversation the voicemail lands in; defaults to the caller's own thread.
  - `Efeitos se RECUSAR` (Effects if REFUSED).
- **`Se NÃO ATENDER (tempo esgotou)` (If NOT ANSWERED — timed out)** — fires only when `ringSeconds` runs out with no action. It has its own `Recado de voz` and `Efeitos se NÃO ATENDER`. **Leave this block empty to treat a timeout exactly like a refusal**; fill it in only when you want a missed call to diverge (different voicemail, different effects, different next node).

> **Gotcha:** The timeout block only ever matters if you set a `Toca por` value. With no ring limit, the call waits forever and `Se NÃO ATENDER` never triggers.

### 7.3 Entering the call's own sub-flow

At the top of the `callScene` inspector is a big accent button:

> `Abrir fluxo da ligação (N passo(s))` — **Open the call's flow (N step(s))**

Click it to drill into the **nested sub-canvas** — a second flowchart that belongs only to this call. This is where you script what's actually *said and chosen* once the call connects. The button's counter shows how many steps the scene already has.

Once inside, a breadcrumb toolbar appears reading **`Ligação de <caller> · subfluxo`** (Call from \<caller\> · sub-flow). To return to the chapter, click **`voltar ao capítulo` (back to the chapter)** at the left of that toolbar. (The `capítulos` and `inspetor` toggles on the same bar just show/hide the side panels — they do **not** leave the sub-flow.)

The sub-canvas behaves just like the chapter canvas: drag steps around, connect them by dragging from a step's right-edge handle, delete an edge by selecting it and pressing `Delete`, and use the minimap/zoom controls. Step positions are saved separately from the chapter layout, so the nested flow keeps its own tidy arrangement.

### 7.4 The call STEP types

Inside the sub-flow you don't add story *nodes* — you add call **steps** via **`Adicionar passo` (Add step)**, grouped under **`Passos da ligação` (Call steps)**. There are six, each editable in the step inspector on the right:

| Step | Label (`CALL_STEP_LABEL`) | What it does |
| --- | --- | --- |
| `audio` | `Áudio / MP3` | A spoken line. Plays an MP3 (optional) and shows a caption, then advances on its own. |
| `choice` | `Escolha de resposta` | In-call reply chips the player picks from, with an optional no-reply timeout. |
| `action` | `Ação (efeitos)` | Applies effects mid-call and continues. Invisible to the player. |
| `branch` | `Condição` | Routes the call down the first matching condition. |
| `delay` | `Pausa (silêncio)` | A silent beat of N seconds, then continues. |
| `hangup` | `Encerrar ligação` | Ends the call; the story resumes on the outer node. |

#### `Áudio / MP3` (the spoken line)

The workhorse of a call. Fields:

- **`Quem fala (rótulo na tela)` (Who speaks — on-screen label)** — a character, or the special `player`/`system`. Picks the name shown while the line plays. Optional.
- **`Áudio (mídia da biblioteca)` (Audio — from the Media library)** — pick a registered audio item. Preferred, so the same file isn't pasted across many steps.
- **`Ou link direto do MP3 (opcional)` (Or a direct MP3 link)** — paste a URL instead. If a Media item is chosen, *its* URL wins over this link.
- **`Legenda (o que está sendo dito)` (Caption — what's being said)** — the on-screen text/subtitle.
- **`Sem MP3: segurar a legenda por (segundos)` (No MP3: hold the caption for N seconds)** — when there's no audio, how long the caption stays before advancing (default ~4s).
- **`Efeitos` (Effects)** — fire when this line plays.

Connect its single bottom output to the next step.

> **Tip:** A caption-only audio step (no MP3, just `holdSec`) is a clean way to script a line you don't have a recording for yet — the call still "speaks" via text. Add the real MP3 later without rewiring anything.

#### `Escolha de resposta` (player reply)

Gives the player reply chips *during* the call. Fields:

- **`Pergunta/contexto (opcional)` (Prompt/context)** — optional framing text.
- **`Respostas do jogador` (Player replies)** — add options with `resposta` (reply). Each uses the standard option form: button text, an optional spoken line (`Fala enviada` — empty = same as the button), a `Não dizer nada` (Say nothing) silent option, a `Só aparece se…` (Only shows if…) condition, and per-option effects.
- **`Sem resposta após (segundos) — vazio/0 = espera para sempre` (No reply after N seconds — empty/0 = wait forever)** — auto-route timeout.

Each reply has its **own** right-edge handle on the canvas — wire every one to its next step. There's also a separate **`sem resposta` (no reply)** output: if the timeout elapses and you've wired it, the call follows it; **if you leave it unwired, the call hangs up.**

> **Gotcha:** This step (like `Condição`) has no single "out" — only per-reply handles plus the timeout handle. An unconnected reply leads nowhere; the writer must connect each one explicitly.

#### `Ação (efeitos)`, `Pausa (silêncio)`, `Condição`

- **`Ação`** — only applies effects, then follows its one output. Use it for mid-call trust bumps, flags, evidence, etc.
- **`Pausa`** — `Segundos de silêncio` (seconds of silence), then continues. Good for dramatic beats.
- **`Condição`** — add `ramo` (branch) rows, each with a condition; on the canvas each branch gets a `se condição N` (if condition N) handle plus a `senão (padrão)` (else/default) handle. Conditions evaluate top-down; the first true one wins, else the default.

#### `Encerrar ligação` (hang up)

Ends the call. Fields: an optional **`Legenda final` (Final caption)** (e.g. "ligação encerrada") and **`Efeitos`** that fire as it disconnects. It has **no output** — when it runs, control returns to the *outer* node and the story continues at **`depois da ligação`** (after the call).

> **Important:** Every path through your sub-flow should reach a `hangup`. Without one, the call has no clean way to end and return to the story. Branches and reply chips that dead-end will simply stop the call.

### 7.5 Setting the entry step and connecting steps

- **Entry step:** The first step the call plays after the player answers. The very first step you add is auto-marked as the entry. To change it, select a step and click **`definir como início` (set as start)** in the step inspector; the current entry shows the badge **`início da ligação` (call start)**.
- **Connecting:** Drag from a step's right-edge handle to the target step. The store records it on the underlying field (`next`, a reply's target, `timeoutNext`, a branch's `next`, or the branch `fallback`). Deleting a step automatically clears any handles that pointed at it, so you won't leave dangling links.

### 7.6 The outer outputs — where the story goes next

Back on the **chapter** canvas, the `Ligação interativa` node exposes three outputs to wire into the rest of the chapter (the inspector reminds you: *"ligue 'depois da ligação', 'recusou' e 'não atendeu' aos próximos nós"*):

- **`depois da ligação` (after the call)** — the main line. The story continues here once a `hangup` ends the connected call. This is the node's `next`.
- **`recusou` (refused)** — taken when the player declines the call (pairs with the `Se RECUSAR` block).
- **`não atendeu` (didn't answer)** — taken when the call rings out (pairs with `Se NÃO ATENDER`). If you left that block empty, treat this like the refusal path.

> **Tip:** Always wire `depois da ligação` — it's the spine of the chapter. The `recusou`/`não atendeu` outputs can be left unwired if those outcomes should simply go quiet, but if declining the call is a *real* narrative choice, give it somewhere meaningful to go.

### 7.7 Quick checklist

1. Add a `Ligação interativa`, set `Quem liga` and `Direção`.
2. Decide on `Toca por` (and fill `Se NÃO ATENDER` only if a missed call should differ).
3. Click `Abrir fluxo da ligação`, build the scene from `Áudio / MP3` + `Escolha de resposta` steps, mark the `início da ligação`, and end every path with `Encerrar ligação`.
4. `voltar ao capítulo`, then wire `depois da ligação` / `recusou` / `não atendeu`.
5. Run **`✓ validar`** (Validate) before exporting — it catches reply/branch handles and outer outputs that point nowhere.

## 8. Validation and the Inspection panel

Every story you author is a graph of nodes wired together by `next` targets, plus a web of references to characters, evidence, news, posts and endings. One typo in an id and the game can dead-end or crash. The editor gives you two complementary safety nets: a live **`Inspeção`** (Inspection) panel that surveys the whole story for health problems, and a one-shot **`✓ validar`** (validate) button that runs the exact same integrity rules the game itself uses before it lets you export. Use both, and you never ship a broken `story.json`.

### The `Inspeção` tab — a living health dashboard

`Inspeção` (Inspection) is the last tab in the top bar. It never blocks you and never pops a modal — it is a read-only X-ray of the story you currently have loaded, recomputed automatically as you edit. It has five sub-tabs (sub-modes) across the top:

- `Visão geral` (Overview) — the story's size, estimated playtime and, most importantly, its QA health.
- `Texto` (Text) — full-text search across the whole script and registries.
- `Variáveis` (Variables) — where a flag/trust/evidence/etc. is changed versus where it decides a path.
- `Personagem` (Character) — one character's trust, unlocks and gates, chapter by chapter.
- `Bifurcações` (Branches) — a map of every player choice and automatic branch.

For validation work, the one that matters most is **`Visão geral`**. Scroll to its last band, **`Saúde da história`** (Story health). When everything is clean you get a single green **`tudo certo`** ("all good") card reading "nenhum nó solto, inalcançável ou capítulo sem fim" (no loose, unreachable nodes or chapter without an ending). Otherwise the panel lists exactly three classes of problem:

| What it finds | How it appears | What it means |
|---|---|---|
| **Unreachable nodes** | a per-chapter list under each chapter title, each row labelled `nó nunca alcançado a partir da entrada` (node never reached from the entry) | the node exists on the canvas but no path of `next` arrows from the chapter's entry node ever arrives at it — dead authoring, invisible in-game |
| **Chapters with no ending** | under `Capítulos sem fim de capítulo` (Chapters without a chapter ending), each reading `nenhum nó "Fim do capítulo" — nunca passa adiante` | the chapter has no `Fim do capítulo` (Chapter End) node, so play can never move on from it |
| **Broken targets** | under `Destinos quebrados` (Broken targets), each reading `aponta para «X» (inexistente)` (points to «X» (non-existent)) | a node's `next` (or option/branch target) points at an id that does not exist in that chapter |

The same warnings also surface compactly in the **`Por capítulo`** (Per chapter) table in the `Saúde` (Health) column: a small `N inalcançável` (N unreachable) chip, a `sem fim` (no ending) chip, or a green check when the chapter is clean.

#### Jumping straight to the offending node

Every row in the Inspection panel is a button. **Click it and the editor jumps to that exact node** — it switches to the `Capítulos` (Chapters) tab, opens the right chapter and selects/centers the node on the canvas (via `goToNode`). This works everywhere: the broken-target rows, the unreachable-node rows, the per-chapter table rows, the `Texto` search hits, the `Variáveis` "where it changes / where it decides" lists, the `Personagem` timeline entries, and the `Bifurcações` fork sources and targets. You never have to hunt for an id by hand — let a row carry you to it.

> Tip: the other sub-tabs are diagnostic gold even when nothing is "broken". `Variáveis` will tell you a flag is set but **`nunca decide nada — talvez sobre`** (never decides anything — maybe redundant), which usually means a typo split one flag into two spellings. `Bifurcações` draws a red `destino inexistente` (non-existent target) badge on any choice option or branch ramo that points nowhere — a friendly preview of the same broken targets the validator will hard-stop on.

### The `✓ validar` button and the report modal

`✓ validar` (validate) lives in the top-right toolbar, next to `⬇ exportar story.json` (export story.json). Pressing it runs the full integrity check (`validateBundle`) and opens a centered **report modal**. Close it by clicking the backdrop or the `fechar` (close) button.

The report splits findings into two buckets, and the difference is the whole point:

- **ERRORS** (red, `AlertCircle` icon) — real referential breaks. The header turns red and reads **`N erro(s) — exporte só depois de corrigir`** (N error(s) — export only after fixing). **Errors block export.**
- **WARNINGS** (amber, `AlertTriangle` icon) — things that are probably wrong or unfinished but won't crash the game. **Warnings never block export.**

How the gate actually works: `✓ validar` only *shows* you the report. The real gate is the export button — pressing `⬇ exportar story.json` re-runs the same validation and **only downloads the file if there are zero errors** (`r.errors.length === 0`). If there are errors, it shows you the report instead of a download. Warnings, however many, never stop the download.

When the story is clean the header is green and reads **`História válida`** (Story is valid); if there are also no warnings you get **`Nenhum problema encontrado`** (No problems found).

> The validator runs against whatever is loaded *in the editor right now*. After you press `⟳ carregar do jogo` (reload from the game) or `importar` (import), the previous report is cleared — re-validate before trusting it.

### Common validation messages and how to fix them

Messages are in Portuguese and prefixed with a location like `cap_03/n12` (chapter id / node id) or a registry path like `Mural/p2`. That prefix is your map to the problem. The most frequent ones:

| Message (Portuguese) | Severity | What's wrong / how to fix |
|---|---|---|
| `…/nó: destino "X" não existe` | **error** | A `next`/option/branch target points to a node id absent from that chapter. Re-draw the arrow, or fix the id. (Same as a `Destinos quebrados` row in Inspection.) |
| `Capítulo inicial "X" não existe` | **error** | `meta.startChapter` (set in `projeto` → `Capítulo inicial`) names a chapter that isn't there. Pick an existing chapter. |
| `chapterOrder contém capítulo inexistente "X"` | **error** | The chapter order lists an id with no chapter. Remove it or create the chapter. |
| `X: capítulo sem nó de entrada definido` / `entrada "Y" não existe` | **error** | The chapter has no entry node, or its entry points nowhere. Mark a starting node as the chapter entry. |
| `…: evidência inexistente "X"` | **error** | An `addEvidence` effect or a message attachment references an evidence id that doesn't exist. Create it in `Evidências`, or fix the id. |
| `…: personagem inexistente "X"` / `remetente desconhecido "X"` | **error** | A `trust`/`unlockContact`/`setPresence` effect, a message `speaker`, a `caller`, or a shared contact names an unknown character. Add the character or fix the id (`player`/`system` are always valid). |
| `…: notícia inexistente "X"` | **error** | An `unlockNews`/`publishNews`, a notification, or a `{{news:id}}` link references a missing news id. |
| `…: post inexistente "X"` | **error** | An `unlockSocial`/`publishPost`, a comment/like action, a notification, or a `{{post:id}}` link references a missing Mural post id. |
| `…: story inexistente "X"` | **error** | An `unlockStory`/`publishStory` references a missing Mural-story id. |
| `…: final inexistente "X"` | **error** | A `setEnding`/`lockEndingScore` effect or a `chapterEnd`'s `ending` names a missing ending. Create it in `Finais` or fix the id. |
| `…: link aponta página inexistente "X"` | **error** | A `{{page:id}}` link token inside a message points to a missing web page (`Páginas Web`). The validator also checks `{{news:…}}`, `{{post:…}}`, `{{profile:…}}` tokens. |
| `…: escolha sem opções` / `opção "…" sem destino` | **error** | A choice node has no options, or an option has no `next`. Every choice needs at least one option, and every option needs a target. |
| `…: mensagem sem conversa (thread)` | **error** | A message/choice/shareContact has no `thread` set — it doesn't know which chat to file into. |
| `Mural/X: comentário responde a id inexistente "Y"` | **error** | A comment's `replyTo` targets a comment that has no matching id. Give the target comment an id. |
| `Mídia/X: sem URL do arquivo` / `mídia inexistente "X"` | **error** | A media entry has no URL, or something references a media id that isn't in `Mídias`. |
| `X: capítulo sem nó "Fim do capítulo"` | **warning** | The chapter has no Chapter End node — fine while you're drafting, but it can't hand off to the next chapter until it has one. |
| `…/nó: mensagem sem próximo nó (a história trava aqui)` | **warning** | A message/delay/shareContact has no `next` — play stops dead here. Wire it forward unless this is genuinely the last beat. |
| `…: próximo capítulo "X" ainda não existe` | **warning** | A `chapterEnd` points to a chapter you haven't written yet. Expected during production; resolve before release. |
| `Capítulo "X" não está na ordem de capítulos` | **warning** | The chapter exists but isn't in `chapterOrder`, so it may never play in sequence. |
| `…: ligação sem passo "Encerrar"…` | **warning** | An interactive call scene has no hangup step and can dead-end. Add an `Encerrar` (Hang up) step. |

> Note the asymmetry that trips people up: a **dangling `next` is an ERROR** (broken target), but a **missing `next` is only a WARNING** ("a história trava aqui" / the story freezes here). A missing-ending chapter is also just a warning. So a story can export "clean" (zero errors) and still be unfinished — that's why the `Inspeção` panel's `Saúde da história` band and the warnings list matter even when export is allowed.

### The golden rule: validate in the repo too

The editor's validator mirrors the game's own check (`scripts/validateStory.mjs`), but the repository script is the final authority. After you export and drop the file into place, **always run the repo check before considering the story done:**

1. In the editor, fix every error until `✓ validar` shows green `História válida`.
2. Press `⬇ exportar story.json` (it refuses to download while errors remain).
3. Replace `src/story/story.json` in the repo with the downloaded file.
4. In the repo root, run **`npm run validate-story`**.
5. Export/ship only when that command reports clean.

This second pass catches anything that slipped through and confirms the live game file — not just the editor's in-memory copy — is sound.

### Best practices for a healthy story

- **Re-validate after every load.** `⟳ carregar do jogo` (reload from the game), `importar` (import) and `exportar` (export) all clear or refresh the report — never trust a stale green check.
- **Treat the `Saúde da história` band as your pre-flight panel.** Aim for the single green `tudo certo` card before exporting. Unreachable nodes are silent — they look fine on the canvas but never run.
- **Click, don't hunt.** Every Inspection row jumps to its node. Fix it in `Capítulos`, then return to `Inspeção` to confirm it cleared.
- **Use `Variáveis` to catch typos errors can't see.** A flag set but never read (`nunca decide nada — talvez sobre`) almost always means the same flag is spelled two ways. The validator can't flag this — only the dashboard can.
- **Use `Bifurcações` to spot dead choices early.** Its red `destino inexistente` badge previews a broken target before you even press validate.
- **Don't ignore warnings just because export works.** "Story freezes here", "chapter without an ending", and "next chapter doesn't exist yet" are how an unfinished story silently goes quiet in-game. Clear them before you call a chapter done.
- **Finish with `npm run validate-story`.** The editor green light is necessary; the repo green light is what actually ships.

Relevant source files: `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/io.ts` (the `validateBundle` rules + `exportBundle`), `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/App.tsx` (the `validar`/`exportar` buttons and report modal), `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/panels/AuditPanel.tsx` (the `Inspeção` tab UI), and `/home/luan/Desktop/PROJETOS/JS/rpg/editor/src/panels/auditScan.ts` (the `scanDangling`/`chapterStats`/reachability scanners behind the health band).

---

_Spotted a mismatch between this guide and the editor? The source code is the source of truth — please open an issue or PR. 💛_
