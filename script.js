/* =====================================================================
   Pareceres Socioambientais — lógica da aplicação (JavaScript puro)

   Organização:
     1. Utilidades
     2. Marcação (texto do modelos.js  <->  "runs" com formatação e campos)
     3. Campos parametrizados (valores, derivados PF/PJ, alternativas)
     4. Armazenamento (localStorage: somente os pareceres do analista)
     5. Biblioteca (carregar e validar modelos.js) e histórico: busca
        ranqueada por uso, sinônimos, temas e sugestão do próximo trecho
     6. Início (temas, mais usados e cartões dos modelos)
     7. Visualização de modelo
     8. Editor (renderizar, ler, opções, inserir trechos, apagar, limpar)
     9. Painel "Dados do caso"
    10. Painel de trechos padronizados
    11. Documento final: copiar, pré-visualizar, Word, PDF, .txt, código
    12. Meus pareceres e backup
    13. Guia
    14. Interface (abas, diálogos, avisos, atalhos) e inicialização

   A biblioteca (MODELOS, TRECHOS, CAMPOS…) vem de modelos.js e de
   biblioteca-historico.js (+ ajustes-historico.js) e é SOMENTE LEITURA
   aqui: nenhuma função grava nela.
   ===================================================================== */
'use strict';

/* =========================== 1. Utilidades =========================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Cria elemento com segurança (texto sempre via textContent). */
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

const own = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const agoraISO = () => new Date().toISOString();
const clone = (o) => JSON.parse(JSON.stringify(o));
const maiuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function fmtData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function debounce(fn, ms) {
  let t = null;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => { t = null; fn(...a); }, ms); };
  d.flush = (...a) => { if (t) { clearTimeout(t); t = null; fn(...a); } };
  d.pending = () => t !== null;
  d.cancel = () => { clearTimeout(t); t = null; };
  return d;
}

function slug(s) {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'parecer';
}

function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ===================== 2. Marcação e "runs" ========================
   Um parágrafo é { tipo: 'p' | 'rotulo', runs: [...] } e pode ter:
     grupo + opcao (opção de um grupo), se (condicional), opcional +
     incluido, etiqueta (rótulo interno mostrado acima), bloco (rótulos),
     origem (id do trecho de onde veio: base da sugestão do próximo).
   Cada run é { t: texto, b?, i?, c?, v? } ou um "chip":
     { campo: 'nome', ph?: 'TEXTO' }   campo parametrizado
     { escolha: 'e3' }                  alternativa local (parecer.escolhas)
   No modelos.js: **negrito**, ==condicional==, !!validação!!,
   {{campo}}, {{campo|TEXTO}}, {{escolha:a|b}}                          */
const MARCAS = { '**': 'b', '==': 'c', '!!': 'v' };
const FLAGS = ['b', 'i', 'c', 'v'];

function mkRun(t, f = {}) {
  const r = { t: t == null ? '' : String(t) };
  for (const k of FLAGS) if (f[k]) r[k] = true;
  if (f.campo) { r.campo = String(f.campo); if (f.ph) r.ph = String(f.ph); }
  else if (f.escolha) r.escolha = String(f.escolha);
  return r;
}
const ehChip = (r) => !!(r && (r.campo || r.escolha));
const mesmoFormato = (a, b) => !ehChip(a) && !ehChip(b) && FLAGS.every((k) => !!a[k] === !!b[k]);

function mergeRuns(runs) {
  const out = [];
  for (const r of runs) {
    if (!r.t && !ehChip(r)) continue;
    const last = out[out.length - 1];
    if (last && mesmoFormato(last, r)) last.t += r.t;
    else out.push(mkRun(r.t, r));
  }
  return out;
}

/** Índice do "}}" que fecha o "{{" em s[i] (considera aninhamento), ou -1. */
function fimChaves(s, i) {
  let d = 0;
  for (let k = i; k < s.length - 1; k++) {
    if (s[k] === '{' && s[k + 1] === '{') { d++; k++; continue; }
    if (s[k] === '}' && s[k + 1] === '}') { d--; if (d === 0) return k; k++; }
  }
  return -1;
}

/** Divide por "|" apenas fora de {{ }}. */
function dividirTopo(s) {
  const out = [];
  let d = 0;
  let buf = '';
  for (let k = 0; k < s.length; k++) {
    const two = s.substr(k, 2);
    if (two === '{{') { d++; buf += two; k++; continue; }
    if (two === '}}') { d--; buf += two; k++; continue; }
    if (s[k] === '|' && d === 0) { out.push(buf); buf = ''; continue; }
    buf += s[k];
  }
  out.push(buf);
  return out;
}

/** Quebra a marcação em tokens: texto, marca (negrito…), campo, escolha. */
function tokenize(s) {
  s = String(s == null ? '' : s);
  const out = [];
  let buf = '';
  const push = () => { if (buf) { out.push({ tipo: 'texto', t: buf }); buf = ''; } };
  for (let i = 0; i < s.length;) {
    const two = s.substr(i, 2);
    if (two === '{{') {
      const j = fimChaves(s, i);
      if (j > 0) {
        push();
        const dentro = s.slice(i + 2, j);
        if (dentro.startsWith('escolha:')) out.push({ tipo: 'escolha', opcoes: dividirTopo(dentro.slice(8)) });
        else {
          const [campo, ph] = dividirTopo(dentro);
          out.push({ tipo: 'campo', campo: campo.trim(), ph: ph ? ph.trim() : '' });
        }
        i = j + 2;
        continue;
      }
    }
    if (own(MARCAS, two)) { push(); out.push({ tipo: 'marca', k: MARCAS[two] }); i += 2; continue; }
    buf += s[i];
    i++;
  }
  push();
  return out;
}

/** Texto da marcação com os campos como no Word: [CAMPO] (ou CAMPO dentro de alternativas). */
function textoPlano(s, bare = false) {
  return tokenize(s).map((tk) => {
    if (tk.tipo === 'texto') return tk.t;
    if (tk.tipo === 'campo') { const ph = phDe(tk.campo, tk.ph); return bare ? ph : '[' + ph + ']'; }
    if (tk.tipo === 'escolha') return '[' + tk.opcoes.map((o) => textoPlano(o, true)).join(' / ') + ']';
    return '';
  }).join('');
}

/**
 * Converte marcação em runs. Alternativas ({{escolha:…}}) são registradas
 * no parecer P (P.escolhas), cada uma com um id próprio.
 */
function parseMarkup(s, P) {
  const runs = [];
  const st = { b: false, c: false, v: false };
  let antes = '';
  for (const tk of tokenize(s)) {
    if (tk.tipo === 'marca') { st[tk.k] = !st[tk.k]; continue; }
    if (tk.tipo === 'texto') { runs.push(mkRun(tk.t, st)); antes += tk.t; continue; }
    if (tk.tipo === 'campo') { runs.push(mkRun('', { ...st, campo: tk.campo, ph: tk.ph })); antes += phDe(tk.campo, tk.ph); continue; }
    const id = novaEscolha(P, tk.opcoes, antes.replace(/\s+/g, ' ').trim().slice(-60));
    runs.push(mkRun('', { ...st, escolha: id }));
    antes += '[…]';
  }
  return mergeRuns(runs);
}

function novaEscolha(P, opcoes, contexto) {
  P.seq = (P.seq || 0) + 1;
  const id = 'e' + P.seq;
  P.escolhas[id] = { opcoes: opcoes.map(String), valor: null, contexto: contexto || '' };
  return id;
}

function novoGrupo(P, def) {
  P.seq = (P.seq || 0) + 1;
  const id = 'g' + P.seq;
  P.grupos[id] = {
    nome: String(def.grupo || 'Opções'),
    instrucao: String(def.instrucao || ''),
    multipla: !!def.multipla,
    opcoes: def.opcoes.map((o, i) => (typeof o === 'string' ? 'Opção ' + (i + 1) : String(o.rotulo || 'Opção ' + (i + 1)))),
    escolhidas: [],
  };
  return id;
}

/** Converte runs de volta para a marcação do modelos.js (itálico não existe lá). */
function runsToMarkup(runs, P) {
  let out = '';
  const st = { b: false, c: false, v: false };
  for (const r of runs) {
    for (const [m, k] of [['!!', 'v'], ['==', 'c'], ['**', 'b']]) {
      if (!!r[k] !== st[k]) { out += m; st[k] = !!r[k]; }
    }
    if (r.campo) out += '{{' + r.campo + (r.ph ? '|' + r.ph : '') + '}}';
    else if (r.escolha) {
      const e = P.escolhas[r.escolha];
      out += e ? '{{escolha:' + e.opcoes.join('|') + '}}' : r.t;
    } else out += r.t;
  }
  for (const [m, k] of [['**', 'b'], ['==', 'c'], ['!!', 'v']]) if (st[k]) out += m;
  return out;
}

const runsText = (runs) => runs.map((r) => r.t).join('');

/** Converte um modelo (ou trecho) da biblioteca em parágrafos editáveis do parecer P. */
function modeloParaParagrafos(modelo, P) {
  const pars = [];
  for (const item of modelo.paragrafos || []) {
    if (typeof item === 'string') pars.push(comOrigem({ tipo: 'p', runs: parseMarkup(item, P) }, item));
    else if (item && Array.isArray(item.opcoes)) {
      const gid = novoGrupo(P, item);
      item.opcoes.forEach((op, i) => {
        const texto = typeof op === 'string' ? op : op.texto;
        const par = comOrigem({ tipo: 'p', grupo: gid, opcao: i, runs: parseMarkup(String(texto || ''), P) }, texto);
        par.etiqueta = P.grupos[gid].opcoes[i];
        pars.push(par);
      });
    } else if (item && item.se) {
      pars.push(comOrigem({ tipo: 'p', se: String(item.se), etiqueta: String(item.rotulo || 'Condicional'), runs: parseMarkup(item.texto, P) }, item.texto));
    } else if (item && item.opcional) {
      pars.push(comOrigem({ tipo: 'p', opcional: String(item.opcional), etiqueta: String(item.opcional), incluido: !!item.incluido, runs: parseMarkup(item.texto, P) }, item.texto));
    } else if (item && item.rotulo != null) {
      const par = { tipo: 'rotulo', runs: [mkRun(String(item.rotulo))] };
      if (item.bloco) par.bloco = Number(item.bloco);
      pars.push(par);
    }
  }
  return pars;
}

/* ================= 3. Campos parametrizados ======================== */
const LISTA_CAMPOS = typeof CAMPOS !== 'undefined' && Array.isArray(CAMPOS) ? CAMPOS : [];
const CAMPO_POR_ID = new Map(LISTA_CAMPOS.map((c) => [c.id, c]));
const DERIV = typeof DERIVADOS !== 'undefined' ? DERIVADOS : {};
const STATUS_LISTA = typeof STATUS !== 'undefined' && Array.isArray(STATUS) ? STATUS : [];
const ORDEM_GRUPOS = typeof GRUPOS_CAMPOS !== 'undefined' ? GRUPOS_CAMPOS : [...new Set(LISTA_CAMPOS.map((c) => c.grupo))];
/** Parecer vazio usado para mostrar textos fora de um parecer (visualizações). */
const novoContexto = () => ({ dados: {}, escolhas: {}, grupos: {}, seq: 0 });

/** Campo "de verdade" por trás de um derivado (Sujeito, doc… vêm de tipoPessoa). */
const campoBase = (id) => (DERIV[id] ? DERIV[id].de : id);

function phDe(campo, ph) {
  if (ph) return ph;
  if (DERIV[campo]) return DERIV[campo].ph;
  const c = CAMPO_POR_ID.get(campo);
  return c ? c.ph : String(campo).toUpperCase();
}

function rotuloCampo(id) {
  const base = campoBase(id);
  const c = CAMPO_POR_ID.get(base);
  return c ? c.rotulo : base;
}

/** Valor a escrever no parecer ('' se vazio). */
function valorCampo(id, P) {
  const dados = (P && P.dados) || {};
  const d = DERIV[id];
  if (d) { const v = dados[d.de]; return v === 'PF' || v === 'PJ' ? d[v] : ''; }
  const v = String(dados[id] == null ? '' : dados[id]).trim();
  if (!v) return '';
  const c = CAMPO_POR_ID.get(id);
  if (c && Array.isArray(c.opcoes)) {
    const o = c.opcoes.find((x) => typeof x === 'object' && x.valor === v);
    if (o) return o.texto;
  }
  return v;
}

/** Resolve uma marcação com os valores do parecer (sem formatação). */
function resolverTexto(s, P, bare) {
  return tokenize(s).map((tk) => {
    if (tk.tipo === 'texto') return tk.t;
    if (tk.tipo === 'campo') { const v = valorCampo(tk.campo, P); const ph = phDe(tk.campo, tk.ph); return v || (bare ? ph : '[' + ph + ']'); }
    if (tk.tipo === 'escolha') return textoPlano('{{escolha:' + tk.opcoes.join('|') + '}}');
    return '';
  }).join('');
}

/** Texto que um chip mostra (e que sai no parecer). */
function textoChip(r, P) {
  if (r.campo) return valorCampo(r.campo, P) || '[' + phDe(r.campo, r.ph) + ']';
  const e = P && P.escolhas ? P.escolhas[r.escolha] : null;
  if (!e) return r.t || '';
  if (e.valor == null || e.opcoes[e.valor] == null) return '[' + e.opcoes.map((o) => resolverTexto(o, P, true)).join(' / ') + ']';
  return resolverTexto(e.opcoes[e.valor], P, false);
}

function chipPendente(r, P) {
  if (r.campo) return !valorCampo(r.campo, P);
  const e = P && P.escolhas ? P.escolhas[r.escolha] : null;
  if (!e) return false;
  if (e.valor == null || e.opcoes[e.valor] == null) return true;
  return tokenize(e.opcoes[e.valor]).some((tk) => tk.tipo === 'campo' && !valorCampo(tk.campo, P));
}

/** Campos (base) que um chip usa — uma alternativa usa os campos de todas as suas opções. */
function camposDoChip(r, P) {
  if (r.campo) return [campoBase(r.campo)];
  const e = P && P.escolhas ? P.escolhas[r.escolha] : null;
  if (!e) return [];
  return e.opcoes.flatMap((o) => tokenize(o).filter((tk) => tk.tipo === 'campo').map((tk) => campoBase(tk.campo)));
}

function camposDosParagrafos(pars, P) {
  const s = new Set();
  for (const par of pars) {
    for (const r of par.runs || []) camposDoChip(r, P).forEach((c) => s.add(c));
    if (par.se) s.add(campoBase(par.se.split('=')[0]));
  }
  return s;
}

/** Visibilidade de um parágrafo: 'on' (sai), 'off' (não sai) ou 'pendente' (sai, falta decidir). */
function visibilidade(par, P) {
  if (par.grupo && par.opcao != null && P.grupos && P.grupos[par.grupo]) {
    const g = P.grupos[par.grupo];
    if (!g.escolhidas.length) return 'pendente';
    return g.escolhidas.includes(par.opcao) ? 'on' : 'off';
  }
  if (par.se) {
    const [campo, valor] = par.se.split('=');
    const v = String((P.dados || {})[campo] || '');
    if (!v) return 'pendente';
    return v === valor ? 'on' : 'off';
  }
  if (par.opcional) return par.incluido ? 'on' : 'off';
  return 'on';
}

/** Valores iniciais: "padrao" dos campos usados + "padroes" do modelo. */
function aplicarPadroes(P, pars, padroes) {
  for (const id of camposDosParagrafos(pars, P)) {
    const c = CAMPO_POR_ID.get(id);
    if (c && c.padrao && !P.dados[id]) P.dados[id] = c.padrao;
  }
  for (const [k, v] of Object.entries(padroes || {})) if (!P.dados[k]) P.dados[k] = String(v);
}

/* ================ 4. Armazenamento (localStorage) ====================
   Guarda SOMENTE os pareceres em elaboração do analista. A biblioteca
   vem de modelos.js. Para um backend futuro, troque a implementação
   destes métodos mantendo a mesma interface.                          */
