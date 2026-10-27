# Pareceres socioambientais — biblioteca ranqueada a partir do histórico

Base: **2.620 pareceres** fechados de jul/2025 a out/2026 (`pareceres socio ambientais.csv`), cruzados com a biblioteca atual da ferramenta (`modelos.js`, versão 2026-10-26). Os dados de cliente foram trocados por campos (`{{nome}}`, `{{car}}`, `{{municipio}}`…), no mesmo padrão do `modelos.js`.

O arquivo tem duas funções: **ler** (o que existe, o que mais se usa, como se organiza) e **implementar** (cada item tem id, metadados e texto num formato fixo; o arquivo `biblioteca-historico.js` traz os mesmos dados prontos para carregar na ferramenta).

## Sumário
1. [Como implementar na ferramenta](#1-como-implementar-na-ferramenta)
2. [Panorama do histórico (categorias e subcategorias)](#2-panorama-do-histórico)
3. [Ranking geral – o que mais se usa](#3-ranking-geral)
4. [Modelos completos](#4-modelos-completos)
5. [Trechos por bloco e tema](#5-trechos-por-bloco-e-tema)
6. [Caminhos – como os pareceres começam por tema](#6-caminhos)
7. [Busca – sinônimos](#7-busca--sinônimos)
8. [Código para o script.js (busca ranqueada e sugestão do próximo trecho)](#8-código-para-o-scriptjs)
9. [Campos novos](#9-campos-novos)

## 1. Como implementar na ferramenta

**O que este arquivo acrescenta à biblioteca atual** (18 modelos e 75 trechos vindos do Word):

- **24 modelos novos**, para situações que aparecem no histórico e não têm modelo (PRODES 2020, Não há restrições, CAR suspenso com bloqueio mantido, CSA Cerrado, Moratória, Sem CAR/NÃO SE APLICA, Alçadas…).
- **332 trechos novos** (ids `h001`…), que se repetiram em 3 ou mais pareceres. Redações quase iguais foram juntadas num trecho só, com as outras como *variações*.
- **Uso de cada modelo e trecho** (`usos` = em quantos pareceres do histórico ele aparece), inclusive dos que já existem — é o que ordena as sugestões.
- **Palavras-chave e sinônimos** para a busca (ex.: “pvg” acha Protocolo Verde; “suspenso” acha cancelado e Resolução BCB).
- **Caminhos** (`seguintes`): depois de cada trecho, quais costumam vir em seguida, com a frequência. Trechos marcados `universal` cabem em qualquer tipo de parecer.
- **Uma categoria nova**, *E. Encerramento*, e um status `encerrado` (≈16% do histórico são chamados encerrados sem análise).

**Passo a passo**

1. Copie `biblioteca-historico.js` para a pasta da ferramenta e carregue-o no `index.html` **depois** de `modelos.js` e **antes** de `script.js`:
   ```html
   <script src="modelos.js"></script>
   <script src="biblioteca-historico.js"></script>
   <script src="script.js"></script>
   ```
   Ele acrescenta (sem apagar nada) a categoria E, o status `encerrado`, os campos novos, os textos `TX.h…`, os `TRECHOS` e `MODELOS` novos, e define `META`, `SINONIMOS` e `INICIOS`.
2. No `script.js`, aplique as funções da [seção 8](#8-código-para-o-scriptjs): busca ranqueada (relevância × uso), ordenação dos cartões e do painel por uso, e sugestão do próximo trecho.
3. Revise os modelos novos (seção 4.2): o texto de cada um é o **parecer real mais típico** daquela situação, já com campos. Ajuste a redação que quiser padronizar — o id não muda.

**Formato de cada item neste arquivo** (para quem for converter ou conferir):

| Campo | Significado |
|---|---|
| `id` | Igual ao `id` em `TRECHOS`/`MODELOS`. Trechos novos usam `h001`…; o texto fica em `TX.h001`. |
| `bloco` | Bloco da estrutura padrão (1 e 2 identificação/área, 3 fundamentação, 4 capacidade, 5 operação, 6 conclusão, 7 orientação/encerramento). |
| `tema` | Protocolo do chamado onde o item mais aparece (≥ 50% dos usos); senão “Geral”. |
| `usos` | Nº de pareceres do histórico em que aparece (redações equivalentes contam juntas). |
| `palavrasChave` | Termos para a busca, além do título e do texto. |
| `seguintes` | Próximos trechos mais frequentes e a % de vezes em que vieram logo depois. |
| `universal` | Aparece em 3+ grupos de tema sem predominância de nenhum: sugerir em qualquer parecer. |

## 2. Panorama do histórico

**Categoria** = desfecho do parecer (mesmas categorias da ferramenta + E). **Subcategoria** = tema/protocolo do chamado. Contagens em nº de pareceres.

| Grupo de tema | Tema (subcategoria) | A. Aprovado | B. Excepcional | C. Mantido | D. Procedimento | E. Encerrado | Total | % |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Embargo ambiental | Embargo Ibama | 377 | 30 | 71 | 15 | 33 | **526** | 20,1% |
|  | Embargo Sema-MT | 327 | 11 | 29 | 5 | 14 | **386** | 14,7% |
|  | Embargo Semad-GO | 54 | 18 | 45 |  | 8 | **125** | 4,8% |
|  | Embargo ICMBio | 10 | 1 | 2 | 1 | 1 | **15** | 0,6% |
|  | Embargo Ibama/ICMBio |  | 2 |  | 2 |  | **4** | 0,2% |
|  | Embargo IAT-PR | 2 |  |  |  | 1 | **3** | 0,1% |
|  | Embargo LDI-PA | 1 | 1 |  |  |  | **2** | 0,1% |
| Desmatamento e protocolos de grãos | Protocolo Verde dos Grãos (PVG-PA) | 94 | 11 | 32 | 17 | 7 | **161** | 6,1% |
|  | PRODES 2020 | 157 | 1 | 1 |  | 1 | **160** | 6,1% |
|  | Moratória da Soja | 21 | 12 | 18 | 1 | 9 | **61** | 2,3% |
|  | CSA Cerrado | 25 |  |  |  |  | **25** | 1,0% |
|  | PRODES 2025 | 3 | 2 | 8 |  | 1 | **14** | 0,5% |
|  | LUC – Land Use Change | 4 |  |  |  |  | **4** | 0,2% |
| Sem restrição / bloqueio indevido | Não há restrições | 57 |  | 1 | 1 | 268 | **327** | 12,5% |
|  | Bloqueio manual sem motivo | 39 |  | 1 |  |  | **40** | 1,5% |
| Prospecção de clientes | Prospecção de clientes | 192 | 2 | 91 |  | 9 | **294** | 11,2% |
| Regularidade do CAR | CAR Suspenso/Cancelado | 41 | 20 | 71 | 1 | 15 | **148** | 5,6% |
|  | Sem CAR | 5 |  | 1 | 31 | 34 | **71** | 2,7% |
|  | Alçada Y – sem CAR | 4 |  | 3 |  | 2 | **9** | 0,3% |
|  | Contrato sem CAR | 1 |  | 3 |  | 1 | **5** | 0,2% |
|  | Cadastro de CAR (CORP_F0285) |  |  |  | 2 | 1 | **3** | 0,1% |
| Área de cultivo de grãos | Cultivo inferior a 10% | 48 | 3 | 24 | 1 | 3 | **79** | 3,0% |
| Cadastro e enquadramento | Enquadramento direto/indireto |  |  | 2 | 63 | 9 | **74** | 2,8% |
|  | Alçada Y | 18 |  | 5 |  | 4 | **27** | 1,0% |
| Área de cultivo de grãos | Inexistência de área de cultivo | 10 | 1 | 8 |  | 3 | **22** | 0,8% |
| Áreas protegidas e trabalho escravo | Unidade de Conservação | 17 |  | 5 |  | 1 | **23** | 0,9% |
|  | Terra Indígena/Quilombola | 8 |  |  |  | 1 | **9** | 0,3% |
|  | Trabalho escravo (Lista Suja) | 1 | 2 |  |  |  | **3** | 0,1% |
| **Total** | | **1516** | **117** | **421** | **140** | **426** | **2620** | 100% |

**Desfechos registrados (coluna CONCLUSÃO)**

| Categoria | Desfecho | Pareceres |
|---|---|---:|
| A. Aprovado | Desbloqueado – CAR Bloqueado | 670 |
| A. Aprovado | Desbloqueado – Bloqueado via Lista/manual | 253 |
| A. Aprovado | Desbloqueado – Bloqueado via Lista e CAR Bloqueado | 171 |
| A. Aprovado | Desbloqueado – Bloqueado via Lista | 170 |
| A. Aprovado | Recomendamos a negociação | 112 |
| A. Aprovado | Apenas análise - recomendamos a negociação | 83 |
| A. Aprovado | Direcionado à Alçada G - Em conformidade | 33 |
| A. Aprovado | Desbloqueado | 23 |
| A. Aprovado | Desbloqueado – Bloquear novamente | 1 |
| B. Excepcional | Bloqueado - Após desbloqueio excepcional | 117 |
| C. Mantido | Bloqueio mantido | 309 |
| C. Mantido | Não recomendamos a negociação | 58 |
| C. Mantido | Apenas análise - não recomendamos a negociação | 38 |
| C. Mantido | Direcionado à Alçada L - Não conforme | 14 |
| C. Mantido | Enquadramento Mantido - Não Cumpre os requisitos | 2 |
| D. Procedimento | Direcionado ao MDM | 91 |
| D. Procedimento | Desbloqueado – Selo Biocombustível Social | 16 |
| D. Procedimento | Desbloqueado – Cliente Indireto | 12 |
| D. Procedimento | Desbloqueado – Algodão - Washout e/ou contratações de volumes | 8 |
| D. Procedimento | Cadastro do CAR/SIGEF realizado no sistema | 4 |
| D. Procedimento | Desbloqueado – Brain/CORP_F0285 | 3 |
| D. Procedimento | Desbloqueado – Cliente/Consumidor de soluções | 3 |
| D. Procedimento | Desbloqueado – CORP_F0450 | 2 |
| D. Procedimento | Desbloqueado – Brain/CORP_F0285 - CORP_F0450 | 1 |
| E. Encerrado | Encerrado | 239 |
| E. Encerrado | Encerrado - Não houve ação | 169 |
| E. Encerrado | Encerrado - Falta de Informações | 13 |
| E. Encerrado | Encerrado - Aberto pelo caminho incorreto | 5 |

## 3. Ranking geral

### 3.1 Modelos (situações) mais frequentes

| # | id | Modelo | Categoria | Usos | % do histórico |
|---:|---|---|---|---:|---:|
| 1 | `a-02` | Caso 2 – Análise de prospecção de clientes – Cliente com restrição no CPF/CNPJ e área de originação em conformidade | A. Aprovado | 463 | 17,7% |
| 2 | `e-sem-restricao` 🆕 | Não há restrições – Bloqueio por status desatualizado – Chamado encerrado | E. Encerramento | 268 | 10,2% |
| 3 | `a-04` | Caso 4 – Operação em andamento (contrato fixo/balcão, hedge ou pedido de insumos) – Cliente com restrição no CPF/CNPJ e área de originação em conformidade | A. Aprovado | 204 | 7,8% |
| 4 | `a-prodes2020` 🆕 | PRODES 2020 – Desmatamento após 2020 – Protocolo desconsiderado por orientação de SP | A. Aprovado | 157 | 6,0% |
| 5 | `c-embargo` 🆕 | Embargo (IBAMA, SEMA-MT, SEMAD-GO, ICMBio) – Bloqueio mantido | C. Bloqueio mantido | 137 | 5,2% |
| 6 | `e-geral` 🆕 | Chamado encerrado – Caso já analisado, falta de informações ou sem retorno | E. Encerramento | 121 | 4,6% |
| 7 | `b-09` | Caso 9 – Restrição ambiental (embargo federal/estadual, PVG, ausência de área de cultivo ou PRODES 2025) – Operação já formalizada | B. Desbloqueio excepcional | 113 | 4,3% |
| 8 | `c-prospeccao` 🆕 | Análise de prospecção – Não recomendamos a negociação | C. Bloqueio mantido | 91 | 3,5% |
| 9 | `a-prospeccao-serasa` 🆕 | Análise de prospecção – Áreas da plataforma Serasa e área indicada – Recomendamos a negociação | A. Aprovado | 89 | 3,4% |
| 10 | `a-pvg` 🆕 | Protocolo Verde dos Grãos (PVG) – Área analisada sem restrição – Desbloqueio | A. Aprovado | 77 | 2,9% |
| 11 | `a-embargo-outros` 🆕 | Embargo / lista – Área solicitada sem passivos – Desbloqueio | A. Aprovado | 76 | 2,9% |
| 12 | `c-car-suspenso` 🆕 | CAR com status “suspenso” ou “cancelado” – Bloqueio mantido | C. Bloqueio mantido | 70 | 2,7% |
| 13 | `a-cultivo` 🆕 | Cultivo inferior a 10% – Cultivo comprovado nas imagens – Desbloqueio | A. Aprovado | 58 | 2,2% |
| 14 | `a-sem-restricao` 🆕 | Não há restrições – Cliente e área sem passivos – Desbloqueio | A. Aprovado | 57 | 2,2% |
| 15 | `d-reenquadramento` | Reenquadramento de cliente DIRETO para INDIRETO | D. Procedimentos operacionais e cadastrais | 54 | 2,1% |
| 16 | `a-07` | Caso 7 – Embargos de terceiros em área de assentamento | A. Aprovado | 42 | 1,6% |
| 17 | `a-sem-motivo` 🆕 | Bloqueio manual sem motivo expresso – Desbloqueio | A. Aprovado | 39 | 1,5% |
| 18 | `a-car-regularizado` 🆕 | CAR “suspenso” ou “cancelado” regularizado (status “ativo”) – Desbloqueio | A. Aprovado | 38 | 1,5% |
| 19 | `e-sem-car` 🆕 | Sem CAR ou CAR incorreto – Chamado encerrado | E. Encerramento | 37 | 1,4% |
| 20 | `a-05` | Caso 5 – Operação em andamento (contrato fixo/balcão, hedge ou pedido de insumos) – Cliente sem restrição no CPF/CNPJ e área de originação com embargo federal/estadual (IBAMA, ICMBio, SEMA-MT, SEMAD-GO e LDI-PA) | A. Aprovado | 35 | 1,3% |
| 21 | `d-nao-se-aplica` 🆕 | Sem CAR – Enquadramento temporário “NÃO SE APLICA” (Selo Biocombustível / dendê) | D. Procedimentos operacionais e cadastrais | 34 | 1,3% |
| 22 | `c-12` | Caso 12 – Protocolo Verde dos Grãos do Pará (PVG) – Restrição na área de originação | C. Bloqueio mantido | 32 | 1,2% |
| 23 | `c-11` | Caso 11 – Ausência de área de cultivo – Novas negociações | C. Bloqueio mantido | 32 | 1,2% |
| 24 | `a-csa` 🆕 | CSA Cerrado (ou LUC) – Protocolo ainda não vigente – Desbloqueio | A. Aprovado | 29 | 1,1% |
| 25 | `a-alcada-g` 🆕 | Alçada Y – Contrato em conformidade direcionado à alçada G | A. Aprovado | 27 | 1,0% |
| 26 | `a-triangulacao` 🆕 | Risco de triangulação com embargo de terceiro afastado – Desbloqueio | A. Aprovado | 27 | 1,0% |
| 27 | `a-moratoria` 🆕 | Moratória da Soja – Área solicitada fora da restrição – Desbloqueio | A. Aprovado | 19 | 0,7% |
| 28 | `c-moratoria` 🆕 | Moratória da Soja – Risco de triangulação – Bloqueio mantido | C. Bloqueio mantido | 18 | 0,7% |
| 29 | `a-03` | Caso 3 – Análise de prospecção de clientes – Cliente sem restrição no CPF/CNPJ e área de originação com embargo federal/estadual (IBAMA, ICMBio, SEMA-MT, SEMAD-GO e LDI-PA) | A. Aprovado | 18 | 0,7% |
| 30 | `b-10` | Caso 10 – CAR com status “suspenso” ou “cancelado” – Operação já formalizada | B. Desbloqueio excepcional | 17 | 0,6% |
| 31 | `a-uc` 🆕 | Unidade de Conservação – Sobreposição fora da área de cultivo – Desbloqueio | A. Aprovado | 17 | 0,6% |
| 32 | `a-08` | Caso 8 – Protocolo Verde dos Grãos do Pará (PVG) – Desmatamento superior a 25 hectares – LAR válido apresentado | A. Aprovado | 16 | 0,6% |
| 33 | `d-selo` 🆕 | Selo Biocombustível Social (compra de dendê) – Desbloqueio | D. Procedimentos operacionais e cadastrais | 16 | 0,6% |
| 34 | `d-cliente-indireto` 🆕 | Cliente INDIRETO ou consumidor de soluções – Desbloqueio | D. Procedimentos operacionais e cadastrais | 15 | 0,6% |
| 35 | `c-alcada-l` 🆕 | Alçada Y – Contrato sem CAR vinculado devolvido à alçada L | C. Bloqueio mantido | 14 | 0,5% |
| 36 | `c-nova-area` | Embargo federal/estadual em nova área indicada – Diversa da área vinculada na operação – Não isolado da área de cultivo | C. Bloqueio mantido | 9 | 0,3% |
| 37 | `a-06` | Caso 6 – Sobreposição com Terra Indígena com status “declarada” | A. Aprovado | 8 | 0,3% |
| 38 | `d-washout` | Operações envolvendo contratação de volume ou washout de algodão – Desbloqueio sem análise socioambiental | D. Procedimentos operacionais e cadastrais | 8 | 0,3% |
| 39 | `c-14` | Caso 14 – PRODES 2025 – Desmatamento sobreposto à camada de Soja | C. Bloqueio mantido | 8 | 0,3% |
| 40 | `a-01` | Caso 1 – Análise de prospecção de clientes – Cliente e área sem bloqueios | A. Aprovado | 2 | 0,1% |

Sem correspondência no histórico (situações raras ou redação nova do Word): `c-13`, `base`.

🆕 = modelo novo (seção 4.2). A contagem de cada parecer vai para **um** modelo só (o mais específico).

### 3.2 Trechos mais usados (top 40)

| # | id | Trecho | Bloco | Usos | Universal |
|---:|---|---|---|---:|:---:|
| 1 | `cap-uf` | Capacidade produtiva – Estado de [UF] | 4 | 338 | ✓ |
| 2 | `h001` | Encerramento – chamado encerrado | 7 | 195 |  |
| 3 | `h002` | PRODES 2020 – orientação de SP: desconsiderar o protocolo (tema em discussão) | 3 | 170 |  |
| 4 | `h003` | PRODES 2020 – cliente sem restrição; área bloqueada por desmatamento PRODES/INPE após 2020 | 1 e 2 | 154 |  |
| 5 | `op-hedge` | Hedge para nova compra | 5 | 153 | ✓ |
| 6 | `h004` | Encerramento – nenhuma ação para a Sustentabilidade | 7 | 149 |  |
| 7 | `h005` | PRODES 2020 – conclusão: passivo desconsiderado e CAR desbloqueado | 6 | 136 |  |
| 8 | `h006` | Conclusão curta – em conformidade | 6 | 124 |  |
| 9 | `h007` | Status desatualizado – resolvido com “Buscar Status Propriedade” | 3 | 119 |  |
| 10 | `con-fav-op` | Favorável – operação em andamento | 6 | 111 | ✓ |
| 11 | `h008` | Prospecção – abertura (CPF do produtor, áreas Serasa e área indicada) | 1 e 2 | 107 |  |
| 12 | `id-limpo` | Cliente e área sem restrições | 1 e 2 | 104 | ✓ |
| 13 | `h009` | Conclusão curta – desbloqueio realizado | 6 | 83 | ✓ |
| 14 | `h010` | Clifor e CAR sem bloqueios na Serasa e no ADMBR | 3 | 62 |  |
| 15 | `h011` | Operação – contrato fixo já firmado (continuidade da operação) | 5 | 62 | ✓ |
| 16 | `id-emb-cpf` | Embargo vinculado ao CPF/CNPJ (clifor bloqueado) | 1 e 2 | 61 |  |
| 17 | `h012` | Ficha da área (CAR, status, localização, proprietário, volume máximo) | 1 e 2 | 57 | ✓ |
| 18 | `tf-reenq` | Reenquadramento de cliente DIRETO para INDIRETO | 1 e 2 | 52 |  |
| 19 | `h013` | Conclusão – produtor e área em conformidade para negociações (até a presente data) | 6 | 52 |  |
| 20 | `h014` | CAR – política: só status “Ativo” ou “Pendente” podem ser vinculados | 3 | 48 |  |
| 21 | `h015` | CAR Suspenso – contraria a política interna e a Resolução BCB nº 140/2021 | 3 | 44 |  |
| 22 | `h016` | Conclusão curta – bloqueio mantido | 6 | 44 | ✓ |
| 23 | `h017` | Embargo Ibama no CPF/CNPJ – polígono isolado do plantio | 1 e 2 | 40 |  |
| 24 | `cap-pa` | Capacidade produtiva – Pará (Adicionalmente) | 4 | 37 | ✓ |
| 25 | `h018` | Área adicional (outro CAR) sem passivos ou bloqueios | 1 e 2 | 36 |  |
| 26 | `pvg-reg` | PVG – documentos para regularização (LAR/PRAD) | 3 | 35 |  |
| 27 | `h019` | Orientação – verificar com o cliente se existe CAR válido | 7 | 34 |  |
| 28 | `emb-iso` | Embargo isolado da área de cultivo | 3 | 31 |  |
| 29 | `h020` | Enquadramento alterado de DIRETO para NÃO SE APLICA | 6 | 31 |  |
| 30 | `h021` | Operação – aquisição de dendê para o Selo Biocombustível Social | 5 | 30 |  |
| 31 | `h022` | Orientação de SP – enquadramento temporário como NÃO SE APLICA | 3 | 30 |  |
| 32 | `tf-nova-area` | Embargo em nova área indicada – não isolado do cultivo (com conclusão) | 3 | 28 |  |
| 33 | `h023` | Bloqueio manual no ADMBR sem justificativa registrada | 1 e 2 | 25 |  |
| 34 | `h024` | Conclusão – produtor em conformidade, clifor desbloqueado | 6 | 25 |  |
| 35 | `con-fav` | Favorável – prospecção | 6 | 22 |  |
| 36 | `h025` | Sem restrições no CPF/CNPJ e nas áreas – nada justifica manter o bloqueio | 3 | 22 |  |
| 37 | `h026` | Orientação – acompanhar a capacidade produtiva (rastreabilidade dos volumes) | 7 | 22 |  |
| 38 | `h027` | Conclusão – cliente e área em conformidade, CAR desbloqueado | 6 | 22 |  |
| 39 | `h028` | CSA Cerrado – sobreposição com protocolo ainda não vigente na política | 1 e 2 | 21 |  |
| 40 | `h029` | Imagens de satélite – polígono(s) embargado(s) isolado(s) | 3 | 21 |  |

## 4. Modelos completos

### 4.1 Modelos que já existem na ferramenta – uso no histórico

| id | Modelo | Usos | Palavras-chave sugeridas |
|---|---|---:|---|
| `a-01` | Caso 1 – Análise de prospecção de clientes – Cliente e área sem bloqueios | 2 | status do car, cultivo de grãos, capacidade produtiva, contrato, volume |
| `a-02` | Caso 2 – Análise de prospecção de clientes – Cliente com restrição no CPF/CNPJ e área de originação em conformidade | 463 | embargo ibama, ibama, embargo, isolado, cultivo de grãos, adicional, apresenta, clifor |
| `a-03` | Caso 3 – Análise de prospecção de clientes – Cliente sem restrição no CPF/CNPJ e área de originação com embargo federal/estadual (IBAMA, ICMBio, SEMA-MT, SEMAD-GO e LDI-PA) | 18 | desbloqueio realizado, curta, conclusão |
| `a-04` | Caso 4 – Operação em andamento (contrato fixo/balcão, hedge ou pedido de insumos) – Cliente com restrição no CPF/CNPJ e área de originação em conformidade | 204 | embargo, em conformidade, capacidade produtiva, volume, admbr, clifor, cadastro, isolado |
| `a-05` | Caso 5 – Operação em andamento (contrato fixo/balcão, hedge ou pedido de insumos) – Cliente sem restrição no CPF/CNPJ e área de originação com embargo federal/estadual (IBAMA, ICMBio, SEMA-MT, SEMAD-GO e LDI-PA) | 35 | embargo sema-mt, embargo, diversas, municípios, vários, sustentabilidade sp, em conformidade, reunião |
| `a-06` | Caso 6 – Sobreposição com Terra Indígena com status “declarada” | 8 | terra indígena, terra indígena/quilombola, desbloqueada, homologadas, compras, monitorar, demarcação, processo |
| `a-07` | Caso 7 – Embargos de terceiros em área de assentamento | 42 | embargo ibama, ibama, sema-mt, embargo, triangulação, assentamento, em conformidade, próprias |
| `a-08` | Caso 8 – Protocolo Verde dos Grãos do Pará (PVG) – Desmatamento superior a 25 hectares – LAR válido apresentado | 16 | pvg, embargo, protocolo verde dos grãos (pvg-pa), aoprotocolo, junto, capacidade produtiva, estado, sacas |
| `b-09` | Caso 9 – Restrição ambiental (embargo federal/estadual, PVG, ausência de área de cultivo ou PRODES 2025) – Operação já formalizada | 113 | pvg, protocolo verde dos grãos (pvg-pa), embargo, limite, desmatamento, lar, prad, documentos |
| `b-10` | Caso 10 – CAR com status “suspenso” ou “cancelado” – Operação já formalizada | 17 | car suspenso/cancelado, contrato, status do car, clifor, família/terceiros, consta, cadastro, resolução bcb 140 |
| `c-11` | Caso 11 – Ausência de área de cultivo – Novas negociações | 32 | cultivo inferior a 10%, cultivo de grãos, volume, imagens de satélite, 10% de cultivo, comprovação, ausência, poderia |
| `c-12` | Caso 12 – Protocolo Verde dos Grãos do Pará (PVG) – Restrição na área de originação | 32 | pvg, lar, prad, documentos, protocolo verde dos grãos (pvg-pa), bloqueio mantido, curta, conclusão |
| `c-13` | Caso 13 – Protocolo Verde dos Grãos do Pará (PVG) – Licenciamento ambiental rural (LAR) vencido | 0 |  |
| `c-14` | Caso 14 – PRODES 2025 – Desmatamento sobreposto à camada de Soja | 8 | prodes 2025, prodes, diretoria, diretriz, registros, público, compromisso, critério |
| `c-nova-area` | Embargo federal/estadual em nova área indicada – Diversa da área vinculada na operação – Não isolado da área de cultivo | 9 | em conformidade, relatório, anexo, apresenta, moratória da soja, embargo, embargadas, riscos |
| `d-washout` | Operações envolvendo contratação de volume ou washout de algodão – Desbloqueio sem análise socioambiental | 8 | embargo sema-mt, washout/algodão, informada, desbloqueio realizado, embargo, admbr, clifor, cadastro |
| `d-reenquadramento` | Reenquadramento de cliente DIRETO para INDIRETO | 54 | enquadramento direto/indireto, revendedora, comércio, atacadista, mdm, cliente indireto, em conformidade, indiretos |
| `base` | 4. modelo-base para casos não previstos | 0 |  |

### 4.2 Modelos novos (derivados do histórico)

Cada modelo traz o texto do **parecer real mais típico** da situação, com os dados trocados por campos. Ao lado de cada parágrafo, o trecho equivalente da biblioteca (quando existe) — útil para trocar por `TX.<id>` se quiser padronizar.

#### `e-sem-restricao` · Não há restrições – Bloqueio por status desatualizado – Chamado encerrado

- **categoria:** encerramento (E. Encerramento (sem análise ou sem ação)) · **status:** encerrado (CHAMADO ENCERRADO) · **subcategoria:** Sem restrição
- **usos:** 268 (10,2% do histórico) · **tema principal:** Não há restrições
- **quando usar:** o chamado chegou, mas não há passivo nem bloqueio ativo (ex.: status desatualizado resolvido com “Buscar Status Propriedade”); não há ação da Sustentabilidade.
- **desfechos no histórico:** Encerrado (142); Encerrado - Não houve ação (124); Encerrado - Falta de Informações (2)
- **palavrasChave:** não há restrições, encerramento, status do car, buscar status propriedade, resolvido, nenhuma, ação, pendente, chamado encerrado
- **estrutura típica:** `h007` (41%) → `h010` (23%) → *texto livre* (44%) → `h004` (52%) → `h001` (58%)

1. `≈ h007`

> A empresa e o CAR {{car}} não apresentam bloqueios na plataforma Serasa nem no sistema ADMBR. O impedimento identificado estava relacionado à ausência de atualização do status da propriedade, o que foi resolvido por meio da funcionalidade "Buscar Status Propriedade".

2. `≈ h004`

> Dessa forma, não há nenhuma ação pendente para o time de Sustentabilidade.

3. `≈ h001`

> Chamado encerrado.

#### `a-prodes2020` · PRODES 2020 – Desmatamento após 2020 – Protocolo desconsiderado por orientação de SP

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Desmatamento e protocolos
- **usos:** 157 (6,0% do histórico) · **tema principal:** PRODES 2020
- **quando usar:** área bloqueada por desmatamento PRODES/INPE posterior a 2020, enquanto a liderança não decide sobre o protocolo (orientação do time de SP para desconsiderar).
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (149); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (5); Desbloqueado – Bloqueado via Lista/manual (2)
- **palavrasChave:** prodes, prodes 2020, prodes/inpe, desmatamento, ocorrido, sustentabilidade sp, e-mail anexo, tema, desconsiderado, passivo
- **estrutura típica:** `h003` (85%) → `h002` (89%) → `h005` (82%)

1. `≈ h003`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada devido à identificação de desmatamento pela base PRODES/INPE, ocorrido após 2020.

2. `≈ h002`

> Esse tema, no entanto, ainda está em discussão pela liderança. O time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que o protocolo seja desconsiderado até que haja uma decisão formal da alta gestão (em anexo orientação).

3. `≈ h005`

> Dessa forma, o passivo foi desconsiderado e o CAR desbloqueado.

#### `c-embargo` · Embargo (IBAMA, SEMA-MT, SEMAD-GO, ICMBio) – Bloqueio mantido

- **categoria:** mantido (C. Bloqueio mantido) · **status:** mantido (BLOQUEIO MANTIDO) · **subcategoria:** Embargo ambiental
- **usos:** 137 (5,2% do histórico) · **tema principal:** Geral
- **quando usar:** embargo não isolado da área de cultivo, área de originação a menos de 150 km do embargo ou documento que não regulariza o passivo.
- **desfechos no histórico:** Bloqueio mantido (137)
- **palavrasChave:** embargo, 150 km, recomendamos, risco, negociações, documentos, desembargo, disposição, nova
- **estrutura típica:** *texto livre* (100%)

1.

> {{Sujeito}} {{nome}} possui embargo Semad-GO, vinculado ao seu {{doc}}, em área localizada no município de {{municipioEmbargo}}, conforme registro no CAR {{carEmbargo}}. Os polígonos embargados não estão isolados das áreas de cultivo de grãos.

2.

> A área atualmente indicada para análise também está situada em {{municipioEmbargo}}, registrada no CAR {{car}}. Embora não apresente passivos ambientais, está situada ao lado da área com embargo, o que configura risco potencial de triangulação de produto.

3. `≈ h243`

> Diante desse cenário, não recomendamos negociações com este produtor, tanto na área embargada quanto em outras áreas localizadas dentro de um raio de 150 km do passivo ambiental identificado. Por esse motivo, o bloqueio será mantido.

4. `≈ h119`

> Foi informado que, caso haja decisão administrativa ou judicial que determine o desembargo da área, coloco-me à disposição para realizar nova análise.

#### `e-geral` · Chamado encerrado – Caso já analisado, falta de informações ou sem retorno

- **categoria:** encerramento (E. Encerramento (sem análise ou sem ação)) · **status:** encerrado (CHAMADO ENCERRADO) · **subcategoria:** Encerramento
- **usos:** 121 (4,6% do histórico) · **tema principal:** Geral
- **quando usar:** chamado repetido, aberto pelo caminho incorreto, sem as informações necessárias ou sem retorno da solicitante.
- **desfechos no histórico:** Encerrado (66); Encerrado - Não houve ação (39); Encerrado - Falta de Informações (11)
- **palavrasChave:** encerramento, caso, chamado encerrado, não há restrições
- **estrutura típica:** *texto livre* (74%)

1. `≈ h039`

> Caso já analisado no chamado {{chamado}}.

2. `≈ h001`

> Chamado encerrado.

#### `c-prospeccao` · Análise de prospecção – Não recomendamos a negociação

- **categoria:** mantido (C. Bloqueio mantido) · **status:** mantido (BLOQUEIO MANTIDO) · **subcategoria:** Prospecção de clientes
- **usos:** 91 (3,5% do histórico) · **tema principal:** Prospecção de clientes
- **quando usar:** prospecção em que o cliente ou a área tem restrição não isolada, consta na Moratória da Soja ou está a menos de 150 km da restrição.
- **desfechos no histórico:** Não recomendamos a negociação (54); Apenas análise - não recomendamos a negociação (36); Bloqueio mantido (1)
- **palavrasChave:** prospecção de clientes, serasa, prospecção, cadastradas, abrangendo, moratória da soja, embargo, lista, consta, triangulação
- **estrutura típica:** `h008` (27%) → *texto livre* (97%)

1. `≈ h008`

> Conclusão da análise realizada no CPF do produtor {{nome}} (CPF: {{docNumero}}), abrangendo as áreas cadastradas na plataforma Serasa até a presente data e a área indicada pela solicitante.

2. `≈ h081`

> {{Sujeito}} consta na Lista da Moratória da Soja em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

3.

> A área indicada para análise, também está localizada no município de {{municipioEmbargo}}, não apresenta passivos ambientais, todavia é vizinha da área com o passivo da Moratória.

4. `≈ h147`

> Portanto, diante do risco evidente de triangulação do produto, não recomendamos a negociação da commodity soja com este produtor, nessa área e em áreas que fiquem a menos de 150 km da restrição.

5. `≈ h117`

> Caso a negociação seja para milho, será possível realizá-la, desde que as áreas de originação não sejam as que estão com a restrição e mediante envio do contrato comprovando que a operação não é relacionada à soja, conforme comunicado pelo time de Sustentabilidade São Paulo.

#### `a-prospeccao-serasa` · Análise de prospecção – Áreas da plataforma Serasa e área indicada – Recomendamos a negociação

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** aprovado (APROVADO) · **subcategoria:** Prospecção de clientes
- **usos:** 89 (3,4% do histórico) · **tema principal:** Prospecção de clientes
- **quando usar:** prospecção que analisa o CPF do produtor, as áreas cadastradas na Serasa e a área indicada pela solicitante, sem impedimentos.
- **desfechos no histórico:** Apenas análise - recomendamos a negociação (67); Recomendamos a negociação (22)
- **palavrasChave:** prospecção de clientes, em conformidade, serasa, prospecção, cadastradas, abrangendo, relatório, anexo, apresenta, negociações
- **estrutura típica:** `h008` (89%) → *texto livre* (75%) → `h013` (34%) → `h012` (24%)

1. `≈ h008`

> Conclusão da análise realizada no CPF do produtor {{nome}} (CPF: {{docNumero}}), abrangendo as áreas cadastradas na plataforma Serasa até a presente data e a área indicada pela solicitante.

2. `≈ id-limpo`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}, assim como a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, também não apresenta passivos ambientais.

3. `≈ h013`

> Portanto, até a presente data, o produtor e a área estão em conformidade socioambiental, para negociações.

#### `a-pvg` · Protocolo Verde dos Grãos (PVG) – Área analisada sem restrição – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Desmatamento e protocolos
- **usos:** 77 (2,9% do histórico) · **tema principal:** Protocolo Verde dos Grãos (PVG-PA)
- **quando usar:** o PVG aponta restrição no CPF/CNPJ ou em área vizinha, mas a área de originação analisada não tem passivos (ou o apontamento não consta na planilha oficial).
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (35); Desbloqueado – Bloqueado via Lista/manual (23); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (10)
- **palavrasChave:** em conformidade, capacidade produtiva, volume, relatório, anexo, apresenta, estado, sacas, contrato, família/terceiros
- **estrutura típica:** *texto livre* (96%) → `cap-uf` (26%)

1. `≈ id-limpo`

> {{Sujeito}} possui restrições ambientais vinculadas ao seu {{doc}} em áreas localizadas no município de {{municipio}}. Entretanto, a área indicada para análise, localizada no município de {{municipio2}}, registrada no CAR nº {{car}}, não apresenta passivos ou bloqueios ambientais.

2. `≈ cap-uf`

> A referida área possui {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado do {{uf}}, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, o que corresponde a {{producaoT}} toneladas.

3. `≈ h011`

> No chamado, foi informado que o pedido de desbloqueio tem como finalidade a continuidade da operação referente ao contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, no volume de {{volume}} kg.

4. `≈ con-fav-op`

> Dessa forma, considerando que a área analisada encontra-se em conformidade socioambiental e que o volume do contrato informado está compatível com a capacidade produtiva da área, conclui-se que não há impedimentos ambientais, motivo pelo qual o desbloqueio foi devidamente realizado.

#### `a-embargo-outros` · Embargo / lista – Área solicitada sem passivos – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Embargo ambiental
- **usos:** 76 (2,9% do histórico) · **tema principal:** Geral
- **quando usar:** o cliente está bloqueado por lista (Sema-MT, Ibama), mas a área que pedem para liberar não tem passivos (inclui embargo do tipo ponto).
- **desfechos no histórico:** Desbloqueado – Bloqueado via Lista (36); Desbloqueado – Bloqueado via Lista/manual (18); Desbloqueado – CAR Bloqueado (15)
- **palavrasChave:** embargo, embargo sema-mt, desejam, solicitada, desbloqueio, em conformidade, curta, conclusão
- **estrutura típica:** *texto livre* (76%)

1. `≈ h054`

> {{Sujeito}} encontra-se bloqueado no sistema ADMBR em razão da Lista da Sema-MT. No entanto, a área que desejam análise e desbloqueio está localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, e não apresenta passivos ambientais.

2. `≈ h006`

> Portanto, em conformidade ambiental.

#### `c-car-suspenso` · CAR com status “suspenso” ou “cancelado” – Bloqueio mantido

- **categoria:** mantido (C. Bloqueio mantido) · **status:** mantido (BLOQUEIO MANTIDO) · **subcategoria:** Regularidade do CAR
- **usos:** 70 (2,7% do histórico) · **tema principal:** CAR Suspenso/Cancelado
- **quando usar:** o CAR está suspenso ou cancelado e não há operação formalizada antes do apontamento (para operação já formalizada, use o Caso 10).
- **desfechos no histórico:** Bloqueio mantido (70)
- **palavrasChave:** car suspenso/cancelado, status do car, resolução bcb 140, contraria, 140/2021, contrato, vincular, pendente, mantido, conclusão
- **estrutura típica:** `h015` (46%) → `h014` (44%) → *texto livre* (76%) → `h036` (23%) → `h019` (47%)

1. `≈ h015`

> O CAR {{car}} encontra-se com o status SUSPENSO, o que contraria as diretrizes estabelecidas pela nossa política interna e pela Resolução BCB nº 140/2021, do Banco Central do Brasil, que veda a concessão de crédito rural a imóveis com pendências socioambientais dessa natureza.

2. `≈ h014`

> Conforme nossa política, somente é possível vincular CARs com status “Ativo” ou “Pendente” aos contratos e realizar negociações em áreas que estejam regularizadas nesses termos. Portanto, não é permitido vincular CARs com status "Suspenso" e “Cancelado” às operações.

3. `≈ h036`

> Por essa razão, o bloqueio do CAR será mantido.

4. `≈ h019`

> Sugiro que seja verificado junto ao cliente se existe um CAR válido, com status compatível com os requisitos legais e internos, para que possamos dar continuidade à análise da operação.

#### `a-cultivo` · Cultivo inferior a 10% – Cultivo comprovado nas imagens – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Área de cultivo de grãos
- **usos:** 58 (2,2% do histórico) · **tema principal:** Cultivo inferior a 10%
- **quando usar:** a área foi bloqueada por apontamento de menos de 10% de cultivo, mas as imagens de satélite mostram área produtiva compatível.
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (51); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (5); Desbloqueado – Bloqueado via Lista/manual (2)
- **palavrasChave:** capacidade produtiva, volume, cultivo de grãos, 10% de cultivo, arrendamento, cultivo inferior a 10%, arrendada, estado, sacas, contrato
- **estrutura típica:** `cap-uf` (53%) → *texto livre* (88%)

1. `≈ h080`

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, encontrava-se bloqueada por possuir apontamento de inexistência de no mínimo 10% de área destinada ao cultivo de grãos.

2. `≈ cap-uf`

> Em análise verificou-se que a área possui aproximadamente {{areaProdutiva}} hectares de área de cultivo de grãos. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado do {{uf}}, para milho, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, o que corresponde a {{producaoT}} toneladas.

3. `≈ op-hedge`

> No chamado foi informado que o pedido de desbloqueio tem como finalidade a aplicação do hedge nº {{hedge}}, visando à geração de novo contrato no volume de {{volumeHedge}} kg de milho.

4. `≈ con-fav-op`

> Diante do exposto, considerando que a área analisada encontra-se em conformidade socioambiental e que o volume a ser entregue pela empresa é compatível com a capacidade produtiva da área, conclui-se que não há impedimentos ambientais, motivo pelo qual o desbloqueio foi devidamente realizado.

#### `a-sem-restricao` · Não há restrições – Cliente e área sem passivos – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Sem restrição
- **usos:** 57 (2,2% do histórico) · **tema principal:** Não há restrições
- **quando usar:** o cliente está bloqueado (lista ou manual), mas nem o CPF/CNPJ nem a área têm restrição.
- **desfechos no histórico:** Desbloqueado – Bloqueado via Lista (34); Desbloqueado – CAR Bloqueado (9); Direcionado à Alçada G - Em conformidade (5)
- **palavrasChave:** em conformidade, relatório, anexo, apresenta
- **estrutura típica:** `id-limpo` (21%) → *texto livre* (82%)

1. `≈ id-limpo`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, também não apresenta passivos ambientais.

2.

> No entanto, o clifor do produtor encontra-se bloqueado no sistema ADMBR, sem qualquer justificativa expressa.

3.

> Diante disso, considerando que está em conformidade, o desbloqueio foi realizado.

#### `a-sem-motivo` · Bloqueio manual sem motivo expresso – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Sem restrição
- **usos:** 39 (1,5% do histórico) · **tema principal:** Bloqueio manual sem motivo
- **quando usar:** clifor bloqueado no ADMBR sem justificativa registrada e sem restrições no CPF/CNPJ e nas áreas.
- **desfechos no histórico:** Desbloqueado – Bloqueado via Lista/manual (38); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (1)
- **palavrasChave:** bloqueio manual sem motivo, admbr, justificativa, sistema, manter, motivassem, justifica, nada, clifor, desbloqueio realizado
- **estrutura típica:** `h023` (59%) → *texto livre* (46%) → `h025` (56%) → `h024` (59%)

1. `≈ h023`

> {{Sujeito}} encontrava-se bloqueado no sistema ADMBR sem qualquer justificativa registrada.

2. `≈ h025`

> Após análise do seu {{doc}} e das áreas a ele vinculadas, não foram identificadas restrições ambientais ou outras pendências que motivassem a manutenção do bloqueio.

3. `≈ h024`

> Diante disso, o produtor foi considerado em conformidade e o seu clifor foi devidamente desbloqueado.

#### `a-car-regularizado` · CAR “suspenso” ou “cancelado” regularizado (status “ativo”) – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Regularidade do CAR
- **usos:** 38 (1,5% do histórico) · **tema principal:** CAR Suspenso/Cancelado
- **quando usar:** o CAR constava como suspenso/cancelado, mas a consulta ao portal oficial mostra o status regularizado (“Ativo”).
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (28); Desbloqueado – Bloqueado via Lista/manual (5); Desbloqueado – Bloqueado via Lista (3)
- **palavrasChave:** volume, capacidade produtiva, contrato, hedge, visando, novo, pará, sacas, desbloqueio realizado, em conformidade
- **estrutura típica:** *texto livre* (100%) → `cap-uf` (26%)

1.

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão de o status do cadastro constar como “Suspenso”.

2.

> Entretanto, em consulta realizada ao portal oficial do Governo, foi possível verificar a regularização da situação cadastral, passando o status do CAR para “Ativo”.

3. `≈ op-hedge`

> Conforme informado no chamado, o pedido de desbloqueio tem por finalidade a aplicação do hedge nº {{hedge}}, visando à formalização de um novo contrato no volume de {{volumeHedge}} kg de soja.

4. `≈ cap-pa`

> A área analisada possui {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de produtividade estabelecido pela CONAB para o Estado de {{uf}}, de {{rendimento}} kg/ha, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de soja.

5. `≈ con-fav-op`

> Diante do exposto, considerando que tanto {{sujeito}} quanto a área analisada se encontram em conformidade com os critérios socioambientais aplicáveis, e que o volume pretendido é compatível com a capacidade produtiva estimada da propriedade, conclui-se que não há impedimentos ambientais para a operação, razão pela qual o desbloqueio foi devidamente realizado.

#### `e-sem-car` · Sem CAR ou CAR incorreto – Chamado encerrado

- **categoria:** encerramento (E. Encerramento (sem análise ou sem ação)) · **status:** encerrado (CHAMADO ENCERRADO) · **subcategoria:** Regularidade do CAR
- **usos:** 37 (1,4% do histórico) · **tema principal:** Sem CAR
- **quando usar:** o número do CAR informado está incorreto ou ausente, o que impede a análise.
- **desfechos no histórico:** Encerrado (31); Encerrado - Não houve ação (6)
- **palavrasChave:** sem car, incorreto, sinalizado, chamados, anteriores, chamado encerrado, impossibilita, realizar
- **estrutura típica:** *texto livre* (65%)

1. `≈ h103`

> O número do CAR informado está incorreto. Em chamados anteriores foi sinalizado à solicitante essa inconsistência e solicitado a correção.

2. `≈ h104`

> Como não é possível realizar a análise com o número informado, o chamado será encerrado.

#### `d-nao-se-aplica` · Sem CAR – Enquadramento temporário “NÃO SE APLICA” (Selo Biocombustível / dendê)

- **categoria:** procedimento (D. Procedimentos operacionais e cadastrais) · **status:** reclassificacao (RECLASSIFICAÇÃO CADASTRAL) · **subcategoria:** Cadastro e enquadramento
- **usos:** 34 (1,3% do histórico) · **tema principal:** Sem CAR
- **quando usar:** operação de compra de dendê para o Selo Biocombustível Social com produtor sem CAR; orientação de SP para ajustar o enquadramento.
- **desfechos no histórico:** Direcionado ao MDM (34)
- **palavrasChave:** sem car, enquadramento direto/indireto, aplica, selo biocombustível social, aquisição, dendê, sustentabilidade sp, orientação, em conformidade, alterado
- **estrutura típica:** `h021` (79%) → `h022` (79%) → `h020` (85%) → `tf-reenq` (82%)

1. `≈ h021`

> A operação consiste na aquisição de dendê para obtenção do Selo Biocombustível Social.

2. `≈ h022`

> Conforme orientação do time de Sustentabilidade São Paulo, nesses casos o enquadramento será temporariamente ajustado para NÃO SE APLICA.

3. `≈ h020`

> Dessa forma, o enquadramento do produtor está sendo alterado de DIRETO para NÃO SE APLICA, em conformidade com a diretriz vigente.

4. `≈ tf-reenq`

> A confirmação e execução dessa alteração será realizada pelo time de MDM, para o qual o chamado já foi direcionado (chamado nº {{chamadoMDM}}).

#### `a-csa` · CSA Cerrado (ou LUC) – Protocolo ainda não vigente – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Desmatamento e protocolos
- **usos:** 29 (1,1% do histórico) · **tema principal:** CSA Cerrado
- **quando usar:** a área foi bloqueada por sobreposição com o CSA Cerrado (ou LUC), protocolo ainda não vigente na política da empresa.
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (24); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (2); Desbloqueado (1)
- **palavrasChave:** csa cerrado, sobreposição, vigente, protocolo, em conformidade, curta, conclusão
- **estrutura típica:** `h028` (69%) → `h006` (52%)

1. `≈ h028`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise encontra-se bloqueada em razão de possuir sobreposição com CSA Cerrado, protocolo ainda não vigente na política da empresa.

2. `≈ h006`

> Portanto, em conformidade.

#### `a-alcada-g` · Alçada Y – Contrato em conformidade direcionado à alçada G

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** aprovado (APROVADO) · **subcategoria:** Cadastro e enquadramento
- **usos:** 27 (1,0% do histórico) · **tema principal:** Alçada Y
- **quando usar:** contrato parado na alçada Y (ex.: ausência de CAR de cliente que na prática é INDIRETO) e sem impedimento socioambiental.
- **desfechos no histórico:** Direcionado à Alçada G - Em conformidade (27)
- **palavrasChave:** enquadramento direto/indireto, mdm, cliente indireto, em conformidade, família/terceiros
- **estrutura típica:** *texto livre* (100%)

1.

> {{Sujeito}} {{nome}} está atualmente classificada como cliente DIRETO no ADMBR. No entanto, considerando que sua atividade principal é o Comércio Atacadista de Defensivos Agrícolas, trata-se, na prática, de um cliente INDIRETO.

2. `≈ h095`

> Dessa forma, o enquadramento da empresa está sendo alterado de DIRETO para INDIRETO. A confirmação e execução do procedimento de alteração será realizada pelo time de MDM, ao qual o chamado já foi direcionado para execução (chamado: {{chamadoMDM}}).  
> AlémAlém disso, o contrato nº {{contrato}} encontrava-se na alçada Y em razão da ausência do CAR. Considerando que trata-se de cliente INDIRETO, o contrato foi direcionado à alçada G.

#### `a-triangulacao` · Risco de triangulação com embargo de terceiro afastado – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Embargo ambiental
- **usos:** 27 (1,0% do histórico) · **tema principal:** Geral
- **quando usar:** a área foi bloqueada por risco de triangulação com embargo de terceiro (vizinho, familiar, proprietário), mas o embargo está isolado ou a mais de 150 km.
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (20); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (4); Recomendamos a negociação (2)
- **palavrasChave:** embargo sema-mt, sema-mt, embargo, triangulação, risco, em conformidade, exigências, atendem, socioambiental
- **estrutura típica:** `h033` (22%) → *texto livre* (100%) → `cap-uf` (26%)

1. `≈ h033`

> O produtor não apresenta restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada devido ao risco de triangulação com embargo da Sema-MT em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}).

2.

> O embargo refere-se a áreas situadas em {{municipioEmbargo}}, registradas nos CARs {{carEmbargo}} e {{carEmbargo2}}, cujos polígonos estão devidamente isolados do plantio de grãos (Verificado junto com o {{nomeTerceiro2}} as imagens de satélite).

3. `≈ h256`

> Dessa forma, o produtor e a área indicada para análise atendem às exigências de conformidade socioambiental.

#### `a-moratoria` · Moratória da Soja – Área solicitada fora da restrição – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Desmatamento e protocolos
- **usos:** 19 (0,7% do histórico) · **tema principal:** Moratória da Soja
- **quando usar:** o cliente consta na Lista da Moratória da Soja, mas a área que pedem para liberar não tem passivos e não há risco de triangulação.
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (8); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (6); Desbloqueado – Bloqueado via Lista (5)
- **palavrasChave:** embargo, embargo sema-mt, desejam, solicitada, desbloqueio, em conformidade, curta, conclusão
- **estrutura típica:** *texto livre* (100%)

1.

> {{Sujeito}} consta na Lista da Moratória da Soja em áreas localizadas nos municípios de {{municipioEmbargo}} e {{municipioEmbargo2}}.

2. `≈ h054`

> A área que desejam análise e liberação está localizada em {{municipioEmbargo3}}, registrada no CAR {{carEmbargo}} e não apresenta passivos ambientais.

3. `≈ h006`

> Portanto, em conformidade.

#### `c-moratoria` · Moratória da Soja – Risco de triangulação – Bloqueio mantido

- **categoria:** mantido (C. Bloqueio mantido) · **status:** mantido (BLOQUEIO MANTIDO) · **subcategoria:** Desmatamento e protocolos
- **usos:** 18 (0,7% do histórico) · **tema principal:** Moratória da Soja
- **quando usar:** área ou familiar na Lista da Moratória da Soja com risco de triangulação; soja não recomendada (milho apenas com condições).
- **desfechos no histórico:** Bloqueio mantido (18)
- **palavrasChave:** moratória da soja, embargo, em conformidade, embargadas, riscos, 150 km, cenário, commodity, recomendamos, contrato
- **estrutura típica:** *texto livre* (100%) → `h120` (22%) → `h016` (28%)

1.

> Embora o produtor não possua restrições ambientais vinculadas ao seu {{doc}}, ele arrenda uma área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, que consta na Lista da Moratória da Soja em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}), familiar do produtor. Esse vínculo, por si só, configura risco evidente de triangulação.

2. `≈ h120`

> Além disso, a comercialização de grãos ou insumos com áreas embargadas pela Moratória da Soja representa riscos significativos, incluindo:  
> Não conformidade com políticas socioambientais, podendo gerar sanções contratuais e reputacionais;  
> Exposição a auditorias e bloqueios comerciais, comprometendo a integridade da cadeia de fornecimento;  
> Impacto direto na imagem da empresa, por associação a práticas que violam compromissos de sustentabilidade.

3. `≈ h227`

> Diante desse cenário, não recomendamos a negociação da commodity soja com este produtor, tanto na área indicada quanto em outras localizadas a menos de 150 km da restrição.

4. `≈ h086`

> Caso a negociação seja para milho, ela poderá ocorrer desde que:  
> As áreas de originação não estejam vinculadas à restrição;  
> Seja apresentado contrato comprovando que a operação não envolve soja, conforme orientação do time de Sustentabilidade São Paulo.

5. `≈ h016`

> Diante do exposto, o bloqueio será mantido.

#### `a-uc` · Unidade de Conservação – Sobreposição fora da área de cultivo – Desbloqueio

- **categoria:** aprovado (A. Aprovado – desbloqueio) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Áreas protegidas
- **usos:** 17 (0,6% do histórico) · **tema principal:** Unidade de Conservação
- **quando usar:** sobreposição com Unidade de Conservação que não atinge a porção de cultivo de grãos (ou UC de uso sustentável).
- **desfechos no histórico:** Desbloqueado – CAR Bloqueado (14); Desbloqueado – Bloqueado via Lista e CAR Bloqueado (2); Desbloqueado (1)
- **palavrasChave:** unidade de conservação, sobreposição, silvestre, cultivo de grãos, cliente indireto, integra, capacidade produtiva, porção, desbloqueio realizado, em conformidade
- **estrutura típica:** `h112` (29%) → *texto livre* (82%)

1. `≈ h112`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR nº {{car}}, encontrava-se bloqueada em razão da sobreposição de {{areaHa}} hectares com a Unidade de Conservação Refúgio de Vida Silvestre.

2. `≈ h261`

> Conforme dispõe a Lei nº 9.985/2000 (SNUC), o Refúgio de Vida Silvestre integra a categoria de Proteção Integral, na qual é vedado o plantio de grãos ou qualquer outra atividade agropecuária, admitindo-se apenas o uso indireto dos recursos naturais.

3. `≈ h262`

> Todavia, após análise, verificou-se que a área de sobreposição não incide sobre a porção destinada ao cultivo de grãos da propriedade, não comprometendo a atividade produtiva.

4. `≈ h034`

> Dessa forma, conclui-se que o produtor e a área em questão encontram-se, até a presente data, em conformidade socioambiental para negociações, motivo pelo qual o CAR foi devidamente desbloqueado.

#### `d-selo` · Selo Biocombustível Social (compra de dendê) – Desbloqueio

- **categoria:** procedimento (D. Procedimentos operacionais e cadastrais) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Cadastro e enquadramento
- **usos:** 16 (0,6% do histórico) · **tema principal:** Protocolo Verde dos Grãos (PVG-PA)
- **quando usar:** operação de compra de dendê para obtenção do Selo Biocombustível Social.
- **desfechos no histórico:** Desbloqueado – Selo Biocombustível Social (16)
- **palavrasChave:** selo biocombustível social, protocolo verde dos grãos (pvg-pa), fazenda, dendê, compra
- **estrutura típica:** `h057` (50%) → `h061` (31%)

1. `≈ h057`

> O produtor teve a fazenda desbloqueada, em razão da compra de dendê para a obtenção do Selo Biocombustível Social.

#### `d-cliente-indireto` · Cliente INDIRETO ou consumidor de soluções – Desbloqueio

- **categoria:** procedimento (D. Procedimentos operacionais e cadastrais) · **status:** desbloqueio (DESBLOQUEIO REALIZADO) · **subcategoria:** Cadastro e enquadramento
- **usos:** 15 (0,6% do histórico) · **tema principal:** Embargo Ibama
- **quando usar:** cliente indireto/consumidor bloqueado por restrição que não se aplica à operação (ex.: compra de dendê).
- **desfechos no histórico:** Desbloqueado – Cliente Indireto (12); Desbloqueado – Cliente/Consumidor de soluções (3)
- **palavrasChave:** desbloqueio realizado, curta, conclusão
- **estrutura típica:** *texto livre* (100%) → `h009` (33%)

1.

> Trata-se de cliente indireto que está bloqueado em razão de possuir restrições junto ao PVG. Contudo a operação envolve a compra de dendê, para obtenção do Selo Biocombustível Social.

2. `≈ h009`

> Portanto, desbloqueado.

#### `c-alcada-l` · Alçada Y – Contrato sem CAR vinculado devolvido à alçada L

- **categoria:** mantido (C. Bloqueio mantido) · **status:** mantido (BLOQUEIO MANTIDO) · **subcategoria:** Cadastro e enquadramento
- **usos:** 14 (0,5% do histórico) · **tema principal:** Geral
- **quando usar:** contrato gerado sem vínculo do CAR: volta para a alçada L para saneamento e depois segue para a G.
- **desfechos no histórico:** Direcionado à Alçada L - Não conforme (14)
- **palavrasChave:** em conformidade, relatório, anexo, apresenta
- **estrutura típica:** *texto livre* (100%)

1. `≈ id-limpo`

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, não apresenta passivos ou bloqueios ambientais.

2.

> No chamado, foi informado que o contrato nº {{contrato}} encontrava-se na alçada Y.

3.

> Entretanto, durante a análise verificou-se que o contrato foi gerado sem o vínculo do CAR, o que explica por que ele permaneceu na alçada L.

4.

> O que provavelmente ocorreu foi que o contrato foi criado antes do cadastro e vinculação do CAR ao endereço, fazendo com que o sistema não reconhecesse a conformidade ambiental no momento da geração do contrato.

5.

> Dessa forma, o contrato será devolvido à alçada L para que seja realizado o saneamento, ou seja, a vinculação do CAR ao contrato.

6.

> Após essa correção, o contrato será automaticamente encaminhado para a alçada G, uma vez que não há qualquer bloqueio ambiental que impeça sua continuidade.

## 5. Trechos por bloco e tema

Ordem: bloco → tema (mais usado primeiro) → trecho (mais usado primeiro). Trechos que **já existem** aparecem em uma linha (o texto está no `modelos.js`); trechos **novos** trazem o texto completo.

### 1 e 2 – Identificação e situação da área

#### Tema: Geral (315 usos)

- `id-limpo` **Cliente e área sem restrições** — 104 usos · universal · já existe (`TX.idLimpo`) · seguintes: `cap-uf` (21%), `h007` (11%), `h004` (10%)
- `id-emb-cpf` **Embargo vinculado ao CPF/CNPJ (clifor bloqueado)** — 61 usos · já existe (`TX.idEmbargoCpf`) · seguintes: `cap-uf` (21%), `emb-iso` (11%), `h029` (10%)

##### `h012` · Ficha da área (CAR, status, localização, proprietário, volume máximo)
- **bloco:** 2 · **tema:** Geral · **usos:** 57 · universal
- **palavrasChave:** status do car, cultivo de grãos, capacidade produtiva, contrato, volume, serasa, máximo, localização, proprietário
- **seguintes:** `h086` (4%)

> CAR {{car}}  
> Status: Ativo  
> Localização: {{municipio}}  
> Proprietário: {{nome}} (CPF: {{docNumero}})  
> Volume máximo para contrato: {{volume}} kg - {{producaoT}} toneladas (Área de plantio Serasa {{areaProdutiva}} hectares - Fator de Rendimento Conab {{rendimento}} kg/ha)

<details><summary>Variações de redação (3)</summary>

> CAR {{car}}  
> Status: Ativo  
> Localização: {{municipio}}  
> Proprietário: {{nomeTerceiro}} (CPF: {{docTerceiro}})  
> Área de Soja Serasa: {{areaProdutiva}} hectares - Fator de Rendimento Conab {{rendimento}} kg/ha.{{rendimento2}} kg/ha  
> Produção máxima estimada para contrato: {{volume}} kg - {{volumeT}} toneladas

> {{car}}  
> Status CAR: ATIVO  
> Localização: {{municipio}}  
> Proprietário: {{nome}} (CPF: {{docNumero}})  
> Volume máximo para contrato: {{volume}} kg (Área de Plantio {{areaProdutiva}} hectares - Fator de Rendimento Conab {{rendimento}} kg/ha)  
> Portanto, o produtor e a área acima mencionada, até a presente data, estão em conformidade para negociações.

> Com relação às áreas indicadas, segue parecer técnico:  
> {{car}}  
> Status CAR: ATIVO  
> Proprietário: {{nomeTerceiro}} (CPF: {{docTerceiro}})  
> Volume máximo para contrato: (Área de plantio {{areaProdutiva}} hectares - Fator de Rendimento Conab: {{rendimento}} kg/ha)  
> {{car2}}  
> Status CAR: ATIVO  
> Proprietário: {{nomeTerceiro2}} (CPF: {{docTerceiro2}})  
> Volume máximo para contrato: (Área de plantio {{areaProdutiva2}} hectares - Fator de Rendimento Conab: {{rendimento}} kg/ha)  
> {{car3}}  
> Status CAR: ATIVO  
> Proprietário: {{nomeTerceiro3}} (CPF: {{docTerceiro3}})  
> Volume máximo para contrato: (Área de plantio {{areaProdutiva3}} hectares - Fator de Rendimento Conab: {{rendimento}} kg/ha)  
> {{car4}}  
> Status CAR: …

</details>

##### `h018` · Área adicional (outro CAR) sem passivos ou bloqueios
- **bloco:** 2 · **tema:** Geral · **usos:** 36
- **palavrasChave:** adicional, apresenta
- **seguintes:** `h041` (14%), `cap-uf` (14%), `h123` (6%), `h013` (6%)

> A área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, não apresenta passivos ou bloqueios ambientais.

<details><summary>Variações de redação (3)</summary>

> A área indicada para análise, também localizada em {{municipio}}, registrada no CAR {{car}} não apresenta passivos ou bloqueios ambientais.

> A área indicada para análise está localizada em {{municipio}}, registrada no CAR {{car}} e não possui passivos ou bloqueios ambientais.

> A área indicada para análise, localizada em {{municipio}} não apresenta passivos ou bloqueios.

</details>

##### `h037` · Identificação curta – sem restrições no CPF/CNPJ
- **bloco:** 1 · **tema:** Geral · **usos:** 17 · universal
- **palavrasChave:** curta, identificação, cpf/cnpj
- **seguintes:** `cap-uf` (18%), `h006` (12%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}.

<details><summary>Variações de redação (1)</summary>

> A empresa Agrícola São {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}.

</details>

##### `h056` · Área arrendada de terceiro – cliente sem restrições
- **bloco:** 1 · **tema:** Geral · **usos:** 10
- **palavrasChave:** arrendamento, arrendada, terceiro, propriedade
- **seguintes:** `h031` (40%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, por ele arrendada e de propriedade de {{nomeTerceiro}} (CPF: {{docTerceiro}}), localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontra-se atualmente bloqueada.

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, por ele explorada e de propriedade de {{nomeTerceiro}} (CPF: {{docTerceiro}}), localizada no município de {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada em razão de apontamento relacionado à suposta inexistência de área mínima destinada ao cultivo de grãos.

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR sob o nº {{car}}, encontra-se atualmente bloqueada por não apresentar área destinada ao cultivo de grãos.

</details>

- `id-car` **CAR com status Suspenso/Cancelado** — 7 usos · já existe (`TX.idCarStatus`) · seguintes: —

##### `h085` · Área indicada para análise e desbloqueio (município e CAR)
- **bloco:** 2 · **tema:** Geral · **usos:** 7
- **palavrasChave:** embargo, desbloqueio, solicitação
- **seguintes:** `h011` (29%)

> A área indicada para análise e solicitação de desbloqueio está localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{car}}.

##### `h092` · Cliente e área sem passivos, embargos ou bloqueios
- **bloco:** 1 · **tema:** Geral · **usos:** 7
- **palavrasChave:** embargo, embargos, quaisquer, apresenta
- **seguintes:** `h031` (43%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, a área indicada para análise, localizada no município de {{municipio}} e registrada sob o CAR {{car}}, não apresenta passivos, embargos ou quaisquer bloqueios ambientais.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, a área indicada para análise, por ele explorada e de propriedade de {{nomeTerceiro}} (CPF nº {{docTerceiro}}), localizada no município de {{municipio}} e registrada no CAR {{car}}, não apresenta passivos, embargos ou quaisquer bloqueios ambientais que impeçam sua vinculação a operações comerciais.

</details>

##### `h121` · Cliente e áreas (vários CARs) sem passivos ou bloqueios
- **bloco:** 1 · **tema:** Geral · **usos:** 5
- **palavrasChave:** embargo, cars, vários, apresentam
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, as áreas indicadas para análise, localizadas no município de {{municipioEmbargo}}, registradas nos CARs nº {{carEmbargo}} e nº {{carEmbargo2}}, não apresentam passivos ou bloqueios ambientais.

##### `h197` · Situação da área – verificou-se que a área registrada no CAR nº possui aproximadamente hectares…
- **bloco:** 2 · **tema:** Geral · **usos:** 4
- **palavrasChave:** cultivo de grãos, capacidade produtiva, hectares, destinados, cerca, enquanto
- **seguintes:** `op-hedge` (50%)

> Além disso, verificou-se que a área registrada no CAR nº {{car}} possui aproximadamente {{areaProdutiva}} hectares destinados ao cultivo de grãos, enquanto a área registrada no CAR nº {{car2}} possui cerca de {{areaProdutiva2}} hectares de área produtiva.

<details><summary>Variações de redação (1)</summary>

> Já a área registrada no CAR nº {{car}} possui aproximadamente {{areaProdutiva}} hectares de área produtiva.

</details>

- `id-assent` **Triangulação com embargos do assentamento** — 0 usos · já existe (`TX.idAssentamento`) · seguintes: —
- `id-exc` **Restrição na área – operação já formalizada** — 0 usos · já existe (`TX.idExcepcional`) · seguintes: —
- `id-base` **Identificação e situação – modelo-base** — 0 usos · já existe (`TX.idBase`) · seguintes: —

#### Tema: Embargo Sema-MT (176 usos)

##### `h033` · Sema-MT – área bloqueada por risco de triangulação com embargo de terceiro
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 18
- **palavrasChave:** sema-mt, embargo, triangulação, embargo sema-mt, risco, terceiro
- **seguintes:** `h256` (17%), `h002` (11%), `h257` (11%)

> O produtor não apresenta restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada devido ao risco de triangulação com embargo da Sema-MT em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}).

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada devido ao risco de triangulação com embargos do Ibama e da Sema-MT constantes na área registrada no CAR nº {{car2}}.

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR sob o número {{car}}, encontra-se bloqueada devido à possibilidade de triangulação com embargo ambiental emitido pela SEMA-MT, em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}).

</details>

##### `h035` · Embargo Sema-MT no CPF/CNPJ – polígono isolado do cultivo
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 18
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, polígono
- **seguintes:** `h255` (11%), `h263` (11%), `h018` (11%)

> {{Sujeito}} possui embargo da Sema-MT vinculado ao seu {{doc}}, em área localizada no município de {{municipio}}, registrada no CAR nº {{car}}. Ressalta-se que o polígono embargado encontra-se devidamente isolado da área destinada ao cultivo de grãos.

<details><summary>Variações de redação (3)</summary>

> {{Sujeito}} possui um embargo da Sema-MT vinculado ao seu {{doc}}, incidente sobre área localizada em {{municipioEmbargo}} e registrada no CAR {{carEmbargo}}. O polígono embargado encontra-se devidamente isolado da área destinada ao cultivo de grãos.

> {{Sujeito}} possui embargo da SEMAD-GO vinculado ao seu {{doc}} em área localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}.

> {{Sujeito}} possui um embargo da Sema-MT vinculado ao seu {{doc}}, em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}. Contudo, o polígono embargado encontra-se isolado do plantio de grãos.

</details>

- `id-emb-area` **CPF/CNPJ sem restrição – área com embargo** — 14 usos · já existe (`TX.idEmbargoArea`) · seguintes: `cap-uf` (36%), `h011` (21%)

##### `h042` · Embargo Sema-MT no CPF/CNPJ – polígonos isolados do plantio
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 14
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, polígonos, isolados, plantio
- **seguintes:** `h054` (29%), `h003` (21%), `h006` (14%), `h018` (14%)

> {{Sujeito}} possui embargo Sema-MT vinculado ao seu {{doc}}, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, cujos polígonos estão devidamente isolados do plantio de grãos.

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} possui embargo Sema-MT vinculado ao seu {{doc}}, em área localizada em {{municipio}}, registrada no CAR {{car}}, cujos polígonos aparentemente estão isolados da área de cultivo de grãos, uma vez que a propriedade não possui área de plantio.

> {{Sujeito}} possui embargo Sema-MT em seu {{doc}}, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

</details>

##### `h054` · Área solicitada para desbloqueio sem passivos
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 10
- **palavrasChave:** embargo, embargo sema-mt, desejam, solicitada, desbloqueio, apresenta
- **seguintes:** `h006` (70%)

> A área que desejam análise e desbloqueio está localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}} e não apresenta passivos ambientais.

