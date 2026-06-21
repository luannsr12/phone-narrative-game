# SINAL PERDIDO — Game Design Document (Bíblia Completa)

> **Versão:** 1.0 — Bíblia narrativa e de design pronta para produção
> **Plataforma:** Android (React Native + Expo + TypeScript)
> **Gênero:** Mistério / investigação narrativa interativa ("phone-as-game")
> **Duração-alvo:** 20+ horas · Prólogo + 20 capítulos + Epílogo · 5 finais principais + 2 variantes secretas
> **Idioma de produção:** Português do Brasil
> **Classificação indicada:** 16+ (violência implícita, temas adultos, sem sobrenatural real)

Este documento é a **fonte única de verdade narrativa e de design**. Um time de desenvolvimento deve conseguir construir o jogo inteiro a partir daqui, sem material adicional. A arquitetura técnica (Story Engine, tipos, persistência) é documentada em `docs/SPEC.md` e no código de `src/`; este GDD referencia esses sistemas mas não os redefine. Onde este documento cita `ids`, `flags`, `evidências` e `personagens`, eles são **canônicos** e já existem (ou devem existir) no conteúdo JSON da engine.

---

## ÍNDICE

1. [Visão Geral & Pilares de Design](#1-visão-geral--pilares-de-design)
2. [Sinopse da História Principal](#2-sinopse-da-história-principal)
3. [Lore & Universo](#3-lore--universo)
4. [Linha do Tempo do Caso](#4-linha-do-tempo-do-caso)
5. [Elenco Completo de Personagens](#5-elenco-completo-de-personagens)
6. [Mapa de Relacionamentos](#6-mapa-de-relacionamentos)
7. [Estrutura de Capítulos](#7-estrutura-de-capítulos)
8. [Sistema de Pistas Falsas & Suspeitos](#8-sistema-de-pistas-falsas--suspeitos)
9. [Sistema de Investigação & Evidências](#9-sistema-de-investigação--evidências)
10. [Sistema de Confiança & Relacionamentos](#10-sistema-de-confiança--relacionamentos)
11. [Sistema de Escolhas & Consequências](#11-sistema-de-escolhas--consequências)
12. [Sistema de Tensão & Perigo](#12-sistema-de-tensão--perigo)
13. [Banco de Diálogos](#13-banco-de-diálogos)
14. [Os 5+ Finais](#14-os-5-finais)
15. [Interface & Apps do Celular](#15-interface--apps-do-celular)
16. [Progressão & Ritmo](#16-progressão--ritmo)
17. [Apêndice: Glossário de Flags & Variáveis](#17-apêndice-glossário-de-flags--variáveis)

---

# 1. Visão Geral & Pilares de Design

## 1.1 Premissa

**Sinal Perdido** coloca o jogador dentro do próprio celular. Não há avatar, não há mapa para andar, não há barra de vida. Há apenas uma tela de mensagens que começa a apitar — e do outro lado, um adolescente desesperado usando o telefone da irmã desaparecida.

O jogador é a **última pessoa de fora** que falou com **Lia Moreaux**, fotógrafa de 25 anos que sumiu há três noites na cidade decadente de **Corvo Pálido**. A polícia diz que ela "só viajou". O irmão dela, **Eron**, de 16 anos, não acredita. Ele encontrou o celular escondido da irmã, viu que o último número de fora da cidade era o seu, e mandou uma mensagem.

A partir daí, o jogador investiga **lendo, conversando, ouvindo áudios, abrindo arquivos e tomando decisões**. Cada pessoa que entra em contato traz uma peça — e uma mentira. O desaparecimento de Lia é apenas a superfície. Por baixo dele há **três "afogamentos" idênticos ao longo de quinze anos**, todos no mesmo píer interditado, todos com o mesmo laudo, todos assinados pela mesma mão. É um encobrimento. E quem o sustentou ainda mora na cidade, sorrindo, sempre disposto a ajudar.

## 1.2 O Gancho de Abertura (exato)

O jogo **NÃO** tem tela de título narrada, tutorial ou introdução. Ao tocar para começar (após escolher o nome), o jogador cai direto numa thread de mensagens com um número desconhecido. As três primeiras bolhas chegam com delay de "digitando…", exatamente como no build atual (`prologue.json`):

```
[número desconhecido · digitando…]
  se voce ta lendo isso entao o numero ainda funciona
  nao sei quem voce e
  mas voce foi a ultima pessoa com quem ela falou
```

Não há contexto. Não há nome de remetente. A primeira coisa que o jogo pede ao jogador é uma escolha de resposta — e a estranheza já está instalada. Só depois de algumas trocas é que o jogador descobre que "ela" é Lia, que sumiu, e que quem escreve é o irmão, Eron. O cartaz de desaparecimento (`ev_missing_flyer`) e a última foto (`ev_last_photo`, tirada às 02:14 no píer proibido) chegam como anexos dentro do chat. O caso "abre" no momento em que o jogador diz que vai ajudar.

**Regra de ouro do cold open:** nada na primeira tela explica ao jogador "o que é este jogo". A interface de celular é auto-explicativa; a história se explica sozinha por imersão.

## 1.3 A Fantasia do Jogador

> *"Eu sou a única pessoa de fora que se importa, e estou desvendando um crime real através do meu telefone, no meio da noite, enquanto a cidade inteira tenta me convencer a parar."*

O jogador sente que:

- **É um confidente, não um herói.** Ninguém o vê. Ninguém sabe quem é. As pessoas mandam mensagem porque ele é o único que ainda responde.
- **A informação tem peso.** Cada áudio, cada foto, cada print é uma carta que pode ser usada — ou que pode te expor.
- **A confiança é frágil e real.** Tratar mal a Sahar num momento de medo faz ela fechar. Pressionar a Júlia rápido demais a faz sumir por capítulos.
- **O perigo é pessoal.** Começa como curiosidade. Termina com uma foto da própria janela do jogador, tirada de fora, à noite.

## 1.4 Pilares de Design

| # | Pilar | O que significa na prática |
|---|-------|----------------------------|
| **P1** | **O celular É o jogo** | Toda interação acontece em apps simulados (Mensagens, Arquivos, Galeria, Chamadas, Contatos, Linha do Tempo, Notícias). Nenhuma tela "de jogo" que quebre a ficção. |
| **P2** | **Progressão 100% narrativa** | Sem energia, vidas, moedas, gemas, premium, loot boxes, timers artificiais, paywall, minigames ou puzzles. O jogador avança lendo, escolhendo e conectando provas. |
| **P3** | **Vozes inconfundíveis** | O jogador reconhece quem falou sem ler o nome. Cada personagem tem um estilo de digitação único (ver §5). |
| **P4** | **Consequências reais** | Não existe escolha decorativa. Uma resposta no Cap. 2 muda uma cena no Cap. 18. Personagens podem ajudar, trair, morrer, sumir ou romper contato. |
| **P5** | **Verdade em camadas** | O jogador vai acreditar 4–5 vezes que resolveu o caso, e estar errado todas as vezes até a última. Pistas falsas são parte do design, não acidentes. |
| **P6** | **Tensão crescente** | A curva vai de conversa → ameaça → fotos estranhas → sensação de ser observado → alguém sabe quem você é → você vira alvo. |
| **P7** | **Realismo plausível** | Inspiração em true crime e thriller psicológico. Nada de sobrenatural real; toda estranheza tem explicação humana. |
| **P8** | **Imersão emocional** | O jogo é sobre luto, silêncio de cidade pequena e a coragem de não desistir de alguém. A emoção é a recompensa, não os pontos. |

## 1.5 Referências de Tom

- **True Detective (1ª temporada):** atmosfera de paisagem doente, corrupção institucional enterrada, dois tempos (passado/presente) convergindo.
- **Mindhunter:** o mal é educado, articulado e paciente. O vilão de *Sinal Perdido*, Dr. Vey, é gentil — e fica mais gentil quanto mais perto você chega.
- **Seven & Zodiac:** a investigação consome quem investiga; a obsessão é tema. O Zodiac em especial inspira a ideia de "padrão que a cidade chama de azar".
- **Gone Girl:** identidade falsa, narrativa que se reescreve, a vítima que talvez não seja vítima (Mira; possivelmente Lia).

**O que evitar:** fantasmas reais, maldições, magia, "a água é amaldiçoada". A névoa, o lago e a casa do guarda são assustadores por causa do que **pessoas** fizeram ali. Toda pista aparentemente sobrenatural tem desfecho humano.

## 1.6 Público-Alvo

- **Primário:** jogadores de 18–35 anos de narrativa interativa (público de *Duskwood*, *Lifeline*, visual novels de mistério, true crime e podcasts investigativos).
- **Secundário:** leitores de thriller e fãs de séries de detetive que querem uma experiência "de uma sentada por capítulo".
- **Perfil de sessão:** sessões de 30–60 min (um capítulo), à noite, fone de ouvido (áudios e chamadas são desenhados para fone).

## 1.7 Não-Objetivos (escopo negativo, contratual)

O jogo **não terá**, em nenhuma versão: sistema de energia, vidas, moedas, premium, gemas, loot boxes, minigames, quebra-cabeças (hacking/imagem/matemático), tempo de espera artificial, conteúdo bloqueado por pagamento. O único "gating" permitido é **narrativo** (capítulo desbloqueia capítulo; confiança desbloqueia revelação). Ver §16.

---

# 2. Sinopse da História Principal

> Esta seção conta o caso **inteiro, sem mistério**, do começo dos fatos reais até a verdade final — para que o time entenda o quebra-cabeça completo. O jogador descobre tudo isto em camadas e fora de ordem.

## 2.1 O que realmente aconteceu (a verdade-base)

Corvo Pálido foi uma cidade de mineração que faliu quando a mina fechou. Para sobreviver, a prefeitura, liderada nos bastidores pelo vereador **Rolando Saldanha**, apostou tudo num projeto de turismo: alagar o vale com uma represa e construir uma orla, uma pousada e um píer para atrair visitantes. O "Projeto Orla do Lago" virou a única esperança econômica da cidade — e qualquer coisa que ameaçasse a imagem do lago como lugar seguro era tratada como ameaça existencial.

Ao longo de **quinze anos**, **três jovens morreram** no mesmo píer da **represa norte** — em anos diferentes, sempre de madrugada, sempre "afogamento acidental":

1. **Nádia Cruz**, 19, há ~15 anos. Corpo nunca encontrado.
2. **Henrique Moreaux**, guarda noturno da represa (pai de Lia e Eron), há ~12 anos. "Caiu" da represa durante o turno; Eron tinha 5 anos.
3. **Mira Halász**, 15 na época (há ~11 anos). Velório de caixão fechado.

Os três laudos são **quase idênticos** e foram assinados pela mesma mão: **Dr. Adriano Vey**, o legista da cidade. Não foram acidentes. Foram **mortes encobertas** para proteger o projeto e enterrar crimes ligados a ele.

A peça central da fraude: **quem assina o laudo vê o corpo. Quem vê o corpo, sabe.** Vey controlava a única narrativa que importava — a causa da morte — e a moldava conforme a conveniência do projeto e de quem o financiava. Em troca, ele construiu, década após década, um arquivo de segredos sobre meia cidade: prefeito, vereador, pastor, polícia antiga. **Vey não é um capanga; ele é a engrenagem.** Quem manda na cidade só manda porque Vey decide o que cada corpo "diz".

## 2.2 A reviravolta de Mira

Há onze anos, **Mira Halász não morreu**. A jovem que foi velada em caixão fechado e cujo laudo Vey assinou **está viva**, escondida e usando outra identidade. O corpo no caixão não era dela (ou não havia corpo nenhum — caixão fechado, lacrado por ordem do legista).

Mira fugiu porque **viu algo no píer** que a marcaria para sempre: ela testemunhou (ou esteve perigosamente perto de) o que aconteceu com uma das outras vítimas e percebeu que, se continuasse "viva e falando", seria a próxima. Forjar a própria morte — com a ajuda involuntária do sistema que cobria mortes — foi a única saída. Vey **sabe** que Mira está viva (foi ele quem fechou o caixão), e isso é, ironicamente, parte do controle dele: um cadáver oficial que respira é a testemunha mais silenciada de todas.

**A camada de segredo familiar / identidade falsa:** Mira está ligada à família **Moreaux**. A revelação (escalonada ao longo dos capítulos 14–18): Mira e Lia são **meio-irmãs** — filhas de Henrique Moreaux. Henrique teve uma relação fora do casamento; Mira é fruto dela. Henrique descobriu a verdade sobre o primeiro afogamento (Nádia) **enquanto era guarda da represa**, começou a investigar, e foi morto por isso. Mira, adolescente, era a única que sabia que o "acidente" do pai dela tinha sido execução — e por isso teve que "morrer" também. **Noemi Moreaux**, mãe de Lia e Eron, sempre soube parte disso: sabe que o marido foi assassinado, sabe que existe uma filha fora do casamento, e escolheu o silêncio para proteger os filhos. É isso que está trancado na "caixa que os filhos nunca viram".

Lia, fotógrafa obcecada pela luz e pelo que "todo mundo finge que não existe", passou os últimos meses **reconstruindo o padrão**: três nomes, três anos, mesmo píer, mesma assinatura (a página do caderno, `ev_lia_notebook`). Ela cruzou os recortes que a arquivista **Inês Lund** guardou contra ordens da prefeitura, gravou um memo de voz "caso alguém ouça" (`ev_voice_lia1`) e — o ponto de virada — **encontrou Mira viva** e descobriu que era sua meia-irmã. Foi por isso que Lia foi ao píer às 02:14 da noite em que sumiu.

## 2.3 O que aconteceu com Lia (e por que há finais diferentes)

A noite do desaparecimento: Lia vai ao píer interditado para fotografar e/ou para encontrar alguém. Ela tira a última foto (a luz fraca na outra margem). Um barco a motor cruza o lago naquela noite — o pescador **Teo** ouviu o motor (`ev_dock_audio`); ninguém tem licença para aquele lado há vinte anos. A partir daqui, **a verdade do destino de Lia depende das escolhas do jogador**, e é isso que ramifica os finais:

- Em alguns caminhos, **Lia está viva** (Final III): a luz na foto era a lanterna dela. Ela forjou o próprio sumiço — repetindo, sem saber no início, o mesmo recurso que a irmã Mira usou — para terminar o trabalho do pai por fora, sabendo que "de dentro ninguém acreditaria nela". Ela esperava que alguém de fora (o jogador) reunisse as provas.
- Em outros, **Lia foi morta** e o jogador ou expõe o responsável (Final I), ou chega tarde e o responsável foge (Final II), ou acusa a pessoa errada (Final IV), ou é silenciado pela cidade (Final V).

## 2.4 A revelação de Vey (clímax, ~Cap. 17)

Durante quase toda a investigação, **Dr. Adriano Vey é o aliado mais útil do jogador**: o legista gentil, paciente, que devolve mensagens na hora, que "esclarece" laudos, que tranquiliza o jogador como um médico tranquiliza um paciente. Ele é apresentado cedo, de forma sutil, como **"o estranho educado de casaco escuro com uma maleta de médico"** que andou perguntando sobre Lia (relato de Sahar no Cap. 2, `t_stranger_desc`). O jogador deve passar capítulos sem ligar uma coisa à outra.

A revelação não é um "gotcha" barato: é a **lenta percepção** de que a mesma assinatura está em tudo — nos três laudos antigos, no laudo do pai de Lia, no atestado de Mira, nos documentos que Inês guardou. E que o homem que vinha "ajudando" sabia das respostas o tempo todo porque **foi ele quem as escreveu**. O detalhe assustador de personagem: Vey **fica mais gentil conforme o jogador se aproxima da verdade** — porque, para ele, gentileza é controle. Ele nunca ameaça. Ele oferece chá, compreensão e uma saída digna. É a coisa mais perturbadora do jogo.

Vey não matou todos com as próprias mãos. Ele é o **arquiteto do silêncio**: decidia o que cada corpo "diria", chantageava com o que sabia, e protegia o projeto que protegia a ele. Os executores braçais variaram ao longo dos anos (a estrutura aponta para um capanga/figura de aplicação ligada à velha guarda da cidade). Mas a "corrente" — o título do Final I, "A Corrente Quebrada" — é Vey. Quebre-o, e a cidade desmorona em verdade.

## 2.5 Resumo de uma frase

> *Uma fotógrafa some perseguindo um padrão de afogamentos que a cidade chama de azar; o jogador descobre que foram assassinatos encobertos por um legista gentil, que uma das "afogadas" está viva e é meio-irmã da desaparecida, e que a única forma de salvar alguém é decidir, sob ameaça, em quem acreditar — sabendo que a verdade pode custar a própria segurança.*

---

# 3. Lore & Universo

## 3.1 Corvo Pálido — visão geral

Corvo Pálido é uma cidade pequena (≈ 9 mil habitantes em declínio) encravada num **vale tomado por névoa**, ao redor de um **lago artificial** formado por uma represa. O nome vem dos corvos-cinzentos que cobriam os terrils da antiga mina; "pálido" porque a névoa do vale come a cor de tudo — fotos tiradas ali parecem desbotadas mesmo no verão. É uma cidade de **uma rua principal, uma igreja, um café, uma pousada e muito silêncio**.

A geografia importa para a mecânica de investigação, então é canônica:

- **A represa e o lago.** O lago tem duas margens. A **margem sul** (a "orla") é o cartão-postal: calçadão, a pousada, o café de Sahar na rua do porto, os barcos de passeio. A **represa norte** é o lado proibido: o píer velho, a casa abandonada do guarda (a casa onde Henrique Moreaux morreu), placas enferrujadas de "área de risco". **Interditada há ~20 anos.** É o local recorrente das três mortes e do sumiço de Lia (`ev_map_dock`).
- **O mirante velho.** Acima da orla, um mirante de pedra abandonado. Atrás dele, uma fenda na rocha onde Sahar e Lia escondiam bilhetes quando crianças — onde está "a chave" do bilhete do açucareiro (`ev_cafe_note`).
- **A pousada do lago.** A 600 m do píer norte. Onde Júlia trabalhava na recepção; ponto de passagem de quem vai e vem do lago à noite.
- **O arquivo municipal.** Sala empoeirada onde Inês Lund guarda recortes que a prefeitura mandou destruir. Memória oficial e não-oficial da cidade.
- **A igreja.** Única da cidade, do Pastor Edmar Reis, que enterrou os três afogados.
- **O necrotério / gabinete do legista.** Domínio de Vey. Onde os laudos nascem.

## 3.2 História: da mina ao lago

- **Era da mina (séculos atrás até ~30 anos antes do jogo):** Corvo Pálido vivia da extração. A mina ditava tudo — empregos, política, hierarquia. As famílias "antigas" (Saldanha entre elas) acumularam poder ali.
- **O colapso (~30 anos antes):** a mina exaure e fecha. Êxodo, desemprego, casas vazias. A cidade quase morre.
- **O Projeto Orla do Lago (~20 anos antes):** Rolando Saldanha, então vereador novato e empreiteiro, encabeça o projeto de represar o vale e criar um destino turístico. A represa é construída; o vale (e parte do antigo distrito mineiro) é alagado. A **represa norte é interditada** logo no começo, oficialmente por "risco estrutural" — extraoficialmente porque é onde os problemas eram afundados. Inaugurada a orla, a cidade passa a depender do turismo de lago. **Mês passado**, a Gazeta celebrou os "20 anos do projeto" (`news_council_orla`).
- **A cultura do silêncio:** desde então, toda morte no lago é uma ameaça à única economia que restou. Daí nasce o pacto não-escrito: **não se fala do lago.** Famílias de vítimas nunca recebem laudos completos. A imprensa local (a Gazeta) minimiza ("não espalhar pânico"). Quem insiste é tratado como inimigo da cidade — é por isso que o jornalista **Cael** é odiado.

## 3.3 Os três "afogamentos" — o coração da lore

| Ano (aprox.) | Vítima | Idade | Versão oficial | Verdade |
|---|---|---|---|---|
| ~15 anos atrás | **Nádia Cruz** | 19 | "Afogamento; corpo não encontrado" | Primeira morte ligada ao projeto. O que ela viu/soube ameaçava a orla. Corpo desaparecido = sem perícia independente. |
| ~12 anos atrás | **Henrique Moreaux** | — | "Acidente em serviço; caiu da represa" | Guarda noturno. Descobriu a verdade sobre Nádia. Assassinado para calar. Pai de Lia, Eron e (segredo) de Mira. |
| ~11 anos atrás | **Mira Halász** | 15 | "Afogamento; caixão fechado" | **Viva.** Forjou a morte para escapar do mesmo destino do pai. Meia-irmã de Lia. |

Os três têm laudos "quase idênticos", a mesma assinatura (**A. Vey**) e velórios/caixões fechados (`ev_obituary_mira`). O blog Margens chama de **padrão**; a Gazeta chamou de **azar** (`news_lake_history`). A página do caderno de Lia destila tudo: *"três 'acidentes'. anos diferentes. mesmo píer. mesmo laudo. mesma assinatura. — quem assina vê o corpo. quem vê o corpo sabe."*

## 3.4 Religião, economia e atmosfera

- **Religião:** a igreja do Pastor Edmar é o centro moral nominal da cidade — e o cofre de seus segredos. Edmar ouviu confissões que o assombram (incluindo, possivelmente, de quem participou dos encobrimentos) e enterrou os três corpos. Ele fala por metáforas e versículos porque o segredo de confissão o algema; quer falar e não pode.
- **Economia:** turismo de lago em decadência (a névoa e a fama ruim afastam visitantes), comércio minguante na rua do porto, prefeitura sustentando aparências. O medo econômico é o combustível do silêncio.
- **Atmosfera (guia para arte/áudio):** névoa constante, luz cinza-azulada, água preta e lisa, som de motor distante, rádio chiando, o tilintar de uma maleta. Paleta fria (azuis, cinzas, verde-musgo) pontuada pelos avatares quentes de alguns personagens. A cidade deve **parecer presa em 02:14 da manhã** mesmo de dia.

## 3.5 Regras do universo (para escritores)

1. **Nada de sobrenatural real.** "A luz na outra margem" não é fantasma — é uma lanterna. "O lago engole gente" é metáfora de encobrimento.
2. **Tudo tem assinatura humana.** Toda coincidência aponta, no fim, para uma decisão de alguém.
3. **A cidade é um personagem.** Ela observa, fofoca, fecha portas e protege a si mesma. Em vários finais, é a cidade — não um indivíduo — que vence.
4. **O telefone é a única janela.** O jogador nunca "vai" a lugar nenhum; só recebe o que os outros decidem mandar. Isso significa que **toda evidência é mediada por um remetente que pode mentir.**

---

# 4. Linha do Tempo do Caso

> Cronologia **real** dos fatos (o que de fato aconteceu), independente do que a cidade conta. Anos são aproximados e relativos ao "presente" do jogo. O presente é uma semana de outono, e Lia sumiu na **quinta-feira passada à noite**.

## 4.1 Passado profundo

- **T-30 anos — Fechamento da mina.** Corvo Pálido entra em colapso econômico. As famílias antigas brigam pelo que sobrou.
- **T-20 anos — A represa.** Rolando Saldanha encabeça o Projeto Orla. O vale é alagado, a orla erguida, a **represa norte interditada**. Nasce a dependência turística e o pacto de silêncio. Vey já é o legista da cidade.
- **T-18 anos — Henrique Moreaux casa-se com Noemi.** Nascem os filhos: Lia (hoje 25) e, anos depois, Eron (hoje 16). Em paralelo, antes ou durante o casamento, Henrique tem uma relação fora do matrimônio da qual nasce **Mira Halász** (hoje 26). Noemi descobre; o casamento racha em silêncio. Henrique se torna **guarda noturno da represa** — um homem que passa as noites sozinho no único lugar que a cidade evita.

## 4.2 As três mortes

- **T-15 anos — Morte de Nádia Cruz (19).** A primeira. Algo que Nádia viu ou soube ameaçava o projeto/uma figura poderosa. Ela "se afoga"; o corpo **nunca aparece**. Vey assina o primeiro laudo do padrão. A cidade engole.
- **T-13 a T-12 anos — Henrique investiga.** Como guarda da represa, Henrique percebe inconsistências na morte de Nádia (viu algo do turno, ou guardou um objeto/registro). Começa a anotar, a perguntar. Escreve cartas e faz gravações (que sobreviverão escondidas). Aproxima-se perigosamente da verdade. **Mira, adolescente, é a confidente dele** — ela sabe que o pai está mexendo num vespeiro.
- **T-12 anos — Morte de Henrique Moreaux.** Henrique "cai" da represa durante o turno e morre. Eron tem **5 anos**; Lia tem ~13–14. Laudo de Vey: acidente em serviço. Noemi sabe (ou suspeita fortemente) que foi assassinato, mas se cala para proteger os filhos vivos. **Tranca tudo numa caixa.**
- **T-11 anos — "Morte" de Mira Halász (15).** Mira, devastada e ameaçada por ser a próxima a saber demais, **forja a própria morte** com a (involuntária ou negociada) cumplicidade do sistema que encobre mortes: caixão fechado, laudo de Vey, velório rápido. Ela some da cidade e assume outra identidade. O Pastor Edmar enterra o caixão — e carrega a dúvida.

## 4.3 Os anos de silêncio

- **T-11 a T-1 anos — O lago "se aquieta".** Sem novas mortes visíveis, o projeto sobrevive. Lia cresce com a ferida do pai, vira fotógrafa, sai e volta à cidade. Eron cresce fechado, criado por uma mãe ausente em dois turnos. Vey envelhece como o vovô bondoso da cidade, acumulando segredos. Rolando emplaca o terceiro mandato; seu filho **Bruno** vira o "bom partido" local. Inês guarda, em segredo, os recortes que mandaram destruir.

## 4.4 O ano do estopim (T-1 ano até o presente)

- **T-12 meses — Bruno e Lia.** Lia namora **Bruno Saldanha** por ~2 anos; terminam "em bons termos" (versão dele). Depois do término, Lia **muda**: fecha, para de rir (relato de Sahar). O término coincide com Lia começar a cavar o passado — Bruno (ou a posição da família dele) é parte do que ela passou a desconfiar.
- **T-8 a T-3 meses — Lia monta o padrão.** Lia frequenta o arquivo de Inês, cruza os três casos, fotografa o lago para um ensaio (editado por **Dário** na capital, sob a pauta "o lago que engole gente"). Escreve a página do caderno (`ev_lia_notebook`). Procura o jornalista Cael.
- **T-3 a T-1 meses — Lia encontra Mira.** Lia descobre que Mira está **viva** e que é sua **meia-irmã**. Isso muda a investigação de "justiça pelo pai" para "também salvar a irmã que sobrou". As duas se comunicam por canais cuidadosos (Mira troca de número). Lia esconde isso até de Sahar ("quando eu tiver certeza eu te conto").
- **T-2 semanas — A ameaça.** Lia recebe a mensagem de número oculto: *"você não é sua mãe. não cometa o mesmo erro. pare de procurar enquanto dá tempo."* (`ev_screenshot_threat`). "Você não é sua mãe" é a chave: alguém sabe que Noemi se calou e está pedindo a Lia que faça o mesmo.
- **T-1 semana, quinta-feira (dia do sumiço):**
  - De dia, Lia passa correndo no café, esconde o **bilhete no açucareiro** para Sahar (`ev_cafe_note`): *"se eu não aparecer amanhã, a chave está onde a gente escondia aos doze. não conta pro B."*
  - À noite, deixa acessível o memo "caso alguém ouça" (`ev_voice_lia1`), citando Inês.
  - **02:14 da manhã (sexta):** última foto no píer norte (`ev_last_photo`) — água preta, luz fraca na outra margem. Teo ouve um **motor de popa** no lado proibido (`ev_dock_audio`).
  - Lia desaparece.
- **Sexta a domingo — A cidade fecha.** A Guarda Municipal diz "não há indícios de crime"; a Gazeta pede calma (`news_disappear`). Eron cola cartazes (`ev_missing_flyer`); ninguém liga. Um homem educado de casaco escuro e maleta de médico (Vey) começa a perguntar por "algo que Lia teria deixado".
- **Domingo à noite (T-0, início do jogo):** Eron encontra o celular escondido de Lia atrás da gaveta, vê que o último número de fora é o do jogador, e manda a primeira mensagem. **O jogo começa.**

## 4.5 Linha do tempo no jogo (diegética)

A engine mantém uma **Linha do Tempo automática** (app dedicado). Cada `addTimeline` registra um marco. Marcos canônicos já implementados: `t_first_contact`, `t_last_photo`, `t_case_opened` (Prólogo); `t_voice`, `t_threat`, `t_notebook`, `t_sahar_lead` (Cap. 1); `t_meet_sahar`, `t_cafe_note`, `t_stranger_cafe`, `t_stranger_desc`, `t_ch2_done` (Cap. 2). Cada capítulo seguinte acrescenta de 3 a 6 marcos (ver §7 e §17). A timeline é a forma de o jogador **revisar a investigação inteira** e perceber padrões que não percebeu ao vivo — em especial, no Cap. 17, reler a timeline revela que "o estranho com maleta" e "o legista gentil" são a mesma pessoa.

---

# 5. Elenco Completo de Personagens

> 20 personagens relevantes (acima do mínimo de 15). Cada ficha traz: id canônico, dados, papel, capítulo de introdução, aparência, histórico, objetivos, segredos, mentiras, traumas, conflitos, relações, arco e **estilo de escrita com falas-exemplo** que soam como a pessoa. Os ids, nomes, idades, capítulos de introdução e estilos batem com `src/story/characters.json`.

> **Convenção de voz:** o time deve conseguir abrir qualquer mensagem do jogo e identificar o autor sem o nome. As falas-exemplo abaixo são a "régua" de voz. Escritores devem imitá-las, não copiá-las.

---

## 5.1 Eron Moreaux — `eron`

- **Nome completo:** Eron Moreaux · **Idade:** 16 · **Papel:** Irmão de Lia. **Primeiro contato do jogo.** · **Introdução:** Prólogo · **Avatar:** iniciais EM, azul (#6C8AE4).
- **Aparência (perfil):** magro, capuz sempre erguido, olheiras de quem não dorme. Foto de perfil é uma selfie tremida tirada no escuro do quarto.
- **Histórico:** perdeu o pai (Henrique) aos 5 anos num "acidente" na represa de que mal se lembra. Criado por Noemi, que trabalha em dois turnos e nunca está em casa. Lia foi mãe, pai e amiga ao mesmo tempo. Com ela sumida, Eron ficou literalmente sozinho — e é o único na cidade que se recusa a "esquecer".
- **Objetivos:** achar Lia viva. Provar que a polícia e a cidade estão erradas. Não ficar sozinho.
- **Segredos:** guardou a **página arrancada do caderno** de Lia antes da mãe achar (`ev_lia_notebook`) e só a entrega com confiança alta. Acha que alguém **entrou no quarto de Lia** depois do sumiço (janela aberta que ele não abriu) — e tem medo de contar isso a qualquer um.
- **Mentiras:** mínimas — Eron mente mal e por omissão (segura informação por medo, não por cálculo). É a bússola moral do jogo: o personagem mais sincero.
- **Traumas:** abandono (pai morto, mãe ausente, irmã sumida). Pavor de ser o "próximo a ser esquecido".
- **Conflitos:** com a mãe (silêncio); com a inspetora Vesna (que o trata como suspeito); com a própria idade (ninguém leva um menino de 16 a sério).
- **Relações:** depende do jogador como tábua de salvação. Confia em Sahar como família. Desconfia de Bruno. Idolatrava a irmã.
- **Arco:** de garoto desesperado e desconfiado → parceiro de investigação leal → no final, dependendo das escolhas, alguém que **reaprende a confiar** (Final I) ou que **perde a última pessoa** (Final V). Vulnerável em todos os finais; protegê-lo é um eixo emocional.
- **Estilo de escrita:** tudo em **minúsculas, sem pontuação**, frases curtas e cortadas, rajadas de 2–3 mensagens, erros de digitação quando nervoso.
  - *"se voce ta lendo isso entao o numero ainda funciona"*
  - *"ela NUNCA escondia o celular. nunca"*
  - *"voce ficou. ninguem nunca fica. todo mundo desiste no segundo dia"*

---

## 5.2 Lia Moreaux — `lia`

- **Nome completo:** Lia Moreaux · **Idade:** 25 · **Papel:** A desaparecida; motor de toda a trama. · **Introdução:** Prólogo (presença), via arquivos. · **Avatar:** LM, magenta (#C46CB8).
- **Aparência:** cabelo curto, sempre com uma câmera analógica no pescoço; nas fotos de perfil aparece de costas ou recortada — Lia se escondia atrás da própria lente.
- **Histórico:** fotógrafa talentosa que via "o que todo mundo finge que não existe". Marcada pela morte do pai. Voltou a Corvo Pálido para um ensaio sobre o lago e ficou. Namorou Bruno por 2 anos.
- **Objetivos (retroativos):** terminar o trabalho do pai — provar o padrão de mortes. Proteger Mira, a meia-irmã recém-descoberta. Publicar o ensaio que escancararia tudo.
- **Segredos:** sabia que Mira está **viva** e que é sua **meia-irmã**. Possivelmente **forjou o próprio sumiço** (no caminho do Final III) para forçar uma investigação de fora.
- **Mentiras:** escondia a profundidade da investigação de quem amava ("quando eu tiver certeza eu te conto") — por proteção, não traição.
- **Traumas:** o pai. A culpa de ter sido jovem demais para entender na época.
- **Conflitos:** com Bruno (e o que a família dele representa); com a própria mãe (o silêncio de Noemi a enfurecia); com a cidade inteira.
- **Relações:** irmã-coração de Sahar; quase-mãe de Eron; meia-irmã de Mira; ex de Bruno; fonte do jornalista Cael e do editor Dário; "cliente" recorrente do arquivo de Inês.
- **Arco:** o jogador "conhece" Lia **postumamente/ausente**, montando quem ela era a partir de áudios, fotos e da forma como cada pessoa a descreve. Esse retrato muda o significado de tudo no final (especialmente se ela estiver viva).
- **Estilo de escrita:** aparece só por **arquivos** (áudios, fotos, mensagens antigas). Escrita **cuidadosa, observadora**, descreve luz e som; **nunca usa emoji**. Frases que parecem legenda de fotografia.
  - *(memo de voz)* *"se alguém ouvir isso, eu fui ao lago de novo. eu sei o que eles afundaram lá. não é o que contaram."*
  - *(caderno)* *"três 'acidentes'. anos diferentes. mesmo píer. mesmo laudo. mesma assinatura."*
  - *(bilhete)* *"se eu não aparecer amanhã, a chave está onde a gente escondia aos doze. não conta pro B."*

---

## 5.3 Sahar Vance — `sahar`

- **Nome completo:** Sahar Vance · **Idade:** 24 · **Papel:** Melhor amiga de Lia; dona do café do porto. · **Introdução:** Capítulo 2 · **Avatar:** SV, verde (#7CC48A).
- **Aparência:** sorriso largo, avental do café, sempre com algo nas mãos (xícara, pano). Foto de perfil quente e iluminada — contraste com a cidade.
- **Histórico:** conhece Lia desde os 9 anos; são "tipo irmãs". Toca sozinha o café da rua do porto, ponto de encontro do que sobrou da cidade. Irmã mais velha de Júlia, por quem é protetora a ponto de sufocar.
- **Objetivos:** achar Lia. Proteger Júlia. Manter o café (e a si mesma) de pé enquanto desmorona por dentro.
- **Segredos:** sabe onde fica o esconderijo da "chave" (mirante velho). Tem medo de que Júlia tenha visto algo na pousada e esteja em perigo. Mais tarde: encobre pequenos deslizes da irmã.
- **Mentiras:** mente para **se proteger e proteger os outros** ("eu disse que não" ao estranho). Não mente sobre fatos, mente sobre o quanto está com medo.
- **Traumas:** medo de perder pessoas (já perdeu o pai cedo; criou a irmã). A ausência de Lia é um luto antecipado insuportável.
- **Conflitos:** com Bruno (não confia mais nele); com a inspetora (tem medo de "piorar" tudo); com a própria impotência.
- **Relações:** coração do grupo. Liga emocionalmente Eron, Júlia e o jogador. Ponte para Júlia (Cap. 7) e para o passado de Lia.
- **Arco:** de amiga em pânico → aliada calorosa e corajosa → dependendo das escolhas, **protetora que se arrisca** por você ou **alguém que você quebrou** ao ser frio nos momentos errados. Pode romper contato se traída.
- **Estilo de escrita:** **calorosa, muitos emojis** (☕💛😭😨🥶), **áudios longos**, mensagens em **rajada**, apelidos. Quando se assusta, manda só **"..."** antes de soltar a bomba.
  - *"oi 💛 o eron me passou seu numero"*
  - *"pessimo pra ser sincera ☕ a gente se conhece desde os nove anos. ela é tipo minha irma"*
  - *"...ontem um homem que eu nunca vi entrou no cafe e perguntou se a lia tinha deixado 'alguma coisa' comigo 😨"*

---

## 5.4 Noemi Moreaux — `noemi`

- **Nome completo:** Noemi Moreaux · **Idade:** 49 · **Papel:** Mãe de Lia e Eron. · **Introdução:** Capítulo 3 · **Avatar:** NM, rosa-escuro (#E46C8A).
- **Aparência:** cansada até nos ossos, uniforme de trabalho, foto de perfil antiga (de quando o marido era vivo) que ela nunca trocou.
- **Histórico:** viúva de Henrique. Trabalha em dois turnos. Carrega há 12 anos a certeza/suspeita de que o marido foi **assassinado** — e o segredo da existência de **Mira**, filha de Henrique fora do casamento. Escolheu o silêncio para manter os filhos vivos e fora do alvo.
- **Objetivos:** que os filhos **parem de procurar**. Sobreviver mais um dia. Que a caixa fique trancada.
- **Segredos:** **a caixa trancada** — cartas e gravações de Henrique (`ev_henrique_letters`, ver §7), a prova de que ele investigava, e o vínculo com Mira. Sabe da meia-irmã. Sabe (em parte) por que o marido morreu.
- **Mentiras:** nega que há algo a saber; muda de assunto; "depois a gente fala". Mente por **medo e culpa**, não por maldade.
- **Traumas:** o assassinato do marido; a culpa de ter se calado; o terror de enterrar mais um filho.
- **Conflitos:** com Eron (o silêncio entre eles); com a memória de Henrique; consigo mesma.
- **Relações:** mãe ausente-mas-amorosa de Eron e Lia; ligação enterrada com Mira; provavelmente já foi **silenciada/ameaçada** por quem encobre (a ameaça a Lia ecoa "você não é sua mãe" — ou seja, Noemi é o exemplo do que dá "certo": a mãe que se calou).
- **Arco:** muro defensivo → rachadura → entrega (ou não) da caixa, dependendo de confiança. É a chave do **segredo familiar**. Em alguns finais, finalmente fala; em outros, leva tudo para o túmulo do silêncio.
- **Estilo de escrita:** **cansada, defensiva**, frases que **terminam antes da hora**, nega e se contradiz, dispara **"depois a gente fala"** para fugir.
  - *"não tem nada nessa caixa que interesse a você."*
  - *"o pai deles caiu. caiu. foi isso que disseram e foi isso que—"*
  - *"eu não quero perder os dois. depois a gente fala."*

---

## 5.5 Cael Domingues — `cael`

- **Nome completo:** Cael Domingues · **Idade:** 38 · **Papel:** Jornalista do blog "Margens". · **Introdução:** Capítulo 4 · **Avatar:** CD, dourado (#E4C56C).
- **Aparência:** óculos, casaco gasto, sempre com um caderninho. Foto de perfil é o logo do blog, não o rosto — Cael se protege.
- **Histórico:** cobre desaparecimentos em Corvo Pálido há anos no blog independente Margens, depois de ser demitido/silenciado na Gazeta. Foi quem cunhou "o lago que engole gente: padrão, não azar" (`news_lake_history`). Ninguém na cidade gosta dele.
- **Objetivos:** publicar a verdade do lago e ser **acreditado** depois de anos de descrédito. Usar o jogador como fonte/escudo.
- **Segredos:** tem um arquivo paralelo de fontes; algumas o ameaçaram. Já chegou perto da verdade e recuou por medo. Pode ter **omitido** algo que sabe sobre Vey (porque não tinha prova e ser processado o destruiria).
- **Mentiras:** raramente mente sobre fatos; **omite** para se proteger e para "não queimar a pauta". Pode exagerar a própria importância.
- **Traumas:** descrédito profissional; talvez uma fonte que se machucou por causa dele.
- **Conflitos:** com a Gazeta, com Rolando, com a prefeitura inteira; com a tentação de usar Eron/o jogador como combustível de manchete.
- **Relações:** fonte e aliado ambíguo. Foi contato de Lia. Pode ser ponte para Inês (arquivo) e para Dário (mídia).
- **Arco:** aliado útil e perigoso → ou parceiro que arrisca o pescoço por você (publica e te protege) → ou alguém que te **expõe** para salvar a própria reportagem, dependendo da confiança e das escolhas.
- **Estilo de escrita:** **formal, textos longos e bem pontuados**, cita fontes e datas, educado a ponto de soar **ensaiado**, usa **"a propósito"** para emendar assunto.
  - *"Antes de mais nada: obrigado por responder. Quase ninguém responde. A propósito, você sabia que o terceiro laudo usa exatamente a mesma frase do primeiro?"*
  - *"Tenho registros de 15, 12 e 11 anos atrás. Três datas. Uma assinatura. Posso te enviar, mas preciso saber de onde você fala."*

---

## 5.6 Bruno Saldanha — `bruno`

- **Nome completo:** Bruno Saldanha · **Idade:** 27 · **Papel:** Ex-namorado de Lia; filho do vereador. **Suspeito-âncora** (red herring principal). · **Introdução:** Capítulo 6 · **Avatar:** BS, laranja (#E48A6C).
- **Aparência:** bonito, bem-vestido demais para a cidade, sorriso de quem está acostumado a ser perdoado. Foto de perfil polida, à beira do lago.
- **Histórico:** herdeiro político e econômico de Rolando. Namorou Lia 2 anos; o término coincidiu com o "fechamento" dela. Vive sob a sombra (e a proteção) do pai.
- **Objetivos:** manter a própria imagem limpa. Não ser o bode expiatório. (Em alguns caminhos) realmente descobrir o que houve com Lia — ele a amava, à maneira covarde dele.
- **Segredos:** sabe mais sobre os **negócios sujos do pai** do que admite. Esteve perto do lago em datas convenientes. Pode ter ajudado Lia em segredo ou a traído por medo do pai.
- **Mentiras:** "terminamos em bons termos"; "eu nem tava na cidade naquela noite"; minimiza tudo. Mente por **autopreservação e covardia**, o que o faz parecer culpado mesmo quando é só fraco.
- **Traumas:** ser sempre "o filho de"; nunca ter sido valente o bastante para Lia.
- **Conflitos:** com o pai (ama e teme); com a própria consciência; com Eron e Sahar, que o odeiam.
- **Relações:** o jogador será **fortemente empurrado a acusá-lo** (Final IV existe por causa dele). Filho de Rolando. Alvo do bilhete "não conta pro B".
- **Arco:** vilão aparente → suspeito que desmorona sob pressão → **inocente do crime central** (ele não é o assassino), embora **culpado de covardia e cumplicidade passiva**. Se o jogador o acusar publicamente, dispara o Final IV.
- **Estilo de escrita:** **charmoso, defensivo**, puxa a conversa para si, usa **"kkk"** para diminuir tensão, **demora a responder de propósito** quando acuado.
  - *"olha, eu e a Lia terminamos super de boa, sério kkk não sei quem te falou o contrário"*
  - *(após 4h)* *"desculpa, tava ocupado. que que você quer saber exatamente?"*
  - *"você tá começando a falar igual aquele jornalista kkk cuidado com o que anda lendo"*

---

## 5.7 Júlia Vance — `julia`

- **Nome completo:** Júlia Vance · **Idade:** 19 · **Papel:** Irmã de Sahar; recepcionista da pousada. **Testemunha-chave assustada.** · **Introdução:** Capítulo 7 · **Avatar:** JV, ciano (#6CC4C4).
- **Aparência:** miúda, ansiosa, rói as unhas. Foto de perfil é um desenho, não o rosto — Júlia se esconde.
- **Histórico:** trabalhava na recepção da pousada do lago (600 m do píer). Na noite do sumiço, **viu mais do que devia**: registrou (ou viu) alguém entrando/saindo tarde, ou viu o barco, ou viu **quem** foi visto. Está apavorada.
- **Objetivos:** que ninguém saiba que ela viu algo. Não ser a próxima. Não decepcionar a irmã.
- **Segredos:** o **registro da pousada** daquela noite (`ev_pousada_log`) e o que ela viu. Pode ter apagado/escondido algo por medo.
- **Mentiras:** "esquece", "não vi nada", "eu tava de folga". Mente por **pânico**; sua mentira é tão frágil que entrega que há verdade ali.
- **Traumas:** medo crônico; sensação de que falar mata.
- **Conflitos:** com Sahar (que a sufoca de proteção); com o próprio medo; com o que ela sabe e não consegue dizer.
- **Relações:** irmã de Sahar (alavanca de confiança: tratar bem Sahar abre Júlia). Testemunha que pode confirmar o barco, a hora e — crucialmente — **um rosto**.
- **Arco:** testemunha esquiva que **some quando pressionada** → se conquistada com paciência, entrega a peça que data e localiza tudo → em alguns caminhos, vira **alvo** por ter falado (pode sumir/morrer se exposta sem cuidado).
- **Estilo de escrita:** **ansiosa, escreve e apaga**, manda **"esquece"** depois de contar, **abrevia tudo** (vc, pq, blz, tdb), **some por horas** quando tem medo.
  - *"vc é amiga da minha irma né? blz. posso te falar uma coisa? esquece"*
  - *"eu nao vi nada juro. eu tava de folga. pq vc ta perguntando isso pra mim"*
  - *(depois de horas)* *"desculpa sumi. tava com medo. tem uma coisa no sistema da pousada daquela noite q num bate"*

---

## 5.8 Vesna Toma — `vesna`

- **Nome completo:** Vesna Toma · **Idade:** 45 · **Papel:** Inspetora de polícia vinda da capital. · **Introdução:** Capítulo 8 · **Avatar:** VT, cinza-azulado (#94A0B3).
- **Aparência:** terno cinza, postura dura, foto de perfil é um crachá funcional.
- **Histórico:** transferida (ou autoexilada) da capital há 6 meses. Não é corrupta — mas é **cética, institucional e isolada**. Trata todos como suspeitos, inclusive Eron e o jogador. Talvez tenha vindo a Corvo Pálido fugindo do próprio fracasso num caso antigo.
- **Objetivos:** resolver o caso pelos **procedimentos**, sem alarde. Não ser manipulada (nem pela cidade, nem pelo jogador). Provar que ainda é boa no que faz.
- **Segredos:** desconfia da estrutura local (Rolando, laudos antigos), mas precisa de provas que sobrevivam num tribunal — não de áudios de pescador bêbado. Pode ter **suspeitado de Vey** e arquivado por falta de prova.
- **Mentiras:** poucas; ela **omite por método** ("não comento investigação em andamento"). Sua frieza parece cumplicidade, mas raramente é.
- **Traumas:** um caso na capital que desabou; descrédito; solidão profissional.
- **Conflitos:** com a cidade que não coopera; com o jogador (vê amador atrapalhando); com a tentação de fechar o caso fácil.
- **Relações:** **aliada poderosíssima se conquistada** — é a única que pode prender alguém. Antagonista se o jogador agir por fora e queimar provas. Entregar a ela a evidência certa (cadeia de custódia) é caminho do Final I; entregar a evidência **errada** (apontando Bruno) é caminho do Final IV.
- **Arco:** obstáculo institucional → cética relutante → (se conquistada) **força da lei que quebra a corrente** ou (se hostilizada) o muro que protege a cidade por inércia.
- **Estilo de escrita:** **seca, institucional**, frases de uma linha, **numera perguntas**, nunca cumprimenta, sempre encerra com **"Aguardo retorno."**
  - *"1. Como obteve este áudio. 2. Quem mais o ouviu. 3. Onde está o aparelho original. Aguardo retorno."*
  - *"Especulação não é prova. Traga a cadeia de custódia ou não traga nada. Aguardo retorno."*
  - *"Registramos sua informação. Não interfira na cena. Aguardo retorno."*

---

## 5.9 Rolando Saldanha — `rolando`

- **Nome completo:** Rolando Saldanha · **Idade:** 61 · **Papel:** Vereador; pai de Bruno; criador da orla. **Poder político / red herring de "mandante".** · **Introdução:** Capítulo 9 · **Avatar:** RS, roxo (#A06CE4).
- **Aparência:** terno bem cortado, sorriso largo de palanque, aperto de mão firme. Foto de perfil em evento da orla.
- **Histórico:** três mandatos. Construiu metade da orla. Encarna o **interesse econômico** que o encobrimento protege. Conhece todos os segredos políticos da cidade — mas, crucialmente, **não é o cérebro do crime**: ele é cliente e refém da rede de Vey tanto quanto beneficiário.
- **Objetivos:** proteger o projeto, o nome da família e o filho. Que o caso "seja página virada".
- **Segredos:** sabe que houve encobrimentos e **lucrou** com o silêncio. Está sendo **chantageado** por Vey (Vey sabe de algo que arruinaria Rolando). É co-conspirador, não chefe.
- **Mentiras:** vagueza profissional; promete reuniões que não acontecem; "vamos cuidar disso, meu amigo". Mente como político: nunca uma negativa direta, sempre um desvio cordial.
- **Traumas:** medo de perder o império que construiu sobre um pântano alagado; medo do que Vey tem contra ele.
- **Conflitos:** com Cael (a imprensa); com o filho (a quem protege e despreza); com Vey (preso pelo próprio segredo).
- **Relações:** o jogador vai suspeitar fortemente que **Rolando é o mandante**. Pai de Bruno. Refém de Vey. Aliado/inimigo de Vesna conforme conveniência.
- **Arco:** suspeito de mandante → revelado como **engrenagem corrupta porém subordinada** → em alguns finais cai junto (Final I), em outros sobrevive politicamente (Finais IV/V).
- **Estilo de escrita:** **político**: cordial, vago, chama todos de **"meu amigo"/"minha amiga"**, nunca responde diretamente, promete reuniões.
  - *"Meu amigo, que história triste a dessa menina. Estamos todos rezando. Aparece no gabinete que a gente conversa com calma, tá?"*
  - *"Olha, eu não entraria nesse assunto de laudo antigo, minha amiga. Coisa de muito tempo. Página virada."*
  - *"Você anda ouvindo gente que não quer o bem dessa cidade. A gente se fala."*

---

## 5.10 Teodoro "Teo" Vidal — `teo`

- **Nome completo:** Teodoro Vidal · **Idade:** 68 · **Papel:** Pescador; testemunha do motor. · **Introdução:** Capítulo 10 · **Avatar:** TV, verde (#7CC48A).
- **Aparência:** boné encardido, mãos calejadas, cheiro de lago. Foto de perfil é uma foto antiga dele com um peixe.
- **Histórico:** pesca no lago desde criança, de antes da represa. Conhece o som de cada motor. Na noite do sumiço, ouviu um **motor de popa no lado proibido** (`ev_dock_audio`) — onde ninguém tem licença há 20 anos. Bebe.
- **Objetivos:** ser **acreditado** ("eu não tava bêbado, moço"). Pescar em paz. Talvez expiar uma culpa antiga (ele pode ter visto algo numa das mortes passadas e calado).
- **Segredos:** já viu coisas no lago em outras noites, ao longo dos anos, e **se calou** por medo/descrédito. Carrega isso como peso. Pode saber de uma das mortes antigas.
- **Mentiras:** confunde datas (de verdade, pela bebida e pela idade) — o que faz a verdade dele parecer mentira. Não mente por mal.
- **Traumas:** descrédito; culpa por silêncios passados; solidão.
- **Conflitos:** com a própria memória; com a cidade que ri dele; com a bebida.
- **Relações:** testemunha auditiva crucial. Sua credibilidade é frágil — Vesna o descarta; o jogador precisa **corroborar** o que ele diz com outras provas (Júlia, EXIF da foto). Pode levar à casa do guarda / ao que está afundado.
- **Arco:** bêbado folclórico desacreditado → testemunha cuja confusão **esconde uma verdade central** → se o jogador tiver paciência, Teo entrega a noite (e talvez uma morte antiga). Pode "sumir"/calar de vez se desprezado.
- **Estilo de escrita:** **quase só áudios longos e divagantes**; começa uma história e termina outra; quando escreve, **MAIÚSCULAS sem querer**; **confunde datas**.
  - *(áudio)* *"…tá ouvindo? é motor de popa. NINGUÉM tem licença pra esse lado faz vinte ano. eu não tava bêbado, moço. eu sei o que ouvi"*
  - *"foi numa terça. ou quinta. sei lá. faz tempo. mas o BARULHO eu nunca esqueço"*
  - *(áudio de 4 min que começa falando de Lia e termina falando de um peixe que pegou em 1994)*

---

## 5.11 Inês Lund — `ines`

- **Nome completo:** Inês Lund · **Idade:** 60 · **Papel:** Arquivista municipal; guardiã da memória proibida. · **Introdução:** Capítulo 11 · **Avatar:** IL, dourado (#E4C56C).
- **Aparência:** óculos na ponta do nariz, casaco de lã, cercada de pastas. Foto de perfil: estante de arquivo.
- **Histórico:** cuida do arquivo municipal há décadas. **Lembra de todos os afogamentos**. Guardou recortes e cópias de laudos que a prefeitura **mandou destruir** — desobedeceu por princípio. Lia ia muito ao arquivo nos últimos meses; Inês foi mentora silenciosa da investigação dela. O memo de Lia diz: *"comecem pela Inês. ela guarda o ano certo."*
- **Objetivos:** que a verdade **sobreviva em papel**. Proteger o que guardou. Não morrer sendo a última a saber.
- **Segredos:** tem **cópias dos três laudos** e a prova de que são quase idênticos (`ev_archive_laudos`); guarda o **registro de óbito de Mira com a inconsistência** que sugere caixão vazio; sabe que Vey assinou tudo. Pode ter guardado também documentos de Henrique.
- **Mentiras:** quase nenhuma — Inês é guardiã, não mentirosa. Hesita (reticências) porque pesar o que revelar é a vida dela.
- **Traumas:** ter visto a cidade enterrar a verdade vez após vez sem poder gritar.
- **Conflitos:** com a prefeitura; com o medo (ela é velha e sozinha, e sabe demais).
- **Relações:** **fonte de ouro** e personagem maternal. Ponte para o passado, para Henrique e para Mira (foi quem registrou os óbitos). Em perigo conforme o jogador se aproxima.
- **Arco:** velhinha gentil do arquivo → reveladora do **padrão documental** → em risco mortal no terço final (alvo de "limpeza"); pode **morrer/sumir** se o jogador for descuidado, levando provas consigo.
- **Estilo de escrita:** **pausada, gentil**, manda **fotos de documentos**, escreve "como quem fala baixo", **reticências** para hesitar, **cita anos exatos** de memória.
  - *"Eu guardei tudo, sabe… mandaram queimar em 2009. Eu não queimei. Olhe a data deste aqui."*
  - *"Três laudos. Mil novecentos e… não. Quinze anos, doze, onze. A mesma frase no parágrafo final. A mesma."*
  - *(foto de documento) "A menina Halász… o registro diz caixão lacrado por ordem do legista. Por quê lacrado, eu sempre me perguntei…"*

---

## 5.12 Dário Penha — `dario`

- **Nome completo:** Dário Penha · **Idade:** 33 · **Papel:** Editor de fotografia do ensaio de Lia; na capital, nunca veio à cidade. · **Introdução:** Capítulo 12 · **Avatar:** DP, azul (#6C8AE4).
- **Aparência:** (o jogador nunca o vê de fato; foto de perfil profissional) barba, óculos, estúdio ao fundo.
- **Histórico:** editava o ensaio fotográfico de Lia sobre o lago para publicação. Mora na capital, **nunca pôs os pés em Corvo Pálido** — o que faz dele um dos poucos **fora do alcance da cidade**, e portanto um aliado seguro. Leal a Lia profissionalmente e pessoalmente.
- **Objetivos:** publicar o ensaio de Lia — agora também como forma de justiça. Recuperar os arquivos/negativos dela.
- **Segredos:** tem **backups dos arquivos de Lia na nuvem** (`ev_lia_cloud`), incluindo fotos e drafts de texto que ela mandou e que ninguém na cidade viu — possivelmente a foto/registro que prova quem estava no píer, ou a primeira menção a Mira viva.
- **Mentiras:** praticamente nenhuma; é objetivo a ponto de frio. Pode reter material por **ética profissional** ("não publico fonte sem checar") até confiar no jogador.
- **Traumas:** culpa por ter empurrado Lia para a pauta perigosa ("eu pedi mais fotos do lago").
- **Conflitos:** com prazos; com o sentimento de ter mandado uma amiga para o perigo de longe.
- **Relações:** **cofre externo** das provas de Lia. Ponte segura, imune à pressão local. Pode publicar (com Cael) e detonar o Final I — ou recuar se mal conduzido.
- **Arco:** voz técnica distante → guardião involuntário da prova decisiva → aliado que **leva a verdade para fora da cidade** (essencial nos finais de exposição).
- **Estilo de escrita:** **objetivo e técnico** — fala de **"pauta", "recorte", "fechamento"**; frio com estranhos, leal a Lia; manda **links e prazos**.
  - *"A pauta era 'o lago que engole gente'. A Lia me mandou 240 frames. Tem três que ela marcou como 'não publicar ainda'. Por quê, eu não sei."*
  - *"Posso te dar acesso ao drive. Mas antes: você é quem na história dela? Não trabalho com fonte que não consigo verificar."*
  - *"Fechamento era pra ontem. Se ela aparecer, segura tudo. Se não… a gente publica como obra dela."*

---

## 5.13 Pastor Edmar Reis — `edmar`

- **Nome completo:** Edmar Reis · **Idade:** 57 · **Papel:** Pastor da única igreja; enterrou os afogados. **Consciência sufocada da cidade.** · **Introdução:** Capítulo 13 · **Avatar:** ER, roxo (#A06CE4).
- **Aparência:** terno preto puído, Bíblia gasta, olhar de quem dorme pouco. Foto de perfil: a fachada da igreja.
- **Histórico:** lidera a única igreja há décadas. **Enterrou os três afogados** (e o pai de Lia). Ouviu **confissões** que o assombram — possivelmente de pessoas envolvidas no encobrimento, talvez do próprio Vey. Sabe muito; o segredo de confissão e o medo o calam.
- **Objetivos:** aliviar a própria alma sem violar o segredo de confissão. Que a verdade venha "por outras mãos" (as do jogador) sem que ele a entregue diretamente.
- **Segredos:** sabe que **um dos caixões pode estar vazio** (Mira); sabe quem confessou o quê. Guarda um registro de enterro (`ev_burial_records`) que prova caixão fechado/lacrado em todos os casos.
- **Mentiras:** não mente — **desvia** com perguntas e versículos. A omissão dele é doutrinária, não criminosa.
- **Traumas:** culpa religiosa profunda por ter "abençoado" mentiras; medo do julgamento (divino e terreno).
- **Conflitos:** entre o dever do silêncio e o peso da verdade; com Vey (que pode tê-lo confessado); com a própria fé.
- **Relações:** porta entreaberta para a verdade. Se o jogador for paciente e digno, Edmar aponta o caminho **sem dizer o nome**. Pode ligar Vey ao crime via confissão (sem prova jurídica).
- **Arco:** figura evasiva e enigmática → consciência que **cede o suficiente** para guiar o jogador → em alguns finais, confessa em público (catalisador do Final I); em outros, leva tudo em oração.
- **Estilo de escrita:** **brando**, cheio de **metáforas e versículos**, evita nomes, **responde perguntas com perguntas**, pede para **"conversarmos pessoalmente"**.
  - *"O que está submerso não deixa de existir, meu jovem. Apenas espera a água baixar. Você já se perguntou por que ninguém pede para baixar a água?"*
  - *"Eu enterrei muita gente nesta cidade. Algumas em caixões que eu nunca abri. Por que você acha que pedem para não abrir?"*
  - *"Há coisas que eu não posso dizer. Mas posso orar para que você pergunte à pessoa certa. Conversaríamos melhor pessoalmente."*

---

## 5.14 Mira Halász — `mira`

- **Nome completo:** Mira Halász · **Idade:** 26 · **Papel:** "Afogada" há 11 anos, **viva e escondida**; meia-irmã de Lia. **A grande reviravolta.** · **Introdução:** Capítulo 14 · **Avatar:** MH, verde-água (#5BD6C0).
- **Aparência:** o jogador nunca vê o rosto dela com clareza; fotos sempre parciais, escuras, recortadas. Vive sob outra identidade.
- **Histórico:** filha de Henrique Moreaux fora do casamento (segredo). Aos 15, depois da morte do pai, percebeu que sabia demais e seria a próxima. **Forjou a própria morte** (caixão fechado, laudo de Vey) e fugiu. Vive há 11 anos no anonimato, vigilante. Lia a **encontrou** meses antes do sumiço; a relação entre as duas — meias-irmãs unidas pela mesma ferida — é o coração emocional secreto do jogo.
- **Objetivos:** sobreviver sem ser encontrada. Proteger Lia (e, agora, descobrir o que houve com ela). Ver a verdade do pai exposta — sem se expor.
- **Segredos:** está **viva**; é **meia-irmã** de Lia e Eron; sabe a verdade sobre a morte de Henrique (testemunhou ou quase); sabe que Vey lacrou seu caixão e portanto **sabe que ele sabe que ela vive** — um nó de terror.
- **Mentiras:** muda de número, dá pistas falsas sobre onde está, **testa o jogador** com perguntas antes de revelar qualquer coisa. Mente sobre localização por sobrevivência pura.
- **Traumas:** ter "morrido" aos 15; perder pai e identidade; viver olhando por cima do ombro há 11 anos.
- **Conflitos:** desejo de justiça vs. instinto de fuga; amor recém-descoberto por Lia/Eron vs. necessidade de não se ligar a ninguém.
- **Relações:** **meia-irmã de Lia e Eron** (revelado em camadas); ligada a Noemi pelo segredo de Henrique; conhece Vey como a mão que assinou sua "morte". Aliada tardia e frágil.
- **Arco:** contato anônimo e arredio → testemunha que valida toda a teoria → **revelação familiar** que reescreve o caso → presença decisiva no Final III (com Lia) e catalisadora no Final I. Pode **sumir para sempre** (de novo) se o jogador a expuser.
- **Estilo de escrita:** **cautelosa, testa antes de confiar, troca de número**. Escreve **bonito quando relaxa**, **cortante quando tem medo**; **nunca diz onde está**.
  - *(arredia)* *"como você conseguiu esse número. responda em uma frase ou eu sumo."*
  - *(relaxada)* *"a Lia tirava foto do que dói. ela me achou pela luz numa janela que não devia ter ninguém. ninguém nunca tinha me achado."*
  - *(com medo)* *"não pergunte onde eu estou. nunca. se você sabe onde eu estou, eles também sabem."*

---

## 5.15 Kel — `kel`

- **Nome completo:** Kel (identidade não confirmada) · **Idade:** desconhecida · **Papel:** Contato anônimo; voz fria que sabe demais. **Curinga / red herring de identidade.** · **Introdução:** Capítulo 5 · **Avatar:** K, cinza (#5C6678).
- **Aparência:** nenhuma. Número sem nome. Sem foto.
- **Histórico (a verdade, mantida ambígua até tarde):** "Kel" é uma **identidade-canal**, não necessariamente uma pessoa nova. Pode ser **Mira** sob outro disfarce nas fases iniciais (testando o jogador antes de se revelar no Cap. 14), **ou** um informante interno (alguém da estrutura com culpa — possível ramificação para Júlia/Edmar/até Bruno em certas rotas), **ou**, na rota mais sombria, **um isco de Vey** para mapear o que o jogador sabe. O design mantém Kel deliberadamente **interpretável**, e qual leitura se confirma depende das escolhas.
- **Objetivos (aparentes):** descobrir o que o jogador sabe; empurrá-lo numa direção. Os objetivos reais variam conforme quem Kel é na rota.
- **Segredos:** a própria identidade. Apaga as mensagens depois de enviar — então o jogador **não pode reler** o que Kel disse (forte gancho de tensão e de "será que eu imaginei isso?").
- **Mentiras:** mistura verdades verificáveis com **uma mentira plantada**, para parecer confiável e desviar.
- **Traumas/conflitos:** indefinidos por design.
- **Relações:** orbita todos. É a fonte de várias **pistas falsas** (§8). Confiar cegamente em Kel pode levar o jogador a acusar Bruno (Final IV) ou a se expor (Final V).
- **Arco:** voz inquietante → suspeito de ser o vilão → revelado (numa de várias leituras) como Mira/aliado/isca → resolução depende da rota. **Nunca um info-dump:** Kel pergunta mais do que responde.
- **Estilo de escrita:** **frio, preciso**, **faz perguntas em vez de responder**, frases curtas com peso, **nunca usa o próprio nome**, **apaga as mensagens depois de enviar**.
  - *"Você confia no irmão? Pergunta de verdade. Não me responda agora."* *(mensagem some)*
  - *"02:14. Olhe a margem direita da foto, não a luz. O que você não está vendo?"*
  - *"Eu não vou te dizer quem eu sou. Vou te dizer em quem não acreditar. Comece pelo nome mais simpático."* *(mensagem some)*

---

## 5.16 Dr. Adriano Vey — `adriano`

- **Nome completo:** Adriano Vey · **Idade:** 56 · **Papel:** Legista da cidade. **O verdadeiro manipulador** (revelado ~Cap. 17). · **Introdução:** Capítulo 17 (como suspeito); **presente desde o Cap. 2 disfarçado** ("o estranho com maleta de médico"). · **Avatar:** AV, ciano-suave (#6CC4C4) — propositalmente uma cor "amigável".
- **Aparência:** sessenta aparentes, terno cinza impecável, voz baixa, mãos sempre limpas, uma **maleta de médico antiga**. O homem mais tranquilizador da cidade. Foto de perfil sóbria e simpática.
- **Histórico:** legista de Corvo Pálido há décadas. **Assinou os laudos de todos os afogamentos** — Nádia, Henrique, Mira — e o de Lia, se houver. Construiu, autópsia após autópsia, um **arquivo de poder**: ele decide o que cada corpo "diz", e por isso controla prefeito, vereador, polícia antiga e pastor por meio do que sabe. **Não é músculo; é a caneta.**
- **Objetivos:** preservar o sistema que o tornou intocável. Manter o lago fechado e a verdade afundada. **"Cuidar" do jogador** — o que, na boca dele, significa neutralizar.
- **Segredos:** é o arquiteto do encobrimento; sabe que Mira está viva (lacrou o caixão); orquestrou ou cobriu cada morte; é "o estranho do café"; vinha **ajudando** o jogador justamente para vigiá-lo.
- **Mentiras:** as mais perigosas do jogo — **tecnicamente verdadeiras, moralmente fatais**. Nunca uma negativa grosseira; sempre uma explicação plausível, um "esclarecimento" que afasta o jogador da verdade com gentileza.
- **Traumas:** nenhum que o jogador deva sentir como desculpa — Vey é o vilão lúcido, sem autopiedade. O frio dele é o ponto.
- **Conflitos:** entre manter a serenidade e o fato de que o jogador, sozinho de fora, é a única variável que ele não consegue comprar nem chantagear.
- **Relações:** "ajuda" o jogador e Vesna; chantageia Rolando; lacrou o destino de Mira; assinou a morte do pai de Lia. **Aranha no centro da teia.**
- **Arco:** aliado gentil e útil (Caps. 2–16, em segundo plano e depois ativo) → revelação como manipulador (Cap. 17) → **mais gentil quanto mais perto o jogador chega** (Caps. 18–20) → confronto final cujo desfecho define o final. Em "A Corrente Quebrada" (Final I) ele cai; em "O Barco Vazio" (Final II) ele **escapa, calmo, com uma passagem comprada em dinheiro**; em "O Nome Errado" (Final IV) ele **agradece em silêncio**; em "Água Parada" (Final V) ele **vence sem levantar a voz**.
- **Estilo de escrita:** **sereno, didático**, tranquiliza como um médico tranquiliza um paciente; usa **"compreendo"** e **"naturalmente"**; **quanto mais perto da verdade, mais gentil fica**.
  - *"Compreendo a sua angústia. É natural, num caso assim, querer ver padrões. Deixe-me esclarecer cada laudo, com calma. Estou à disposição, a qualquer hora."*
  - *"Você não está dormindo bem, imagino. Ninguém dorme bem perto da verdade. Naturalmente. Posso te receber, sem pressa. Traga o que encontrou — vamos olhar juntos."*
  - *(perto do fim)* *"Estou tão orgulhoso do quanto você chegou longe. De verdade. Poucos chegam. Agora respire. Eu cuido do resto, como sempre cuidei."*

---

## 5.17 Henrique Moreaux — `henrique`

- **Nome completo:** Henrique Moreaux · **Idade:** (falecido; teria ~50) · **Papel:** Pai de Lia, Eron e Mira; guarda noturno da represa; **primeira testemunha morta**. · **Introdução:** Capítulo 11 (via documentos), eco até o fim. · **Avatar:** HM, cinza (#5C6678).
- **Aparência:** só em fotos antigas — homem grande de jaqueta de guarda, sempre sério.
- **Histórico:** guarda noturno da represa há ~12 anos. Descobriu a verdade sobre Nádia, começou a investigar e foi **assassinado** (oficialmente "caiu"). Pai de Lia/Eron com Noemi e de Mira fora do casamento. É o **trabalho que Lia herdou** ("terminar o que o pai começou").
- **Objetivos (póstumos):** expostos pelas cartas/gravações — ele queria provar que Nádia foi morta e proteger a família.
- **Segredos:** escreveu **cartas e fez gravações** escondidas (`ev_henrique_letters`, `ev_henrique_tape`), trancadas na caixa de Noemi; documentou suas suspeitas e talvez **nomeou** quem temia.
- **Mentiras:** nenhuma — Henrique é a voz honesta do passado. Suas perguntas "que nunca respondeu" ecoam as do jogador.
- **Traumas:** (na escrita dele) o peso de saber e não poder provar; medo pela família.
- **Conflitos:** o guarda solitário contra a cidade inteira — espelho do jogador.
- **Relações:** pai dos três jovens centrais; vítima de Vey/da estrutura; mentor fantasma de Lia.
- **Arco:** nome num cartaz/laudo → vítima → **autor de provas** que validam tudo → no Final III, sua casa abandonada é onde Lia se escondeu (o trabalho dele, terminado pela filha).
- **Estilo de escrita:** **só por cartas manuscritas e gravações antigas**; letra apertada; **perguntas que ele nunca respondeu**.
  - *(carta) "Se eu estou escrevendo isto, é porque já não confio no telefone. Anotei as datas. Olhem as datas. Por que sempre o mesmo médico?"*
  - *(gravação chiada) "…terceira noite que vejo a luz na margem norte. Não é pescador. Pescador não desliga o motor."*

---

## 5.18 Nádia Cruz — `nadia`

- **Nome completo:** Nádia Cruz · **Idade:** 19 (na morte) · **Papel:** A **primeira** das três "afogadas", há ~15 anos; corpo nunca encontrado. · **Introdução:** Capítulo 11 (em recortes/registros). · **Avatar:** NC, cinza (#94A0B3).
- **Aparência:** só num obituário desbotado e numa foto de recorte.
- **Histórico:** jovem que viu/soube algo que ameaçava o projeto da orla em seu início. Morreu primeiro; o **corpo nunca apareceu** (sem perícia independente, o laudo de Vey é a única "verdade"). É a **pedra fundamental** do encobrimento.
- **Segredos:** o que ela sabia (o crime original ligado ao alagamento do vale — possivelmente que o projeto enterrou algo/alguém literalmente sob a água, ou um desvio criminoso na obra). Foi por isso que Henrique morreu ao reabrir o caso dela.
- **Relações:** vítima zero; o fio que liga Henrique, Mira e Lia. Sua família foi silenciada/dispersada.
- **Arco:** nome esquecido → **a chave do "porquê"** de toda a corrente. Resolver o caso de Lia é, no fundo, finalmente resolver o de Nádia.
- **Estilo:** **existe apenas em recortes, registros e na memória dos outros** (sem mensagens diretas).
  - *(obituário) "NÁDIA CRUZ, 19. Tragédia no lago. Buscas encerradas sem êxito. Laudo: A. Vey."*

---

## 5.19 (Personagem funcional) A Cidade de Corvo Pálido

Não é uma ficha de NPC, mas a equipe deve tratá-la como **personagem-ambiente**. A cidade "fala" por: manchetes da Gazeta (`news_*`), o silêncio coletivo, portas que se fecham, a foto da janela do jogador. Em vários finais (II, V), **é a cidade que vence** — não um vilão. Toda vez que o jogador se aproxima da verdade, a "cidade" reage (mensagens param, contatos somem, a Gazeta "encerra o caso"). Mecanicamente, isso se expressa por flags de heat/perigo (§12).

---

## 5.20 Notas de elenco para o time

- **Nenhum personagem é só uma função.** Cada um quer algo do jogador (atenção, prova, silêncio, perdão) e esconde algo.
- **Vozes proibidas de se confundir:** se o time precisar checar, abra duas mensagens sem nome — Eron (minúsculo, cru) nunca pode soar como Cael (formal, datado) nem como Vey (sereno, "naturalmente"). Sahar (emojis quentes) nunca como Vesna (numerada, "Aguardo retorno."). Júlia (abrevia, apaga) nunca como Inês (reticências, anos exatos).
- **Os mortos falam.** Lia, Henrique e Nádia só existem por mídia/arquivo — e por isso são **inquestionavelmente honestos** em comparação aos vivos, que todos mentem em algum grau. Isso é temático: na cidade do silêncio, só os mortos não têm motivo para mentir.

---

# 6. Mapa de Relacionamentos

> Quem ama, odeia, teme, chantageia ou protege quem — e como a confiança de cada um sobe e desce. Use junto com §10 (sistema de confiança) e §11 (consequências).

## 6.1 Diagrama de forças (texto)

```
                          DR. ADRIANO VEY  (a caneta / o vilão)
                          chantageia ▲   ▲ "ajuda" e vigia
                          ┌──────────┘   └────────────┐
                    ROLANDO SALDANHA               O JOGADOR
                    (refém + beneficiário)         (de fora; intocável)
                          │ pai                        │ confia em / é traído por
                          ▼                             ▼
                       BRUNO ◄── ex-namoro ── LIA (desaparecida) ──► ERON (irmão, leal)
                       (covarde,                 │  ▲                   │
                        red herring)             │  │ meia-irmãs        │ família-coração
                                                 │  │                   ▼
                              meia-irmã viva ► MIRA          SAHAR ──► JÚLIA (irmã, testemunha)
                                                 ▲             (amiga)
                                    pai de ambas │
                              HENRIQUE MOREAUX (morto) ◄── NOEMI (viúva, guarda o segredo)
                                                 │
                                    investigava │
                                                 ▼
                                          NÁDIA CRUZ (vítima zero)

   PERIFERIA: CAEL (jornalista, quer publicar) · INÊS (arquivo, prova documental) ·
              DÁRIO (cofre externo das fotos) · EDMAR (consciência, confissões) ·
              TEO (testemunha auditiva) · VESNA (lei, cética) · KEL (curinga ambíguo)
```

## 6.2 Tabela de vínculos (quem sente o quê)

| De → Para | Sentimento dominante | Esconde |
|---|---|---|
| Eron → Jogador | dependência, confiança crescente | que alguém invadiu o quarto de Lia |
| Eron → Noemi | mágoa pelo silêncio | que guardou a página do caderno |
| Sahar → Lia | amor de irmã, luto | o quanto está em pânico |
| Sahar → Júlia | proteção sufocante | que teme que Júlia tenha visto algo |
| Júlia → Sahar | dependência, culpa | o que viu na pousada |
| Noemi → filhos | amor + medo | a caixa, Mira, o assassinato de Henrique |
| Noemi → Vey/estrutura | terror surdo | que já foi silenciada |
| Bruno → Lia | amor covarde, culpa | que sabe dos negócios do pai |
| Bruno → Rolando | medo + dependência | que poderia tê-la ajudado e não ajudou |
| Rolando → projeto | obsessão de legado | encobrimentos e lucro |
| Rolando → Vey | medo (chantageado) | o que Vey tem contra ele |
| Vey → Jogador | controle disfarçado de gentileza | que é o arquiteto de tudo |
| Vey → Mira | sabe que ela vive | usa isso como trunfo silencioso |
| Mira → Lia | amor recém-descoberto | a própria localização |
| Mira → Vey | terror absoluto | tudo o que viu |
| Cael → verdade | obsessão profissional | que já recuou por medo |
| Inês → verdade | dever de memória | onde escondeu as cópias |
| Edmar → cidade | culpa pastoral | confissões (não pode revelar) |
| Teo → cidade | ressentimento por descrédito | silêncios antigos |
| Vesna → todos | suspeita metódica | que já desconfia de Vey |

## 6.3 Triângulos e nós dramáticos

- **O triângulo do silêncio (Noemi–Vey–Lia):** Noemi se calou e sobreviveu; Lia não se calou e sumiu. A ameaça "você não é sua mãe" amarra os três. A escolha do jogador de **insistir com Noemi ou poupá-la** ecoa esse triângulo.
- **O triângulo Saldanha (Rolando–Bruno–Lia):** o pai protege o projeto, o filho protege a si mesmo, e Lia ameaçava os dois. O jogo empurra o jogador a fechar esse triângulo em Bruno (Final IV) quando o ápice real é Vey.
- **O nó das irmãs (Lia–Mira):** meias-irmãs separadas por uma morte forjada; reuni-las (de qualquer forma) é o coração do Final III e a alavanca emocional do Final I.
- **O par de testemunhas (Teo–Júlia):** um ouviu, a outra viu. Sozinhos, são descartáveis; **cruzados**, datam e localizam o crime. Corroborá-los é técnica-chave do jogador.

## 6.4 Como a confiança se move (resumo; detalhe em §10)

- **Eron:** sobe quando o jogador é cuidadoso/discreto e o trata como parceiro, não criança; cai se o jogador apela à polícia cedo ou o ignora.
- **Sahar:** sobe com empatia ("como você está, de verdade?") e proteção de provas; cai com frieza ou exposição da irmã.
- **Júlia:** sobe **lentamente** e só por tabela (via Sahar) e paciência; despenca com pressão direta — ela **some** literalmente.
- **Cael/Dário:** sobem com reciprocidade de informação e profissionalismo; caem se o jogador queima fontes.
- **Vesna:** sobe **só** com prova com cadeia de custódia; cai com especulação e ação por fora.
- **Mira:** sobe passando nos **testes** dela e nunca perguntando onde está; zera se o jogador a expõe a terceiros.
- **Vey (trust invertido):** o jogador "confia" em Vey por padrão; o design recompensa **desconfiar dele cedo**. Tratar Vey como aliado aumenta um contador oculto de perigo (`vey_grip`).

---

# 7. Estrutura de Capítulos

> Prólogo + 20 capítulos + Epílogo. Cada capítulo lista: **título · objetivo narrativo · resumo · novos personagens (2–5) · novas evidências (5–10, com ids) · eventos importantes (3–5) · escolhas significativas (5–10, com consequências curtas e de longo prazo) · escalada de tensão · reviravolta/pista falsa**.
>
> **Nota de implementação:** Prólogo, Cap. 1 e Cap. 2 **já existem** em `src/story/chapters/` e são descritos aqui exatamente como implementados. Capítulos 3–20 e Epílogo são especificação de produção. Ids de evidência marcados `(NOVO)` ainda não existem no build e devem ser criados em `evidence.json`. Convenções de ids em §17.

---

## PRÓLOGO — "Número Desconhecido" (`prologue`)

- **Objetivo:** alguém está te escrevendo de um número que você não conhece.
- **Resumo:** cold open puro. Eron usa o celular escondido da irmã para contatar o único número de fora da cidade — o seu. Em poucas trocas, o jogador descobre que Lia sumiu há três noites e que a polícia "fechou o caderno". O caso abre quando o jogador decide (ou não) ajudar.
- **Novos personagens:** **Eron** (`eron`, primeiro contato); **Lia** (`lia`, presença/ausência).
- **Novas evidências:** `ev_missing_flyer` (cartaz de desaparecimento); `ev_last_photo` (última foto, 02:14, píer norte).
- **Eventos:** (1) primeiro contato anônimo; (2) revelação de que "ela" é Lia, irmã de Eron, desaparecida; (3) entrega do cartaz; (4) entrega da última foto e do horário/local proibido; (5) o jogador aceita (ou questiona) o caso.
- **Escolhas (implementadas):**
  - `c_who` / `c_wrong` / `c_who2` — primeira resposta ao desconhecido (define tom inicial; sem custo mecânico).
  - `c_help` ("Vou te ajudar a procurar") → **+12 confiança Eron**, flag `promised_help`, **+1 score `ending_solved`**. *Longo prazo:* desbloqueia entregas de alta-confiança de Eron já no Cap. 1.
  - `c_why` ("Por que logo eu?") → resposta de Eron sobre ser "de fora"; neutro mecanicamente, frio narrativamente.
  - `c_police` ("Já falou com a polícia?") → **+1 score `ending_conspiracy`**. *Longo prazo:* marca uma tendência "institucional" que, repetida, empurra para finais em que a cidade/lei te engolem.
- **Tensão:** baixa, mas a estranheza é imediata (mensagem sem contexto; foto às 02:14 num lugar proibido).
- **Reviravolta/pista falsa:** o "engano de número" é desfeito (era o celular escondido de Lia). Planta a primeira dúvida: **por que o número do jogador estava escondido?**
- **Saída:** `chapterEnd` → `chapter01`; timeline `t_case_opened`.

---

## CAPÍTULO 1 — "O Celular Escondido" (`chapter01`)

- **Objetivo:** descobrir por que Lia escondeu o próprio celular antes de sumir.
- **Resumo:** Eron entrega as primeiras provas. **A confiança construída aqui decide quanto ele revela** — em particular, a página do caderno só sai com confiança ≥ 60.
- **Novos personagens:** nenhum novo na tela; **Sahar** é anunciada (contato passado ao fim).
- **Novas evidências:** `ev_voice_lia1` (memo "caso alguém ouça", cita Inês); `ev_screenshot_threat` (print "pare de procurar"); `ev_lia_notebook` (página do caderno — **gated por confiança ≥ 60**; senão Eron segura, flag `held_notebook`).
- **Eventos:** (1) Eron revela que achou o celular escondido atrás da gaveta; (2) entrega do memo de voz; (3) menção a Inês e a "afundaram algo no lago"; (4) revelação de que o pai era guarda da represa e morreu lá; (5) entrega (ou retenção) da página do caderno; (6) repasse do contato de Sahar.
- **Escolhas (implementadas):**
  - `c1a_alone` ("Tem mais alguém aí?") → **+5 Eron**, flag `careful_with_eron`. *Longo prazo:* discrição agrada Eron e Mira mais tarde; abre a revelação da "janela aberta" (invasão).
  - `c1a_send` ("Manda tudo") → neutro; entrega o áudio sem bônus de cuidado.
  - `c1a_police` ("Leva pra polícia") → **+1 `ending_conspiracy`**; Eron resiste ("some igual sumiu o do meu pai").
  - `c1b_believe` / `c1b_ines` / `c1b_fear` ("andava com medo?") → a última dá **+5 Eron** e entrega o print da ameaça.
  - **Gate de confiança:** se Eron ≥ 60 → entrega `ev_lia_notebook` (flag `has_notebook`); senão `held_notebook`. *Longo prazo crítico:* `has_notebook` muda o que **Sahar** admite no Cap. 2 (ela confirma a teoria do pai empurrado) e habilita várias linhas dos Caps. 11–14.
- **Tensão:** sobe — o celular **escondido**, a **ameaça** explícita a Lia e o sinal de **invasão** no quarto.
- **Reviravolta/pista falsa:** o memo cita Inês ("ela guarda o ano certo") plantando o arquivo como destino; a morte do pai entra como **possível acidente x assassinato** (ambiguidade que sustenta metade do jogo).
- **Saída:** `chapterEnd` → `chapter02`.

---

## CAPÍTULO 2 — "O Bilhete no Açucareiro" (`chapter02`)

- **Objetivo:** conhecer Sahar e entender o que Lia escondeu antes de desaparecer.
- **Resumo:** a melhor amiga de Lia entra em cena. O que Eron contou (e se o jogador tem `has_notebook`) muda o que Sahar admite saber. Ao fim, três frentes se abrem: o bilhete/chave, o estranho do café e a teoria do pai.
- **Novos personagens:** **Sahar** (`sahar`); menção a **Bruno** ("o B") e ao **estranho com maleta de médico** (Vey disfarçado, sem nome).
- **Novas evidências:** `ev_cafe_note` (bilhete do açucareiro: "a chave… não conta pro B").
- **Eventos:** (1) Sahar agradece e se abre; (2) entrega do bilhete; (3) revelação de que "B" é Bruno, ex de Lia; (4) ramo do caderno (confirma teoria do pai empurrado se `has_notebook`); (5) relato do **estranho** que procurou "algo que Lia deixou".
- **Escolhas (implementadas):**
  - `c2a_how` ("Como você está? De verdade.") → **+10 Sahar**, flag `kind_to_sahar`. *Longo prazo:* `kind_to_sahar` é pré-requisito emocional para Júlia se abrir (Cap. 7) e para Sahar se arriscar por você no terço final.
  - `c2a_about` / `c2a_last` — caracterizam Lia e datam o sumiço (quinta).
  - `c2b_key` ("Vamos pegar a chave") → **+5 Sahar**, flag `wants_key`/`will_check_key`. *Longo prazo:* habilita a recuperação da chave/dispositivo no Cap. 3–4.
  - `c2b_bruno` / `c2b_trust` — informação sobre Bruno; plantam suspeita.
  - **Ramo do caderno:** se `has_notebook` → flag `father_pushed_theory` + **+1 `ending_alive`** (Sahar confirma "acharam que empurraram o pai"). Senão, fica o gancho "ela nunca contou".
  - `c2c_hide` ("Não mostre pra mais ninguém") → **+8 Sahar**, flag `protected_note`, **+1 `ending_solved`**. *Longo prazo:* proteger provas cedo é o eixo do Final I.
  - `c2c_describe` ("Descreve o homem") → flag `stranger_doctorish`, timeline `t_stranger_desc` ("maleta de médico"). *Longo prazo CRÍTICO:* esta flag é a **semente da revelação de Vey** — no Cap. 17, o jogo cruza `stranger_doctorish` com a identidade do legista.
  - `c2c_police` ("Contar pra polícia") → **+1 `ending_innocent`**. *Longo prazo:* recorrer à lei sob suspeita difusa tende a apontar o alvo errado.
- **Tensão:** sobe claramente — pela primeira vez **alguém está fisicamente procurando** o que Lia deixou, e Sahar mentiu para protegê-lo.
- **Reviravolta/pista falsa:** **Bruno** é plantado como suspeito (o "não conta pro B"); o **estranho** é plantado como ameaça anônima — o jogador não deve ligá-lo ao futuro "legista gentil".
- **Saída:** `chapterEnd` (segue para `chapter03`); timeline `t_ch2_done`.

---

## CAPÍTULO 3 — "A Caixa que Ninguém Abriu" (`chapter03`)

- **Objetivo:** falar com a mãe de Lia e descobrir o que ela tranca a sete chaves.
- **Resumo:** o jogador encontra (via Eron) a mãe, **Noemi**. Ela é um muro. Dependendo da abordagem (e de `kind_to_sahar`/`careful_with_eron`), ela racha o suficiente para revelar que existe uma **caixa** ligada ao pai — sem abri-la. Em paralelo, a "chave" do bilhete é recuperada e revela um **cartão de memória/cofre digital** de Lia.
- **Novos personagens:** **Noemi** (`noemi`).
- **Novas evidências:** `ev_locked_box` (NOVO — foto da caixa trancada de Henrique); `ev_key_micro_sd` (NOVO — o que estava no esconderijo do mirante: um cartão de memória); `ev_box_letter_corner` (NOVO — um pedaço de carta de Henrique visível pela fresta da caixa); `ev_noemi_contradiction` (NOVO — print/registro da própria contradição de Noemi: nega e depois se trai); `ev_dad_case_file` (NOVO — capa do "caso arquivado" do pai).
- **Eventos:** (1) primeiro contato com Noemi (defensiva); (2) recuperação da chave/cartão no mirante; (3) Noemi se contradiz sobre a morte do marido; (4) revelação da existência da caixa (não do conteúdo).
- **Escolhas:**
  - "Eu não vou contar nada à polícia, dona Noemi." → **+8 Noemi**, flag `noemi_trust_seed`. *Longo prazo:* destrava a entrega da caixa no Cap. 11/16.
  - "A senhora acha que o seu marido caiu mesmo?" → se `father_pushed_theory`, ela vacila → flag `noemi_cracked`. *Longo prazo:* acelera a revelação familiar (Mira) lá na frente.
  - "Me deixa abrir essa caixa." (pressão) → **−10 Noemi**, flag `pushed_noemi`. *Longo prazo:* se acumulada com outras pressões, Noemi **rompe contato** (Cap. 16) e a caixa só vem por Inês.
  - "Vou proteger o Eron, prometo." → **+6 Noemi**, **+1 `ending_solved`**.
  - Abrir o cartão de memória de Lia agora x guardar para Dário (Cap. 12) → ramifica a custódia da prova (queimar metadados vs. preservar).
- **Tensão:** o jogador percebe que **a própria família esconde** — a conspiração tem raiz doméstica, não só institucional.
- **Reviravolta/pista falsa:** sugere-se que **Noemi sabe de um crime** e talvez tenha participado de um encobrimento — quando, na verdade, ela é vítima do silêncio, não autora. Pista falsa "a família esconde o corpo".
- **Saída:** `chapter04`.

---

## CAPÍTULO 4 — "Margens" (`chapter04`)

- **Objetivo:** procurar (ou ser procurado por) o jornalista que ninguém na cidade suporta.
- **Resumo:** **Cael** entra em cena: ele já escrevia sobre o "padrão" do lago. Oferece o histórico dos três casos em troca de saber quem é o jogador. É a primeira vez que o **padrão dos três afogamentos** é nomeado por um vivo.
- **Novos personagens:** **Cael** (`cael`).
- **Novas evidências:** `ev_news_disappear` (já existe — recorte minimizando o caso); `ev_three_drownings` (NOVO — dossiê de Cael com os três casos lado a lado); `ev_margens_post` (NOVO — post do blog "padrão, não azar"); `ev_redacted_laudo` (NOVO — laudo com trechos tarjados que Cael conseguiu); `ev_cael_sources_list` (NOVO — lista parcial de fontes de Cael, uma delas riscada).
- **Eventos:** (1) primeiro contato com Cael (desconfiança mútua); (2) entrega do dossiê dos três casos; (3) Cael revela que Lia era fonte dele; (4) Cael adverte sobre "uma fonte que se machucou".
- **Escolhas:**
  - Revelar ou não que você tem o memo/caderno de Lia a Cael → **+ confiança Cael** se compartilha, mas planta risco de **vazamento** (Cael pode publicar nomes cedo demais no Cap. 15).
  - "Quem é a fonte riscada da sua lista?" → gancho para Teo/Inês; flag `cael_source_lead`.
  - Aceitar virar fonte de Cael → flag `cael_ally`; *longo prazo:* viabiliza a publicação detonadora do Final I (com Dário) — mas aumenta `heat` (perigo).
  - Desconfiar de Cael ("e se você for o estranho do café?") → Cael se ofende; pista falsa temporária sobre o próprio jornalista.
- **Tensão:** a ideia de **padrão** (três mortes, uma assinatura) entra de vez — e Cael avisa que falar tem **preço**.
- **Reviravolta/pista falsa:** Cael vira suspeito por saber demais e por ter "perdido uma fonte"; também planta a **assinatura única** sem ainda dar o nome (Vey).
- **Saída:** `chapter05`.

---

## CAPÍTULO 5 — "O Número que se Apaga" (`chapter05`)

- **Objetivo:** lidar com um contato anônimo que sabe coisas que não deveria.
- **Resumo:** **Kel** aparece — frio, perguntando em vez de responder, apagando as próprias mensagens. Kel direciona o olhar do jogador (para a foto, para "o nome mais simpático") e instala paranoia: **alguém está observando a investigação por dentro**.
- **Novos personagens:** **Kel** (`kel`).
- **Novas evidências:** `ev_kel_first_ping` (NOVO — print que o jogador consegue tirar antes da mensagem sumir — prova frágil de que Kel existe); `ev_photo_reexamined` (NOVO — releitura da última foto apontando a margem direita, não a luz); `ev_deleted_thread` (NOVO — registro de uma conversa apagada no celular de Lia que Kel menciona conhecer).
- **Eventos:** (1) Kel inicia contato sem se identificar; (2) Kel aponta um detalhe novo na última foto; (3) mensagens de Kel somem (instala dúvida sobre o que é real); (4) Kel insinua desconfiar de um aliado.
- **Escolhas:**
  - Responder Kel x ignorar → ignorar mantém `heat` baixo; responder abre informação mas **convida** Kel a continuar (e Kel pode ser isca de Vey).
  - "Você é o Cael? A Júlia? Você é a Lia?" (tentar identificar) → cada palpite seta uma flag de teoria (`kel_guess_*`) que o jogo pagará/desmentirá depois.
  - Seguir a dica de Kel sobre a foto → desbloqueia `ev_photo_reexamined`; *longo prazo:* essencial para a leitura "a luz era uma lanterna" (Final III).
  - Contar a Eron/Sahar sobre Kel x guardar segredo → contar divide a confiança; guardar isola o jogador (mais paranoia, mais imersão).
- **Tensão:** primeira sensação concreta de **ser observado**. O apagar das mensagens faz o jogador duvidar da própria memória.
- **Reviravolta/pista falsa:** Kel é desenhado para o jogador **suspeitar de todos** — e, crucialmente, para que a dica "comece pelo nome mais simpático" seja lida como **Bruno/Sahar/Cael**, quando ironicamente aponta para **Vey** (o homem mais gentil de todos).
- **Saída:** `chapter06`.

---

## CAPÍTULO 6 — "Em Bons Termos" (`chapter06`)

- **Objetivo:** confrontar o ex-namorado de Lia, o homem que o bilhete pedia para não procurar.
- **Resumo:** **Bruno** entra. Charmoso, defensivo, demora a responder quando acuado. Ele constrói a narrativa de que tudo terminou bem — e cada lacuna que ele tapa abre duas. O jogador sai daqui **convencido de que Bruno esconde algo** (e ele esconde — só não o que parece).
- **Novos personagens:** **Bruno** (`bruno`).
- **Novas evidências:** `ev_bruno_alibi` (NOVO — álibi de Bruno para a noite de quinta, com um furo de horário); `ev_breakup_messages` (NOVO — prints do término entre Lia e Bruno, menos amigáveis do que ele diz); `ev_dock_permit` (NOVO — uma autorização de obra/acesso ao lago com o sobrenome Saldanha); `ev_bruno_lakephoto` (NOVO — foto de Bruno perto do lago em data suspeita).
- **Eventos:** (1) primeiro contato com Bruno; (2) ele afirma o "bons termos"; (3) furo no álibi exposto; (4) descoberta do vínculo Saldanha↔acesso ao lago.
- **Escolhas:**
  - Confrontar Bruno com o bilhete ("por que ela não queria que você soubesse?") → ele trava; flag `bruno_rattled`. *Longo prazo:* acumular pressão sobre Bruno alimenta `accuse_bruno_score` → Final IV.
  - Fingir aliança ("eu não acho que foi você") → Bruno baixa a guarda e entrega algo do pai; flag `bruno_softened`, **+ pista real sobre Rolando/Vey**.
  - Mandar o álibi furado pra Vesna (se já a conhece) — não aqui; mas marcar para depois.
  - "Você tem medo do seu pai?" → revela a dinâmica Saldanha; flag `bruno_fears_father`.
  - Acusar Bruno diretamente → **+2 `accuse_bruno_score`**, **+1 `ending_innocent`**; satisfatório e perigoso (caminho fácil/errado).
- **Tensão:** o perigo ganha **rosto e sobrenome** (Saldanha = poder local). O jogador sente que mexeu com gente importante.
- **Reviravolta/pista falsa:** **maior red herring do jogo até aqui** — tudo aponta para Bruno (bilhete, álibi furado, foto no lago, motivo passional). O design quer que o jogador o queira culpado. A verdade: Bruno é **covarde e cúmplice passivo**, não assassino.
- **Saída:** `chapter07`.

---

## CAPÍTULO 7 — "A Recepção da Pousada" (`chapter07`)

- **Objetivo:** chegar à testemunha que estava a 600 m do píer na noite do sumiço.
- **Resumo:** via Sahar (gated por `kind_to_sahar`), o jogador alcança **Júlia**, que viu algo na pousada e está apavorada. Júlia escreve e apaga, some por horas, testa o jogador. Se conquistada com paciência, entrega o **registro da pousada** — que data e localiza um movimento noturno.
- **Novos personagens:** **Júlia** (`julia`).
- **Novas evidências:** `ev_pousada_log` (NOVO — registro/print do sistema da pousada com um check-out às 02h e um nome rasurado); `ev_julia_voice` (NOVO — áudio sussurrado de Júlia, com medo); `ev_parking_cam_still` (NOVO — frame da câmera do estacionamento: um carro/silhueta); `ev_julia_deleted_text` (NOVO — print de uma mensagem que Júlia mandou e apagou: "eu vi quem voltou molhado").
- **Eventos:** (1) Sahar faz a ponte (precisa de confiança); (2) Júlia hesita e some; (3) Júlia retorna e entrega o log; (4) revelação de "alguém voltou tarde" — sem nome ainda.
- **Escolhas:**
  - Pressionar Júlia x dar espaço → **pressionar a faz sumir** (flag `julia_vanished`, ela fica off por 1–2 capítulos e pode nunca mais voltar); dar espaço sobe confiança devagar.
  - Prometer não usar o nome dela → **+ confiança Júlia**, flag `protect_julia`. *Longo prazo CRÍTICO:* se o jogador **quebra** essa promessa (entrega o log com o nome dela exposto a Vesna/Cael), Júlia pode **virar alvo e sumir/morrer** no Cap. 18–19.
  - Cruzar o log com o áudio de Teo (Cap. 10) — marcado como objetivo futuro; corrobora o barco.
  - Mostrar a Júlia a foto de Bruno ("foi ele que você viu?") → Júlia hesita — **não confirma Bruno** (importante: ela viu uma silhueta com **maleta/casaco escuro**, não Bruno). Plantar contradição contra o red herring.
- **Tensão:** agora há **uma testemunha viva e assustada** — e o medo dela é contagioso. O jogador entende que **falar custa caro** nesta cidade.
- **Reviravolta/pista falsa:** Júlia parece confirmar Bruno, mas sob cuidado ela descreve **um homem de casaco escuro** — o jogo planta a contradição do red herring sem que o jogador note.
- **Saída:** `chapter08`.

---

## CAPÍTULO 8 — "Aguardo Retorno" (`chapter08`)

- **Objetivo:** decidir o que fazer com a polícia — colaborar, manipular ou evitar.
- **Resumo:** a inspetora **Vesna** contata o jogador (ela rastreou os movimentos da investigação amadora). Seca, metódica, trata o jogador como suspeito. Ela só age com **prova de verdade**. Este capítulo é a primeira grande **bifurcação institucional**: a relação com Vesna molda os Finais I (lei a favor) x V (lei como muro).
- **Novos personagens:** **Vesna** (`vesna`).
- **Novas evidências:** `ev_police_intake` (NOVO — registro frio da Guarda que minimizou o caso); `ev_chain_custody_form` (NOVO — formulário de cadeia de custódia que Vesna exige); `ev_old_case_vesna` (NOVO — alusão ao caso da capital que Vesna não resolveu); `ev_vesna_warning` (NOVO — advertência dela: "não interfira na cena").
- **Eventos:** (1) Vesna interroga o jogador (e Eron); (2) ela exige cadeia de custódia; (3) o jogador decide o que entregar; (4) ela revela ceticismo quanto à versão oficial (gancho de que **ela também desconfia**).
- **Escolhas:**
  - Entregar provas **com método** (originais, fonte, custódia) → **+ confiança Vesna**, flag `vesna_respects_you`. *Longo prazo:* habilita a prisão no Final I.
  - Entregar o áudio de Teo isolado → Vesna descarta ("pescador, sem custódia"); ensina o jogador que **corroborar** é necessário.
  - Mentir/omitir para Vesna → **− confiança**, flag `vesna_suspects_you`; *longo prazo:* no clímax ela pode **virar o caso contra você** (empurra Final V).
  - Apontar Bruno para Vesna → **+ `accuse_bruno_score`**; Vesna investiga o alvo errado (Final IV).
  - Recusar falar com a polícia → **+1 `ending_conspiracy`**; isolamento.
- **Tensão:** o jogador percebe que **também é olhado como suspeito** — a investigação pode se voltar contra ele.
- **Reviravolta/pista falsa:** Vesna parece parte do encobrimento (institucional, fria, minimiza) — pista falsa de "polícia comprada". Verdade: ela é honesta, só presa pela falta de provas e pela cidade.
- **Saída:** `chapter09`.

---

## CAPÍTULO 9 — "Página Virada" (`chapter09`)

- **Objetivo:** medir o poder político por trás do lago — e descobrir quem se beneficia do silêncio.
- **Resumo:** **Rolando Saldanha** entra, todo cordialidade vazia. Ele "lamenta", convida para reuniões que não acontecem, e deixa claro (sem dizer) que mexer no lago é mexer com a cidade inteira. O jogador conclui que o **mandante é Rolando** — a segunda grande pista falsa estrutural.
- **Novos personagens:** **Rolando** (`rolando`).
- **Novas evidências:** `ev_orla_contract` (NOVO — contrato da orla com irregularidades); `ev_council_minutes` (NOVO — ata de câmara que omite as mortes); `ev_rolando_voicemail` (NOVO — recado de voz cordial e ameaçador ao mesmo tempo); `ev_donation_records` (NOVO — registros de "doações" ligando Rolando a quem fechava os olhos); `ev_blackmail_hint` (NOVO — primeiro indício de que **alguém chantageia o próprio Rolando**).
- **Eventos:** (1) contato cordial-ameaçador de Rolando; (2) descoberta das irregularidades da orla; (3) o jogador é "convidado a parar"; (4) primeiro indício de que Rolando **teme alguém acima dele**.
- **Escolhas:**
  - Aceitar reunião com Rolando x recusar → aceitar dá info mas aumenta `heat`; recusar mantém distância.
  - Confrontar com o contrato → Rolando se irrita e **ameaça veladamente** (flag `rolando_threatened_you`, +heat).
  - Perguntar "quem o senhor está protegendo?" → Rolando vacila → flag `rolando_has_a_boss` (semente de Vey acima dele).
  - Vazar o contrato para Cael agora x guardar → vazar acelera a história (Final I possível) mas eleva o perigo (Final V possível).
  - Acusar Rolando publicamente → satisfatório, **errado**; ele tem advogados e álibis políticos; reforça pista falsa.
- **Tensão:** o poder reage. Pela primeira vez **o jogador é avisado a parar** por alguém com poder real.
- **Reviravolta/pista falsa:** Rolando vira o "mandante óbvio". Verdade: ele é **refém de Vey** — `ev_blackmail_hint` planta que há alguém **acima** do vereador.
- **Saída:** `chapter10`.

---

## CAPÍTULO 10 — "O Motor na Noite Errada" (`chapter10`)

- **Objetivo:** validar a testemunha auditiva e provar que havia um barco no lado proibido.
- **Resumo:** **Teo**, o pescador, entra — quase só áudios longos e divagantes. Ele ouviu um **motor de popa** na represa norte na noite do sumiço. Sozinho ele é descartável; cruzado com o log da pousada (Júlia) e o EXIF da foto, ele **data e prova** o barco. Teo também deixa escapar que **não foi a primeira vez** que ouviu aquilo — abrindo os afogamentos antigos.
- **Novos personagens:** **Teo** (`teo`).
- **Novas evidências:** `ev_dock_audio` (já existe — o motor); `ev_teo_old_night` (NOVO — áudio em que Teo confunde datas mas descreve uma morte antiga); `ev_motor_analysis` (NOVO — comparação que prova motor de popa, não pescador); `ev_teo_map_mark` (NOVO — Teo marca onde o som "morreu" — frente à casa do guarda).
- **Eventos:** (1) Teo contata (áudio); (2) entrega do áudio do motor; (3) Teo confunde a noite de Lia com uma noite antiga — revelando que **já ouviu isso antes**; (4) cruzamento com o log de Júlia.
- **Escolhas:**
  - Ter paciência com os áudios de Teo x cortá-lo → paciência destrava `ev_teo_old_night` (a morte antiga); cortá-lo o faz **calar** (flag `teo_silenced`).
  - Cruzar Teo + Júlia + EXIF → flag `boat_proven`. *Longo prazo:* prova-pilar para Vesna no Final I.
  - Levar Teo a Vesna agora → ela o descarta (sem corroboração) — ensina a esperar.
  - Perguntar a Teo sobre o pai de Lia / Nádia → se confiança alta, Teo liga a casa do guarda às luzes antigas (flag `teo_remembers_henrique`).
- **Tensão:** a prova física do barco transforma "teoria" em **crime real**. E a frase de Teo ("não foi a primeira vez") expande o horror para **décadas**.
- **Reviravolta/pista falsa:** Teo parece bêbado/inútil (a cidade o descarta) — o jogo joga com o viés do jogador. A verdade que ele carrega é central.
- **Saída:** `chapter11`.

---

## CAPÍTULO 11 — "O Ano Certo" (`chapter11`)

- **Objetivo:** chegar à arquivista que Lia mandou procurar — e ao passado documentado.
- **Resumo:** ponto de virada da investigação. **Inês** entrega o **padrão documental**: os três laudos quase idênticos, a mesma assinatura, o caixão lacrado de Mira. Aqui também aparecem (via documentos) **Henrique** (cartas/gravações) e **Nádia** (obituário). O jogador agora **vê o padrão inteiro** — e acha que está perto da verdade.
- **Novos personagens:** **Inês** (`ines`); **Henrique** (`henrique`, via documentos); **Nádia** (`nadia`, via registros).
- **Novas evidências:** `ev_obituary_mira` (já existe — obituário, "laudo: A. Vey"); `ev_archive_laudos` (NOVO — os três laudos lado a lado, mesma frase final); `ev_henrique_letters` (NOVO — cartas de Henrique, "por que sempre o mesmo médico?"); `ev_nadia_record` (NOVO — registro de Nádia, corpo nunca achado); `ev_mira_sealed_coffin` (NOVO — registro de caixão lacrado por ordem do legista); `ev_destroy_order` (NOVO — a ordem da prefeitura para destruir os arquivos que Inês desobedeceu).
- **Eventos:** (1) Inês recebe o jogador (gated por confiança/`promised_help`); (2) entrega dos três laudos e da assinatura única; (3) descoberta das cartas de Henrique; (4) revelação do caixão lacrado de Mira (planta a reviravolta); (5) Inês confessa o medo de ser a próxima.
- **Escolhas:**
  - "Quem assinou os três?" → o nome **A. Vey** aparece em documento pela primeira vez — mas como detalhe técnico, não como suspeito. *Longo prazo:* `saw_vey_signature` é pré-requisito da revelação do Cap. 17.
  - Proteger Inês (pedir que esconda cópias, não a expor) → **+ confiança Inês**, flag `protect_ines`. *Longo prazo:* se **não** proteger, Inês pode ser **silenciada** (some/morre) no Cap. 18, levando as provas.
  - Fazer cópias/backup das provas com Dário depois → flag `evidence_backed_up` (semente do Cap. 12).
  - Confrontar Noemi com as cartas de Henrique → se `noemi_cracked`, isso a quebra de vez → caminho para a caixa e a revelação familiar.
  - "Por que o caixão da Mira foi lacrado?" → Inês não sabe, mas planta a dúvida → flag `mira_doubt`.
- **Tensão:** alta — o jogador descobriu **um padrão de 15 anos**. Mas a entrega de Inês também a **marca**: ela agora é um risco a ser "limpo".
- **Reviravolta/pista falsa:** o jogador acredita ter "resolvido" (é um encobrimento de afogamentos!) — mas ainda lê tudo como crime **de Rolando**, e ainda não percebeu (a) que Mira pode estar viva, (b) que a assinatura é o vilão. A primeira **falsa solução** acontece aqui.
- **Saída:** `chapter12`.

---

## CAPÍTULO 12 — "Recorte e Fechamento" (`chapter12`)

- **Objetivo:** recuperar o trabalho de Lia que sobrevive fora do alcance da cidade.
- **Resumo:** **Dário**, o editor na capital, é contatado. Ele guarda os **arquivos de Lia na nuvem** — incluindo três frames que ela marcou "não publicar ainda" e um rascunho de texto que menciona, sem nome, "alguém que deveria estar morta e não está". É o **cofre externo** e o primeiro sussurro direto de que **uma vítima está viva**.
- **Novos personagens:** **Dário** (`dario`).
- **Novas evidências:** `ev_lia_cloud` (NOVO — acesso ao drive de Lia); `ev_three_marked_frames` (NOVO — os três frames "não publicar": píer, uma janela acesa, uma silhueta); `ev_lia_draft_text` (NOVO — rascunho: "ela não morreu. eu a encontrei."); `ev_photo_metadata_full` (NOVO — EXIF completo cruzando com o log da pousada); `ev_essay_layout` (NOVO — diagramação do ensaio "o lago que engole gente").
- **Eventos:** (1) Dário verifica o jogador antes de liberar (gated por reputação/`evidence_backed_up`); (2) entrega dos frames marcados; (3) leitura do rascunho ("ela não morreu"); (4) backup oficial das provas (segurança contra a "limpeza").
- **Escolhas:**
  - Provar a Dário que você é confiável (mostrar o que tem de Lia) → libera o drive. Recusar/desconfiar → ele segura, e o jogador perde o backup (risco no terço final).
  - Publicar o ensaio **agora** (com Dário+Cael) x esperar prova jurídica → publicar acelera e protege (a verdade sai da cidade) mas detona o `heat`; esperar mantém a opção da via policial (Vesna).
  - Interpretar "ela não morreu" → flag `someone_alive_hint`. *Longo prazo:* prepara Mira (Cap. 14) e o Final III.
  - Compartilhar os frames com Vesna (com custódia) → fortalece o Final I.
- **Tensão:** o jogador percebe que **alguém quis silenciar Lia justamente porque ela achou uma pessoa "morta" viva** — o caso vira **sobre uma testemunha que ressuscitou**.
- **Reviravolta/pista falsa:** "ela não morreu" é ambíguo de propósito — o jogador pode ler como **Lia está viva** (verdade possível, Final III) ou como **uma das afogadas está viva** (Mira). Ambas são certas; o jogo deixa a confusão produtiva.
- **Saída:** `chapter13`.

---

## CAPÍTULO 13 — "O Que Está Submerso" (`chapter13`)

- **Objetivo:** arrancar do homem que enterrou os corpos o que ele não pode dizer.
- **Resumo:** **Pastor Edmar** entra. Ele sabe — enterrou os três, ouviu confissões — mas o segredo o algema. Fala por parábolas, responde com perguntas, pede conversa "pessoalmente". Se conquistado, **aponta o caminho sem dizer o nome**, e confirma que **um dos caixões nunca deveria ter sido fechado**.
- **Novos personagens:** **Edmar** (`edmar`).
- **Novas evidências:** `ev_burial_records` (NOVO — registros de enterro, todos caixão fechado); `ev_edmar_sermon_clip` (NOVO — trecho de sermão que parece confissão velada); `ev_confession_riddle` (NOVO — o "enigma" de Edmar que aponta para o legista sem nomear); `ev_empty_grave_hint` (NOVO — indício de que a cova de Mira "pesa de menos").
- **Eventos:** (1) Edmar evade e testa a alma do jogador; (2) revelação dos caixões fechados; (3) o enigma que aponta para "a mão que assina"; (4) confirmação velada do caixão suspeito (Mira).
- **Escolhas:**
  - Respeitar o segredo de confissão x exigir nomes → respeitar **abre** Edmar (ele guia); exigir o **fecha** ("não posso, meu jovem").
  - "O senhor confessou alguém que matou?" → Edmar responde com pergunta; flag `edmar_hints_killer`.
  - Pedir para abrir/exumar a cova → semente para o desfecho; flag `wants_exhumation` (caminho do Final III/I).
  - Levar o enigma de Edmar a Cael/Vesna → ajuda a montar o caso, mas Edmar **nega** publicamente se exposto (não há prova jurídica em confissão).
- **Tensão:** moral e sobrenatural-aparente (sem nada sobrenatural): o jogo brinca com "a cidade amaldiçoada", mas Edmar deixa claro que **a maldição é um homem**.
- **Reviravolta/pista falsa:** o enigma de Edmar ("a mão que assina") finalmente **mira Vey** — mas como abstração, e o jogador ainda pode ler como metáfora de "o sistema". A segunda **falsa solução** se desfaz aqui: não é só Rolando; há "uma mão" específica.
- **Saída:** `chapter14`.

---

## CAPÍTULO 14 — "A Que Não Morreu" (`chapter14`)

- **Objetivo:** estabelecer contato com alguém que oficialmente está morta há onze anos.
- **Resumo:** **a grande reviravolta**. **Mira** contata o jogador (talvez revelando-se como quem esteve por trás de "Kel", conforme a rota). Cautelosa, troca de número, testa. Ela confirma: está **viva**, "morreu" para escapar, e — em camadas — que é **meia-irmã de Lia**. O caso inteiro se reconfigura: não é só sobre Lia; é sobre uma **família partida pelo lago**.
- **Novos personagens:** **Mira** (`mira`).
- **Novas evidências:** `ev_mira_proof_alive` (NOVO — prova de que Mira está viva: foto recente com detalhe datável); `ev_mira_lia_messages` (NOVO — conversas entre Lia e Mira nos últimos meses); `ev_halasz_birth_record` (NOVO — registro que liga Mira a Henrique Moreaux); `ev_mira_testimony_audio` (NOVO — áudio em que Mira conta o que viu há 11 anos); `ev_two_sisters_photo` (NOVO — uma foto de Lia e Mira juntas, recente).
- **Eventos:** (1) Mira se revela viva; (2) os testes de confiança; (3) revelação do parentesco (meia-irmãs); (4) o depoimento de Mira sobre a noite de 11 anos atrás; (5) Mira revela que **Lia a encontrou** e que isso pode ter causado o sumiço.
- **Escolhas:**
  - Passar nos testes de Mira (respostas curtas, não perguntar onde ela está) → **+ confiança Mira**; falhar → ela **some e troca de número** (atrasa tudo).
  - Contar a Eron que ele tem uma meia-irmã viva x guardar segredo → contar é catártico e arriscado (Eron pode agir por impulso); guardar protege Mira mas isola Eron.
  - Prometer **nunca** revelar a localização de Mira → flag `mira_protected`. *Longo prazo CRÍTICO:* quebrar isso (ou deduzir/expor onde ela está) leva Mira a **sumir para sempre** e pode condená-la — fecha o Final III e empurra o Final V.
  - Cruzar o depoimento de Mira com os laudos de Inês → flag `mira_corroborated`; pilar do Final I.
  - Acreditar x duvidar de Mira ("e se você for isca?") → duvidar a magoa, mas é uma leitura legítima (eco de Kel).
- **Tensão:** vertiginosa — tudo que o jogador "sabia" se reorganiza. E surge um terror novo: **se Mira está viva, quem a quer morta ainda está caçando.**
- **Reviravolta/pista falsa:** **a reviravolta central**. Reconfigura o caso de "desaparecimento" para "encobrimento familiar com sobrevivente". Também planta a leitura do Final III (Lia teria feito como Mira: forjar o sumiço).
- **Saída:** `chapter15`.

---

## CAPÍTULO 15 — "O Que Lia Sabia" (`chapter15`)

- **Objetivo:** reconstruir os últimos dias de Lia e por que ela foi ao píer às 02:14.
- **Resumo:** com Mira, Inês, Dário e Cael, o jogador monta a **reconstituição completa** da investigação de Lia: ela ligou Nádia → pai → Mira, achou a meia-irmã viva e decidiu fechar o caso do pai publicando o ensaio. A ameaça ("você não é sua mãe") fez sentido. O jogador acredita, de novo, que tem **a verdade inteira** — e ainda não tem o nome do topo.
- **Novos personagens:** nenhum (consolidação do elenco).
- **Novas evidências:** `ev_lia_timeline_board` (NOVO — o "mural" reconstruído da investigação de Lia); `ev_threat_origin` (NOVO — rastreio parcial do número da ameaça, leva a um chip pré-pago comprado perto do necrotério); `ev_lia_last_plan` (NOVO — o plano de Lia para a noite de quinta: encontrar alguém no píer); `ev_who_knew_list` (NOVO — lista de quem sabia que Lia investigava); `ev_essay_published_draft` (NOVO — o ensaio pronto para publicar).
- **Eventos:** (1) montagem do mural; (2) rastreio da ameaça até "perto do necrotério" (semente de Vey); (3) descoberta de que Lia ia **encontrar alguém** no píer; (4) decisão: publicar/entregar agora ou ir mais fundo.
- **Escolhas:**
  - **Decisão de ato 3:** "Publicar o ensaio agora" x "Entregar à Vesna" x "Ir ao píer/casa do guarda" → esta escolha **pesa muito** nos endingScores: publicar (Cael/Dário) → Final I; via Vesna com custódia → Final I; agir sozinho e exposto → risco Final V.
  - Seguir o rastro "perto do necrotério" → flag `threat_near_morgue`. *Longo prazo:* dobra-chave para o jogador finalmente olhar para o legista (Cap. 17).
  - Acusar Rolando como mandante agora (parece fechar tudo) → **falsa solução**; reforça Final IV/V se levado adiante.
  - Confrontar Bruno com tudo → se `accuse_bruno_score` alto, encaminha Final IV.
- **Tensão:** a investigação está "completa" — mas o rastro "perto do necrotério" e o "encontro no píer" deixam um **buraco no formato exato de um homem que ninguém suspeitou**.
- **Reviravolta/pista falsa:** terceira **falsa solução** (Rolando como mandante). O detalhe "chip comprado perto do necrotério" é a **pista verdadeira** plantada à vista de todos.
- **Saída:** `chapter16`.

---

## CAPÍTULO 16 — "A Caixa Aberta" (`chapter16`)

- **Objetivo:** abrir, enfim, o segredo familiar — e pagar o preço de ter chegado tão longe.
- **Resumo:** dependendo de como tratou Noemi (e Inês), a **caixa de Henrique** se abre: as cartas e a gravação que **nomeiam** o medo dele. Noemi confessa o que sabe (assassinato do marido, existência de Mira). Mas a cidade reage: começa a **limpeza** — Inês é ameaçada, Júlia entra em pânico, e o jogador recebe a primeira evidência de que **alguém sabe quem ele é**.
- **Novos personagens:** nenhum novo; clímax de Noemi e convergência do elenco.
- **Novas evidências:** `ev_henrique_tape` (NOVO — gravação de Henrique nomeando "o médico" e descrevendo o que viu); `ev_noemi_confession` (NOVO — áudio/print da confissão de Noemi); `ev_family_truth_doc` (NOVO — o documento que prova o parentesco Henrique–Mira); `ev_watcher_photo` (NOVO — uma foto **da janela do jogador**, ou da rua dele, enviada por número oculto); `ev_ines_threatened` (NOVO — sinal de que Inês foi ameaçada/sumiu, se não protegida).
- **Eventos:** (1) abertura da caixa (gated por `noemi_trust_seed`/não-`pushed_noemi`); (2) confissão de Noemi; (3) a gravação de Henrique nomeia "o médico"; (4) **o jogador vira alvo** (a foto da janela); (5) a "limpeza" começa (Inês/Júlia em risco).
- **Escolhas:**
  - Como receber a confissão de Noemi (acolher x cobrar) → acolher repara `pushed_noemi`; cobrar pode **romper** com ela (ela bloqueia o contato).
  - Reagir à foto da janela: ir à polícia (Vesna) x esconder de todos x contar a Eron → cada um move `heat` e a confiança da rede.
  - **Proteger Inês/Júlia agora** (avisar, tirar de cena) x focar na prova → focar só na prova pode **custar a vida/sumiço** de uma delas no Cap. 18.
  - Confrontar quem você acha que é o vilão com a gravação de Henrique → se mira Rolando/Bruno, falsa solução; se `threat_near_morgue` + `saw_vey_signature` + `stranger_doctorish`, o jogo permite a dedução "**o médico = o legista = Vey**" (flag `suspects_vey`).
- **Tensão:** **pico de virada** — o jogador deixa de ser observador e passa a ser **alvo**. A foto da própria janela é o momento "eles sabem quem eu sou".
- **Reviravolta/pista falsa:** a gravação de Henrique diz "o médico", não um nome — fechando o cerco sobre Vey **sem** entregá-lo de graça. Quem juntou as sementes (`stranger_doctorish`, `threat_near_morgue`, `saw_vey_signature`) chega ao Cap. 17 já desconfiado; quem não juntou, leva o choque cheio.
- **Saída:** `chapter17`.

---

## CAPÍTULO 17 — "O Homem Gentil" (`chapter17`)

- **Objetivo:** encarar a verdade sobre quem vinha ajudando você o tempo todo.
- **Resumo:** **a revelação de Vey.** O legista — que pode já estar conversando com o jogador há capítulos como "aliado técnico" gentil — é desmascarado como **a mão que assinou tudo** e **o estranho do café**. O horror não é uma perseguição: é a **calma** dele. Confrontado, Vey não nega nem ameaça — ele **compreende**, tranquiliza, oferece chá e uma saída digna, e fica **mais gentil quanto mais perto da verdade o jogador chega**.
- **Novos personagens:** **Dr. Adriano Vey** (`adriano`) — agora nomeado e frontal (presente disfarçado desde o Cap. 2).
- **Novas evidências:** `ev_vey_signature_match` (NOVO — confronto pericial das assinaturas dos quatro laudos: Nádia, Henrique, Mira, e o de Lia se existir); `ev_vey_calendar` (NOVO — agenda de Vey nas noites das mortes); `ev_vey_cafe_id` (NOVO — confirmação de que o "estranho com maleta" é Vey); `ev_vey_chat_log` (NOVO — releitura das próprias conversas "de ajuda" de Vey, agora sinistras); `ev_morgue_blackmail_files` (NOVO — o arquivo de chantagem que Vey mantinha sobre Rolando e outros); `ev_vey_chip_purchase` (NOVO — liga Vey ao chip da ameaça comprado perto do necrotério).
- **Eventos:** (1) o jogador (ou Mira/Edmar/Inês) cruza as assinaturas e o "estranho do café" → revelação; (2) reler as mensagens de Vey como predador; (3) o confronto sereno com Vey; (4) Vey expõe que **controla** a cidade via chantagem (Rolando incluído); (5) Vey faz uma **oferta** ao jogador (parar, em troca de segurança).
- **Escolhas:**
  - O confronto com Vey: **gravar** a conversa (prova) x apenas ouvir x acusá-lo de cara → gravar com cuidado é ouro para Vesna (Final I); acusar sem prova o avisa (ele começa a fugir → Final II) ou se volta contra você (Final V).
  - Aceitar x recusar a "oferta" de Vey → aceitar (parar) encaminha **Final V** (água parada); recusar firma o confronto.
  - Avisar Mira de que Vey sempre soube que ela vive → **+ confiança Mira** e a tira do esconderijo a tempo (protege o Final III); não avisar a deixa exposta.
  - Entregar `ev_morgue_blackmail_files` a Vesna x a Cael → via Vesna = caso criminal (Final I); via Cael = exposição pública (Final I por outra porta, mais `heat`).
  - Insistir no alvo errado (Bruno/Rolando) mesmo agora → trava o jogador no caminho do Final IV.
- **Tensão:** máxima e **invertida** — o perigo não grita, sussurra "compreendo". O jogador entende que **a gentileza era a arma**.
- **Reviravolta/pista falsa:** **a revelação-mestra.** Tudo que parecia ajuda era vigilância. As pistas falsas (Bruno, Rolando, Cael, até Kel) caem; o "nome mais simpático" era o assassino.
- **Saída:** `chapter18`.

---

## CAPÍTULO 18 — "Água Subindo" (`chapter18`)

- **Objetivo:** sobreviver à reação — e decidir quem você consegue proteger.
- **Resumo:** sabendo que foi descoberto, Vey aciona a "corrente". A cidade se fecha. **Aqui acontecem as perdas:** dependendo das escolhas anteriores, **Inês**, **Júlia**, **Teo** ou **Sahar** podem ser silenciados, sumir ou morrer; um aliado pode trair sob pressão. O jogador, agora alvo declarado, corre para consolidar a prova antes que ela "afunde".
- **Novos personagens:** nenhum novo; o elenco é colocado em risco real.
- **Novas evidências:** `ev_ines_last_message` (NOVO — última mensagem de Inês, se não protegida); `ev_julia_gone` (NOVO — sinal de fuga/sumiço de Júlia, se exposta); `ev_betrayal_proof` (NOVO — prova de que um aliado dobrou sob pressão de Vey); `ev_drained_threat` (NOVO — ameaça direta ao jogador: a foto da janela "de novo", agora com texto); `ev_safe_copy` (NOVO — a cópia segura das provas, se `evidence_backed_up`/Dário).
- **Eventos:** (1) a "limpeza" se consuma (perdas condicionais); (2) uma traição (condicional); (3) o jogador vira alvo explícito; (4) corrida para garantir a prova (backup de Dário/entrega a Vesna).
- **Escolhas:**
  - Quem salvar primeiro (Inês x Júlia x Teo) quando o tempo aperta → escolha trágica; quem não for avisado paga o preço (mortes/sumiços canônicos do jogo).
  - Confiar x desconfiar do aliado que titubeia → confiar errado entrega sua posição a Vey; desconfiar certo te salva mas custa o vínculo.
  - Recuar (aceitar a derrota, proteger Eron e a si) x avançar (entregar tudo) → recuar conduz a **Final II/V**; avançar a **Final I/III**.
  - Tirar Eron da cidade x mantê-lo na luta → protege/expõe o coração emocional do jogo.
- **Tensão:** **clímax de perigo pessoal.** As consequências de capítulos antigos chegam todas juntas — quem o jogador protegeu vive, quem ele negligenciou, não.
- **Reviravolta/pista falsa:** a possível **traição** revela que mesmo um aliado querido pode dobrar — e que Vey nunca precisou de violência própria, só de medo alheio.
- **Saída:** `chapter19`.

---

## CAPÍTULO 19 — "A Outra Margem" (`chapter19`)

- **Objetivo:** descobrir o destino real de Lia e levar a investigação ao ponto sem volta.
- **Resumo:** o jogador chega (por mediação dos contatos) à **casa abandonada do guarda**, na represa norte — a casa de Henrique. Aqui o destino de Lia se resolve segundo o caminho construído: ou **Lia está viva** ali (a luz na foto era a lanterna dela; ela forjou o sumiço para terminar o trabalho do pai e precisava de alguém de fora), ou se confirma que **Lia foi morta** e a casa guarda a última prova. Vey faz seu **último movimento**.
- **Novos personagens:** nenhum novo; possível **retorno de Lia** (se Final III).
- **Novas evidências:** `ev_guard_house` (NOVO — o interior da casa do guarda, intacto desde Henrique); `ev_lia_hideout` (NOVO — sinais de que alguém viveu ali nos últimos dias — caminho do Final III); `ev_final_proof` (NOVO — a prova que fecha o caso: o que Henrique escondeu sob o assoalho / o que Lia fotografou); `ev_lia_alive_contact` (NOVO — primeiro contato direto de Lia, se viva); `ev_vey_last_offer` (NOVO — a última mensagem serena de Vey).
- **Eventos:** (1) chegada à casa do guarda; (2) revelação do destino de Lia (vivo x morto, conforme rota); (3) recuperação da prova final; (4) o último lance de Vey (fuga, oferta ou armadilha).
- **Escolhas:**
  - Se Lia viva: convencê-la a sair x ajudá-la a continuar escondida x expor tudo agora → molda o tom do Final III.
  - Confiar a prova final a Vesna (custódia) x à imprensa (Cael/Dário) x guardar → define I vs. II vs. V.
  - Encarar Vey uma última vez x deixá-lo fugir → encarar com prova → Final I; chegar tarde → Final II.
  - Proteger a localização de Mira/Lia até o fim → fechamento limpo do Final III; falhar → Final V.
- **Tensão:** resolução do mistério central + a última ameaça pessoal. A "outra margem" — literal e metafórica — é alcançada.
- **Reviravolta/pista falsa:** se Lia está viva, **a maior reviravolta emocional**: a desaparecida orquestrou tudo, ecoando a irmã Mira; a busca era também uma armadilha que Lia montou para a cidade. Se morta, o luto se consuma e a justiça (ou não) decide o tom.
- **Saída:** `chapter20`.

---

## CAPÍTULO 20 — "A Corrente" (`chapter20`)

- **Objetivo:** o ato final — entregar (ou perder) a verdade, e viver com o resultado.
- **Resumo:** capítulo de **resolução e roteamento de final.** Toda a soma de flags, confiança e endingScores converge. O jogador faz o **lance final**: entregar a corrente de provas a quem pode quebrá-la, expor publicamente, salvar quem ainda dá, ou perder tudo. O `chapterEnd` deste capítulo carrega `ending: <id>` resolvido pela engine (ver §14).
- **Novos personagens:** nenhum; convergência total.
- **Novas evidências:** `ev_case_dossier` (NOVO — o dossiê final montado pelo jogador, soma de todas as provas-chave); `ev_arrest_or_escape` (NOVO — o desfecho documental: mandado cumprido OU casa vazia); `ev_final_message` (NOVO — a última mensagem que o jogador recebe, variando por final).
- **Eventos:** (1) o jogador consolida o dossiê; (2) a entrega/exposição final; (3) o desfecho de Vey (preso, fugido, intocado ou agradecido); (4) o destino dos aliados se sela; (5) roteamento para o Ending.
- **Escolhas (as "alavancas" finais):**
  - **A acusação final:** apontar **Vey** (com prova) → habilita Final I; apontar **Bruno** → força Final IV; não apontar ninguém / aceitar o silêncio → Final V.
  - **O canal:** Vesna (com `vesna_respects_you` + `boat_proven` + `mira_corroborated`) → Final I; imprensa (Cael+Dário, `cael_ally`+`evidence_backed_up`) → Final I (variante pública); nenhum a tempo → Final II.
  - **A pessoa:** priorizar salvar Lia/Mira viva (`mira_protected`+`lia_alive_contact`) → Final III; priorizar a condenação → Final I.
  - **A retirada:** se `heat` máximo e prova perdida/aliados caídos → Final V.
- **Tensão:** catártica — a "corrente" do título ou se **quebra** (I) ou **prende o jogador** (V).
- **Reviravolta/pista falsa:** a última checagem de consistência — o jogo confirma que o jogador acusa a pessoa certa; quem se deixou levar pelas pistas falsas colhe o Final IV.
- **Saída:** `chapterEnd` com `ending` resolvido → sequência de final correspondente.

---

## EPÍLOGO — "Depois da Água Baixar" (`epilogue`)

- **Objetivo:** fechar o tom emocional conforme o final alcançado e prestar contas dos personagens.
- **Resumo:** o epílogo **não é único**; é uma moldura curta que se adapta ao Ending (ver §14 para o destino de cada personagem por final). Em todos, há um último beat com **Eron** — a primeira voz do jogo é a última —, e a "Linha do Tempo" do caso fica disponível para releitura, agora com o significado revelado de cada marco.
- **Variações:**
  - **Final I (Corrente Quebrada):** o lago é drenado; três famílias enterram seus nomes verdadeiros; Eron: *"voce nao desistiu. ninguem nunca tinha ficado."* A cidade não perdoa, mas a verdade existe.
  - **Final II (Barco Vazio):** Vey escapou; o jogador tem tudo e ninguém a entregar; meses depois, uma foto de outro lago, sem texto.
  - **Final III (Outra Margem):** Lia viva, ao amanhecer, sai da mata; "ela não está mais desaparecida, mas a cidade ainda está".
  - **Final IV (Nome Errado):** Bruno é condenado pela opinião pública; a assinatura de Vey segue intacta; o jogador acorda às 02:14 sabendo que esqueceu de olhar para alguém.
  - **Final V (Água Parada):** os contatos somem um a um; a Gazeta "encerra o caso"; a última foto é a janela do próprio jogador, vista de fora; "pare de procurar" — sem remetente para bloquear.
- **Beat final comum:** a tela volta a ser só um celular numa mesa, em silêncio. O jogo termina como começou: **uma notificação** — mas o que ela significa depende de tudo que o jogador fez.

---

## 7.21 Resumo de cadência (quotas por capítulo)

Para garantir o ritmo do brief (2–5 personagens novos, 5–10 evidências, 3–5 eventos, 5–10 escolhas por capítulo) ao longo de ~20h:

| Cap. | Personagens novos | Evidências (alvo) | Eventos | Escolhas | Função no arco |
|---|---|---|---|---|---|
| Prólogo | 2 (eron, lia) | 2 | 5 | 4 | Cold open / gancho |
| 1 | 0 (anuncia sahar) | 3 | 6 | 6 | Provas-base / gate de confiança |
| 2 | 1 (sahar) | 1 (+plantas) | 5 | 9 | Amiga / semente de Vey e Bruno |
| 3 | 1 (noemi) | 5 | 4 | 5 | Segredo familiar (muro) |
| 4 | 1 (cael) | 5 | 4 | 4 | Padrão dos três (vivo) |
| 5 | 1 (kel) | 3 | 4 | 4 | Paranoia / observação |
| 6 | 1 (bruno) | 4 | 4 | 5 | Red herring-mestre |
| 7 | 1 (julia) | 4 | 4 | 4 | Testemunha viva / contradição |
| 8 | 1 (vesna) | 4 | 4 | 5 | Bifurcação institucional |
| 9 | 1 (rolando) | 5 | 4 | 5 | Poder / red herring "mandante" |
| 10 | 1 (teo) | 4 | 4 | 4 | Prova do barco / décadas |
| 11 | 3 (ines, henrique, nadia) | 6 | 5 | 5 | Padrão documental / falsa solução 1 |
| 12 | 1 (dario) | 5 | 4 | 4 | Cofre externo / "ela não morreu" |
| 13 | 1 (edmar) | 4 | 4 | 4 | Consciência / "a mão que assina" |
| 14 | 1 (mira) | 5 | 5 | 5 | **Reviravolta central** |
| 15 | 0 | 5 | 4 | 4 | Reconstrução / falsa solução 3 |
| 16 | 0 | 5 | 5 | 4 | Caixa aberta / jogador vira alvo |
| 17 | 1 (adriano) | 6 | 5 | 5 | **Revelação de Vey** |
| 18 | 0 | 5 | 4 | 4 | Reação / perdas condicionais |
| 19 | 0 (Lia possível) | 5 | 4 | 4 | Destino de Lia / casa do guarda |
| 20 | 0 | 3 | 5 | 4 | Resolução / roteamento de final |

> **Total de personagens relevantes introduzidos:** 20 (atende 15–25). **Introduções batem com os capítulos canônicos do brief e do `characters.json`.**

---

# 8. Sistema de Pistas Falsas & Suspeitos

> O culpado real (Vey) **não pode ser óbvio**. O design coloca uma sequência de suspeitos que parecem certos em cada fase e depois desmonta cada um. O jogador deve **acreditar várias vezes que resolveu** e estar errado. Abaixo, 12 pistas falsas concretas: quem parece culpado, por quê o jogador é levado a crer, e como cada uma é desmontada.

## 8.1 Os "ciclos de suspeita" (estrutura macro)

| Fase (caps.) | Suspeito dominante | Falsa solução que o jogador monta |
|---|---|---|
| 2–7 | **Bruno** (ex-namorado) | "Crime passional: o ex matou Lia." |
| 8 | **Vesna / a polícia** | "A polícia está comprada / encobre." |
| 9–11 | **Rolando** (vereador) | "O poder econômico mandou matar para proteger o lago." |
| 5, 12–14 | **Kel** (anônimo) | "O contato anônimo é o assassino brincando comigo." |
| 14–16 | **A própria família / Noemi** | "A família esconde um crime doméstico antigo." |
| 17+ | **Vey** (verdadeiro) | A corrente real, finalmente. |

## 8.2 As 12 pistas falsas (detalhadas)

1. **Bruno é o assassino passional.** *Por quê o jogador crê:* o bilhete "não conta pro B"; álibi furado (`ev_bruno_alibi`); prints de término ruim (`ev_breakup_messages`); foto dele no lago (`ev_bruno_lakephoto`); ele demora a responder e desvia. *Desmonte:* Júlia descreve um **homem de casaco escuro com maleta**, não Bruno (Cap. 7); o furo do álibi se explica por um caso/segredo bobo (ele estava com outra pessoa, não no píer); Bruno é covarde e cúmplice passivo, não executor. Confirmado só no Cap. 17.

2. **Rolando é o mandante.** *Por quê:* construiu a orla, lucra com o silêncio, ameaça veladamente, tem contratos sujos (`ev_orla_contract`, `ev_donation_records`). *Desmonte:* `ev_blackmail_hint` e `ev_rolando_has_a_boss` mostram que **alguém chantageia o próprio Rolando**; os arquivos de chantagem (`ev_morgue_blackmail_files`, Cap. 17) revelam que o dono da coleira é Vey.

3. **A polícia está comprada (Vesna inclusa).** *Por quê:* a Guarda minimizou tudo (`ev_police_intake`), Vesna é fria e trata o jogador como suspeito. *Desmonte:* Vesna exige cadeia de custódia justamente porque é **honesta** e quer prova que prenda; ela própria já suspeitava de Vey (`ev_old_case_vesna`) mas faltava-lhe prova.

4. **Kel é o predador.** *Por quê:* sabe demais, apaga mensagens, "brinca" com o jogador, conhece detalhes da foto. *Desmonte:* Kel **pergunta** em vez de matar/ameaçar; as dicas dele são corretas (a margem da foto, "o nome mais simpático"); revela-se (numa das rotas) como Mira testando, ou como aliado/isca — nunca o assassino.

5. **Cael fabrica o caso por sensacionalismo.** *Por quê:* obcecado pelo "padrão", odiado pela cidade, "perdeu uma fonte" (`ev_cael_sources_list` com nome riscado). *Desmonte:* a fonte riscada foi **silenciada por Vey/estrutura**, não por Cael; o "padrão" de Cael é real e checável nos laudos de Inês.

6. **Teo inventa o barco (bêbado).** *Por quê:* confunde datas, bebe, a cidade ri dele. *Desmonte:* `ev_motor_analysis` + `ev_pousada_log` + EXIF corroboram o motor de popa na noite exata; a "confusão de datas" dele na verdade **revela mortes antigas** (ele ouviu o mesmo motor em outros anos).

7. **Noemi participou de um crime / esconde o corpo.** *Por quê:* a caixa trancada, as contradições (`ev_noemi_contradiction`), a recusa de falar do marido. *Desmonte:* a caixa contém as **provas de Henrique**, não um crime dela; Noemi é **vítima do silêncio** (foi silenciada/ameaçada), e seu medo protege os filhos.

8. **Júlia mentiu para encobrir alguém.** *Por quê:* "esquece", some, apaga mensagens, parece esconder um culpado. *Desmonte:* ela esconde **por terror de ser a próxima**, não por cumplicidade; o que ela viu **incrimina Vey** (silhueta de casaco/maleta), não um aliado.

9. **Mira é uma farsa / isca do vilão.** *Por quê:* "morta" que aparece viva, troca de número, testa o jogador, evita localização — clássico de manipulador. *Desmonte:* `ev_halasz_birth_record` + `ev_mira_lia_messages` + `ev_two_sisters_photo` provam que é real e meia-irmã; a cautela dela é sobrevivência, não engano.

10. **A morte do pai (Henrique) foi mesmo acidente.** *Por quê:* a versão oficial é robusta, Noemi reluta, faz 12 anos. *Desmonte:* `ev_henrique_letters` + `ev_henrique_tape` mostram que ele **investigava e temia "o médico"**; o laudo dele tem a mesma assinatura/padrão dos outros.

11. **O lago é "amaldiçoado" / há algo sobrenatural.** *Por quê:* a "luz na outra margem", a névoa, "o lago engole gente", a linguagem religiosa de Edmar. *Desmonte:* a luz é uma **lanterna** (Mira/Lia); a "maldição" é, nas palavras de Edmar, **um homem**; tudo tem explicação humana (Pilar P7).

12. **O jogador resolveu o caso no Cap. 11/15** ("é encobrimento de afogamentos, fim"). *Por quê:* o padrão documental fecha lindamente. *Desmonte:* faltam **duas camadas** — Mira viva (Cap. 14) e a identidade da "mão" (Cap. 17). As "falsas soluções" são deliberadas para entregar a sensação de vitória e depois retirá-la.

## 8.3 Regras para escritores sobre red herrings

- **Toda pista falsa deve conter uma verdade parcial.** Bruno realmente esconde algo (a covardia/o caso do pai); Rolando realmente é corrupto; Noemi realmente esconde a caixa. Isso torna as pistas falsas **justas**, não trapaça.
- **Plante o desmonte antes da revelação.** A contradição de Júlia (casaco escuro, não Bruno) é plantada no Cap. 7, muito antes do Cap. 17. O jogador atento pode resolver mais cedo — e o jogo recompensa isso com falas de Kel/Mira que reconhecem a perspicácia.
- **Vey nunca é "limpo demais".** Ele é gentil e prestativo — o que, num thriller, deveria acender o alarme do jogador experiente. Esse é o jogo meta: o vilão se esconde sendo a única pessoa boazinha numa cidade hostil.
- **Acusar errado tem custo.** Se o jogador trava em Bruno/Rolando e acumula `accuse_bruno_score`/aponta na hora errada, o jogo **respeita a escolha** e entrega o Final IV — não há "correção" forçada.

---

# 9. Sistema de Investigação & Evidências

> O coração da gameplay. O jogador investiga **organizando e cruzando informação**, não resolvendo puzzles. O app **ARQUIVOS DO CASO** é o cofre central.

## 9.1 ARQUIVOS DO CASO — como funciona

Toda evidência recebida em qualquer thread (como `attachment` que referencia um `evidence` id) é **automaticamente arquivada** em ARQUIVOS DO CASO via `addEvidence`. O jogador nunca "perde" uma prova. Cada item abre numa ficha detalhada.

**Modelo de dado (já em `types/story.ts` → `Evidence`):**
- `id` (ex.: `ev_last_photo`)
- `kind`: `photo | video | audio | document | screenshot | location | report`
- `title` (rótulo curto)
- `description` (resumo de uma linha)
- `source` (characterId ou `system`) → **quem enviou**
- `caseRelevance` → **ligação com o caso**
- `thumbnailColor` (cor do card)
- `body` → texto completo (documento), transcrição (áudio/vídeo) ou EXIF (foto)

**Metadados exibidos na ficha (requisito do brief):**
- **Data recebida:** `EvidenceInstance.receivedAt` (timestamp diegético).
- **Quem enviou:** `EvidenceInstance.from` (resolve para o nome do contato).
- **Ligação com o caso:** `caseRelevance`.
- **Tipo:** ícone por `kind`.

## 9.2 Tipos de evidência e tratamento de UI

| Kind | Como aparece | Exemplo canônico |
|---|---|---|
| `photo` | thumbnail + visualizador; EXIF no `body` | `ev_last_photo` (02:14, ISO 3200, "represa norte") |
| `audio` | player simulado com duração + transcrição | `ev_voice_lia1`, `ev_dock_audio` |
| `video` | player simulado + transcrição (Caps. avançados) | `ev_parking_cam_still`→vídeo |
| `document` | leitor de texto com fac-símile | `ev_obituary_mira`, `ev_archive_laudos` |
| `screenshot` | print de conversa renderizado | `ev_screenshot_threat` |
| `location` | mini-mapa estilizado + nota | `ev_map_dock` (píer norte) |
| `report` | recorte de jornal/relatório | `ev_news_disappear` |

## 9.3 Como as evidências se conectam (a teia)

O jogo não tem "mecânica de combinar" manual (seria um puzzle). Em vez disso, a **conexão é narrativa e automática**: quando o jogador possui um conjunto de evidências, surgem **novas linhas de diálogo, ramos de `branch` e marcos de timeline** que explicitam a conexão. Exemplos canônicos:

- `ev_dock_audio` (motor) **+** `ev_pousada_log` (check-out 02h) **+** `ev_last_photo` (EXIF 02:14) → flag `boat_proven` → desbloqueia falas de Vesna e o pilar de prova do Final I.
- `ev_lia_notebook` (3 nomes/anos/assinatura) **+** `ev_archive_laudos` (laudos idênticos) **+** `ev_obituary_mira` → flag `pattern_proven` → habilita a falsa solução do Cap. 11 e prepara o Cap. 17.
- `ev_screenshot_threat` ("você não é sua mãe") **+** `ev_noemi_confession` → revela que Noemi foi silenciada antes.
- `ev_vey_signature_match` **+** `ev_vey_cafe_id` **+** `ev_vey_chip_purchase` → flag `vey_proven` → habilita a acusação correta no Cap. 20 (Final I).

## 9.4 Evidências que mudam de significado (reinterpretação)

Mecânica-assinatura do jogo: **a mesma evidência ganha novo significado** quando o jogador adquire contexto. A engine suporta isso por re-exibição condicional e por uma nota de "reinterpretação" que aparece na ficha quando certas flags são setadas. Casos canônicos:

- **`ev_last_photo`** — Cap. 0: "última foto, lugar proibido". Cap. 5 (dica de Kel): a **margem direita**, não a luz. Cap. 12: a luz é uma das três frames marcadas por Lia. Cap. 19: a luz era a **lanterna de Lia/Mira** (Final III). Quatro leituras da mesma imagem.
- **`ev_screenshot_threat`** — Cap. 1: ameaça genérica. Cap. 16: "você não é sua mãe" = **Noemi foi silenciada**. Cap. 17: o chip foi comprado **perto do necrotério** = Vey.
- **`ev_obituary_mira`** — Cap. 11: uma das afogadas. Cap. 13: caixão lacrado (suspeito). Cap. 14: ela está **viva**; o obituário é uma **fraude assinada por Vey**.
- **As mensagens "de ajuda" de Vey** (`ev_vey_chat_log`) — durante o jogo: aliado gentil. Cap. 17: reler é descobrir que **toda gentileza era vigilância**.
- **O áudio de Teo** (`ev_dock_audio`) — Cap. 10: o motor da noite de Lia. Depois: prova de que o **mesmo som** ocorreu em mortes antigas (padrão sonoro de décadas).

## 9.5 Princípios de design de evidência

- **Toda evidência tem um remetente falível (Pilar P8/P7).** Como o jogador só recebe o que alguém manda, cada prova carrega a sombra de quem a entregou — uma foto pode ser recortada, um áudio editado, um documento parcial. Isso é tematizado (não há "prova divina"), e algumas evidências são deliberadamente **enganosas** porque o remetente quis enganar (ou se enganou).
- **Nada de inventário-puzzle.** O jogador nunca precisa "usar item X em Y". A progressão é por leitura, escolha e diálogo.
- **A ficha é leitura, não desafio.** O prazer é **perceber** a conexão (insight), não destravar um mecanismo.
- **Densidade-alvo:** ~5–10 evidências por capítulo (ver §7.21 e tabela em §17), ~110–130 evidências no jogo inteiro.

---

# 10. Sistema de Confiança & Relacionamentos

> Cada personagem tem um valor **oculto** de confiança (`GameState.trust[id]`, 0–100). As escolhas o alteram via `Effect` `trust`. O valor **nunca é mostrado como número** ao jogador — só sentido pelo comportamento. Condições `trustAtLeast`/`trustBelow` (já no modelo) gateiam revelações.

## 10.1 Faixas de confiança e comportamento

| Faixa | Rótulo interno | Comportamento do personagem |
|---|---|---|
| 0–24 | **Hostil/Fechado** | Mente mais; esconde provas; ignora ou demora horas; respostas curtas e evasivas; pode **romper contato**. |
| 25–49 | **Desconfiado** | Responde, mas guarda o essencial; testa o jogador; entrega só o óbvio. |
| 50–74 | **Aberto** | Compartilha provas relevantes; admite medos; pede ajuda; coopera. |
| 75–100 | **Leal** | Revela segredos profundos; **defende** o jogador para terceiros; arrisca-se por ele; entrega as provas mais perigosas. |

> Valores iniciais sugeridos: Eron começa ~30 (desesperado mas desconfiado); a maioria entra em ~20–30 ao ser desbloqueada; Vesna entra baixa (~15) e exige muito; Mira entra ~10 (paranoia). Vey é tratado por um contador **invertido** (`vey_grip`, §11), pois "confiar nele" é o erro.

## 10.2 Gates de confiança canônicos (já implementados)

- **Eron ≥ 60 (Cap. 1):** entrega `ev_lia_notebook` (flag `has_notebook`). Abaixo: `held_notebook` (segura). Isto **propaga** ao Cap. 2 (Sahar confirma a teoria do pai só se `has_notebook`).
- Pequenos incrementos canônicos: `c_help` (+12 Eron), `c1a_alone` (+5), `c1b_fear` (+5), `c2a_how` (+10 Sahar), `c2b_key` (+5), `c2c_hide` (+8).

## 10.3 Pontos de virada por personagem (turning points)

| Personagem | Sobe muito quando… | Cai/quebra quando… | Ponto de virada (revelação destravada) |
|---|---|---|---|
| **Eron** | você fica, é discreto, o trata como parceiro | você recorre à polícia cedo, o ignora | ≥60: caderno; alto no fim: confia a localização da casa do guarda |
| **Sahar** | empatia genuína, protege provas | frieza, expõe Júlia | alto: faz a ponte com Júlia; arrisca-se por você no Cap. 18 |
| **Noemi** | promete proteger Eron, não chama a polícia | você a pressiona (`pushed_noemi`) | abre **a caixa** (Cap. 16); abaixo: rompe contato |
| **Júlia** | paciência, promessa de anonimato | pressão direta | entrega `ev_pousada_log` e o "rosto"; baixa: **some** |
| **Cael** | reciprocidade de info, profissionalismo | você queima fontes | publica e te protege; baixa: te expõe pela manchete |
| **Vesna** | prova com cadeia de custódia | especulação, ação por fora | prende Vey (Final I); baixa: vira o caso contra você |
| **Teo** | paciência com os áudios | corta/despreza | revela a morte antiga; baixa: `teo_silenced` |
| **Inês** | você a protege, esconde cópias | a expõe | dá os laudos e o vínculo Mira; baixa: **silenciada** (Cap. 18) |
| **Dário** | você se verifica como fonte de Lia | desconfiança/amadorismo | libera o drive (cofre externo) |
| **Edmar** | respeita o segredo de confissão | exige nomes/expõe | guia até "a mão que assina"; baixa: silêncio |
| **Mira** | passa nos testes, nunca pergunta onde ela está | tenta localizá-la/expô-la | parentesco + depoimento; baixa: **some para sempre** |

## 10.4 Efeitos sistêmicos da confiança

- **Latência de resposta:** quanto menor a confiança, maior o `typingMs`/atraso simulado e a chance de "visto e não respondeu". Quanto maior, respostas mais rápidas e calorosas.
- **Volume de informação:** ramos `branch` com `trustAtLeast` liberam blocos extras de diálogo e evidências.
- **Defesa do jogador:** personagens leais (≥75) **interferem a favor** — Sahar atesta seu caráter a Vesna; Cael publica seu lado; Eron recusa entregá-lo.
- **Cascata:** confiança alta em um personagem pode **abrir** outro (Sahar→Júlia; Cael→Inês; Inês→Henrique/Mira).

---

# 11. Sistema de Escolhas & Consequências

> **Não existe escolha decorativa (Pilar P4).** Toda `ChoiceOption` seta flags, ajusta confiança, libera/queima conteúdo ou move `endingScores`. Uma escolha no Cap. 2 pode mudar o Cap. 18.

## 11.1 Taxonomia de escolhas

| Tipo | O que faz | Exemplo |
|---|---|---|
| **Tom/empatia** | ajusta confiança, abre/fecha vínculos | "Como você está, de verdade?" (+10 Sahar) |
| **Custódia de prova** | proteger x expor x entregar | "Não mostre o bilhete pra ninguém" (+`ending_solved`) |
| **Direção institucional** | polícia x imprensa x por fora | "Leva pra polícia" (+`ending_conspiracy`) |
| **Acusação** | apontar um suspeito | "Acho que foi o Bruno" (+`accuse_bruno_score`) |
| **Proteção de pessoa** | salvar/avisar/expor alguém | Proteger Inês/Júlia/Mira |
| **Risco pessoal** | avançar x recuar sob ameaça | Aceitar a "oferta" de Vey (+`ending_conspiracy`) |
| **Investigação** | seguir/ignorar uma pista | Seguir a dica de Kel sobre a foto |

## 11.2 Flags principais (resumo; glossário completo em §17)

- **De progresso/posse:** `promised_help`, `knows_eron`, `has_notebook`/`held_notebook`, `have_sahar_contact`, `boat_proven`, `pattern_proven`, `evidence_backed_up`, `vey_proven`.
- **De relação:** `kind_to_sahar`, `careful_with_eron`, `noemi_trust_seed`, `pushed_noemi`, `protect_julia`, `protect_ines`, `mira_protected`, `cael_ally`, `vesna_respects_you`/`vesna_suspects_you`, `bruno_softened`.
- **De suspeita/dedução:** `stranger_doctorish`, `threat_near_morgue`, `saw_vey_signature`, `suspects_vey`, `rolando_has_a_boss`, `someone_alive_hint`, `mira_doubt`.
- **De perigo:** `heat` (numérico), `stranger_seen`, `watched`, `targeted`.
- **De scoring de final:** `endingScores` (via `lockEndingScore`), `accuse_bruno_score`, `forcedEnding`.

## 11.3 Doze exemplos de "escolha no Cap. X → consequência no Cap. Y"

1. **Cap. 0 `c_help` (prometer ajuda) → Cap. 1:** com confiança alta de saída, Eron chega mais perto do gate de 60 e tende a entregar `ev_lia_notebook`, mudando o Cap. 2 inteiro (Sahar confirma a teoria do pai).
2. **Cap. 1 `c1a_police` (levar à polícia) → Caps. 8 e 20:** acumula `ending_conspiracy`; no Cap. 8 Vesna te trata com mais frieza; no Cap. 20 pode travar o Final V.
3. **Cap. 2 `c2c_describe` (descrever o estranho) → Cap. 17:** seta `stranger_doctorish`; é a semente que permite **deduzir Vey** ("o estranho com maleta = o legista") — sem ela, a revelação chega mais crua e o jogador pode até cair no Final IV.
4. **Cap. 2 `c2c_hide` (proteger o bilhete) → Cap. 16/20:** `protected_note` + `ending_solved`; ajuda a preservar a cadeia de provas que Vesna exige no final.
5. **Cap. 2 `c2a_how` (empatia com Sahar) → Cap. 7:** `kind_to_sahar` é pré-requisito para Sahar fazer a ponte com Júlia; sem ele, Júlia é quase inalcançável e o `ev_pousada_log` pode nunca chegar.
6. **Cap. 3 (pressionar Noemi) → Cap. 16:** `pushed_noemi` acumulado → Noemi **rompe contato** e a caixa só vem (se vier) por Inês; pode-se perder a confissão (`ev_noemi_confession`).
7. **Cap. 7 (quebrar a promessa de anonimato de Júlia) → Cap. 18:** expor o nome dela a Vesna/Cael → Júlia **vira alvo e some/morre** (`ev_julia_gone`); perde-se a testemunha do "rosto".
8. **Cap. 8 (entregar áudio de Teo sem corroboração) → Cap. 20:** Vesna descarta; se o jogador não cruzar com Júlia/EXIF (`boat_proven`), falta o pilar de prova para o Final I, empurrando Final II.
9. **Cap. 9 (vazar o contrato a Cael cedo) → Cap. 18:** acelera a história mas eleva `heat`; a "limpeza" começa mais cedo e mais agressiva (mais perdas possíveis).
10. **Cap. 11 (não proteger Inês) → Cap. 18:** sem `protect_ines`, Inês é **silenciada** e leva as cópias dos laudos; o jogador precisa do backup de Dário (`evidence_backed_up`) ou perde `pattern_proven`.
11. **Cap. 14 (tentar localizar Mira) → Cap. 19:** quebra `mira_protected` → Mira **some para sempre**; fecha o Final III e enfraquece o depoimento que corrobora os laudos (`mira_corroborated`).
12. **Cap. 6/15 (acusar Bruno repetidamente) → Cap. 20:** `accuse_bruno_score` alto **força** o Final IV mesmo que o jogador tenha provas contra Vey — o jogo respeita a obsessão pelo alvo errado.

## 11.4 Mortes, traições e rupturas possíveis (canônico)

- **Júlia:** pode **sumir/morrer** (Cap. 18) se exposta (quebra de `protect_julia`).
- **Inês:** pode ser **silenciada/morta** (Cap. 18) se não protegida (sem `protect_ines`).
- **Teo:** pode **calar-se de vez** (`teo_silenced`) e some como fonte.
- **Mira:** pode **desaparecer para sempre** (re-forjar a morte) se exposta.
- **Noemi:** pode **romper contato** (bloqueio) se pressionada demais.
- **Sahar/Cael:** podem **trair sob pressão** (`ev_betrayal_proof`, Cap. 18) se a confiança estiver baixa e o `heat` alto — o aliado dobra para proteger a própria família/pele.
- **Bruno:** pode ser **condenado injustamente** (Final IV) — uma "vitória" que é, na verdade, uma derrota moral.
- **Eron:** sempre sobrevive fisicamente, mas seu **estado emocional** no epílogo varia (reencontra esperança no Final I; perde a última pessoa no Final V).

## 11.5 Resolução de finais por score (visão geral; detalhe em §14)

A engine acumula `endingScores` via `lockEndingScore` e respeita um `forcedEnding` quando setado. No Cap. 20, o `chapterEnd.ending` é resolvido por: (1) se `forcedEnding` → usa-o; (2) se `accuse_bruno_score` ≥ limiar e acusação final em Bruno → `ending_innocent`; (3) senão, o maior `endingScore` entre os elegíveis cujas **flags de pré-requisito** estão satisfeitas. Pré-requisitos por final estão em §14.

---

# 12. Sistema de Tensão & Perigo

> A sensação de perigo **cresce gradualmente** (Pilar P6): começa como conversa e termina com o jogador virando alvo. A engine modela isso por um contador `heat` (0–100) e por flags de estágio (`stranger_seen` → `watched` → `targeted`).

## 12.1 A curva de ameaça (capítulo a capítulo)

| Cap. | Estágio de ameaça | Manifestação concreta |
|---|---|---|
| 0–1 | **Curiosidade** | mensagens estranhas; o celular escondido; uma ameaça **a Lia** (não a você). |
| 2 | **Primeiro arrepio** | o **estranho** procura o que Lia deixou; Sahar mente para protegê-lo. |
| 3–4 | **Resistência passiva** | a família e a cidade desencorajam; a imprensa avisa que falar tem preço. |
| 5 | **Observação** | Kel mostra que **alguém acompanha** a investigação por dentro; mensagens somem. |
| 6–7 | **Poder com rosto** | os Saldanha; Júlia em pânico — falar **mata** nesta cidade. |
| 8–9 | **Pressão institucional/política** | você vira suspeito (Vesna); Rolando o **convida a parar**. |
| 10–11 | **A escala assusta** | o crime tem **décadas**; quem entrega prova (Inês) se torna risco. |
| 12–13 | **Cerco moral** | "ela não morreu"; "a mão que assina" — o perigo ganha forma. |
| 14 | **Choque** | uma morta viva; **se ela vive, o caçador ainda caça**. |
| 15–16 | **Você vira alvo** | a **foto da sua janela** (`ev_watcher_photo`): *eles sabem quem você é*. |
| 17 | **O predador sereno** | Vey revelado; a ameaça **sussurra** "compreendo". |
| 18 | **Limpeza** | perdas, traição, ameaça direta (`ev_drained_threat`). |
| 19–20 | **Ponto sem volta** | confronto final; a corrente **quebra** ou **prende você**. |

## 12.2 Mecânica de `heat` (perigo)

- **Sobe** quando o jogador: age por fora (vaza cedo, ignora custódia), trata Vey como aliado (`vey_grip`), expõe testemunhas, recusa colaborar com Vesna, ou avança rápido sem proteger pessoas.
- **Desce/estabiliza** quando: protege provas e pessoas, trabalha com método (Vesna/Dário/Cael de forma profissional), é discreto.
- **Limiares:**
  - `heat ≥ 40` → estágio `watched`: mensagens de número oculto, "visto" sem resposta, a sensação de observação.
  - `heat ≥ 65` → estágio `targeted`: `ev_watcher_photo`, ameaças diretas, aliados começam a hesitar.
  - `heat = máx` no Cap. 20 com prova perdida → empurra **Final V**.

## 12.3 Ferramentas de tensão (para escritores/áudio)

- **Silêncio como ameaça:** um contato que sempre respondia rápido **fica em silêncio** (sinal de perigo, não de bug). A ausência assusta.
- **A foto da janela:** o beat recorrente mais potente — usado uma vez no Cap. 16 e de novo no Final V. Nunca abuse; é a "arma nuclear" da tensão.
- **Mensagens que somem (Kel):** instalam dúvida sobre a própria sanidade/memória do jogador.
- **Chamadas (ver §13/§15):** uma ligação **recebida de madrugada** de número oculto é o ápice da intrusão — o jogador sente o telefone "ser invadido".
- **Regra de ouro:** a tensão é **psicológica e plausível**, nunca sobrenatural (P7). O medo vem de pessoas reais que sabem onde você mora.

---

# 13. Banco de Diálogos

> Amostras de diálogo **prontas para o tom**, por personagem e por momento-chave, suficientes para o time internalizar cada voz. Convenções: **[V]** = jogador (texto enviado), **[áudio]** = mensagem de voz transcrita, **[chamada]** = legenda de chamada, **[apagada]** = mensagem que some após enviada. Estas amostras são **ilustrativas** — escritores devem produzir conteúdo na mesma voz, não copiar.

## 13.1 Eron — cru, minúsculo, em rajada

**Momento: madrugada, sem resposta há horas (Cap. 5+)**
```
eron:  voce ta ai
eron:  to vendo q ta online
eron:  a janela do quarto dela abriu de novo
eron:  eu fechei
eron:  eu juro q fechei
[V] Tranca tudo e fica longe dessa janela. Já vou te ligar.
eron:  ta
eron:  obrigado por nao sumir
```

**Momento: descobrindo que tem uma meia-irmã viva (Cap. 14, se contado)**
```
[V] Eron, preciso te contar uma coisa difícil sobre a sua família.
eron:  fala
eron:  pior q isso n tem
[V] A Mira Halász, que "morreu" no lago, está viva. E é sua meia-irmã.
eron:  ...
eron:  meu pai
eron:  meu pai tinha outra filha
eron:  e ninguem me contou nada de novo
eron:  claro
```

## 13.2 Sahar — quente, emojis, áudios longos, "..."

**Momento: áudio longo lembrando de Lia (Cap. 2+)**
```
[áudio · 0:51] sahar:
"ai eu nem sei por onde começar 😭 a Lia... sabe quando a pessoa
entra no café e o lugar fica mais claro? era ela. ela tirava foto
da minha mão servindo o cafe e dizia 'isso aqui é que é bonito,
Sahar, não o lago'. e agora todo mundo só fala do lago. ninguém
fala dela. por isso que eu confio em você, viu? ☕💛"
```

**Momento: pânico (o "..." antes da bomba)**
```
sahar:  ...
sahar:  ...
[V] Sahar? Fala comigo.
sahar:  ele voltou 😨
sahar:  o homem da maleta
sahar:  ficou parado do outro lado da rua olhando o café por uns 10 min
sahar:  e sorriu pra mim quando viu q eu vi
```

## 13.3 Lia — só por arquivos, observadora, sem emoji

**Momento: memo de voz completo (`ev_voice_lia1`, Cap. 1)**
```
[áudio · 0:38] lia:
"...se alguém ouvir isso, eu fui ao lago de novo. eu sei o que eles
afundaram lá. não é o que contaram. três nomes, três anos, e a água
sempre lisa no dia seguinte, como se nada. se eu não voltar, comecem
pela Inês. ela guarda o ano certo. e não confiem em quem chega
oferecendo ajuda. ninguém aqui ajuda de graça."
```
> Nota: a última frase ("não confiem em quem chega oferecendo ajuda") é um **plant** de Vey, recompensa para quem reescuta no Cap. 17.

**Momento: mensagem antiga a Mira recuperada (Cap. 14, `ev_mira_lia_messages`)**
```
lia:  achei você pela luz. uma janela acesa numa casa que devia estar vazia.
lia:  eu não vou contar pra ninguém. nem pro Eron. ainda não.
lia:  só me diz uma coisa. o nosso pai sabia de você?
```

## 13.4 Cael — formal, datado, "a propósito"

**Momento: primeiro contato (Cap. 4)**
```
cael:  Boa noite. Imagino que você seja a pessoa que o garoto Moreaux
       mencionou. Peço desculpas pela formalidade — nesta cidade,
       aprendi a registrar tudo por escrito.
cael:  Tenho três casos arquivados: quinze, doze e onze anos atrás.
       Mesma represa. Mesma frase no laudo. A Gazeta chamou de azar.
cael:  A propósito: você sabe quem assinou os três? Porque eu sei.
       E é por isso que ninguém nesta cidade fala comigo.
```

## 13.5 Bruno — charmoso, "kkk", demora quando acuado

**Momento: confronto com o álibi furado (Cap. 6)**
```
[V] Você disse que não estava na cidade na quinta. Mas a foto é de quinta.
bruno:  [digitando…]
bruno:  [digitando…]
        (4 horas depois)
bruno:  cara desculpa caí no sono. então, eu tava na cidade sim mas
        não no lago kkk eu tava com uma pessoa, sabe como é
bruno:  não tem nada a ver com a Lia. para de me tratar igual aquele
        jornalista maluco, sério
```

## 13.6 Júlia — ansiosa, abrevia, apaga, some

**Momento: a confissão hesitante (Cap. 7)**
```
julia:  oi vc é amigo da minha irma né
julia:  blz entao
julia:  posso falar uma coisa mas vc num pode falar q fui eu
julia:  [apagada]
[V] Pode confiar. Não uso o seu nome com ninguém.
julia:  tem um check-out no sistema da pousada as 02h daquela quinta
julia:  q ninguem fez. eu q fecho o caixa. esse num passou por mim
julia:  e tinha um homem de casaco indo pro lado do lago
julia:  num era o bruno. eu conheço o bruno. era mais velho
julia:  esquece eu n falei nada
        (some por 6 horas)
```

## 13.7 Vesna — seca, numerada, "Aguardo retorno."

**Momento: cobrança de método (Cap. 8)**
```
vesna:  Recebi seu material.
vesna:  1. Quem gravou este áudio e em qual aparelho.
        2. Há cópia do arquivo original com metadados intactos.
        3. A testemunha aceita prestar depoimento formal.
vesna:  Sem isso, é ruído. Não trabalho com ruído. Aguardo retorno.
```

**Momento: virada de aliança (Cap. 20, Final I)**
```
vesna:  Reanalisei as assinaturas. Você tinha razão sobre uma coisa:
        é a mesma mão em quatro laudos. Pedi a perícia da capital.
vesna:  Não foi por você. Foi pela cadeia de custódia, que desta vez
        estava certa. Mas... obrigada. Aguardo retorno.
```

## 13.8 Rolando — político, "meu amigo", nunca direto

**Momento: o aviso cordial (Cap. 9)**
```
rolando:  Meu amigo! Soube que você anda se interessando pela nossa
          cidade. Que bom, que bom. Lugar de gente boa.
rolando:  Olha, sobre essa história antiga de laudo... página virada,
          viu? Coisa que só faz mal remexer. As famílias já sofreram.
rolando:  Aparece no gabinete. A gente toma um café, conversa com
          calma. Você vai ver que aqui a gente cuida dos nossos.
```

## 13.9 Teo — áudios divagantes, CAPS, datas trocadas

**Momento: áudio da noite (Cap. 10)**
```
[áudio · 1:47] teo:
"...então o moço me pergunta da Lia. eu vou te dizer o que eu OUVI,
que é diferente do que eu vi, porque ver eu não vi nada, tava escuro.
motor de popa. eu pesco aqui desde guri, eu CONHEÇO motor. ninguém
tem licença pro lado norte faz vinte ano. e não foi a primeira vez
não. teve uma outra noite, faz uns... sei lá, dez ano? doze? o mesmo
barulho. e no outro dia tinha velório. ó, mas isso aí ninguém quer
ouvir do velho bêbado, né. mas eu SEI o que eu ouvi, moço."
```

## 13.10 Inês — pausada, reticências, anos exatos, fotos de documento

**Momento: a entrega do padrão (Cap. 11)**
```
ines:  Você é a pessoa que a Lia esperava… eu acho. Ela dizia que ia
       mandar alguém de fora. Sente-se. Digo, escreva com calma.
ines:  [foto: ev_archive_laudos]
ines:  Três laudos. Quinze anos atrás. Doze. Onze. Olhe o último
       parágrafo de cada um… a mesma frase. Palavra por palavra.
ines:  Mandaram queimar tudo em 2009. Eu não queimei. Sou velha,
       não sou covarde… ainda.
```

## 13.11 Dário — técnico, "pauta/recorte/fechamento", links

**Momento: liberando o cofre (Cap. 12)**
```
dario:  Antes de qualquer coisa: você é fonte ou é da história dela?
        Não solto material de pauta aberta pra desconhecido.
[V] Sou quem ela escolheu pra continuar. Tenho o caderno e o memo dela.
dario:  Ok. Isso fecha. Te dou acesso ao recorte que ela me mandou.
dario:  São 240 frames. Três estão marcados "não publicar ainda".
        E tem um rascunho de texto. Uma linha só me arrepiou:
        "ela não morreu. eu a encontrei." Fechamento era ontem.
        Se a Lia não voltar, a gente publica como obra dela.
```

## 13.12 Edmar — brando, parábolas, pergunta com pergunta

**Momento: o enigma (Cap. 13)**
```
edmar:  Você pergunta sobre os caixões. Eu pergunto a você: por que
        um homem pede tanto que um caixão fique fechado?
[V] Porque o que está dentro não combina com a história contada.
edmar:  …Você entende rápido. Eu enterrei muita gente nesta cidade.
        Algumas eu abençoei sem nunca ter visto o rosto.
edmar:  Não posso dizer um nome. Mas posso lhe dizer onde olhar:
        olhe para a mão que assina, não para a que cava. Oremos.
```

## 13.13 Mira — cautelosa, testa, bonita-ou-cortante

**Momento: o teste de contato (Cap. 14)**
```
mira:  como você conseguiu esse número.
[V] A Lia deixou um rastro. Eu segui. Não quero te machucar.
mira:  uma frase. eu disse uma frase. você usou três. já é demais.
mira:  vou perguntar uma vez: você sabe onde eu estou?
[V] Não. E não quero saber. Só quero entender o que aconteceu com a Lia.
mira:  …boa resposta. quem pergunta onde eu estou trabalha pra ele.
mira:  a Lia é minha irmã. meia. mesmo pai. ele morreu naquele lago
       tentando provar o que eu já sabia aos quinze.
```

## 13.14 Vey — sereno, "compreendo/naturalmente", mais gentil perto do fim

**Momento: como aliado, antes da revelação (Caps. 11–16)**
```
adriano:  Compreendo perfeitamente a sua frustração. Laudos antigos
          confundem qualquer um — a linguagem técnica é cruel.
adriano:  Se quiser, eu mesmo explico cada um, com calma. Estou à
          disposição a qualquer hora. Inclusive de madrugada;
          eu durmo pouco. Naturalmente.
```

**Momento: o confronto (Cap. 17)**
```
[V] Foi você. Os quatro laudos. A maleta no café. O chip da ameaça.
adriano:  [digitando…]
adriano:  Que bom que você chegou até aqui. De verdade. Poucos chegam.
          A maioria desiste, ou aceita o café que eu ofereço.
adriano:  Eu não machuquei a Lia. Eu nunca machuco. Eu apenas… escrevo
          o que precisa ser escrito, para que esta cidade respire.
adriano:  Você está cansado. Está com medo. É natural. Venha aqui.
          Sem pressa. Eu cuido de você como cuidei de todos eles.
```
> Direção de atuação: Vey **nunca** sobe o tom. Quanto mais o jogador acusa, mais ele acolhe. O calafrio é a calma.

## 13.15 Kel — frio, pergunta, apaga

**Momento: a dica decisiva (Cap. 5)**
```
kel:  [apagada]  Você está olhando para a luz na foto. Errado.
kel:  [apagada]  Olhe quem NÃO aparece em lugar nenhum deste caso
                 e mesmo assim está em todos os documentos.
kel:  [apagada]  O nome mais simpático da cidade. Não me agradeça.
```

## 13.16 Henrique — só cartas/gravações, letra apertada

**Momento: a carta sob o assoalho (Cap. 16/19)**
```
[carta · ev_henrique_letters]
"Se você está lendo, eu já não posso falar. Não confiem no telefone.
Anotei as datas no verso. A menina Cruz não se afogou — eu vi a marca
no pulso dela antes de levarem. Por que sempre o mesmo médico assina?
Quem vê o corpo, decide o que o corpo diz. Cuidem da Lia. E da outra
menina, se ela aparecer. Ela é minha também. — H."
```

## 13.17 Exemplo de chamada simulada (incoming, madrugada)

**`CallNode` — número oculto, Cap. 16 (estágio `targeted`)**
```
[chamada recebida · NÚMERO OCULTO · 02:14]
  onAnswer:
    [legenda] (silêncio · respiração · o tilintar de metal, como uma
               maleta sendo fechada)
    [legenda] voz baixa: "...você devia dormir. eu durmo tão pouco."
    [clique]
  onDecline:
    [voicemail] "Sem pressa. Quando quiser conversar, você sabe onde
                 me encontrar. Estou sempre disponível. Naturalmente."
```
> A chamada não dá informação nova — dá **terror**. O jogador reconhece a voz de Vey (ou reconhecerá, no Cap. 17, e revisitará este momento com horror).

---

# 14. Os 5+ Finais

> 5 finais principais (ids canônicos em `endings.json`) + 2 variantes secretas. Cada um: **condição de desbloqueio** (flags/escolhas/score), **as cenas finais que mudam**, **o destino de cada personagem principal**, e **o tom**. O roteamento ocorre no `chapterEnd` do Cap. 20 (ver §11.5).

## 14.1 Lógica de roteamento (resumo)

No `chapterEnd` do Cap. 20, a engine resolve nesta ordem:
1. Se `forcedEnding` está setado → usa-o.
2. Senão, se a **acusação final** = Bruno **e** `accuse_bruno_score ≥ 3` → `ending_innocent`.
3. Senão, calcula o **final elegível de maior `endingScore`** cujas **flags de pré-requisito** (abaixo) estejam satisfeitas.
4. Empate/inelegibilidade → fallback `ending_conspiracy` (a cidade vence por inércia).

`lockEndingScore` é semeado ao longo de todo o jogo (já no Prólogo e Caps. 1–2 do build). Os pré-requisitos garantem que um final emocionalmente "não merecido" não dispare por acidente.

## 14.2 Final I — "A Corrente Quebrada" (`ending_solved`)

- **Tom:** justiça amarga. Vitória que a cidade não perdoa.
- **Desbloqueio (pré-requisitos):** `vey_proven` **E** `boat_proven` **E** (`pattern_proven` ou `mira_corroborated`) **E** um canal de entrega válido — **Vesna** (`vesna_respects_you`) **ou** imprensa (`cael_ally` + `evidence_backed_up`) — **E** maior `endingScore` em `ending_solved`. Acusação final em **Vey**.
- **Cenas finais (como em `endings.json`, expandidas):** a perícia da capital drena a represa norte pela primeira vez em 20 anos; os quatro laudos de Vey desmoronam um a um; Eron manda *"voce nao desistiu. ninguem nunca tinha ficado."*; três famílias enterram seus **nomes verdadeiros**.
- **Destino dos personagens:** **Vey** preso, sereno até no fim ("naturalmente"). **Rolando** cai politicamente (chantagem exposta) ou responde por improbidade. **Bruno** sobrevive, diminuído. **Vesna** reabilitada. **Inês** (se protegida) celebrada como quem guardou a memória. **Mira** decide se reaparece — frágil reencontro com Eron. **Lia**: encontrada (viva, se rota cruzou com III) ou enterrada com a verdade restaurada. **Eron** reaprende a confiar.

## 14.3 Final II — "O Barco Vazio" (`ending_escape`)

- **Tom:** melancolia e impotência. A verdade inteira, ninguém a quem entregar.
- **Desbloqueio:** o jogador tem a verdade (`vey_proven` ou perto) **mas** falha o canal **a tempo** — sem `vesna_respects_you` **e** sem `cael_ally`/`evidence_backed_up` consolidados no prazo do Cap. 20; ou agiu tarde (provas atrasadas). Maior `endingScore` em `ending_escape` ou empate sem canal.
- **Cenas finais (de `endings.json`):** quando Vesna bate na porta certa, a casa está vazia há dois dias; passagem comprada em dinheiro, carro na rodoviária; "você tem a verdade inteira nas mãos e ninguém para entregar"; meses depois, uma **foto de outro lago, em outra cidade, sem texto**.
- **Destino:** **Vey** **escapa** — recomeçará em outra cidade pequena (a foto final implica novas vítimas). **Rolando** sobrevive (sem o chefe para entregar). **Vesna** frustrada. **Inês/Mira** vivas mas em risco perpétuo. **Eron** com a verdade e sem justiça — o pior dos consolos.

## 14.4 Final III — "A Outra Margem" (`ending_alive`)

- **Tom:** catártico, agridoce, esperançoso. O reencontro.
- **Desbloqueio:** `someone_alive_hint` **E** `mira_protected` **E** `lia_alive_contact` **E** a leitura "a luz era uma lanterna" destravada (`ev_photo_reexamined` + frames de Dário) **E** prioridade de escolha em **salvar a pessoa** no Cap. 19/20. `endingScore` `ending_alive` semeado desde o Cap. 2 (`father_pushed_theory`).
- **Cenas finais (de `endings.json`):** a luz na outra margem **não era reflexo, era lanterna, era ela**; Lia se escondeu na **casa do guarda — a casa do pai** — esperando alguém de fora reunir o que faltava; *"eu precisava que alguém de fora visse o padrão. daqui de dentro, ninguém acreditaria em mim."*; os dois saem da mata ao amanhecer; "ela não está mais desaparecida — mas a cidade ainda está".
- **Destino:** **Lia viva**, ecoando Mira (forjou o sumiço para terminar o trabalho do pai). **Mira e Lia** se reencontram como irmãs — o coração emocional pago. **Vey** pode ou não cair (se combinado com I); na rota pura de III, ele fica **exposto mas livre** — a vitória é a vida, não a prisão. **Eron** reencontra a irmã (e ganha outra). **Noemi** confronta o passado. Tom: salvar alguém > condenar alguém.

## 14.5 Final IV — "O Nome Errado" (`ending_innocent`)

- **Tom:** tragédia silenciosa. A pior vitória.
- **Desbloqueio:** acusação final em **Bruno** com `accuse_bruno_score ≥ 3` (acumulado nos Caps. 2, 6, 8, 9, 15), **sem** `vey_proven`. Semeado desde o Cap. 2 (`c2c_police`).
- **Cenas finais (de `endings.json`):** as peças apontam para Bruno — "parece óbvio, parece justo"; a cidade quer um culpado e você entrega um; **a assinatura nos laudos continua a mesma; a mão que importa nunca treme**; anos depois, você acorda às 02:14 certo de ter esquecido de olhar para alguém.
- **Destino:** **Bruno** condenado/destruído (preso ou linchado pela opinião pública) — culpado de covardia, inocente do crime. **Vey** **intocado** — "agradece em silêncio" por ter recebido um bode expiatório de bandeja; continua livre e poderoso. **Rolando** sacrifica o filho para salvar o sistema. **Lia** sem justiça real. **Eron** acredita que acabou — engano que o jogador carrega. Variante mais cruel do Final II.

## 14.6 Final V — "Água Parada" (`ending_conspiracy`)

- **Tom:** terror frio. A cidade fecha sobre você.
- **Desbloqueio:** `heat` máximo **E** prova perdida/aliados caídos (sem `boat_proven`/`pattern_proven` consolidados) **OU** o jogador **aceitou a oferta de Vey** (parar) **OU** maior `endingScore` em `ending_conspiracy` (semeado nas escolhas "institucionais"/recuos desde o Prólogo). Fallback padrão.
- **Cenas finais (de `endings.json`):** as mensagens param; os contatos somem **um a um**, como luzes se apagando; a Gazeta publica "caso encerrado por falta de provas"; o lago volta a ficar liso; última foto: **a sua própria janela, vista de fora, à noite**; embaixo, "pare de procurar" — **sem remetente para bloquear**.
- **Destino:** **Vey** **vence sem levantar a voz**. **Rolando** mantém o poder. **Inês/Júlia/Teo** silenciados (vários sumiços/mortes acumulados). **Mira** re-desaparece para sempre. **Eron** perde a última pessoa (você). **Você** vira alvo — o jogo termina com o jogador, não Lia, sob a mira. O final mais sombrio.

## 14.7 Variante secreta A — "A Caneta Trocada" (`ending_successor`, opcional)

- **Tom:** horror cíclico, à la Zodiac/Seven.
- **Desbloqueio (escondido):** Final I parcial (`vey_proven` + prisão de Vey) **MAS** `heat` máximo **e** Vesna comprometida (`vesna_suspects_you`) **e** a chantagem de Vey **não** foi entregue (`ev_morgue_blackmail_files` retida) → a estrutura **substitui a caneta**: um novo legista assume e nada muda.
- **Cenas finais:** Vey preso/morto, mas um novo nome assina o próximo laudo; a represa segue interditada; um número desconhecido escreve a **outra pessoa de fora** — o ciclo recomeça com novo "jogador".
- **Função de design:** recompensa/punição para jogadores que pegam o vilão mas **não desmontam o sistema** — reforça o tema "a corrente, não o elo".

## 14.8 Variante secreta B — "Quinze Anos de Atraso" (`ending_nadia`, opcional)

- **Tom:** justiça póstuma e luto antigo.
- **Desbloqueio (escondido):** resolver, além do caso de Lia, o **caso de Nádia Cruz** (vítima zero) — requer `teo_remembers_henrique` + `ev_henrique_tape` + o "porquê" original de Nádia + corroboração. Combina com Final I.
- **Cenas finais:** drenado o lago, encontram o que Nádia sabia (a prova do crime fundador sob a água); a família dispersada de Nádia recebe, 15 anos depois, um enterro com nome; Henrique é reabilitado como o guarda que **viu primeiro**.
- **Função de design:** o "final platinado" para quem investigou **tudo** — fecha a primeira pedra da corrente, não só a última.

## 14.9 Princípios dos finais

- **Cada final reescreve cenas, não só um texto.** O epílogo (§7) e várias falas dos últimos capítulos têm `branch` por `endingId`/flags; personagens vivos/mortos mudam quem aparece.
- **Nenhum final é "game over" punitivo.** Mesmo o Final V é uma conclusão autoral completa, não um fracasso.
- **Replay value:** as variantes e o gating por flags incentivam rejogar para ver "e se eu tivesse protegido a Júlia? e se eu tivesse desconfiado do médico antes?".

---

# 15. Interface & Apps do Celular

> O app **É** o jogo (Pilar P1). A tela inicial é uma **home de smartphone fictício** com ícones de apps. Não há HUD de jogo, nem menus "de RPG". Tudo reforça que o jogador está usando um celular de verdade no meio de um caso real. A primeira abertura **pula direto** para a thread de Eron (cold open); os outros apps se revelam conforme o jogo "explica" que existem.

## 15.1 Home / launcher

- Grade de ícones: **Mensagens · Contatos · Arquivos · Galeria · Chamadas · Linha do Tempo · Notícias · Perfis** (perfis acessados via Contatos).
- **Badges de não-lidas** (de `ThreadState.unread`) nos ícones; o de Mensagens pulsa quando há atividade.
- Barra de status fictícia: hora diegética, ícone de sinal **fraco** (tema "Sinal Perdido"), bateria. À medida que `heat` sobe, sutis glitches/atrasos de UI (sem nunca virar puzzle).

## 15.2 Mensagens

- Lista de threads por contato (e por número desconhecido). Bolhas estilo mensageiro: jogador à direita, contatos à esquerda, **`system` como card de narração centralizado** (já no modelo `ChatEntry`/`MessageNode`).
- **"Digitando…"** simulado via `typingMs`; latência maior com confiança baixa.
- **Anexos** (`Attachment`) inline: foto (thumbnail), áudio (player + duração), vídeo (player), localização (mini-mapa). Cada anexo que referencia `evidence` também cai em Arquivos.
- **Mensagens que somem** (Kel): renderizadas e depois substituídas por "(mensagem apagada)"; o jogador pode tentar print (vira evidência frágil).
- **Escolhas** (`ChoiceNode`): botões na base; ao escolher, vira bolha enviada do jogador (`say` opcional).

## 15.3 Contatos

- Só mostra contatos **desbloqueados** (`unlockedContacts`, via `unlockContact`). A lista **cresce** ao longo do jogo — manifestação concreta do "mundo se expandindo" (regra do brief).
- Cada contato abre um **Perfil**: avatar (iniciais + `avatarColor`), nome, papel, `bio` **spoiler-free**, botão de mensagem/chamada. Sem expor idade/segredos do GDD.
- Contatos podem **sumir** da lista (ruptura/morte/desaparecimento), reforçando consequência.

## 15.4 Arquivos (ARQUIVOS DO CASO)

- Cofre central de evidências (§9). Filtro por `kind` e por `source`. Cada ficha: thumbnail, título, descrição, **data recebida, quem enviou, ligação com o caso**, e `body` (transcrição/EXIF/texto).
- Nota de **reinterpretação** aparece quando flags mudam o significado (§9.4).
- Contador de evidências por capítulo (sem ser "score"); serve de bússola de progresso.

## 15.5 Galeria

- Subconjunto visual de Arquivos: só `photo`/`video`. Visualizador em tela cheia, com EXIF.
- É onde a **última foto** (`ev_last_photo`) vive para reexame (a margem direita, a luz/lanterna). Reforça o ato de **olhar de novo**.

## 15.6 Chamadas

- Log de chamadas (recebidas/perdidas/feitas). Suporta **chamadas de voz simuladas** e **voicemail** (`CallNode`).
- Chamada recebida abre tela de "atender/recusar"; ao atender, legendas/transcrição rolam (`transcript`); ao recusar, gera `voicemailText` e um log de perdida.
- Usadas com parcimônia para **picos de imersão/tensão** (a ligação de madrugada de Vey, §13.17).

## 15.7 Linha do Tempo

- Render automático dos `TimelineEntry` (via `addTimeline`), em ordem cronológica diegética. Cada marco: título + detalhe + "data".
- Função dupla: **revisão** da investigação e **insight tardio** (no Cap. 17, reler revela "estranho com maleta = legista"). É a ferramenta anti-confusão num caso longo.

## 15.8 Notícias

- Feed de recortes desbloqueados (`news`, via `unlockNews`): **Gazeta de Corvo Pálido** (oficial, minimiza) vs. **Blog Margens** (Cael, denuncia). Já existem `news_disappear`, `news_lake_history`, `news_council_orla`.
- O contraste entre os dois veículos **ensina o tema** (versão oficial x verdade) sem exposição. Em vários finais, a manchete final muda (ex.: "caso encerrado por falta de provas" no Final V).

## 15.9 Redes sociais fictícias / depoimentos (extensão de Notícias/Perfis)

- Perfis públicos de alguns personagens trazem posts antigos (a orla "20 anos", fotos de Lia, comentários da cidade), funcionando como **depoimentos passivos** e fonte de pistas (e red herrings).
- Mantidos leves: são **leitura ambiental**, nunca um app de "feed infinito" que distraia do caso.

## 15.10 Princípios de UI

- **Diegese total:** nenhum elemento quebra a ficção do celular. Sem "pontos", "níveis" ou barras de jogo.
- **Acessibilidade de leitura:** fonte legível, modo escuro nativo (combina com o tom), áudios sempre com **transcrição** (acessibilidade + jogar sem som).
- **Sem fricção monetária/temporal:** nada de timers, energia ou paywall (Pilar P2). A única espera é o `typingMs` (dramatúrgico, curto, pulável por toque).

---

# 16. Progressão & Ritmo

## 16.1 Distribuição das ~20 horas

- **Meta:** ~1h por capítulo × 22 unidades (Prólogo + 20 + Epílogo) ≈ 20–22h na primeira jogada, lendo no ritmo natural. Rejogadas e variantes secretas adicionam horas.
- **Densidade por capítulo:** 2–5 personagens novos (nos capítulos de introdução), 5–10 evidências, 3–5 eventos, 5–10 escolhas (ver §7.21). Capítulos do meio (11, 14, 17) são mais longos (revelações-pilar).

## 16.2 Cadência de revelações e reviravoltas

- **Regra dos 3 atos com falsas soluções:**
  - **Ato 1 (Caps. 0–7):** montar o caso e os red herrings (Bruno, a cidade). Gancho: o celular escondido, a ameaça, o estranho.
  - **Ato 2 (Caps. 8–15):** o padrão de décadas; falsas soluções (Rolando, "é só encobrimento"); a **reviravolta de Mira** (Cap. 14) vira o jogo.
  - **Ato 3 (Caps. 16–20):** o jogador vira **alvo**; a **revelação de Vey** (Cap. 17); perdas, confronto, roteamento de final.
- **Batida de virada a cada 2–3 capítulos** (uma revelação ou reviravolta), e **uma falsa solução** desmontada perto dos Caps. 11, 13/15 e 17 — para que o jogador "resolva e erre" repetidamente (Pilar P5).
- **Alternância de registro:** capítulos de **conexão** (provas, lógica: 4, 10, 11, 12, 15) intercalam com capítulos **emocionais/de personagem** (3, 7, 13, 14, 16) para evitar fadiga.

## 16.3 Gating puramente narrativo

- O único "gate" é **narrativo**: completar um capítulo desbloqueia o próximo (`chapterEnd.next`/`unlocks`); confiança e flags destravam **profundidade** (mais provas, mais ramos), não barreiras de tempo/dinheiro.
- **Sem becos sem saída:** o jogador sempre pode avançar a história principal; o que muda é **o quê** ele descobre e **com quem** chega ao fim. Provas perdidas (Inês silenciada, Júlia some) não travam o jogo — **mudam o final**.
- **Sessões naturais:** cada capítulo é uma "sentada"; quebras de capítulo (`chapterEnd`) são pontos de salvar/parar limpos (estado em AsyncStorage).

## 16.4 Onboarding sem tutorial

- Não há tela de tutorial (regra do brief). A interface ensina-se sozinha: a primeira coisa é responder uma mensagem; o primeiro anexo "ensina" Arquivos; o primeiro `addTimeline` "ensina" a Linha do Tempo.
- Dicas contextuais mínimas (se necessárias) aparecem como **parte da ficção** (ex.: Eron diz "olha isso aqui" ao mandar o primeiro anexo) — nunca como overlay de game design.

---

# 17. Apêndice: Glossário de Flags & Variáveis

> Convenções e tabelas de referência rápida para o time de conteúdo. Alinhadas a `types/game.ts` (`GameState`) e `types/story.ts` (`Effect`/`Condition`).

## 17.1 Convenções de ids

| Prefixo | Uso | Exemplo |
|---|---|---|
| (sem prefixo) | id de personagem | `eron`, `lia`, `adriano` |
| `ev_` | evidência | `ev_last_photo`, `ev_vey_signature_match` |
| `news_` | recorte/notícia | `news_disappear` |
| `ending_` | final | `ending_solved` |
| `t_` | marco de timeline | `t_last_photo`, `t_case_opened` |
| `chapterNN` / `prologue` / `epilogue` | capítulo | `chapter17` |
| nós internos do capítulo | `cX_*`, `pN`, `_choice_`, `_branch_` | `c1_trust_branch`, `p_reveal` |
| flags | snake_case descritivo | `has_notebook`, `kind_to_sahar` |

> **Regra:** ids são estáveis e nunca reaproveitados com outro sentido (saves dependem disso). Flags booleanas por padrão; usar `flagEquals` quando guardarem string/número.

## 17.2 Glossário de flags principais

| Flag | Tipo | Setada em | Significado / efeito |
|---|---|---|---|
| `promised_help` | bool | Prólogo | jogador aceitou o caso; +score `ending_solved` |
| `knows_eron` | bool | Prólogo | Eron desbloqueado |
| `careful_with_eron` | bool | Cap.1 | jogador foi discreto; favorece revelações |
| `has_notebook` | bool | Cap.1 (Eron≥60) | possui `ev_lia_notebook`; muda Cap.2+ |
| `held_notebook` | bool | Cap.1 (Eron<60) | Eron segurou o caderno |
| `have_sahar_contact` | bool | Cap.1 | contato de Sahar liberado |
| `kind_to_sahar` | bool | Cap.2 | empatia com Sahar; pré-req. de Júlia |
| `wants_key`/`will_check_key` | bool | Cap.2 | buscar a chave do mirante |
| `father_pushed_theory` | bool | Cap.2 (se has_notebook) | teoria do pai empurrado; +score `ending_alive` |
| `protected_note` | bool | Cap.2 | bilhete protegido; +score `ending_solved` |
| `stranger_seen` | bool | Cap.2 | o estranho procurou Lia |
| `stranger_doctorish` | bool | Cap.2 | "maleta de médico"; **semente de Vey** |
| `noemi_trust_seed` | bool | Cap.3 | confiança de Noemi semeada |
| `pushed_noemi` | bool | Cap.3+ | pressão; risco de ruptura |
| `noemi_cracked` | bool | Cap.3/11 | Noemi vacila sobre a morte do marido |
| `cael_ally` | bool | Cap.4 | Cael como aliado/canal de imprensa |
| `cael_source_lead` | bool | Cap.4 | pista da fonte riscada |
| `kel_guess_*` | bool | Cap.5 | palpites de identidade de Kel |
| `bruno_rattled`/`bruno_softened`/`bruno_fears_father` | bool | Cap.6 | estados de Bruno |
| `accuse_bruno_score` | num | Caps.2,6,8,9,15 | acúmulo p/ Final IV |
| `protect_julia` | bool | Cap.7 | promessa de anonimato a Júlia |
| `julia_vanished` | bool | Cap.7+ | Júlia sumiu (pressão) |
| `vesna_respects_you`/`vesna_suspects_you` | bool | Cap.8 | relação com a lei |
| `rolando_threatened_you`/`rolando_has_a_boss` | bool | Cap.9 | poder político / chefe acima |
| `boat_proven` | bool | Cap.10 | barco provado (Teo+Júlia+EXIF) |
| `teo_silenced`/`teo_remembers_henrique` | bool | Cap.10 | estados de Teo |
| `pattern_proven` | bool | Cap.11 | padrão dos 3 laudos provado |
| `saw_vey_signature` | bool | Cap.11 | viu a assinatura A. Vey |
| `protect_ines` | bool | Cap.11 | Inês protegida |
| `mira_doubt` | bool | Cap.11 | dúvida sobre o caixão de Mira |
| `evidence_backed_up` | bool | Cap.11/12 | backup com Dário |
| `someone_alive_hint` | bool | Cap.12 | "ela não morreu" |
| `edmar_hints_killer`/`wants_exhumation` | bool | Cap.13 | guias de Edmar |
| `mira_protected`/`mira_corroborated` | bool | Cap.14 | proteção/corroboração de Mira |
| `threat_near_morgue` | bool | Cap.15 | chip da ameaça perto do necrotério |
| `watched` | bool | ~Cap.5/16 (heat) | estágio "observado" |
| `targeted` | bool | Cap.16+ (heat) | jogador virou alvo |
| `suspects_vey` | bool | Cap.16/17 | dedução de Vey |
| `vey_proven` | bool | Cap.17 | Vey provado (assinaturas+chip+café) |
| `lia_alive_contact` | bool | Cap.19 | Lia viva contatou |
| `heat` | num | global | medidor de perigo (0–100) |

## 17.3 Effects/Conditions disponíveis (referência da engine)

- **Effects:** `setFlag`, `trust`, `unlockContact`, `addEvidence`, `unlockNews`, `addTimeline`, `setEnding`, `lockEndingScore`.
- **Conditions:** `flag`, `flagEquals`, `trustAtLeast`, `trustBelow`, `hasEvidence`, `choseOption`, `chapterCompleted`, `all`, `any`, `not`.
- **Nós:** `message`, `choice`, `action`, `branch`, `call`, `chapterEnd`.

## 17.4 Tabela: Personagem × capítulo de introdução

| Personagem | id | Introdução |
|---|---|---|
| Eron Moreaux | `eron` | Prólogo |
| Lia Moreaux | `lia` | Prólogo (via arquivos) |
| Sahar Vance | `sahar` | Capítulo 2 |
| Noemi Moreaux | `noemi` | Capítulo 3 |
| Cael Domingues | `cael` | Capítulo 4 |
| Kel | `kel` | Capítulo 5 |
| Bruno Saldanha | `bruno` | Capítulo 6 |
| Júlia Vance | `julia` | Capítulo 7 |
| Vesna Toma | `vesna` | Capítulo 8 |
| Rolando Saldanha | `rolando` | Capítulo 9 |
| Teodoro Vidal | `teo` | Capítulo 10 |
| Inês Lund | `ines` | Capítulo 11 |
| Henrique Moreaux | `henrique` | Capítulo 11 (documentos) |
| Nádia Cruz | `nadia` | Capítulo 11 (registros) |
| Dário Penha | `dario` | Capítulo 12 |
| Edmar Reis | `edmar` | Capítulo 13 |
| Mira Halász | `mira` | Capítulo 14 |
| Adriano Vey | `adriano` | Capítulo 17 (oculto desde Cap.2) |

## 17.5 Tabela: Evidências × capítulo

> `(impl.)` = já existe no build; `(NOVO)` = a criar. Lista representativa; cada capítulo deve fechar a quota de 5–10 (§7.21).

| Capítulo | Evidências |
|---|---|
| Prólogo | `ev_missing_flyer` (impl.), `ev_last_photo` (impl.) |
| 1 | `ev_voice_lia1` (impl.), `ev_screenshot_threat` (impl.), `ev_lia_notebook` (impl.) |
| 2 | `ev_cafe_note` (impl.) |
| 3 | `ev_locked_box`, `ev_key_micro_sd`, `ev_box_letter_corner`, `ev_noemi_contradiction`, `ev_dad_case_file` |
| 4 | `ev_news_disappear` (impl.), `ev_three_drownings`, `ev_margens_post`, `ev_redacted_laudo`, `ev_cael_sources_list` |
| 5 | `ev_kel_first_ping`, `ev_photo_reexamined`, `ev_deleted_thread` |
| 6 | `ev_bruno_alibi`, `ev_breakup_messages`, `ev_dock_permit`, `ev_bruno_lakephoto` |
| 7 | `ev_pousada_log`, `ev_julia_voice`, `ev_parking_cam_still`, `ev_julia_deleted_text` |
| 8 | `ev_police_intake`, `ev_chain_custody_form`, `ev_old_case_vesna`, `ev_vesna_warning` |
| 9 | `ev_orla_contract`, `ev_council_minutes`, `ev_rolando_voicemail`, `ev_donation_records`, `ev_blackmail_hint` |
| 10 | `ev_dock_audio` (impl.), `ev_teo_old_night`, `ev_motor_analysis`, `ev_teo_map_mark` |
| 11 | `ev_obituary_mira` (impl.), `ev_archive_laudos`, `ev_henrique_letters`, `ev_nadia_record`, `ev_mira_sealed_coffin`, `ev_destroy_order` |
| 12 | `ev_lia_cloud`, `ev_three_marked_frames`, `ev_lia_draft_text`, `ev_photo_metadata_full`, `ev_essay_layout` |
| 13 | `ev_burial_records`, `ev_edmar_sermon_clip`, `ev_confession_riddle`, `ev_empty_grave_hint` |
| 14 | `ev_mira_proof_alive`, `ev_mira_lia_messages`, `ev_halasz_birth_record`, `ev_mira_testimony_audio`, `ev_two_sisters_photo` |
| 15 | `ev_lia_timeline_board`, `ev_threat_origin`, `ev_lia_last_plan`, `ev_who_knew_list`, `ev_essay_published_draft` |
| 16 | `ev_henrique_tape`, `ev_noemi_confession`, `ev_family_truth_doc`, `ev_watcher_photo`, `ev_ines_threatened` |
| 17 | `ev_vey_signature_match`, `ev_vey_calendar`, `ev_vey_cafe_id`, `ev_vey_chat_log`, `ev_morgue_blackmail_files`, `ev_vey_chip_purchase` |
| 18 | `ev_ines_last_message`, `ev_julia_gone`, `ev_betrayal_proof`, `ev_drained_threat`, `ev_safe_copy` |
| 19 | `ev_guard_house`, `ev_lia_hideout`, `ev_final_proof`, `ev_lia_alive_contact`, `ev_vey_last_offer` |
| 20 | `ev_case_dossier`, `ev_arrest_or_escape`, `ev_final_message` |

## 17.6 Tabela: Notícias × veículo

| id | Veículo | Quando | Papel |
|---|---|---|---|
| `news_disappear` (impl.) | Gazeta de Corvo Pálido | Cap.0–1 | versão oficial minimiza o sumiço |
| `news_lake_history` (impl.) | Blog Margens | Cap.4 | denuncia o "padrão, não azar" |
| `news_council_orla` (impl.) | Gazeta | Cap.9 | celebra a orla; planta Rolando/Bruno |
| `news_case_closed` (NOVO) | Gazeta | Final IV/V | "caso encerrado por falta de provas" |
| `news_lake_drained` (NOVO) | Margens/Gazeta | Final I | a represa é drenada; a verdade vem à tona |

## 17.7 Checklist de consistência para o time

- [ ] Toda evidência referenciada por um `attachment` existe em `evidence.json` e tem os 4 metadados (kind, source, caseRelevance, body).
- [ ] Todo personagem que envia mensagem foi `unlockContact` antes (ou é o desconhecido inicial).
- [ ] Todo `lockEndingScore` aponta um `ending_*` válido; todo `setEnding`/`forcedEnding` idem.
- [ ] Vozes conferidas contra §5 (teste do "abrir sem nome").
- [ ] Cada capítulo cumpre a quota de §7.21.
- [ ] Pistas falsas têm o desmonte plantado antes da revelação (§8.3).
- [ ] Nenhuma mecânica proibida (energia/vidas/moedas/puzzle/paywall) foi introduzida (Pilar P2).
- [ ] Toda estranheza tem explicação humana plausível (Pilar P7).

---

*Fim do Game Design Document — Sinal Perdido. Documento vivo: atualizar `version` no cabeçalho a cada revisão de conteúdo canônico.*
