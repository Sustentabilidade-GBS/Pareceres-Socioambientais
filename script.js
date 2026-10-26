/* =====================================================================
   Pareceres Socioambientais — lógica da aplicação (JavaScript puro)

   Organização:
     1. Utilidades
     2. Marcação (texto do modelos.js  <->  "runs" com formatação)
     3. Armazenamento (localStorage: somente os pareceres do analista)
     4. Biblioteca (carregar, validar, pesquisar, menu lateral)
     5. Visualização de modelo
     6. Editor (renderizar, ler, colar, inserir trechos)
     7. Copiar / .txt / impressão / código do modelo
     8. Meus pareceres e backup
     9. Guia
    10. Interface (abas, diálogos, avisos, atalhos) e inicialização

   A biblioteca (MODELOS, TRECHOS, CATEGORIAS…) vem de modelos.js e é
   SOMENTE LEITURA aqui: nenhuma função grava nela.
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
   Um parágrafo é { tipo: 'p' | 'rotulo', grupo?: 'g1', runs: [...] }.
   Cada run é { t: texto, b?: negrito, i?: itálico, c?: condicional, v?: validação }.
   No modelos.js: **negrito**, ==condicional==, !!validação!!            */
const MARCAS = { '**': 'b', '==': 'c', '!!': 'v' };
const FLAGS = ['b', 'i', 'c', 'v'];

function mkRun(t, f = {}) {
  const r = { t };
  for (const k of FLAGS) if (f[k]) r[k] = true;
  return r;
}
const mesmoFormato = (a, b) => FLAGS.every((k) => !!a[k] === !!b[k]);

function mergeRuns(runs) {
  const out = [];
  for (const r of runs) {
    if (!r.t) continue;
    const last = out[out.length - 1];
    if (last && mesmoFormato(last, r)) last.t += r.t;
    else out.push(mkRun(r.t, r));
  }
  return out;
}

function parseMarkup(s) {
  const runs = [];
  const st = { b: false, c: false, v: false };
  let buf = '';
  const push = () => { if (buf) { runs.push(mkRun(buf, st)); buf = ''; } };
  for (let i = 0; i < s.length;) {
    const two = s.substr(i, 2);
    if (own(MARCAS, two)) { push(); st[MARCAS[two]] = !st[MARCAS[two]]; i += 2; continue; }
    buf += s[i]; i++;
  }
  push();
  return runs;
}

/** Converte runs de volta para a marcação do modelos.js (itálico não existe lá). */
function runsToMarkup(runs) {
  let out = '';
  const st = { b: false, c: false, v: false };
  for (const r of runs) {
    for (const [m, k] of [['!!', 'v'], ['==', 'c'], ['**', 'b']]) {
      if (!!r[k] !== st[k]) { out += m; st[k] = !!r[k]; }
    }
    out += r.t;
  }
  for (const [m, k] of [['**', 'b'], ['==', 'c'], ['!!', 'v']]) if (st[k]) out += m;
  return out;
}

const runsText = (runs) => runs.map((r) => r.t).join('');
const stripMarkup = (s) => s.replace(/\*\*|==|!!/g, '');

/** Converte um modelo da biblioteca em parágrafos editáveis (cópia; o modelo não muda). */
function modeloParaParagrafos(modelo) {
  const pars = [];
  let g = 0;
  for (const item of modelo.paragrafos || []) {
    if (typeof item === 'string') pars.push({ tipo: 'p', runs: parseMarkup(item) });
    else if (item && Array.isArray(item.opcoes)) {
      g++;
      for (const op of item.opcoes) pars.push({ tipo: 'p', grupo: 'g' + g, runs: parseMarkup(String(op)) });
    } else if (item && item.rotulo != null) pars.push({ tipo: 'rotulo', runs: [mkRun(String(item.rotulo))] });
  }
  return pars;
}

/* ================ 3. Armazenamento (localStorage) ====================
   Guarda SOMENTE os pareceres em elaboração do analista. A biblioteca
   vem de modelos.js. Para um backend futuro, troque a implementação
   destes métodos mantendo a mesma interface.                          */
const Store = {
  KEY: 'psa.pareceres.v1',
  UI: 'psa.ui.v1',
  disponivel: true,
  _avisado: false,

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
    if (!this.disponivel) { this._erro('O armazenamento do navegador está indisponível. Use “Baixar .txt” ou o backup para não perder o trabalho.'); return false; }
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

/** Reconstrói um parecer só com campos conhecidos (evita dados estranhos vindos de arquivos). */
function limparParecer(p) {
  const str = (v) => (typeof v === 'string' ? v : '');
  return {
    id: p.id,
    modeloId: str(p.modeloId),
    modeloTitulo: str(p.modeloTitulo),
    titulo: str(p.titulo),
    paragrafos: p.paragrafos.map((par) => {
      const o = { tipo: par.tipo === 'rotulo' ? 'rotulo' : 'p', runs: mergeRuns(par.runs.map((r) => mkRun(r.t, r))) };
      if (typeof par.grupo === 'string' && par.grupo) o.grupo = par.grupo;
      return o;
    }),
    criadoEm: str(p.criadoEm) || agoraISO(),
    atualizadoEm: str(p.atualizadoEm) || agoraISO(),
    bibliotecaVersao: str(p.bibliotecaVersao),
  };
}

/* ======================= 4. Biblioteca ============================== */
const LIB = { modelos: [], porId: new Map(), categorias: [], trechos: [], problemas: [], versao: '' };

const MARKER_RE = /\[\[([^\[\]]+)\]\]|\[([^\[\]]+)\]/g;

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
    if (!Array.isArray(m.paragrafos)) { LIB.problemas.push('Modelo "' + m.id + '" sem lista "paragrafos".'); continue; }
    const cat = LIB.categorias.find((c) => c.id === m.categoria);
    const corpo = textoDoModelo(m);
    m._cat = cat ? cat.nome : (m.categoria || 'Sem categoria');
    m._corpo = corpo;
    m._busca = norm([m.titulo, m._cat, m.subcategoria, m.quandoUsar, (m.obs || []).join(' '), corpo].join(' \n '));
    m._pend = (typeof PENDENCIAS_WORD !== 'undefined' ? PENDENCIAS_WORD : []).filter((p) => (p.modelos || []).includes(m.id));
    LIB.modelos.push(m);
    LIB.porId.set(m.id, m);
  }

  const tIds = new Set();
  for (const t of Array.isArray(trechos) ? trechos : []) {
    if (!t || !t.id || tIds.has(t.id) || (typeof t.texto !== 'string' && !Array.isArray(t.paragrafos))) { LIB.problemas.push('Trecho inválido ou repetido: ' + (t && t.id)); continue; }
    tIds.add(t.id);
    t._busca = norm([t.titulo, t.categoria, t.fonte, textoDoTrecho(t)].join(' '));
    LIB.trechos.push(t);
  }
  LIB.problemas.forEach((p) => console.warn('[modelos.js]', p));
}