<details><summary>Variações de redação (2)</summary>

> A área que desejam análise e liberação está localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}} e não apresenta passivos ambientais.

> A área que desejam liberação também está localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}} e não apresenta passivos ambientais.

</details>

##### `h068` · Triangulação com outro produtor (áreas em comum)
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 8
- **palavrasChave:** embargo, triangulação, embargo sema-mt, comum, fica, áraea
- **seguintes:** `h006` (88%)

> É apontado também triangulação com {{sujeito}} {{nome}}, CPF: {{docNumero}}, tendo em vista que ambos possuem áreas em comum vinculadas, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}} que fica aproximadamente {{distancia}} km de distância.

##### `h074` · Embargo Sema-MT no CPF/CNPJ (redação curta)
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 8
- **palavrasChave:** sema-mt, embargo, embargo sema-mt, redação, curta
- **seguintes:** `h205` (25%), `h269` (25%)

> {{Sujeito}} possui embargo da SEMA-MT vinculado ao seu {{doc}}, referente a uma área localizada no município de {{municipioEmbargo}}.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui um embargo da SEMA-MT vinculado ao seu {{doc}}, referente a área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

</details>

##### `h091` · Área indicada no município do embargo, sem passivos
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 7
- **palavrasChave:** embargo, embargo sema-mt, apresenta
- **seguintes:** `cap-uf` (29%)

