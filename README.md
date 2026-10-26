# Pareceres Socioambientais — ferramenta de montagem

Ferramenta web local (HTML, CSS e JavaScript puro, sem instalação, sem servidor e sem internet) para localizar o modelo de parecer, preencher os campos, adaptar o texto e gerar o parecer final.

## Como executar
1. Mantenha os arquivos juntos na mesma pasta.
2. Dê dois cliques em `index.html` (Chrome ou Edge recomendados).

## Arquivos
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da tela |
| `styles.css` | Aparência, versão para celular e versão de impressão |
| `modelos.js` | **Biblioteca**: categorias, modelos, trechos, pendências e guia, extraídos de `TEXTOS_PADRAO_REVISADO.docx` |
| `script.js` | Funcionamento da ferramenta |
| `assets/` | Logo ADM e faixa de cores da marca (extraídos do PowerPoint de referência) |

Identidade visual: azul ADM `#012169` (cor principal: botões, títulos, abas) e verde `#8BC400` (destaques, confirmações, indicador da aba ativa), com os neutros do PowerPoint (`#5B6470`, `#F2F5F9`, `#C7CFD9`) e a fonte Calibri. As cores ficam em variáveis no topo de `styles.css`.

## Biblioteca de modelos (`modelos.js`)
- Os textos foram extraídos automaticamente do Word e conferidos: **166 parágrafos idênticos ao original e 0 diferenças**. Nenhum texto foi corrigido. Os pontos duvidosos estão em `PENDENCIAS_WORD` e aparecem no **Guia** da ferramenta.
- Os analistas **não alteram** os modelos pela tela. Para incluir, editar ou recategorizar um modelo, edite `modelos.js` (as instruções estão no topo do arquivo) e redistribua a pasta.
- Para aproveitar um parecer já adaptado como modelo: no Editor, use **Mais ▾ → Gerar código do modelo**, copie o bloco e cole em `MODELOS`.
- Trechos reutilizáveis (`TRECHOS`): cada um tem `texto` (um parágrafo) ou `paragrafos` (vários, no mesmo formato dos modelos). O trecho **Modelo-base completo** insere os blocos 1 a 6 de uma vez; os títulos dos blocos entram como rótulos internos e não saem no parecer.
- Marcações nos textos: `[CAMPO]` campo a preencher; `[a / b]` alternativa; `**negrito**`; `==condicional==` (amarelo sem colchetes no Word); `!!validação!!` (azul no Word).

## Onde ficam os pareceres
- Os pareceres em elaboração são salvos automaticamente no **navegador (localStorage)**, só neste computador e neste navegador. Não há sincronização entre analistas ou máquinas.
- Limpar os dados do navegador apaga esses pareceres. Use **Meus pareceres → Exportar backup** com frequência. **Importar backup** permite mesclar ou substituir.
- Os modelos da biblioteca nunca são alterados ao salvar um parecer.

## Fluxo de uso
1. **Escolher o parecer**: a aba **Editor** tem, à esquerda, um menu com as categorias (A. Parecer favorável, B. Desbloqueio excepcional, C. Bloqueio mantido, Modelo-base). Cada categoria abre como um menu suspenso com os pareceres dentro.
   - Clique no nome para carregar o parecer no editor. Se havia outro aberto, ele fica salvo em Meus pareceres.
   - O ícone 👁︎ mostra o texto sem abrir.
   - A busca no topo do menu procura no título e no conteúdo. **Enter** abre o primeiro resultado e **Esc** limpa a busca.
2. **Editar**: substitua os campos em amarelo `[ENTRE COLCHETES]`, apague as opções que não se aplicam (parágrafos com barra azul à esquerda) e ajuste o texto livremente.
   - Com um parecer aberto, o painel **Trechos reutilizáveis** fica à direita: clique no texto do parecer e depois em **Inserir**. A seta **»** recolhe o painel e **«** mostra de novo (a escolha fica guardada).
   - O menu de pareceres padrão (esquerda) recolhe pela seta **«** no topo dele e volta pela seta **»** — a escolha fica guardada.
   - No celular, o menu de modelos abre pelo botão **☰ Modelos de parecer** e os trechos ficam abaixo do texto.
3. **Copiar**, **Baixar .txt** ou **Imprimir / PDF**. Revise antes: campos não substituídos saem como estão. Os destaques coloridos não aparecem no texto final, e os rótulos internos do modelo-base não são incluídos.

**Começar sem modelo:** use **+ Novo parecer** no topo do menu lateral, ou entre no Editor sem parecer aberto (para fechar o atual: **Mais ▾ → Fechar parecer**). Há duas opções:
- **Em branco**: página vazia.
- **Com estrutura padrão**: os blocos 1 a 6 da seção 2 do Word (Identificação, Situação da área, Fundamentação, Capacidade produtiva, Conclusão e Orientação) aparecem como guia e não saem no parecer.

A tela vazia do Editor também lista os 5 pareceres salvos mais recentes, para continuar de onde parou.

O arquivo `.txt` é texto simples, e a impressão usa o recurso do navegador (pode salvar em PDF). Nenhum dos dois é um `.docx`.

## Atalhos
`/` pesquisar · `Alt+1..3` áreas · `Ctrl+S` salvar · `Ctrl+P` imprimir · `Ctrl+B/I` negrito/itálico · `Ctrl+Z/Y` desfazer/refazer.

## Futuro backend
O acesso aos dados está isolado no objeto `Store` (`script.js`). Para usar um servidor, basta trocar a implementação desses métodos.