function textoDoModelo(m) {
  return (m.paragrafos || []).map((it) => {
    if (typeof it === 'string') return stripMarkup(it);
    if (it && Array.isArray(it.opcoes)) return it.opcoes.map((o) => stripMarkup(String(o))).join('\n');
    if (it && it.rotulo) return String(it.rotulo);
    return '';
  }).join('\n');
}

/** Parágrafos de um trecho: "texto" (um parágrafo) ou "paragrafos" (vários, como nos modelos). */
function paragrafosDoTrecho(t) {
  return Array.isArray(t.paragrafos) ? modeloParaParagrafos(t) : [{ tipo: 'p', runs: parseMarkup(t.texto) }];
}
function textoDoTrecho(t) {
  return Array.isArray(t.paragrafos) ? textoDoModelo(t) : stripMarkup(t.texto);
}
/** Texto que entra no parecer (sem rótulos internos), para copiar. */
function textoFinalDoTrecho(t) {
  return paragrafosDoTrecho(t).filter((p) => p.tipo === 'p').map((p) => runsText(p.runs)).join('\n\n');
}

/** Retorna os termos de busca normalizados. */
const termos = (q) => norm(q).split(/\s+/).filter(Boolean);

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

function filtrarTrechos(q, cat) {
  const ts = termos(q);
  return LIB.trechos.filter((t) => (!cat || t.categoria === cat) && ts.every((x) => t._busca.includes(x)));
}

/* ---- Menu lateral: categorias suspensas com os modelos ---- */

function menuAbertos() {
  const v = Store.ui('menuAberto');
  return new Set(Array.isArray(v) ? v : []);
}

function alternarBloco(id) {
  const abertos = menuAbertos();
  if (abertos.has(id)) abertos.delete(id); else abertos.add(id);
  Store.ui('menuAberto', [...abertos]);
  renderMenu();
}

/** Monta um bloco suspenso (acordeão). Durante a busca, abre os blocos com resultado. */
function blocoMenu(id, nome, total, achados, conteudo, buscando, abertos) {
  if (buscando && !achados) return null;
  const aberto = buscando || abertos.has(id);
  const head = el('button', { type: 'button', class: 'acc-head', 'aria-expanded': String(aberto) },
    el('span', { class: 'acc-arrow', 'aria-hidden': 'true', text: aberto ? '▾' : '▸' }),
    el('span', { class: 'acc-name', text: nome }),
    el('span', { class: 'count', text: buscando ? `${achados}/${total}` : String(total) }));
  if (!buscando) head.addEventListener('click', () => alternarBloco(id));
  const body = el('div', { class: 'acc-body' }, conteudo);
  body.hidden = !aberto;
  return el('section', { class: 'acc' + (aberto ? ' open' : '') }, head, body);
}

function itemModelo(m, ts, ativo) {
  const titulo = el('button', { type: 'button', class: 'acc-title', title: m.quandoUsar ? 'Quando usar: ' + m.quandoUsar : m.titulo }, ...realcar(m.titulo, ts));
  titulo.addEventListener('click', () => abrirModeloDoMenu(m.id));
  const ver = el('button', { type: 'button', class: 'acc-eye', title: 'Visualizar sem abrir', 'aria-label': 'Visualizar ' + m.titulo, text: '👁︎' });
  ver.addEventListener('click', () => visualizarModelo(m.id));
  let trecho = null;
  if (ts.length && !ts.every((t) => norm(m.titulo).includes(t))) {
    const sn = trechoEncontrado(m._corpo, ts);
    if (sn) trecho = el('div', { class: 'acc-snip' }, ...realcar(sn, ts));
  }
  return el('div', { class: 'acc-item' + (m.id === ativo ? ' active' : '') }, el('div', { class: 'acc-row' }, titulo, ver), trecho);
}

function renderMenu() {
  const nav = $('#menu-modelos');
  nav.replaceChildren();
  if (!LIB.modelos.length) {
    nav.append(el('p', { class: 'hint', text: 'A biblioteca não foi carregada. Verifique se o arquivo modelos.js está na mesma pasta do index.html.' }));
    return;
  }
  const ts = termos(state.busca);
  const buscando = ts.length > 0;
  const abertos = menuAbertos();
  const ativo = state.parecer ? state.parecer.modeloId : '';
  let nModelos = 0;

  for (const c of LIB.categorias) {
    const todos = LIB.modelos.filter((m) => m.categoria === c.id);
    const vis = todos.filter((m) => ts.every((t) => m._busca.includes(t)));
    nModelos += vis.length;
    const nos = [];
    let sub = null;
    for (const m of vis) {
      const s2 = m.subcategoria || '';
      if (s2 !== sub) {
        if (s2) nos.push(el('div', { class: 'acc-sub', text: s2 }));
        else if (nos.length) nos.push(el('div', { class: 'acc-sub', text: 'Demais casos' }));
        sub = s2;
      }
      nos.push(itemModelo(m, ts, ativo));
    }
    const b = blocoMenu(c.id, c.nome, todos.length, vis.length, nos, buscando, abertos);
    if (b) nav.append(b);
  }

  $('#menu-resumo').textContent = buscando
    ? (nModelos ? `${nModelos} parecer(es) para “${state.busca.trim()}”` : `Nenhum parecer encontrado para “${state.busca.trim()}”.`)
    : '';
}

