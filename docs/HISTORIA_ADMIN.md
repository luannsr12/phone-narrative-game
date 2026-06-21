# SINAL PERDIDO — Guia de Produção da História Completa (ADMIN)

> Documento exclusivo de produção. **Nada daqui aparece no jogo.**
> A história completa (Prólogo + Capítulos 1–25 + finais-epílogo) está implementada em
> `src/story/story.json`. Este guia traz o que o jogo não carrega: descrições visuais dos
> personagens (para gerar avatares/imagens), especificações exatas de cada mídia (para criar os
> arquivos e colar os links no editor) e o mapa de roteamento dos finais.
> O lore profundo segue em `docs/GAME_DESIGN_DOCUMENT.md` (cânone preservado).

---

## 1. Mapa dos 25 capítulos (e mecânicas usadas)

| Cap. | Título | Quem entra | Mecânicas em destaque |
|---|---|---|---|
| P | Número Desconhecido | Eron | lembrete "voce ta ai?" (3 min), notificação de notícia |
| 1 | O Celular Escondido | — | gate de confiança (Eron ≥ 60 → caderno) |
| 2 | O Bilhete no Açucareiro | Sahar | branch por flag `has_notebook` |
| 3 | A Caixa que Ninguém Abriu | Noemi | liberar mensagem (mãe do jogador), lembrete de Noemi |
| 4 | Margens | Cael | **liberar mensagem** (jogador inicia), anexo **link**, teste com condição `has_notebook` |
| 5 | O Número que se Apaga | Kel | contato que permanece número desconhecido, notificação **custom** ("Pares") |
| 6 | O Homem Educado | **Vey** | liberar mensagem, **publishNews** (homenagem), escolha-armadilha `told_vey_evidence` |
| 7 | Em Bons Termos | Bruno | **publishPost/publishStory**, escolha gated por `protected_note` |
| 8 | A Recepção da Pousada | Júlia | **ligação** (atender/recusar), vídeo da câmera, publishStory |
| 9 | Aguardo Retorno | Vesna | delay "fora de expediente", consequências de mentir |
| 10 | O Preço do Silêncio | — | **transferência bancária real** (conta 71203-9, `paidAtLeast`), trava de capítulo |
| 11 | Página Virada | Rolando | publishNews/publishPost, opção condicionada a `kel_paid` |
| 12 | O Motor na Noite Errada | Teo | tudo por **áudios com transcrição**, evidência `ev_dock_audio` |
| 13 | O Ano Certo | Inês | liberar mensagem, trava `hasEvidence ev_laudo_mira` |
| 14 | Recorte e Fechamento | Dário | contact sheet + RAW, anexos de imagem encadeados |
| 15 | O Que Está Submerso | Edmar | sermão em áudio, parábolas, foto do túmulo |
| 16 | A Que Não Morreu | **Mira** | branch que **verifica como você tratou testemunhas**, liberar mensagem |
| 17 | O Que Lia Sabia | — | carta-documento, armário 17, escolha de contar/proteger Eron |
| 18 | Sinal Fraco | "oculto" | **ligação de ameaça gravada**, notificação custom (CorvoTel), perfil stalker no Mural, branch de "heat" |
| 19 | A Caixa Aberta | Henrique (post mortem) | cartas + fita com transcrição, trava `ev_henrique_tape` |
| 20 | O Homem Gentil | — | **a revelação**: comparativo de assinaturas OU trilha apagada (`told_vey_evidence`), anexo link (dossiê privado) |
| 21 | Água Subindo | — | notificação custom de ameaça ("02:14"), ligação do Eron, **gasto de dinheiro** (`moneyAtLeast 35`), retorno de Júlia |
| 22 | A Outra Margem | **Lia** (rota viva) | travessia com 3 rotas, branch por mérito acumulado, áudio-memo |
| 23 | O Arquivista de Segredos | — | **ligação de Vey** (máscara caída), nó **bank +R$500** (suborno na SUA conta), promessa a Mira |
| 24 | Quinze Anos de Atraso | **Mara** | liberar mensagem, escolhas com `hasEvidence`, trava enviar/segurar |
| 25 | A Corrente | — | branch-mestre de 7 rotas → `setEnding` |