const Store = {
  KEY: 'psa.pareceres.v1',
  UI: 'psa.ui.v1',
  disponivel: true,

  testar() {
    try {
      const k = '__psa_teste__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      this.disponivel = true;
    } catch (e) {
      this.disponivel = false;
    }
    return this.disponivel;
  },

  listar() {
    if (!this.disponivel) return [];
    let raw;
    try {
      raw = localStorage.getItem(this.KEY);
    } catch (e) {
      this._erro('Não foi possível ler os pareceres salvos neste navegador.');
      return [];
    }
    if (!raw) return [];
    try {
      const dados = JSON.parse(raw);
      return Array.isArray(dados) ? dados.filter(validarParecer) : [];
    } catch (e) {
      // Dados corrompidos: preserva uma cópia antes de qualquer gravação.
      try { localStorage.setItem(this.KEY + '.corrompido.' + Date.now(), raw); } catch (_) { /* sem espaço */ }
      try { localStorage.removeItem(this.KEY); } catch (_) { /* ignora */ }
      this._erro('Os pareceres salvos estavam ilegíveis. Uma cópia foi preservada e a lista foi reiniciada.');
      return [];
    }
  },

  gravarTodos(lista) {
    if (!this.disponivel) { this._erro('O armazenamento do navegador está indisponível. Exporte o parecer (Word/PDF) ou use o backup para não perder o trabalho.'); return false; }
    try {
      localStorage.setItem(this.KEY, JSON.stringify(lista));
      return true;
    } catch (e) {
      const cheio = e && (e.name === 'QuotaExceededError' || e.code === 22);
      this._erro(cheio
        ? 'Espaço do navegador esgotado. Exporte um backup e exclua pareceres antigos.'
        : 'Erro ao gravar no navegador: ' + (e && e.message ? e.message : e));
      return false;
    }
  },

  obter(id) { return this.listar().find((p) => p.id === id) || null; },

  salvar(parecer) {
    const lista = this.listar();
    const i = lista.findIndex((p) => p.id === parecer.id);
    if (i >= 0) lista[i] = parecer; else lista.unshift(parecer);
    return this.gravarTodos(lista);
  },

  excluir(id) { return this.gravarTodos(this.listar().filter((p) => p.id !== id)); },

  ui(chave, valor) {
    try {
      const atual = JSON.parse(localStorage.getItem(this.UI) || '{}');
      if (valor === undefined) return atual[chave];
      atual[chave] = valor;
      localStorage.setItem(this.UI, JSON.stringify(atual));
    } catch (e) { /* preferências de interface são opcionais */ }
    return undefined;
  },

  _erro(msg) { toast(msg, 'err', 8000); setStatus('error', 'Erro ao salvar'); },
};

/** Valida a estrutura mínima de um parecer (usado na leitura e no backup). */
function validarParecer(p) {
  return p && typeof p === 'object' && typeof p.id === 'string' && p.id.length > 0 &&
    Array.isArray(p.paragrafos) &&
    p.paragrafos.every((par) => par && Array.isArray(par.runs) && par.runs.every((r) => r && typeof r.t === 'string'));
}

/**
 * Reconstrói um parecer só com campos conhecidos (evita dados estranhos vindos
 * de arquivos) e completa os campos novos em pareceres da versão anterior.
 */
function limparParecer(p) {
  const str = (v) => (typeof v === 'string' ? v : '');
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const dados = {};
  for (const [k, v] of Object.entries(obj(p.dados))) if (typeof v === 'string') dados[k] = v;
  const escolhas = {};
  for (const [k, e] of Object.entries(obj(p.escolhas))) {
    if (e && Array.isArray(e.opcoes)) escolhas[k] = { opcoes: e.opcoes.map(String), valor: Number.isInteger(e.valor) ? e.valor : null, contexto: str(e.contexto) };
  }
  const grupos = {};
  for (const [k, g] of Object.entries(obj(p.grupos))) {
    if (g && Array.isArray(g.opcoes)) {
      grupos[k] = {
        nome: str(g.nome), instrucao: str(g.instrucao), multipla: !!g.multipla, opcoes: g.opcoes.map(String),
        escolhidas: Array.isArray(g.escolhidas) ? g.escolhidas.filter(Number.isInteger) : [],
      };
    }
  }
  // seq precisa ficar acima de todos os ids já usados (e1, g2…)
  let seq = Number.isInteger(p.seq) ? p.seq : 0;
  for (const k of [...Object.keys(escolhas), ...Object.keys(grupos)]) { const n = parseInt(k.slice(1), 10); if (n > seq) seq = n; }
  return {
    id: p.id,
    modeloId: str(p.modeloId),
    modeloTitulo: str(p.modeloTitulo),
    titulo: str(p.titulo),
    paragrafos: p.paragrafos.map((par) => {
      const o = { tipo: par.tipo === 'rotulo' ? 'rotulo' : 'p', runs: mergeRuns(par.runs.map((r) => mkRun(r.t, r))) };
      if (typeof par.grupo === 'string' && par.grupo) o.grupo = par.grupo;
      if (Number.isInteger(par.opcao)) o.opcao = par.opcao;
      if (typeof par.se === 'string' && par.se) o.se = par.se;
      if (typeof par.opcional === 'string' && par.opcional) { o.opcional = par.opcional; o.incluido = !!par.incluido; }
      if (typeof par.etiqueta === 'string' && par.etiqueta) o.etiqueta = par.etiqueta;
      if (Number.isInteger(par.bloco)) o.bloco = par.bloco;
      if (typeof par.origem === 'string' && par.origem) o.origem = par.origem;
      return o;
    }),
    dados, escolhas, grupos, seq,
    status: str(p.status),
    tema: str(p.tema),
    criadoEm: str(p.criadoEm) || agoraISO(),
    atualizadoEm: str(p.atualizadoEm) || agoraISO(),
    bibliotecaVersao: str(p.bibliotecaVersao),
  };
}

/* ======================= 5. Biblioteca ============================== */
const LIB = { modelos: [], porId: new Map(), categorias: [], trechos: [], problemas: [], versao: '', origem: new Map() };

/* Histórico (biblioteca-historico.js): uso, palavras-chave, tema, caminhos e sinônimos. Opcional. */
const META_LIB = typeof META !== 'undefined' ? META : {};
const SIN_LIB = typeof SINONIMOS !== 'undefined' ? SINONIMOS : {};
const INICIOS_LIB = typeof INICIOS !== 'undefined' ? INICIOS : {};
const TEMAS_LIB = typeof TEMAS !== 'undefined' && Array.isArray(TEMAS) ? TEMAS : [];
const temaPorId = (id) => TEMAS_LIB.find((t) => t.id === id) || null;

const MARKER_RE = /\[\[([^\[\]]+)\]\]|\[([^\[\]]+)\]/g;

/** Confere se os campos citados num texto existem em CAMPOS. */
function conferirCampos(s, onde) {
  const ver = (texto) => {
    for (const tk of tokenize(texto)) {
      if (tk.tipo === 'campo' && !DERIV[tk.campo] && !CAMPO_POR_ID.has(tk.campo)) LIB.problemas.push(`${onde}: campo inexistente “${tk.campo}”.`);
      if (tk.tipo === 'escolha') tk.opcoes.forEach(ver);
    }
  };
  ver(s);
}

function textosDoItem(it) {
  if (typeof it === 'string') return [it];
  if (it && Array.isArray(it.opcoes)) return it.opcoes.map((o) => (typeof o === 'string' ? o : String(o.texto || '')));
  if (it && (it.se || it.opcional)) return [String(it.texto || '')];
  return [];
}

/** Lê e confere o conteúdo de modelos.js. Problemas viram avisos no Guia. */
function carregarBiblioteca() {
  /* constantes declaradas com const não ficam em window: usamos typeof */
  const modelos = typeof MODELOS !== 'undefined' ? MODELOS : undefined;
  const categorias = typeof CATEGORIAS !== 'undefined' ? CATEGORIAS : [];
  const trechos = typeof TRECHOS !== 'undefined' ? TRECHOS : [];
  LIB.versao = typeof BIBLIOTECA_VERSAO !== 'undefined' ? BIBLIOTECA_VERSAO : '';

  if (!Array.isArray(modelos)) {
    LIB.problemas.push('O arquivo modelos.js não foi carregado ou não define MODELOS.');
    return;
  }
  LIB.categorias = Array.isArray(categorias) ? categorias : [];
  const catIds = new Set(LIB.categorias.map((c) => c.id));

  for (const m of modelos) {
    if (!m || typeof m.id !== 'string' || !m.id) { LIB.problemas.push('Modelo sem "id": ' + (m && m.titulo ? m.titulo : '(sem título)')); continue; }
    if (LIB.porId.has(m.id)) { LIB.problemas.push('Id repetido em modelos.js: "' + m.id + '" (só o primeiro foi carregado).'); continue; }
    if (!catIds.has(m.categoria)) LIB.problemas.push('Modelo "' + m.id + '" usa categoria inexistente: "' + m.categoria + '".');
    if (m.status && !STATUS_LISTA.some((s) => s.id === m.status)) LIB.problemas.push('Modelo "' + m.id + '" usa status inexistente: "' + m.status + '".');
    if (!Array.isArray(m.paragrafos)) { LIB.problemas.push('Modelo "' + m.id + '" sem lista "paragrafos".'); continue; }
    m.paragrafos.forEach((it, i) => { if (it === undefined) LIB.problemas.push(`Modelo "${m.id}": parágrafo ${i + 1} vazio (chave inexistente em TX?).`); else textosDoItem(it).forEach((t) => conferirCampos(t, 'Modelo "' + m.id + '"')); });
    const cat = LIB.categorias.find((c) => c.id === m.categoria);
    const corpo = textoDoModelo(m);
    const meta = META_LIB[m.id] || {};
    m._cat = cat ? cat.nome : (m.categoria || 'Sem categoria');
    m._corpo = corpo;
    m._usos = meta.usos || 0;
    m._chaves = norm((meta.palavrasChave || []).join(' | '));
    m._titulo = norm([m.titulo, m.subcategoria, m.quandoUsar].join(' | '));
    m._busca = norm([m.titulo, m._cat, m.subcategoria, m.quandoUsar, (m.obs || []).join(' '), (meta.palavrasChave || []).join(' '), corpo].join(' \n '));
    m._temas = TEMAS_LIB.filter((t) => (t.modelos || []).includes(m.id)).map((t) => t.id);
    m._pend = (typeof PENDENCIAS_WORD !== 'undefined' ? PENDENCIAS_WORD : []).filter((p) => (p.modelos || []).includes(m.id));
    LIB.modelos.push(m);
    LIB.porId.set(m.id, m);
  }
  for (const t of TEMAS_LIB) {
    for (const id of t.modelos || []) if (!LIB.porId.has(id)) LIB.problemas.push(`Tema "${t.id}" cita um modelo inexistente: "${id}".`);
  }

  const tIds = new Set();
  for (const t of Array.isArray(trechos) ? trechos : []) {
    if (!t || !t.id || tIds.has(t.id) || (typeof t.texto !== 'string' && !Array.isArray(t.paragrafos))) { LIB.problemas.push('Trecho inválido ou repetido: ' + (t && t.id)); continue; }
    tIds.add(t.id);
    (Array.isArray(t.paragrafos) ? t.paragrafos.flatMap(textosDoItem) : [t.texto]).forEach((s) => conferirCampos(s, 'Trecho "' + t.id + '"'));
    const meta = META_LIB[t.id] || {};
    t._blocos = Array.isArray(t.blocos) ? t.blocos.map(Number) : [];
    t._grupo = t.categoria || nomeBloco(t._blocos[0]) || 'Outros';
    t._usos = meta.usos || 0;
    t._tema = meta.tema || '';
    t._universal = !!meta.universal;
    t._chaves = norm((meta.palavrasChave || []).join(' | '));
    t._titulo = norm(t.titulo);
    t._busca = norm([t.titulo, t._grupo, t.fonte, (meta.palavrasChave || []).join(' '), textoDoTrecho(t)].join(' '));
    // parágrafo de modelo com o mesmo texto do trecho -> veio deste trecho
    if (typeof t.texto === 'string' && !LIB.origem.has(t.texto)) LIB.origem.set(t.texto, t.id);
    LIB.trechos.push(t);
  }
  LIB.problemas.forEach((p) => console.warn('[modelos.js]', p));
}

function textoDoModelo(m) {
  return (m.paragrafos || []).map((it) => {
    if (typeof it === 'string') return textoPlano(it);
    if (it && Array.isArray(it.opcoes)) return it.opcoes.map((o) => (typeof o === 'string' ? textoPlano(o) : o.rotulo + '\n' + textoPlano(o.texto))).join('\n');
    if (it && (it.se || it.opcional)) return textoPlano(it.texto);
    if (it && it.rotulo) return String(it.rotulo);
    return '';
  }).join('\n');
}

/** Blocos da estrutura padrão (GUIA.estrutura), por número. */
function nomeBloco(n) {
  const linhas = typeof GUIA !== 'undefined' && Array.isArray(GUIA.estrutura) ? GUIA.estrutura.slice(1) : [];
  const l = linhas.find((x) => Number(x[0]) === Number(n));
  if (!l) return '';
  return Number(n) === 1 || Number(n) === 2 ? '1 e 2 – Identificação e situação da área' : `${l[0]} – ${l[1]}`;
}

/** Parágrafos de um trecho: "texto" (um parágrafo) ou "paragrafos" (vários, como nos modelos). */
function paragrafosDoTrecho(t, P) {
  return Array.isArray(t.paragrafos) ? modeloParaParagrafos(t, P) : [{ tipo: 'p', runs: parseMarkup(t.texto, P) }];
}
function textoDoTrecho(t) {
  return Array.isArray(t.paragrafos) ? textoDoModelo(t) : textoPlano(t.texto);
}

/** Retorna os termos de busca normalizados. */
const termos = (q) => norm(q).split(/\s+/).filter(Boolean);

/* ---- Busca ranqueada: sinônimos, uso no histórico, tema e caminho ----
   Relevância: cada termo digitado (ou um sinônimo) precisa aparecer;
   vale 3 no título, no “quando usar” ou nas palavras-chave e 1 no texto.
   Pontuação = relevância × (1 + log10(1 + usos)) × 1,5 se for do tema
   + 8 × probabilidade de vir depois do parágrafo do cursor.          */
const LETRA = /[a-z0-9]/;

/** Termos de até 3 letras valem só como palavra: inteira (sinônimos) ou começo de palavra (digitados). */
function contem(texto, termo, inteira) {
  if (termo.length > 3) return texto.includes(termo);
  for (let i = texto.indexOf(termo); i >= 0; i = texto.indexOf(termo, i + 1)) {
    const fim = i + termo.length;
    if ((i === 0 || !LETRA.test(texto[i - 1])) && (!inteira || fim >= texto.length || !LETRA.test(texto[fim]))) return true;
  }
  return false;
}

/** Cada termo digitado vira um grupo de alternativas: o termo e os sinônimos (SINONIMOS). */
function gruposDeBusca(q) {
  return termos(q).map((t) => {
    const alt = new Map([[t, false]]);
    for (const [k, lista] of Object.entries(SIN_LIB)) {
      const grupo = [k, ...lista].map(norm);
      if (grupo.includes(t)) alt.set(t, true); // sigla conhecida (“ti”, “uc”): só a palavra inteira
      if (grupo.some((g) => g === t || (t.length >= 4 && g.startsWith(t)))) grupo.forEach((g) => { if (!alt.has(g)) alt.set(g, true); });
    }
    return [...alt].map(([termo, inteira]) => ({ termo, inteira }));
  });
}

/** Termos para realçar nos resultados: os digitados e os sinônimos longos. */
function termosRealce(q) {
  return [...new Set(gruposDeBusca(q).flat().filter((a) => !a.inteira || a.termo.length >= 4).map((a) => a.termo))];
}

function pontuar(item, grupos, { contexto, protocolos } = {}) {
  let rel = 0;
  for (const alt of grupos) {
    let melhor = 0;
    for (const { termo, inteira } of alt) {
      if (contem(item._titulo, termo, inteira) || contem(item._chaves, termo, inteira)) { melhor = 3; break; }
      if (!melhor && contem(item._busca, termo, inteira)) melhor = 1;
    }
    if (!melhor) return 0;
    rel += melhor;
  }
  const doTema = protocolos && protocolos.includes(item._tema) ? 1.5 : 1;
  const ctx = contexto ? contexto.get(item.id) || 0 : 0;
  return (grupos.length ? rel : 1) * (1 + Math.log10(1 + (item._usos || 0))) * doTema + 8 * ctx + (item._universal ? 0.3 : 0);
}