function abrirModeloDoMenu(id) {
  fecharGaveta();
  usarModelo(id);
}

/* ---- Painel direito: trechos reutilizáveis (só com parecer aberto) ---- */
function renderTrechosPainel() {
  const sel = $('#tr-cat');
  const cats = [...new Set(LIB.trechos.map((t) => t.categoria))];
  sel.replaceChildren(el('option', { value: '', text: 'Todas as categorias' }), ...cats.map((c) => el('option', { value: c, text: c })));
  const lista = () => {
    const ul = $('#tr-list');
    ul.replaceChildren();
    const q = $('#tr-search').value;
    const ts = termos(q);
    const itens = filtrarTrechos(q, sel.value);
    let cat = null;
    for (const t of itens) {
      if (t.categoria !== cat && !sel.value) { ul.append(el('li', { class: 'tr-cat', text: t.categoria })); cat = t.categoria; }
      const tx = el('div', { class: 'tx' });
      paragrafosDoTrecho(t).filter((x) => x.tipo === 'p').forEach((x, i) => { if (i) tx.append(' ¶ '); appendRuns(tx, x.runs, { realce: ts }); });
      const ins = el('button', { type: 'button', class: 'btn btn-small btn-primary', text: 'Inserir' });
      // mousedown sem foco: preserva a posição do cursor no editor
      ins.addEventListener('mousedown', (e) => e.preventDefault());
      ins.addEventListener('click', () => inserirTrecho(t));
      const ver = el('button', { type: 'button', class: 'btn btn-small', text: 'Ver tudo' });
      ver.addEventListener('mousedown', (e) => e.preventDefault());
      ver.addEventListener('click', () => visualizarTrecho(t));
      ul.append(el('li', { class: 'tr-item' },
        el('div', { class: 'tt' }, ...realcar(t.titulo, ts)),
        el('div', { class: 'src', text: 'Fonte: ' + (t.fonte || '—') }),
        tx, el('div', { class: 'row' }, ins, ver)));
    }
    if (!itens.length) ul.append(el('li', { class: 'hint', text: 'Nenhum trecho encontrado.' }));
  };
  $('#tr-search').addEventListener('input', debounce(lista, 120));
  sel.addEventListener('change', lista);
  lista();
}

/** Mostra ou esconde o painel de trechos (preferência guardada no navegador). */
function recolherTrechos(recolher) {
  const painel = $('#tr-panel');
  painel.classList.toggle('recolhido', recolher);
  $('#editor-wrap').classList.toggle('tr-recolhido', recolher);
  const b = $('#btn-tr-toggle');
  b.textContent = recolher ? '«' : '»';
  b.title = recolher ? 'Mostrar trechos reutilizáveis' : 'Recolher painel de trechos';
  b.setAttribute('aria-expanded', String(!recolher));
  $('#tr-body').hidden = recolher;
  Store.ui('trechosRecolhido', recolher);
}

async function visualizarTrecho(t) {
  const doc = el('div', { class: 'doc-render' }, paragrafosDoTrecho(t).map(parParaElemento));
  const r = await abrirDialogo({
    titulo: t.titulo,
    corpo: [el('div', { class: 'meta' }, el('span', { class: 'chip', text: t.categoria }), ' Fonte: ' + (t.fonte || '—')), doc],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Copiar', value: 'copiar' }].concat(state.parecer ? [{ label: 'Inserir no parecer', value: 'inserir', cls: 'btn-primary' }] : []),
  });
  if (r === 'copiar') copiarTexto(textoFinalDoTrecho(t), 'Trecho copiado.');
  if (r === 'inserir') inserirTrecho(t);
}

/** Recolhe ou mostra o menu lateral de pareceres padrão (preferência guardada no navegador). */
function recolherMenu(recolher) {
  $('#sidebar').classList.toggle('recolhido', recolher);
  $('#view-editor').classList.toggle('side-recolhido', recolher);
  const b = $('#btn-side-toggle');
  b.textContent = recolher ? '»' : '«';
  b.title = recolher ? 'Mostrar menu de pareceres' : 'Recolher menu de pareceres';
  b.setAttribute('aria-expanded', String(!recolher));
  Store.ui('menuRecolhido', recolher);
}

/* gaveta do menu em telas pequenas */
function abrirGaveta() {
  document.body.classList.add('side-open');
  $('#sidebar-backdrop').hidden = false;
  $('#btn-sidebar').setAttribute('aria-expanded', 'true');
}
function fecharGaveta() {
  document.body.classList.remove('side-open');
  $('#sidebar-backdrop').hidden = true;
  $('#btn-sidebar').setAttribute('aria-expanded', 'false');
}

/* =================== 5. Visualização de modelo ===================== */
function renderModeloDoc(m) {
  const doc = el('div', { class: 'doc-render' });
  for (const it of m.paragrafos || []) {
    if (typeof it === 'string') {
      const p = el('p');
      appendRuns(p, parseMarkup(it));
      doc.append(p);
    } else if (it && Array.isArray(it.opcoes)) {
      const box = el('div', { class: 'opt-box' }, el('div', { class: 'opt-label', text: 'Opções — manter a(s) aplicável(is)' }));
      for (const o of it.opcoes) { const p = el('p', { class: 'opt-par' }); appendRuns(p, parseMarkup(String(o))); box.append(p); }
      doc.append(box);
    } else if (it && it.rotulo) {
      doc.append(el('p', { class: 'rotulo', text: it.rotulo }));
    }
  }
  return doc;
}

function blocoOrientacoes(m) {
  const nos = [];
  if (m.quandoUsar) nos.push(el('div', { class: 'box box-use' }, el('h4', { text: m.categoria === 'base' ? 'Como usar' : 'Quando usar' }), el('p', { text: m.quandoUsar })));
  for (const o of m.obs || []) nos.push(el('div', { class: 'box box-obs' }, el('h4', { text: 'Obs.' }), el('p', { text: o })));
  if (m._pend && m._pend.length) {
    nos.push(el('div', { class: 'box box-warn' }, el('h4', { text: 'Pendências do Word (validação humana)' }),
      el('ul', {}, m._pend.map((p) => el('li', { text: p.descricao })))));
  }
  return nos;
}