> A área indicada para análise, também está localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}} e não apresenta passivos ou bloqueios ambientais.

<details><summary>Variações de redação (1)</summary>

> A área indicada para análise também está situada em {{municipioEmbargo}}, registrada no CAR {{car}}, e não apresenta qualquer passivo ambiental.

</details>

##### `h093` · Cliente e área sem passivos (sem município/CAR)
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** embargo sema-mt, município/car, apresenta, desbloqueio
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}, e a área indicada para análise e desbloqueio também não apresenta passivos ambientais.

##### `h097` · Diversas restrições ambientais em vários municípios
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** embargo, embargo sema-mt, diversas, municípios, vários
- **seguintes:** `h098` (100%)

> {{Sujeito}} possui diversas restrições ambientais em áreas localizadas nos municípios de {{municipioEmbargo}} e {{municipioEmbargo2}}.

##### `h101` · Embargo Sema-MT na própria área indicada
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** sema-mt, embargo, embargo sema-mt, justamente, própria
- **seguintes:** `h239` (33%), `emb-iso` (33%)

> {{Sujeito}} possui embargo Sema-MT vinculado ao seu {{doc}}, justamente na área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}.

##### `h118` · Área indicada para análise e desbloqueio sem passivos
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 5
- **palavrasChave:** embargo sema-mt, desbloqueio, apresenta
- **seguintes:** `h006` (80%)

> A área indicada para análise e desbloqueio está localizada em {{municipio}}, registrada no CAR {{car}} e não apresenta passivos.

##### `h150` · Identificação – o cliente possui embargo Sema-MT em seu CPF/CNPJ, na área localizada em…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, plantio
- **seguintes:** `h151` (75%)

> {{Sujeito}} possui embargo Sema-MT em seu {{doc}}, na área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, que está devidamente isolado do plantio de grãos.

##### `h151` · Situação da área – a área indicada para análise não possui passivos ambientais
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** embargo sema-mt
- **seguintes:** `h006` (75%)

> A área indicada para análise não possui passivos ambientais.

##### `h153` · Bloqueio pela Lista da Sema-MT sem passivo localizado
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** sema-mt, admbr, embargo sema-mt, lista, passivo, desfavor
- **seguintes:** `h009` (50%), `h006` (50%)

> {{Sujeito}} encontra-se bloqueado no sistema ADMBR em razão da Lista da Sema-MT. No entanto, em análise não foi localizado nenhum passivo ambiental em desfavor do produtor e da área indicada para análise.

##### `h189` · Bloqueio por constar na lista da Sema-MT
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** sema-mt, admbr, embargo sema-mt, constar, lista
- **seguintes:** `h217` (50%), `h018` (50%)

> {{Sujeito}} encontra-se bloqueado no sistema ADMBR em razão de constar na lista da Sema-MT.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} encontra-se bloqueado no sistema ADMBR devido à inclusão na Lista da SEMA-MT.

</details>

##### `h190` · Identificação – o cliente possui embargo ativo da Sema-MT vinculado ao seu CPF/CNPJ, em áreas…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, ativo, cars
- **seguintes:** —

> {{Sujeito}} possui embargo ativo da Sema-MT vinculado ao seu {{doc}}, em áreas localizadas no município de {{municipioEmbargo}}, registradas nos CARs {{carEmbargo}} e {{carEmbargo2}}. Os polígonos embargados encontram-se devidamente isolados do plantio de grãos.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui embargo da SEMA-MT vinculado ao seu {{doc}}, em área localizada no município de {{municipioEmbargo}}, registrada sob o CAR {{carEmbargo}}. No entanto, os polígonos embargados encontram-se devidamente isolados do plantio de grãos.

</details>

##### `h205` · Situação da área – foi identificado um embargo da SEMA-MT em nome de, em área vinculada ao…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, isolado, triangulação, cultivo de grãos, embargo sema-mt, nome, respeitando, limite
- **seguintes:** `h204` (67%)

> Além disso, foi identificado um embargo da SEMA-MT em nome de {{nomeTerceiro}}, em área vinculada ao produtor, localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}. O polígono embargado, no entanto, encontra-se isolado da atividade de plantio de grãos e a área está a aproximadamente {{distancia}} km da área de formação da lavoura, respeitando também o limite de triangulação.

##### `h210` · Identificação – o cliente possui um embargo ativo pela SEMA-MT vinculado ao seu CPF/CNPJ…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, ativo, embargados
- **seguintes:** `h091` (67%)

> {{Sujeito}} possui um embargo ativo pela SEMA-MT vinculado ao seu {{doc}}, referente a uma área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, cujos polígonos embargados estão devidamente isolados da área destinada ao plantio de grãos.

##### `h218` · Situação da área – quanto à área indicada para análise, localizada no município de e registrada no…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo sema-mt, número
- **seguintes:** —

> Quanto à área indicada para análise, localizada no município de {{municipio}} e registrada no CAR sob o número {{car}}, não foram identificados passivos ambientais.

##### `h220` · Identificação – o cliente não possui restrições ambientais em seu CPF/CNPJ. No entanto, a área…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, possuir, nome, plantio
- **seguintes:** `h006` (67%)

> {{Sujeito}} não possui restrições ambientais em seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, encontra-se bloqueada por possuir embargo Sema-MT em nome de {{nomeTerceiro}}, que está devidamente isolado do plantio de grãos.

##### `h221` · Identificação – o cliente possui embargos ambientais ativos pelo Ibama e pela Sema-MT…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** ibama, sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, ativos, embargos, vinculados
- **seguintes:** `h222` (100%)

> {{Sujeito}} possui embargos ambientais ativos pelo Ibama e pela Sema-MT vinculados ao seu {{doc}}. Além disso, foram identificados outros passivos ambientais relacionados às áreas sob sua responsabilidade, conforme detalhado abaixo:  
> {{municipioEmbargo}} - CAR: {{carEmbargo}} - Embargo Ibama em nome da produtora, que aparentemente está isolado do plantio de grãos;

##### `h225` · Identificação – cliente sem restrição no CPF/CNPJ. No entanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** ibama, sema-mt, embargo, triangulação, embargo sema-mt, relacionados, embargos, devido
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise encontra-se bloqueada devido ao risco de triangulação com embargos do Ibama e da Sema-MT, relacionados à área registrada no CAR {{car}}

##### `h230` · Situação da área – foi identificado um embargo do Ibama em área vinculada a ele, registrada no…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** ibama, embargo, embargo sema-mt, aparentemente, vínculo
- **seguintes:** `h231` (100%)

> No entanto, foi identificado um embargo do Ibama em área vinculada a ele, registrada no CAR {{carEmbargo}}, também localizada em {{municipio}}, em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}), que aparentemente não possui vínculo direto com o produtor.

##### `h231` · Situação da área – a área indicada para análise não apresenta passivos ambientais ou bloqueios…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo sema-mt, diretos, apresenta
- **seguintes:** —

> A área indicada para análise não apresenta passivos ambientais ou bloqueios diretos.

##### `h269` · Situação da área – a área indicada para análise, por sua vez, está situada em e registrada no CAR…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo sema-mt, situada, apresentando, passivo
- **seguintes:** `h270` (100%)

> A área indicada para análise, por sua vez, está situada em {{municipio}} e registrada no CAR {{car}}, não apresentando qualquer passivo ou bloqueio ambiental.

##### `h302` · Situação da área – a área indicada para análise está localizada no município de, registrada no CAR…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** em conformidade, embargo sema-mt, encontrando-se, aspecto, apresenta, socioambiental
- **seguintes:** `cap-uf` (67%)

> A área indicada para análise está localizada no município de {{municipio}}, registrada no CAR nº {{car}}, e não apresenta passivos ou bloqueios ambientais, encontrando-se, portanto, em conformidade sob o aspecto socioambiental.

##### `h329` · Situação da área – a área indicada para a presente análise, também localizada em e registrada no…
- **bloco:** 2 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, triangulação, embargo sema-mt, sócio-administrador, figura, mencionado, anteriormente
- **seguintes:** `h330` (100%)

> A área indicada para a presente análise, também localizada em {{municipioEmbargo}} e registrada no CAR {{carEmbargo}}, encontrava-se bloqueada em razão de risco de triangulação com o passivo ambiental mencionado anteriormente, bem como com embargo SEMA-MT vinculado à empresa {{nomeTerceiro}}, da qual o produtor figura como sócio-administrador.

##### `h332` · Identificação – o cliente possui um embargo Sema-MT vinculado ao seu CPF/CNPJ, exatamente sobre…
- **bloco:** 1 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, isolado, não isolado, imagens de satélite, cultivo de grãos, família/terceiros, embargo sema-mt, exatamente, destinada
- **seguintes:** —

> {{Sujeito}} possui um embargo Sema-MT vinculado ao seu {{doc}}, exatamente sobre a área indicada para análise. Trata-se de uma área destinada à formação de lavoura, localizada no município de {{municipio}}, registrada no CAR {{car}}.A partir da avaliação das imagens de satélite, constatou-se que um dos polígonos embargados não está isolado da área destinada ao cultivo de grãos. Inclusive, foi identificada a presença de camada de soja referente à safra {{safra}}, o que confirma a inexistência de isolamento da área embargada.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui um embargo da SEMA-MT vinculado ao seu {{doc}}, exatamente sobre a área indicada para análise. Trata-se de uma área destinada à formação de lavoura, localizada no município de {{municipio}}, registrada no CAR {{car}}.

</details>


#### Tema: Embargo Ibama (168 usos)

##### `h017` · Embargo Ibama no CPF/CNPJ – polígono isolado do plantio
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 40
- **palavrasChave:** ibama, embargo, isolado, cultivo de grãos, embargo ibama, polígono, plantio
- **seguintes:** `h006` (15%), `h018` (12%), `h152` (10%), `h054` (7%)

> {{Sujeito}} possui embargo Ibama em seu {{doc}}, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, cujo polígono está devidamente isolado do plantio de grãos.

<details><summary>Variações de redação (3)</summary>

> {{Sujeito}} possui embargo Ibama vinculado ao seu {{doc}}, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

> {{Sujeito}} possui embargo Ibama em seu {{doc}}, em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

> {{Sujeito}} possui embargo ativo do Ibama em seu {{doc}}, referente a uma área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}. O polígono embargado está devidamente isolado do plantio de grãos.

</details>

##### `h044` · Área bloqueada por risco de triangulação com embargo Ibama/Sema de terceiro
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 13
- **palavrasChave:** ibama, sema-mt, embargo, triangulação, embargo ibama, ibama/sema, risco, próprios
- **seguintes:** `assent` (46%), `h105` (38%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, embora não apresente passivos ambientais próprios, encontrava-se bloqueada devido ao risco de triangulação com áreas embargadas pelo Ibama e pela Sema-MT, vinculadas ao CAR {{car2}}.

##### `h060` · Área indicada sem passivos ou restrições (município e CAR)
- **bloco:** 2 · **tema:** Embargo Ibama · **usos:** 9
- **palavrasChave:** embargo ibama, apresentando
- **seguintes:** `h031` (22%), `cap-pa` (22%)

> A área indicada para análise está localizada no município de {{municipio}}, registrada no CAR nº {{car}}, não apresentando passivos ou restrições ambientais.

<details><summary>Variações de redação (1)</summary>

> A área indicada para análise, por sua vez, está situada no município de {{municipio}}, registrada no CAR nº {{car}}, não apresentando passivos ou bloqueios ambientais.

</details>

##### `h069` · Área arrendada de terceiro com embargo Ibama – risco de triangulação
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 8
- **palavrasChave:** ibama, embargo, triangulação, arrendamento, embargo ibama, arrendada, risco
- **seguintes:** `cap-uf` (38%), `op-hedge` (38%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, por ele arrendada, de propriedade de {{nomeTerceiro}} (CPF: {{docTerceiro}}), localizada no município de {{municipio}} e registrada no CAR sob o nº {{car}}, embora não apresente passivos ambientais próprios, encontra-se bloqueada em razão de risco de triangulação com embargo do IBAMA em nome do proprietário.

##### `h076` · Área bloqueada por risco de triangulação (sem passivos próprios)
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 8
- **palavrasChave:** triangulação, embargo ibama, risco, associado, próprios
- **seguintes:** `h027` (25%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, embora não apresente passivos ambientais, encontrava-se bloqueada devido ao risco de triangulação associado a {{nomeTerceiro}} (CPF: {{docTerceiro}}).

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, embora não apresentasse passivos ambientais, encontrava-se bloqueada devido ao risco de triangulação com {{nomeTerceiro}} (CPF: {{docTerceiro}}).

</details>

##### `h078` · Embargo ICMBio no CPF/CNPJ
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 8
- **palavrasChave:** icmbio, embargo, embargo ibama, incidente, cpf/cnpj
- **seguintes:** `h267` (38%), `emb-iso` (25%)

> {{Sujeito}} possui embargo do ICMBio vinculado ao seu {{doc}}, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui embargo registrado junto ao IBAMA, vinculado ao seu {{doc}}, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}.

</details>

##### `h079` · Área bloqueada por triangulação com embargo Semad-GO
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 8
- **palavrasChave:** semad-go, embargo, triangulação, embargo ibama, apresente, embora
- **seguintes:** `h029` (25%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, embora não apresente passivos ambientais, encontrava-se bloqueada em razão de risco de triangulação com embargo da SEMAD-GO vinculado ao {{nomeTerceiro}}

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR nº {{car}}, embora não apresente passivos ambientais próprios, encontrava-se bloqueada em razão de risco de triangulação com embargo do IBAMA associado ao imóvel registrado no CAR nº {{car2}}, vinculado ao produtor.

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, embora não apresente passivos ambientais próprios, encontrava-se bloqueada em razão do risco de triangulação com embargo da SEMA-MT em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}), proprietário da área.

</details>

##### `h089` · Área bloqueada por triangulação com embargo Ibama
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 7
- **palavrasChave:** ibama, embargo, triangulação, embargo ibama, possuir, possua
- **seguintes:** `h209` (29%), `emb-iso` (29%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, embora não possua passivos, encontra-se bloqueada por possuir risco de triangulação com embargo Ibama na área registrada no CAR {{car2}}.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área encontra-se bloqueada por possuir risco de triangulação com embargo Ibama ponto em nome de {{nome}} (CPF: {{docNumero}}) e {{nomeTerceiro}} (CPF: {{docTerceiro}}).

</details>

##### `h096` · Embargo Ibama ativo no CPF/CNPJ – polígonos isolados
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 6
- **palavrasChave:** ibama, embargo, isolado, cultivo de grãos, embargo ibama, ativo, polígonos, isolados
- **seguintes:** `h164` (67%)

> {{Sujeito}} possui embargo ativo do Ibama, vinculado ao seu {{doc}}, referente a área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}. Os polígonos embargados encontram-se devidamente isolados da área destinada ao cultivo de grãos.

##### `h102` · Embargo Ibama em empresa da qual o produtor é sócio
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 6
- **palavrasChave:** ibama, embargo, isolado, não isolado, cultivo de grãos, embargo ibama, sócio, administrador
- **seguintes:** `h247` (50%), `h251` (50%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, foi identificado um embargo do Ibama em nome da empresa {{nome}} (CNPJ: {{docNumero}}), da qual o produtor é sócio administrador. Esse embargo incide sobre área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, onde os polígonos embargados não estão isolados do plantio de grãos.

##### `h122` · Embargo Ibama no CPF/CNPJ – polígonos isolados (análise dos polígonos)
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** ibama, embargo, isolado, cultivo de grãos, embargo ibama, polígonos, isolados, interferência, estes
- **seguintes:** `h123` (60%), `h018` (40%)

> {{Sujeito}} possui embargo do Ibama vinculado ao seu {{doc}}, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}. Pela análise dos polígonos embargados, verificou-se que estes se encontram devidamente isolados da área destinada ao plantio de grãos, não causando interferência direta na atividade agrícola em avaliação.

##### `h154` · Situação da área – foi identificado embargo ativo pelo ICMBio em nome do produtor, em área…
- **bloco:** 2 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** icmbio, embargo, isolado, cultivo de grãos, embargo ibama, ativo, nome, além
- **seguintes:** `h229` (75%)

> Além disso, foi identificado embargo ativo pelo ICMBio em nome do produtor, em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, que encontra-se devidamente isolado do plantio de grãos.

##### `h161` · Identificação – cliente sem restrição no CPF/CNPJ. No entanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** ibama, sema-mt, triangulação, embargo ibama, ambos, ativos, propriedades, junto
- **seguintes:** —

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} (CAR {{car}}), encontra-se bloqueada devido ao risco de triangulação com propriedades de {{nomeTerceiro}}, ambos com passivos ambientais ativos junto ao Ibama e à Sema-MT.

##### `h173` · Situação da área – a área indicada para a presente análise está localizada no município de…
- **bloco:** 2 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** embargo, embargo ibama, quaisquer, embargos, natureza, apresenta
- **seguintes:** `cap-uf` (100%)

> A área indicada para a presente análise está localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}, e não apresenta passivos ambientais, embargos ou quaisquer bloqueios de natureza socioambiental.

##### `h188` · Embargo Ibama no CPF/CNPJ do tipo ponto
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** ibama, embargo, embargo ibama, ponto, relacionado
- **seguintes:** —

> {{Sujeito}} possui um embargo Ibama em seu {{doc}}, relacionado a uma área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, mas trata-se de um embargo ponto.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui embargo Ibama em seu {{doc}}, em área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, mas trata-se de embargo ponto.

</details>

##### `h191` · Área bloqueada por sobreposição com embargo Semad-GO
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** semad-go, embargo, sobreposição, embargo ibama, embargada, devido
- **seguintes:** `h006` (50%), `h013` (50%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}}, registrada no CAR {{car}}, encontra-se bloqueada devido à sobreposição com área embargada pela Semad-GO.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}}, registrada no CAR {{car}}, encontra-se bloqueada devido à identificação de risco de triangulação com embargo ambiental do Ibama.

</details>

##### `h215` · Identificação – o cliente possui um embargo do Ibama vinculado ao seu CPF/CNPJ, referente à…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, embargo ibama, ponto, trata-se
- **seguintes:** —

> {{Sujeito}} possui um embargo do Ibama vinculado ao seu {{doc}}, referente à área indicada para análise e desbloqueio. No entanto, trata-se de um embargo ponto.

##### `h228` · Identificação – o cliente não possui passivos ambientais vinculados ao seu CPF/CNPJ. No…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, isolado, não isolado, assentamento, cultivo de grãos, embargo ibama, vinculados, agrária, incra
- **seguintes:** —

> {{Sujeito}} não possui passivos ambientais vinculados ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR sob o número {{car}}, apresenta embargo do Ibama em nome do Instituto Nacional de Colonização e Reforma Agrária (INCRA). Esse embargo abrange toda a área e não está isolado da atividade de plantio de grãos.

##### `h241` · Identificação – cliente sem restrição no CPF/CNPJ. Contudo, a área localizada em, registrada no…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, família/terceiros, embargo ibama, irmão, proprietário, número, nome
- **seguintes:** `h242` (100%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área localizada em {{municipioEmbargo}}, registrada no CAR sob o número {{carEmbargo}},apresenta embargo do Ibama em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}), irmão do produtor e também proprietário da área.

##### `h249` · Situação da área – no presente chamado, está sendo indicada a área localizada em, registrada no…
- **bloco:** 2 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo, embargo ibama, restrita, situada, mencionada, apresenta
- **seguintes:** `h250` (100%)

> No presente chamado, está sendo indicada a área localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, que não apresenta passivos ambientais e está situada aproximadamente {{distancia}} km da área restrita mencionada.

##### `h260` · Identificação – cliente sem restrição no CPF/CNPJ. No entanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, sema-mt, embargo, triangulação, assentamento, passivo de terceiros, embargo ibama, pertencentes, associados
- **seguintes:** `h058` (67%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, embora não apresente passivos ambientais próprios, encontrava-se bloqueada devido ao risco de triangulação com áreas embargadas pelo Ibama e pela Sema-MT, vinculadas ao CAR {{car2}}.O CAR {{car2}} corresponde a uma área de assentamento, dentro da qual o CAR do produtor está inserido. Assim, o bloqueio identificado decorre exclusivamente de passivos ambientais pertencentes a terceiros, associados ao assentamento, e não do produtor ou de sua área específica.

##### `h263` · Situação da área – a área indicada para análise, localizada no município de, registrada no CAR nº…
- **bloco:** 2 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo ibama, apresenta
- **seguintes:** —

> A área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, não apresenta passivos ambientais nem bloqueios.

##### `h264` · Identificação – o cliente possui embargo do IBAMA vinculado ao seu CPF/CNPJ, incidente…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, embargo ibama, justamente, incidente
- **seguintes:** `emb-iso` (67%)

> {{Sujeito}} possui embargo do IBAMA vinculado ao seu {{doc}}, incidente justamente sobre a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR {{car}}.

##### `h265` · Identificação – o cliente encontrava-se bloqueado no sistema ADMBR devido à identificação de um…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, admbr, embargo ibama, identificação, possível, sistema
- **seguintes:** `h143` (100%)

> {{Sujeito}} encontrava-se bloqueado no sistema ADMBR devido à identificação de um possível embargo Ibama. Contudo, após análise detalhada, não foram localizadas restrições ambientais ou quaisquer outros bloqueios que justificassem a manutenção do impedimento.

##### `h286` · Identificação – o cliente possui embargo do Ibama vinculado ao seu CPF/CNPJ, incidente na…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, embargo ibama, própria, incidente
- **seguintes:** —

> {{Sujeito}} possui embargo do Ibama vinculado ao seu {{doc}}, incidente na própria área indicada para análise e solicitação de desbloqueio, localizada no município de {{municipio}}, registrada no CAR nº {{car}}.

##### `h291` · Identificação – o cliente possui embargo do IBAMA vinculado ao seu CPF/CNPJ, incidente sobre…
- **bloco:** 1 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, embargo ibama, incidente, municípios, cars
- **seguintes:** —

> {{Sujeito}} {{nome}} possui embargo do IBAMA vinculado ao seu {{doc}}, incidente sobre áreas localizadas nos municípios de {{municipioEmbargo}} e {{municipioEmbargo2}}, registradas nos CARs nº {{carEmbargo}}, {{carEmbargo2}}, {{carEmbargo3}}, {{carEmbargo4}}, {{carEmbargo5}}, {{carEmbargo6}}, {{carEmbargo7}} e {{carEmbargo8}}.


#### Tema: PRODES 2020 (157 usos)

##### `h003` · PRODES 2020 – cliente sem restrição; área bloqueada por desmatamento PRODES/INPE após 2020
- **bloco:** 1 · **tema:** PRODES 2020 · **usos:** 154
- **palavrasChave:** prodes, prodes 2020, prodes/inpe, desmatamento, ocorrido, base
- **seguintes:** `h002` (97%), `h011` (1%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada devido à identificação de desmatamento pela base PRODES/INPE, ocorrido após 2020.

<details><summary>Variações de redação (1)</summary>

> A área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, encontra-se bloqueada em razão da identificação de desmatamento pela base PRODES/INPE, ocorrido após o ano de 2020.

</details>

##### `h266` · Identificação – cliente sem restrição no CPF/CNPJ. Entretanto, as áreas indicadas para análise…
- **bloco:** 1 · **tema:** PRODES 2020 · **usos:** 3
- **palavrasChave:** prodes, embargo, prodes 2020, ocorrido, bloqueadas, base, prodes/inpe
- **seguintes:** `h002` (100%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, as áreas indicadas para análise, localizadas em {{municipioEmbargo}} e registradas nos CARs {{carEmbargo}} e {{carEmbargo2}}, encontram-se bloqueadas devido à identificação de desmatamento pela base PRODES/INPE, ocorrido após 2020.


#### Tema: Prospecção de clientes (149 usos)

##### `h008` · Prospecção – abertura (CPF do produtor, áreas Serasa e área indicada)
- **bloco:** 1 · **tema:** Prospecção de clientes · **usos:** 107
- **palavrasChave:** serasa, prospecção, prospecção de clientes, cadastradas, abrangendo, abertura
- **seguintes:** `h030` (14%), `id-limpo` (12%), `h049` (8%), `h013` (7%)

> Conclusão da análise realizada no CPF do produtor {{nome}} (CPF: {{docNumero}}), abrangendo as áreas cadastradas na plataforma Serasa até a presente data e a área indicada pela solicitante.

##### `h030` · Cliente e área sem passivos (redação curta)
- **bloco:** 2 · **tema:** Prospecção de clientes · **usos:** 20
- **palavrasChave:** prospecção de clientes, redação, curta, apresenta
- **seguintes:** `h013` (25%)

> {{Sujeito}} não possui restrições ambientais em seu {{doc}}, assim como a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, também não apresenta passivos ambientais.

##### `h081` · Moratória da Soja – cliente consta na lista
- **bloco:** 1 · **tema:** Prospecção de clientes · **usos:** 7
- **palavrasChave:** moratória da soja, embargo, prospecção de clientes, lista, consta
- **seguintes:** `h147` (43%)

> {{Sujeito}} consta na Lista da Moratória da Soja em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

##### `h082` · Ficha da área (CAR, status, localização, proprietário)
- **bloco:** 2 · **tema:** Prospecção de clientes · **usos:** 7
- **palavrasChave:** status do car, prospecção de clientes, localização, proprietário, ficha
- **seguintes:** `h012` (29%)

> CAR {{car}}  
> Status: Ativo  
> Localização: {{municipio}}  
> Proprietário: {{nomeTerceiro}} (CPF: {{docTerceiro}})

##### `h317` · Situação da área – a área indicada para análise encontra-se bloqueada em razão da identificação de…
- **bloco:** 2 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** prodes, prospecção de clientes, identificação, período, posterior, ocorrência
- **seguintes:** `prodes-1` (100%)

> Entretanto, a área indicada para análise encontra-se bloqueada em razão da identificação de desmatamento na base PRODES/INPE em camada de soja, com ocorrência em período posterior a 2025.

##### `h319` · Identificação – o cliente não possui restrições ou passivos ambientais vinculados ao seu…
- **bloco:** 1 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** prospecção de clientes, vinculados, nome, cpf/cnpj
- **seguintes:** `cap-uf` (67%)

> {{Sujeito}} {{nome}} não possui restrições ou passivos ambientais vinculados ao seu {{doc}}.

- `id-pvg-lar` **Restrição PVG vinculada ao CPF/CNPJ** — 1 usos · já existe (`TX.idPvgLar`) · seguintes: —
- `id-pvg` **Desmatamento PVG na própria área (Pará)** — 1 usos · já existe (`TX.idPvg`) · seguintes: —

#### Tema: Sem CAR (52 usos)

- `tf-reenq` **Reenquadramento de cliente DIRETO para INDIRETO** — 52 usos · já existe (`TX.reenqId, TX.reenq2, TX.reenq3, TX.reenq4`) · seguintes: `tf-reenq-car` (100%)

#### Tema: Cultivo inferior a 10% (37 usos)

- `id-cultivo` **Ausência de comprovação de 10% de cultivo** — 16 usos · já existe (`TX.idCultivo`) · seguintes: `h072` (25%), `cultivo-sat` (25%), `cap-uf` (19%)

##### `h080` · Cultivo inferior a 10% – área arrendada de terceiro
- **bloco:** 1 · **tema:** Cultivo inferior a 10% · **usos:** 8
- **palavrasChave:** cultivo de grãos, 10% de cultivo, arrendamento, cultivo inferior a 10%, arrendada, terceiro
- **seguintes:** `cap-uf` (38%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, por ele arrendada e de propriedade de {{nomeTerceiro}} (CPF nº {{docTerceiro}}), localizada em {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão do apontamento de inexistência de, no mínimo, 10% da área destinada ao cultivo de grãos.

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}, encontra-se bloqueada por apontamento de inexistência de no mínimo 10% de área destinada ao cultivo de grãos.

> {{Sujeito}} {{nome}} não possui restrições socioambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, por ele explorada e de propriedade de {{nomeTerceiro}} (CPF nº {{docTerceiro}}), localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em decorrência da identificação de inconformidade relacionada à ausência de, no mínimo, 10% da área destinada ao cultivo de grãos.

</details>

##### `h114` · Cultivo inferior a 10% – apontamento no imóvel
- **bloco:** 1 · **tema:** Cultivo inferior a 10% · **usos:** 6
- **palavrasChave:** cultivo de grãos, 10% de cultivo, cultivo inferior a 10%, apontamento, imóvel, possuiria, indicando
- **seguintes:** `cap-uf` (50%), `h199` (50%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR {{car}}, encontrava-se bloqueada em razão de apontamento indicando que o imóvel não possuiria o percentual mínimo de 10% de área destinada ao cultivo de grãos.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada no município de {{municipio}} e registrada sob o CAR nº {{car}}, encontrava-se bloqueada em razão de apontamento relacionado à inexistência do percentual mínimo de 10% de área destinada ao cultivo de grãos.

</details>

##### `h181` · Identificação – cliente sem restrição no CPF/CNPJ. No entanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** cultivo de grãos, 10% de cultivo, cultivo inferior a 10%, socioambientais, destinado, percentual, mínimo
- **seguintes:** —

> {{Sujeito}} {{nome}} não possui restrições socioambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR {{car}}, encontrava-se bloqueada em razão de apontamento de ausência do percentual mínimo de 10% da área destinado ao cultivo de grãos.

##### `h304` · Situação da área – a área indicada para análise também está localizada em, registrada no CAR…
- **bloco:** 2 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** embargo, cultivo de grãos, 10% de cultivo, cultivo inferior a 10%, mínimo, apontamento, inexistência, destinada
- **seguintes:** —

> A área indicada para análise também está localizada em {{municipioEmbargo}}, registrada no CAR {{car}} encontra-se bloqueada em razão do apontamento de inexistência de, no mínimo, 10% da área destinada ao cultivo de grãos.


#### Tema: Bloqueio manual sem motivo (29 usos)

##### `h023` · Bloqueio manual no ADMBR sem justificativa registrada
- **bloco:** 1 · **tema:** Bloqueio manual sem motivo · **usos:** 25
- **palavrasChave:** admbr, bloqueio manual sem motivo, justificativa, sistema
- **seguintes:** `h025` (88%)

> {{Sujeito}} encontrava-se bloqueado no sistema ADMBR sem qualquer justificativa registrada.

##### `h192` · Situação da área – em análise, não foram identificadas restrições ou bloqueios ambientais…
- **bloco:** 2 · **tema:** Bloqueio manual sem motivo · **usos:** 4
- **palavrasChave:** bloqueio manual sem motivo, identificadas, vinculados
- **seguintes:** `h009` (50%)

> Em análise, não foram identificadas restrições ou bloqueios ambientais vinculados ao CPF do produtor e da área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}}.

<details><summary>Variações de redação (1)</summary>

> Após análise, não foram identificadas restrições ou bloqueios ambientais vinculados ao seu {{doc}}, tampouco à área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}.

</details>


#### Tema: Protocolo Verde dos Grãos (PVG-PA) (25 usos)

##### `h050` · PVG – restrição no CPF/CNPJ por desmatamento acima do limite
- **bloco:** 1 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 11
- **palavrasChave:** pvg, embargo, protocolo verde dos grãos (pvg-pa), limite, desmatamento, decorrência
- **seguintes:** `pvg-reg` (45%), `h011` (18%)

> {{Sujeito}} {{nome}} possui restrições ambientais vinculadas ao seu {{doc}} junto ao Protocolo Verde de Grãos do Pará (PVG), em decorrência de desmatamento acima do limite permitido, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}.

<details><summary>Variações de redação (3)</summary>

> {{Sujeito}} possui restrições ambientais vinculadas ao seu {{doc}} junto ao Protocolo Verde de Grãos do Pará (PVG), em decorrência de desmatamento superior ao permitido, incidente sobre área localizada no município deSanta Maria das {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}.

> {{Sujeito}} possui restrições ambientais vinculadas ao seu {{doc}} no âmbito do Protocolo Verde de Grãos do Pará (PVG), decorrentes de desmatamento acima do limite permitido, incidente sobre áreas localizadas no município de {{municipioEmbargo}}, registradas nos seguintes CARs:  
> {{car}}  
> {{car2}}

> {{Sujeito}} {{nome}} possui restrição vinculada ao seu {{doc}} junto ao Protocolo Verde dos Grãos do Pará (PVG), decorrente de desmatamento acima do limite permitido em área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}.