/** Ordena modelos ou trechos pela pontuação; sem busca, só por uso, tema e caminho. */
function ranquear(lista, q, opcoes) {
  const grupos = gruposDeBusca(q || '');
  return lista
    .map((it) => ({ it, s: pontuar(it, grupos, opcoes) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.it);
}

/* ---- Caminho: de qual trecho veio cada parágrafo e o que costuma vir depois ---- */
const origemDoTexto = (texto) => LIB.origem.get(texto) || null;

/** Grava no parágrafo o trecho de origem do texto (base da sugestão do próximo trecho). */
function comOrigem(par, texto) {
  const o = origemDoTexto(texto);
  if (o) par.origem = o;
  return par;
}

/**
 * Map id -> probabilidade dos trechos que costumam vir depois de "origem".
 * Sem origem (parecer vazio), usa os inícios mais comuns do tema (INICIOS).
 */
function contextoDe(origem, temaId) {
  const ctx = new Map();
  const m = origem && META_LIB[origem];
  if (m && m.seguintes) for (const [id, p] of m.seguintes) ctx.set(id, p);
  if (!origem) {
    const tema = temaPorId(temaId);
    for (const prot of tema ? tema.protocolos || [] : []) {
      (INICIOS_LIB[prot] || []).forEach((id, i) => ctx.set(id, Math.max(ctx.get(id) || 0, 0.6 - i * 0.1)));
    }
  }
  return ctx;
}

/** Monta nós de texto com <mark> nos termos encontrados (comparação sem acentos). */
function realcar(texto, ts) {
  texto = String(texto || '');
  if (!ts.length) return [document.createTextNode(texto)];
  // mapa índice-normalizado -> índice-original
  let n = '';
  const mapa = [];
  for (let i = 0; i < texto.length; i++) {
    const c = norm(texto[i]);
    for (let k = 0; k < c.length; k++) { n += c[k]; mapa.push(i); }
  }
  const marcas = [];
  for (const t of ts) {
    let i = n.indexOf(t);
    while (i >= 0) { marcas.push([mapa[i], mapa[i + t.length - 1] + 1]); i = n.indexOf(t, i + t.length); }
  }
  if (!marcas.length) return [document.createTextNode(texto)];
  marcas.sort((a, b) => a[0] - b[0]);
  const nos = [];
  let pos = 0;
  for (const [a, b] of marcas) {
    if (a < pos) continue;
    if (a > pos) nos.push(document.createTextNode(texto.slice(pos, a)));
    nos.push(el('mark', { class: 'hit', text: texto.slice(a, b) }));
    pos = b;
  }
  if (pos < texto.length) nos.push(document.createTextNode(texto.slice(pos)));
  return nos;
}

/** Trecho do conteúdo em volta do primeiro termo encontrado. */
function trechoEncontrado(texto, ts) {
  const n = norm(texto);
  for (const t of ts) {
    const i = n.indexOf(t);
    if (i >= 0) {
      const a = Math.max(0, i - 70);
      const b = Math.min(texto.length, i + t.length + 90);
      return (a > 0 ? '…' : '') + texto.slice(a, b).replace(/\s+/g, ' ') + (b < texto.length ? '…' : '');
    }
  }
  return '';
}

/* =================== 6. Início (cartões dos modelos) ================ */
const statusDe = (id) => STATUS_LISTA.find((s) => s.id === id) || null;

/** "CASO 1 – ANÁLISE…" -> ['Caso 1', 'ANÁLISE…'] */
function partesTitulo(titulo) {
  const m = /^(CASO\s+\d+)\s*[–-]\s*(.*)$/i.exec(titulo || '');
  return m ? ['Caso ' + m[1].replace(/\D+/g, ''), m[2]] : ['', titulo || ''];
}

function cartaoModelo(m, ts) {
  const st = statusDe(m.status);
  const [caso, resto] = partesTitulo(m.titulo);
  let trecho = null;
  if (ts.length && !ts.some((t) => norm(m.titulo + ' ' + (m.quandoUsar || '')).includes(t))) {
    const sn = trechoEncontrado(m._corpo, ts);
    if (sn) trecho = el('p', { class: 'mc-snip' }, ...realcar(sn, ts));
  }
  const ver = el('button', { type: 'button', class: 'btn btn-small', title: 'Ver o texto sem abrir', text: '👁︎ Ver texto' });
  ver.addEventListener('click', (e) => { e.stopPropagation(); visualizarModelo(m.id); });
  const usar = el('button', { type: 'button', class: 'btn btn-small btn-primary', text: 'Usar modelo' });
  usar.addEventListener('click', (e) => { e.stopPropagation(); usarModelo(m.id); });
  const card = el('article', { class: 'model-card' + (st ? ' st-' + st.cor : ''), tabindex: '0', role: 'button', 'aria-label': 'Usar o modelo ' + m.titulo },
    el('div', { class: 'mc-top' },
      st ? el('span', { class: 'badge badge-' + st.cor, text: st.nome }) : el('span', { class: 'badge', text: 'MODELO-BASE' }),
      caso ? el('span', { class: 'mc-caso', text: caso }) : null,
      m.subcategoria ? el('span', { class: 'mc-sub', text: m.subcategoria }) : null),
    el('h3', { class: 'mc-title' }, ...realcar(resto, ts)),
    m.quandoUsar ? el('p', { class: 'mc-use' }, ...realcar(maiuscula(m.quandoUsar), ts)) : null,
    trecho,
    el('div', { class: 'mc-foot' },
      m._usos ? el('span', { class: 'mc-uso', title: 'Pareceres do histórico nesta situação', text: `usado em ${m._usos} parecer${m._usos === 1 ? '' : 'es'}` }) : null,
      ver, usar));
  card.addEventListener('click', () => usarModelo(m.id));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === card) usarModelo(m.id); });
  return card;
}

/** Modelos do tema escolhido no Início (todos, se nenhum). */
function modelosDoTema() {
  const tema = temaPorId(state.temaInicio);
  return tema ? LIB.modelos.filter((m) => m._temas.includes(tema.id)) : LIB.modelos;
}

/** Botões de tema do Início, com a quantidade de modelos de cada um. */
function renderTemas() {
  const nav = $('#home-temas');
  if (!TEMAS_LIB.length) { nav.hidden = true; return; }
  const botao = (id, nome, n, titulo) => {
    const on = state.temaInicio === id;
    return el('button', { type: 'button', class: 'tema' + (on ? ' on' : ''), 'aria-pressed': String(on), title: titulo || null,
      onclick: () => { state.temaInicio = on && id ? '' : id; for (const k in catsAbertas) delete catsAbertas[k]; renderInicio(); } }, nome, el('span', { class: 'count', text: ' ' + n }));
  };
  nav.replaceChildren(el('span', { class: 'temas-label', text: 'Tema do chamado:' }),
    botao('', 'Todos', LIB.modelos.length),
    ...TEMAS_LIB.map((t) => botao(t.id, t.curto || t.nome, LIB.modelos.filter((m) => m._temas.includes(t.id)).length, t.nome)));
}

/** Seções recolhíveis: só "Mais usados" (ou tudo, com um tema escolhido) abre por padrão. */
const catsAbertas = {};

function secaoModelos(titulo, desc, lista, ts, extra) {
  const aberta = () => (titulo in catsAbertas ? catsAbertas[titulo] : !!extra);
  const sec = el('section', { class: 'cat' + (extra ? ' ' + extra : '') });
  const btn = el('button', { type: 'button', class: 'cat-toggle' });
  const corpo = el('div', { class: 'cat-body' },
    desc ? el('p', { class: 'cat-desc', text: desc }) : null,
    el('div', { class: 'model-grid' }, lista.map((m) => cartaoModelo(m, ts))));
  const aplicar = () => {
    const on = aberta();
    btn.setAttribute('aria-expanded', String(on));
    btn.replaceChildren(el('span', { class: 'cat-caret', text: on ? '▾' : '▸' }), ' ' + titulo, el('span', { class: 'count', text: ' ' + lista.length }));
    corpo.hidden = !on;
  };
  btn.addEventListener('click', () => { catsAbertas[titulo] = !aberta(); aplicar(); });
  aplicar();
  sec.append(el('h2', { class: 'cat-title' }, btn), corpo);
  return sec;
}

/** Sem resultado: oferece começar sem modelo ou procurar em todos os temas. */
function semResultado(msg) {
  const tema = temaPorId(state.temaInicio);
  return el('div', { class: 'empty' },
    el('p', { text: msg }),
    el('div', { class: 'btn-group center' },
      tema ? el('button', { type: 'button', class: 'btn', onclick: () => { state.temaInicio = ''; renderInicio(); } }, 'Procurar em todos os temas') : null,
      el('button', { type: 'button', class: 'btn', 'data-novo': 'blocos' }, '☰ Montar por blocos'),
      el('button', { type: 'button', class: 'btn', 'data-novo': 'branco' }, '✎ Em branco')));
}

/**
 * Início: com busca, uma lista única do mais provável ao menos provável;
 * sem busca, os mais usados e as categorias (desfecho), cada uma ordenada
 * pelo uso no histórico. O tema escolhido filtra as duas formas.
 */
function renderInicio() {
  const box = $('#home-modelos');
  box.replaceChildren();
  renderTemas();
  renderRecentes();
  if (!LIB.modelos.length) {
    box.append(el('p', { class: 'hint', text: 'A biblioteca não foi carregada. Verifique se o arquivo modelos.js está na mesma pasta do index.html.' }));
    return;
  }
  const q = state.buscaInicio.trim();
  const tema = temaPorId(state.temaInicio);
  const base = modelosDoTema();
  const resumo = $('#home-resumo');
  if (q) {
    const vis = ranquear(base, q);
    const ts = termosRealce(q);
    resumo.textContent = vis.length ? `${vis.length} modelo(s) para “${q}”${tema ? ' no tema ' + (tema.curto || tema.nome) : ''}, do mais provável para o menos provável. Enter abre o primeiro.` : '';
    box.append(vis.length ? el('div', { class: 'model-grid' }, vis.map((m) => cartaoModelo(m, ts)))
      : semResultado(`Nenhum modelo encontrado para “${q}”${tema ? ' neste tema' : ''}.`));
    return;
  }
  resumo.textContent = tema ? `${tema.nome}: ${base.length} modelo(s), separados pelo desfecho.` : '';
  const porUso = (lista) => [...lista].sort((a, b) => b._usos - a._usos);
  if (!tema) {
    const top = porUso(base).filter((m) => m._usos).slice(0, 6);
    if (top.length) box.append(secaoModelos('Mais usados', 'As situações mais frequentes no histórico de pareceres. Comece por aqui se não souber qual modelo usar.', top, [], 'cat-top'));
  }
  for (const c of LIB.categorias) {
    const vis = porUso(base.filter((m) => m.categoria === c.id));
    if (vis.length) box.append(secaoModelos(c.nome, c.descricao, vis, []));
  }
  if (!box.childNodes.length) box.append(semResultado('Nenhum modelo neste tema.'));
}

/** Faixa "Continuar" do Início e lista da tela vazia do Editor. */
function renderRecentes() {
  const recentes = Store.listar()
    .sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)))
    .slice(0, 4);
  const faixa = $('#home-continuar');
  faixa.hidden = !recentes.length;
  faixa.replaceChildren(el('strong', { text: '↻ Continuar:' }),
    ...recentes.slice(0, 3).map((p) => el('button', { type: 'button', class: 'recent', title: (p.modeloTitulo || '') + ' · ' + fmtData(p.atualizadoEm), onclick: () => abrirParecer(limparParecer(clone(p))) },
      p.titulo || (p.dados && p.dados.nome) || p.modeloTitulo || '(sem identificação)', el('small', { text: ' · ' + fmtData(p.atualizadoEm) }))),
    el('button', { type: 'button', class: 'link', 'data-goto': 'pareceres', text: 'Ver todos' }));

  const box = $('#start-recent');
  box.replaceChildren();
  if (recentes.length) {
    box.append(el('h3', { text: 'Continuar um parecer salvo' }),
      el('table', { class: 'table' }, el('tbody', {}, recentes.map((p) => el('tr', {},
        el('td', {}, el('strong', { text: p.titulo || '(sem identificação)' })),
        el('td', { text: p.modeloTitulo || '—' }),
        el('td', { text: fmtData(p.atualizadoEm) }),
        el('td', { class: 'actions' }, el('button', { class: 'btn btn-small btn-primary', onclick: () => abrirParecer(limparParecer(clone(p))) }, 'Abrir')))))));
  }
}

/* =================== 7. Visualização de modelo ===================== */
function renderModeloDoc(m) {
  const P = novoContexto();
  const pars = modeloParaParagrafos(m, P);
  const doc = el('div', { class: 'doc-render' });
  let caixa = null;
  let grupoAtual = null;
  for (const par of pars) {
    if (par.grupo !== grupoAtual) {
      caixa = null;
      grupoAtual = par.grupo || null;
      if (grupoAtual) {
        const g = P.grupos[grupoAtual];
        caixa = el('div', { class: 'opt-box' }, el('div', { class: 'opt-label', text: g.nome + ' — ' + (g.instrucao || 'escolha a opção aplicável') }));
        doc.append(caixa);
      }
    }
    const p = parParaElemento(par, P);
    (caixa || doc).append(p);
  }
  return doc;
}

function blocoOrientacoes(m) {
  const nos = [];
  if (m.quandoUsar) nos.push(el('div', { class: 'box box-use' }, el('h4', { text: m.categoria === 'base' ? 'Como usar' : 'Quando usar' }), el('p', { text: maiuscula(m.quandoUsar) })));
  for (const o of m.obs || []) nos.push(el('div', { class: 'box box-obs' }, el('h4', { text: 'Obs.' }), el('p', { text: o })));
  if (m._pend && m._pend.length) {
    nos.push(el('div', { class: 'box box-warn' }, el('h4', { text: 'Pendências para validação humana' }),
      el('ul', {}, m._pend.map((p) => el('li', { text: p.descricao })))));
  }
  return nos;
}

async function visualizarModelo(id) {
  const m = LIB.porId.get(id);
  if (!m) return;
  const st = statusDe(m.status);
  const r = await abrirDialogo({
    titulo: m.titulo,
    corpo: [
      el('div', { class: 'meta' }, el('span', { class: 'chip', text: m._cat }), ' ', st ? el('span', { class: 'badge badge-' + st.cor, text: st.nome }) : null),
      ...blocoOrientacoes(m),
      el('p', { class: 'hint', text: 'Orientações acima são internas e não entram no parecer. Abaixo, o texto-base do modelo (campos em destaque são preenchidos no painel “Dados do caso”):' }),
      renderModeloDoc(m),
    ],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Usar este modelo', value: 'usar', cls: 'btn-primary' }],
  });
  if (r === 'usar') usarModelo(id);
}

/* ============================ 8. Editor ============================= */
const state = {
  view: 'inicio',
  buscaInicio: '',
  temaInicio: '',
  parecer: null,
  dirty: false,
  lastRange: null,
  pendUltima: null,      // última pendência visitada por "Ir para o próximo"
  pendIdx: 0,
  trLimite: 30,          // trechos mostrados no painel antes de "Mostrar mais"
  origemCursor: null,    // trecho de origem do parágrafo do cursor (sugestões)
  assinaturaPainel: '',  // campos e alternativas visíveis quando o painel foi desenhado
};

/** Insere runs em um contêiner como nós seguros (chips e marcadores [..] realçados). */
function appendRuns(container, runs, opts = {}) {
  const P = opts.P || state.parecer || novoContexto();
  for (const r of runs) {
    let nos = ehChip(r) ? [chipEl(r, P)] : textoComMarcadores(r.t, opts);
    const envolver = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...nos); nos = [e]; };
    if (r.v) envolver('span', 'valid');
    if (r.c) envolver('span', 'cond');
    if (r.i) envolver('i');
    if (r.b) envolver('b');
    container.append(...nos);
  }
}

function chipEl(r, P) {
  const s = el('span', {
    class: 'campo' + (r.escolha ? ' escolha' : '') + (chipPendente(r, P) ? ' vazio' : ''),
    contenteditable: 'false',
    text: textoChip(r, P),
  });
  if (r.campo) {
    s.dataset.campo = r.campo;
    if (r.ph) s.dataset.ph = r.ph;
    s.title = rotuloCampo(r.campo) + ' — clique para preencher no painel “Dados do caso” (duplo clique: converter em texto)';
  } else {
    s.dataset.escolha = r.escolha;
    s.title = 'Alternativa — clique para escolher no painel “Dados do caso” (duplo clique: converter em texto)';
  }
  return s;
}

/** Lê o chip de volta como run (a partir dos atributos do elemento). */
function runDoChip(span, f = {}) {
  return span.dataset.campo
    ? mkRun(span.textContent, { ...f, campo: span.dataset.campo, ph: span.dataset.ph })
    : mkRun(span.textContent, { ...f, escolha: span.dataset.escolha });
}

function textoComMarcadores(t, opts = {}) {
  const nos = [];
  const pushTexto = (s) => {
    const partes = s.split('\n');
    partes.forEach((p, i) => {
      if (i > 0) nos.push(document.createElement('br'));
      if (p) nos.push(...(opts.realce ? realcar(p, opts.realce) : [document.createTextNode(p)]));
    });
  };
  if (opts.semMarcadores) { pushTexto(t); return nos; }
  let pos = 0;
  MARKER_RE.lastIndex = 0;
  let m;
  while ((m = MARKER_RE.exec(t))) {
    if (m.index > pos) pushTexto(t.slice(pos, m.index));
    nos.push(el('span', { class: 'ph', text: m[0] }));
    pos = m.index + m[0].length;
  }
  if (pos < t.length) pushTexto(t.slice(pos));
  return nos;
}