**Finais (7):** A Corrente Quebrada, O Barco Vazio, A Outra Margem, O Nome Errado, Água Parada + secretos **A Caneta Trocada** (aceitar o acordo) e **Quinze Anos de Atraso** (justiça nominal pra Nádia). As cenas dos finais fazem papel de epílogo.

### Roteamento do final (cap. 25, em ordem de prioridade)
1. `accepted_vey_deal` → **A Caneta Trocada**
2. `case_withheld` → **Água Parada**
3. `accused_innocent` → **O Nome Errado**
4. `lia_found_alive` + `case_sent` → **A Outra Margem**
5. `case_sent` + `nadia_justice` → **Quinze Anos de Atraso**
6. `case_sent` + `evidence_compromised` (contou a Vey no cap. 6) → **O Barco Vazio**
7. `case_sent` → **A Corrente Quebrada**
8. fallback → **Água Parada**

### As 10+ reviravoltas (onde caem)
1. (C4) Não é um sumiço: são TRÊS mortes no mesmo píer.
2. (C7) O término "em bons termos" escondia a planilha que Lia viu.
3. (C8) Um carro sem faróis foi ao píer às 01:52 — e um "D. Penha" dormia ao lado.
4. (C12) O motor da noite de Lia é O MESMO da noite de Henrique, 12 anos antes.
5. (C13) Os três laudos têm parágrafos idênticos — e um deles é de afogamento SEM corpo.
6. (C14) A "luz na outra margem" é uma PESSOA com lanterna, às 02:14:07.
7. (C16) Mira Halász está viva — e é meia-irmã de Lia.
8. (C17) Existe uma ficha sobre VOCÊ no gaveteiro de aço.
9. (C19) Henrique sabia: "não procura quem remou, procura quem ASSINA". E 02:14 é rotina de comporta.
10. (C20) O homem mais gentil do caso — Dr. Vey — assina tudo há 30 anos. (E o estranho da maleta do cap. 2 era ele.)
11. (C22) A casa do guarda está HABITADA. (rota viva: Lia esperava você.)
12. (C23) Vey não ameaça: ele OFERECE — e deposita R$ 500 na sua conta sem pedir.

### Pistas falsas principais (e resolução)
- **Bruno** ("não conta pro B", prints) → covarde e mimado, não assassino; a planilha era do pai.
- **Rolando** (dinheiro, ameaças veladas, 3 celulares) → corrupto e cúmplice de ocultação, mas vitrine; não decide mortes. Acusá-lo no topo = Final IV.
- **Dário** (hóspede misterioso do quarto 2) → estava lá A TRABALHO com Lia; vira aliado.
- **Kel** (anônimo que cobra) → mercenário com causa própria; nunca foi o vilão.
- **O quarto 5 da pousada** (C21) → o executor local; deliberadamente sem rosto — alimenta a tese de que Vey nunca age sozinho.

---

## 2. DESCRIÇÃO VISUAL DOS PERSONAGENS (para gerar avatares — admin)

> Use estes textos como prompt-base. Paleta geral do jogo: tons frios, névoa, luz cinza-azulada.
> Avatares devem parecer fotos de perfil de celular (enquadramento busto/rosto), não ilustração.

**Eron Moreaux (`eron`, 16)** — Sexo masculino, aparenta 15–17. ~1,70 m, magro de ombros estreitos, em fase de estirão. Pele clara levemente bronzeada, olheiras fundas. Olhos castanho-escuros grandes e desconfiados; rosto fino de queixo pontudo, espinhas discretas na testa. Cabelo castanho liso, despenteado, caindo na testa — corte caseiro crescido. Moletom cinza grande demais (herdado), capuz frequentemente na cabeça, mochila escolar gasta. Unhas roídas, fone de ouvido com fio enrolado no pescoço. Postura encolhida, mãos nos bolsos; expressão fechada de quem chora escondido e não admite. Foto de perfil: selfie escura em contraluz de quarto, meio rosto.

