/* =====================================================================
   AJUSTES DE REVISÃO SOBRE A BIBLIOTECA DO HISTÓRICO
   Carregar DEPOIS de biblioteca-historico.js e ANTES de script.js.

   biblioteca-historico.js é gerado a partir do histórico e pode ser
   gerado de novo. As correções de revisão ficam aqui, separadas, para
   não se perderem. Se o arquivo gerado já trouxer a correção, o ajuste
   não encontra o texto antigo e só deixa um aviso no console.

   O que é corrigido:
   1. Produto fixo (“kg de soja”, “kg de milho”) vira o campo Produto,
      como nos textos do Word.
   2. Restos do parecer real que viraram texto fixo nos modelos novos
      (órgão do embargo, atividade da empresa, nome de colega, “A empresa”).
   3. Área analisada escrita com os campos da área embargada: a área
      analisada precisa usar Nº do CAR e Município/UF.
   4. Títulos de trechos com lacuna onde havia um campo (“localizada em e
      registrada…”).
   5. Pendências para validação humana dos modelos novos (aparecem no
      Guia e no “Ver texto” de cada modelo).
   ===================================================================== */
(function () {
  if (typeof META === 'undefined') return; // biblioteca do histórico não carregada

  const avisar = (msg) => console.warn('[ajustes-historico.js]', msg);

  /** Aplica fn a cada texto dos parágrafos de um modelo (strings, opções, condicionais, opcionais). */
  function trocarNosParagrafos(pars, fn) {
    pars.forEach((p, i) => {
      if (typeof p === 'string') pars[i] = fn(p);
      else if (p && Array.isArray(p.opcoes)) {
        p.opcoes.forEach((o, j) => {
          if (typeof o === 'string') p.opcoes[j] = fn(o);
          else if (o && typeof o.texto === 'string') o.texto = fn(o.texto);
        });
      } else if (p && typeof p.texto === 'string') p.texto = fn(p.texto);
    });
  }

  /** Troca o texto TX[chave] em todos os lugares que o usam (TX, TRECHOS e MODELOS guardam cópias). */
  function substituirTX(chave, novo) {
    const antigo = TX[chave];
    TX[chave] = novo;
    for (const t of TRECHOS) if (t.texto === antigo) t.texto = novo;
    for (const m of MODELOS) trocarNosParagrafos(m.paragrafos, (s) => (s === antigo ? novo : s));
  }

  function ajustarTX(chave, de, para) {
    const antigo = TX[chave];
    if (typeof antigo !== 'string' || !antigo.includes(de)) return avisar(`TX.${chave}: “${de}” não encontrado.`);
    substituirTX(chave, antigo.split(de).join(para));
  }

  /** Troca um pedaço de texto nos parágrafos próprios de um modelo. */
  function ajustarModelo(id, de, para) {
    const m = MODELOS.find((x) => x.id === id);
    if (!m) return avisar(`modelo “${id}” não encontrado.`);
    let achou = false;
    trocarNosParagrafos(m.paragrafos, (s) => {
      if (!s.includes(de)) return s;
      achou = true;
      return s.split(de).join(para);
    });
    if (!achou) avisar(`modelo “${id}”: “${de}” não encontrado.`);
  }

  /* 1. Produto fixo -> {{produto}} */
  const PRODUTO = /\b(kg|toneladas) de (soja|milho)\b/g;
  for (const chave of Object.keys(TX).filter((k) => /^h\d+$/.test(k))) {
    const novo = TX[chave].replace(PRODUTO, '$1 de {{produto}}');
    if (novo !== TX[chave]) substituirTX(chave, novo);
  }
  for (const m of MODELOS.filter((x) => x.fonte === 'Histórico')) {
    trocarNosParagrafos(m.paragrafos, (s) => s.replace(PRODUTO, '$1 de {{produto}}'));
  }
  ajustarModelo('a-cultivo', 'para milho, de {{rendimento}}', 'para {{produto}}, de {{rendimento}}');

  /* 2. Restos do parecer real */
  ajustarModelo('e-sem-restricao', 'A empresa e o CAR {{car}}', '{{Sujeito}} e o CAR {{car}}');
  ajustarModelo('c-embargo', 'possui embargo Semad-GO,', 'possui embargo {{orgao}},');
  ajustarModelo('a-embargo-outros', 'em razão da Lista da Sema-MT', 'em razão {{escolha:da Lista da Sema-MT|de embargo {{orgao}}}}');
  ajustarModelo('a-car-regularizado', 'constar como “Suspenso”', 'constar como {{carStatus}}');
  ajustarModelo('a-triangulacao', ' (Verificado junto com o {{nomeTerceiro2}} as imagens de satélite)', ', conforme verificado nas imagens de satélite');
  ajustarTX('h033', 'com embargo da Sema-MT em nome de', 'com embargo {{orgao}} em nome de');
  const h033 = TRECHOS.find((t) => t.id === 'h033');
  if (h033) h033.titulo = 'Triangulação com embargo de terceiro – cliente sem restrição, área bloqueada';

  const alcadaG = MODELOS.find((x) => x.id === 'a-alcada-g');
  if (alcadaG) {
    alcadaG.padroes = { tipoPessoa: 'PJ' }; // “classificada”, “o enquadramento da empresa”
    ajustarModelo('a-alcada-g', 'é o Comércio Atacadista de Defensivos Agrícolas', 'é a {{atividadePrincipal}}');
    // dois parágrafos colados, com “Além” repetido
    const i = alcadaG.paragrafos.findIndex((p) => typeof p === 'string' && p.includes('\nAlémAlém disso'));
    if (i >= 0) {
      const [a, b] = alcadaG.paragrafos[i].split('\nAlémAlém disso');
      alcadaG.paragrafos.splice(i, 1, a, 'Além disso' + b);
    } else avisar('a-alcada-g: parágrafos colados não encontrados.');
  }

  /* 3. Área analisada com os campos da área analisada */
  ajustarModelo('a-pvg', 'em áreas localizadas no município de {{municipio}}.', 'em áreas localizadas no município de {{municipioEmbargo}}.');
  ajustarModelo('a-pvg', '{{municipio2}}', '{{municipio}}');
  ajustarModelo('a-moratoria', 'está localizada em {{municipioEmbargo3}}, registrada no CAR {{carEmbargo}}', 'está localizada em {{municipio}}, registrada no CAR {{car}}');
  ajustarModelo('a-embargo-outros', 'está localizada em {{municipioEmbargo}}, registrada no CAR {{carEmbargo}}', 'está localizada em {{municipio}}, registrada no CAR {{car}}');
  ajustarModelo('c-embargo', 'também está situada em {{municipioEmbargo}}, registrada', 'também está situada em {{municipio}}, registrada');
  ajustarModelo('c-prospeccao', 'também está localizada no município de {{municipioEmbargo}}', 'também está localizada no município de {{municipio}}');

  /* 4. Títulos com lacuna */
  for (const t of TRECHOS) {
    if (/^h\d+$/.test(t.id) && / em e registrad/.test(t.titulo)) t.titulo = t.titulo.replace(' em e registrad', ' em [MUNICÍPIO] e registrad');
  }

  /* 5. Pendências para validação humana */
  PENDENCIAS_WORD.push(
    { id: 'h01', modelos: ['c-embargo', 'c-car-suspenso', 'c-prospeccao', 'c-moratoria'], descricao: 'Modelos do histórico com 1ª pessoa (“coloco-me à disposição”, “Sugiro que…”, “não recomendamos”), enquanto os modelos do Word usam linguagem impessoal. Decidir se padroniza.' },
    { id: 'h02', modelos: ['c-prospeccao'], descricao: 'O 3º parágrafo fala em “passivo da Moratória”, mas o “quando usar” também cobre embargo e raio de 150 km. Vírgula entre sujeito e verbo: “A área indicada para análise, também está localizada…”.' },
    { id: 'h03', modelos: ['a-embargo-outros'], descricao: 'O texto citava só a “Lista da Sema-MT”; virou a alternativa [da Lista da Sema-MT / de embargo (órgão)]. Regência: “a área que desejam análise e desbloqueio”.' },
    { id: 'h04', modelos: ['a-alcada-g'], descricao: 'A atividade “Comércio Atacadista de Defensivos Agrícolas” virou o campo Atividade principal, e o tipo de pessoa já vem como PJ. Colocação pronominal: “Considerando que trata-se de cliente INDIRETO” (que se trata).' },
    { id: 'h05', modelos: ['a-pvg', 'a-moratoria', 'a-embargo-outros', 'c-embargo', 'c-prospeccao'], descricao: 'A área analisada usava os campos da área embargada (Município/CAR do embargo). Passou a usar Município/UF e Nº do CAR. Conferir se a redação continua certa.' },
    { id: 'h06', modelos: ['a-triangulacao'], descricao: 'O texto citava o colega que conferiu as imagens (“Verificado junto com o …”). Trocado por “conforme verificado nas imagens de satélite”. O 1º parágrafo usa “O produtor” fixo.' },
  );
})();