async function visualizarModelo(id) {
  const m = LIB.porId.get(id);
  if (!m) return;
  const r = await abrirDialogo({
    titulo: m.titulo,
    corpo: [
      el('div', { class: 'meta' }, el('span', { class: 'chip', text: m._cat }), ' ', m.subcategoria ? el('span', { class: 'chip', text: m.subcategoria }) : null),
      ...blocoOrientacoes(m),
      el('p', { class: 'hint', text: 'Orientações acima são internas e não entram no parecer. Abaixo, o texto-base do modelo:' }),
      renderModeloDoc(m),
    ],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Usar este modelo', value: 'usar', cls: 'btn-primary' }],
  });
  if (r === 'usar') usarModelo(id);
}

/* ============================ 6. Editor ============================= */
const state = {
  view: 'editor',
  busca: '',
  parecer: null,
  dirty: false,
  lastRange: null,
};

/** Insere runs em um contêiner como nós seguros (marcadores [..] realçados). */
function appendRuns(container, runs, opts = {}) {
  for (const r of runs) {
    let nos = textoComMarcadores(r.t, opts);
    const envolver = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...nos); nos = [e]; };
    if (r.v) envolver('span', 'valid');
    if (r.c) envolver('span', 'cond');
    if (r.i) envolver('i');
    if (r.b) envolver('b');
    container.append(...nos);
  }
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

function parParaElemento(par) {
  const p = document.createElement('p');
  if (par.tipo === 'rotulo') { p.className = 'rotulo'; p.title = 'Rótulo interno do modelo — não é incluído no parecer final'; }
  if (par.grupo) p.dataset.grupo = par.grupo;
  appendRuns(p, par.runs);
  if (!p.childNodes.length) p.append(document.createElement('br'));
  return p;
}

function renderEditor() {
  const ed = $('#editor');
  ed.replaceChildren(...state.parecer.paragrafos.map(parParaElemento));
  if (!ed.childNodes.length) ed.append(parParaElemento({ tipo: 'p', runs: [] }));
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
      const par = { tipo: node.classList.contains('rotulo') ? 'rotulo' : 'p', runs: [] };
      if (node.dataset && node.dataset.grupo) par.grupo = node.dataset.grupo;
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
    if (ch.nodeType === 3) { if (ch.textContent) out.push(mkRun(ch.textContent.replace(/ /g, ' '), f)); return; }
    if (ch.nodeType !== 1) return;
    const tag = ch.tagName;
    if (tag === 'BR') { if (idx < filhos.length - 1) out.push(mkRun('\n', f)); return; }
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
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

function abrirParecer(p, { manterView = false } = {}) {
  if (!p) return;
  if (state.parecer && state.dirty) salvarParecer({ silencioso: true });
  autoSalvar.cancel();
  state.parecer = p;
  state.dirty = false;
  $('#editor-empty').hidden = true;
  $('#editor-wrap').hidden = false;
  $('#doc-title').value = p.titulo || '';
  renderEditor();
  renderMeta();
  $('#btn-restore').disabled = !p.modeloId;
  Store.ui('ultimo', p.id);
  renderMenu();
  setStatus(Store.obter(p.id) ? 'ok' : '', Store.obter(p.id) ? 'Salvo em ' + fmtData(p.atualizadoEm) : 'Novo parecer (ainda não salvo)');
  if (!manterView) setView('editor');
}

function usarModelo(id) {
  const m = LIB.porId.get(id);
  if (!m) return toast('Modelo não encontrado.', 'err');
  const agora = agoraISO();
  const anterior = state.parecer && Store.obter(state.parecer.id) ? state.parecer : null;
  abrirParecer({
    id: uid(),
    modeloId: m.id,
    modeloTitulo: m.titulo,
    titulo: '',
    paragrafos: modeloParaParagrafos(m),
    criadoEm: agora,
    atualizadoEm: agora,
    bibliotecaVersao: LIB.versao,
  });
  toast(anterior ? 'Modelo carregado. O parecer anterior foi salvo em Meus pareceres.' : 'Modelo carregado. O texto-base da biblioteca não é alterado.', 'ok', 4000);
  $('#editor').focus();
}

/**
 * Novo parecer sem modelo. Com estrutura: os blocos da seção 2 do Word
 * (GUIA.estrutura) entram como rótulos internos, que não saem no parecer.
 */
function novoParecerEmBranco(comEstrutura) {
  const agora = agoraISO();
  const paragrafos = [];
  if (comEstrutura) {
    const linhas = (typeof GUIA !== 'undefined' && Array.isArray(GUIA.estrutura) ? GUIA.estrutura : []).slice(1);
    for (const [num, bloco] of linhas) {
      if (!bloco) continue;
      paragrafos.push({ tipo: 'rotulo', runs: [mkRun(`${num} – ${bloco}`)] });
      paragrafos.push({ tipo: 'p', runs: [] });
    }
  }
  if (!paragrafos.length) paragrafos.push({ tipo: 'p', runs: [] });
  abrirParecer({
    id: uid(),
    modeloId: '',
    modeloTitulo: comEstrutura ? 'Parecer em branco – estrutura padrão' : 'Parecer em branco',
    titulo: '',
    paragrafos,
    criadoEm: agora,
    atualizadoEm: agora,
    bibliotecaVersao: LIB.versao,
  });
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

/** Fecha o parecer aberto (salvando antes) e volta para "Começar um parecer". */
function fecharParecer({ salvar = true } = {}) {
  if (state.parecer && salvar) salvarParecer({ silencioso: true });
  autoSalvar.cancel();
  state.parecer = null;
  state.dirty = false;
  $('#editor-wrap').hidden = true;
  $('#editor-empty').hidden = false;
  Store.ui('ultimo', null);
  setStatus('', '');
  renderEditorVazio();
  renderMenu();
}

/** Tela "Começar um parecer": lista os pareceres salvos mais recentes. */
function renderEditorVazio() {
  const box = $('#start-recent');
  box.replaceChildren();
  const recentes = Store.listar()
    .sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)))
    .slice(0, 5);
  if (!recentes.length) return;
  box.append(
    el('h3', { text: 'Continuar um parecer salvo' }),
    el('table', { class: 'table' }, el('tbody', {}, recentes.map((p) => el('tr', {},
      el('td', {}, el('strong', { text: p.titulo || '(sem identificação)' })),
      el('td', { text: p.modeloTitulo || '—' }),
      el('td', { text: fmtData(p.atualizadoEm) }),
      el('td', { class: 'actions' }, el('button', { class: 'btn btn-small btn-primary', onclick: () => abrirParecer(clone(p)) }, 'Abrir')))))),
    el('p', {}, el('button', { class: 'link', 'data-goto': 'pareceres', text: 'Ver todos os pareceres' })),
  );
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
  const ed = $('#editor');
  const pars = paragrafosDoTrecho(t);
  const runs = pars[0].runs;
  const varios = pars.length > 1;
  // novos parágrafos; "inserido" aponta para o primeiro e "ultimo" para o último
  let ultimo = null;
  const novos = () => { const els = pars.map(parParaElemento); ultimo = els[els.length - 1]; return els; };
  let range = state.lastRange && ed.contains(state.lastRange.startContainer) ? state.lastRange.cloneRange() : null;
  let inserido;
  if (!range) {
    const els = novos(); inserido = els[0];
    ed.append(...els);
    toast('Trecho inserido ao final do parecer (clique no texto antes para escolher a posição).', 'warn');
  } else {
    range.collapse(false);
    const bloco = closestBloco(range.startContainer);
    if (!bloco) { const els = novos(); inserido = els[0]; ed.append(...els); }
    else if (!bloco.textContent.trim()) { const els = novos(); inserido = els[0]; bloco.replaceWith(...els); }
    else {
      const antes = document.createRange(); antes.selectNodeContents(bloco); antes.setEnd(range.startContainer, range.startOffset);
      const depois = document.createRange(); depois.selectNodeContents(bloco); depois.setStart(range.startContainer, range.startOffset);
      // trecho de vários parágrafos no meio de uma frase: entra logo após o parágrafo atual
      if (!depois.toString().trim() || varios) { const els = novos(); inserido = els[0]; bloco.after(...els); }
      else if (!antes.toString().trim()) { const els = novos(); inserido = els[0]; bloco.before(...els); }
      else {
        const frag = document.createDocumentFragment();
        const a = antes.toString().slice(-1);
        const d = depois.toString().slice(0, 1);
        const rs = runs.map((r) => mkRun(r.t, r));
        if (a && !/\s/.test(a)) rs.unshift(mkRun(' '));
        if (d && !/[\s.,;:]/.test(d)) rs.push(mkRun(' '));
        appendRuns(frag, rs);
        const fim = frag.lastChild;
        range.insertNode(frag);
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
      const r2 = document.createRange(); r2.selectNodeContents(fimEl); r2.collapse(false); state.lastRange = r2;
    }
  }
  aoEditar();
  toast('Trecho inserido: ' + t.titulo, 'ok', 2500);
}