**Lia Moreaux (`lia`, 25)** — Sexo feminino, aparenta 24–27. ~1,68 m, esguia, atlética de caminhada. Pele clara fria, sardas leves no nariz. Olhos castanho-esverdeados, atentos, "que medem luz". Rosto oval, sobrancelhas grossas naturais, sem maquiagem. Cabelo castanho-escuro ondulado abaixo do ombro, sempre meio preso com prendedor de plástico. Jaqueta militar verde-oliva surrada sobre camiseta preta, calça cargo, coturno; câmera analógica a tiracolo SEMPRE, mancha de revelador nos dedos. Expressão séria com meio sorriso irônico; cicatriz fina no cotovelo direito. Foto de perfil: autorretrato refletida em vidro embaçado, câmera cobrindo metade do rosto.

**Sahar Vance (`sahar`, 24)** — Sexo feminino, aparenta 22–25. ~1,60 m, corpo cheio e acolhedor. Pele morena quente, bochechas coradas do balcão. Olhos castanho-mel grandes e expressivos, cílios marcados. Rosto redondo, covinha à esquerda. Cabelo preto cacheado volumoso, preso em coque alto com lenço amarelo-mostarda (marca registrada). Avental de lona sobre suéter colorido, brincos de argola pequenos, esmalte descascado de quem lava louça. Sorriso fácil mesmo cansada; queimadura antiga pequena no antebraço (forno). Postura aberta, braços de quem abraça. Perfil: rindo atrás do balcão, xícara na mão, luz quente de café.

**Noemi Moreaux (`noemi`, 49)** — Feminino, aparenta 52–55 (cansaço). ~1,65 m, magra rígida. Pele clara acinzentada, mãos ressecadas de dois empregos. Olhos castanhos idênticos aos de Eron, gelados de autodefesa. Rosto anguloso, lábios finos sempre pressionados; rugas verticais na testa. Cabelo grisalho-castanho preso em coque baixo severo, fios soltos nas têmporas. Uniforme de limpeza azul OU cardigã cinza abotoado até em cima; aliança que nunca tirou. Postura ereta de orgulho exausto; expressão de porta fechada. Perfil: foto 3x4 antiga, séria, fundo branco.

**Cael Domingues (`cael`, 38)** — Masculino, aparenta 38–42. ~1,75 m, magro nervoso de cafeína. Pele parda, barba de quatro dias salpicada de branco. Olhos pretos rápidos atrás de óculos de armação fina torta (consertada com fita). Rosto comprido, testa alta com entradas. Cabelo preto crespo curto desleixado. Camisa social amassada com manga dobrada, sem gravata, colete de lã puído; caneta no bolso, sempre carregando pasta plástica estufada. Dedos manchados de tinta, relógio de pulso analógico. Expressão cética permanente, sobrancelha erguida. Perfil: preto e branco, de lado, fumando no que parece uma redação vazia.

**Bruno Saldanha (`bruno`, 27)** — Masculino, aparenta 25–28. ~1,82 m, atlético de academia, ombros largos. Pele bronzeada uniforme (lago + vaidade). Olhos azul-acinzentados, sorriso ensaiado de 32 dentes. Rosto quadrado de mandíbula marcada, barba aparada na régua. Cabelo castanho-claro com corte degradê caro, topete fixado. Polo pastel ou camisa de linho, bermuda náutica, tênis branco impecável, relógio grande dourado, óculos escuros no colarinho. Postura expansiva de dono do lugar; covinha calculada. Perfil: golden hour na orla, segurando remo que nunca usou.

**Júlia Vance (`julia`, 19)** — Feminino, aparenta 17–20. ~1,58 m, miúda, ombros sempre encolhidos. Pele morena mais clara que a da irmã Sahar. Olhos castanhos enormes e assustados, olheiras de quem não dorme. Rosto em coração, lábio inferior mordido cronicamente. Cabelo preto liso comprido com franja cortina, ponta descolorida antiga crescendo. Moletom da pousada (logo bordado), unhas com adesivos descascados, três pulseirinhas de linha, celular com capinha estourada na mão SEMPRE. Expressão de sobressalto; balança a perna sentada. Perfil: selfie com filtro de coelhinho, sorriso que não chega nos olhos.

