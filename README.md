# Pareceres Socioambientais — ferramenta de emissão

Ferramenta web local (HTML, CSS e JavaScript puro, sem instalação, sem servidor e sem internet) para escolher o modelo de parecer, preencher só os dados do caso, adaptar o texto e emitir o parecer em Word, PDF ou texto.

## Como executar
1. Mantenha os arquivos juntos na mesma pasta.
2. Dê dois cliques em `index.html` (Chrome ou Edge recomendados).

## Arquivos
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura das telas |
| `styles.css` | Aparência, versão para celular e versão de impressão/PDF |
| `modelos.js` | **Biblioteca**: textos, categorias, status, temas, campos parametrizados, modelos, trechos, pendências e guia |
| `biblioteca-historico.js` | **Biblioteca do histórico** (gerada a partir de 2.620 pareceres): 24 modelos e 332 trechos novos, uso de cada item, palavras-chave, sinônimos e caminhos (o que costuma vir depois de cada trecho) |
| `ajustes-historico.js` | Correções de revisão sobre a biblioteca do histórico (fica separado para sobreviver a uma nova geração) |
| `PARECERES_BIBLIOTECA_HISTORICO.md` | Documentação da biblioteca do histórico: panorama, rankings, modelos e trechos por tema |
| `script.js` | Funcionamento da ferramenta |
| `docx.js` | Gerador de arquivos Word (.docx) sem bibliotecas externas |
| `assets/` | Logo ADM e faixa de cores da marca; `logo-data.js` é o logo em base64, usado no Word |

Identidade visual: azul ADM `#012169` e verde `#8BC400`, com os neutros do PowerPoint (`#5B6470`, `#F2F5F9`, `#C7CFD9`) e a fonte Calibri. As cores ficam em variáveis no topo de `styles.css`.

## Fluxo de uso
1. **Início**:
   - **Tema do chamado** (Embargo, PVG · PRODES · Moratória · CSA, CAR, Prospecção, Sem restrição, Cultivo de grãos, Cadastro e enquadramento, Áreas protegidas) filtra os modelos.
   - Sem busca: **Mais usados** (as 6 situações mais frequentes no histórico) e as categorias por desfecho (A. Aprovado, B. Desbloqueio excepcional, C. Bloqueio mantido, D. Procedimentos, E. Encerramento, Modelo-base), cada uma do mais usado para o menos usado.
   - **Busca**: entende sinônimos (“pvg” acha Protocolo Verde; “suspenso” acha cancelado e Resolução BCB; “ti” acha Terra Indígena) e ordena por relevância × uso no histórico. Enter abre o primeiro.
   - Cada cartão mostra o status, o "quando usar", em quantos pareceres do histórico a situação apareceu e o botão 👁︎ para ver o texto sem abrir.
   - **Nenhum modelo serve?** → **Montar por blocos** (estrutura padrão, blocos 1 a 7) ou **começar em branco**. O tema escolhido acompanha o parecer.
   - **Continuar**: os pareceres mais recentes.
2. **Editor**, em três colunas:
   - **Faixa de progresso** (acima do texto, fica visível ao rolar): "Faltam N itens" e **Ir para o próximo** (Ctrl+Enter), que leva a cada pendência na ordem do parecer — o campo no painel, a escolha de opção ou o [texto a redigir], que já fica selecionado para digitar por cima. "ver lista" mostra todas, clicáveis. Fica verde quando não falta nada.
   - **Dados do caso** (esquerda):
     - status;
     - **Escolhas do texto** (primeiro, porque decidem os campos): opção de fundamentação ou de operação (as não escolhidas saem do parecer e os campos delas somem do painel), alternativas entre colchetes e parágrafos opcionais. Parágrafos condicionais entram sozinhos (ex.: CAR "Suspenso");
     - tipo de pessoa (PF → "O produtor"/CPF/"com este produtor"; PJ → "A empresa"/CNPJ/"com esta empresa");
     - os campos usados no texto que sai, preenchidos uma vez e aplicados ao texto todo.
   - **Documento** (centro):
     - edição livre;
     - os campos aparecem destacados e atualizam ao vivo. Clique num campo para ir ao painel; duplo clique converte em texto comum. Clique num [texto a redigir] para selecioná-lo inteiro;
     - **Apagar seleção** remove o trecho selecionado (ou os parágrafos inteiros, se a seleção atravessar parágrafos); o **×** à esquerda remove um parágrafo; **Limpar** esvazia só o texto ou texto e dados. Tudo pode ser desfeito.
   - **Trechos padronizados** (direita):
     - **Sugeridos para o próximo parágrafo**: o que costuma vir depois do parágrafo do cursor no histórico (com a %); num parecer vazio, os inícios mais comuns do tema;
     - depois, os **mais usados**, filtrados por tema e bloco (o bloco pode seguir o cursor). A busca aceita sinônimos. Mostra 30 de cada vez;
     - clique no texto e depois em **Inserir**. O cursor vai para o fim do trecho inserido, e as sugestões avançam.