</details>

##### `h115` · PVG – restrição no CPF/CNPJ por CAR cancelado
- **bloco:** 1 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 6
- **palavrasChave:** pvg, embargo, car suspenso/cancelado, status do car, protocolo verde dos grãos (pvg-pa), decorrência, consta
- **seguintes:** `cap-uf` (50%)

> {{Sujeito}} {{nome}} possui restrição ambiental vinculada ao seu {{doc}} junto ao Protocolo Verde dos Grãos do Pará (PVG) em decorrência de área localizada no município de {{municipioEmbargo}}, registrada sob o CAR {{carEmbargo}}, que consta com status "Cancelado".

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui restrição associada ao Protocolo Verde dos Grãos do Pará (PVG) vinculada ao seu {{doc}} em razão de área localizada no município de {{municipioEmbargo}}, registrada sob o CAR {{carEmbargo}}, a qual consta com status "Cancelado".

</details>

##### `h166` · Identificação – cliente sem restrição no CPF/CNPJ. Contudo, a área indicada para análise…
- **bloco:** 1 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 4
- **palavrasChave:** pvg, protocolo verde dos grãos (pvg-pa), associado, pará, apontamento
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, encontrava-se bloqueada, em razão de apontamento de restrição associado ao Protocolo Verde de Grãos do Pará (PVG).

##### `h194` · Identificação – o cliente possui restrições ambientais vinculadas ao seu CPF/CNPJ junto ao…
- **bloco:** 1 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 4
- **palavrasChave:** pvg, embargo, protocolo verde dos grãos (pvg-pa), aoprotocolo, junto, decorrentes
- **seguintes:** `cap-uf` (50%)

> {{Sujeito}} possui restrições ambientais vinculadas ao seu {{doc}} junto ao Protocolo Verde de Grãos do Pará (PVG), decorrentes de desmatamento superior ao permitido, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR nº {{carEmbargo}}, a qual é a própria área indicada para a presente análise.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} possui restrições ambientais vinculadas ao seu {{doc}} junto ao Protocolo Verde de Grãos do Pará (PVG), decorrentes de desmatamento superior ao permitido, incidente sobre área localizada no município de {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}, a qual, inclusive, consta entre as áreas inicialmente indicadas para análise.

</details>


#### Tema: CAR Suspenso/Cancelado (24 usos)

##### `h062` · CAR Suspenso – área bloqueada pelo status do CAR
- **bloco:** 1 · **tema:** CAR Suspenso/Cancelado · **usos:** 9
- **palavrasChave:** car suspenso/cancelado, status do car, constar
- **seguintes:** `car-bcb` (78%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}} encontra-se bloqueada em razão do CAR constar com status "Suspenso".

<details><summary>Variações de redação (2)</summary>

> A área indicada para análise, localizada no município de {{municipio}} e registrada no CAR {{car}}, encontra-se bloqueada em razão de constar com status "Suspenso".

> {{Sujeito}} {{nome}} não possui restrições socioambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontra-se com status "Suspenso".

</details>