**Vesna Toma (`vesna`, 41)** — Feminino, aparenta 40–45. ~1,72 m, compleição forte e seca, postura militar. Pele clara de leste europeu, sem maquiagem. Olhos cinza-azulados de leitura lenta e fixa. Rosto largo de maçãs altas, cicatriz fina de 2 cm na sobrancelha esquerda. Cabelo loiro-acinzentado no queixo, atrás da orelha, prático. Farda da Guarda Municipal impecável OU jaqueta de couro preta sem enfeite; caderneta no bolso do peito, caneta presa. Mãos de quem aperta firme. Expressão neutra absoluta — pôquer profissional. Perfil: foto funcional de crachá, neutra.

**Rolando Saldanha (`rolando`, 58)** — Masculino, aparenta 55–60. ~1,78 m, troncudo, barriga de coquetel contida pelo alfaiate. Pele rosada de sol e uísque. Olhos castanhos pequenos e calculistas entre pálpebras pesadas. Rosto largo carnudo, papada inicial, sorriso de inauguração. Cabelo grisalho penteado para trás com brilho, têmporas brancas. Blazer azul-marinho com pin da cidade na lapela, camisa aberta no colarinho, anel de ouro no mindinho, caneta tinteiro à mostra. Aperto de mão de duas mãos; expressão de quem já te perdoou por algo que você ainda não fez. Perfil: banner de campanha, polegar erguido, orla ao fundo.

**Teodoro "Teo" Vidal (`teo`, 71)** — Masculino, aparenta 70–78. ~1,65 m encurvado, rijo de trabalho braçal, mãos enormes nodosas. Pele castigada de sol, couro escuro, manchas senis. Olhos castanhos aguados, enevoados de catarata MAS atentos como sonar. Rosto sulcado de rugas profundas, barba branca rala por fazer. Boné de pano impermeável eterno, sobras de cabelo branco. Capa de chuva amarela desbotada sobre camadas de flanela, botas de borracha, anzóis espetados no boné. Falta meio dedo anelar esquerdo (linha de pesca). Expressão de quem escuta o longe. Perfil: foto tremida tirada por terceiro, ele no barco, neblina.

**Inês Lund (`ines`, 67)** — Feminino, aparenta 65–70. ~1,55 m, franzina precisa. Pele muito clara de sala sem sol, papel-fina nas mãos. Olhos azuis desbotados, óculos de leitura na ponta do nariz com corrente de contas. Rosto pequeno enrugado de expressão doce-firme. Cabelo branco-azulado preso em coque com lápis atravessado. Cardigã de tricô (sempre um diferente, sempre com bolsos), broche de camafeu, saia midi de lã, sapato ortopédico silencioso. Cheiro imaginário de papel velho e lavanda. Postura curvada sobre fichários; expressão de quem lembra TUDO. Perfil: foto de jornal antiga, ela jovem na inauguração do arquivo.

**Dário Penha (`dario`, 45)** — Masculino, aparenta 42–48. ~1,80 m, magro anguloso. Pele parda acinzentada de redação. Olhos pretos de avaliar imagem — olha as coisas em "frames". Rosto comprido sério, óculos de armação preta grossa retangular. Careca assumida raspada, barba grisalha cerrada bem feita. Camisa preta lisa SEMPRE (uniforme autoimposto), jaqueta cinza, mochila de equipamento, lupa de conta-fios pendurada. Mãos limpas de editor, não de fotógrafo. Expressão de análise constante; fala apontando com a haste do óculos. Perfil: contraluz de janela de redação, braços cruzados.

**Pastor Edmar Reis (`edmar`, 74)** — Masculino, aparenta 72–80. ~1,70 m, corpulento amaciado pela idade, andar lento. Pele negra retinta, marcada e serena. Olhos castanhos muito escuros, úmidos, de bondade cansada. Rosto largo de traços fortes, sulcos profundos da boca ao queixo. Cabelo branco encaracolado baixo, costeletas brancas. Terno cinza surrado de corte antigo OU camisa de colarinho clerical puída; bíblia de capa mole na mão, lenço de pano no bolso. Bengala de madeira escura com punho gasto. Expressão de quem carrega confissões; sorriso triste. Perfil: foto na porta da igreja, desfocada, chapéu na mão.

