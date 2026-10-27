/* =====================================================================
   Gerador de .docx (Word) em JavaScript puro, sem bibliotecas.

   Uso: Docx.gerar(doc) -> Uint8Array com o arquivo .docx
     doc = {
       titulo: 'PARECER SOCIOAMBIENTAL',
       paragrafos: [{ runs: [{ t: 'texto', b: true, i: false }, …] }, …],
       logo: { base64, largura, altura } | null,                   // PNG
       rodape: 'texto do rodapé',
     }

   O .docx é um ZIP (método "store", sem compressão) com o mínimo de
   partes OOXML que o Word exige.
   ===================================================================== */
'use strict';

const Docx = (() => {
  /* ---------------------------- ZIP ---------------------------- */
  const CRC_TABELA = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABELA[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function dataDos(d) {
    const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { hora, dia };
  }

  /** arquivos: [{ nome, dados: Uint8Array }] -> Uint8Array do ZIP */
  function zip(arquivos) {
    const enc = new TextEncoder();
    const { hora, dia } = dataDos(new Date());
    const partes = [];
    const central = [];
    let offset = 0;
    for (const a of arquivos) {
      const nome = enc.encode(a.nome);
      const crc = crc32(a.dados);
      const tam = a.dados.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true); // nomes em UTF-8
      lh.setUint16(8, 0, true);      // sem compressão
      lh.setUint16(10, hora, true);
      lh.setUint16(12, dia, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, tam, true);
      lh.setUint32(22, tam, true);
      lh.setUint16(26, nome.length, true);
      lh.setUint16(28, 0, true);
      partes.push(new Uint8Array(lh.buffer), nome, a.dados);

      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true);
      ch.setUint16(12, hora, true);
      ch.setUint16(14, dia, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, tam, true);
      ch.setUint32(24, tam, true);
      ch.setUint16(28, nome.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nome);
      offset += 30 + nome.length + tam;
    }
    const tamCentral = central.reduce((s, p) => s + p.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true);
    fim.setUint16(8, arquivos.length, true);
    fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true);
    fim.setUint32(16, offset, true);
    const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
    const out = new Uint8Array(todas.reduce((s, p) => s + p.length, 0));
    let pos = 0;
    for (const p of todas) { out.set(p, pos); pos += p.length; }
    return out;
  }

  /* --------------------------- OOXML --------------------------- */
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const AZUL = '012169';

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // caracteres de controle não são aceitos em XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  function run(r, extra = '') {
    const props = (r.b ? '<w:b/>' : '') + (r.i ? '<w:i/>' : '') + extra;
    const rPr = props ? '<w:rPr>' + props + '</w:rPr>' : '';
    const partes = String(r.t).split('\n');
    const conteudo = partes.map((p, i) => (i ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + esc(p) + '</w:t>').join('');
    return '<w:r>' + rPr + conteudo + '</w:r>';
  }

  function paragrafo(runs, pPr = '<w:pPr><w:jc w:val="both"/></w:pPr>') {
    return '<w:p>' + pPr + runs.map((r) => run(r)).join('') + '</w:p>';
  }

  function documentXml(doc) {
    const corpo = [];
    corpo.push('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>' +
      run({ t: doc.titulo || 'PARECER SOCIOAMBIENTAL', b: true }, '<w:color w:val="' + AZUL + '"/><w:sz w:val="28"/>') + '</w:p>');
    for (const p of doc.paragrafos) corpo.push(paragrafo(p.runs));
    const refs = (doc.logo ? '<w:headerReference w:type="default" r:id="rId2"/>' : '') + '<w:footerReference w:type="default" r:id="rId3"/>';
    return XML + '<w:document ' + NS + '><w:body>' + corpo.join('') +
      '<w:sectPr>' + refs + '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1418" w:right="1134" w:bottom="1418" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';
  }

  function headerXml(logo) {
    const alturaEmu = 432000; // 1,2 cm
    const larguraEmu = Math.round(alturaEmu * logo.largura / logo.altura);
    const desenho = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
      '<wp:extent cx="' + larguraEmu + '" cy="' + alturaEmu + '"/><wp:docPr id="1" name="Logo ADM"/>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + larguraEmu + '" cy="' + alturaEmu + '"/></a:xfrm>' +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
    return XML + '<w:hdr ' + NS + '><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="8BC400"/></w:pBdr>' +
      '<w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr>' +
      '<w:r>' + desenho + '</w:r><w:r><w:tab/></w:r>' +
      run({ t: 'Sustentabilidade' }, '<w:color w:val="5B6470"/><w:sz w:val="18"/>') + '</w:p></w:hdr>';
  }

  function footerXml(texto) {
    const cor = '<w:rPr><w:color w:val="5B6470"/><w:sz w:val="16"/></w:rPr>';
    return XML + '<w:ftr ' + NS + '><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr>' +
      '<w:r>' + cor + '<w:t xml:space="preserve">' + esc(texto || '') + '</w:t></w:r><w:r>' + cor + '<w:tab/><w:t xml:space="preserve">Página </w:t></w:r>' +
      '<w:r>' + cor + '<w:fldChar w:fldCharType="begin"/></w:r><w:r>' + cor + '<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>' +
      '<w:r>' + cor + '<w:fldChar w:fldCharType="separate"/></w:r><w:r>' + cor + '<w:t>1</w:t></w:r><w:r>' + cor + '<w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  }

  const STYLES = XML + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>' +
    '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/>' +
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
    '</w:styles>';

  function gerar(doc) {
    const enc = new TextEncoder();
    const txt = (s) => enc.encode(s);
    const agora = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const comLogo = !!(doc.logo && doc.logo.base64);
    const arquivos = [
      { nome: '[Content_Types].xml', dados: txt(XML +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="png" ContentType="image/png"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        (comLogo ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : '') +
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '</Types>') },
      { nome: '_rels/.rels', dados: txt(XML +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '</Relationships>') },
      { nome: 'docProps/core.xml', dados: txt(XML +
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:title>' + esc(doc.titulo || 'Parecer socioambiental') + '</dc:title><dc:creator>Pareceres Socioambientais</dc:creator>' +
        '<dcterms:created xsi:type="dcterms:W3CDTF">' + agora + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + agora + '</dcterms:modified>' +
        '</cp:coreProperties>') },
      { nome: 'word/_rels/document.xml.rels', dados: txt(XML +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        (comLogo ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : '') +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
        '</Relationships>') },
      { nome: 'word/document.xml', dados: txt(documentXml({ ...doc, logo: comLogo ? doc.logo : null })) },
      { nome: 'word/styles.xml', dados: txt(STYLES) },
      { nome: 'word/footer1.xml', dados: txt(footerXml(doc.rodape)) },
    ];
    if (comLogo) {
      const bin = atob(doc.logo.base64);
      const png = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) png[i] = bin.charCodeAt(i);
      arquivos.push(
        { nome: 'word/header1.xml', dados: txt(headerXml(doc.logo)) },
        { nome: 'word/_rels/header1.xml.rels', dados: txt(XML +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' +
          '</Relationships>') },
        { nome: 'word/media/logo.png', dados: png },
      );
    }
    return zip(arquivos);
  }

  return { gerar, crc32 };
})();