function parParaElemento(par, P) {
  const p = document.createElement('p');
  if (par.tipo === 'rotulo') {
    p.className = 'rotulo';
    p.title = 'Rótulo interno — não é incluído no parecer final';
    if (par.bloco) p.dataset.bloco = String(par.bloco);
  }
  if (par.grupo) p.dataset.grupo = par.grupo;
  if (par.opcao != null) p.dataset.opcao = String(par.opcao);
  if (par.se) p.dataset.se = par.se;
  if (par.opcional) { p.dataset.opcional = par.opcional; p.dataset.incluido = par.incluido ? '1' : '0'; }
  if (par.etiqueta) p.dataset.etiqueta = par.etiqueta;
  if (par.origem) p.dataset.origem = par.origem;
  appendRuns(p, par.runs, { P });
  if (!p.childNodes.length) p.append(document.createElement('br'));
  return p;
}

/** Parágrafo (só os atributos) a partir do elemento na tela. */
function parDoElemento(node) {
  const d = node.dataset || {};
  const par = { tipo: node.classList && node.classList.contains('rotulo') ? 'rotulo' : 'p' };
  if (d.grupo) par.grupo = d.grupo;
  if (d.opcao != null && d.opcao !== '') par.opcao = Number(d.opcao);
  if (d.se) par.se = d.se;
  if (d.opcional) { par.opcional = d.opcional; par.incluido = d.incluido === '1'; }
  if (d.etiqueta) par.etiqueta = d.etiqueta;
  if (d.bloco) par.bloco = Number(d.bloco);
  if (d.origem) par.origem = d.origem;
  return par;
}

function renderEditor() {
  const ed = $('#editor');
  ed.replaceChildren(...state.parecer.paragrafos.map((par) => parParaElemento(par, state.parecer)));
  if (!ed.childNodes.length) ed.append(parParaElemento({ tipo: 'p', runs: [] }, state.parecer));
  aplicarVisibilidade();
  state.lastRange = null;
}

const BLOCOS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE']);

/** Lê o conteúdo do editor e devolve a lista de parágrafos (fonte da verdade ao salvar). */
function lerEditor() {
  const ed = $('#editor');
  const pars = [];
  let solto = null; // texto/inline no nível raiz
  const fecharSolto = () => { if (solto) { solto.runs = mergeRuns(solto.runs); pars.push(solto); solto = null; } };
  for (const node of ed.childNodes) {
    if (node.nodeType === 1 && BLOCOS.has(node.tagName)) {
      fecharSolto();
      const par = parDoElemento(node);
      par.runs = [];
      coletarRuns(node, {}, par.runs);
      par.runs = mergeRuns(par.runs);
      pars.push(par);
    } else if (node.nodeType === 1 && node.tagName === 'BR') {
      fecharSolto();
    } else if (node.nodeType === 3 || node.nodeType === 1) {
      if (!solto) solto = { tipo: 'p', runs: [] };
      if (node.nodeType === 3) solto.runs.push(mkRun(node.textContent));
      else coletarRuns({ childNodes: [node] }, {}, solto.runs);
    }
  }
  fecharSolto();
  return pars;
}

function coletarRuns(node, f, out) {
  const filhos = Array.from(node.childNodes);
  filhos.forEach((ch, idx) => {
    if (ch.nodeType === 3) { if (ch.textContent) out.push(mkRun(ch.textContent.replace(/ /g, ' '), f)); return; }
    if (ch.nodeType !== 1) return;
    const tag = ch.tagName;
    if (tag === 'BR') { if (idx < filhos.length - 1) out.push(mkRun('\n', f)); return; }
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    if (ch.classList && ch.classList.contains('campo') && (ch.dataset.campo || ch.dataset.escolha)) { out.push(runDoChip(ch, f)); return; }
    const nf = { ...f };
    if (tag === 'B' || tag === 'STRONG') nf.b = true;
    if (tag === 'I' || tag === 'EM') nf.i = true;
    const st = ch.style || {};
    if (st.fontWeight === 'bold' || Number(st.fontWeight) >= 600) nf.b = true;
    if (st.fontWeight === 'normal' || st.fontWeight === '400') nf.b = false;
    if (st.fontStyle === 'italic') nf.i = true;
    if (ch.classList && ch.classList.contains('cond')) nf.c = true;
    if (ch.classList && ch.classList.contains('valid')) nf.v = true;
    if (BLOCOS.has(tag) && out.length) out.push(mkRun('\n', f));
    coletarRuns(ch, nf, out);
  });
}

/** Sincroniza o modelo de dados do parecer com o que está na tela. */
function sincronizar() {
  if (state.parecer) state.parecer.paragrafos = lerEditor();
}

/** Mostra/oculta opções, condicionais e opcionais conforme as escolhas do painel. */
function aplicarVisibilidade() {
  const P = state.parecer;
  for (const node of $('#editor').children) {
    const v = visibilidade(parDoElemento(node), P);
    node.classList.toggle('oculto', v === 'off');
    node.classList.toggle('opt-pend', v === 'pendente');
  }
}

/** Atualiza os chips na tela depois de mudar um campo ou uma alternativa (sem perder as edições livres). */
function atualizarCampos() {
  const P = state.parecer;
  if (!P) return;
  for (const s of $$('#editor .campo')) {
    const r = runDoChip(s);
    s.textContent = textoChip(r, P);
    s.classList.toggle('vazio', chipPendente(r, P));
  }
  aplicarVisibilidade();
  conferirPainel();
  atualizarPendencias();
  marcarAlterado();
}

function abrirParecer(p, { manterView = false } = {}) {
  if (!p) return;
  if (state.parecer && state.dirty) salvarParecer({ silencioso: true });
  autoSalvar.cancel();
  state.parecer = p;
  state.dirty = false;
  $('#editor-empty').hidden = true;
  $('#editor-wrap').hidden = false;
  $('#doc-title').value = p.titulo || '';
  state.pendUltima = null;
  state.pendIdx = 0;
  state.origemCursor = null;
  renderEditor();
  renderDados();
  renderMeta();
  $('#tr-tema').value = temaPorId(p.tema) ? p.tema : '';
  state.trLimite = 30;
  renderListaTrechos();
  $('#btn-restore').disabled = !p.modeloId;
  Store.ui('ultimo', p.id);
  setStatus(Store.obter(p.id) ? 'ok' : '', Store.obter(p.id) ? 'Salvo em ' + fmtData(p.atualizadoEm) : 'Novo parecer (ainda não salvo)');
  if (!manterView) setView('editor');
}

function novoParecerBase(extra) {
  const agora = agoraISO();
  return {
    id: uid(), modeloId: '', modeloTitulo: '', titulo: '', paragrafos: [],
    dados: {}, escolhas: {}, grupos: {}, seq: 0, status: '', tema: '',
    criadoEm: agora, atualizadoEm: agora, bibliotecaVersao: LIB.versao,
    ...extra,
  };
}

function usarModelo(id) {
  const m = LIB.porId.get(id);
  if (!m) return toast('Modelo não encontrado.', 'err');
  const anterior = state.parecer && Store.obter(state.parecer.id) ? state.parecer : null;
  const tema = m._temas.includes(state.temaInicio) ? state.temaInicio : m._temas[0] || '';
  const P = novoParecerBase({ modeloId: m.id, modeloTitulo: m.titulo, status: m.status || '', tema });
  P.paragrafos = modeloParaParagrafos(m, P);
  aplicarPadroes(P, P.paragrafos, m.padroes);
  abrirParecer(P);
  toast(anterior ? 'Modelo carregado. O parecer anterior foi salvo em Meus pareceres.' : 'Modelo carregado. Preencha os dados do caso no painel à esquerda.', 'ok', 4000);
  const primeiro = $('#dados-body input, #dados-body select, #dados-body .seg button');
  if (primeiro && !$('#dados-panel').classList.contains('recolhido')) primeiro.focus();
}

/**
 * Novo parecer sem modelo. "blocos": os blocos 1 a 7 da estrutura padrão
 * (GUIA.estrutura) entram como rótulos internos, que não saem no parecer.
 */
function novoParecer(modo) {
  const P = novoParecerBase({ modeloTitulo: modo === 'blocos' ? 'Parecer montado por blocos' : 'Parecer em branco', tema: state.temaInicio });
  if (modo === 'blocos') {
    const linhas = (typeof GUIA !== 'undefined' && Array.isArray(GUIA.estrutura) ? GUIA.estrutura : []).slice(1);
    for (const [num, bloco] of linhas) {
      if (!bloco || Number(num) === 0) continue;
      P.paragrafos.push({ tipo: 'rotulo', bloco: Number(num), runs: [mkRun(`${num} – ${bloco}`)] });
      P.paragrafos.push({ tipo: 'p', runs: [] });
    }
  }
  if (!P.paragrafos.length) P.paragrafos.push({ tipo: 'p', runs: [] });
  abrirParecer(P);
  if (modo === 'blocos') { recolherTrechos(false); $('#tr-seguir').checked = true; Store.ui('trSeguir', true); }
  // cursor no primeiro parágrafo editável
  const ed = $('#editor');
  const alvo = $$('p', ed).find((x) => !x.classList.contains('rotulo'));
  ed.focus();
  if (alvo) {
    const r = document.createRange();
    r.setStart(alvo, 0);
    r.collapse(true);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    state.lastRange = r.cloneRange();
  }
}

/** Fecha o parecer aberto (salvando antes) e volta para o Início. */
function fecharParecer({ salvar = true, irPara = 'inicio' } = {}) {
  if (state.parecer && salvar) salvarParecer({ silencioso: true });
  autoSalvar.cancel();
  state.parecer = null;
  state.dirty = false;
  $('#editor-wrap').hidden = true;
  $('#editor-empty').hidden = false;
  Store.ui('ultimo', null);
  atualizarPendencias();
  setStatus('', '');
  if (irPara) setView(irPara);
}

function renderMeta() {
  const p = state.parecer;
  const m = LIB.porId.get(p.modeloId);
  const origem = !p.modeloId ? (p.modeloTitulo || 'Parecer em branco') : `Modelo: ${p.modeloTitulo || '—'}${m ? '' : ' (não encontrado na biblioteca atual)'}`;
  $('#doc-meta').textContent = `${origem} · Criado em ${fmtData(p.criadoEm)}`;
}

/** Chamado a cada alteração do texto pelo analista. */
function aoEditar() {
  marcarAlterado();
  atualizarPendencias();
}

function marcarAlterado() {
  if (!state.parecer) return;
  state.dirty = true;
  setStatus('dirty', 'Alterações não salvas…');
  autoSalvar();
}

const autoSalvar = debounce(() => salvarParecer({ silencioso: true }), 1200);

function salvarParecer({ silencioso = false } = {}) {
  if (!state.parecer) return false;
  autoSalvar.cancel();
  sincronizar();
  state.parecer.titulo = $('#doc-title').value;
  state.parecer.atualizadoEm = agoraISO();
  const ok = Store.salvar(clone(state.parecer));
  if (ok) {
    state.dirty = false;
    setStatus('ok', 'Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    if (!silencioso) toast('Parecer salvo neste navegador. O modelo da biblioteca não foi alterado.', 'ok');
    if (state.view === 'pareceres') renderPareceres();
  }
  return ok;
}

/** Colagem sempre como texto puro (nada de HTML externo no editor). */
function aoColar(e) {
  e.preventDefault();
  const txt = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
  document.execCommand('insertText', false, txt.replace(/\r\n?/g, '\n'));
}

function closestBloco(node) {
  const ed = $('#editor');
  while (node && node.parentNode !== ed) { if (node === ed) return null; node = node.parentNode; }
  return node && node.nodeType === 1 ? node : null;
}

/** Insere um trecho na posição do cursor sem apagar nada do que já existe. */
function inserirTrecho(t) {
  if (!state.parecer) return toast('Abra um parecer para inserir trechos.', 'warn');
  const P = state.parecer;
  const ed = $('#editor');
  const pars = paragrafosDoTrecho(t, P);
  pars.forEach((x) => { if (x.tipo === 'p') x.origem = t.id; });
  aplicarPadroes(P, pars);
  const runs = pars[0].runs;
  const varios = pars.length > 1 || !!(pars[0].grupo || pars[0].se || pars[0].opcional || pars[0].tipo === 'rotulo');
  // novos parágrafos; "inserido" aponta para o primeiro e "ultimo" para o último
  let ultimo = null;
  const novos = () => { const els = pars.map((x) => parParaElemento(x, P)); ultimo = els[els.length - 1]; return els; };
  const range = state.lastRange && ed.contains(state.lastRange.startContainer) ? state.lastRange.cloneRange() : null;
  let inserido;
  if (!range) {
    const els = novos(); inserido = els[0];
    ed.append(...els);
    toast('Trecho inserido ao final do parecer (clique no texto antes para escolher a posição).', 'warn');
  } else {
    range.collapse(false);
    const bloco = closestBloco(range.startContainer);
    if (!bloco) { const els = novos(); inserido = els[0]; ed.append(...els); }
    else if (!bloco.textContent.trim() && !bloco.classList.contains('rotulo')) { const els = novos(); inserido = els[0]; bloco.replaceWith(...els); }
    else {
      const antes = document.createRange(); antes.selectNodeContents(bloco); antes.setEnd(range.startContainer, range.startOffset);
      const depois = document.createRange(); depois.selectNodeContents(bloco); depois.setStart(range.startContainer, range.startOffset);
      // trecho de vários parágrafos (ou cursor num rótulo): entra logo após o parágrafo atual
      if (!depois.toString().trim() || varios || bloco.classList.contains('rotulo')) { const els = novos(); inserido = els[0]; bloco.after(...els); }
      else if (!antes.toString().trim()) { const els = novos(); inserido = els[0]; bloco.before(...els); }
      else {
        const frag = document.createDocumentFragment();
        const a = antes.toString().slice(-1);
        const d = depois.toString().slice(0, 1);
        const rs = runs.map((r) => mkRun(r.t, r));
        if (a && !/\s/.test(a)) rs.unshift(mkRun(' '));
        if (d && !/[\s.,;:]/.test(d)) rs.push(mkRun(' '));
        appendRuns(frag, rs, { P });
        const fim = frag.lastChild;
        range.insertNode(frag);
        bloco.dataset.origem = t.id;
        inserido = bloco;
        if (fim) { const sel = getSelection(); const r2 = document.createRange(); r2.setStartAfter(fim); r2.collapse(true); sel.removeAllRanges(); sel.addRange(r2); state.lastRange = r2.cloneRange(); }
      }
    }
  }
  if (inserido && inserido !== ed) {
    inserido.classList.add('flash');
    setTimeout(() => inserido.classList.remove('flash'), 1300);
    inserido.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const fimEl = ultimo || inserido;
    if (fimEl.tagName === 'P' && !fimEl.contains(state.lastRange && state.lastRange.startContainer)) {
      // cursor no fim do que foi inserido: o próximo trecho entra depois dele e as sugestões avançam
      const r2 = document.createRange(); r2.selectNodeContents(fimEl); r2.collapse(false);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r2);
      state.lastRange = r2.cloneRange();
    }
  }
  aplicarVisibilidade();
  renderDados();
  aoEditar();
  atualizarSugestoes();
  toast('Trecho inserido: ' + t.titulo, 'ok', 2500);
}

/** Desfazer para operações automáticas (limpar, apagar…): guarda texto e dados. */
function snapshot() {
  sincronizar();
  const P = state.parecer;
  return JSON.stringify({ paragrafos: P.paragrafos, dados: P.dados, escolhas: P.escolhas, grupos: P.grupos, status: P.status });
}
function oferecerDesfazer(snap, msg) {
  const id = state.parecer.id;
  toast(msg, 'ok', 8000, {
    label: 'Desfazer',
    fn: () => {
      if (!state.parecer || state.parecer.id !== id) return;
      Object.assign(state.parecer, JSON.parse(snap));
      renderEditor();
      renderDados();
      aoEditar();
    },
  });
}

/** Garante ao menos um parágrafo editável. */
function garantirParagrafo() {
  const ed = $('#editor');
  if (!ed.firstElementChild) ed.replaceChildren(parParaElemento({ tipo: 'p', runs: [] }, state.parecer));
}

/**
 * Apaga o texto selecionado. Se a seleção atravessa parágrafos, remove os
 * parágrafos inteiros envolvidos; sem seleção, remove o parágrafo do cursor.
 */