**Mira Halász (`mira`, 26)** — Feminino, aparenta 25–30. ~1,70 m, magra de músculos funcionais — corpo de quem foge, não de quem malha. Pele clara pálida de pouca exposição. Olhos verde-acinzentados de vigilância permanente, leem a porta antes da pessoa. Rosto de traços finos eslavos, maçãs altas, lábios retos. Cabelo tingido de preto opaco, corte reto no queixo, raiz castanho-clara aparecendo. Jaqueta jeans escura masculina, gola alta preta, boné quando na rua, NUNCA estampas. Cicatriz fina de 4 cm no antebraço esquerdo (bicicleta, 9 anos — consta na ficha escolar). Postura de saída mapeada; expressão neutra que derrete em meio-sorriso raríssimo. Perfil: NUNCA mostra o rosto — foto de nuca contra janela de trem.

**Kel (`kel`, idade oculta ~35–45)** — Identidade visual deliberadamente nula (nunca desbloqueado no jogo — aparece como número). Para QUALQUER material interno: silhueta em capuz contra luz de monitor, rosto irrecuperável. Mãos de luva sem dedos digitando em celular barato descartável. Ambiente: quartinho com roteadores, fios, energético. Não criar rosto canônico.

**Dr. Adriano Vey (`adriano`, 73)** — Masculino, aparenta 68–75 — "o avô ideal". ~1,76 m, esbelto elegante, movimentos econômicos e precisos de cirurgião. Pele clara rosada saudável, levemente translúcida nas mãos. Olhos azuis muito claros, quase cinza — gentis em 99% das fotos; vazios no 1% que ninguém nota. Rosto fino aristocrático, rugas de sorriso bem distribuídas, queixo limpo. Cabelo branco-neve fino, penteado com perfeição para o lado, fio nenhum fora do lugar. Casaco de lã ESCURO comprido (o "casaco escuro" do relato de Sahar), cachecol cinza, colete de tweed, camisa de punho com abotoadura discreta; **maleta de médico de couro preto antiga, fecho de latão** — onipresente. Mãos imaculadas de unhas perfeitas; alfinete de gravata com símbolo discreto de esculápio. Expressão default: atenção compassiva, cabeça levemente inclinada, como quem ouve um paciente. Postura impecável aos 73. **Importante:** em TODA foto pública aparece de perfil, atrás, ou levemente desfocado — nunca de frente (vira plot no cap. 25). Perfil no jogo: foto distante na escadaria da Câmara, de lado, maleta na mão.

**Henrique Moreaux (`henrique`, falecido aos ~38)** — Apenas fotos antigas (12+ anos). Masculino, ~1,78 m, forte de trabalho, não de ginásio. Pele bronzeada de turno externo. Olhos castanhos francos (os de Eron). Bigode castanho dos anos 2000, cabelo escuro curto. Uniforme cáqui de guarda da represa, crachá "CP-NORTE", lanterna no cinto, caneca de alumínio. Sorriso largo honesto. Fotos sempre granuladas, datadas, com timestamp laranja de câmera antiga.

**Nádia Cruz (`nadia`, morta aos 19, há 15 anos)** — Apenas uma foto canônica (memorial): feminino, 19 anos, pele negra clara, sorriso enorme de aparelho recém-tirado, olhos pretos vivos. Cabelo crespo solto com presilha de borboleta. Blusa amarela, crachá de estagiária do "Projeto Orla" no peito. Foto 4x6 de papel, cantos gastos, levemente desbotada — SEMPRE apresentada como objeto físico fotografado.

**Mara Voss (`mara`, 44)** — Feminino, aparenta 40–46. ~1,75 m, postura de tribunal. Pele negra, maquiagem mínima impecável. Olhos castanho-escuros diretos, de quem não pisca primeiro. Rosto oval firme, brincos de pérola pequenos. Cabelo crespo curto natural com risca lateral definida. Blazer estruturado (vinho ou grafite), camisa de seda, broche da promotoria, pasta executiva de couro. Caneta cara usada como ponteiro. Expressão profissional com fundo de impaciência produtiva. Perfil: foto institucional, fundo azul, levíssimo sorriso protocolar.