##### `h125` · CAR Suspenso – área bloqueada (solicitação de desbloqueio)
- **bloco:** 1 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, status do car, solicitação, desbloqueio
- **seguintes:** `h126` (80%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada para análise e solicitação de desbloqueio, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, encontra-se bloqueada, uma vez que o referido CAR está com status “Cancelado”.

##### `h131` · Identificação – cliente sem restrição no CPF/CNPJ. Contudo, a área indicada no chamado…
- **bloco:** 1 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, status do car, clifor, consta, cadastro, nome
- **seguintes:** `h107` (100%)

> {{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Contudo, a área indicada no chamado, localizada no município de {{municipio}} e registrada no CAR {{car}}, encontra-se atualmente bloqueada, uma vez que o status do cadastro consta como “Suspenso”.

##### `h135` · CAR Suspenso – área bloqueada (com Resolução BCB)
- **bloco:** 1 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, status do car, resolução bcb 140, contraria, central
- **seguintes:** `h014` (100%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}}, registrada no CAR nº {{car}}, encontra-se atualmente bloqueada em razão do status “Suspenso” do CAR, o que contraria as diretrizes estabelecidas pela política interna da companhia e pela Resolução BCB nº 140/2021, do Banco Central do Brasil, a qual veda a concessão de crédito rural a imóveis que apresentem pendências socioambientais dessa natureza.


#### Tema: CSA Cerrado (21 usos)

##### `h028` · CSA Cerrado – sobreposição com protocolo ainda não vigente na política
- **bloco:** 1 · **tema:** CSA Cerrado · **usos:** 21
- **palavrasChave:** csa cerrado, sobreposição, vigente, protocolo
- **seguintes:** `h006` (71%), `h009` (10%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise encontra-se bloqueada em razão de possuir sobreposição com CSA Cerrado, protocolo ainda não vigente na política da empresa.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais em seu {{doc}}. A propriedade está bloqueada na plataforma Serasa em razão de possuir sobreposição com CSA Cerrado, protocolo ainda não vigente na política da empresa.

</details>


#### Tema: Não há restrições (19 usos)

##### `h053` · Cliente e área sem passivos (município e CAR)
- **bloco:** 1 · **tema:** Não há restrições · **usos:** 10 · universal
- **palavrasChave:** não há restrições, apresenta
- **seguintes:** `h006` (20%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}, assim como a área indicada para análise, localizada em {{municipio}}, registrada no CAR {{car}} não apresenta passivos.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais, assim como a área indicada para análise não apresenta passivos.

</details>

##### `h237` · Identificação – cliente sem restrição no CPF/CNPJ, assim como as áreas indicadas não apresentam…
- **bloco:** 1 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** não há restrições, bloqueadas, apresentam, cpf/cnpj
- **seguintes:** `h157` (100%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}, assim como as áreas indicadas não apresentam passivos ambientais e não estão bloqueadas.

##### `h254` · Situação da área – a produtora e a área indicada para análise não apresentam restrições ou…
- **bloco:** 2 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** não há restrições, apresentam
- **seguintes:** `h004` (100%)

> A produtora e a área indicada para análise não apresentam restrições ou bloqueios ambientais.

##### `h282` · Identificação – cliente sem restrição no CPF/CNPJ. Entretanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** ibama, embargo, triangulação, admbr, não há restrições, apareceu, equivocada, vínculo, incidente
- **seguintes:** `h283` (100%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR {{car}}, encontrava-se bloqueada devido ao risco de triangulação com embargo do Ibama em nome de {{nomeTerceiro}}, incidente na área registrada no CAR {{car2}}.O solicitante do chamado, {{nomeTerceiro2}}, informou que o vínculo entre as áreas foi realizado de forma equivocada, motivo pelo qual o bloqueio apareceu no sistema.


#### Tema: Enquadramento direto/indireto (14 usos)

##### `h084` · Enquadramento – empresa DIRETO que é revendedora (comércio atacadista)
- **bloco:** 1 · **tema:** Enquadramento direto/indireto · **usos:** 7
- **palavrasChave:** enquadramento direto/indireto, revendedora, comércio, atacadista
- **seguintes:** `h032` (100%)

> {{Sujeito}} {{nome}} está atualmente classificada como cliente DIRETO. No entanto, após análise, foi constatado que sua atividade principal é o comércio atacadista de soja, atuando como revendedora, sem vínculo direto com a produção da commodity.

##### `h155` · Enquadramento – pessoa física DIRETO precisa apresentar CAR dos endereços
- **bloco:** 1 · **tema:** Enquadramento direto/indireto · **usos:** 4
- **palavrasChave:** cultivo de grãos, enquadramento direto/indireto, clifor, pessoa, endereços, física
- **seguintes:** `h156` (100%)

> {{Sujeito}} {{nome}}, cliente pessoa física, enquadra-se como fornecedor DIRETO, conforme as diretrizes internas. Nessa condição, é imprescindível a apresentação do Cadastro Ambiental Rural (CAR) referente aos seus endereços secundários, ou seja, às áreas destinadas à formação de lavoura.

##### `h280` · Identificação – o cliente possui como atividade principal o Comércio atacadista de defensivos…
- **bloco:** 1 · **tema:** Enquadramento direto/indireto · **usos:** 3
- **palavrasChave:** cultivo de grãos, enquadramento direto/indireto, comércio, atacadista, agrícolas, atividades
- **seguintes:** `h038` (100%)

> {{Sujeito}} {{nome}} possui como atividade principal o Comércio atacadista de defensivos agrícolas, adubos, fertilizantes e corretivos do solo. Entre suas atividades secundárias constam: Serviço de preparação de terreno, cultivo e colheita, Atividades de apoio à agricultura não especificadas anteriormente, Atividades de pós-colheita, Representantes comerciais e agentes do comércio de matérias-primas agrícolas e animais vivos, Comércio atacadista de soja, Comércio atacadista de sementes, flores, plantas e gramas, Comércio atacadista de matérias-primas agrícolas não especificadas anteriormente, Comércio atacadista de cereais e leguminosas beneficiados.


#### Tema: Unidade de Conservação (6 usos)

##### `h112` · Unidade de Conservação – área bloqueada por sobreposição (ha)
- **bloco:** 1 · **tema:** Unidade de Conservação · **usos:** 6
- **palavrasChave:** unidade de conservação, sobreposição, silvestre
- **seguintes:** `h261` (50%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. Entretanto, a área indicada para análise, localizada em {{municipio}}, registrada no CAR nº {{car}}, encontrava-se bloqueada em razão da sobreposição de {{areaHa}} hectares com a Unidade de Conservação Refúgio de Vida Silvestre.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada em {{municipio}} e registrada no CAR nº {{car}}, encontra-se bloqueada devido à sobreposição com a Unidade de Conservação - Refúgio de Vida Silvestre Estadual dos Rios Tijuco e da Prata.

</details>


#### Tema: Embargo Semad-GO (6 usos)

##### `h202` · Identificação – cliente sem restrição no CPF/CNPJ. No entanto, a área indicada para análise…
- **bloco:** 1 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** semad-go, embargo, embargo semad-go, ativo, nome, apresenta
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, apresenta embargo ativo da SEMAD-GO em nome de {{nomeTerceiro}}

##### `h296` · Identificação – o cliente possui embargos do IBAMA e da SEMA-MT vinculados ao seu CPF/CNPJ…
- **bloco:** 1 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** ibama, sema-mt, embargo, embargo semad-go, incidentes, embargos, vinculados
- **seguintes:** `op-hedge` (67%)

> {{Sujeito}} possui embargos do IBAMA e da SEMA-MT vinculados ao seu {{doc}}, incidentes sobre áreas localizadas no estado do {{uf}}.


#### Tema: Moratória da Soja (3 usos)

##### `h227` · Situação da área – diante desse cenário, não recomendamos a negociação da commodity soja com este…
- **bloco:** 2 · **tema:** Moratória da Soja · **usos:** 3
- **palavrasChave:** 150 km, moratória da soja, cenário, commodity, recomendamos, negociação
- **seguintes:** `h086` (100%)

> Diante desse cenário, não recomendamos a negociação da commodity soja com este produtor, tanto na área indicada quanto em outras localizadas a menos de 150 km da restrição.


#### Tema: Terra Indígena/Quilombola (1 usos)

- `id-ti` **Sobreposição com Terra Indígena “Declarada”** — 1 usos · já existe (`TX.idTI`) · seguintes: —

### 3 – Fundamentação

#### Tema: Geral (103 usos)

- `emb-iso` **Embargo isolado da área de cultivo** — 31 usos · já existe (`TX.embIsolado`) · seguintes: `cap-uf` (23%), `op-hedge` (6%), `h018` (6%)
- `tf-nova-area` **Embargo em nova área indicada – não isolado do cultivo (com conclusão)** — 28 usos · já existe (`TX.novaArea1, TX.novaArea2, TX.novaArea3, TX.novaArea4, TX.novaArea5, TX.novaArea6, TX.novaArea7, TX.novaArea8, TX.novaArea9`) · seguintes: `tf-art54` (19%), `h303` (8%), `op-hedge` (8%)
- `tf-art54` **Embargo não isolado – multa do art. 54 do Decreto nº 6.514/2008** — 17 usos · já existe (`TX.art54Intro, TX.art54Texto, TX.art54Pena`) · seguintes: `tf-nova-area` (62%)

##### `h051` · PRODES após 2020 – orientação de SP (redação alternativa)
- **bloco:** 3 · **tema:** Geral · **usos:** 11 · universal
- **palavrasChave:** prodes, sustentabilidade sp, e-mail anexo, orientação, alternativa, posterior, tema
- **seguintes:** `h075` (27%), `h027` (18%), `h034` (18%)

> Quanto à identificação de desmatamento pela base PRODES/INPE, posterior a 2020, o tema permanece em discussão pela liderança. O time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que o protocolo seja desconsiderado até que haja deliberação formal da alta gestão (orientação em anexo).

<details><summary>Variações de redação (3)</summary>

> Quanto à sobreposição com desmatamento identificado pela base PRODES/INPE, ocorrido após 2020, trata-se de questão ainda em discussão pela liderança. O time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que o protocolo seja desconsiderado até que haja decisão formal da alta gestão (orientação em anexo). Dessa forma, tal apontamento não constitui impedimento para manutenção do bloqueio.

> Quanto à identificação de desmatamento pós-2020 pelo PRODES/INPE, o tema permanece em discussão pela liderança. A equipe de Sustentabilidade São Paulo, representada por {{responsavelSP}}, orientou que o protocolo seja desconsiderado até deliberação formal da alta gestão (orientação em anexo).

> Com relação ao desmatamento identificado pelo PRODES/INPE após 2020, o tema permanece em discussão pela liderança. O time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que esse protocolo seja temporariamente desconsiderado até que haja decisão formal da alta gestão (orientação anexa).

</details>

- `prodes-2` **PRODES – Política Global (compromisso voluntário)** — 7 usos · já existe (`TX.prodesPolitica`) · seguintes: `prodes-3` (71%)

##### `h201` · Fundamentação – o desbloqueio visa o cumprimento do contrato fixo nº, firmado em
- **bloco:** 3 · **tema:** Geral · **usos:** 3
- **palavrasChave:** contrato, família/terceiros, cumprimento, visa, firmado
- **seguintes:** —

> O desbloqueio visa o cumprimento do contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}.

##### `h259` · Fundamentação – encerrado por falta de informação
- **bloco:** 3 · **tema:** Geral · **usos:** 3
- **palavrasChave:** chamado encerrado, falta, informação
- **seguintes:** —

> Encerrado por falta de informação.

##### `h301` · Fundamentação – desbloqueado nos termos do chamado
- **bloco:** 3 · **tema:** Geral · **usos:** 3
- **palavrasChave:** termos, desbloqueado
- **seguintes:** —

> Desbloqueado nos termos do chamado {{chamado}}.

- `lar-venc` **LAR vencido apresentado** — 0 usos · já existe (`TX.larVencido`) · seguintes: —
- `lar-120` **LAR – renovação com 120 dias (LC 140/2011 e CONAMA 237/1997)** — 0 usos · já existe (`TX.lar120`) · seguintes: —
- `lar-efic` **LAR – perda de eficácia** — 0 usos · já existe (`TX.larEficacia`) · seguintes: —
- `lar-sanc` **LAR – atividade sem licenciamento** — 0 usos · já existe (`TX.larSancoes`) · seguintes: —
- `fund-base` **Fundamentação – a redigir (modelo-base)** — 0 usos · já existe (`TX.fundBase`) · seguintes: —

#### Tema: Não há restrições (198 usos)

##### `h007` · Status desatualizado – resolvido com “Buscar Status Propriedade”
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 119
- **palavrasChave:** status do car, buscar status propriedade, não há restrições, resolvido
- **seguintes:** `h004` (72%), `h001` (9%), `h064` (4%)

> O impedimento identificado estava relacionado à ausência de atualização do status da propriedade, o que foi resolvido por meio da funcionalidade "Buscar Status Propriedade".

<details><summary>Variações de redação (1)</summary>

> O CAR {{car}} não apresenta bloqueios na plataforma Serasa nem no sistema ADMBR. O impedimento identificado estava relacionado à ausência de atualização do status da propriedade, que foi resolvido ao acionar o botão "Buscar Status Propriedade".

</details>

##### `h010` · Clifor e CAR sem bloqueios na Serasa e no ADMBR
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 62
- **palavrasChave:** serasa, admbr, clifor, não há restrições, plataforma
- **seguintes:** `h007` (65%), `h004` (35%)

> O clifor do produtor e o CAR {{car}} não apresentam bloqueios na plataforma Serasa nem no sistema ADMBR.

<details><summary>Variações de redação (1)</summary>

> O clifor da empresa e o CAR {{car}} não apresentam bloqueios na plataforma Serasa nem no sistema ADMBR, visto que foram desbloqueado em ocasião anterior (chamado {{chamado}})

</details>

##### `h157` · CORP_F0285 – bloqueio por pendência de processamento da consulta
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 4
- **palavrasChave:** status do car, admbr, não há restrições, pendência, f0285, consulta, corp
- **seguintes:** `h158` (100%)

> No sistema CORP_F0285, o status constava como bloqueado devido à pendência de processamento da consulta.

##### `h158` · Processamento manual para regularizar (sem passivos)
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 4
- **palavrasChave:** não há restrições, manual, processamento, regularizar, situação
- **seguintes:** —

> Considerando que não foram identificados passivos ou bloqueios, foi realizado o processamento manual para regularização da situação.

##### `h244` · Fundamentação – atualmente, a plataforma Serasa está enfrentando instabilidades, o que tem…
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** status do car, serasa, admbr, não há restrições, impactado, enfrentando, instabilidades, processamento
- **seguintes:** `h245` (100%)

> Atualmente, a plataforma Serasa está enfrentando instabilidades, o que tem impactado o processamento dos dados. Por esse motivo, o status do CAR no sistema CORP_F0285 permanece como "PE - Consulta Pendente de Processamento".

##### `h246` · Fundamentação – em anexo, segue a evidência de conformidade do produtor e da área
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** e-mail anexo, em conformidade, não há restrições, evidência, segue
- **seguintes:** —

> Em anexo, segue a evidência de conformidade do produtor e da área.

##### `h283` · Fundamentação – após a correção do vínculo e confirmada a natureza equivocada da associação…
- **bloco:** 3 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** família/terceiros, não há restrições, correção, confirmada, equivocada, associação
- **seguintes:** `h284` (100%)

> Após a correção do vínculo e confirmada a natureza equivocada da associação entre as áreas, verificou-se que não havia impedimentos reais aplicáveis ao CAR analisado.


#### Tema: PRODES 2020 (174 usos)

##### `h002` · PRODES 2020 – orientação de SP: desconsiderar o protocolo (tema em discussão)
- **bloco:** 3 · **tema:** PRODES 2020 · **usos:** 170
- **palavrasChave:** prodes, sustentabilidade sp, e-mail anexo, prodes 2020, tema, discussão, protocolo, orientação
- **seguintes:** `h005` (80%), `cap-uf` (5%), `h013` (4%), `h012` (2%)

> Esse tema, no entanto, ainda está em discussão pela liderança. O time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que o protocolo seja desconsiderado até que haja uma decisão formal da alta gestão (em anexo orientação).

<details><summary>Variações de redação (1)</summary>

> Contudo, esse tema ainda está sendo discutido pela liderança. O Time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, orientou que esse protocolo seja temporariamente desconsiderado até que haja decisão formal da alta gestão (orientação anexada).

</details>

##### `h167` · Fundamentação – que a aplicação desse critério ainda se encontra em discussão pela liderança. O…
- **bloco:** 3 · **tema:** PRODES 2020 · **usos:** 4
- **palavrasChave:** sustentabilidade sp, e-mail anexo, prodes 2020, liderança, discussão, aplicação, critério
- **seguintes:** `cap-uf` (50%)

> Ressalta-se, contudo, que a aplicação desse critério ainda se encontra em discussão pela liderança. O time de Sustentabilidade de São Paulo, representado por {{responsavelSP}}, orientou que o referido protocolo seja desconsiderado temporariamente, até que haja deliberação formal da alta gestão, conforme orientação anexada ao processo.


#### Tema: CAR Suspenso/Cancelado (154 usos)

##### `h014` · CAR – política: só status “Ativo” ou “Pendente” podem ser vinculados
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 48
- **palavrasChave:** car suspenso/cancelado, status do car, contrato, vincular, pendente, cars, ativo
- **seguintes:** `h036` (33%), `h127` (8%), `h019` (6%), `h287` (6%)

> Conforme nossa política, somente é possível vincular CARs com status “Ativo” ou “Pendente” aos contratos e realizar negociações em áreas que estejam regularizadas nesses termos. Portanto, não é permitido vincular CARs com status "Suspenso" e “Cancelado” às operações.

<details><summary>Variações de redação (5)</summary>

> De acordo com a política vigente, apenas CARs com status “Ativo” ou “Pendente” podem ser vinculados a contratos e utilizados para fins de negociação. Dessa forma, não é permitida a vinculação de CARs com status “Suspenso” ou “Cancelado” às operações.

> Conforme estabelecido em nossa política, somente é permitida a vinculação de CARs com status “Ativo” ou “Pendente” aos contratos, bem como a realização de negociações em áreas que estejam regularizadas nesses termos.

> De acordo com a política interna vigente, somente é permitida a vinculação de imóveis rurais com CAR em status “Ativo” ou “Pendente” às operações comerciais e financeiras da companhia. Dessa forma, não é autorizada a vinculação de CARs com status “Suspenso” ou “Cancelado” a novos contratos ou negociações.

> De acordo com a política interna, somente é permitida a vinculação de CARs com status “Ativo” ou “Pendente” às operações, sendo vedada a utilização de CARs com status “Suspenso” ou “Cancelado”.

> Conforme nossa política, somente podem ser vinculados aos contratos os CARs com status “Ativo” ou “Pendente”. Assim, não é permitida a vinculação de CARs com status “Suspenso” ou “Cancelado” a qualquer operação.

</details>

##### `h015` · CAR Suspenso – contraria a política interna e a Resolução BCB nº 140/2021
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 44
- **palavrasChave:** car suspenso/cancelado, status do car, resolução bcb 140, contraria, 140/2021, interna
- **seguintes:** `h014` (64%), `h016` (9%), `op-hedge` (5%)

> O CAR {{car}} encontra-se com o status SUSPENSO, o que contraria as diretrizes estabelecidas pela nossa política interna e pela Resolução BCB nº 140/2021, do Banco Central do Brasil, que veda a concessão de crédito rural a imóveis com pendências socioambientais dessa natureza.

- `car-bcb` **CAR Suspenso/Cancelado – política e Resolução BCB nº 140/2021** — 16 usos · já existe (`TX.carBcb`) · seguintes: `car-status` (75%)
- `car-status` **CAR – somente status Ativo ou Pendente** — 14 usos · já existe (`TX.carStatusPolitica`) · seguintes: `h109` (36%), `h178` (29%), `cap-uf` (14%)

##### `h107` · Fundamentação – como é amplamente conhecido, tal condição contraria as diretrizes estabelecidas…
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 6
- **palavrasChave:** resolução bcb 140, car suspenso/cancelado, amplamente, conhecido, contraria, condição
- **seguintes:** `h014` (83%)

> Como é amplamente conhecido, tal condição contraria as diretrizes estabelecidas pela política interna da companhia, bem como o disposto na Resolução BCB nº 140/2021, do Banco Central do Brasil, a qual veda a concessão de crédito rural a imóveis rurais com pendências socioambientais ou cadastrais dessa natureza.

##### `h110` · CAR Suspenso – em desacordo com a Política Socioambiental da ADM
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 6
- **palavrasChave:** car suspenso/cancelado, em conformidade, desacordo, política, adotados, rurais
- **seguintes:** `h111` (83%)

> Tal condição está em desacordo com as diretrizes estabelecidas pela Política Socioambiental da ADM e com os critérios internos adotados para a análise de conformidade de imóveis rurais.

##### `h111` · Fundamentação – conforme os procedimentos vigentes, apenas imóveis rurais com inscrição no…
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 6
- **palavrasChave:** contrato, clifor, car suspenso/cancelado, inscrição, procedimentos, rurais, vigentes
- **seguintes:** `h182` (67%)

> Conforme os procedimentos vigentes, apenas imóveis rurais com inscrição no Cadastro Ambiental Rural (CAR) em situação "Ativa" ou "Pendente" são considerados elegíveis para vinculação a contratos e operações comerciais.

##### `h126` · Fundamentação – tal situação contraria as diretrizes da política interna da companhia, bem como…
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, resolução bcb 140, clifor, contraria, interna, situação, rural
- **seguintes:** `h014` (80%)

> Tal situação contraria as diretrizes da política interna da companhia, bem como o disposto na Resolução BCB nº 140/2021, do Banco Central do Brasil, a qual veda a concessão de crédito rural a imóveis que apresentem pendências socioambientais, incluindo aqueles com Cadastro Ambiental Rural cancelado ou irregular.

##### `h127` · Fundamentação – não é permitida a vinculação de CARs com status “Cancelado” às operações
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, status do car, permitida, cars, vinculação
- **seguintes:** `h016` (40%)

> Dessa forma, não é permitida a vinculação de CARs com status “Cancelado” às operações.

##### `h198` · Fundamentação – a título informativo, a área em análise possui aproximadamente hectares de área…
- **bloco:** 3 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** cultivo de grãos, capacidade produtiva, car suspenso/cancelado, informativo, título, hectares, milho
- **seguintes:** `cap-uf` (50%)

> A título informativo, a área em análise possui aproximadamente {{areaProdutiva}} hectares de área produtiva destinada ao cultivo de milho.

<details><summary>Variações de redação (1)</summary>

> Por fim, a título informativo, a área registrada no CAR {{car}} possui aproximadamente {{areaProdutiva}} hectares de área produtiva, enquanto a área registrada no CAR {{car2}} possui aproximadamente {{areaProdutiva2}} hectares de área produtiva, totalizando {{areaProdutiva3}} hectares.

</details>


#### Tema: Embargo Ibama (112 usos)

##### `h029` · Imagens de satélite – polígono(s) embargado(s) isolado(s)
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 21
- **palavrasChave:** embargo, isolado, imagens de satélite, cultivo de grãos, embargo ibama, demonstrou, embargado
- **seguintes:** `h173` (19%), `cap-uf` (10%), `h011` (10%)

> A análise das imagens de satélite demonstrou que os polígonos embargados estão isolados da área destinada ao cultivo de grãos.

<details><summary>Variações de redação (1)</summary>

> A análise de imagens de satélite demonstrou que o polígono embargado encontra-se devidamente isolado da área destinada ao cultivo de grãos.

</details>

- `assent` **CAR de assentamento – passivos de terceiros** — 13 usos · já existe (`TX.assentamento`) · seguintes: `h058` (54%), `cap-uf` (15%)

##### `h065` · Embargo do tipo ponto – pode ser desconsiderado
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 9
- **palavrasChave:** embargo, embargo ibama, ponto, tipo, pode, desconsiderado
- **seguintes:** —

> Contudo, verificou-se que se trata de embargo do tipo ponto, o qual pode ser desconsiderado para fins de análise.

<details><summary>Variações de redação (1)</summary>

> No entanto, trata-se de embargo ponto, o que pode ser desconsiderado para fins de análise.

</details>

##### `h066` · Imagens de satélite – polígono embargado NÃO isolado
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 9
- **palavrasChave:** embargo, isolado, não isolado, imagens de satélite, cultivo de grãos, embargo ibama, embargado, polígono
- **seguintes:** —

> A partir da análise de imagens de satélite, constatou-se que o polígono embargado não se encontra isolado das áreas destinadas ao cultivo de grãos.

<details><summary>Variações de redação (1)</summary>

> Em análise das imagens de satélite, verificou-se que os polígonos embargados não se encontram isolados das áreas destinadas ao cultivo de grãos.

</details>

##### `h094` · Área que desejam liberar sem passivos
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 6
- **palavrasChave:** embargo, embargo ibama, desejam, liberar, liberação
- **seguintes:** `h006` (100%)

> A área que desejam a liberação está localizada em {{municipioEmbargo}} e não possui passivos ambientais.

##### `h105` · Assentamento – CAR do produtor inserido em assentamento (curto)
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 6
- **palavrasChave:** assentamento, embargo ibama, inserido, curto, dentro
- **seguintes:** `assent` (83%)

> O CAR {{car}} corresponde a uma área de assentamento, dentro da qual o CAR do produtor está inserido.

##### `h134` · Chamado aberto como URGENTE sem os campos obrigatórios
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** embargo ibama, campos, aberto, urgentes
- **seguintes:** `h172` (40%)

> O chamado foi aberto pelo fluxo “URGENTES - VEÍCULO AGUARDANDO LIBERAÇÃO”, entretanto, os campos específicos exigidos para esse tipo de operação não foram preenchidos, o que indica que a solicitação não se enquadra nos critérios de prioridade atribuídos a esse canal.

##### `h164` · Área bloqueada no sistema por risco de triangulação com o embargo citado
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** embargo, triangulação, admbr, embargo ibama, citado, sistema, risco
- **seguintes:** `h165` (100%)

> No entanto, consta bloqueada no sistema devido ao risco de triangulação relacionado ao embargo citado.

##### `h165` · Embargo isolado – cliente e área em conformidade
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** embargo, isolado, em conformidade, embargo ibama, corretamente, isolada, embargada
- **seguintes:** `h124` (100%)

> Considerando que a área embargada está corretamente isolada, tanto {{sujeito}} quanto a área analisada estão em conformidade ambiental para negociações.

##### `h229` · Fundamentação – a área atualmente indicada para análise e liberação, localizada em e registrada…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo, embargo ibama, liberação, apresenta
- **seguintes:** —

> A área atualmente indicada para análise e liberação, localizada em {{municipioEmbargo}} e registrada no CAR {{car}}, não apresenta passivos ambientais.

##### `h233` · Fundamentação – destaca-se que os polígonos embargados não estão isolados do cultivo agrícola…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo, isolado, não isolado, cultivo de grãos, embargo ibama, destaca-se, agrícola, embargados, polígonos
- **seguintes:** `h234` (100%)

> Destaca-se que os polígonos embargados não estão isolados do cultivo agrícola, sendo constatado o plantio de grãos dentro da área embargada.

##### `h234` · Fundamentação – é evidente o risco de triangulação de produto, bem como os potenciais impactos…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** triangulação, embargo ibama, potenciais, evidente, impactos, legais
- **seguintes:** `h235` (100%)

> Diante disso, é evidente o risco de triangulação de produto, bem como os potenciais impactos legais e reputacionais que essa operação pode acarretar para a companhia.

##### `h236` · Fundamentação – oriento a filial a verificar junto ao produtor se existe documentação, seja…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo, embargo ibama, oriento, existe, documentação, verificar
- **seguintes:** —

> Oriento a filial a verificar junto ao produtor se existe documentação, seja decisão judicial ou administrativa emitida pelo órgão ambiental competente, que suspenda ou revogue o embargo vigente.

##### `h242` · Fundamentação – considerando que os documentos apresentados correspondem a uma petição…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** documentos, família/terceiros, embargo ibama, petição, protocolada, correspondem, apresentados
- **seguintes:** `h240` (67%)

> Considerando que os documentos apresentados correspondem a uma petição protocolada no processo administrativo junto ao órgão ambiental, foi orientado que se verificasse com o produtor o andamento do processo, a fim de confirmar se já existe alguma decisão oficial nesse sentido.

##### `h248` · Fundamentação – após avaliação, o jurídico concluiu que a documentação apresentada não conferiu…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** e-mail anexo, embargo ibama, segurança, concluiu, conferiu, jurídico
- **seguintes:** `h249` (100%)

> Após avaliação, o jurídico concluiu que a documentação apresentada não conferiu segurança jurídica para efetuar o desbloqueio para negociações (conforme e-mail anexo).

##### `h250` · Fundamentação – considerando que essa área não possui restrições ambientais e atende ao raio…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, 150 km, em conformidade, embargo ibama, atende, mínimo, raio, nossa
- **seguintes:** `h009` (100%)

> Considerando que essa área não possui restrições ambientais e atende ao raio mínimo de 150 km em relação à área embargada pelo Ibama, conforme previsto em nossa política, ela está em conformidade para negociações.

##### `h251` · Fundamentação – ao emitir certidão de embargo no site oficial do Ibama é apontado "Nada…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** ibama, embargo, documentos, embargo ibama, site, emitir, nada, oficial
- **seguintes:** `h252` (100%)

> No entanto, ao emitir certidão de embargo no site oficial do Ibama é apontado "Nada Consta", assim como não é localizado qualquer passivo.

##### `h252` · Fundamentação – referida situação foi passada para o time de Sustentabilidade São Paulo, que…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** documentos, sustentabilidade sp, e-mail anexo, embargo ibama, passada, autorizou, paulo, situação
- **seguintes:** `h253` (100%)

> Referida situação foi passada para o time de Sustentabilidade São Paulo, que autorizou seguir com as negociações baseando-se na certidão (em anexo autorização).

##### `h268` · Fundamentação – por esse motivo, o clifor foi devidamente desbloqueado
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** clifor, desbloqueio realizado, embargo ibama, desbloqueado
- **seguintes:** —

> Por esse motivo, o clifor foi devidamente desbloqueado.

##### `h305` · Fundamentação – com o objetivo de validar a informação, foi realizada consulta na plataforma…
- **bloco:** 3 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** serasa, família/terceiros, embargo ibama, validar, informação, consulta
- **seguintes:** —

> Com o objetivo de validar a informação, foi realizada consulta na plataforma Serasa, por meio da qual foi confirmada a inexistência de restrições ambientais vinculadas ao CPF do produtor.

- `tf-ibama-doc` **Embargo IBAMA não isolado – documentação estadual não regulariza (com conclusão)** — 1 usos · já existe (`TX.ibamaDoc1, TX.ibamaDoc2, TX.ibamaDoc3, TX.ibamaDoc4, TX.ibamaDoc5, TX.ibamaDoc6, TX.ibamaDoc7`) · seguintes: —
- `tf-ibama-fund` **Embargo IBAMA – documentação estadual não regulariza (só fundamentação)** — 1 usos · já existe (`TX.ibamaDoc1, TX.ibamaDoc2, TX.ibamaDoc3, TX.ibamaDoc4, TX.ibamaDoc5`) · seguintes: —

#### Tema: Embargo Sema-MT (52 usos)

##### `h067` · Lista de áreas – embargo Ibama e Sema-MT isolado (propriedade sem plantio)
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 8
- **palavrasChave:** ibama, sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, plantio, propriedade
- **seguintes:** `h068` (100%)

> {{municipioEmbargo}} - CAR {{carEmbargo}} - Embargo Ibama e Sema-MT em nome do produtor, que está isolado do plantio de grãos, uma vez que a propriedade não possui área de plantio.

##### `h098` · Acordo em reunião filial × Sustentabilidade SP – áreas em conformidade
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** sustentabilidade sp, em conformidade, embargo sema-mt, reunião, filial, ficou, acordado
- **seguintes:** `h099` (100%)

> Após análise e reunião entre a filial e o Time de Sustentabilidade de São Paulo, ficou acordado que as áreas situadas em {{municipio}} estão em conformidade ambiental para fins de negociação.

##### `h099` · Operação – solicitante informou contrato fixo
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** contrato, embargo sema-mt, fixo, requer, refere-se
- **seguintes:** `h100` (100%)

> O solicitante informou que a operação que requer o desbloqueio do CAR refere-se ao contrato fixo nº {{contrato}}.

##### `h160` · Orientação recebida – bloquear fazendas fora do município
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** embargo sema-mt, fazendas, bloquear, chamada, orientado
- **seguintes:** —

> Além disso, em chamada com {{nomeTerceiro}}, foi orientado realizar o bloqueio de todas as fazendas do produtor que não estejam localizadas em {{municipio}}.

##### `h204` · Área a mais de 150 km do embargo – critério de distância atendido
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo, triangulação, 150 km, embargo sema-mt, distância, critério, atendendo, atendido
- **seguintes:** `h206` (67%)

> A área para a qual está sendo solicitada a liberação encontra-se em {{municipioEmbargo}}, não apresenta passivos ambientais e está situada a aproximadamente {{distancia}} km de distância da área embargada, atendendo, portanto, ao critério de distanciamento mínimo de 150 km estabelecido para triangulação.

##### `h217` · Fundamentação – após análise detalhada, não foi identificado nenhum passivo ambiental…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** cultivo de grãos, embargo sema-mt, nenhum, detalhada, relacionado, passivo
- **seguintes:** `h149` (100%)

> No entanto, após análise detalhada, não foi identificado nenhum passivo ambiental relacionado ao produtor ou à área indicada como sendo de formação de lavoura.

##### `h222` · Fundamentação – - CAR: - Embargos do Ibama e da Sema-MT em nome de (CPF:, aparentemente…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** ibama, sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, aparentemente, nome, embargos
- **seguintes:** `h223` (100%)

> {{municipio}} - CAR: {{car}} - Embargos do Ibama e da Sema-MT em nome de {{nomeTerceiro}} (CPF: {{docTerceiro}}), aparentemente isolados do plantio de grãos, pois a propriedade não possui área de cultivo;{{municipio}} - CAR: {{car2}} - Embargo da Sema-MT em nome da produtora, também aparentemente isolado do plantio de grãos, considerando a ausência de área cultivada.

##### `h223` · Fundamentação – - CAR: - Embargo da Sema-MT em nome de, igualmente isolado do plantio de grãos
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, embargo sema-mt, nome, igualmente
- **seguintes:** `h224` (100%)

> {{municipioEmbargo}} - CAR: {{carEmbargo}} - Embargo da Sema-MT em nome de {{nomeTerceiro}}, igualmente isolado do plantio de grãos.

##### `h224` · Fundamentação – diante da análise, verifica-se que as restrições identificadas não representam…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo, isolado, cultivo de grãos, embargo sema-mt, representam, identificadas, verifica-se, prosseguimento
- **seguintes:** —

> Diante da análise, verifica-se que as restrições identificadas não representam impedimentos para o prosseguimento das negociações, uma vez que os embargos estão isolados das áreas de cultivo.

##### `h239` · Fundamentação – o polígono embargado está devidamente isolado do plantio de grãos
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo, isolado, cultivo de grãos, embargo sema-mt, embargado, polígono, plantio
- **seguintes:** `h006` (67%)

> No entanto, o polígono embargado está devidamente isolado do plantio de grãos.

##### `h257` · Fundamentação – a área corresponde a uma propriedade maior, cuja restrição ambiental está…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo sema-mt, maior, propriedade, individualizada, distante
- **seguintes:** `h163` (100%)

> A área {{car}} corresponde a uma propriedade maior, cuja restrição ambiental está vinculada a terceiro, distante da área individualizada do produtor, que não apresenta passivos ambientais.

##### `h328` · Fundamentação – em análise às imagens de satélite, verificou-se que os polígonos objeto do…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo, isolado, imagens de satélite, cultivo de grãos, capacidade produtiva, em conformidade, sobreposição, embargo sema-mt, polígonos, desenvolvida
- **seguintes:** `h329` (100%)

> Em análise às imagens de satélite, verificou-se que os polígonos objeto do embargo encontram-se devidamente isolados da área destinada ao cultivo de grãos, não havendo indícios de sobreposição com a área produtiva. Dessa forma, a área embargada não compromete a conformidade socioambiental da atividade agrícola desenvolvida no imóvel.

##### `h330` · Fundamentação – durante a análise, constatou-se que o referido embargo está localizado em…
- **bloco:** 3 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo, embargo sema-mt, durante, rural, imóvel, situado
- **seguintes:** `h331` (100%)

> Durante a análise, constatou-se que o referido embargo está localizado em imóvel rural situado no município de {{municipioEmbargo}}, registrado no CAR {{carEmbargo}}.

- `emb-150` **Área de originação a mais de 150 km do embargo** — 1 usos · já existe (`TX.emb150`) · seguintes: —

#### Tema: Protocolo Verde dos Grãos (PVG-PA) (49 usos)

- `pvg-reg` **PVG – documentos para regularização (LAR/PRAD)** — 35 usos · já existe (`TX.pvgRegularizacao`) · seguintes: `cap-uf` (14%), `h012` (6%), `h016` (6%)

##### `h057` · Selo Biocombustível – fazenda desbloqueada pela compra de dendê
- **bloco:** 3 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 9
- **palavrasChave:** selo biocombustível social, protocolo verde dos grãos (pvg-pa), fazenda, dendê, compra
- **seguintes:** —

> O produtor teve a fazenda desbloqueada, em razão da compra de dendê para a obtenção do Selo Biocombustível Social.

##### `h271` · Fundamentação – em análise à planilha do PVG não foram identificadas restrições
- **bloco:** 3 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 3
- **palavrasChave:** pvg, protocolo verde dos grãos (pvg-pa), planilha, identificadas
- **seguintes:** —

> No entanto, em análise à planilha do PVG não foram identificadas restrições.

- `pvg-lar-ok` **PVG – LAR válido apresentado** — 1 usos · já existe (`TX.pvgLarValido`) · seguintes: —
- `pvg-apta` **Área regularizada e apta** — 1 usos · já existe (`TX.pvgApta`) · seguintes: —

#### Tema: Prospecção de clientes (46 usos)

##### `h049` · Cliente e áreas (vários CARs) sem passivos
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 11
- **palavrasChave:** embargo, prospecção de clientes, cars, vários, apresentam
- **seguintes:** `h013` (45%), `h012` (18%)

> {{Sujeito}} não possui restrições ambientais vinculadas ao seu {{doc}}, assim como as áreas indicadas para análise, localizadas em {{municipioEmbargo}}, registradas nos CARs {{carEmbargo}} e {{carEmbargo2}}, não apresentam passivos ambientais.

<details><summary>Variações de redação (2)</summary>

> {{Sujeito}} não possui restrições ambientais em seu {{doc}}, assim como as áreas indicadas para análise, localizadas em {{municipioEmbargo}}, registradas nos CARs {{carEmbargo}}, {{carEmbargo2}}, {{carEmbargo3}}, {{carEmbargo4}}, {{carEmbargo5}}, {{carEmbargo6}} e {{carEmbargo7}} também não apresentam passivos ambientais.

> A empresa Agrícola Califórnia não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, as áreas indicadas para análise, localizadas em {{municipioEmbargo}}, registradas nos CARs {{carEmbargo}} e {{carEmbargo2}}, também não apresentam passivos ambientais.

</details>

##### `h059` · Área sem cultivo na safra – não pode ser área de originação
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 9
- **palavrasChave:** cultivo de grãos, prospecção de clientes, safra, originação, pretenda, utilização
- **seguintes:** `h128` (56%), `h293` (33%)

> Dessa forma, eventuais grãos da safra {{safra}} que se pretenda adquirir não têm origem nessa propriedade, o que inviabiliza sua utilização como área de originação do produto.

##### `h070` · PRODES – apontamento em discussão, desconsiderado por orientação de SP (prospecção)
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 8
- **palavrasChave:** prodes, sustentabilidade sp, e-mail anexo, prospecção, prospecção de clientes, discussão, desconsiderado, orientação, apontamento
- **seguintes:** —

> Ressalta-se, entretanto, que esse apontamento ainda se encontra em discussão no âmbito da liderança. Conforme orientação do time de Sustentabilidade São Paulo, representado por {{responsavelSP}}, o referido protocolo deve ser desconsiderado temporariamente, até que haja decisão formal da alta gestão, conforme orientação anexada ao processo.

- `prodes-3` **PRODES – sem regularização por documentos** — 5 usos · já existe (`TX.prodesSemRegularizacao`) · seguintes: `con-prodes` (60%)

##### `h140` · Fundamentação – cliente sem restrição no CPF/CNPJ, assim como, as áreas indicadas para análise…
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 5
- **palavrasChave:** prospecção de clientes, apresentam, cpf/cnpj
- **seguintes:** —

> {{Sujeito}} não possui restrições ambientais vinculadas em seu {{doc}}, assim como, as áreas indicadas para análise também não apresentam passivos.

<details><summary>Variações de redação (1)</summary>

> {{Sujeito}} não possui restrições ambientais em seu {{doc}}, assim como, as áreas indicadas para análise, que são arrendadas pelo produtor, também não apresentam passivos ambientais.

</details>

##### `h238` · Fundamentação – verificou-se que a propriedade analisada não possui área de cultivo de grãos
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** cultivo de grãos, prospecção de clientes, propriedade, além
- **seguintes:** —

> Além disso, verificou-se que a propriedade analisada não possui área de cultivo de grãos.

##### `h281` · Fundamentação – conclusão:A área não está em conformidade para negociações
- **bloco:** 3 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** em conformidade, prospecção de clientes, negociações, conclusão
- **seguintes:** —

> Conclusão:A área não está em conformidade para negociações.

- `nao-apta` **Área não atende aos critérios de compliance** — 1 usos · já existe (`TX.naoApta`) · seguintes: —
- `tf-apa` **Unidade de Conservação – APA (uso sustentável) – desbloqueada** — 1 usos · já existe (`TX.apa1, TX.apa2`) · seguintes: —

#### Tema: Enquadramento direto/indireto (45 usos)

##### `h032` · Enquadramento – quem não cultiva o que vende é INDIRETO (DIRETO → INDIRETO)
- **bloco:** 3 · **tema:** Enquadramento direto/indireto · **usos:** 18
- **palavrasChave:** enquadramento direto/indireto, mdm, cliente indireto, em conformidade, indiretos, alterada
- **seguintes:** `h052` (44%)

> De acordo com as diretrizes da companhia, fornecedores que não cultivam os produtos que comercializam devem ser enquadrados como INDIRETOS. Sendo assim, a classificação da empresa será alterada de DIRETO para INDIRETO, em conformidade com essa política. A solicitação de alteração já foi direcionada ao time de MDM, responsável pela execução do procedimento (chamado nº {{chamadoMDM}}).

<details><summary>Variações de redação (2)</summary>

> De acordo com as diretrizes da companhia, fornecedores que não cultivam os produtos que comercializam devem ser enquadrados como INDIRETOS.

> Conforme diretrizes internas, fornecedores que não cultivam os produtos comercializados devem ser enquadrados como INDIRETOS. Assim, a classificação da empresa será alterada de DIRETO para INDIRETO, em conformidade com essa política.

</details>

##### `h038` · Enquadramento – empresa caracterizada como cliente indireto
- **bloco:** 3 · **tema:** Enquadramento direto/indireto · **usos:** 17
- **palavrasChave:** enquadramento direto/indireto, cliente indireto, caracteriza, caracterizada
- **seguintes:** `h046` (71%), `tf-reenq` (12%)

> Diante desse enquadramento operacional, a empresa se caracteriza como cliente indireto.

<details><summary>Variações de redação (1)</summary>

> Diante desse enquadramento operacional, a empresa caracteriza-se como cliente indireto.

</details>

##### `h156` · Algodão – SP autorizou alteração do enquadramento
- **bloco:** 3 · **tema:** Enquadramento direto/indireto · **usos:** 4
- **palavrasChave:** contrato, washout/algodão, enquadramento direto/indireto, sustentabilidade sp, e-mail anexo, admbr, autorizou, alteração
- **seguintes:** `h187` (100%)

> Entretanto, a operação referente ao chamado {{chamado}} envolve a commodity algodão (Contrato nº {{contrato}}) . Para este caso específico, o time de Sustentabilidade de São Paulo, representado por {{responsavelSP}} autorizou a alteração do enquadramento de fornecedor DIRETO para NÃO SE APLICA. Com isso, o sistema não exigirá a apresentação do CAR, conforme orientação formal recebida (e-mail com autorização e instruções em anexo).

##### `h187` · Enquadramento DIRETO → NÃO SE APLICA com direcionamento ao MDM
- **bloco:** 3 · **tema:** Enquadramento direto/indireto · **usos:** 4
- **palavrasChave:** enquadramento direto/indireto, mdm, família/terceiros, aplica, direcionamento
- **seguintes:** —

> Dessa forma, o enquadramento da empresa {{nome}} está sendo alterado de DIRETO para NÃO SE APLICA, conforme a orientação mencionada. A confirmação do enquadramento é realizada pelo time de MDM, ao qual o chamado já foi direcionado para execução do procedimento (chamado {{chamadoMDM}}).

<details><summary>Variações de redação (1)</summary>

> Dessa forma, o enquadramento do cliente {{nome}} está sendo alterado de DIRETO para NÃO SE APLICA, conforme a orientação mencionada.

</details>

- `tf-reenq-car` **Reenquadramento – impedimento pela ausência de CAR** — 2 usos · já existe (`TX.reenqSemCar`) · seguintes: —

#### Tema: Sem CAR (40 usos)

##### `h022` · Orientação de SP – enquadramento temporário como NÃO SE APLICA
- **bloco:** 3 · **tema:** Sem CAR · **usos:** 30
- **palavrasChave:** enquadramento direto/indireto, sustentabilidade sp, sem car, aplica, orientação, ajustado
- **seguintes:** `h020` (97%)

> Conforme orientação do time de Sustentabilidade São Paulo, nesses casos o enquadramento será temporariamente ajustado para NÃO SE APLICA.

##### `h103` · CAR informado incorreto (já sinalizado à solicitante)
- **bloco:** 3 · **tema:** Sem CAR · **usos:** 6
- **palavrasChave:** sem car, sinalizado, incorreto, chamados, anteriores
- **seguintes:** `h104` (100%)

> O número do CAR informado está incorreto. Em chamados anteriores foi sinalizado à solicitante essa inconsistência e solicitado a correção.

##### `h162` · CAR cadastrado sem bloqueios ambientais
- **bloco:** 3 · **tema:** Sem CAR · **usos:** 4
- **palavrasChave:** sem car, cadastrado, apresenta
- **seguintes:** —

> O CAR foi devidamente cadastrado e não apresenta bloqueios ambientais.


#### Tema: Bloqueio manual sem motivo (22 usos)

##### `h025` · Sem restrições no CPF/CNPJ e nas áreas – nada justifica manter o bloqueio
- **bloco:** 3 · **tema:** Bloqueio manual sem motivo · **usos:** 22
- **palavrasChave:** bloqueio manual sem motivo, manter, motivassem, justifica, nada
- **seguintes:** `h024` (95%)

> Após análise do seu {{doc}} e das áreas a ele vinculadas, não foram identificadas restrições ambientais ou outras pendências que motivassem a manutenção do bloqueio.


#### Tema: PRODES 2025 (18 usos)

- `prodes-1` **PRODES – diretriz da Diretoria de Sustentabilidade** — 11 usos · já existe (`TX.prodesDiretriz`) · seguintes: `prodes-2` (64%), `h196` (18%)

##### `h196` · PRODES 2025 – critério de política interna (compromisso público)
- **bloco:** 3 · **tema:** PRODES 2025 · **usos:** 4
- **palavrasChave:** prodes, prodes 2025, público, compromisso, critério, interna
- **seguintes:** `op-hedge` (50%), `h312` (50%)

> Cabe destacar que esse critério decorre exclusivamente de política interna da ADM, não estando previsto na legislação vigente nem em acordos setoriais aplicáveis, mas sim em compromisso público assumido pela companhia.

<details><summary>Variações de redação (1)</summary>

> Cumpre destacar queesse critério decorre de política interna da ADM, não estando previsto na legislação vigente nem em acordos setoriais.

</details>

##### `h312` · Fundamentação – para situações que envolvam apontamentos dessa natureza, não há previsão de…
- **bloco:** 3 · **tema:** PRODES 2025 · **usos:** 3
- **palavrasChave:** prodes 2025, situações, envolvam, apontamentos, previsão
- **seguintes:** `h146` (67%)

> Assim, para situações que envolvam apontamentos dessa natureza, não há previsão de regularização mediante apresentação de documentação complementar.


#### Tema: Embargo Semad-GO (18 usos)

##### `h273` · Fundamentação – apesar disso, foi apresentada a Certidão Positiva com Efeito de Certidão…
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** semad-go, documentos, embargo semad-go, certidão, apesar, negativa, positiva
- **seguintes:** `h274` (100%)

> Apesar disso, foi apresentada a Certidão Positiva com Efeito de Certidão Negativa de Passivos Ambientais, emitida pela própria SEMAD-GO em {{data}}, referente à área em questão.

##### `h274` · Fundamentação – de acordo com o artigo 7º, incisos I e II, da Instrução Normativa SEMAD nº, a…
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** semad-go, documentos, embargo semad-go, incisos, instrução, normativa
- **seguintes:** `h275` (100%)

> De acordo com o artigo 7º, incisos I e II, da Instrução Normativa SEMAD nº {{numero}}, a Declaração Ambiental do Imóvel (DAI) pode resultar na emissão de Certidão Negativa de Passivos Ambientais quando não há passivos declarados, ou na emissão de Certidão Positiva de Passivos Ambientais quando há passivos existentes e o empreendedor opta por não assinar o TCA.

##### `h275` · Fundamentação – nesse caso, embora o imóvel apresente embargo, a SEMAD-GO reconhece que os…
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** semad-go, embargo, documentos, embargo semad-go, reconhece, apresente, imóvel
- **seguintes:** `h276` (100%)

> Nesse caso, embora o imóvel apresente embargo, a SEMAD-GO reconhece que os passivos estão contemplados nas medidas mitigadoras e compensatórias previstas no Termo de Compromisso Ambiental (TCA), o que significa que tais pendências não impedem o licenciamento ou a regularização de atividades no imóvel durante a vigência da certidão.

##### `h276` · Fundamentação – como a certidão foi emitida pelo mesmo órgão responsável pelo embargo…
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** embargo, documentos, em conformidade, embargo semad-go, entende-se, emitida, responsável, certidão
- **seguintes:** `h277` (100%)

> Como a certidão foi emitida pelo mesmo órgão responsável pelo embargo, entende-se que, durante sua validade, a área encontra-se em conformidade ambiental para fins de negociação, mesmo havendo passivo declarado.

##### `h277` · Fundamentação – trata-se de uma conformidade temporária, pois a certidão tem validade de 90 dias
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** documentos, em conformidade, embargo semad-go, temporária, pois, dias, validade
- **seguintes:** `h278` (100%)

> Contudo, trata-se de uma conformidade temporária, pois a certidão tem validade de 90 dias.

##### `h278` · Fundamentação – as operações podem ser realizadas entre17/03/2026 e. Após essa data, deverá ser…
- **bloco:** 3 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** embargo, documentos, embargo semad-go, realizadas, entre17/03/2026, deverá, podem
- **seguintes:** —

> Assim, as operações podem ser realizadas entre17/03/2026 e {{data}}. Após essa data, deverá ser apresentada nova certidão válida, sob pena de a área voltar a ser considerada não conforme em função do embargo estadual ainda vigente.


#### Tema: Cultivo inferior a 10% (16 usos)

##### `h072` · Imagens de satélite – área produtiva estimada (ha)
- **bloco:** 3 · **tema:** Cultivo inferior a 10% · **usos:** 8
- **palavrasChave:** imagens de satélite, capacidade produtiva, cultivo inferior a 10%, hectares
- **seguintes:** `cap-uf` (88%)

> Em análise das imagens de satélite, verificou-se que o imóvel possui aproximadamente {{areaProdutiva}} hectares de área produtiva.

- `cultivo-sat` **Imagens de satélite sem áreas de cultivo** — 4 usos · já existe (`TX.cultivoSatelite`) · seguintes: `op-alcada` (50%)

##### `h199` · Fundamentação – após análise das imagens de satélite disponíveis, verificou-se que o imóvel…
- **bloco:** 3 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** imagens de satélite, capacidade produtiva, cultivo inferior a 10%, queo, disponíveis
- **seguintes:** `cap-uf` (75%)

> Entretanto, após análise das imagens de satélite disponíveis, verificou-se que o imóvel possui aproximadamente {{areaProdutiva}} hectares de área produtiva, evidenciando a existência de atividade agrícola compatível com a finalidade da operação.

<details><summary>Variações de redação (1)</summary>

> Entretanto, após análise das imagens de satélite, verificou-se que a propriedade possui aproximadamente {{areaProdutiva}} hectares de área produtiva, evidenciando a existência de área efetivamente destinada à atividade agrícola.

</details>


#### Tema: Terra Indígena/Quilombola (9 usos)

##### `h212` · Terra Indígena – só homologada bloqueia; área desbloqueada
- **bloco:** 3 · **tema:** Terra Indígena/Quilombola · **usos:** 3
- **palavrasChave:** terra indígena, terra indígena/quilombola, desbloqueada, homologadas, compras, terras
- **seguintes:** `h213` (67%)

> De acordo com a política atual de compras, apenas as negociações em terras indígenas homologadas pelo Governo Federal estão bloqueadas. Por essa razão, o produtor teve a área desbloqueada.

##### `h214` · Terra Indígena – atualizar avaliação de risco (se homologada)
- **bloco:** 3 · **tema:** Terra Indígena/Quilombola · **usos:** 3
- **palavrasChave:** terra indígena, status do car, contrato, família/terceiros, terra indígena/quilombola, atualizar, homologada
- **seguintes:** —

> Além disso, é importante atualizar a avaliação de risco do cliente/fornecedor em relação à sustentabilidade. Isso porque, se o status da terra indígena for alterado para homologada, não será possível cumprir qualquer contrato firmado anteriormente.

- `ti-pol` **Terra Indígena – só “Homologada” bloqueia** — 2 usos · já existe (`TX.tiPolitica`) · seguintes: —
- `ti-decl` **Terra Indígena “Declarada” – área em conformidade** — 1 usos · já existe (`TX.tiDeclarada`) · seguintes: —

#### Tema: Unidade de Conservação (9 usos)

##### `h261` · Fundamentação – conforme dispõe a Lei nº 9.985/2000 (SNUC), o Refúgio de Vida Silvestre integra…
- **bloco:** 3 · **tema:** Unidade de Conservação · **usos:** 3
- **palavrasChave:** unidade de conservação, cultivo de grãos, cliente indireto, integra, silvestre, refúgio, dispõe
- **seguintes:** `h262` (100%)

> Conforme dispõe a Lei nº 9.985/2000 (SNUC), o Refúgio de Vida Silvestre integra a categoria de Proteção Integral, na qual é vedado o plantio de grãos ou qualquer outra atividade agropecuária, admitindo-se apenas o uso indireto dos recursos naturais.

##### `h262` · Fundamentação – após análise, verificou-se que a área de sobreposição não incide sobre a porção…
- **bloco:** 3 · **tema:** Unidade de Conservação · **usos:** 3
- **palavrasChave:** cultivo de grãos, capacidade produtiva, sobreposição, unidade de conservação, porção, incide, destinada
- **seguintes:** `h034` (100%)

> Todavia, após análise, verificou-se que a área de sobreposição não incide sobre a porção destinada ao cultivo de grãos da propriedade, não comprometendo a atividade produtiva.

##### `h279` · Fundamentação – conforme a Lei nº 9.985/2000, que institui o Sistema Nacional de Unidades de…
- **bloco:** 3 · **tema:** Unidade de Conservação · **usos:** 3
- **palavrasChave:** unidade de conservação, cultivo de grãos, capacidade produtiva, admbr, sobreposição, unidades, institui, naturais, nacional
- **seguintes:** `h238` (67%)

> Conforme a Lei nº 9.985/2000, que institui o Sistema Nacional de Unidades de Conservação da Natureza (SNUC), os Parques Nacionais, enquadrados como Proteção Integral, têm como finalidade a preservação dos ecossistemas naturais, sendo vedada a exploração direta dos recursos naturais, incluindo plantio de grãos, atividades agropecuárias ou qualquer uso que comprometa seus atributos ambientais (arts. 7º, 11 e 14 da referida Lei). Assim, áreas inseridas ou sobrepostas a {{nomeTerceiro}} Integral não podem ser utilizadas para fins produtivos, razão pela qual o impedimento socioambiental permanece válido.


#### Tema: Moratória da Soja (5 usos)

##### `h120` · Moratória da Soja – riscos de comercializar com áreas embargadas
- **bloco:** 3 · **tema:** Moratória da Soja · **usos:** 5
- **palavrasChave:** moratória da soja, embargo, em conformidade, embargadas, riscos
- **seguintes:** `h016` (60%)

> Convém destacar os riscos associados à comercialização com áreas embargadas pela Moratória da Soja:  
> Não conformidade com políticas socioambientais, podendo gerar sanções contratuais e reputacionais;  
> Exposição a auditorias e bloqueios comerciais, comprometendo a integridade da cadeia de fornecimento;  
> Impacto direto na imagem da empresa, por associação a práticas que violam compromissos de sustentabilidade.


### 4 – Capacidade produtiva

#### Tema: Geral (408 usos)

- `cap-uf` **Capacidade produtiva – Estado de [UF]** — 338 usos · universal · já existe (`TX.capUF`) · seguintes: `con-fav-op` (17%), `op-hedge` (16%), `h026` (4%)
- `cap-pa` **Capacidade produtiva – Pará (Adicionalmente)** — 37 usos · universal · já existe (`TX.capPA`) · seguintes: `h001` (19%), `con-fav-op` (8%), `h040` (5%)

##### `h031` · Capacidade produtiva – área efetivamente produtiva (variação)
- **bloco:** 4 · **tema:** Geral · **usos:** 19 · universal
- **palavrasChave:** capacidade produtiva, efetivamente, índice
- **seguintes:** `op-hedge` (21%), `h320` (16%), `con-fav` (11%)

> A propriedade possui aproximadamente {{areaProdutiva}} hectares de área efetivamente produtiva. Considerando o índice médio de produtividade divulgado pela CONAB para o Estado do {{uf}}, de {{rendimento}} kg/ha, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas.

<details><summary>Variações de redação (1)</summary>

> Ainda, a área em questãopossui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de produtividade estabelecido pela CONAB para o Estado do {{uf}}, equivalente a {{rendimento}} kg/ha, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, ou seja, {{producaoT}} toneladas.

</details>

##### `h077` · Capacidade produtiva – rendimento CONAB (redação curta)
- **bloco:** 4 · **tema:** Geral · **usos:** 8
- **palavrasChave:** capacidade produtiva, rendimento, conab, equivalentes, parâmetros
- **seguintes:** —

> Considerando o rendimento médio de {{rendimento}} kg/ha, conforme parâmetros da CONAB para o Estado de {{uf}}, a capacidade produtiva estimada da área é de aproximadamente {{producaoKg}} kg, equivalentes a {{producaoT}} toneladas.

<details><summary>Variações de redação (1)</summary>

> Considerando o rendimento médio de {{rendimento}} kg/ha, conforme parâmetro estabelecido pela CONAB para o Estado do {{uf}}, a capacidade produtiva estimada dessas áreas é de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas.

</details>

##### `h116` · Capacidade – excedente de volume incompatível com a área
- **bloco:** 4 · **tema:** Geral · **usos:** 6
- **palavrasChave:** capacidade produtiva, volume, incompatível, excedente
- **seguintes:** `ori-areas` (33%)

> Dessa forma, verifica-se a existência de um excedente de aproximadamente {{producaoKg}} kg, volume incompatível com a capacidade produtiva estimada da área analisada.

<details><summary>Variações de redação (2)</summary>

> Dessa forma, verifica-se a existência de um excedente de aproximadamente {{producaoKg}} kg em relação ao volume contratado, não compatível com a capacidade produtiva da área informada.

> Dessa forma, verifica-se a existência de excedente de volume de aproximadamente {{producaoKg}} kg, incompatível com a capacidade produtiva da área informada.

</details>

- `cap-pa-info` **Capacidade produtiva – Pará (A título de informação)** — 0 usos · já existe (`TX.capPAInfo`) · seguintes: —
- `cap-base` **Capacidade produtiva – modelo-base** — 0 usos · já existe (`TX.capBase`) · seguintes: —

#### Tema: Cultivo inferior a 10% (26 usos)

##### `h043` · Capacidade produtiva – produtividade média da soja (CONAB)
- **bloco:** 4 · **tema:** Cultivo inferior a 10% · **usos:** 14 · universal
- **palavrasChave:** capacidade produtiva, cultivo inferior a 10%, média, produtividade, conab, soja
- **seguintes:** `op-hedge` (21%)

> Considerando a produtividade média da soja no Estado de {{uf}}, conforme parâmetro estabelecido pela CONAB, de {{rendimento}} kg/ha, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas.

<details><summary>Variações de redação (3)</summary>

> Considerando a produtividade média de {{rendimento}} kg/ha estabelecida pela CONAB para o Estado de {{uf}},estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg de soja, equivalente a {{producaoT}} toneladas.

> Considerando a produtividade média de {{rendimento}} kg/ha para o Estado de {{uf}}, conforme parâmetros da CONAB,estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de soja.

> Considerando o rendimento médio de {{rendimento}} kg/ha para a cultura da soja no Estado de {{uf}}, conforme parâmetros da CONAB, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas.

</details>

##### `h321` · Capacidade produtiva – destaca-se que a capacidade produtiva estimada da área é relativamente…
- **bloco:** 4 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** capacidade produtiva, cultivo inferior a 10%, relativamente, limitada, destaca-se, pretendida
- **seguintes:** `h179` (100%)

> Contudo, destaca-se que a capacidade produtiva estimada da área é relativamente limitada, circunstância que deve ser observada na avaliação da operação pretendida.

##### `h322` · Capacidade produtiva – nesse contexto, é fundamental que o volume de grãos objeto da garantia seja…
- **bloco:** 4 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, cultivo inferior a 10%, garantia, fundamental, contexto, compatível
- **seguintes:** `h323` (100%)

> Nesse contexto, é fundamental que o volume de grãos objeto da garantia seja compatível com a capacidade produtiva estimada da propriedade, de forma a assegurar a existência de respaldo produtivo suficiente para a operação e mitigar eventuais riscos em caso de inadimplemento e necessidade de execução da garantia.

##### `h323` · Capacidade produtiva – caso o volume a ser garantido ultrapasse sobremaneira a capacidade produtiva…
- **bloco:** 4 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, cultivo inferior a 10%, ultrapasse, sobremaneira, garantido, caso
- **seguintes:** `h324` (100%)

> Assim, caso o volume a ser garantido ultrapasse sobremaneira a capacidade produtiva estimada de {{producaoKg}} kg, será necessária a apresentação de áreas complementares de originação, devidamente submetidas à análise socioambiental, de modo a conferir lastro produtivo compatível com o montante envolvido na operação.

##### `h324` · Capacidade produtiva – considerando que o chamado não informa o volume de grãos que servirá de…
- **bloco:** 4 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, cultivo inferior a 10%, servirá, informa, garantia
- **seguintes:** `h148` (100%)

> Considerando que o chamado não informa o volume de grãos que servirá de garantia da operação, não é possível, neste momento, verificar a compatibilidade entre o volume pretendido e a capacidade produtiva da área apresentada.


#### Tema: Prospecção de clientes (21 usos)

##### `h137` · Capacidade produtiva – considerando o fator médio de produtividade divulgado pela CONAB para o Estado…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 5
- **palavrasChave:** capacidade produtiva, prospecção de clientes, produtividade, conab, estado, cerca
- **seguintes:** `h026` (60%)

> Considerando o fator médio de produtividade divulgado pela CONAB para o Estado do {{uf}}, de {{rendimento}} kg/ha, a capacidade produtiva estimada das áreas analisadas é de aproximadamente {{producaoKg}} kg, o equivalente a cerca de {{producaoT}} toneladas.

##### `h186` · Capacidade produtiva – a área objeto da presente avaliação possui aproximadamente hectares de área…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 4
- **palavrasChave:** capacidade produtiva, prospecção de clientes, avaliação, hectares, adotado
- **seguintes:** `con-fav` (100%)

> A área objeto da presente avaliação possui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o rendimento médio de {{rendimento}} kg/ha para o Estado do {{uf}}, conforme parâmetro adotado pela CONAB, estima-se uma capacidade produtiva de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de grãos.

##### `h309` · Capacidade produtiva – como medida de cautela, orienta-se a filial a observar a compatibilidade entre…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, em conformidade, prospecção de clientes, cautela, medida, observar, orienta-se
- **seguintes:** —

> Como medida de cautela, orienta-se a filial a observar a compatibilidade entre o volume negociado e a capacidade produtiva estimada da propriedade, de forma a assegurar que a quantidade de produto recebida pela companhia esteja devidamente respaldada pela capacidade de produção da área, em conformidade com os critérios produtivos e socioambientais aplicáveis.

##### `h314` · Capacidade produtiva – destaca-se que a capacidade produtiva estimada do imóvel é relativamente…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** capacidade produtiva, prospecção de clientes, relativamente, limitada, destaca-se, imóvel
- **seguintes:** `h315` (100%)

> Contudo, destaca-se que a capacidade produtiva estimada do imóvel é relativamente limitada.

##### `h316` · Capacidade produtiva – por outro lado, considerando que o chamado não informa o volume que se pretende…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, prospecção de clientes, pretende, lado, informa, vincular
- **seguintes:** —

> Por outro lado, considerando que o chamado não informa o volume que se pretende vincular à área, não foi possível avaliar a compatibilidade entre a capacidade produtiva do imóvel e o volume da operação.

##### `h326` · Capacidade produtiva – reitera-se a importância de observar a capacidade produtiva das áreas…
- **bloco:** 4 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, em conformidade, prospecção de clientes, reitera-se, observar, importância, garantindo
- **seguintes:** —

> Contudo, reitera-se a importância de observar a capacidade produtiva das áreas indicadas, de forma que o volume a ser recebido pela companhia esteja devidamente respaldado pelo potencial produtivo e pela conformidade socioambiental das propriedades, garantindo compatibilidade com o montante negociado.


#### Tema: Protocolo Verde dos Grãos (PVG-PA) (5 usos)

##### `h130` · Capacidade produtiva – a área indicada possui hectares de área produtiva. Considerando o fator médio…
- **bloco:** 4 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 5
- **palavrasChave:** capacidade produtiva, protocolo verde dos grãos (pvg-pa), hectares, equivale, aproximada
- **seguintes:** `con-fav-op` (60%)

> A área indicada possui {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado do {{uf}}, correspondente a {{rendimento}} kg/ha, estima-se uma capacidade produtiva aproximada de {{producaoKg}} kg, o que equivale a {{producaoT}} toneladas.


#### Tema: Embargo Ibama (4 usos)

##### `h193` · Capacidade – excedente de volume (variação)
- **bloco:** 4 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** capacidade produtiva, volume, embargo ibama, excedente, havia, variação
- **seguintes:** `ori-areas` (50%), `h168` (50%)

> Diante disso, verificou-se que havia um excedente de volume de aproximadamente {{producaoKg}} kg, não compatível com a capacidade produtiva da área informada.

<details><summary>Variações de redação (1)</summary>

> Diante disso, identifica-se um excedente de volume de aproximadamente {{producaoKg}} kg, o qual não é compatível com a capacidade produtiva da área informada.

</details>


#### Tema: Embargo Sema-MT (3 usos)

##### `h307` · Capacidade produtiva – recomenda-se à filial observar a capacidade produtiva estimada da área, de modo…
- **bloco:** 4 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, embargo sema-mt, recomenda-se, observar, filial, modo
- **seguintes:** —

> Por fim, recomenda-se à filial observar a capacidade produtiva estimada da área, de modo que o volume negociado e/ou recebido pela companhia esteja devidamente compatibilizado com seu potencial produtivo, assegurando respaldo operacional e socioambiental para a operação.


### 5 – Operação

#### Tema: Geral (264 usos)

- `op-hedge` **Hedge para nova compra** — 153 usos · universal · já existe (`TX.opHedge`) · seguintes: `cap-uf` (25%), `con-fav-op` (13%), `h016` (3%)

##### `h011` · Operação – contrato fixo já firmado (continuidade da operação)
- **bloco:** 5 · **tema:** Geral · **usos:** 62 · universal
- **palavrasChave:** contrato, volume, família/terceiros, firmado, fixo, continuidade
- **seguintes:** `cap-uf` (31%), `con-fav-op` (11%), `h019` (3%)

> Conforme informado no chamado, o pedido de desbloqueio tem como finalidade a continuidade da operação referente ao contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, no volume de {{volume}} kg de soja.

<details><summary>Variações de redação (3)</summary>

> No chamado, foi informado que o pedido de desbloqueio visa à continuidade da operação envolvendo o contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, no volume de {{volume}} kg de soja.

> Conforme informado no chamado, o pedido de desbloqueio tem como finalidade viabilizar a continuidade da operação vinculada ao Contrato Fixo nº {{contrato}}, emitido em {{dataEmissao}}, referente ao volume de {{volume}} kg.

> No chamado, foi informado que o pedido de desbloqueio tem como finalidade a continuidade da operação referente ao contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, com volume total de {{volume}} kg, sendo a área de formação de lavoura justamente aquela indicada no chamado.

</details>

##### `h045` · Operação – contrato fixo na alçada L
- **bloco:** 5 · **tema:** Geral · **usos:** 13 · universal
- **palavrasChave:** contrato, volume, alçada l, fixo, mencionado
- **seguintes:** `con-fav-op` (23%), `cap-uf` (23%), `h009` (15%)

> Conforme informado no chamado, o pedido de desbloqueio visa à continuidade da operação vinculada ao contrato fixo nº {{contrato}}, emitido em {{dataEmissao}}, no volume de {{volume}} kg de soja, atualmente na alçada L em razão do apontamento anteriormente mencionado.

<details><summary>Variações de redação (2)</summary>

> Conforme informado no chamado, o pedido de desbloqueio visa à continuidade da operação vinculada ao Contrato Fixo nº {{contrato}}, emitido em {{dataEmissao}}, com volume contratado de {{volume}} kg de milho.

> Conforme informado no chamado, o pedido de desbloqueio tem como objetivo a continuidade da operação vinculada ao contrato fixo nº {{contrato}}, emitido em {{dataEmissao}}, no volume de {{volume}} kg de milho, o qual se encontra na alçada L em razão do passivo ambiental mencionado.

</details>

- `op-car-insumos` **Pedido de insumos – entrega na fazenda (CAR Suspenso/Cancelado)** — 9 usos · já existe (`TX.opCarInsumos`) · seguintes: —

##### `h073` · Operação – inclusão da área em operação de crédito (alienação fiduciária)
- **bloco:** 5 · **tema:** Geral · **usos:** 8
- **palavrasChave:** inclusão, alienação, fiduciária, crédito
- **seguintes:** `h325` (38%)

> Conforme informado no chamado, o presente pedido de análise e desbloqueio tem por finalidade a inclusão da área em operação de crédito, na qual os grãos produzidos nas propriedades serão oferecidos em alienação fiduciária como garantia da obrigação assumida.

- `op-car-contrato` **Contrato fixo (CAR Suspenso/Cancelado)** — 5 usos · já existe (`TX.opCarContrato`) · seguintes: —

##### `h144` · Operação – o pedido de desbloqueio tem por finalidade viabilizar a continuidade da…
- **bloco:** 5 · **tema:** Geral · **usos:** 5
- **palavrasChave:** cultivo de grãos, contrato, volume, viabilizar, continuidade, comercialização, desbloqueio
- **seguintes:** `h145` (40%)

> Conforme informado no chamado, o pedido de desbloqueio tem por finalidade viabilizar a continuidade da operação vinculada ao Contrato Fixo nº {{contrato}}, emitido em {{dataEmissao}}, referente à comercialização de {{volume}} kg de soja, cuja área em análise é a de formação da lavoura.

<details><summary>Variações de redação (1)</summary>

> Conforme informado no chamado, a solicitação de desbloqueio tem por finalidade viabilizar a continuidade da operação vinculada ao Contrato Fixo nº {{contrato}}, firmado em {{dataGeracao}}, referente ao volume de {{volume}} kg de soja, cuja área de originação corresponde à área objeto desta análise.

</details>

##### `h146` · Operação – o pedido de desbloqueio tem como objetivo viabilizar a continuidade do Contrato…
- **bloco:** 5 · **tema:** Geral · **usos:** 5
- **palavrasChave:** contrato, volume, alçada l, viabilizar, fixo, continuidade
- **seguintes:** `h088` (40%)

> Conforme informado no chamado, o pedido de desbloqueio tem como objetivo viabilizar a continuidade do Contrato Fixo nº {{contrato}}, emitido em {{dataEmissao}}, referente ao volume de {{volume}} kg de soja (safra {{safra}}), atualmente enquadrado em alçada L em razão da restrição socioambiental mencionada.

<details><summary>Variações de redação (1)</summary>

> Conforme informado no chamado, o pedido de desbloqueio tem por objetivo viabilizar a geração do Contrato Fixo nº {{contrato}}, emitido em {{dataEmissao}}, no volume de {{volume}} kg de soja (Safra {{safra}}).

</details>

- `op-exc-contrato` **Contrato já formalizado (desbloqueio excepcional)** — 4 usos · já existe (`TX.opExcContrato`) · seguintes: —
- `op-base` **Operação – a descrever (modelo-base)** — 0 usos · já existe (`TX.opBase`) · seguintes: —

#### Tema: Sem CAR (30 usos)

##### `h021` · Operação – aquisição de dendê para o Selo Biocombustível Social
- **bloco:** 5 · **tema:** Sem CAR · **usos:** 30
- **palavrasChave:** selo biocombustível social, sem car, aquisição, dendê
- **seguintes:** `h022` (100%)

> A operação consiste na aquisição de dendê para obtenção do Selo Biocombustível Social.


#### Tema: Cultivo inferior a 10% (23 usos)

- `op-exc-insumos` **Pedido de insumos já formalizado (desbloqueio excepcional)** — 9 usos · já existe (`TX.opExcInsumos`) · seguintes: `h108` (22%)
- `op-alcada` **Contrato fixo/balcão na alçada L** — 6 usos · já existe (`TX.opAlcadaL`) · seguintes: `con-cultivo` (33%)

##### `h179` · Operação – vinculação a operação de crédito (alienação fiduciária)
- **bloco:** 5 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** cultivo inferior a 10%, alienação, fiduciária, crédito, vinculação
- **seguintes:** `h322` (75%)

> Conforme informado no chamado, o pedido de desbloqueio tem por finalidade a vinculação da referida área a uma operação de crédito, na qual a propriedade será oferecida em garantia por meio de alienação fiduciária de grãos, sendo a produção originada na área o lastro da operação.

##### `h183` · Operação – garantia de alienação fiduciária de grãos (curto)
- **bloco:** 5 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** cultivo inferior a 10%, alienação, fiduciária, garantia, constituição
- **seguintes:** `h184` (100%)

> Conforme informado no presente chamado, o pedido de desbloqueio tem como finalidade a vinculação do imóvel a uma operação de crédito, mediante constituição de garantia de alienação fiduciária de grãos.


#### Tema: CAR Suspenso/Cancelado (20 usos)

##### `h171` · Chamado sem nº de contrato, hedge ou pedido de insumos
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** contrato, hedge, pedido de insumos, car suspenso/cancelado, estaria, correta
- **seguintes:** `h172` (50%), `h134` (50%)

> No chamado não foi informado o número do contrato, hedge e/ou pedido de insumos ao qual o pedido de desbloqueio estaria vinculado, o que inviabiliza a correta identificação da operação para fins de análise.

##### `h175` · Operação – conforme informado no chamado, o pedido de desbloqueio visa possibilitar a…
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** cultivo de grãos, contrato, volume, família/terceiros, car suspenso/cancelado, possibilitar, visa, continuidade, associada
- **seguintes:** `cap-uf` (50%), `cap-pa` (50%)

> Contudo, conforme informado no chamado, o pedido de desbloqueio visa possibilitar a continuidade da operação vinculada ao contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, no volume de {{volume}} kg, sendo que a área de formação de lavoura associada ao contrato corresponde exatamente à área em análise.

##### `h287` · Operação – o pedido de desbloqueio visa garantir a continuidade da operação vinculada ao…
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** contrato, volume, família/terceiros, car suspenso/cancelado, garantir, visa, continuidade, em19/04/2026
- **seguintes:** `h288` (100%)

> Conforme informado no chamado, o pedido de desbloqueio visa garantir a continuidade da operação vinculada ao Contrato Fixo nº {{contrato}}, firmado em19/04/2026, no volume de {{volume}} kg de soja, cuja área de originação está vinculada justamente ao CAR {{car}}.

##### `h288` · Operação – considerando que o referido contrato foi regularmente formalizado no sistema…
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** status do car, contrato, admbr, car suspenso/cancelado, regularmente, entende-se, formalizado, sistema
- **seguintes:** `cap-uf` (100%)

> Considerando que o referido contrato foi regularmente formalizado no sistema, entende-se que, à época de sua emissão, o CAR encontrava-se com status compatível com as diretrizes internas da empresa e com a legislação aplicável, tendo a alteração de status ocorrido posteriormente.

##### `h313` · Operação – orienta-se a filial a verificar junto ao produtor a existência de outro imóvel…
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** status do car, car suspenso/cancelado, orienta-se, existência, verificar, filial
- **seguintes:** —

> Orienta-se a filial a verificar junto ao produtor a existência de outro imóvel rural regularmente inscrito no CAR, com status compatível com os requisitos legais e internos da companhia, para que seja possível dar continuidade à análise da operação.

##### `h318` · Operação – o pedido de desbloqueio visa dar continuidade à operação vinculada ao Contrato…
- **bloco:** 5 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** contrato, volume, família/terceiros, car suspenso/cancelado, visa, fixo, continuidade, vendedora
- **seguintes:** `h198` (67%)

> Conforme informado no chamado, o pedido de desbloqueio visa dar continuidade à operação vinculada ao Contrato Fixo nº {{contrato}}, firmado em {{dataGeracao}}, referente ao volume de {{volume}} kg de milho, tendo como vendedora a Cooperativa {{nomeTerceiro}}


#### Tema: Embargo Ibama (12 usos)

##### `h124` · Operação – desbloqueio para continuidade de contrato fixo (curto)
- **bloco:** 5 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** contrato, volume, família/terceiros, embargo ibama, fixo, continuidade, solicitado
- **seguintes:** —

> O desbloqueio solicitado visa à continuidade do contrato fixo nº {{contrato}}, firmado em {{dataGeracao}}, com volume de {{volume}} kg.

##### `h247` · Operação – no chamado nº, foi solicitada análise e liberação dessa área, sendo mantido…
- **bloco:** 5 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** semad-go, embargo ibama, solicitada, liberação, mantido, encaminhado
- **seguintes:** `h248` (100%)

> No chamado nº {{chamado}}, foi solicitada análise e liberação dessa área, sendo mantido inicialmente o bloqueio devido à restrição mencionada. Posteriormente, foi apresentado o Certificado nº {{numero}} - Licenciamento Ambiental Concomitante, emitido pela SEMAD/MG, com validade até 2029, o qual foi encaminhado para análise do time jurídico.

##### `h306` · Operação – foi informado no chamado que o pedido de desbloqueio visa a continuidade da…
- **bloco:** 5 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** pedido de insumos, embargo ibama, visa, continuidade, desbloqueio
- **seguintes:** `con-fav-op` (67%)

> Foi informado no chamado que o pedido de desbloqueio visa a continuidade da operação envolvendo um pedido de insumos.

- `op-insumos` **Pedido de insumos** — 1 usos · já existe (`TX.opInsumos`) · seguintes: —

#### Tema: Protocolo Verde dos Grãos (PVG-PA) (9 usos)

##### `h061` · Selo Biocombustível – operação de compra de dendê
- **bloco:** 5 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 9
- **palavrasChave:** selo biocombustível social, protocolo verde dos grãos (pvg-pa), compra, dendê
- **seguintes:** —

> Trata-se de operação envolvendo a compra de dendê para obtenção do Selo Biocombustível Social.

<details><summary>Variações de redação (2)</summary>

> Trata-se de liberação para obtenção do Selo Biocombustível Social.

> A operação envolvendo {{sujeito}} {{nome}} refere-se à compra de dendê com o objetivo de obtenção do Selo Biocombustível Social.

</details>


#### Tema: Não há restrições (6 usos)

##### `h245` · Operação – considerando que a área já foi verificada e não apresenta bloqueios, foi…
- **bloco:** 5 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** admbr, não há restrições, verificada, apresenta, aguardamos, normalização
- **seguintes:** `h246` (100%)

> Contudo, considerando que a área já foi verificada e não apresenta bloqueios, foi realizado o desbloqueio manual no sistema CORP_F0285, a fim de evitar impactos na continuidade da operação enquanto aguardamos a normalização da plataforma.

##### `h327` · Operação – na tentativa de auxiliar qualquer ocorrência de inconsistência sistêmica que…
- **bloco:** 5 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** status do car, admbr, não há restrições, tentativa, sistêmica, auxiliar, estar
- **seguintes:** —

> Na tentativa de auxiliar qualquer ocorrência de inconsistência sistêmica que pode estar ocorrendo, foi realizado, de forma preventiva, o lançamento manual do status “NÃO BLOQUEADO” no sistema CORP_F0450, com o objetivo de assegurar o regular processamento da operação e mitigar eventuais impactos decorrentes de falhas operacionais do sistema.


#### Tema: Embargo Sema-MT (5 usos)

##### `h331` · Operação – a solicitação de análise e eventual desbloqueio tem por objetivo viabilizar a…
- **bloco:** 5 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** contrato, volume, família/terceiros, embargo sema-mt, solicitação, eventual, viabilizar, vendedor
- **seguintes:** `cap-uf` (100%)

> Conforme informado no chamado, a solicitação de análise e eventual desbloqueio tem por objetivo viabilizar a continuidade da operação referente ao Contrato Fixo nº {{contrato}}, firmado em {{dataGeracao}}, para negociação de {{volume}} kg de milho, tendo como vendedor principal a Cooperativa {{nomeTerceiro}}

- `tf-washout` **Washout / contratação de volume de algodão – desbloqueio sem análise** — 1 usos · já existe (`TX.washout1, TX.washout2, TX.washout3, TX.washout4`) · seguintes: —
- `op-gerado` **Contrato fixo/balcão já gerado** — 1 usos · já existe (`TX.opGerado`) · seguintes: —

#### Tema: Embargo Semad-GO (4 usos)

##### `h177` · Operação – o pedido de desbloqueio visa à continuidade do contrato fixo nº, emitido em, no…
- **bloco:** 5 · **tema:** Embargo Semad-GO · **usos:** 4
- **palavrasChave:** cultivo de grãos, contrato, volume, embargo semad-go, emitido, visa, fixo
- **seguintes:** —

> Conforme informado no chamado, o pedido de desbloqueio visa à continuidade do contrato fixo nº {{contrato}}, emitido em {{dataEmissao}}, no volume de {{volume}} kg de soja, cuja área de formação de lavoura vinculada é justamente a área em análise.


#### Tema: Alçada Y (3 usos)

##### `h208` · Contrato direcionado à alçada G
- **bloco:** 5 · **tema:** Alçada Y · **usos:** 3
- **palavrasChave:** contrato, alçada g, alçada y, direcionado, continuidade
- **seguintes:** —

> Dessa forma, o contrato foi direcionado à alçada G para continuidade da operação.


#### Tema: Enquadramento direto/indireto (2 usos)

- `tf-reenq-farelo` **Reenquadramento – operação com farelo de soja** — 2 usos · já existe (`TX.reenqFarelo`) · seguintes: —

### 6 – Conclusão

#### Tema: Geral (442 usos)

##### `h006` · Conclusão curta – em conformidade
- **bloco:** 6 · **tema:** Geral · **usos:** 124
- **palavrasChave:** em conformidade, curta, conclusão
- **seguintes:** —

> Portanto, em conformidade.

<details><summary>Variações de redação (5)</summary>

> Portanto, considerado em conformidade.

> Dessa forma, considera-se que a área está em conformidade ambiental.

> Portanto, está em conformidade.

> Dessa forma, a área é considerada em conformidade.

> Dessa forma, considerado em conformidade.

</details>

- `con-fav-op` **Favorável – operação em andamento** — 111 usos · universal · já existe (`TX.conFavOperacao`) · seguintes: `h087` (3%)

##### `h009` · Conclusão curta – desbloqueio realizado
- **bloco:** 6 · **tema:** Geral · **usos:** 83 · universal
- **palavrasChave:** desbloqueio realizado, curta, conclusão
- **seguintes:** —

> Dessa forma, o desbloqueio foi devidamente realizado.

<details><summary>Variações de redação (5)</summary>

> Portanto, desbloqueado.

> Diante disso, o desbloqueio será realizado.

> Portanto, o desbloqueio foi realizado.

> Por essa razão, o desbloqueio foi devidamente realizado.

> Diante disso, o CAR foi devidamente desbloqueado.

</details>

##### `h016` · Conclusão curta – bloqueio mantido
- **bloco:** 6 · **tema:** Geral · **usos:** 44 · universal
- **palavrasChave:** bloqueio mantido, curta, conclusão
- **seguintes:** `h019` (9%), `h012` (5%)

> Portanto, o bloqueio será mantido.

<details><summary>Variações de redação (1)</summary>

> Bloqueio foi mantido.

</details>

##### `h034` · Conclusão – produtor e área em conformidade, CAR desbloqueado
- **bloco:** 6 · **tema:** Geral · **usos:** 18 · universal
- **palavrasChave:** desbloqueio realizado, em conformidade, desbloqueado, conclusão
- **seguintes:** —

> Diante do exposto, conclui-se que o produtor e a área analisada encontram-se, até a presente data, em conformidade ambiental, razão pela qual o CAR foi devidamente desbloqueado.

<details><summary>Variações de redação (3)</summary>

> Dessa forma, conclui-se que o produtor e a área em questão encontram-se, até a presente data, em conformidade socioambiental para negociações, motivo pelo qual o CAR foi devidamente desbloqueado.

> Diante do exposto, conclui-se que, até a presente data, a empresa e a área analisada encontram-se em conformidade socioambiental para fins de negociação, motivo pelo qual o CAR foi devidamente desbloqueado.

> Diante do exposto, conclui-se que {{sujeito}} {{nome}} e a área analisada encontram-se, até a presente data, em conformidade ambiental, não havendo risco efetivo de triangulação do produto, motivo pelo qual o CAR foi devidamente desbloqueado.

</details>

##### `h048` · Conclusão – sem área de cultivo, não se recomenda negociar
- **bloco:** 6 · **tema:** Geral · **usos:** 12
- **palavrasChave:** cultivo de grãos, recomenda, negociar, realização
- **seguintes:** `h071` (33%), `h298` (25%)

> Diante do exposto, considerando a situação atual da propriedade e a inexistência de área de cultivo de grãos, não se recomenda, neste momento, a realização de negociações com este cliente.

<details><summary>Variações de redação (1)</summary>

> Diante do exposto, considerando o cenário atual da propriedade e a ausência de cultivo de grãos, não se recomenda, neste momento, a realização de negociações com o produtor vinculadas a esta área específica.

</details>

##### `h055` · Conclusão – clifor do produtor desbloqueado
- **bloco:** 6 · **tema:** Geral · **usos:** 10
- **palavrasChave:** clifor, desbloqueio realizado, desbloqueado, conclusão
- **seguintes:** —

> Dessa forma, o clifor do produtor foi devidamente desbloqueado.

<details><summary>Variações de redação (2)</summary>

> Portanto, o clifor do produtor foi devidamente desbloqueado por estar em conformidade.

> Dessa forma, considerando a conformidade ambiental das áreas analisadas, o clifor do produtor foi devidamente desbloqueado.

</details>

##### `h075` · Conclusão – em conformidade, desbloqueio do CAR realizado
- **bloco:** 6 · **tema:** Geral · **usos:** 8
- **palavrasChave:** em conformidade, desbloqueio, conclusão, socioambiental
- **seguintes:** —

> Dessa forma, conclui-se que o produtor e a área indicada para análise encontram-se em conformidade socioambiental, razão pela qual o desbloqueio do CAR foi devidamente realizado.

<details><summary>Variações de redação (1)</summary>

> Dessa forma, conclui-se que o produtor e a área encontram-se em conformidade socioambiental.

</details>

##### `h138` · Conclusão – não foram identificados impedimentos ambientais ou produtivos que inviabilizem…
- **bloco:** 6 · **tema:** Geral · **usos:** 5
- **palavrasChave:** capacidade produtiva, desbloqueio realizado, inviabilizem, produtivos, impedimentos
- **seguintes:** —

> Assim, não foram identificados impedimentos ambientais ou produtivos que inviabilizem a operação, motivo pelo qual o desbloqueio foi devidamente realizado.

##### `h145` · Conclusão – considerando que a área analisada se encontra em conformidade com os critérios…
- **bloco:** 6 · **tema:** Geral · **usos:** 5
- **palavrasChave:** capacidade produtiva, volume, em conformidade, critérios, contratado, aplicáveis, inexistência
- **seguintes:** —

> Diante do exposto, considerando que a área analisada se encontra em conformidade com os critérios socioambientais aplicáveis e que o volume contratado é compatível com a capacidade produtiva estimada do imóvel, conclui-se pela inexistência de impedimentos ambientais para a operação, razão pela qual o desbloqueio da área foi devidamente realizado.

<details><summary>Variações de redação (1)</summary>

> Diante do exposto, considerando que o produtor e a área analisada se encontram em conformidade sob a ótica socioambiental, bem como que o volume a ser entregue é compatível com a capacidade produtiva estimada, conclui-se pela inexistência de impedimentos ambientais para a operação, razão pela qual o desbloqueio foi devidamente realizado.

</details>

##### `h195` · Conclusão – considerando que a área analisada se encontra em conformidade socioambiental e…
- **bloco:** 6 · **tema:** Geral · **usos:** 4
- **palavrasChave:** capacidade produtiva, volume, em conformidade, socioambiental, natureza, negociado, compatível
- **seguintes:** —

> Diante do exposto, considerando que a área analisada se encontra em conformidade socioambiental e que o volume a ser negociado é compatível com a capacidade produtiva estimada, conclui-se que não há impedimentos de natureza ambiental para a operação.

<details><summary>Variações de redação (1)</summary>

> Diante do exposto, considerando que as áreas avaliadas encontram-se em conformidade sob o aspecto socioambiental e que o volume a ser negociado é compatível com a capacidade produtiva estimada, conclui-se que não há impedimentos de ordem ambiental, motivo pelo qualo desbloqueio foi devidamente realizado.

</details>

##### `h243` · Conclusão – diante desse risco, não recomendamos negociações com este produtor, tanto na…
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** embargo, 150 km, recomendamos, risco, negociações, dentro
- **seguintes:** `h119` (100%)

> Diante desse risco, não recomendamos negociações com este produtor, tanto na área embargada quanto em outras áreas localizadas dentro de um raio de 150 km do passivo ambiental identificado.

##### `h292` · Conclusão – considerando que o produtor e a área analisada encontram-se em conformidade…
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** em conformidade, impedimentos, socioambiental
- **seguintes:** `h009` (67%)

> Diante do exposto, considerando que o produtor e a área analisada encontram-se em conformidade socioambiental, conclui-se que não há impedimentos ambientais.

##### `h294` · Conclusão – considerando que as áreas analisadas se encontram em conformidade…
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** desbloqueio realizado, em conformidade, analisadas, socioambiental, impedimentos
- **seguintes:** —

> Diante do exposto, considerando que as áreas analisadas se encontram em conformidade socioambiental, conclui-se que não há impedimentos ambientais para a operação, motivo pelo qual o desbloqueio foi devidamente realizado.

##### `h295` · Conclusão – considerando que a área analisada encontra-se em conformidade sob o aspecto…
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, desbloqueio realizado, em conformidade, aspecto, haver, negociado, compatível
- **seguintes:** —

> Diante do exposto, considerando que a área analisada encontra-se em conformidade sob o aspecto socioambiental e que o volume a ser negociado é compatível com sua capacidade produtiva estimada, conclui-se não haver impedimentos ambientais. Dessa forma, o desbloqueio foi realizado.

##### `h308` · Conclusão – sob esse aspecto, a área encontra-se em conformidade socioambiental
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** em conformidade, aspecto, socioambiental
- **seguintes:** `cap-uf` (67%)

> Dessa forma, sob esse aspecto, a área encontra-se em conformidade socioambiental.

##### `h310` · Conclusão – verifica-se que tanto o cliente quanto a área analisada atendem aos critérios…
- **bloco:** 6 · **tema:** Geral · **usos:** 3
- **palavrasChave:** em conformidade, atendem, verifica-se, critérios, aplicáveis
- **seguintes:** —

> Diante do exposto, verifica-se que tanto {{sujeito}} quanto a área analisada atendem aos critérios de conformidade socioambiental aplicáveis.

- `con-fav-lar` **Favorável – licenciamento vigente** — 0 usos · já existe (`TX.conFavLar`) · seguintes: —
- `exc-pontual` **Desbloqueio excepcional e pontual** — 0 usos · já existe (`TX.excPontual`) · seguintes: —
- `exc-vedadas` **Novas negociações permanecem vedadas** — 0 usos · já existe (`TX.excVedadas`) · seguintes: —
- `con-lar` **Bloqueio mantido – LAR vencido** — 0 usos · já existe (`TX.conLarVencido`) · seguintes: —
- `con-base` **Conclusão – modelo-base** — 0 usos · já existe (`TX.conBase`) · seguintes: —

#### Tema: PRODES 2020 (136 usos)

##### `h005` · PRODES 2020 – conclusão: passivo desconsiderado e CAR desbloqueado
- **bloco:** 6 · **tema:** PRODES 2020 · **usos:** 136
- **palavrasChave:** prodes, prodes 2020, desconsiderado, passivo, desbloqueado
- **seguintes:** `h012` (2%)

> Dessa forma, o passivo foi desconsiderado e o CAR desbloqueado.

<details><summary>Variações de redação (1)</summary>

> Dessa forma, o passivo foi desconsiderado e os CARs desbloqueados.

</details>


#### Tema: Embargo Ibama (120 usos)

##### `h027` · Conclusão – cliente e área em conformidade, CAR desbloqueado
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 22
- **palavrasChave:** desbloqueio realizado, em conformidade, embargo ibama, desbloqueado, conclusão
- **seguintes:** `h012` (18%)

> Dessa forma, até a presente data, tanto {{sujeito}} quanto a área encontram-se em conformidade ambiental, motivo pelo qual o CAR foi devidamente desbloqueado.

<details><summary>Variações de redação (3)</summary>

> Assim, conclui-se que, até a presente data, o produtor e a área encontram-se em conformidade socioambiental, motivo pelo qual o CAR foi devidamente desbloqueado.

> Dessa forma, até a presente data, tanto {{sujeito}} quanto a área em questão estão em conformidade ambiental, motivo pelo qual o Clifor e o CAR foram desbloqueados.

> Dessa forma, tanto {{sujeito}} quanto a área em análise encontram-se, até a presente data, em conformidade socioambiental, motivo pelo qual o CAR foi devidamente desbloqueado.

</details>

##### `h040` · Conclusão – área em conformidade, sem impedimentos, desbloqueio realizado
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 14
- **palavrasChave:** desbloqueio realizado, em conformidade, embargo ibama, impedimentos, inexistência, conclusão
- **seguintes:** —

> Diante do exposto, considerando que a área analisada encontra-se em conformidade socioambiental, conclui-se pela inexistência de impedimentos ambientais, motivo pelo qual o desbloqueio foi devidamente realizado.

##### `h041` · Conclusão – até a presente data, o produtor e a área em análise estão em conformidade…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 14
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, embargo ibama, socioambiental, desbloqueado
- **seguintes:** —

> Portanto, até a presente data, o produtor e a área em análise estão em conformidade socioambiental, motivo pelo qual o clifor foi devidamente desbloqueado.

<details><summary>Variações de redação (1)</summary>

> Por essa razão, até a presente data, o produtor e a área estão em conformidade socioambiental, motivo pelo qual o CAR foi desbloqueado.

</details>

##### `h058` · Conclusão – sem restrições próprias, situação em conformidade
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 9
- **palavrasChave:** em conformidade, embargo ibama, próprias, situação, relacionadas, conclusão
- **seguintes:** `h106` (67%)

> Considerando que não há restrições ambientais próprias relacionadas ao produtor ou à área analisada, conclui-se que a situação está em conformidade socioambiental.

##### `h090` · Conclusão – conformidade e volume compatível, desbloqueio realizado
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 7
- **palavrasChave:** capacidade produtiva, volume, desbloqueio realizado, em conformidade, embargo ibama, compatível, qualo
- **seguintes:** —

> Diante do exposto, considerando que a área analisada encontra-se em conformidade socioambiental, no momento da análise, e que o volume da operação é compatível com a capacidade produtiva estimada, conclui-se que não há impedimentos ambientais para a operação, motivo pelo qualo desbloqueio foi devidamente realizado.

<details><summary>Variações de redação (1)</summary>

> Diante do exposto, considerando que a área analisada encontra-se em conformidade socioambiental e que o volume contratado é compatível com sua capacidade produtiva estimada, conclui-se que não há impedimentos ambientais para a continuidade da operação. Dessa forma, o desbloqueio foi devidamente realizado.

</details>

##### `h106` · Conclusão – o bloqueio foi removido
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 6
- **palavrasChave:** embargo ibama, removido
- **seguintes:** —

> Dessa forma, o bloqueio foi removido.

##### `h123` · Conclusão – e considerando as informações disponíveis até a presente data, conclui-se que o…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, embargo ibama, informações, disponíveis, desbloqueado
- **seguintes:** —

> Diante do exposto e considerando as informações disponíveis até a presente data, conclui-se que o produtor e a área analisada encontram-se em conformidade ambiental, motivo pelo qual o clifor do produtor foi desbloqueado.

##### `h136` · Conclusão – em análise verificou-se que o polígono embargado está devidamente isolado da…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** embargo, isolado, cultivo de grãos, em conformidade, embargo ibama, embargado, polígono, aspecto
- **seguintes:** `h018` (40%)

> Em análise verificou-se que o polígono embargado está devidamente isolado da área destinada ao cultivo de grãos, portanto, sob este aspecto em conformidade.

##### `h143` · Conclusão – considera-se o produtor em conformidade, motivo pelo qual o clifor foi…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 5
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, embargo ibama, considera-se, desbloqueado
- **seguintes:** —

> Dessa forma, considera-se o produtor em conformidade, motivo pelo qual o clifor foi devidamente desbloqueado.

<details><summary>Variações de redação (1)</summary>

> Dessa forma, o produtor e a área analisada encontram-se em conformidade, motivo pelo qual o clifor foi devidamente desbloqueado.

</details>

##### `h152` · Conclusão – as áreas indicadas para análise não apresentam restrições ambientais; portanto…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** em conformidade, embargo ibama, ambientaism, apresentam
- **seguintes:** —

> As áreas indicadas para análise não apresentam restrições ambientais; portanto, estão em conformidade.

##### `h174` · Conclusão – considerando que a área analisada encontra-se em conformidade socioambiental e…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, embargo ibama, inviabilizem, socioambiental, desbloqueado
- **seguintes:** —

> Diante do exposto, considerando que a área analisada encontra-se em conformidade socioambiental e que não foram identificados impedimentos ambientais que inviabilizem a operação, o clifor do produtor foi devidamente desbloqueado.

##### `h176` · Conclusão – considerando que a área analisada está em conformidade socioambiental e que o…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** capacidade produtiva, volume, desbloqueio realizado, em conformidade, embargo ibama, entregue, socioambiental, inexistência
- **seguintes:** —

> Diante do exposto, considerando que a área analisada está em conformidade socioambiental e que o volume a ser entregue pelo produtor é compatível com sua capacidade produtiva, conclui-se pela inexistência de impedimentos ambientais, razão pela qual o desbloqueio foi devidamente realizado.

##### `h209` · Conclusão – tanto o produtor como a área estão em conformidade para negociações
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** em conformidade, embargo ibama, negociações
- **seguintes:** —

> Assim, tanto o produtor como a área estão em conformidade para negociações.

##### `h226` · Conclusão – considera-se a área em conformidade e apta para negociações
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** em conformidade, embargo ibama, considera-se, apta, negociações
- **seguintes:** —

> Dessa forma, considera-se a área em conformidade e apta para negociações.

##### `h235` · Conclusão – logo, recomendamos que não seja realizada qualquer negociação com este produtor…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** 150 km, embargo ibama, logo, recomendamos, negociação, mencionadas
- **seguintes:** `h236` (100%)

> Logo, recomendamos que não seja realizada qualquer negociação com este produtor nas áreas mencionadas, nem em outras que estejam localizadas dentro do raio de 150 km.

##### `h240` · Conclusão – não recomendamos a realização de negociações com este produtor na área…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** embargo, 150 km, bloqueio mantido, embargo ibama, realização, recomendamos, embargada, situadas
- **seguintes:** —

> Dessa forma, não recomendamos a realização de negociações com este produtor na área embargada, nem em outras áreas situadas dentro de um raio de 150 km do passivo ambiental identificado. Por esse motivo, o bloqueio será mantido.

##### `h253` · Conclusão – a fazenda clifor foi devidamente desbloqueada
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** clifor, desbloqueio realizado, embargo ibama, fazenda, desbloqueada
- **seguintes:** —

> Portanto, a fazenda clifor {{clifor}} foi devidamente desbloqueada.

##### `h258` · Conclusão – não havendo motivos para manutenção do bloqueio, o clifor foi desbloqueado
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** clifor, desbloqueio realizado, embargo ibama, motivos, havendo, manutenção
- **seguintes:** —

> Portanto, não havendo motivos para manutenção do bloqueio, o clifor foi desbloqueado.

##### `h285` · Conclusão – considerando a ausência de impedimentos ambientais efetivos, conclui-se que…
- **bloco:** 6 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** desbloqueio realizado, em conformidade, embargo ibama, efetivos, ausência, impedimentos, desbloqueado
- **seguintes:** —

> Dessa forma, considerando a ausência de impedimentos ambientais efetivos, conclui-se que, até a presente data, a empresa e a área analisada encontram-se em conformidade ambiental, motivo pelo qual o CAR foi devidamente desbloqueado.


#### Tema: Prospecção de clientes (103 usos)

##### `h013` · Conclusão – produtor e área em conformidade para negociações (até a presente data)
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 52
- **palavrasChave:** em conformidade, prospecção de clientes, negociações, conclusão
- **seguintes:** `h012` (19%)

> Portanto, até a presente data, o produtor e a área estão em conformidade ambiental para negociações.

<details><summary>Variações de redação (3)</summary>

> Portanto, o produtor e a área estão em conformidade.

> Portanto, até a presente data, o produtor e a área encontram-se em conformidade para negociações.

> Dessa forma, até a presente data, o produtor e a área registrada no CAR {{car}} estão em conformidade para negociações.

</details>

- `con-fav` **Favorável – prospecção** — 22 usos · já existe (`TX.conFavoravel`) · seguintes: `mon-cap` (45%), `h314` (14%)

##### `h083` · Conclusão – produtor e área em conformidade para negociações
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 7
- **palavrasChave:** em conformidade, prospecção de clientes, negociações, conclusão
- **seguintes:** `h012` (29%)

> Portanto, o produtor e a área indicada para análise, até a presente data, estão em conformidade para negociações.

- `con-prodes` **Bloqueio mantido – PRODES** — 4 usos · já existe (`TX.conProdes`) · seguintes: —

##### `h147` · Conclusão – risco de triangulação, não recomendamos (150 km)
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 4
- **palavrasChave:** triangulação, 150 km, prospecção de clientes, recomendamos, fiquem, risco
- **seguintes:** `h117` (100%)

> Portanto, diante do risco evidente de triangulação do produto, não recomendamos a negociação da commodity soja com este produtor, nessa área e em áreas que fiquem a menos de 150 km da restrição.

##### `h207` · Conclusão – o produtor e a área registrada no CAR está em conformidade para negociações
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** em conformidade, prospecção de clientes, negociações
- **seguintes:** —

> Dessa forma, o produtor e a área registrada no CAR {{car}} está em conformidade para negociações.

##### `h272` · Conclusão – considerando as informações disponíveis até o momento, conclui-se que o…
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** em conformidade, prospecção de clientes, informações, disponíveis, momento, negociações
- **seguintes:** —

> Portanto, considerando as informações disponíveis até o momento, conclui-se que o produtor e a área analisada encontram-se em conformidade ambiental para negociações.

##### `h311` · Conclusão – conclui-se que, até a presente data, o cliente e a área objeto desta análise…
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** em conformidade, prospecção de clientes, compliance, critérios, nome, socioambiental
- **seguintes:** —

> Diante do exposto, conclui-se que, até a presente data, {{sujeito}} {{nome}} e a área objeto desta análise encontram-se em conformidade com os critérios de compliance socioambiental.

##### `h315` · Conclusão – caso o volume a ser negociado com o produtor seja superior à capacidade…
- **bloco:** 6 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, em conformidade, prospecção de clientes, negociado, superior, caso
- **seguintes:** `h316` (100%)

> Assim, caso o volume a ser negociado com o produtor seja superior à capacidade produtiva estimada da área, será necessária a apresentação de áreas complementares de originação, de modo que o volume negociado possua adequado respaldo produtivo e conformidade socioambiental compatíveis com a operação.

- `con-fav-desb` **Favorável – com desbloqueio** — 1 usos · já existe (`TX.conFavDesbloqueio`) · seguintes: —
- `con-pvg` **Bloqueio mantido – PVG** — 1 usos · já existe (`TX.conPvg`) · seguintes: —

#### Tema: CAR Suspenso/Cancelado (44 usos)

##### `h036` · Conclusão – bloqueio do CAR será mantido
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 17
- **palavrasChave:** car suspenso/cancelado, mantido, conclusão
- **seguintes:** `h019` (88%)

> Por essa razão, o bloqueio do CAR será mantido.

##### `h088` · Conclusão – não atende requisitos legais e de compliance, bloqueio mantido
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 7
- **palavrasChave:** bloqueio mantido, car suspenso/cancelado, compliance, legais, atende, requisitos
- **seguintes:** `h313` (43%), `h019` (29%)

> Diante do exposto, considerando que a área analisada não atende aos requisitos legais e aos critérios de compliance socioambiental, o bloqueio será mantido.

<details><summary>Variações de redação (1)</summary>

> Diante do exposto, considerando que a área não atende aos requisitos de conformidade socioambiental, o bloqueio será mantido.

</details>

##### `h109` · CAR Suspenso/Cancelado – impedido até a regularização
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 6
- **palavrasChave:** car suspenso/cancelado, status do car, regularização, impedidos, classificados
- **seguintes:** `h318` (33%)

> Assim, imóveis classificados com status "Suspenso" ou "Cancelado" permanecem impedidos de serem vinculados a negociações ou operações até a regularização de sua situação cadastral.

##### `h169` · Conclusão – contrato anterior à suspensão do CAR: desbloqueio excepcional
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** car suspenso/cancelado, status do car, contrato, clifor, desbloqueio excepcional, família/terceiros, anterior, suspensão
- **seguintes:** `h132` (100%)

> Diante do exposto, e considerando que o contrato foi firmado anteriormente à alteração do status do CAR para “Suspenso”,o desbloqueio do clifor será realizado de forma excepcional, exclusivamente para fins de cumprimento desta operação específica.

##### `h178` · Conclusão – imóveis com status "Suspenso" ou "Cancelado" não são elegíveis para vinculação…
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** car suspenso/cancelado, status do car, elegíveis, imóveis, vinculação
- **seguintes:** —

> Dessa forma, imóveis com status "Suspenso" ou "Cancelado" não são elegíveis para vinculação a negociações ou contratação de operações.

##### `h182` · Conclusão – imóveis com status "Suspenso" ou "Cancelado" permanecem inelegíveis para novas…
- **bloco:** 6 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** car suspenso/cancelado, status do car, inelegíveis, permanecem, novas
- **seguintes:** `op-hedge` (50%)

> Dessa forma, imóveis com status "Suspenso" ou "Cancelado" permanecem inelegíveis para novas negociações até que sua situação cadastral seja regularizada perante o órgão ambiental competente.

- `exc-anterior` **Operação formalizada antes do apontamento** — 1 usos · já existe (`TX.excAnterior`) · seguintes: —
- `exc-sem-reg` **Desbloqueio sem regularização da restrição** — 1 usos · já existe (`TX.excSemRegularizar`) · seguintes: —

#### Tema: Embargo Sema-MT (38 usos)

##### `h100` · Conclusão – embargo Sema-MT isolado do plantio, desbloqueio realizado
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** sema-mt, embargo, isolado, cultivo de grãos, desbloqueio realizado, embargo sema-mt, plantio
- **seguintes:** `h160` (67%)

> Considerando que a área solicitada para desbloqueio está localizada em {{municipio}} e, embora possua embargo pela SEMA-MT, o polígono encontra-se isolado do plantio de grãos, o desbloqueio foi realizado.

##### `h113` · Conclusão – o produtor e a área, até a presente data, estão em conformidade ambiental…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 6
- **palavrasChave:** desbloqueio realizado, em conformidade, embargo sema-mt, desbloqueado
- **seguintes:** —

> Dessa forma, o produtor e a área, até a presente data, estão em conformidade ambiental, motivo pelo qual o CAR foi desbloqueado.

<details><summary>Variações de redação (1)</summary>

> Dessa forma, o produtor e a área analisada permanecem, até a presente data, em conformidade ambiental, motivo pelo qual o respectivo CAR foi devidamente desbloqueado.

</details>

##### `h149` · Conclusão – o produtor e a área analisada são considerados em conformidade
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** em conformidade, embargo sema-mt, considerados
- **seguintes:** —

> Dessa forma, o produtor e a área analisada são considerados em conformidade.

##### `h163` · Conclusão – confirma-se que tanto o cliente quanto a área estão em conformidade, motivo…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 4
- **palavrasChave:** desbloqueio realizado, em conformidade, família/terceiros, embargo sema-mt, confirma-se
- **seguintes:** —

> Diante disso, confirma-se que tanto {{sujeito}} quanto a área estão em conformidade, motivo pelo qual o desbloqueio foi realizado.

##### `h206` · Conclusão – a situação foi considerada em conformidade, e a área solicitada foi devidamente…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** desbloqueio realizado, em conformidade, embargo sema-mt, considerada, solicitada, situação, desbloqueada
- **seguintes:** —

> Diante disso, a situação foi considerada em conformidade, e a área solicitada foi devidamente desbloqueada.

##### `h219` · Conclusão – não recomendamos (área não isolada, raio de 150 km)
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** isolado, não isolado, 150 km, embargo sema-mt, isolada, recomendamos, raio, nessas
- **seguintes:** —

> Diante disso, não recomendamos o prosseguimento da operação com esse produtor, nessas áreas ou em qualquer outra situada dentro de um raio de 150 km da área com restrição não isolada.

##### `h255` · Conclusão – até a presente data, tanto o cliente quanto a área analisada estão em…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** em conformidade, embargo sema-mt
- **seguintes:** —

> Diante disso, até a presente data, tanto {{sujeito}} quanto a área analisada estão em conformidade

##### `h256` · Conclusão – o produtor e a área indicada para análise atendem às exigências de conformidade…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** em conformidade, embargo sema-mt, exigências, atendem, socioambiental
- **seguintes:** —

> Dessa forma, o produtor e a área indicada para análise atendem às exigências de conformidade socioambiental.

##### `h270` · Conclusão – considerando que os passivos ambientais identificados estão localizados em…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, embargo sema-mt, estado, distante, originação
- **seguintes:** —

> Dessa forma, considerando que os passivos ambientais identificados estão localizados em outro estado, distante da área de originação, a área está em conformidade, motivo pelo qual o clifor do produtor foi devidamente desbloqueado.

##### `h325` · Conclusão – o desbloqueio será realizado, uma vez que as inconsistências inicialmente…
- **bloco:** 6 · **tema:** Embargo Sema-MT · **usos:** 3
- **palavrasChave:** embargo sema-mt, inconsistências, apontadas, inicialmente, esclarecidas
- **seguintes:** `h139` (100%)

> Diante do exposto, o desbloqueio será realizado, uma vez que as inconsistências inicialmente apontadas foram devidamente esclarecidas.


#### Tema: Sem CAR (31 usos)

##### `h020` · Enquadramento alterado de DIRETO para NÃO SE APLICA
- **bloco:** 6 · **tema:** Sem CAR · **usos:** 31
- **palavrasChave:** enquadramento direto/indireto, em conformidade, sem car, alterado, aplica
- **seguintes:** `tf-reenq` (94%), `h159` (6%)

> Dessa forma, o enquadramento do produtor está sendo alterado de DIRETO para NÃO SE APLICA, em conformidade com a diretriz vigente.


#### Tema: Bloqueio manual sem motivo (25 usos)

##### `h024` · Conclusão – produtor em conformidade, clifor desbloqueado
- **bloco:** 6 · **tema:** Bloqueio manual sem motivo · **usos:** 25
- **palavrasChave:** clifor, desbloqueio realizado, em conformidade, bloqueio manual sem motivo, desbloqueado, considerado, conclusão
- **seguintes:** —

> Diante disso, o produtor foi considerado em conformidade e o seu clifor foi devidamente desbloqueado.


#### Tema: Cultivo inferior a 10% (22 usos)

##### `h148` · Conclusão – por precaução, por ora o bloqueio será mantido
- **bloco:** 6 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** bloqueio mantido, cultivo inferior a 10%, precaução
- **seguintes:** —

> Dessa forma, por precaução, por ora o bloqueio será mantido.

##### `h180` · Conclusão – verifica-se que a área analisada encontra-se em conformidade sob a perspectiva…
- **bloco:** 6 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** capacidade produtiva, volume, em conformidade, cultivo inferior a 10%, perspectiva, verifica-se, pretendido, negociação
- **seguintes:** `h138` (100%)

> Diante do exposto, verifica-se que a área analisada encontra-se em conformidade sob a perspectiva socioambiental e que o volume pretendido para negociação é compatível com a capacidade produtiva estimada da propriedade.

##### `h184` · Conclusão – avaliar volume da garantia frente à capacidade limitada
- **bloco:** 6 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** capacidade produtiva, volume, cultivo inferior a 10%, limitada, garantia, produtivo, frente
- **seguintes:** `h185` (100%)

> Diante do exposto, considerando a limitada capacidade produtiva da área, recomenda-se que seja avaliada a compatibilidade entre o volume de grãos envolvido na garantia e o potencial produtivo do imóvel, de modo a assegurar que o montante negociado possua respaldo produtivo e socioambiental adequado.

##### `h185` · Conclusão – desbloqueio realizado com ressalva
- **bloco:** 6 · **tema:** Cultivo inferior a 10% · **usos:** 4
- **palavrasChave:** desbloqueio realizado, cultivo inferior a 10%, ressalva, permanecendo, contratação, mencionada
- **seguintes:** —

> Dessa forma, o desbloqueio da área foi realizado, permanecendo a ressalva acima mencionada para fins de análise e contratação da operação.

- `con-cultivo` **Bloqueio mantido – ausência de cultivo** — 3 usos · já existe (`TX.conCultivo`) · seguintes: `ori-areas` (100%)

##### `h320` · Conclusão – sob a perspectiva socioambiental, tanto o cliente quanto a área objeto da…
- **bloco:** 6 · **tema:** Cultivo inferior a 10% · **usos:** 3
- **palavrasChave:** embargo, em conformidade, cultivo inferior a 10%, perspectiva, participação, impeçam, demais
- **seguintes:** `h321` (100%)

> Dessa forma, sob a perspectiva socioambiental, tanto {{sujeito}} quanto a área objeto da presente análise encontram-se em conformidade para participação em operações comerciais, não tendo sido identificados passivos, embargos ou demais restrições ambientais que impeçam sua vinculação.


#### Tema: Enquadramento direto/indireto (18 usos)

##### `h046` · Enquadramento atualizado de DIRETO para INDIRETO
- **bloco:** 6 · **tema:** Enquadramento direto/indireto · **usos:** 12
- **palavrasChave:** enquadramento direto/indireto, cliente indireto, em conformidade, atualizado
- **seguintes:** `tf-reenq` (100%)

> Dessa forma, o enquadramento da empresa foi atualizado de DIRETO para INDIRETO, em conformidade com a diretriz vigente.

##### `h095` · Enquadramento DIRETO → INDIRETO com direcionamento ao MDM
- **bloco:** 6 · **tema:** Enquadramento direto/indireto · **usos:** 6
- **palavrasChave:** enquadramento direto/indireto, mdm, cliente indireto, em conformidade, família/terceiros, execução
- **seguintes:** —

> Dessa forma, o enquadramento da empresa está sendo alterado de DIRETO para INDIRETO, em conformidade com a diretriz mencionada. A confirmação e execução do procedimento de alteração será realizada pelo time de MDM, ao qual o chamado já foi direcionado para execução (chamado: {{chamadoMDM}})


#### Tema: Embargo Semad-GO (6 usos)

##### `h216` · Conclusão – não recomendamos (raio de 150 km)
- **bloco:** 6 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** 150 km, embargo semad-go, recomendamos, prosseguimento, estejam, raio
- **seguintes:** —

> Diante disso, não recomendamos o prosseguimento da negociação com este produtor, tanto na área indicada quanto em outras que estejam localizadas a menos de 150 km da área com restrição.

##### `h303` · Conclusão – o bloqueio será mantido, até que sejam apresentados documentos ou manifestações…
- **bloco:** 6 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** car suspenso/cancelado, documentos, bloqueio mantido, embargo semad-go, manifestações, formais, apresentados
- **seguintes:** —

> Diante do exposto, o bloqueio será mantido, até que sejam apresentados documentos ou manifestações formais do órgão ambiental competente que comprovem o cancelamento, suspensão ou descaracterização do passivo ambiental identificado.


#### Tema: Terra Indígena/Quilombola (3 usos)

##### `h213` · Terra Indígena – monitorar o processo de demarcação
- **bloco:** 6 · **tema:** Terra Indígena/Quilombola · **usos:** 3
- **palavrasChave:** terra indígena, terra indígena/quilombola, monitorar, demarcação, processo
- **seguintes:** `h214` (100%)

> Contudo, recomendamos monitorar o cliente/fornecedor, para identificar e alertar sobre qualquer avanço no processo de demarcação da terra indígena.


#### Tema: Não há restrições (3 usos)

##### `h284` · Conclusão – o motivo do bloqueio foi sanado, restabelecendo a conformidade da área
- **bloco:** 6 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** em conformidade, não há restrições, sanado, restabelecendo
- **seguintes:** `h009` (100%)

> Dessa forma, o motivo do bloqueio foi sanado, restabelecendo a conformidade da área.


#### Tema: Inexistência de área de cultivo (3 usos)

##### `h297` · Conclusão – considerando a inexistência de atividade produtiva de grãos na área analisada…
- **bloco:** 6 · **tema:** Inexistência de área de cultivo · **usos:** 3
- **palavrasChave:** capacidade produtiva, inexistência de área de cultivo, atividade, eventualmente, produtos
- **seguintes:** `h048` (100%)

> Entretanto, considerando a inexistência de atividade produtiva de grãos na área analisada, conclui-se que os produtos a serem eventualmente negociados não têm origem nesta propriedade, o que inviabiliza sua vinculação como área de originação.


### 7 – Orientação e encerramento

#### Tema: Geral (94 usos)

- `ori-areas` **Apresentar outras áreas de originação** — 17 usos · universal · já existe (`TX.oriAreas`) · seguintes: `cap-uf` (12%)

##### `h039` · Encerramento – caso já analisado em outro chamado
- **bloco:** 7 · **tema:** Geral · **usos:** 15 · universal
- **palavrasChave:** caso, encerramento
- **seguintes:** —

> Caso já analisado no chamado {{chamado}}.

<details><summary>Variações de redação (1)</summary>

> Caso já analisado por meio do chamado {{chamado}}.

</details>

##### `h047` · Encerramento – a pedido da solicitante
- **bloco:** 7 · **tema:** Geral · **usos:** 12 · universal
- **palavrasChave:** chamado encerrado, encerramento
- **seguintes:** —

> Chamado encerrado a pedido da solicitante.

<details><summary>Variações de redação (1)</summary>

> Chamado encerrado a pedido do solicitante.

</details>

##### `h063` · Pendência – aguardando retorno da solicitante
- **bloco:** 7 · **tema:** Geral · **usos:** 9
- **palavrasChave:** sem retorno, aguardo, fico, aguardando
- **seguintes:** —

> Fico no aguardo do retorno.

##### `h071` · Orientação – apresentar a área efetiva de formação de lavoura
- **bloco:** 7 · **tema:** Geral · **usos:** 8 · universal
- **palavrasChave:** cultivo de grãos, em conformidade, efetiva, lavoura, formação, submetida
- **seguintes:** —

> Orienta-se que o produtor identifique e apresente formalmente a área efetiva de formação de lavoura, devidamente regularizada e passível de comprovação, para que seja submetida a nova análise de conformidade ambiental pelo time de Sustentabilidade.

##### `h087` · Ciência da filial sobre a capacidade produtiva (risco do excedente)
- **bloco:** 7 · **tema:** Geral · **usos:** 7 · universal
- **palavrasChave:** capacidade produtiva, volume, ciência, filial, integralmente, receber
- **seguintes:** —

> Por fim, ressalta-se que a filial, por meio deste parecer, tem ciência da capacidade produtiva da área informada. Caso venha a receber volume superior ao potencial produtivo estimado, assumirá integralmente os riscos decorrentes da operação, a qual não possui anuência da área de Sustentabilidade.

<details><summary>Variações de redação (1)</summary>

> Por fim, ressalta-se que a filial, por meio deste parecer, declara estar ciente da capacidade produtiva das áreas informadas. Caso venha a recepcionar volume superior ao potencial estimado, assumirá integralmente os riscos decorrentes da operação, a qual não conta com anuência da área de Sustentabilidade.

</details>

##### `h108` · Orientação – a necessidade de observância da compatibilidade entre a capacidade produtiva da…
- **bloco:** 7 · **tema:** Geral · **usos:** 6
- **palavrasChave:** capacidade produtiva, volume, em conformidade, observância, necessidade, compatibilidade, comercializada
- **seguintes:** —

> Ressalta-se, contudo, a necessidade de observância da compatibilidade entre a capacidade produtiva da área e os volumes negociados, de modo a assegurar que toda a produção comercializada possua respaldo produtivo e conformidade socioambiental compatíveis com o montante contratado.

##### `h119` · Disposição para nova análise em caso de desembargo
- **bloco:** 7 · **tema:** Geral · **usos:** 5
- **palavrasChave:** embargo, documentos, desembargo, disposição, nova, caso
- **seguintes:** —

> Caso haja decisão administrativa ou judicial que determine o desembargo da área, coloco-me à disposição para realizar nova análise.

##### `h139` · Orientação – observar a capacidade produtiva na garantia
- **bloco:** 7 · **tema:** Geral · **usos:** 5
- **palavrasChave:** capacidade produtiva, volume, garantia, resguardando, hipótese, obrigações
- **seguintes:** —

> Recomenda-se, entretanto, que seja observada a capacidade produtiva estimada da área quando da formalização da garantia, de modo a assegurar compatibilidade entre o volume de produção esperado e as obrigações assumidas, resguardando a operação em eventual hipótese de inadimplemento e execução da garantia.

##### `h141` · Encerramento – falta de retorno do solicitante
- **bloco:** 7 · **tema:** Geral · **usos:** 5
- **palavrasChave:** chamado encerrado, sem retorno, falta, encerramento
- **seguintes:** —

> Chamado encerrado por falta de retorno do solicitante.

<details><summary>Variações de redação (1)</summary>

> Chamado encerrado por falta de resposta.

</details>

##### `h142` · Desbloqueio excepcional só com risco avaliado e autorização de SP por e-mail
- **bloco:** 7 · **tema:** Geral · **usos:** 5
- **palavrasChave:** sustentabilidade sp, e-mail anexo, desbloqueio excepcional, avaliado, autorização
- **seguintes:** —

> Este parecer segue a política da companhia e a legislação vigente. Qualquer desbloqueio excepcional deverá ter o risco avaliado pelo time de Sustentabilidade São Paulo e autorização expressa via e-mail.

<details><summary>Variações de redação (1)</summary>

> Este parecer está alinhado com a política interna da companhia e com a legislação ambiental vigente. Qualquer solicitação de desbloqueio excepcional deverá ter o risco avaliado pelo time de Sustentabilidade São Paulo e contar com autorização expressa via e-mail.

</details>

- `exc-comunicar` **Comunicar conclusão para restabelecer o bloqueio** — 0 usos · já existe (`TX.excComunicar`) · seguintes: —
- `ori-base` **Orientação – modelo-base** — 0 usos · já existe (`TX.oriBase`) · seguintes: —

#### Tema: Não há restrições (356 usos)

##### `h001` · Encerramento – chamado encerrado
- **bloco:** 7 · **tema:** Não há restrições · **usos:** 195
- **palavrasChave:** chamado encerrado, não há restrições, encerramento
- **seguintes:** —

> Chamado encerrado.

<details><summary>Variações de redação (1)</summary>

> Portanto, chamado encerrado.

</details>

##### `h004` · Encerramento – nenhuma ação para a Sustentabilidade
- **bloco:** 7 · **tema:** Não há restrições · **usos:** 149
- **palavrasChave:** não há restrições, nenhuma, ação, pendente, encerramento
- **seguintes:** `h001` (83%), `cap-pa` (4%), `cap-uf` (3%)

> Dessa forma, não há nenhuma ação pendente para o time de Sustentabilidade.

<details><summary>Variações de redação (4)</summary>

> Dessa forma, não há providências a serem adotadas pelo time de Sustentabilidade.

> Portanto, não há ação a ser tomada pelo time de Sustentabilidade.

> Portanto, não há ação por parte do time de Sustentabilidade.

> Dessa forma, não há ações pendentes para o time de Sustentabilidade.

</details>

##### `h064` · Encerramento – chamado será encerrado
- **bloco:** 7 · **tema:** Não há restrições · **usos:** 9
- **palavrasChave:** chamado encerrado, não há restrições, encerramento
- **seguintes:** —

> Portanto, o chamado será encerrado.

##### `h232` · Encerramento – o chamado foi encerrado
- **bloco:** 7 · **tema:** Não há restrições · **usos:** 3
- **palavrasChave:** chamado encerrado, não há restrições
- **seguintes:** —

> Dessa forma, o chamado foi encerrado.


#### Tema: CAR Suspenso/Cancelado (65 usos)

##### `h019` · Orientação – verificar com o cliente se existe CAR válido
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 34
- **palavrasChave:** status do car, car suspenso/cancelado, existe, válido, sugiro, possamos
- **seguintes:** `h129` (12%)

> Sugiro que seja verificado junto ao cliente se existe um CAR válido, com status compatível com os requisitos legais e internos, para que possamos dar continuidade à análise da operação.

<details><summary>Variações de redação (2)</summary>

> Sugere-se verificar junto ao cliente a existência de um CAR válido, com status compatível com os requisitos legais e internos, a fim de possibilitar a continuidade da análise da operação.

> Por fim, sugere-se que seja verificado junto ao cliente se houve a substituição do CAR cancelado por outro válido, com status compatível com os requisitos legais e internos, para que possamos dar continuidade à análise da operação, caso aplicável.

</details>

##### `h129` · Orientação – verificar requisitos de todas as áreas antes da operação
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, status do car, contrato, início, antes, requisitos, sequer
- **seguintes:** —

> Ressalta-se, ainda, a importância de que, antes do início de qualquer operação, seja verificado se todas as áreas vinculadas atendem aos requisitos socioambientais, a fim de evitar travamento da operação. Destaca-se que, caso o CAR com status “Cancelado” tivesse sido vinculado desde o início, não seria possível sequer a geração do contrato.

##### `h132` · Orientação – novas operações não autorizadas (washout/devolução)
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** contrato, washout/algodão, família/terceiros, car suspenso/cancelado, autorizadas, operações, novas, orientação
- **seguintes:** `h170` (80%)

> Ressalta-se que, a partir desta data, não estão autorizadas novas operações envolvendo o referido imóvel. Eventuais contratos firmados em desacordo com essa orientação estarão sujeitos a washout das operações e/ou devolução integral do produto ao cliente, conforme normativos internos.

##### `h133` · Orientação – solicitante deve comunicar a filial
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 5
- **palavrasChave:** car suspenso/cancelado, filial, plenamente, envolvidas, cientes
- **seguintes:** —

> Orienta-se, ainda, que o solicitante comunique formalmente a filial à qual está vinculado, de modo que todas as áreas envolvidas estejam plenamente cientes das restrições aplicáveis.

##### `h170` · Chamado aberto até concluir a operação – pedir rebloqueio do clifor
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** clifor, em conformidade, car suspenso/cancelado, rebloqueio, aberto, desconformidade
- **seguintes:** `h133` (100%)

> Este chamado permanecerá aberto até a conclusão da operação em curso. Ao final, solicita-se que seja realizado novo contato para que o rebloqueio do clifor seja imediatamente efetuado, visando mitigar riscos de celebração de novas operações em desconformidade ambiental.

##### `h172` · Encerramento – informações incompletas impossibilitam a análise
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 4
- **palavrasChave:** chamado encerrado, car suspenso/cancelado, informações, preenchidas, necessárias, maneira
- **seguintes:** —

> Dessa forma, considerando que as informações necessárias não foram preenchidas de maneira completa, impossibilitando a conclusão da análise, o chamado foi encerrado.

##### `h289` · Orientação – enquanto perdurar o status “Suspenso” do CAR, este não poderá ser vinculado a…
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** car suspenso/cancelado, status do car, perdurar, poderá, enquanto, novas
- **seguintes:** `h290` (100%)

> Ressalta-se que, enquanto perdurar o status “Suspenso” do CAR, este não poderá ser vinculado a novas operações.

##### `h290` · Orientação – informa-se que este chamado permanecerá em aberto, sendo necessário que, após a…
- **bloco:** 7 · **tema:** CAR Suspenso/Cancelado · **usos:** 3
- **palavrasChave:** sem retorno, car suspenso/cancelado, informa-se, necessário, permanecerá, aberto
- **seguintes:** `h063` (100%)

> Por fim, informa-se que este chamado permanecerá em aberto, sendo necessário que, após a conclusão da operação, seja realizado o devido retorno, para que o bloqueio seja restabelecido, mitigando riscos de realização de novas negociações indevidas.

- `exc-suspenso` **CAR Suspenso – novas negociações não autorizadas** — 1 usos · já existe (`TX.excSuspenso`) · seguintes: —
- `exc-aberto` **Chamado permanecerá aberto** — 1 usos · já existe (`TX.excChamadoAberto`) · seguintes: —

#### Tema: Prospecção de clientes (64 usos)

##### `h026` · Orientação – acompanhar a capacidade produtiva (rastreabilidade dos volumes)
- **bloco:** 7 · **tema:** Prospecção de clientes · **usos:** 22
- **palavrasChave:** capacidade produtiva, volume, em conformidade, prospecção de clientes, rastreabilidade, volumes, acompanhamento
- **seguintes:** —

> Ressalta-se, entretanto, a necessidade de acompanhamento da capacidade produtiva estimada, a fim de assegurar que os volumes comercializados e recebidos pela companhia permaneçam compatíveis com o potencial produtivo da área. Tal medida visa garantir a rastreabilidade da origem da produção, a coerência produtiva das operações e a manutenção da conformidade socioambiental aplicável.

<details><summary>Variações de redação (1)</summary>

> Ressalta-se, contudo, que a capacidade produtiva estimada deverá ser observada, a fim de assegurar que os volumes comercializados e recebidos pela companhia permaneçam compatíveis com a capacidade produtiva da área, garantindo a rastreabilidade da origem da produção, a coerência produtiva da operação e a manutenção da conformidade socioambiental.

</details>

- `mon-cap` **Monitoramento contínuo da capacidade produtiva** — 13 usos · já existe (`TX.monCapacidade`) · seguintes: `mon-rastr` (69%)
- `mon-rastr` **Rastreabilidade e coerência dos volumes** — 9 usos · já existe (`TX.monRastreabilidade`) · seguintes: —

##### `h086` · Restrição – negociação de milho permitida com condições
- **bloco:** 7 · **tema:** Prospecção de clientes · **usos:** 7
- **palavrasChave:** contrato, sustentabilidade sp, prospecção de clientes, milho, negociação, enviado, condições
- **seguintes:** —

> Caso a negociação seja referente à milho, esta poderá ser realizada, desde que:  
> As áreas de originação não estejam vinculadas à restrição;Seja enviado o contrato comprovando que a operação não envolve soja, conforme orientação do time de Sustentabilidade São Paulo.

<details><summary>Variações de redação (1)</summary>

> Caso a negociação seja para milho, ela poderá ocorrer desde que:  
> As áreas de originação não estejam vinculadas à restrição;  
> Seja apresentado contrato comprovando que a operação não envolve soja, conforme orientação do time de Sustentabilidade São Paulo.

</details>

##### `h117` · Restrição – milho permitido com condições (variação)
- **bloco:** 7 · **tema:** Prospecção de clientes · **usos:** 5
- **palavrasChave:** contrato, sustentabilidade sp, prospecção de clientes, milho, realizá-la, envio, comunicado
- **seguintes:** —

> Caso a negociação seja para milho, será possível realizá-la, desde que as áreas de originação não sejam as que estão com a restrição e mediante envio do contrato comprovando que a operação não é relacionada à soja, conforme comunicado pelo time de Sustentabilidade São Paulo.

##### `h128` · Orientação – risco de recusa se não houver cultivo na área de formação
- **bloco:** 7 · **tema:** Prospecção de clientes · **usos:** 5
- **palavrasChave:** cultivo de grãos, contrato, washout/algodão, prospecção de clientes, recebimento, formação, recusa
- **seguintes:** `h048` (80%)

> Ressalta-se que, ainda que o produtor venha a avançar com a abertura da área para cultivo, é fundamental esclarecer que, no momento do recebimento dos grãos, caso não seja identificada área de cultivo compatível na área indicada como formação de lavoura, poderá haver impedimento no recebimento do produto, por ausência de comprovação da área de originação, inclusive com risco de washout do contrato.

##### `h293` · Orientação – para eventuais negociações referentes à safra, ainda que o produtor venha a…
- **bloco:** 7 · **tema:** Prospecção de clientes · **usos:** 3
- **palavrasChave:** cultivo de grãos, capacidade produtiva, contrato, washout/algodão, prospecção de clientes, safra, referentes, recebimento, venha
- **seguintes:** `h048` (67%)

> Ressalta-se que, para eventuais negociações referentes à safra {{safra}}, ainda que o produtor venha a avançar com a abertura de áreas para cultivo, é imprescindível esclarecer que, no momento do recebimento dos grãos, a ausência de comprovação de área produtiva compatível com a área indicada poderá resultar no impedimento do recebimento, inclusive com risco de washout do contrato.


#### Tema: Enquadramento direto/indireto (14 usos)

##### `h052` · MDM – alteração direcionada ao time de MDM
- **bloco:** 7 · **tema:** Enquadramento direto/indireto · **usos:** 10
- **palavrasChave:** mdm, enquadramento direto/indireto, direcionada, alteração, procedimento, responsável
- **seguintes:** —

> A solicitação de alteração já foi direcionada ao time de MDM, responsável pela execução do procedimento (chamado nº {{chamadoMDM}}).

##### `h159` · Orientação – a confirmação e execução da alteração será realizada pelo time de MDM, ao qual…
- **bloco:** 7 · **tema:** Enquadramento direto/indireto · **usos:** 4
- **palavrasChave:** mdm, família/terceiros, enquadramento direto/indireto, confirmação, alteração, execução, providências
- **seguintes:** —

> A confirmação e execução da alteração será realizada pelo time de MDM, ao qual o chamado já foi direcionado para providências (chamado:{{chamadoMDM}}).


#### Tema: Embargo Ibama (7 usos)

##### `h168` · Desbloqueio não é anuência para novas negociações
- **bloco:** 7 · **tema:** Embargo Ibama · **usos:** 4
- **palavrasChave:** embargo ibama, novas, anuência, prévia, configura
- **seguintes:** —

> Ressalta-se que o desbloqueio ora concedido não configura anuência do time de Sustentabilidade para novas negociações. Ao contrário, novas operações envolvendo esta área não estão autorizadas sem prévia análise e aprovação pela área de Sustentabilidade.

##### `h203` · Pedido para avisar a conclusão da operação para rebloquear
- **bloco:** 7 · **tema:** Embargo Ibama · **usos:** 3
- **palavrasChave:** contrato, família/terceiros, embargo ibama, solicito, rebloquear, proceder, evitando
- **seguintes:** —

> Solicito que, assim que a operação for concluída, nos informem imediatamente para que possamos proceder com o bloqueio do produtor, evitando o risco de novos contratos serem firmados.


#### Tema: Sem CAR (6 usos)

##### `h104` · Encerramento – CAR incorreto impossibilita a análise
- **bloco:** 7 · **tema:** Sem CAR · **usos:** 6
- **palavrasChave:** chamado encerrado, sem car, incorreto, impossibilita, realizar, número
- **seguintes:** —

> Como não é possível realizar a análise com o número informado, o chamado será encerrado.


#### Tema: PRODES 2025 (6 usos)

##### `h299` · Orientação – este critério decorre de política interna da ADM, não estando previsto na…
- **bloco:** 7 · **tema:** PRODES 2025 · **usos:** 3
- **palavrasChave:** documentos, prodes 2025, estando, legislação, critério, decorre
- **seguintes:** `h300` (67%)

> Ressalta-se que este critério decorre de política interna da ADM, não estando previsto na legislação vigente ou em acordos setoriais, mas sim de um compromisso público assumido pela empresa perante a sociedade. Assim, para casos com esse tipo de apontamento, não há possibilidade de regularização mediante apresentação de documentos.

##### `h300` · Orientação – este chamado permanecerá em aberto. Após a conclusão da operação, solicitamos…
- **bloco:** 7 · **tema:** PRODES 2025 · **usos:** 3
- **palavrasChave:** prodes 2025, solicitamos, permanecerá, aberto, gentileza
- **seguintes:** —

> Este chamado permanecerá em aberto. Após a conclusão da operação, solicitamos, por gentileza, que nos informem, a fim de evitar a realização de novas negociações indevidas.


#### Tema: Terra Indígena/Quilombola (3 usos)

- `mon-ti` **Monitoramento – demarcação da Terra Indígena** — 3 usos · já existe (`TX.monTI`) · seguintes: —

#### Tema: Protocolo Verde dos Grãos (PVG-PA) (3 usos)

##### `h200` · Encerramento – sem retorno sobre a operação, bloqueio refeito
- **bloco:** 7 · **tema:** Protocolo Verde dos Grãos (PVG-PA) · **usos:** 3
- **palavrasChave:** chamado encerrado, sem retorno, protocolo verde dos grãos (pvg-pa), refeito, encerramento, houve
- **seguintes:** —

> Como não houve retorno referente ao encerramento da operação, o bloqueio foi refeito e o chamado será encerrado - {{data}}.


#### Tema: Embargo Semad-GO (3 usos)

##### `h211` · Disposição para reavaliar em caso de suspensão do embargo
- **bloco:** 7 · **tema:** Embargo Semad-GO · **usos:** 3
- **palavrasChave:** embargo, car suspenso/cancelado, embargo semad-go, reavaliar, disposição, caso, estaremos
- **seguintes:** —

> Caso haja decisão administrativa ou judicial que suspenda ou revogue o embargo, estaremos à disposição para reavaliar a situação.


#### Tema: Embargo ICMBio (3 usos)

##### `h267` · Orientação – que o referido embargo do ICMBio não constitui impedimento nem é o motivo da…
- **bloco:** 7 · **tema:** Embargo ICMBio · **usos:** 3
- **palavrasChave:** icmbio, embargo, embargo icmbio, constitui, manutenção, impedimento
- **seguintes:** `h013` (67%)

> Ressalta-se, contudo, que o referido embargo do ICMBio não constitui impedimento nem é o motivo da manutenção do bloqueio no presente caso, uma vez que a área indicada para análise está localizada em {{municipio}}, registrada no CAR {{car}}.


#### Tema: Inexistência de área de cultivo (3 usos)

##### `h298` · Orientação – orienta-se a filial responsável a verificar junto ao produtor a existência de…
- **bloco:** 7 · **tema:** Inexistência de área de cultivo · **usos:** 3
- **palavrasChave:** capacidade produtiva, volume, em conformidade, inexistência de área de cultivo, responsável, orienta-se, verificar
- **seguintes:** —

> Orienta-se a filial responsável a verificar junto ao produtor a existência de outras áreas de originação para análise, assegurando que o volume a ser negociado possua lastro produtivo e conformidade socioambiental compatíveis com o montante envolvido.


### Outros

#### Tema: Geral (0 usos)

- `base-completo` **Modelo-base completo – blocos 1 a 7** — 0 usos · já existe (`TX.idBase, TX.fundBase, TX.capBase, TX.opBase, TX.conBase, TX.oriBase`) · seguintes: —

## 6. Caminhos

Com quais trechos cada tema costuma **começar** (para sugerir o 1º parágrafo assim que o analista escolher o tema ou digitar a 1ª palavra). Os `seguintes` de cada trecho estão nas seções 3 a 5 e no `META` do `.js`.

| Tema | Inícios mais frequentes |
|---|---|
| Não há restrições | `h007` Status desatualizado – resolvido com “Buscar Status Propriedade” (62)<br>`h010` Clifor e CAR sem bloqueios na Serasa e no ADMBR (62)<br>`id-limpo` Cliente e área sem restrições (47) |
| Prospecção de clientes | `h008` Prospecção – abertura (CPF do produtor, áreas Serasa e área indicada) (106)<br>`cap-uf` Capacidade produtiva – Estado de [UF] (19)<br>`id-limpo` Cliente e área sem restrições (16) |
| PRODES 2020 | `h003` PRODES 2020 – cliente sem restrição; área bloqueada por desmatamento PRODES/INPE após 2020 (134)<br>`h002` PRODES 2020 – orientação de SP: desconsiderar o protocolo (tema em discussão) (3)<br>`h266` Identificação – cliente sem restrição no CPF/CNPJ. Entretanto, as áreas indicadas para análise… (3) |
| Embargo Ibama | `cap-uf` Capacidade produtiva – Estado de [UF] (31)<br>`h017` Embargo Ibama no CPF/CNPJ – polígono isolado do plantio (28)<br>`id-emb-cpf` Embargo vinculado ao CPF/CNPJ (clifor bloqueado) (23) |
| Embargo Sema-MT | `id-emb-cpf` Embargo vinculado ao CPF/CNPJ (clifor bloqueado) (27)<br>`h006` Conclusão curta – em conformidade (17)<br>`h033` Sema-MT – área bloqueada por risco de triangulação com embargo de terceiro (14) |
| CAR Suspenso/Cancelado | `h015` CAR Suspenso – contraria a política interna e a Resolução BCB nº 140/2021 (38)<br>`h062` CAR Suspenso – área bloqueada pelo status do CAR (9)<br>`cap-uf` Capacidade produtiva – Estado de [UF] (7) |
| Protocolo Verde dos Grãos (PVG-PA) | `pvg-reg` PVG – documentos para regularização (LAR/PRAD) (16)<br>`cap-uf` Capacidade produtiva – Estado de [UF] (12)<br>`h057` Selo Biocombustível – fazenda desbloqueada pela compra de dendê (8) |
| Sem CAR | `h021` Operação – aquisição de dendê para o Selo Biocombustível Social (29)<br>`h103` CAR informado incorreto (já sinalizado à solicitante) (6)<br>`h061` Selo Biocombustível – operação de compra de dendê (3) |
| Enquadramento direto/indireto | `h038` Enquadramento – empresa caracterizada como cliente indireto (14)<br>`h032` Enquadramento – quem não cultiva o que vende é INDIRETO (DIRETO → INDIRETO) (10)<br>`h084` Enquadramento – empresa DIRETO que é revendedora (comércio atacadista) (5) |
| Cultivo inferior a 10% | `id-cultivo` Ausência de comprovação de 10% de cultivo (10)<br>`cap-uf` Capacidade produtiva – Estado de [UF] (8)<br>`h080` Cultivo inferior a 10% – área arrendada de terceiro (5) |
| Bloqueio manual sem motivo | `h023` Bloqueio manual no ADMBR sem justificativa registrada (23)<br>`id-limpo` Cliente e área sem restrições (5)<br>`h192` Situação da área – em análise, não foram identificadas restrições ou bloqueios ambientais… (2) |
| Embargo Semad-GO | `op-hedge` Hedge para nova compra (9)<br>`h016` Conclusão curta – bloqueio mantido (5)<br>`tf-nova-area` Embargo em nova área indicada – não isolado do cultivo (com conclusão) (5) |
| CSA Cerrado | `h028` CSA Cerrado – sobreposição com protocolo ainda não vigente na política (20) |
| Inexistência de área de cultivo | `cap-uf` Capacidade produtiva – Estado de [UF] (8)<br>`h056` Área arrendada de terceiro – cliente sem restrições (3)<br>`id-car` CAR com status Suspenso/Cancelado (2) |
| Moratória da Soja | `h006` Conclusão curta – em conformidade (3)<br>`h039` Encerramento – caso já analisado em outro chamado (3)<br>`h001` Encerramento – chamado encerrado (2) |
| Unidade de Conservação | `h112` Unidade de Conservação – área bloqueada por sobreposição (ha) (5)<br>`cap-uf` Capacidade produtiva – Estado de [UF] (3)<br>`h279` Fundamentação – conforme a Lei nº 9.985/2000, que institui o Sistema Nacional de Unidades de… (2) |
| PRODES 2025 | `prodes-1` PRODES – diretriz da Diretoria de Sustentabilidade (5)<br>`h299` Orientação – este critério decorre de política interna da ADM, não estando previsto na… (2)<br>`h035` Embargo Sema-MT no CPF/CNPJ – polígono isolado do cultivo (2) |

**Exemplos de caminho** (ordem típica dos trechos):

- **PRODES 2020**: `h003` → `h002` → `h005`
- **Não há restrições**: `h007` → `h010` → `h004` → `h001`
- **CAR com status “suspenso” ou “cancelado”**: `h015` → `h014` → `h036` → `h019`
- **Sem CAR**: `h021` → `h022` → `h020` → `tf-reenq`
- **Bloqueio manual sem motivo expresso**: `h023` → `h025` → `h024`

## 7. Busca – sinônimos

Termos sem acento, como a busca da ferramenta compara (`norm`). Quando o analista digita um termo de qualquer linha, a busca procura também pelos demais da mesma linha.

| Termo | Equivalentes |
|---|---|
| pvg | protocolo verde, protocolo verde dos graos, semas |
| terra indigena | ti, indigena, homologada, declarada, funai, demarcacao |
| quilombola | quilombo, palmares, incra |
| unidade de conservacao | uc, apa, snuc, refugio de vida silvestre, parque, protecao integral, uso sustentavel |
| suspenso | cancelado, bcb 140, resolucao bcb, credito rural |
| sem car | ausencia de car, car incorreto, nao se aplica, alcada y |
| sema | sema-mt, lista da sema, embargo estadual |
| ibama | embargo federal, icmbio |
| semad | semad-go, goias |
| prodes | inpe, desmatamento, prodes 2020, prodes 2025, lideranca, alta gestao |
| moratoria | moratoria da soja, lista da moratoria, milho |
| csa | csa cerrado, cerrado, luc, land use change, nao vigente |
| isolado | isolamento, poligono, segregacao, imagens de satelite, nao isolado |
| triangulacao | 150 km, raio, distancia, vizinha, familiar, terceiro |
| ponto | embargo ponto, embargo do tipo ponto |
| capacidade | conab, rendimento, kg/ha, producao, toneladas, sacas, volume maximo, excedente |
| hedge | nova compra, novo contrato, geracao de contrato |
| contrato | contrato fixo, balcao, alcada l, operacao formalizada |
| insumos | pedido de insumos, entrega, fazenda |
| credito | alienacao fiduciaria, garantia, cpr |
| enquadramento | direto, indireto, nao se aplica, mdm, reenquadramento, revenda, atacadista, cnae |
| selo | selo biocombustivel, biocombustivel social, dende, biodiesel |
| washout | algodao, contratacao de volume |
| lar | licenca, licenciamento ambiental rural, prad, vencido, renovacao, 120 dias |
| documentos | desembargo, processo administrativo, auto de infracao, termo de embargo, certidao, decisao judicial |
| art 54 | decreto 6.514, multa, crimes ambientais, 500 reais |
| encerrado | encerrar, encerramento, sem retorno, falta de informacoes, caminho incorreto, ja analisado, urgente |
| sem motivo | bloqueio manual, sem justificativa, admbr, lista |
| buscar status | status desatualizado, processamento, corp_f0285, serasa |
| lista suja | trabalho escravo, mte, analogo |
| assentamento | incra, passivo de terceiros, lote |
| excepcional | operacao formalizada, pontual, rebloqueio, bloquear novamente, chamado aberto |
| cultivo | 10%, area de plantio, sem plantio, formacao de lavoura, inexistencia de area de cultivo, originacao |
| prospeccao | serasa, cadastro, novo cliente, apenas analise, recomendamos, nao recomendamos |
| alcada | alcada y, alcada g, alcada l |
| conformidade | desbloqueio, desbloqueado, aprovado, liberado, liberacao |
| mantido | bloqueio mantido, nao recomendamos, nao recomendado, vedado |

## 8. Código para o script.js

As funções abaixo usam `META`, `SINONIMOS` e `INICIOS`, definidos em `biblioteca-historico.js`. A lógica de pontuação:

- **relevância**: cada termo digitado (ou um sinônimo dele) precisa aparecer; vale 3 nas palavras-chave, 2 no título e 1 no texto;
- **uso**: multiplica por `1 + log10(1 + usos)` — um trecho usado 150 vezes pesa ~3,2×; um usado 3 vezes, ~1,6×;
- **caminho**: soma `8 × probabilidade` quando o item costuma vir depois do parágrafo onde está o cursor;
- **universal**: pequeno bônus para trechos que cabem em qualquer parecer.

```js
/* =====================================================================
   BUSCA RANQUEADA E SUGESTÃO DO PRÓXIMO TRECHO (biblioteca-historico.js)
   Cole este bloco no script.js, logo depois de `const termos = ...`.
   ===================================================================== */
const META_LIB = typeof META !== 'undefined' ? META : {};
const SIN_LIB = typeof SINONIMOS !== 'undefined' ? SINONIMOS : {};

/** Cada termo digitado vira um grupo de alternativas (termo + sinônimos). */
function gruposDeBusca(q) {
  return termos(q).map((t) => {
    const alt = new Set([t]);
    for (const [k, lista] of Object.entries(SIN_LIB)) {
      const grupo = [k, ...lista].map(norm);
      if (grupo.some((g) => g === t || (t.length >= 4 && g.startsWith(t)))) grupo.forEach((g) => alt.add(g));
    }
    return [...alt];
  });
}

/** Pontuação: relevância (palavra-chave 3, título 2, texto 1) × (1 + log10(1 + usos)) + contexto. */
function pontuar(item, grupos, contexto) {
  const m = META_LIB[item.id] || {};
  const chaves = (m.palavrasChave || []).map(norm).join(' | ');
  const titulo = norm(item.titulo || '');
  let rel = 0;
  for (const alt of grupos) {
    let melhor = 0;
    for (const a of alt) {
      if (chaves.includes(a)) melhor = Math.max(melhor, 3);
      else if (titulo.includes(a)) melhor = Math.max(melhor, 2);
      else if (item._busca.includes(a)) melhor = Math.max(melhor, 1);
    }
    if (!melhor) return 0;            // todo termo digitado precisa aparecer (como hoje)
    rel += melhor;
  }
  const uso = Math.log10(1 + (m.usos || 0));
  const ctx = contexto ? contexto.get(item.id) || 0 : 0;   // 0–1
  const univ = m.universal ? 0.3 : 0;
  return (grupos.length ? rel : 1) * (1 + uso) + 8 * ctx + univ;
}

/** Ordena uma lista (modelos ou trechos) pela pontuação; sem busca, ordena só por uso/contexto. */
function ranquear(lista, q, contexto) {
  const grupos = gruposDeBusca(q || '');
  return lista
    .map((it) => ({ it, s: pontuar(it, grupos, contexto) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.it);
}

/* ---------- caminho: de qual trecho veio cada parágrafo ---------- */
const TX_POR_TEXTO = new Map(Object.entries(typeof TX !== 'undefined' ? TX : {}).map(([k, v]) => [v, k]));
const TRECHO_POR_TX = new Map();
for (const t of (typeof TRECHOS !== 'undefined' ? TRECHOS : [])) {
  if (typeof t.texto === 'string' && TX_POR_TEXTO.has(t.texto) && !TRECHO_POR_TX.has(TX_POR_TEXTO.get(t.texto))) TRECHO_POR_TX.set(TX_POR_TEXTO.get(t.texto), t.id);
}
/** id do trecho de origem de um texto de modelo (ou null). */
function origemDoTexto(texto) {
  const k = TX_POR_TEXTO.get(texto);
  return k ? (TRECHO_POR_TX.get(k) || k) : null;
}
/** Map id -> probabilidade dos trechos que costumam vir depois de `origem`. */
function contextoDe(origem, tema) {
  const ctx = new Map();
  const m = origem && META_LIB[origem];
  if (m && m.seguintes) for (const [id, p] of m.seguintes) ctx.set(id, p);
  if (!origem && tema && typeof INICIOS !== 'undefined' && INICIOS[tema]) INICIOS[tema].forEach((id, i) => ctx.set(id, 0.6 - i * 0.1));
  return ctx;
}
```

Onde ligar no `script.js` atual:

```js
// 1) carregarBiblioteca(): ao montar m._busca e t._busca, inclua as palavras-chave
//    m._busca = norm([m.titulo, m._cat, m.subcategoria, m.quandoUsar, (META_LIB[m.id]?.palavrasChave || []).join(' '), corpo].join(' \n '));
//    t._busca = norm([t.titulo, t._grupo, t.fonte, (META_LIB[t.id]?.palavrasChave || []).join(' '), textoDoTrecho(t)].join(' '));

// 2) renderInicio(): troque o filtro por ranking (mantém os grupos por categoria)
//    const vis = ranquear(LIB.modelos.filter((m) => m.categoria === c.id), state.buscaInicio);

// 3) filtrarTrechos(q, filtro): depois de aplicar o filtro de bloco, ranqueie com o contexto do cursor
//    const base = LIB.trechos.filter((t) => !filtro || (filtro === 'tf' ? t.categoria === 'Trechos fundamentados' : t._blocos.includes(Number(filtro))));
//    return ranquear(base, q, contextoDe(origemNoCursor()));

// 4) Guardar a origem de cada parágrafo:
//    - em inserirTrecho(t): no(s) parágrafo(s) criado(s), grave par.origem = t.id
//    - em modeloParaParagrafos(): para cada texto vindo de TX, grave par.origem = origemDoTexto(texto)
//    - em parParaElemento/parDoElemento: leve par.origem para data-origem no elemento e de volta
//    function origemNoCursor() { const p = closestBloco(window.getSelection().anchorNode); return p ? p.dataset.origem || null : null; }

// 5) Painel de trechos com a busca vazia: mostre primeiro "Sugeridos a seguir"
//    (contextoDe(origemNoCursor()) com probabilidade >= 0,15) e depois os mais usados do bloco.
//    No cartão, exiba o uso: el('span', { class: 'mc-sub', text: (META_LIB[t.id]?.usos || 0) + ' usos' }).
```

## 9. Campos novos

Campos usados pelos textos novos e que ainda não existem em `CAMPOS` (já incluídos no `.js`). Campos numerados (`car2`, `municipio2`…) servem para uma segunda área, terceiro etc.

| id | Grupo | Rótulo | Texto vazio |
|---|---|---|---|
| `areaHa` | Área | Área (ha) | [ÁREA EM HECTARES] |
| `areaProdutiva2` | Capacidade produtiva | Área produtiva (ha) (2) | [ÁREA PRODUTIVA 2] |
| `car2` | Área | Nº do CAR (2) | [Nº DO CAR 2] |
| `carEmbargo2` | Área | Nº do CAR do embargo (2) | [Nº DO CAR DO EMBARGO 2] |
| `carEmbargo3` | Área | Nº do CAR do embargo (3) | [Nº DO CAR DO EMBARGO 3] |
| `carEmbargo4` | Área | Nº do CAR do embargo (4) | [Nº DO CAR DO EMBARGO 4] |
| `carEmbargo5` | Área | Nº do CAR do embargo (5) | [Nº DO CAR DO EMBARGO 5] |
| `carEmbargo6` | Área | Nº do CAR do embargo (6) | [Nº DO CAR DO EMBARGO 6] |
| `carEmbargo7` | Área | Nº do CAR do embargo (7) | [Nº DO CAR DO EMBARGO 7] |
| `carEmbargo8` | Área | Nº do CAR do embargo (8) | [Nº DO CAR DO EMBARGO 8] |
| `chamado` | Operação | Nº do chamado | [Nº DO CHAMADO] |
| `clifor` | Cliente | Clifor | [CLIFOR] |
| `data` | Documentos | Data | [DATA] |
| `distancia` | Área | Distância até a restrição (km) | [DISTÂNCIA] |
| `docTerceiro` | Cliente | CPF/CNPJ do terceiro | [CPF/CNPJ DO TERCEIRO] |
| `municipio2` | Área | Município/UF (2) | [MUNICÍPIO/UF 2] |
| `municipioEmbargo2` | Área | Município/UF do embargo (2) | [MUNICÍPIO/UF DO EMBARGO 2] |
| `municipioEmbargo3` | Área | Município/UF do embargo (3) | [MUNICÍPIO/UF DO EMBARGO 3] |
| `nomeTerceiro` | Cliente | Nome do terceiro (proprietário, familiar, embargado) | [NOME DO TERCEIRO] |
| `nomeTerceiro2` | Cliente | Nome do terceiro (proprietário, familiar, embargado) (2) | [NOME DO TERCEIRO 2] |
| `numero` | Documentos | Número (outro) | [Nº] |
| `responsavelSP` | Restrição | Responsável – Sustentabilidade SP | [RESPONSÁVEL SUSTENTABILIDADE SP] |
| `safra` | Operação | Safra | [SAFRA] |

---
Gerado em 27/10/2026 a partir de 2620 pareceres. Contagens de uso são aproximadas: parágrafos foram agrupados por semelhança de texto, então redações muito diferentes da mesma ideia podem ter ficado separadas.