function apagarSelecao() {
  if (!state.parecer) return;
  const ed = $('#editor');
  const sel = getSelection();
  const range = sel.rangeCount && ed.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel.getRangeAt(0) : state.lastRange;
  if (!range || !ed.contains(range.commonAncestorContainer)) return toast('Selecione no texto o trecho que deseja apagar.', 'warn');
  const snap = snapshot();
  const tocados = Array.from(ed.children).filter((c) => range.intersectsNode(c));
  let msg;
  if (range.collapsed) {
    const bloco = closestBloco(range.startContainer);
    if (!bloco) return;
    bloco.remove();
    msg = 'Parágrafo removido.';
  } else if (tocados.length > 1) {
    tocados.forEach((c) => c.remove());
    msg = `${tocados.length} parágrafos removidos.`;
  } else {
    range.deleteContents();
    msg = 'Trecho apagado.';
  }
  garantirParagrafo();
  state.lastRange = null;
  renderDados();
  aoEditar();
  oferecerDesfazer(snap, msg);
}

async function limparConteudo() {
  if (!state.parecer) return;
  const r = await abrirDialogo({
    titulo: 'Limpar conteúdo',
    narrow: true,
    corpo: [el('p', { text: 'Escolha o que limpar. Você poderá desfazer logo em seguida.' }),
      el('ul', {}, el('li', {}, el('strong', { text: 'Só o texto: ' }), 'esvazia o parecer e mantém os dados do caso preenchidos.'),
        el('li', {}, el('strong', { text: 'Texto e dados: ' }), 'esvazia o parecer e apaga também os dados do caso.'))],
    acoes: [{ label: 'Cancelar', value: 'nao' }, { label: 'Texto e dados', value: 'tudo', cls: 'btn-danger' }, { label: 'Só o texto', value: 'texto', cls: 'btn-primary' }],
  });
  if (r !== 'texto' && r !== 'tudo') return;
  const snap = snapshot();
  const P = state.parecer;
  P.paragrafos = [{ tipo: 'p', runs: [] }];
  P.grupos = {};
  P.escolhas = {};
  if (r === 'tudo') P.dados = {};
  renderEditor();
  renderDados();
  aoEditar();
  $('#editor').focus();
  oferecerDesfazer(snap, r === 'tudo' ? 'Texto e dados limpos.' : 'Texto limpo.');
}

/** Converte um chip em texto comum (edição livre daquele ponto). */
async function converterChip(span) {
  const ok = await confirmar('Converter em texto editável',
    `“${span.textContent}” deixará de acompanhar o painel “Dados do caso” e passará a ser texto comum, que você edita diretamente. Continuar?`, 'Converter');
  if (!ok || !span.isConnected) return;
  const snap = snapshot();
  span.replaceWith(...textoComMarcadores(span.textContent));
  renderDados();
  aoEditar();
  oferecerDesfazer(snap, 'Campo convertido em texto.');
}

/* ===================== 9. Painel "Dados do caso" ===================== */
/**
 * Campos (base) usados no texto que sai no parecer, nas alternativas e nos
 * condicionais. Opções não escolhidas não contam: seus campos saem do painel.
 */
function camposNoEditor() {
  const P = state.parecer;
  const s = new Set();
  if (!P) return s;
  for (const c of $$('#editor .campo')) if (!c.closest('.oculto')) camposDoChip(runDoChip(c), P).forEach((x) => s.add(x));
  // o campo que decide um condicional fica sempre, para poder mudar a decisão
  for (const p of $$('#editor [data-se]')) s.add(campoBase(p.dataset.se.split('=')[0]));
  return s;
}

const escolhasVisiveis = () => $$('#editor .campo[data-escolha]').filter((s) => !s.closest('.oculto')).map((s) => s.dataset.escolha);
const assinaturaPainel = () => [...camposNoEditor()].sort().join(',') + '|' + escolhasVisiveis().join(',');

/** Redesenha o painel mantendo a rolagem e o foco (ex.: depois de escolher uma opção). */
function redesenharDados() {
  const body = $('#dados-body');
  const topo = body.scrollTop;
  const ativo = document.activeElement && body.contains(document.activeElement) ? document.activeElement : null;
  const seletor = ativo ? (ativo.id ? '#' + ativo.id : ativo.name ? `input[name="${ativo.name}"][value="${ativo.value}"]` : '') : '';
  renderDados();
  body.scrollTop = topo;
  const alvo = seletor && $(seletor, body);
  if (alvo) alvo.focus({ preventScroll: true });
}

/** Quando uma escolha muda o que sai no parecer, o painel passa a mostrar só os campos que restaram. */
function conferirPainel() {
  if (state.parecer && assinaturaPainel() !== state.assinaturaPainel) redesenharDados();
}

function campoInput(c, P) {
  const v = P.dados[c.id] || '';
  let input;
  if (c.tipo === 'selecao') {
    input = el('select', {}, el('option', { value: '', text: '— selecione —' }),
      (c.opcoes || []).map((o) => (typeof o === 'object'
        ? el('option', { value: o.valor, text: o.valor === o.texto.replace(/[“”]/g, '') ? o.valor : o.texto })
        : el('option', { value: o, text: o }))));
    input.value = v;
  } else {
    input = el('input', { type: 'text', placeholder: c.tipo === 'data' ? 'dd/mm/aaaa' : c.ph, autocomplete: 'off', spellcheck: c.tipo ? 'false' : 'true' });
    if (c.tipo === 'numero') input.setAttribute('inputmode', 'decimal');
    if (c.tipo === 'lista') {
      const dl = el('datalist', { id: 'dl-' + c.id }, (c.opcoes || []).map((o) => el('option', { value: typeof o === 'object' ? o.valor : o })));
      input.setAttribute('list', dl.id);
      input._datalist = dl;
    }
    input.value = v;
  }
  const field = el('div', { class: 'field' + (v ? '' : ' vazio'), dataset: { campo: c.id } },
    el('label', {}, el('span', { text: c.rotulo }), c.dica ? el('small', { text: c.dica }) : null),
    input, input._datalist || null);
  input.id = 'f-' + c.id;
  field.querySelector('label').setAttribute('for', input.id);
  const aoMudar = () => {
    const val = input.value;
    if (val.trim()) P.dados[c.id] = val; else delete P.dados[c.id];
    field.classList.toggle('vazio', !val.trim());
    atualizarCampos();
  };
  input.addEventListener(c.tipo === 'selecao' ? 'change' : 'input', aoMudar);
  return field;
}

function seletorPessoa(P) {
  const atual = P.dados.tipoPessoa || '';
  const botao = (valor, texto, sub) => {
    const b = el('button', { type: 'button', class: atual === valor ? 'on' : '', 'aria-pressed': String(atual === valor) },
      el('strong', { text: texto }), el('small', { text: sub }));
    b.addEventListener('click', () => {
      P.dados.tipoPessoa = valor;
      $$('.seg button', $('#dados-body')).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      $('.seg', $('#dados-body')).classList.remove('vazio');
      atualizarCampos();
    });
    return b;
  };
  return el('div', { class: 'field', dataset: { campo: 'tipoPessoa' } },
    el('label', { text: 'O cliente é' }),
    el('div', { class: 'seg' + (atual ? '' : ' vazio'), role: 'group', 'aria-label': 'Tipo de pessoa' },
      botao('PF', 'Pessoa física', 'O produtor · CPF'),
      botao('PJ', 'Pessoa jurídica', 'A empresa · CNPJ')));
}

function renderDados() {
  const P = state.parecer;
  const body = $('#dados-body');
  body.replaceChildren();
  if (!P) return;
  const usados = camposNoEditor();
  const todos = Store.ui('todosCampos') === true;

  // status
  const selStatus = el('select', { id: 'f-status' }, el('option', { value: '', text: '— sem status —' }), STATUS_LISTA.map((s) => el('option', { value: s.id, text: s.nome })));
  selStatus.value = P.status || '';
  selStatus.addEventListener('change', () => { P.status = selStatus.value; marcarAlterado(); });
  body.append(el('fieldset', { class: 'fs' }, el('legend', { text: 'Parecer' }),
    el('div', { class: 'field', dataset: { campo: 'status' } }, el('label', { for: 'f-status', text: 'Status da análise' }), selStatus)));

  // escolhas do texto: vêm antes dos campos, porque decidem quais campos são necessários
  const opcoes = [];
  const gruposVistos = new Set();
  for (const node of $$('#editor [data-grupo]')) {
    const gid = node.dataset.grupo;
    if (gruposVistos.has(gid) || !P.grupos[gid]) continue;
    gruposVistos.add(gid);
    opcoes.push(blocoGrupo(gid, P));
  }
  for (const id of escolhasVisiveis()) {
    if (P.escolhas[id]) opcoes.push(blocoEscolha(id, P));
  }
  for (const node of $$('#editor [data-opcional]')) {
    const chk = el('input', { type: 'checkbox' });
    chk.checked = node.dataset.incluido === '1';
    chk.addEventListener('change', () => { node.dataset.incluido = chk.checked ? '1' : '0'; aplicarVisibilidade(); conferirPainel(); aoEditar(); });
    opcoes.push(el('label', { class: 'check opt-check' }, chk, ' Incluir: ', node.dataset.opcional));
  }
  for (const node of $$('#editor [data-se]')) {
    const [campo, valor] = node.dataset.se.split('=');
    opcoes.push(el('p', { class: 'hint cond-info', text: `“${node.dataset.etiqueta || 'Parágrafo condicional'}”: sai somente quando ${rotuloCampo(campo)} = ${valor}.` }));
  }
  if (opcoes.length) {
    body.append(el('fieldset', { class: 'fs fs-opcoes' }, el('legend', { text: 'Escolhas do texto' }),
      el('p', { class: 'hint', text: 'Decida primeiro: o que não for escolhido sai do parecer, e os campos dele somem daqui.' }), opcoes));
  }

  // campos agrupados
  if (usados.has('tipoPessoa') || todos) body.append(el('fieldset', { class: 'fs' }, el('legend', { text: 'Cliente' }), seletorPessoa(P),
    LISTA_CAMPOS.filter((c) => c.grupo === 'Cliente' && c.id !== 'tipoPessoa' && (todos || usados.has(c.id))).map((c) => campoInput(c, P))));
  for (const grupo of ORDEM_GRUPOS) {
    if (grupo === 'Cliente') continue;
    const campos = LISTA_CAMPOS.filter((c) => c.grupo === grupo && (todos || usados.has(c.id)));
    if (!campos.length) continue;
    body.append(el('fieldset', { class: 'fs' }, el('legend', { text: grupo }), campos.map((c) => campoInput(c, P))));
  }
  const alterna = el('button', { type: 'button', class: 'link', text: todos ? 'Mostrar só os campos deste parecer' : `Mostrar todos os campos (${LISTA_CAMPOS.length})` });
  alterna.addEventListener('click', () => { Store.ui('todosCampos', !todos); renderDados(); });
  body.append(el('p', { class: 'hint' }, alterna));

  state.assinaturaPainel = assinaturaPainel();
  atualizarPendencias();
}

function blocoGrupo(gid, P) {
  const g = P.grupos[gid];
  const nome = 'grp-' + gid;
  const itens = g.opcoes.map((rot, i) => {
    const inp = el('input', { type: g.multipla ? 'checkbox' : 'radio', name: nome, value: String(i) });
    inp.checked = g.escolhidas.includes(i);
    inp.addEventListener('change', () => {
      if (g.multipla) g.escolhidas = $$(`input[name="${nome}"]`).filter((x) => x.checked && x.value !== '').map((x) => Number(x.value));
      else g.escolhidas = [i];
      aplicarVisibilidade();
      conferirPainel();
      aoEditar();
    });
    return el('label', { class: 'check' }, inp, ' ', rot);
  });
  const todas = el('input', { type: g.multipla ? 'checkbox' : 'radio', name: nome, value: '' });
  todas.checked = !g.escolhidas.length;
  todas.addEventListener('change', () => {
    if (!todas.checked) return;
    g.escolhidas = [];
    $$(`input[name="${nome}"]`).forEach((x) => { if (x !== todas) x.checked = false; });
    aplicarVisibilidade();
    conferirPainel();
    aoEditar();
  });
  return el('div', { class: 'opt-group', dataset: { grupoForm: gid } },
    el('div', { class: 'opt-title', text: g.nome }),
    g.instrucao ? el('div', { class: 'hint', text: maiuscula(g.instrucao) }) : null,
    itens,
    el('label', { class: 'check muted' }, todas, ' Decidir depois (mostrar todas)'));
}

function blocoEscolha(id, P) {
  const e = P.escolhas[id];
  const sel = el('select', {}, el('option', { value: '', text: '— escolher —' }),
    e.opcoes.map((o, i) => { const t = resolverTexto(o, P, true); return el('option', { value: String(i), text: t.length > 90 ? t.slice(0, 88) + '…' : t, title: t }); }));
  sel.value = e.valor == null ? '' : String(e.valor);
  sel.addEventListener('change', () => { e.valor = sel.value === '' ? null : Number(sel.value); atualizarCampos(); });
  return el('div', { class: 'field escolha-item' + (e.valor == null ? ' vazio' : ''), dataset: { escolhaForm: id } },
    el('label', { text: e.contexto ? '…' + e.contexto : 'Alternativa' }), sel);
}

/** Destaca e foca um item do painel de dados (abre o painel e redesenha se preciso). */
function irParaPainel(seletor, noTexto) {
  recolherDados(false);
  const body = $('#dados-body');
  let alvo = $(seletor, body);
  if (!alvo) { renderDados(); alvo = $(seletor, body); }
  if (noTexto && noTexto.isConnected) {
    noTexto.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    noTexto.classList.add('flash');
    setTimeout(() => noTexto.classList.remove('flash'), 1300);
  }
  if (!alvo) return;
  alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
  alvo.classList.add('flash');
  setTimeout(() => alvo.classList.remove('flash'), 1300);
  const f = $('input:checked, input, select, button', alvo);
  if (f) f.focus({ preventScroll: true });
}

const irParaCampo = (id, noTexto) => irParaPainel(`.field[data-campo="${id}"]`, noTexto);

/** Leva o cursor ao campo do painel correspondente a um chip. */
function focarNoPainel(chip) {
  if (chip.dataset.escolha) irParaPainel(`[data-escolha-form="${chip.dataset.escolha}"]`);
  else irParaCampo(campoBase(chip.dataset.campo));
}

/** Marcadores [texto a redigir] de um parágrafo, com a posição de cada um no texto da tela. */
function marcadoresDe(node) {
  const partes = [];
  let texto = '';
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.parentElement.closest('.campo')) continue;
    partes.push([n, texto.length]);
    texto += n.data;
  }
  const ponto = (i, fim) => {
    for (const [n, ini] of partes) if (fim ? i > ini && i <= ini + n.data.length : i >= ini && i < ini + n.data.length) return [n, i - ini];
    return null;
  };
  const out = [];
  MARKER_RE.lastIndex = 0;
  let m;
  while ((m = MARKER_RE.exec(texto))) {
    const a = ponto(m.index, false);
    const b = ponto(m.index + m[0].length, true);
    if (a && b) out.push({ texto: m[0], a, b });
  }
  return out;
}