**Família/amigos do jogador** — *Mãe* (60s, foto de perfil: flores do jardim ou ela de óculos de sol em excursão, sorriso enorme); *Pai* (60s, perfil: escudo do time ou ele de boné segurando peixe); *Davi (`davi`, 26)* — masculino, 1,75 m, riso aberto, camiseta de banda, boné pra trás, perfil: meme ou selfie em show; *Tati (`tati`, 31)* — feminino, sorriso simpático, perfil: ela com um cachorro caramelo na portaria do prédio.

---

## 3. ESPECIFICAÇÕES DE MÍDIA (para o admin produzir e linkar)

> Os textos/transcrições que o jogador lê **já estão no jogo** (campo `transcript` dos áudios e
> `body` das evidências). Abaixo, o que cada ARQUIVO precisa conter quando você for gerar/criar
> a mídia e colar o link no editor (campo `url` do anexo/evidência). Tudo deve parecer
> fotografado/gravado por celular, com grão e imperfeição.

### Fotos / imagens
- **ev_last_photo** — Píer de madeira escuro à noite, água preta lisa, NÉVOA; na outra margem, um ponto de luz fraco amarelado. Timestamp de câmera: 02:14. Granulada, subexposta.
- **ev_missing_flyer** — Cartaz "DESAPARECIDA" caseiro: foto sorridente de Lia, fonte simples, telefone destacável cortado a tesoura, fita crepe nos cantos, fotografado colado num poste com névoa.
- **ev_cafe_note** — Bilhete manuscrito feminino apressado num guardanapo/papel pautado: "se eu não aparecer amanhã, a chave está onde a gente escondia aos doze. não conta pro B." Sobre balcão de madeira, açucareiro ao lado.
- **ev_lia_notebook** — Página arrancada de caderno pautado: caligrafia feminina pequena, 3 nomes em coluna com anos, círculos e setas; embaixo, sublinhado 2x: "quem assina vê o corpo. quem vê o corpo sabe."
- **ev_screenshot_threat** — Print de chat: número oculto, balão único: "você não é sua mãe. não cometa o mesmo erro. pare de procurar enquanto dá tempo." Hora 23:47.
- **ev_map_dock** — Mapa simples da represa norte com pin; estilo app de mapas escuro.
- **ev_key_tag** — Mão feminina (Sahar) segurando chave pequena de armário com etiqueta plástica laranja "17"; papel dobrado atrás; pedras e musgo de mirante ao fundo.
- **ev_box_photo** — Interior de guarda-roupa com flash estourado: caixa de metal verde com cadeado pequeno e adesivo "CP-NORTE — MANUTENÇÃO" meio descascado; manga de casaco no canto do quadro.
- **ev_bruno_chat** — Print de conversa (8 meses atrás) conforme texto do body (LIA/BRUNO, termina em "vc vai se machucar mexendo nisso." sem resposta).
- **ev_pousada_log** — Foto de livro de registros pautado: 3 linhas de caligrafia de balcão ("Quarto 2 — D. Penha (capital)..."), anotação a lápis quase apagada na margem: "02h — luz no lago de novo. avisar S?"
- **ev_teo_map** — Mapa de pesca dobrado e rabiscado a caneta: setas, "MOTOR 02:10", "SEM LUZ", "voltou 02:40", X atrás da casa do guarda; letra trêmula: "mesmo barulho de 12 ano atrás. eu lembro. eu tava lá."
- **ev_archive_clips** — Três recortes de jornal amarelados lado a lado sobre mesa de madeira, datados (15/12/11 anos), manchetes conforme body.
- **ev_contact_sheet** — Grade de 36 miniaturas P&B (ensaio do lago); frames 29–33 circulados a pincel vermelho; frame 31 contém silhueta de barco pequeno.
- **ev_dario_raw** — Ampliação granulada do frame 33: lanterna de mão acesa + meio corpo de silhueta adulta na linha d'água; canto: "02:14:07".
- **ev_grave_photo** — Lápide simples "MIRA HALÁSZ" com flores brancas FRESCAS de floricultura, névoa; no vaso, cartão branco com um anzol desenhado a caneta.
- **ev_mira_proof** — Mão feminina segurando a Gazeta do dia; antebraço com cicatriz fina visível; rosto fora do quadro; luz de janela.
- **ev_vey_archive** — Foto escura por fresta de porta: gaveteiro de aço antigo, etiquetas datilografadas ("SALDANHA, R.", "GAZETA", "PARÓQUIA", "GM — efetivos", "MOREAUX") e uma etiqueta nova à mão: "VISITANTE".
- **ev_lia_alive_photo** — Amanhecer dourado sobre o lago, tirado DE DENTRO de casa abandonada (janela com vidro sujo); câmera analógica e xícara no parapeito; escrito no vapor do vidro: "TERMINA."
- **ev_signature_compare / ev_margens_dossier / ev_kel_ledger / ev_orla_contract / ev_vesna_memo / ev_laudo_* / ev_obituary_mira / ev_henrique_letters / ev_mara_filing / ev_mira_letter** — Documentos: gerar como PDF/print de documento datilografado ou planilha, seguindo exatamente o texto do `body` de cada evidência no editor (aba Evidências). Assinatura "A. Vey" deve ser IDÊNTICA nos 4 documentos em que aparece.