/** Desfazer simples para operações automáticas (preencher, remover opções…). */
function snapshot() { return JSON.stringify(state.parecer.paragrafos); }
function oferecerDesfazer(snap, msg) {
  const id = state.parecer.id;
  toast(msg, 'ok', 7000, {
    label: 'Desfazer',
    fn: () => {
      if (!state.parecer || state.parecer.id !== id) return;
      state.parecer.paragrafos = JSON.parse(snap);
      renderEditor();
      marcarAlterado();
    },
  });
}

/* ========= 7. Copiar / .txt / impressão / código do modelo ========== */
function paragrafosFinais() {
  sincronizar();
  const out = [];
  for (const par of state.parecer.paragrafos) {
    if (par.tipo === 'rotulo') continue;
    const vazio = !runsText(par.runs).trim();
    if (vazio && (!out.length || out[out.length - 1].vazio)) continue;
    out.push({ runs: par.runs, vazio });
  }
  while (out.length && out[out.length - 1].vazio) out.pop();
  return out.filter((x) => !x.vazio);
}

function textoFinal() {
  return paragrafosFinais().map((p) => runsText(p.runs).replace(/[ \t]+$/gm, '')).join('\n\n');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlFinal() {
  const ps = paragrafosFinais().map((p) => '<p style="margin:0 0 10pt;text-align:justify">' + p.runs.map((r) => {
    let h = escHtml(r.t).replace(/\n/g, '<br>');
    if (r.i) h = '<i>' + h + '</i>';
    if (r.b) h = '<b>' + h + '</b>';
    return h;
  }).join('') + '</p>');
  return '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">' + ps.join('') + '</div>';
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
  const base = p.titulo || p.modeloTitulo || 'parecer';
  return 'parecer-' + slug(base) + '-' + new Date().toISOString().slice(0, 10) + ext;
}

function copiarParecer() {
  if (!state.parecer) return;
  copiarTexto(textoFinal(), 'Parecer copiado para a área de transferência.', htmlFinal());
}

function baixarTxt() {
  if (!state.parecer) return;
  baixarArquivo(nomeArquivo('.txt'), '﻿' + textoFinal().replace(/\n/g, '\r\n') + '\r\n', 'text/plain;charset=utf-8');
  toast('Arquivo .txt gerado (texto simples, sem formatação).', 'ok');
}

function imprimir() {
  if (!state.parecer) return;
  const area = $('#print-area');
  area.replaceChildren(...paragrafosFinais().map((p) => {
    const e = el('p');
    appendRuns(e, p.runs.map((r) => mkRun(r.t, { b: r.b, i: r.i })), { semMarcadores: true });
    return e;
  }));
  setTimeout(() => window.print(), 50);
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
  if (m && m.subcategoria) linhas.push(`    subcategoria: ${J(m.subcategoria)},`);
  linhas.push(`    titulo: ${J(p.titulo || (m ? m.titulo + ' (adaptado)' : 'Novo modelo'))},`);
  if (m && m.quandoUsar) linhas.push(`    quandoUsar: ${J(m.quandoUsar)},`);
  if (m && m.obs && m.obs.length) linhas.push(`    obs: [${m.obs.map(J).join(', ')}],`);
  linhas.push('    paragrafos: [');
  let grupoAtual = null;
  for (const par of p.paragrafos) {
    const txt = runsToMarkup(par.runs);
    if (par.grupo !== grupoAtual && grupoAtual) { linhas.push('      ] },'); grupoAtual = null; }
    if (par.tipo === 'rotulo') { linhas.push(`      { rotulo: ${J(runsText(par.runs))} },`); continue; }
    if (!runsText(par.runs).trim()) continue;
    if (par.grupo) {
      if (grupoAtual !== par.grupo) { linhas.push('      { opcoes: ['); grupoAtual = par.grupo; }
      linhas.push(`        ${J(txt)},`);
      continue;
    }
    linhas.push(`      ${J(txt)},`);
  }
  if (grupoAtual) linhas.push('      ] },');
  linhas.push('    ],');
  linhas.push('  },');
  const codigo = linhas.join('\n');
  const ta = el('textarea', { class: 'code-out', readonly: true });
  ta.value = codigo;
  const r = await abrirDialogo({
    titulo: 'Código do modelo para modelos.js',
    corpo: [
      el('p', { text: 'Para transformar este parecer em modelo da biblioteca, quem mantém a ferramenta deve colar o bloco abaixo dentro da lista MODELOS, no arquivo modelos.js, e ajustar id, título e categoria. A ferramenta não altera a biblioteca.' }),
      el('p', { class: 'hint', text: 'Atenção: os valores já preenchidos (nomes, CPF/CNPJ, CAR…) entram no código como estão. Volte-os para [CAMPOS] antes de usar como modelo.' }),
      ta,
    ],
    acoes: [{ label: 'Fechar', value: 'fechar' }, { label: 'Copiar código', value: 'copiar', cls: 'btn-primary' }],
  });
  if (r === 'copiar') copiarTexto(codigo, 'Código copiado.');
}

/* ================= 8. Meus pareceres e backup ===================== */
function renderPareceres() {
  const box = $('#par-list');
  box.replaceChildren();
  const ts = termos($('#par-search').value);
  const lista = Store.listar()
    .filter((p) => ts.every((t) => norm(p.titulo + ' ' + p.modeloTitulo + ' ' + p.paragrafos.map((x) => runsText(x.runs)).join(' ')).includes(t)))
    .sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
  if (!lista.length) {
    box.append(el('p', { class: 'empty', text: ts.length ? 'Nenhum parecer encontrado.' : 'Nenhum parecer salvo ainda. Escolha um modelo no menu lateral do Editor para começar.' }));
    return;
  }
  const tb = el('tbody');
  for (const p of lista) {
    const aberto = state.parecer && state.parecer.id === p.id;
    tb.append(el('tr', {},
      el('td', {}, el('strong', { text: p.titulo || '(sem identificação)' }), aberto ? el('span', { class: 'chip chip-word', text: 'aberto', style: 'margin-left:6px' }) : null),
      el('td', { text: p.modeloTitulo || '—' }),
      el('td', { text: fmtData(p.atualizadoEm) }),
      el('td', { class: 'actions' },
        el('button', { class: 'btn btn-small btn-primary', onclick: () => abrirParecer(clone(p)) }, 'Abrir'),
        el('button', { class: 'btn btn-small', onclick: () => duplicarParecer(p) }, 'Duplicar'),
        el('button', { class: 'btn btn-small btn-danger', onclick: () => excluirParecer(p) }, 'Excluir'))));
  }
  box.append(el('table', { class: 'table' },
    el('thead', {}, el('tr', {}, el('th', { text: 'Identificação do caso' }), el('th', { text: 'Modelo de origem' }), el('th', { text: 'Atualizado' }), el('th', { text: '' }))),
    tb));
}

function duplicarParecer(origem) {
  if (state.parecer && origem.id === state.parecer.id) salvarParecer({ silencioso: true });
  const base = clone(origem.id && state.parecer && origem.id === state.parecer.id ? state.parecer : origem);
  const agora = agoraISO();
  const novo = { ...base, id: uid(), titulo: (base.titulo || '') + ' (cópia)', criadoEm: agora, atualizadoEm: agora };
  if (!Store.salvar(novo)) return;
  abrirParecer(novo);
  toast('Cópia criada. Ajuste as informações para o novo caso.', 'ok');
}

async function excluirParecer(p) {
  const ok = await confirmar('Excluir parecer', `Excluir “${p.titulo || '(sem identificação)'}”? Esta ação não pode ser desfeita (a biblioteca de modelos não é afetada).`, 'Excluir', true);
  if (!ok) return;
  if (!Store.excluir(p.id)) return;
  if (state.parecer && state.parecer.id === p.id) fecharParecer({ salvar: false });
  renderPareceres();
  toast('Parecer excluído.', 'ok');
}

function exportarBackup() {
  if (state.parecer && state.dirty) salvarParecer({ silencioso: true });
  const dados = {
    formato: 'pareceres-socioambientais-backup',
    versao: 1,
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
    if (atualizado) abrirParecer(clone(atualizado), { manterView: true });
    else fecharParecer({ salvar: false });
  }
  renderPareceres();
  toast(`Backup importado (${r === 'mesclar' ? 'mesclado' : 'substituído'}). Total: ${final.length} parecer(es).`, 'ok');
}

/* =============================== 9. Guia ============================ */
function tabela(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const [cab, ...corpo] = rows;
  return el('table', { class: 'table' },
    el('thead', {}, el('tr', {}, cab.map((c) => el('th', { text: c })))),
    el('tbody', {}, corpo.map((r) => el('tr', {}, r.map((c) => el('td', { text: c }))))));
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
    el('li', { text: 'No menu lateral do Editor, abra uma categoria e clique no nome do parecer para carregá-lo. O ícone 👁︎ mostra o texto sem abrir. A busca no topo do menu procura no título e em todo o conteúdo.' }),
    el('li', { text: 'No Editor, substitua os campos destacados em amarelo [ENTRE COLCHETES] pelas informações do caso, apague as opções que não se aplicam e edite livremente o texto.' }),
    el('li', { text: 'Com um parecer aberto, o painel “Trechos reutilizáveis” fica à direita: clique no texto do parecer e depois em “Inserir”. A seta » recolhe o painel e « mostra de novo.' }),
    el('li', { text: 'O menu de pareceres padrão (à esquerda) também pode ser recolhido pela seta « no topo dele, para o texto ganhar espaço; a seta » mostra de novo.' }),
    el('li', { text: 'Para começar sem modelo, use “+ Novo parecer” no menu lateral ou abra o Editor sem parecer aberto (Mais ▾ → Fechar parecer). Há duas opções: em branco ou com a estrutura padrão (blocos 1 a 6).' }),
    el('li', { text: 'Copie, baixe o .txt ou imprima/salve em PDF. Revise o texto antes: campos não substituídos saem como estão.' })));

  g.append(el('div', { class: 'box' }, el('h4', { text: 'Onde ficam os dados' }),
    el('p', { text: 'Os modelos vêm do arquivo modelos.js (somente leitura na tela). Os pareceres em elaboração ficam salvos automaticamente apenas neste navegador, neste computador — não há sincronização entre analistas ou máquinas. Faça backups em “Meus pareceres”.' }),
    el('p', { text: 'Versão da biblioteca: ' + (LIB.versao || '—') + ' · ' + LIB.modelos.length + ' modelos · ' + LIB.trechos.length + ' trechos.' })));

  g.append(el('div', { class: 'box' }, el('h4', { text: 'Atalhos de teclado' }), el('ul', {},
    el('li', { text: '/ — pesquisar pareceres (Enter abre o primeiro resultado; Esc limpa)' }),
    el('li', { text: 'Alt+1 a Alt+3 — trocar de área' }),
    el('li', { text: 'Ctrl+S — salvar parecer · Ctrl+P — imprimir parecer' }),
    el('li', { text: 'Ctrl+B / Ctrl+I — negrito / itálico · Ctrl+Z / Ctrl+Y — desfazer / refazer' }))));

  if (G.orientacoes) {
    const ol = el('ol');
    for (const o of G.orientacoes) { const li = el('li'); appendRuns(li, parseMarkup(o)); ol.append(li); }
    g.append(el('h3', { text: '1. Orientações de preenchimento (do documento Word)' }), ol);
  }
  if (G.estrutura) g.append(el('h3', { text: '2. Estrutura padrão do parecer' }), el('p', { text: G.estruturaIntro || '' }), tabela(G.estrutura));
  if (G.casosDisponiveis) {
    g.append(el('h3', { text: 'Casos disponíveis (como listado no Word)' }),
      el('ul', {}, G.casosDisponiveis.map((c) => el('li', { text: c }))),
      el('p', { class: 'hint', text: 'Esta lista diverge da organização do corpo do documento — ver pendências abaixo.' }));
  }
  if (pend.length) {
    g.append(el('h3', { text: 'Pendências do Word para validação humana' }),
      el('p', { class: 'hint', text: 'Pontos encontrados na importação. Os textos foram mantidos exatamente como no Word; ajustes devem ser decididos pela área responsável e feitos em modelos.js.' }),
      el('ul', { class: 'pend-list' }, pend.map((p) => el('li', {},
        el('div', { text: p.descricao }),
        p.modelos && p.modelos.length ? el('div', { class: 'mods' }, 'Modelos: ', ...p.modelos.flatMap((id, i) => {
          const m = LIB.porId.get(id);
          const b = el('button', { class: 'link', text: m ? m.titulo.split('–')[0].trim() + ' (' + m._cat.split('.')[0] + ')' : id, title: m ? m.titulo : '' });
          b.addEventListener('click', () => visualizarModelo(id));
          return i ? [', ', b] : [b];
        })) : null))));
  }
  if (G.anexo) {
    g.append(el('h3', { text: 'Anexo do Word – relação de alterações (consulta)' }),
      el('details', {}, el('summary', { text: 'Mostrar quadro comparativo' }), el('p', { class: 'hint', text: G.anexoIntro || '' }), tabela(G.anexo)));
  }
}