/** Seleciona no texto um marcador [..] (sem o destaque amarelo, para digitar por cima). */
function selecionarMarcador([na, oa], [nb, ob]) {
  if (!na.isConnected) return;
  const ph = na === nb && na.parentElement.closest('.ph');
  if (ph && ph.textContent === na.data) {
    const t = document.createTextNode(ph.textContent);
    ph.replaceWith(t);
    na = nb = t;
  }
  const r = document.createRange();
  r.setStart(na, oa);
  r.setEnd(nb, ob);
  const ed = $('#editor');
  ed.focus({ preventScroll: true });
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  state.lastRange = r.cloneRange();
  na.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/**
 * O que ainda falta decidir ou preencher, na ordem do parecer.
 * Cada item: { chave, texto, ir } — ir() leva ao ponto a resolver.
 */
function pendencias() {
  const P = state.parecer;
  if (!P) return [];
  const out = [];
  const add = (chave, texto, ir) => { if (!out.some((x) => x.chave === chave)) out.push({ chave, texto, ir }); };
  const campo = (id, noTexto) => { const b = campoBase(id); add('f:' + b, rotuloCampo(b), () => irParaCampo(b, noTexto)); };
  const vistos = {};
  for (const node of $('#editor').children) {
    const par = parDoElemento(node);
    if (par.tipo === 'rotulo') continue;
    const vis = visibilidade(par, P);
    if (vis === 'off') continue;
    const g = par.grupo && P.grupos[par.grupo];
    if (g && !g.escolhidas.length) add('g:' + par.grupo, `Escolha – ${g.nome} (nenhuma opção escolhida)`, () => irParaPainel(`[data-grupo-form="${par.grupo}"]`, node));
    if (par.se && vis === 'pendente') {
      const c = campoBase(par.se.split('=')[0]);
      add('f:' + c, `${rotuloCampo(c)} (define o parágrafo “${par.etiqueta || 'condicional'}”)`, () => irParaCampo(c, node));
    }
    for (const s of $$('.campo', node)) {
      const r = runDoChip(s);
      if (!chipPendente(r, P)) continue;
      if (r.campo) { campo(r.campo, s); continue; }
      const e = P.escolhas[r.escolha];
      if (!e) continue;
      if (e.valor == null) add('e:' + r.escolha, 'Alternativa: …' + (e.contexto || '').slice(-40), () => irParaPainel(`[data-escolha-form="${r.escolha}"]`, s));
      else tokenize(e.opcoes[e.valor]).filter((tk) => tk.tipo === 'campo' && !valorCampo(tk.campo, P)).forEach((tk) => campo(tk.campo, s));
    }
    for (const mk of marcadoresDe(node)) {
      vistos[mk.texto] = (vistos[mk.texto] || 0) + 1;
      const curto = mk.texto.length > 50 ? mk.texto.slice(0, 48) + '…]' : mk.texto;
      add('m:' + mk.texto + ':' + vistos[mk.texto], 'Texto a redigir: ' + curto, () => selecionarMarcador(mk.a, mk.b));
    }
  }
  return out;
}

const listarPendencias = () => pendencias().map((p) => p.texto);

/**
 * Vai para a próxima pendência. Se a última visitada foi resolvida, a
 * próxima é a que ocupou o lugar dela; se não, pula para a seguinte.
 */
function irParaProxima() {
  const lista = pendencias();
  if (!lista.length) { atualizarPendencias.flush(); return toast('Nada pendente. O parecer está pronto para copiar ou exportar.', 'ok'); }
  let i = lista.findIndex((p) => p.chave === state.pendUltima);
  i = i >= 0 ? (i + 1) % lista.length : Math.min(state.pendIdx, lista.length - 1);
  state.pendUltima = lista[i].chave;
  state.pendIdx = i;
  lista[i].ir();
}

const atualizarPendencias = debounce(() => {
  const chip = $('#dados-pend');
  const barra = $('#progresso');
  if (!state.parecer) { chip.hidden = true; barra.hidden = true; return; }
  const n = pendencias().length;
  chip.hidden = !n;
  chip.textContent = n + (n === 1 ? ' pendência' : ' pendências');
  barra.hidden = false;
  barra.classList.toggle('ok', !n);
  $('#progresso-txt').textContent = n
    ? `Falta${n === 1 ? '' : 'm'} ${n} ${n === 1 ? 'item' : 'itens'} para concluir (campos, escolhas e textos a redigir).`
    : 'Tudo preenchido. Revise o texto e use “Copiar parecer” ou “Exportar”.';
  $('#btn-prox').hidden = !n;
  $('#btn-pend-lista').hidden = !n;
}, 250);

async function mostrarPendencias() {
  const lista = pendencias();
  const itens = lista.map((p) => el('li', {}, el('button', { type: 'button', class: 'link', onclick: () => { $('#dialog').close(''); state.pendUltima = p.chave; p.ir(); } }, p.texto)));
  await abrirDialogo({
    titulo: lista.length ? `Pendências do parecer (${lista.length})` : 'Nenhuma pendência',
    narrow: true,
    corpo: [lista.length ? el('p', { class: 'hint', text: 'Clique num item para ir até ele.' }) : null,
      lista.length ? el('ul', { class: 'pend-mini' }, itens) : el('p', { text: 'Todos os campos e opções foram preenchidos.' })],
    acoes: [{ label: 'Fechar', value: 'fechar', cls: 'btn-primary' }],
  });
}

/** Avisa sobre pendências antes de copiar/exportar. Resolve true para seguir. */
async function confirmarPendencias(acao) {
  const lista = listarPendencias();
  if (!lista.length) return true;
  const mostrar = lista.slice(0, 12);
  const r = await abrirDialogo({
    titulo: `Há ${lista.length} pendência(s)`,
    narrow: true,
    corpo: [el('p', { text: `Os itens abaixo ainda não foram preenchidos ou decididos. Se continuar, eles saem entre colchetes no ${acao}.` }),
      el('ul', { class: 'pend-mini' }, mostrar.map((x) => el('li', { text: x })), lista.length > mostrar.length ? el('li', { text: `… e mais ${lista.length - mostrar.length}` }) : null)],
    acoes: [{ label: 'Voltar e preencher', value: 'voltar', cls: 'btn-primary' }, { label: 'Continuar mesmo assim', value: 'seguir' }],
  });
  return r === 'seguir';
}

/** Mostra ou esconde o painel de dados (preferência guardada no navegador). */
function recolherDados(recolher) {
  $('#dados-panel').classList.toggle('recolhido', recolher);
  $('#editor-wrap').classList.toggle('dados-recolhido', recolher);
  const b = $('#btn-dados-toggle');
  b.textContent = recolher ? '»' : '«';
  b.title = recolher ? 'Mostrar dados do caso' : 'Recolher painel de dados';
  b.setAttribute('aria-expanded', String(!recolher));
  $('#dados-body').hidden = recolher;
  Store.ui('dadosRecolhido', recolher);
}

/* ================ 10. Painel de trechos padronizados ================ */
/** O tema só esconde trechos típicos de OUTRO tema; os gerais e universais ficam. */
function trechoNoTema(t, tema) {
  if (!tema || !t._tema || t._universal || t._tema === 'Geral' || t._tema === '—') return true;
  return (tema.protocolos || []).includes(t._tema);
}

function filtrarTrechos(q, filtro, tema, contexto) {
  const base = LIB.trechos.filter((t) => {
    if (filtro === 'tf' && t.categoria !== 'Trechos fundamentados') return false;
    if (filtro && filtro !== 'tf' && !t._blocos.includes(Number(filtro))) return false;
    return trechoNoTema(t, tema);
  });
  return ranquear(base, q, { contexto, protocolos: tema ? tema.protocolos : null });
}

/**
 * Trecho de origem do parágrafo do cursor, ou do parágrafo anterior mais
 * próximo que tenha origem (o cursor costuma estar num parágrafo novo, vazio).
 * Sem cursor no texto, vale o fim do parecer (onde "Inserir" coloca o trecho).
 */
function origemNoCursor() {
  const ed = $('#editor');
  const r = state.lastRange && ed.contains(state.lastRange.startContainer) ? state.lastRange : null;
  for (let n = r ? closestBloco(r.startContainer) : ed.lastElementChild; n; n = n.previousElementSibling) {
    if (n.dataset.origem && !n.classList.contains('oculto')) return n.dataset.origem;
  }
  return null;
}

/** Trechos que costumam vir a seguir (ou começar o parecer do tema), sem os que já estão no texto. */
function sugestoesTrechos(contexto) {
  const noTexto = new Set($$('#editor p[data-origem]').filter((p) => !p.classList.contains('oculto')).map((p) => p.dataset.origem));
  return [...contexto]
    .filter(([id, p]) => p >= 0.05 && !noTexto.has(id))
    .sort((a, b) => b[1] - a[1])
    .map(([id, p]) => ({ t: LIB.trechos.find((x) => x.id === id), p }))
    .filter((x) => x.t)
    .slice(0, 4);
}

function itemTrecho(t, ts, { prob, inicio } = {}) {
  const tx = el('div', { class: 'tx' });
  const P = state.parecer ? { ...state.parecer, escolhas: {}, grupos: {}, seq: 0 } : novoContexto();
  paragrafosDoTrecho(t, P).filter((x) => x.tipo === 'p').forEach((x, i) => { if (i) tx.append(' ¶ '); appendRuns(tx, x.runs, { realce: ts, P }); });
  const ins = el('button', { type: 'button', class: 'btn btn-small btn-primary', text: 'Inserir' });
  // mousedown sem foco: preserva a posição do cursor no editor
  ins.addEventListener('mousedown', (e) => e.preventDefault());
  ins.addEventListener('click', () => inserirTrecho(t));
  const ver = el('button', { type: 'button', class: 'btn btn-small', text: 'Ver tudo' });
  ver.addEventListener('mousedown', (e) => e.preventDefault());
  ver.addEventListener('click', () => visualizarTrecho(t));
  const fonte = String(t.fonte || '').replace(/\s*\(\d+ usos?\)/, '');
  const info = [
    t._blocos.length ? 'Bloco ' + t._blocos.join(' e ') : '',
    fonte,
    t._usos ? `${t._usos} uso${t._usos === 1 ? '' : 's'}` : '',
    t._tema && t._tema !== 'Geral' && t._tema !== '—' ? t._tema : '',
  ].filter(Boolean).join(' · ');
  return el('li', { class: 'tr-item' + (t.categoria === 'Trechos fundamentados' ? ' tr-novo' : '') + (prob || inicio ? ' tr-sug' : '') },
    prob ? el('div', { class: 'tr-prob', text: `vem a seguir em ${Math.round(prob * 100)}% dos pareceres` }) : null,
    inicio ? el('div', { class: 'tr-prob', text: 'início frequente neste tema' }) : null,
    el('div', { class: 'tt' }, ...realcar(t.titulo, ts)),
    el('div', { class: 'src', text: info }),
    tx, el('div', { class: 'row' }, ins, ver));
}

/**
 * Lista do painel. Sem busca, mostra primeiro o que costuma vir depois do
 * parágrafo do cursor (caminhos do histórico) e depois os mais usados do
 * bloco/tema. Com busca, ordena por relevância × uso.
 */
function renderListaTrechos() {
  const ul = $('#tr-list');
  ul.replaceChildren();
  const q = $('#tr-search').value.trim();
  const ts = termosRealce(q);
  const filtro = $('#tr-bloco').value;
  const tema = temaPorId($('#tr-tema').value);
  const origem = state.parecer ? origemNoCursor() : null;
  state.origemCursor = origem;
  const contexto = state.parecer ? contextoDe(origem, tema && tema.id) : new Map();
  let itens = filtrarTrechos(q, filtro, tema, contexto);
  if (!q) {
    const sug = sugestoesTrechos(contexto);
    if (sug.length) {
      ul.append(el('li', { class: 'tr-cat tr-cat-sug', text: origem ? 'Sugeridos para o próximo parágrafo' : 'Para começar o parecer' }));
      sug.forEach(({ t, p }) => ul.append(itemTrecho(t, ts, origem ? { prob: p } : { inicio: true })));
      const ja = new Set(sug.map((x) => x.t.id));
      itens = itens.filter((t) => !ja.has(t.id));
    }
    ul.append(el('li', { class: 'tr-cat', text: 'Mais usados' + (filtro && filtro !== 'tf' ? ' no bloco ' + filtro : '') + (tema ? ' · ' + (tema.curto || tema.nome) : '') }));
  } else {
    ul.append(el('li', { class: 'tr-cat', text: `${itens.length} trecho(s) para “${q}”` }));
  }
  itens.slice(0, state.trLimite).forEach((t) => ul.append(itemTrecho(t, ts)));
  if (itens.length > state.trLimite) {
    const mais = el('button', { type: 'button', class: 'btn btn-small', text: `Mostrar mais (${itens.length - state.trLimite})` });
    mais.addEventListener('mousedown', (e) => e.preventDefault());
    mais.addEventListener('click', () => { state.trLimite += 30; renderListaTrechos(); });
    ul.append(el('li', { class: 'tr-mais' }, mais));
  }
  if (!itens.length) ul.append(el('li', { class: 'hint', text: 'Nenhum trecho encontrado.' + (tema || filtro ? ' Experimente “Todos os temas” ou “Todos os blocos”.' : '') }));
}

/** Atualiza as sugestões quando o cursor passa para um parágrafo de outra origem. */
function atualizarSugestoes() {
  if (!state.parecer || $('#tr-search').value.trim()) return;
  if (origemNoCursor() !== state.origemCursor) renderListaTrechos();
}

function renderTrechosPainel() {
  const sel = $('#tr-bloco');
  const linhas = (typeof GUIA !== 'undefined' && Array.isArray(GUIA.estrutura) ? GUIA.estrutura.slice(1) : []).filter((l) => Number(l[0]) > 0);
  sel.replaceChildren(el('option', { value: '', text: 'Todos os blocos' }),
    ...linhas.map((l) => el('option', { value: String(l[0]), text: `Bloco ${l[0]} – ${l[1]}` })),
    el('option', { value: 'tf', text: '★ Trechos fundamentados (novos)' }));
  const selTema = $('#tr-tema');
  selTema.replaceChildren(el('option', { value: '', text: 'Todos os temas' }), ...TEMAS_LIB.map((t) => el('option', { value: t.id, text: t.nome })));
  selTema.hidden = !TEMAS_LIB.length;
  const refazer = () => { state.trLimite = 30; renderListaTrechos(); };
  $('#tr-search').addEventListener('input', debounce(refazer, 120));
  sel.addEventListener('change', refazer);
  selTema.addEventListener('change', () => {
    if (state.parecer) { state.parecer.tema = selTema.value; marcarAlterado(); }
    refazer();
  });
  const seguir = $('#tr-seguir');
  seguir.checked = Store.ui('trSeguir') !== false;
  seguir.addEventListener('change', () => Store.ui('trSeguir', seguir.checked));
  renderListaTrechos();
}

/** Número do bloco (rótulo anterior) onde está o cursor, ou null. */
function blocoDoCursor() {
  const r = state.lastRange;
  if (!r) return null;
  let n = closestBloco(r.startContainer);
  while (n) {
    if (n.classList && n.classList.contains('rotulo') && n.dataset.bloco) return n.dataset.bloco;
    n = n.previousElementSibling;
  }
  return null;
}

/** Cursor mudou de lugar: o painel segue o bloco (se marcado) e atualiza as sugestões. */
const seguirBloco = debounce(() => {
  if (!state.parecer) return;
  const b = $('#tr-seguir').checked ? blocoDoCursor() : null;
  const alvo = b === '2' ? '1' : b;
  const sel = $('#tr-bloco');
  if (alvo && sel.value !== alvo) { sel.value = alvo; state.trLimite = 30; renderListaTrechos(); }
  else atualizarSugestoes();
}, 200);

/** Mostra ou esconde o painel de trechos (preferência guardada no navegador). */
function recolherTrechos(recolher) {
  $('#tr-panel').classList.toggle('recolhido', recolher);
  $('#editor-wrap').classList.toggle('tr-recolhido', recolher);
  const b = $('#btn-tr-toggle');
  b.textContent = recolher ? '«' : '»';
  b.title = recolher ? 'Mostrar trechos padronizados' : 'Recolher painel de trechos';
  b.setAttribute('aria-expanded', String(!recolher));
  $('#tr-body').hidden = recolher;
  Store.ui('trechosRecolhido', recolher);
}

async function visualizarTrecho(t) {
  const P = novoContexto();
  const doc = el('div', { class: 'doc-render' }, paragrafosDoTrecho(t, P).map((x) => parParaElemento(x, P)));
  const r = await abrirDialogo({
    titulo: t.titulo,
    corpo: [el('div', { class: 'meta' }, el('span', { class: 'chip', text: t._grupo }), ' Fonte: ' + (t.fonte || '—')), doc],
    acoes: [{ label: 'Fechar', value: 'fechar' }].concat(state.parecer ? [{ label: 'Inserir no parecer', value: 'inserir', cls: 'btn-primary' }] : []),
  });
  if (r === 'inserir') inserirTrecho(t);
}

/* ===== 11. Documento final: copiar, pré-visualizar, Word, PDF, .txt ===== */
/** Parágrafos que saem no parecer: chips resolvidos, sem rótulos nem opções descartadas. */
function paragrafosFinais() {
  sincronizar();
  const P = state.parecer;
  const out = [];
  for (const par of P.paragrafos) {
    if (par.tipo === 'rotulo' || visibilidade(par, P) === 'off') continue;
    const runs = mergeRuns(par.runs.map((r) => mkRun(ehChip(r) ? textoChip(r, P) : r.t, { b: r.b, i: r.i })));
    if (!runsText(runs).trim()) continue;
    out.push({ runs });
  }
  return out;
}

const TITULO_DOC = 'PARECER SOCIOAMBIENTAL';

function documentoFinal() {
  const P = state.parecer;
  return {
    titulo: TITULO_DOC,
    paragrafos: paragrafosFinais(),
    logo: typeof LOGO_PNG !== 'undefined' ? LOGO_PNG : null,
    rodape: 'Sustentabilidade – Parecer socioambiental · emitido em ' + new Date().toLocaleDateString('pt-BR'),
  };
}

function textoFinal() {
  const doc = documentoFinal();
  return doc.paragrafos.map((p) => runsText(p.runs).replace(/[ \t]+$/gm, '')).join('\n\n');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlFinal() {
  const doc = documentoFinal();
  const ps = doc.paragrafos.map((p) => '<p style="margin:0 0 10pt;text-align:justify">' + p.runs.map((r) => {
    let h = escHtml(r.t).replace(/\n/g, '<br>');
    if (r.i) h = '<i>' + h + '</i>';
    if (r.b) h = '<b>' + h + '</b>';
    return h;
  }).join('') + '</p>');
  return '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">' + ps.join('') + '</div>';
}

/** Documento final como página (pré-visualização e impressão/PDF). */
function renderDocumentoFinal(doc, { realcarPendencias = false } = {}) {
  const pagina = el('div', { class: 'doc-final' },
    el('div', { class: 'df-top' }, el('img', { src: 'assets/adm-logo.png', alt: 'ADM' }), el('span', { text: 'Sustentabilidade' })),
    el('h1', { text: doc.titulo }));
  for (const p of doc.paragrafos) {
    const e = el('p');
    appendRuns(e, p.runs, { semMarcadores: !realcarPendencias });
    pagina.append(e);
  }
  pagina.append(el('div', { class: 'df-rodape', text: doc.rodape }));
  return pagina;
}

async function copiarTexto(txt, msg, html) {
  try {
    if (html && navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([txt], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      })]);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(txt);
    } else throw new Error('sem API');
    toast(msg, 'ok');
  } catch (e) {
    const ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0' });
    ta.value = txt;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    toast(ok ? msg : 'Não foi possível copiar automaticamente. Selecione o texto e use Ctrl+C.', ok ? 'ok' : 'err');
  }
}