### Áudios (todas as transcrições completas já estão no jogo)
- **ev_voice_lia1** — 40s, voz feminina baixa e firme, quarto silencioso, madrugada.
- **ev_dock_audio + audio_teo_1..5** — voz masculina rouca de idoso, CAPS emocional, vento/água de fundo; o arquivo do motor precisa de um motor 4 tempos grave passando ao longe (esq→dir) e voltando.
- **ev_edmar_tape** — 58s, voz grave mansa de idoso, eco de templo vazio.
- **ev_henrique_tape** — 72s, gravador antigo com chiado, voz masculina cansada, vento de represa; "riso seco" no final.
- **ev_lia_audio2** — 47s, voz feminina decidida sussurrada, água batendo em casco, motor distante no final.
- **ev_threat_rec** — 22s, voz processada (pitch -3, leve robotização), calma absoluta, água ao fundo.
- **Ligações (call nodes)** — não precisam de arquivo: transcrições renderizam na tela de chamada.

### Vídeos
- **ev_pousada_cam** — 41s, P&B, câmera de segurança com timestamp 01:52; recepção vazia; aos 0:19 carro escuro passa SEM faróis pela janela; aos 0:37 jovem (Júlia) entra, olha, fecha cortina. Compressão forte, placa ilegível.
- **travessia_proa.mp4 (cap. 22)** — 94s, GoPro na proa de canoa à noite, neblina, remadas silenciosas; ao final, casa com luz fraca e ROUPA NO VARAL visível na margem proibida.

### Avatares e contas
- Contas bancárias ativas no jogo: **Kel 71203-9** (paywall do cap. 10), Eron 10982-4, Sahar 33410-7.
- O nó bancário do cap. 23 CREDITA R$ 500 ("Bolsa de pesquisa — Gab. técnico") — é proposital: o suborno entra sem consentimento.

---

## 4. Conversas casuais & romance (régua de tom)

- **Cota cumprida em jogo:** mãe/pai/Davi/Tati têm conversas 100% cotidianas (prólogo já abre com 4 históricos semeados); Eron tem beats de escola, Sahar de café/insônia, Davi de memes/churrasco — ~35% das mensagens não são investigação.
- **Romance opcional (Sahar):** semeado no cap. 2 (`kind_to_sahar`) → cap. 6 (escolha "pra mim também virou isso", só aparece com a flag) → flag `sahar_heart` colore reações dela até o final ("o café (e a dona) tem uma dívida enorme com você"). Nunca obrigatório, nunca substitui o caso.
- **Mira:** intimidade NÃO romântica — confiança de sobreviventes; régua: ela nunca usa emoji, nunca manda áudio.

## 5. Checklist de produção do admin
1. Gerar avatares (seção 2) → colar URLs na aba Personagens do editor.
2. Produzir mídias (seção 3) → colar URLs nos anexos/evidências correspondentes.
3. `npm run validate-story` após cada exportação do editor.
4. Os nós de teste do cap. 1 (`del_*`/`not_*`) são seus — remova quando quiser pelo editor.
