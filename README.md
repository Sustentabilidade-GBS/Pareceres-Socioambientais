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
| `modelos.js` | **Biblioteca**: textos, categorias, status, campos parametrizados, modelos, trechos, pendências e guia |
| `script.js` | Funcionamento da ferramenta |
| `docx.js` | Gerador de arquivos Word (.docx) sem bibliotecas externas |
| `assets/` | Logo ADM e faixa de cores da marca; `logo-data.js` é o logo em base64, usado no Word |

Identidade visual: azul ADM `#012169` e verde `#8BC400`, com os neutros do PowerPoint (`#5B6470`, `#F2F5F9`, `#C7CFD9`) e a fonte Calibri. As cores ficam em variáveis no topo de `styles.css`.

## Fluxo de uso
1. **Início**: os modelos aparecem em cartões, por categoria (A. Aprovado, B. Desbloqueio excepcional, C. Bloqueio mantido, D. Procedimentos operacionais e cadastrais, Modelo-base). Cada cartão mostra o status, o "quando usar" e o botão 👁︎ para ver o texto sem abrir. A busca procura no título e no conteúdo (Enter abre o primeiro resultado).
   - **Montar por blocos**: estrutura padrão (blocos 1 a 7) com os trechos de cada bloco no painel à direita.
   - **Em branco**: página vazia.
   - **Continuar um parecer**: os mais recentes.
2. **Editor**, em três colunas:
   - **Dados do caso** (esquerda):
     - status e cabeçalho;
     - tipo de pessoa (PF → "O produtor"/CPF/"com este produtor"; PJ → "A empresa"/CNPJ/"com esta empresa");
     - os campos usados no parecer (nome, CAR, município, contrato…), preenchidos uma vez e aplicados ao texto todo;
     - **Opções do texto**: opção de fundamentação ou de operação (as não escolhidas saem do parecer), alternativas entre colchetes e parágrafos opcionais. Parágrafos condicionais entram sozinhos (ex.: CAR "Suspenso").
     - O contador de pendências mostra o que falta.
   - **Documento** (centro):
     - edição livre;
     - os campos aparecem destacados e atualizam ao vivo. Clique num campo para ir ao painel; duplo clique converte em texto comum;
     - **Apagar seleção** remove o trecho selecionado (ou os parágrafos inteiros, se a seleção atravessar parágrafos); o **×** à esquerda remove um parágrafo; **Limpar** esvazia só o texto ou texto e dados. Tudo pode ser desfeito.
   - **Trechos padronizados** (direita): filtrados por bloco, podendo seguir o cursor, incluindo os "Trechos fundamentados" novos. Clique no texto e depois em **Inserir**.
3. **Emitir**:
   - **Copiar parecer** (texto e formatação para colar no chamado ou no e-mail);
   - **Pré-visualizar**;
   - **Exportar ▾**: Word (.docx com logo, cabeçalho e rodapé), PDF (abre a impressão: escolha "Salvar como PDF") ou .txt.
   - Antes de copiar ou exportar, a ferramenta lista as pendências.

## Biblioteca (`modelos.js`)
- Fontes: `PARECERES_SOCIOAMBIENTAIS_TEXTOS_PADRAO.docx` e os "Trechos fundamentados para utilizar" enviados pela área. Os textos foram copiados **sem correção**. Os 108 parágrafos dos Casos 1 a 14 e do modelo-base foram conferidos contra o Word e são idênticos. Os pontos duvidosos estão em `PENDENCIAS_WORD` e aparecem no **Guia**.
- Os textos ficam em `TX`, um parágrafo por chave. `MODELOS` e `TRECHOS` apontam para eles, então corrigir em `TX` corrige em todos os lugares.
- `CAMPOS` define os campos parametrizados (rótulo, tipo, texto entre colchetes, opções, valor padrão). `DERIVADOS` gera "O produtor/A empresa", "CPF/CNPJ" etc. a partir do tipo de pessoa.
- `STATUS` define a linha STATUS do cabeçalho e a cor dos cartões. A linha "Condição" sai nos casos excepcionais.
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
- Os analistas **não alteram** os modelos pela tela. Para aproveitar um parecer adaptado como modelo: **Mais ▾ → Gerar código do modelo**, copie o bloco e cole em `MODELOS`. Os campos saem como `{{campo}}`.

## Onde ficam os pareceres
- Os pareceres em elaboração (texto, dados do caso e escolhas) são salvos automaticamente no **navegador (localStorage)**, só neste computador e neste navegador. Não há sincronização entre analistas ou máquinas.
- Limpar os dados do navegador apaga esses pareceres. Use **Meus pareceres → Exportar backup** com frequência. **Importar backup** permite mesclar ou substituir.
- Pareceres e backups da versão anterior continuam abrindo: o texto é mantido como estava, sem cabeçalho e sem campos parametrizados.

## Atalhos
`/` pesquisar modelos · `Alt+1..4` áreas · `Ctrl+S` salvar · `Ctrl+P` PDF · `Ctrl+B/I` negrito/itálico · `Ctrl+Z/Y` desfazer/refazer.

## Futuro backend
O acesso aos dados está isolado no objeto `Store` (`script.js`). Para usar um servidor, basta trocar a implementação desses métodos.