/* ========== 10. Interface: abas, diálogos, avisos, atalhos ========== */
function setView(v) {
  state.view = v;
  $$('.view').forEach((s) => s.classList.toggle('active', s.dataset.view === v));
  $$('.tab').forEach((t) => { const on = t.dataset.view === v; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
  if (v === 'pareceres') renderPareceres();
  if (v === 'editor' && !state.parecer) renderEditorVazio();
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
function abrirDialogo({ titulo, corpo, acoes, narrow = false }) {
  return new Promise((resolve) => {
    const d = $('#dialog');
    if (d.open) d.close('');
    d.classList.toggle('narrow', narrow);
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

function ligarEventos() {
  // abas
  $$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) setView(go.dataset.goto);
    // cartão "A partir de um modelo": leva à busca do menu lateral
    if (e.target.closest('[data-acao="buscar"]')) {
      recolherMenu(false);
      if (window.matchMedia('(max-width: 900px)').matches) abrirGaveta();
      $('#lib-search').focus();
    }
    // fecha menus suspensos ao clicar fora deles
    $$('.menu').forEach((m) => {
      if (m.contains(e.target)) return;
      const lista = $('.menu-list', m);
      if (lista) lista.hidden = true;
      const btn = $('button[aria-haspopup]', m);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    // começar parecer em branco (tela vazia do Editor e botão + Novo parecer)
    const novo = e.target.closest('[data-novo]');
    if (novo) {
      $('#menu-new').hidden = true;
      fecharGaveta();
      novoParecerEmBranco(novo.dataset.novo === 'estrutura');
    }
  });
  $('#btn-new').addEventListener('click', () => {
    const m = $('#menu-new');
    m.hidden = !m.hidden;
    $('#btn-new').setAttribute('aria-expanded', String(!m.hidden));
  });

  // menu lateral (modelos e trechos)
  const buscar = debounce(() => renderMenu(), 120);
  $('#lib-search').addEventListener('input', (e) => { state.busca = e.target.value; buscar(); });
  $('#lib-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      buscar.flush();
      const ts = termos(state.busca);
      const primeiro = ts.length && LIB.modelos.find((m) => ts.every((t) => m._busca.includes(t)));
      if (primeiro) abrirModeloDoMenu(primeiro.id);
    } else if (e.key === 'Escape') {
      e.target.value = '';
      state.busca = '';
      renderMenu();
    }
  });
  $('#btn-side-toggle').addEventListener('click', () => recolherMenu(!$('#sidebar').classList.contains('recolhido')));
  $('#side-label').addEventListener('click', () => { if ($('#sidebar').classList.contains('recolhido')) recolherMenu(false); });
  $('#btn-tr-toggle').addEventListener('click', () => recolherTrechos(!$('#tr-panel').classList.contains('recolhido')));
  $('#tr-panel-label').addEventListener('click', () => recolherTrechos(false));
  $('#btn-sidebar').addEventListener('click', () => (document.body.classList.contains('side-open') ? fecharGaveta() : abrirGaveta()));
  $('#sidebar-backdrop').addEventListener('click', fecharGaveta);

  // editor
  const ed = $('#editor');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) { /* opcional */ }
  ed.addEventListener('input', (e) => {
    if (e.inputType === 'insertParagraph') {
      // parágrafo novo e vazio não herda "grupo de opções" nem "rótulo"
      const sel = getSelection();
      const bloco = sel.rangeCount ? closestBloco(sel.anchorNode) : null;
      if (bloco && !bloco.textContent.trim()) { bloco.removeAttribute('data-grupo'); bloco.classList.remove('rotulo', 'flash'); bloco.removeAttribute('title'); }
    }
    if (!ed.firstElementChild) { ed.replaceChildren(parParaElemento({ tipo: 'p', runs: [] })); }
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
  document.addEventListener('selectionchange', () => {
    const s = getSelection();
    if (s.rangeCount && ed.contains(s.anchorNode)) state.lastRange = s.getRangeAt(0).cloneRange();
  });
  $$('[data-cmd]').forEach((b) => {
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { ed.focus(); document.execCommand(b.dataset.cmd); aoEditar(); });
  });
  $('#doc-title').addEventListener('input', () => { if (state.parecer) { state.parecer.titulo = $('#doc-title').value; marcarAlterado(); } });
  $('#btn-save').addEventListener('click', () => salvarParecer());
  $('#btn-copy').addEventListener('click', copiarParecer);
  $('#btn-txt').addEventListener('click', baixarTxt);
  $('#btn-print').addEventListener('click', imprimir);
  $('#btn-more').addEventListener('click', () => {
    const m = $('#menu-more');
    m.hidden = !m.hidden;
    $('#btn-more').setAttribute('aria-expanded', String(!m.hidden));
  });
  $('#btn-duplicate').addEventListener('click', () => { $('#menu-more').hidden = true; duplicarParecer(state.parecer); });
  $('#btn-close').addEventListener('click', () => { $('#menu-more').hidden = true; fecharParecer(); toast('Parecer salvo e fechado.', 'ok'); });
  $('#btn-restore').addEventListener('click', async () => {
    $('#menu-more').hidden = true;
    const m = LIB.porId.get(state.parecer.modeloId);
    if (!m) return toast('O modelo de origem não está na biblioteca atual.', 'err');
    const ok = await confirmar('Restaurar texto do modelo', 'O texto atual deste parecer será trocado pelo texto-base do modelo. Continuar?', 'Restaurar');
    if (!ok) return;
    const snap = snapshot();
    state.parecer.paragrafos = modeloParaParagrafos(m);
    renderEditor();
    marcarAlterado();
    oferecerDesfazer(snap, 'Texto do modelo restaurado.');
  });
  $('#btn-code').addEventListener('click', () => { $('#menu-more').hidden = true; gerarCodigoModelo(); });

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
      setView('editor');
      recolherMenu(false);
      if (window.matchMedia('(max-width: 900px)').matches) abrirGaveta();
      $('#lib-search').focus();
      return;
    }
    if (e.key === 'Escape' && document.body.classList.contains('side-open')) { fecharGaveta(); return; }
    if (e.altKey && !e.ctrlKey && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      setView(['editor', 'pareceres', 'guia'][Number(e.key) - 1]);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.parecer) { e.preventDefault(); salvarParecer(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && state.parecer && state.view === 'editor') { e.preventDefault(); imprimir(); }
  });

  // não perder trabalho ao fechar
  window.addEventListener('beforeunload', () => { if (state.parecer && state.dirty) salvarParecer({ silencioso: true }); });
  window.addEventListener('storage', (e) => { if (e.key === Store.KEY && state.view === 'pareceres') renderPareceres(); });
}

function init() {
  Store.testar();
  carregarBiblioteca();
  ligarEventos();
  renderMenu();
  renderTrechosPainel();
  recolherTrechos(Store.ui('trechosRecolhido') === true);
  recolherMenu(Store.ui('menuRecolhido') === true);
  renderGuia();
  if (!Store.disponivel) {
    toast('O armazenamento do navegador está bloqueado: os pareceres não serão salvos. Use copiar/.txt para guardar o trabalho.', 'err', 12000);
  }
  const ultimo = Store.ui('ultimo');
  const p = ultimo ? Store.obter(ultimo) : null;
  if (p) abrirParecer(p, { manterView: true });
  const v = Store.ui('view');
  setView(['pareceres', 'guia'].includes(v) ? v : 'editor');
  if (LIB.problemas.length) toast(`Atenção: ${LIB.problemas.length} problema(s) em modelos.js (ver Guia).`, 'warn', 8000);
}

document.addEventListener('DOMContentLoaded', init);