function nomeArquivo(ext) {
  const p = state.parecer;
  const base = p.titulo || valorCampo('nome', p) || p.modeloTitulo || 'parecer';
  return 'parecer-' + slug(base) + '-' + new Date().toISOString().slice(0, 10) + ext;
}

const NOMES_ACAO = { copiar: 'texto copiado', docx: 'arquivo Word', pdf: 'PDF', txt: 'arquivo .txt' };

/** Copiar ou exportar, com aviso de pendências (a menos que já confirmado). */
async function exportar(tipo, { confirmado = false } = {}) {
  if (!state.parecer) return;
  $$('.menu-list').forEach((m) => { m.hidden = true; });
  if (!confirmado && !(await confirmarPendencias(NOMES_ACAO[tipo]))) return;
  if (tipo === 'copiar') copiarTexto(textoFinal(), 'Parecer copiado para a área de transferência.', htmlFinal());
  else if (tipo === 'txt') {
    baixarArquivo(nomeArquivo('.txt'), '﻿' + textoFinal().replace(/\n/g, '\r\n') + '\r\n', 'text/plain;charset=utf-8');
    toast('Arquivo .txt gerado (texto simples, sem formatação).', 'ok');
  } else if (tipo === 'docx') {
    try {
      const bytes = Docx.gerar(documentoFinal());
      baixarArquivo(nomeArquivo('.docx'), bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      toast('Arquivo Word gerado.', 'ok');
    } catch (e) {
      console.error(e);
      toast('Não foi possível gerar o arquivo Word: ' + (e && e.message ? e.message : e), 'err', 8000);
    }
  } else if (tipo === 'pdf') imprimir();
}

function imprimir() {
  if (!state.parecer) return;
  $('#print-area').replaceChildren(renderDocumentoFinal(documentoFinal()));
  toast('Na janela de impressão, escolha “Salvar como PDF” como destino.', 'ok', 6000);
  setTimeout(() => window.print(), 80);
}

async function preVisualizar() {
  if (!state.parecer) return;
  const pend = listarPendencias();
  const r = await abrirDialogo({
    titulo: 'Pré-visualização do parecer',
    largo: true,
    corpo: [
      pend.length ? el('div', { class: 'box box-warn' }, el('h4', { text: `${pend.length} pendência(s) — destacadas em amarelo no texto` }),
        el('ul', {}, pend.slice(0, 8).map((x) => el('li', { text: x })), pend.length > 8 ? el('li', { text: `… e mais ${pend.length - 8}` }) : null)) : null,
      el('div', { class: 'preview-wrap' }, renderDocumentoFinal(documentoFinal(), { realcarPendencias: true })),
    ],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Copiar', value: 'copiar' }, { label: 'PDF', value: 'pdf' }, { label: 'Word (.docx)', value: 'docx', cls: 'btn-primary' }],
  });
  if (r && r !== 'fechar') exportar(r, { confirmado: true });
}

/** Gera o bloco de código para colar em modelos.js (a ferramenta NÃO grava na biblioteca). */
async function gerarCodigoModelo() {
  sincronizar();
  const p = state.parecer;
  const m = LIB.porId.get(p.modeloId);
  const J = (s) => JSON.stringify(s);
  const linhas = [];
  linhas.push('  {');
  linhas.push(`    id: ${J('novo-' + slug(p.titulo || p.modeloTitulo || 'modelo').slice(0, 30))},  // troque por um id único`);
  linhas.push(`    categoria: ${J(m ? m.categoria : (LIB.categorias[0] || {}).id || '')},`);
  linhas.push(`    status: ${J(p.status || '')},`);
  if (m && m.subcategoria) linhas.push(`    subcategoria: ${J(m.subcategoria)},`);
  linhas.push(`    titulo: ${J(p.titulo || (m ? m.titulo + ' (adaptado)' : 'Novo modelo'))},`);
  if (m && m.quandoUsar) linhas.push(`    quandoUsar: ${J(m.quandoUsar)},`);
  if (m && m.obs && m.obs.length) linhas.push(`    obs: [${m.obs.map(J).join(', ')}],`);
  linhas.push('    paragrafos: [');
  let grupoAtual = null;
  const fecharGrupo = () => { if (grupoAtual) { linhas.push('      ] },'); grupoAtual = null; } };
  for (const par of p.paragrafos) {
    const txt = runsToMarkup(par.runs, p);
    if (par.grupo !== grupoAtual) fecharGrupo();
    if (par.tipo === 'rotulo') { linhas.push(`      { rotulo: ${J(runsText(par.runs))}${par.bloco ? ', bloco: ' + par.bloco : ''} },`); continue; }
    if (!runsText(par.runs).trim() && !par.runs.some(ehChip)) continue;
    if (par.grupo && p.grupos[par.grupo]) {
      if (grupoAtual !== par.grupo) {
        const g = p.grupos[par.grupo];
        linhas.push(`      { grupo: ${J(g.nome)}, instrucao: ${J(g.instrucao)},${g.multipla ? ' multipla: true,' : ''} opcoes: [`);
        grupoAtual = par.grupo;
      }
      linhas.push(`        { rotulo: ${J(par.etiqueta || 'Opção')}, texto: ${J(txt)} },`);
      continue;
    }
    if (par.se) { linhas.push(`      { se: ${J(par.se)}, rotulo: ${J(par.etiqueta || '')}, texto: ${J(txt)} },`); continue; }
    if (par.opcional) { linhas.push(`      { opcional: ${J(par.opcional)}, texto: ${J(txt)}, incluido: ${par.incluido ? 'true' : 'false'} },`); continue; }
    linhas.push(`      ${J(txt)},`);
  }
  fecharGrupo();
  linhas.push('    ],');
  linhas.push('  },');
  const codigo = linhas.join('\n');
  const ta = el('textarea', { class: 'code-out', readonly: true });
  ta.value = codigo;
  const r = await abrirDialogo({
    titulo: 'Código do modelo para modelos.js',
    corpo: [
      el('p', { text: 'Para transformar este parecer em modelo da biblioteca, quem mantém a ferramenta deve colar o bloco abaixo dentro da lista MODELOS, no arquivo modelos.js, e ajustar id, título e categoria. A ferramenta não altera a biblioteca.' }),
      el('p', { class: 'hint', text: 'Os campos do painel saem como {{campo}} (sem os valores deste caso). Textos que foram digitados ou convertidos em texto saem como estão: revise nomes, CPF/CNPJ e CAR antes de usar como modelo.' }),
      ta,
    ],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Copiar código', value: 'copiar', cls: 'btn-primary' }],
  });
  if (r === 'copiar') copiarTexto(codigo, 'Código copiado.');
}

/* ================= 12. Meus pareceres e backup ===================== */
function renderPareceres() {
  const box = $('#par-list');
  box.replaceChildren();
  const ts = termos($('#par-search').value);
  const lista = Store.listar()
    .filter((p) => ts.every((t) => norm(p.titulo + ' ' + p.modeloTitulo + ' ' + Object.values(p.dados || {}).join(' ') + ' ' + p.paragrafos.map((x) => runsText(x.runs)).join(' ')).includes(t)))
    .sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
  if (!lista.length) {
    box.append(el('p', { class: 'empty', text: ts.length ? 'Nenhum parecer encontrado.' : 'Nenhum parecer salvo ainda. Escolha um modelo no Início para começar.' }));
    return;
  }
  const tb = el('tbody');
  for (const p of lista) {
    const aberto = state.parecer && state.parecer.id === p.id;
    const st = statusDe(p.status);
    tb.append(el('tr', {},
      el('td', {}, el('strong', { text: p.titulo || (p.dados && p.dados.nome) || '(sem identificação)' }), aberto ? el('span', { class: 'chip chip-word', text: 'aberto', style: 'margin-left:6px' }) : null),
      el('td', {}, st ? el('span', { class: 'badge badge-' + st.cor, text: st.nome }) : '—'),
      el('td', { text: p.modeloTitulo || '—' }),
      el('td', { text: fmtData(p.atualizadoEm) }),
      el('td', { class: 'actions' },
        el('button', { class: 'btn btn-small btn-primary', onclick: () => abrirParecer(limparParecer(clone(p))) }, 'Abrir'),
        el('button', { class: 'btn btn-small', onclick: () => duplicarParecer(p) }, 'Duplicar'),
        el('button', { class: 'btn btn-small btn-danger', onclick: () => excluirParecer(p) }, 'Excluir'))));
  }
  box.append(el('table', { class: 'table' },
    el('thead', {}, el('tr', {}, el('th', { text: 'Identificação do caso' }), el('th', { text: 'Status' }), el('th', { text: 'Modelo de origem' }), el('th', { text: 'Atualizado' }), el('th', { text: '' }))),
    tb));
}

function duplicarParecer(origem) {
  if (state.parecer && origem.id === state.parecer.id) salvarParecer({ silencioso: true });
  const base = limparParecer(clone(origem.id && state.parecer && origem.id === state.parecer.id ? state.parecer : origem));
  const agora = agoraISO();
  const novo = { ...base, id: uid(), titulo: (base.titulo || '') + ' (cópia)', criadoEm: agora, atualizadoEm: agora };
  if (!Store.salvar(novo)) return;
  abrirParecer(novo);
  toast('Cópia criada. Ajuste os dados do caso para o novo parecer.', 'ok');
}

async function excluirParecer(p) {
  const ok = await confirmar('Excluir parecer', `Excluir “${p.titulo || '(sem identificação)'}”? Esta ação não pode ser desfeita (a biblioteca de modelos não é afetada).`, 'Excluir', true);
  if (!ok) return;
  if (!Store.excluir(p.id)) return;
  if (state.parecer && state.parecer.id === p.id) fecharParecer({ salvar: false, irPara: null });
  renderPareceres();
  toast('Parecer excluído.', 'ok');
}

function exportarBackup() {
  if (state.parecer && state.dirty) salvarParecer({ silencioso: true });
  const dados = {
    formato: 'pareceres-socioambientais-backup',
    versao: 2,
    exportadoEm: agoraISO(),
    bibliotecaVersao: LIB.versao,
    pareceres: Store.listar(),
  };
  baixarArquivo('backup-pareceres-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(dados, null, 2), 'application/json');
  toast(`Backup exportado com ${dados.pareceres.length} parecer(es).`, 'ok');
}

async function importarBackup(arquivo) {
  let dados;
  try {
    dados = JSON.parse(await arquivo.text());
  } catch (e) {
    return toast('Arquivo inválido: não é um JSON legível.', 'err');
  }
  if (!dados || dados.formato !== 'pareceres-socioambientais-backup' || !Array.isArray(dados.pareceres)) {
    return toast('Este arquivo não é um backup desta ferramenta.', 'err');
  }
  const validos = dados.pareceres.filter(validarParecer).map(limparParecer);
  const invalidos = dados.pareceres.length - validos.length;
  const atuais = Store.listar();
  const idsAtuais = new Set(atuais.map((p) => p.id));
  const repetidos = validos.filter((p) => idsAtuais.has(p.id)).length;

  const r = await abrirDialogo({
    titulo: 'Importar backup',
    narrow: true,
    corpo: [
      el('p', { text: `O arquivo tem ${validos.length} parecer(es) válido(s)` + (invalidos ? ` e ${invalidos} inválido(s), que serão ignorados` : '') + `. Exportado em ${fmtData(dados.exportadoEm)}.` }),
      el('p', { text: `Neste navegador há ${atuais.length} parecer(es); ${repetidos} aparece(m) também no backup.` }),
      el('ul', {},
        el('li', {}, el('strong', { text: 'Mesclar: ' }), 'adiciona os novos; nos repetidos, fica a versão mais recente.'),
        el('li', {}, el('strong', { text: 'Substituir: ' }), 'apaga os pareceres deste navegador e usa só os do backup.')),
    ],
    acoes: [{ label: 'Cancelar', value: 'cancelar' }, { label: 'Substituir tudo', value: 'substituir', cls: 'btn-danger' }, { label: 'Mesclar', value: 'mesclar', cls: 'btn-primary' }],
  });
  if (r !== 'mesclar' && r !== 'substituir') return;
  if (state.parecer && state.dirty) salvarParecer({ silencioso: true });
  let final;
  if (r === 'substituir') {
    const ok = await confirmar('Confirmar substituição', `Os ${atuais.length} parecer(es) atuais deste navegador serão apagados e trocados pelos ${validos.length} do backup. Continuar?`, 'Substituir', true);
    if (!ok) return;
    final = validos;
  } else {
    const mapa = new Map(atuais.map((p) => [p.id, p]));
    for (const p of validos) {
      const a = mapa.get(p.id);
      if (!a || String(p.atualizadoEm) > String(a.atualizadoEm)) mapa.set(p.id, p);
    }
    final = [...mapa.values()];
  }
  if (!Store.gravarTodos(final)) return;
  if (state.parecer) {
    const atualizado = final.find((p) => p.id === state.parecer.id);
    if (atualizado) abrirParecer(limparParecer(clone(atualizado)), { manterView: true });
    else fecharParecer({ salvar: false, irPara: null });
  }
  renderPareceres();
  toast(`Backup importado (${r === 'mesclar' ? 'mesclado' : 'substituído'}). Total: ${final.length} parecer(es).`, 'ok');
}

/* =============================== 13. Guia ============================ */
function tabela(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const [cab, ...corpo] = rows;
  return el('table', { class: 'table' },
    el('thead', {}, el('tr', {}, cab.map((c) => el('th', { text: c })))),
    el('tbody', {}, corpo.map((r) => (r.length === 1
      ? el('tr', { class: 'tr-sec' }, el('td', { colspan: String(cab.length), text: r[0] }))
      : el('tr', {}, r.map((c) => el('td', { text: c })))))));
}

function renderGuia() {
  const g = $('#guia');
  g.replaceChildren();
  const G = typeof GUIA !== 'undefined' ? GUIA : {};
  const pend = typeof PENDENCIAS_WORD !== 'undefined' ? PENDENCIAS_WORD : [];
  g.append(el('h2', { text: 'Guia de uso' }));

  if (LIB.problemas.length) {
    g.append(el('div', { class: 'box box-warn' }, el('h4', { text: 'Problemas encontrados em modelos.js' }), el('ul', {}, LIB.problemas.map((p) => el('li', { text: p })))));
  }

  g.append(el('h3', { text: 'Como usar a ferramenta' }), el('ol', {},
    el('li', { text: 'No Início, escolha o tema do chamado (Embargo, CAR, Prospecção…) ou pesquise pela situação. A busca entende sinônimos (ex.: “pvg” acha Protocolo Verde; “suspenso” acha cancelado e Resolução BCB) e mostra primeiro os modelos mais usados no histórico. Na dúvida, comece pelos “Mais usados”. 👁︎ mostra o texto sem abrir.' }),
    el('li', { text: 'Nenhum modelo serve? Use “Montar por blocos” (estrutura padrão, com os trechos de cada bloco no painel à direita) ou “Em branco”.' }),
    el('li', { text: 'No Editor, siga a faixa acima do texto: ela diz quantos itens faltam, e “Ir para o próximo” leva a cada um, na ordem do parecer (campo no painel à esquerda, escolha de opção ou [texto a redigir], que já fica selecionado para você digitar por cima).' }),
    el('li', { text: 'No painel “Dados do caso”, decida primeiro as “Escolhas do texto”: o que não for escolhido sai do parecer, e os campos dele somem do painel. Depois preencha os campos; cada um é aplicado em todo o texto. O tipo de pessoa troca sozinho “O produtor”/“A empresa”, “CPF”/“CNPJ” etc.' }),
    el('li', { text: 'Edite o texto livremente. Clique num campo destacado para ir ao painel; duplo clique converte o campo em texto comum. Use “Apagar seleção”, o × à esquerda (remove o parágrafo) e “Limpar” — tudo pode ser desfeito.' }),
    el('li', { text: 'O painel “Trechos padronizados” (à direita) sugere o que costuma vir depois do parágrafo onde está o cursor (caminhos do histórico) e lista os mais usados do bloco e do tema. “Inserir” coloca o trecho na posição do cursor.' }),
    el('li', { text: 'Quando a faixa ficar verde, pré-visualize, copie ou exporte (Word, PDF ou .txt). No PDF, escolha “Salvar como PDF” na janela de impressão.' })));

  const hist = typeof BIBLIOTECA_HISTORICO_VERSAO !== 'undefined';
  g.append(el('div', { class: 'box' }, el('h4', { text: 'Onde ficam os dados' }),
    el('p', { text: 'Os modelos vêm dos arquivos modelos.js (textos do Word) e biblioteca-historico.js (situações e trechos frequentes no histórico de pareceres, com as correções de ajustes-historico.js) — somente leitura na tela. Os pareceres em elaboração ficam salvos automaticamente apenas neste navegador, neste computador; não há sincronização entre analistas ou máquinas. Faça backups em “Meus pareceres”.' }),
    el('p', { text: 'Versão da biblioteca: ' + (LIB.versao || '—') + (hist ? ' · histórico: ' + BIBLIOTECA_HISTORICO_VERSAO : ' · histórico não carregado') + ' · ' + LIB.modelos.length + ' modelos · ' + LIB.trechos.length + ' trechos · ' + LISTA_CAMPOS.length + ' campos.' })));

  g.append(el('div', { class: 'box' }, el('h4', { text: 'Atalhos de teclado' }), el('ul', {},
    el('li', { text: '/ — pesquisar modelos no Início (Enter abre o primeiro resultado; Esc limpa)' }),
    el('li', { text: 'Alt+1 a Alt+4 — Início, Editor, Meus pareceres, Guia' }),
    el('li', { text: 'Ctrl+Enter — ir para o próximo item pendente do parecer' }),
    el('li', { text: 'Ctrl+S — salvar parecer · Ctrl+P — PDF/impressão' }),
    el('li', { text: 'Ctrl+B / Ctrl+I — negrito / itálico · Ctrl+Z / Ctrl+Y — desfazer / refazer' }))));

  if (G.orientacoes) {
    const ol = el('ol');
    for (const o of G.orientacoes) { const li = el('li'); appendRuns(li, parseMarkup(o, novoContexto())); ol.append(li); }
    g.append(el('h3', { text: '1. Orientações de preenchimento' }), ol);
  }
  if (G.estrutura) g.append(el('h3', { text: '2. Estrutura padrão do parecer' }), el('p', { text: G.estruturaIntro || '' }), tabela(G.estrutura));
  if (G.guiaRapido) g.append(el('h3', { text: '2.1 Guia rápido – qual modelo usar' }), tabela(G.guiaRapido));
  if (pend.length) {
    g.append(el('h3', { text: 'Pendências para validação humana' }),
      el('p', { class: 'hint', text: 'Pontos encontrados na importação dos textos do Word (mantidos como recebidos) e na revisão dos modelos do histórico (os ajustes já aplicados estão descritos). Decisões da área responsável: textos do Word em modelos.js; modelos do histórico em ajustes-historico.js.' }),
      el('ul', { class: 'pend-list' }, pend.map((p) => el('li', {},
        el('div', { text: p.descricao }),
        p.modelos && p.modelos.length ? el('div', { class: 'mods' }, 'Modelos: ', ...p.modelos.flatMap((id, i) => {
          const m = LIB.porId.get(id);
          const b = el('button', { class: 'link', text: m ? partesTitulo(m.titulo)[0] || m.titulo.slice(0, 40) : id, title: m ? m.titulo : '' });
          b.addEventListener('click', () => visualizarModelo(id));
          return i ? [', ', b] : [b];
        })) : null))));
  }
}

/* ========== 14. Interface: abas, diálogos, avisos, atalhos ========== */
const VIEWS = ['inicio', 'editor', 'pareceres', 'guia'];

function setView(v) {
  state.view = v;
  $$('.view').forEach((s) => s.classList.toggle('active', s.dataset.view === v));
  $$('.tab').forEach((t) => { const on = t.dataset.view === v; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
  if (v === 'pareceres') renderPareceres();
  if (v === 'inicio' || (v === 'editor' && !state.parecer)) renderRecentes();
  Store.ui('view', v);
}

function setStatus(tipo, texto) {
  const s = $('#save-status');
  s.className = 'save-status' + (tipo ? ' ' + tipo : '');
  s.textContent = texto || '';
}

function toast(msg, tipo = '', ms = 3500, acao = null) {
  const t = el('div', { class: 'toast ' + tipo, role: 'status' }, el('span', { text: msg }));
  if (acao) {
    const b = el('button', { class: 'link', style: 'color:#c5e870;margin-left:10px', text: acao.label });
    b.addEventListener('click', () => { acao.fn(); t.remove(); });
    t.append(b);
  }
  $('#toasts').append(t);
  setTimeout(() => t.remove(), ms);
}

/** Diálogo modal nativo. Resolve com o "value" do botão clicado (ou null). */
function abrirDialogo({ titulo, corpo, acoes, narrow = false, largo = false }) {
  return new Promise((resolve) => {
    const d = $('#dialog');
    if (d.open) d.close('');
    d.classList.toggle('narrow', narrow);
    d.classList.toggle('largo', largo);
    $('#dialog-title').textContent = titulo;
    $('#dialog-body').replaceChildren(...corpo.filter(Boolean));
    const act = $('#dialog-actions');
    act.replaceChildren();
    for (const a of acoes) {
      const b = el('button', { type: 'button', class: 'btn ' + (a.cls || ''), text: a.label });
      b.addEventListener('click', () => d.close(a.value));
      act.append(b);
    }
    d.returnValue = '';
    d.addEventListener('close', () => {
      const v = d.returnValue;
      resolve(v && v !== 'cancel' ? v : null);
    }, { once: true });
    d.showModal();
    const principal = act.querySelector('.btn-primary') || act.lastChild;
    if (principal) principal.focus();
  });
}

async function confirmar(titulo, msg, rotulo = 'Confirmar', perigo = false) {
  const r = await abrirDialogo({
    titulo, narrow: true, corpo: [el('p', { text: msg })],
    acoes: [{ label: 'Cancelar', value: 'nao' }, { label: rotulo, value: 'sim', cls: perigo ? 'btn-danger' : 'btn-primary' }],
  });
  return r === 'sim';
}

/** Menus suspensos (Exportar, Mais): abre/fecha pelo botão. */
function ligarMenu(botao, lista) {
  botao.addEventListener('click', () => {
    const abrir = lista.hidden;
    $$('.menu-list').forEach((m) => { m.hidden = true; });
    lista.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
  });
}

/** Botão × para remover o parágrafo sob o mouse. */
function ligarRemoverParagrafo() {
  const ed = $('#editor');
  const page = $('#page');
  const btn = $('#par-del');
  let alvo = null;
  ed.addEventListener('mousemove', (e) => {
    const b = closestBloco(e.target);
    if (!b || b === alvo) return;
    alvo = b;
    btn.style.top = (b.offsetTop + Math.min(b.offsetHeight / 2, 14) - 11) + 'px';
    btn.hidden = false;
  });
  page.addEventListener('mouseleave', () => { btn.hidden = true; alvo = null; });
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', () => {
    if (!alvo || !alvo.isConnected) return;
    const snap = snapshot();
    alvo.remove();
    alvo = null;
    btn.hidden = true;
    garantirParagrafo();
    renderDados();
    aoEditar();
    oferecerDesfazer(snap, 'Parágrafo removido.');
  });
}

function ligarEventos() {
  // abas
  $$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) setView(go.dataset.goto);
    // fecha menus suspensos ao clicar fora deles
    $$('.menu').forEach((m) => {
      if (m.contains(e.target)) return;
      const lista = $('.menu-list', m);
      if (lista) lista.hidden = true;
      const btn = $('button[aria-haspopup]', m);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    const novo = e.target.closest('[data-novo]');
    if (novo) novoParecer(novo.dataset.novo);
    const exp = e.target.closest('[data-exp]');
    if (exp) exportar(exp.dataset.exp);
  });

  // início
  const buscar = debounce(() => renderInicio(), 120);
  $('#home-search').addEventListener('input', (e) => { state.buscaInicio = e.target.value; buscar(); });
  $('#home-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      buscar.flush();
      const primeiro = state.buscaInicio.trim() && ranquear(modelosDoTema(), state.buscaInicio)[0];
      if (primeiro) usarModelo(primeiro.id);
    } else if (e.key === 'Escape') {
      e.target.value = '';
      state.buscaInicio = '';
      renderInicio();
    }
  });

  // painéis laterais
  $('#btn-dados-toggle').addEventListener('click', () => recolherDados(!$('#dados-panel').classList.contains('recolhido')));
  $('#dados-label').addEventListener('click', () => { if ($('#dados-panel').classList.contains('recolhido')) recolherDados(false); });
  $('#dados-pend').addEventListener('click', mostrarPendencias);
  $('#btn-tr-toggle').addEventListener('click', () => recolherTrechos(!$('#tr-panel').classList.contains('recolhido')));
  $('#tr-panel-label').addEventListener('click', () => recolherTrechos(false));

  // editor
  const ed = $('#editor');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) { /* opcional */ }
  ed.addEventListener('input', (e) => {
    if (e.inputType === 'insertParagraph') {
      // parágrafo novo e vazio não herda opção, condição, rótulo…
      const sel = getSelection();
      const bloco = sel.rangeCount ? closestBloco(sel.anchorNode) : null;
      if (bloco && !bloco.textContent.trim()) {
        for (const a of ['grupo', 'opcao', 'se', 'opcional', 'incluido', 'etiqueta', 'bloco', 'origem']) delete bloco.dataset[a];
        bloco.classList.remove('rotulo', 'flash', 'oculto', 'opt-pend');
        bloco.removeAttribute('title');
      }
    }
    garantirParagrafo();
    aoEditar();
  });
  ed.addEventListener('paste', aoColar);
  ed.addEventListener('drop', (e) => {
    e.preventDefault();
    const txt = e.dataTransfer.getData('text/plain');
    if (!txt) return;
    const pos = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
    if (pos) { const s = getSelection(); s.removeAllRanges(); s.addRange(pos); }
    document.execCommand('insertText', false, txt);
  });
  ed.addEventListener('click', (e) => {
    const chip = e.target.closest('.campo');
    if (chip && e.detail === 1) focarNoPainel(chip);
    // clique num [texto a redigir]: seleciona o marcador inteiro para digitar por cima
    const ph = !chip && e.detail === 1 && getSelection().isCollapsed && e.target.closest('.ph');
    if (ph && ph.firstChild) selecionarMarcador([ph.firstChild, 0], [ph.firstChild, ph.firstChild.data.length]);
  });
  ed.addEventListener('dblclick', (e) => {
    const chip = e.target.closest('.campo');
    if (chip) { e.preventDefault(); converterChip(chip); }
  });
  document.addEventListener('selectionchange', () => {
    const s = getSelection();
    if (s.rangeCount && ed.contains(s.anchorNode)) { state.lastRange = s.getRangeAt(0).cloneRange(); seguirBloco(); }
  });
  ligarRemoverParagrafo();
  $$('[data-cmd]').forEach((b) => {
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { ed.focus(); document.execCommand(b.dataset.cmd); aoEditar(); });
  });
  $('#btn-del-sel').addEventListener('mousedown', (e) => e.preventDefault());
  $('#btn-del-sel').addEventListener('click', apagarSelecao);
  $('#btn-clear').addEventListener('click', limparConteudo);
  $('#doc-title').addEventListener('input', () => { if (state.parecer) { state.parecer.titulo = $('#doc-title').value; marcarAlterado(); } });
  $('#btn-copy').addEventListener('click', () => exportar('copiar'));
  $('#btn-preview').addEventListener('click', preVisualizar);
  $('#btn-prox').addEventListener('mousedown', (e) => e.preventDefault());
  $('#btn-prox').addEventListener('click', irParaProxima);
  $('#btn-pend-lista').addEventListener('click', mostrarPendencias);
  ligarMenu($('#btn-export'), $('#menu-export'));
  ligarMenu($('#btn-more'), $('#menu-more'));
  $('#btn-save').addEventListener('click', () => { $('#menu-more').hidden = true; salvarParecer(); });
  $('#btn-duplicate').addEventListener('click', () => { $('#menu-more').hidden = true; duplicarParecer(state.parecer); });
  $('#btn-close').addEventListener('click', () => { $('#menu-more').hidden = true; fecharParecer(); toast('Parecer salvo e fechado.', 'ok'); });
  $('#btn-restore').addEventListener('click', async () => {
    $('#menu-more').hidden = true;
    const m = LIB.porId.get(state.parecer.modeloId);
    if (!m) return toast('O modelo de origem não está na biblioteca atual.', 'err');
    const ok = await confirmar('Restaurar texto do modelo', 'O texto atual deste parecer será trocado pelo texto-base do modelo. Os dados do caso preenchidos são mantidos. Continuar?', 'Restaurar');
    if (!ok) return;
    const snap = snapshot();
    const P = state.parecer;
    P.escolhas = {};
    P.grupos = {};
    P.paragrafos = modeloParaParagrafos(m, P);
    renderEditor();
    renderDados();
    aoEditar();
    oferecerDesfazer(snap, 'Texto do modelo restaurado.');
  });
  $('#btn-code').addEventListener('click', () => { $('#menu-more').hidden = true; gerarCodigoModelo(); });

  // primeiros passos (Início)
  $('#home-passos').hidden = Store.ui('passosOk') === true;
  $('#btn-passos-ok').addEventListener('click', () => { Store.ui('passosOk', true); $('#home-passos').hidden = true; });

  // meus pareceres
  $('#par-search').addEventListener('input', debounce(renderPareceres, 150));
  $('#btn-backup').addEventListener('click', exportarBackup);
  $('#btn-restore-backup').addEventListener('click', () => $('#file-backup').click());
  $('#file-backup').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) importarBackup(f);
  });

  // atalhos
  document.addEventListener('keydown', (e) => {
    const emCampo = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if (e.key === '/' && !emCampo && !$('#dialog').open) {
      e.preventDefault();
      setView('inicio');
      $('#home-search').focus();
      return;
    }
    if (e.altKey && !e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      setView(VIEWS[Number(e.key) - 1]);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.parecer) { e.preventDefault(); salvarParecer(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.parecer && state.view === 'editor' && !$('#dialog').open) { e.preventDefault(); irParaProxima(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && state.parecer && state.view === 'editor') { e.preventDefault(); exportar('pdf'); }
  });

  // não perder trabalho ao fechar
  window.addEventListener('beforeunload', () => { if (state.parecer && state.dirty) salvarParecer({ silencioso: true }); });
  window.addEventListener('storage', (e) => { if (e.key === Store.KEY && state.view === 'pareceres') renderPareceres(); });
}

function init() {
  Store.testar();
  carregarBiblioteca();
  ligarEventos();
  renderInicio();
  renderTrechosPainel();
  recolherTrechos(Store.ui('trechosRecolhido') === true);
  recolherDados(Store.ui('dadosRecolhido') === true);
  renderGuia();
  if (!Store.disponivel) {
    toast('O armazenamento do navegador está bloqueado: os pareceres não serão salvos. Exporte o parecer para guardar o trabalho.', 'err', 12000);
  }
  const ultimo = Store.ui('ultimo');
  const p = ultimo ? Store.obter(ultimo) : null;
  if (p) abrirParecer(limparParecer(p), { manterView: true });
  const v = Store.ui('view');
  setView(VIEWS.includes(v) && (v !== 'editor' || p) ? v : 'inicio');
  if (LIB.problemas.length) toast(`Atenção: ${LIB.problemas.length} problema(s) em modelos.js (ver Guia).`, 'warn', 8000);
}

document.addEventListener('DOMContentLoaded', init);