3. **Emitir**:
   - **Copiar parecer** (texto e formatação para colar no chamado ou no e-mail);
   - **Pré-visualizar**;
   - **Exportar ▾**: Word (.docx com logo e rodapé), PDF (abre a impressão: escolha "Salvar como PDF") ou .txt.
   - Antes de copiar ou exportar, a ferramenta lista as pendências.

## Biblioteca (`modelos.js`)
- Fontes: `PARECERES_SOCIOAMBIENTAIS_TEXTOS_PADRAO.docx` e os "Trechos fundamentados para utilizar" enviados pela área (os modelos e trechos do histórico estão na seção seguinte). Os textos foram copiados **sem correção**. Os 108 parágrafos dos Casos 1 a 14 e do modelo-base foram conferidos contra o Word e são idênticos. Os pontos duvidosos estão em `PENDENCIAS_WORD` e aparecem no **Guia**.
- Os textos ficam em `TX`, um parágrafo por chave. `MODELOS` e `TRECHOS` apontam para eles, então corrigir em `TX` corrige em todos os lugares.
- `CAMPOS` define os campos parametrizados (rótulo, tipo, texto entre colchetes, opções, valor padrão). `DERIVADOS` gera "O produtor/A empresa", "CPF/CNPJ" etc. a partir do tipo de pessoa.
- `STATUS` define o nome do status e a cor dos cartões.
- `TEMAS` define os temas do chamado: `modelos` (ids que aparecem no tema; um modelo pode estar em vários) e `protocolos` (temas do histórico cujos trechos pertencem a ele). Modelo novo sem tema aparece só em "Todos" e na busca.
- Marcações nos textos:

  | Marcação | Efeito |
  |---|---|
  | `{{campo}}` | campo parametrizado |
  | `{{campo\|TEXTO}}` | mesmo campo, com outro texto enquanto estiver vazio |
  | `{{escolha:a\|b}}` | alternativa local (pode conter campos) |
  | `[TEXTO]` | trecho a redigir |
  | `**negrito**` | negrito |
  | `==condicional==` | trecho condicional |
  | `!!validação!!` | trecho que exige validação |

- Tipos de parágrafo:

  | Forma | Uso |
  |---|---|
  | texto simples | parágrafo normal |
  | `{ rotulo, bloco }` | rótulo interno, não sai no parecer |
  | `{ grupo, instrucao, opcoes: [{ rotulo, texto }] }` | opções; o analista escolhe uma |
  | `{ se: 'campo=valor', rotulo, texto }` | parágrafo condicional |
  | `{ opcional, texto, incluido }` | parágrafo opcional |

- As instruções completas estão no topo de `modelos.js`. Erros de digitação nos campos, como um campo inexistente, aparecem no Guia.

## Biblioteca do histórico (`biblioteca-historico.js` + `ajustes-historico.js`)
- Gerada a partir do histórico de pareceres (documentação em `PARECERES_BIBLIOTECA_HISTORICO.md`). Só acrescenta: categoria E (Encerramento), status `encerrado`, campos novos, textos `TX.h…`, trechos `h001…`, modelos novos e os dados de busca (`META`: uso, palavras-chave, tema, `seguintes`; `SINONIMOS`; `INICIOS`).
- Sem esses dois arquivos a ferramenta funciona como antes, só com a biblioteca do Word (sem ranking por uso, sinônimos nem sugestões).
- `ajustes-historico.js` corrige o que a revisão encontrou no arquivo gerado (produto fixo “kg de soja”, órgão fixo “Semad-GO”, área analisada com os campos da área embargada, nome de colega, títulos com lacuna) e registra as pendências de redação no Guia. **Ao gerar `biblioteca-historico.js` de novo, mantenha `ajustes-historico.js`**: o ajuste que não encontrar mais o texto antigo só deixa um aviso no console.
- Ordem no `index.html`: `modelos.js` → `biblioteca-historico.js` → `ajustes-historico.js` → `script.js`.

## Manutenção
- Os analistas **não alteram** os modelos pela tela. Para aproveitar um parecer adaptado como modelo: **Mais ▾ → Gerar código do modelo**, copie o bloco e cole em `MODELOS`. Os campos saem como `{{campo}}`.

## Onde ficam os pareceres
- Os pareceres em elaboração (texto, dados do caso e escolhas) são salvos automaticamente no **navegador (localStorage)**, só neste computador e neste navegador. Não há sincronização entre analistas ou máquinas.
- Limpar os dados do navegador apaga esses pareceres. Use **Meus pareceres → Exportar backup** com frequência. **Importar backup** permite mesclar ou substituir.
- Pareceres e backups da versão anterior continuam abrindo: o texto é mantido como estava, sem campos parametrizados.

## Atalhos
`/` pesquisar modelos · `Ctrl+Enter` próximo item pendente · `Alt+1..4` áreas · `Ctrl+S` salvar · `Ctrl+P` PDF · `Ctrl+B/I` negrito/itálico · `Ctrl+Z/Y` desfazer/refazer.

## Futuro backend
O acesso aos dados está isolado no objeto `Store` (`script.js`). Para usar um servidor, basta trocar a implementação desses métodos.
