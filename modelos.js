/* =====================================================================
   BIBLIOTECA DE PARECERES SOCIOAMBIENTAIS
   Fontes: PARECERES_SOCIOAMBIENTAIS_TEXTOS_PADRAO.docx (revisão de
   26/10/2026) e “Trechos fundamentados para utilizar” (enviados pela
   área). Os textos foram copiados sem correção; os pontos duvidosos
   estão em PENDENCIAS_WORD e aparecem no Guia da ferramenta.

   COMO MANTER ESTE ARQUIVO
   - Os textos ficam em TX (um parágrafo por chave). MODELOS e TRECHOS
     apenas apontam para eles: corrigir em TX corrige em todo lugar.
   - Para ADICIONAR um modelo: copie um bloco { id: ..., } de MODELOS,
     troque o "id" (único; não deve mudar depois) e edite.
   - "categoria": um id de CATEGORIAS. "status": um id de STATUS (define
     a cor do cartão e o status inicial do parecer).
   - "padroes" (opcional): valores iniciais dos campos, ex.: { tipoPessoa: 'PJ' }.
   - Cada item de "paragrafos" pode ser:
       "texto"                                parágrafo normal
       { rotulo: "3 – Fundamentação", bloco: 3 }
                                              rótulo interno (não sai no parecer)
       { grupo: "Operação", instrucao: "…", opcoes: [{ rotulo: "Opção 1 – …", texto: "…" }] }
                                              opções: o analista escolhe no painel
                                              “Dados do caso”; as outras não saem
                                              (multipla: true permite marcar várias)
       { se: "carStatus=Suspenso", rotulo: "…", texto: "…" }
                                              parágrafo que só sai quando o campo
                                              tem aquele valor
       { opcional: "rótulo", texto: "…", incluido: false }
                                              parágrafo opcional (caixa “incluir”)
   - Marcações dentro do texto:
       {{campo}}            campo parametrizado (ver CAMPOS). Preenchido uma vez
                            no painel e aplicado ao texto todo.
       {{campo|TEXTO}}      o mesmo campo, com outro texto entre colchetes
                            enquanto estiver vazio
       {{escolha:a|b|c}}    alternativa local: o analista escolhe uma no painel.
                            Pode conter campos: {{escolha:x {{campo}}|y}}
       [TEXTO LIVRE]        trecho a redigir (amarelo; edição livre)
       **negrito**   ==condicional (laranja)==   !!exige validação (azul)!!
   - "quandoUsar" e "obs" são orientações internas: aparecem para o
     analista, mas NUNCA entram no texto do parecer.
   ===================================================================== */

/* Versão da biblioteca (aumente ao alterar os textos). */
const BIBLIOTECA_VERSAO = '2026-10-26';

const CATEGORIAS = [
  { id: 'aprovado',     nome: 'A. Aprovado – desbloqueio' },
  { id: 'excepcional',  nome: 'B. Desbloqueio excepcional – somente operação já formalizada',
    descricao: 'A restrição continua existindo: o desbloqueio vale apenas para concluir a operação já formalizada, e o bloqueio deve ser restabelecido ao final.' },
  { id: 'mantido',      nome: 'C. Bloqueio mantido' },
  { id: 'procedimento', nome: 'D. Procedimentos operacionais e cadastrais' },
  { id: 'base',         nome: 'Modelo-base (casos não previstos)' },
];

/* Status do parecer: nome e cor do selo. */
const STATUS = [
  { id: 'aprovado',        nome: 'APROVADO',                   cor: 'ok' },
  { id: 'excepcional',     nome: 'APROVADO (EXCEPCIONAL)',     cor: 'warn' },
  { id: 'mantido',         nome: 'BLOQUEIO MANTIDO',           cor: 'danger' },
  { id: 'desbloqueio',     nome: 'DESBLOQUEIO REALIZADO',      cor: 'info' },
  { id: 'reclassificacao', nome: 'RECLASSIFICAÇÃO CADASTRAL',  cor: 'info' },
];

/* =====================================================================
   TEMAS DO CHAMADO (filtro da página inicial e do painel de trechos)
   "modelos": ids de MODELOS que aparecem no tema (um modelo pode estar
   em mais de um). "protocolos": temas do histórico (META.tema em
   biblioteca-historico.js) cujos trechos pertencem a este tema.
   ===================================================================== */
const TEMAS = [
  { id: 'embargo', curto: 'Embargo', nome: 'Embargo ambiental (Ibama, Sema-MT, Semad-GO, ICMBio)',
    protocolos: ['Embargo Ibama', 'Embargo Sema-MT', 'Embargo Semad-GO', 'Embargo ICMBio', 'Embargo Ibama/ICMBio', 'Embargo IAT-PR', 'Embargo LDI-PA'],
    modelos: ['a-02', 'a-03', 'a-04', 'a-05', 'a-07', 'b-09', 'c-nova-area', 'c-embargo', 'a-embargo-outros', 'a-triangulacao'] },
  { id: 'protocolos', curto: 'PVG · PRODES · Moratória · CSA', nome: 'Desmatamento e protocolos (PVG, PRODES, Moratória da Soja, CSA Cerrado)',
    protocolos: ['Protocolo Verde dos Grãos (PVG-PA)', 'PRODES 2020', 'PRODES 2025', 'Moratória da Soja', 'CSA Cerrado', 'LUC – Land Use Change'],
    modelos: ['a-08', 'b-09', 'c-12', 'c-13', 'c-14', 'a-prodes2020', 'a-pvg', 'a-csa', 'a-moratoria', 'c-moratoria', 'c-prospeccao'] },
  { id: 'car', curto: 'CAR', nome: 'Regularidade do CAR (suspenso, cancelado, sem CAR)',
    protocolos: ['CAR Suspenso/Cancelado', 'Sem CAR', 'Alçada Y – sem CAR', 'Contrato sem CAR', 'Cadastro de CAR (CORP_F0285)'],
    modelos: ['b-10', 'c-car-suspenso', 'a-car-regularizado', 'e-sem-car', 'd-nao-se-aplica', 'c-alcada-l'] },
  { id: 'prospeccao', curto: 'Prospecção', nome: 'Prospecção de clientes',
    protocolos: ['Prospecção de clientes'],
    modelos: ['a-01', 'a-02', 'a-03', 'a-prospeccao-serasa', 'c-prospeccao'] },
  { id: 'sem-restricao', curto: 'Sem restrição', nome: 'Sem restrição ou bloqueio sem motivo',
    protocolos: ['Não há restrições', 'Bloqueio manual sem motivo'],
    modelos: ['e-sem-restricao', 'a-sem-restricao', 'a-sem-motivo', 'a-01'] },
  { id: 'cultivo', curto: 'Cultivo de grãos', nome: 'Área de cultivo de grãos (menos de 10%, sem cultivo)',
    protocolos: ['Cultivo inferior a 10%', 'Inexistência de área de cultivo'],
    modelos: ['c-11', 'a-cultivo', 'b-09'] },
  { id: 'cadastro', curto: 'Cadastro e enquadramento', nome: 'Cadastro e enquadramento (direto/indireto, alçadas, selo)',
    protocolos: ['Enquadramento direto/indireto', 'Alçada Y'],
    modelos: ['d-reenquadramento', 'd-cliente-indireto', 'd-selo', 'd-nao-se-aplica', 'd-washout', 'a-alcada-g', 'c-alcada-l'] },
  { id: 'protegidas', curto: 'Áreas protegidas', nome: 'Áreas protegidas e trabalho escravo (UC, Terra Indígena, Lista Suja)',
    protocolos: ['Unidade de Conservação', 'Terra Indígena/Quilombola', 'Trabalho escravo (Lista Suja)'],
    modelos: ['a-06', 'a-uc'] },
];

/* =====================================================================
   CAMPOS PARAMETRIZADOS
   tipo: texto | data | numero | selecao (lista fechada) | lista (sugestões
   com texto livre). "ph" é o texto mostrado entre colchetes enquanto o
   campo está vazio. Em "opcoes", { valor, texto } permite gravar um valor
   e escrever outro no parecer.
   ===================================================================== */
const GRUPOS_CAMPOS = ['Cliente', 'Área', 'Restrição', 'Documentos', 'Capacidade produtiva', 'Operação', 'Cadastro'];

const CAMPOS = [
  { id: 'tipoPessoa', grupo: 'Cliente', rotulo: 'Tipo de pessoa', tipo: 'selecao', ph: 'PF / PJ',
    opcoes: [{ valor: 'PF', texto: 'Pessoa física' }, { valor: 'PJ', texto: 'Pessoa jurídica' }] },
  { id: 'nome', grupo: 'Cliente', rotulo: 'Nome / razão social', ph: 'NOME / RAZÃO SOCIAL' },
  { id: 'docNumero', grupo: 'Cliente', rotulo: 'Nº do CPF/CNPJ', ph: 'Nº DO CPF/CNPJ' },

  { id: 'municipio', grupo: 'Área', rotulo: 'Município/UF', ph: 'MUNICÍPIO/UF' },
  { id: 'municipioPA', grupo: 'Área', rotulo: 'Município (Pará)', ph: 'MUNICÍPIO', dica: 'O texto completa com “/PA”.' },
  { id: 'uf', grupo: 'Área', rotulo: 'UF (fator CONAB)', ph: 'UF' },
  { id: 'car', grupo: 'Área', rotulo: 'Nº do CAR', ph: 'Nº DO CAR' },
  { id: 'municipioEmbargo', grupo: 'Área', rotulo: 'Município/UF do embargo', ph: 'MUNICÍPIO/UF DO EMBARGO' },
  { id: 'carEmbargo', grupo: 'Área', rotulo: 'Nº do CAR do embargo', ph: 'Nº DO CAR DO EMBARGO' },
  { id: 'carAssentamento', grupo: 'Área', rotulo: 'Nº do CAR do assentamento', ph: 'Nº DO CAR DO ASSENTAMENTO' },
  { id: 'nomeFazenda', grupo: 'Área', rotulo: 'Nome da fazenda', ph: 'NOME DA FAZENDA' },
  { id: 'carStatus', grupo: 'Área', rotulo: 'Status do CAR', tipo: 'selecao', ph: '“Suspenso” / “Cancelado”',
    opcoes: [{ valor: 'Suspenso', texto: '“Suspenso”' }, { valor: 'Cancelado', texto: '“Cancelado”' }] },

  { id: 'orgao', grupo: 'Restrição', rotulo: 'Órgão do embargo', tipo: 'lista', ph: 'Ibama / ICMBio / Sema-MT / Semad-GO / LDI-PA',
    opcoes: ['Ibama', 'ICMBio', 'Sema-MT', 'Semad-GO', 'LDI-PA'] },
  { id: 'esferaEmbargo', grupo: 'Restrição', rotulo: 'Esfera do embargo', tipo: 'selecao', ph: 'federal / estadual',
    opcoes: ['federal', 'estadual'] },
  { id: 'sobreposicao', grupo: 'Restrição', rotulo: 'Sobreposição', tipo: 'selecao', ph: 'parcial / integral', opcoes: ['parcial', 'integral'] },
  { id: 'nomeTI', grupo: 'Restrição', rotulo: 'Nome da Terra Indígena', ph: 'NOME DA TERRA INDÍGENA' },
  { id: 'nomeUC', grupo: 'Restrição', rotulo: 'Unidade de Conservação (APA)', ph: 'NOME DA UNIDADE DE CONSERVAÇÃO', padrao: 'APA Serra da Tabatinga' },
  { id: 'motivoBloqueio', grupo: 'Restrição', rotulo: 'Motivo do bloqueio', ph: 'MOTIVO DO BLOQUEIO' },
  { id: 'motivo', grupo: 'Restrição', rotulo: 'Motivo (conclusão)', ph: 'MOTIVO' },

  { id: 'numDocumento', grupo: 'Documentos', rotulo: 'Nº do LAR apresentado', ph: 'Nº DO DOCUMENTO' },
  { id: 'dataValidade', grupo: 'Documentos', rotulo: 'Validade do LAR', tipo: 'data', ph: 'DATA' },
  { id: 'numLAR', grupo: 'Documentos', rotulo: 'Nº do LAR vencido', ph: 'Nº DO LAR' },
  { id: 'dataVencimento', grupo: 'Documentos', rotulo: 'Data de vencimento do LAR', tipo: 'data', ph: 'DATA DE VENCIMENTO' },
  { id: 'dataProtocolo', grupo: 'Documentos', rotulo: 'Data do protocolo de renovação', tipo: 'data', ph: 'DATA DO PROTOCOLO' },
  { id: 'documentosApresentados', grupo: 'Documentos', rotulo: 'Documentos apresentados', ph: 'DESCRIÇÃO DOS DOCUMENTOS APRESENTADOS' },
  { id: 'documentoNecessario', grupo: 'Documentos', rotulo: 'Documento ou informação necessária', ph: 'DOCUMENTO OU INFORMAÇÃO NECESSÁRIA' },
  { id: 'cuidado', grupo: 'Documentos', rotulo: 'Cuidado na operação', ph: 'CUIDADO A SER OBSERVADO NA OPERAÇÃO' },

  { id: 'areaProdutiva', grupo: 'Capacidade produtiva', rotulo: 'Área produtiva (ha)', tipo: 'numero', ph: 'ÁREA PRODUTIVA' },
  { id: 'rendimento', grupo: 'Capacidade produtiva', rotulo: 'Rendimento CONAB (kg/ha)', tipo: 'numero', ph: 'RENDIMENTO' },
  { id: 'producaoKg', grupo: 'Capacidade produtiva', rotulo: 'Produção (kg)', tipo: 'numero', ph: 'PRODUÇÃO EM KG', dica: 'Use a Calculadora de Capacidade Produtiva.' },
  { id: 'producaoT', grupo: 'Capacidade produtiva', rotulo: 'Produção (t)', tipo: 'numero', ph: 'PRODUÇÃO EM T' },
  { id: 'sacas', grupo: 'Capacidade produtiva', rotulo: 'Nº de sacas (60 kg)', tipo: 'numero', ph: 'Nº DE SACAS' },

  { id: 'tipoContrato', grupo: 'Operação', rotulo: 'Tipo de contrato', tipo: 'selecao', ph: 'fixo / balcão', opcoes: ['fixo', 'balcão'] },
  { id: 'contrato', grupo: 'Operação', rotulo: 'Nº do contrato', ph: 'Nº DO CONTRATO' },
  { id: 'volume', grupo: 'Operação', rotulo: 'Volume do contrato (kg)', tipo: 'numero', ph: 'VOLUME DO CONTRATO' },
  { id: 'produto', grupo: 'Operação', rotulo: 'Produto', tipo: 'lista', ph: 'SOJA/MILHO', opcoes: ['soja', 'milho'] },
  { id: 'dataGeracao', grupo: 'Operação', rotulo: 'Data da geração do contrato', tipo: 'data', ph: 'DATA DA GERAÇÃO' },
  { id: 'hedge', grupo: 'Operação', rotulo: 'Nº do hedge', ph: 'Nº DO HEDGE' },
  { id: 'volumeHedge', grupo: 'Operação', rotulo: 'Volume do hedge (kg)', tipo: 'numero', ph: 'VOLUME DO HEDGE' },
  { id: 'pedido', grupo: 'Operação', rotulo: 'Nº do pedido de insumos', ph: 'Nº DO PEDIDO' },
  { id: 'dataEmissao', grupo: 'Operação', rotulo: 'Data de emissão do pedido', tipo: 'data', ph: 'DATA DA EMISSÃO' },
  { id: 'numOperacao', grupo: 'Operação', rotulo: 'Nº do contrato/pedido (comunicação final)', ph: 'Nº' },

  { id: 'atividadePrincipal', grupo: 'Cadastro', rotulo: 'Atividade principal', ph: 'ATIVIDADE PRINCIPAL' },
  { id: 'atividadesSecundarias', grupo: 'Cadastro', rotulo: 'Atividades secundárias', ph: 'ATIVIDADES SECUNDÁRIAS' },
  { id: 'chamadoMDM', grupo: 'Cadastro', rotulo: 'Nº do chamado (MDM)', ph: 'Nº DO CHAMADO' },
];

/* Campos derivados do tipo de pessoa (não aparecem no painel). */
const DERIVADOS = {
  Sujeito: { de: 'tipoPessoa', ph: 'O produtor / A empresa', PF: 'O produtor', PJ: 'A empresa' },
  sujeito: { de: 'tipoPessoa', ph: 'o produtor / a empresa', PF: 'o produtor', PJ: 'a empresa' },
  doc:     { de: 'tipoPessoa', ph: 'CPF/CNPJ', PF: 'CPF', PJ: 'CNPJ' },
  comEste: { de: 'tipoPessoa', ph: 'com este produtor / com esta empresa', PF: 'com este produtor', PJ: 'com esta empresa' },
};

/* =====================================================================
   TEXTOS (um parágrafo por chave)
   ===================================================================== */
const TX = {
  /* ---- 1 e 2 – Identificação e situação da área ---- */
  idLimpo: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. Da mesma forma, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, não apresenta passivos ou bloqueios ambientais, conforme demonstrado no Relatório de Conformidade Ambiental anexo.',
  idEmbargoCpf: '{{Sujeito}} {{nome}} possui embargo {{orgao}} vinculado ao seu {{doc}}, incidente sobre área localizada no município de {{municipioEmbargo}} e registrada no CAR nº {{carEmbargo}}, motivo pelo qual seu cadastro (clifor) encontrava-se bloqueado no sistema ADMBR.',
  idEmbargoArea: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão de embargo {{orgao}} incidente sobre parte do imóvel.',
  idTI: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão de sobreposição {{sobreposicao}} com a Terra Indígena {{nomeTI}}, classificada com status legal “Declarada”.',
  idAssentamento: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão do risco de triangulação com áreas objeto de embargo {{orgao}}, vinculadas ao CAR nº {{carAssentamento}}.',
  idPvgLar: '{{Sujeito}} {{nome}} possui restrição ambiental vinculada ao seu {{doc}} no âmbito do Protocolo Verde dos Grãos do Pará (PVG), decorrente de desmatamento acima do limite permitido (25 hectares), incidente sobre a área localizada no município de {{municipioPA}}/PA e registrada no CAR nº {{car}}.',
  idExcepcional: '{{Sujeito}} {{nome}} {{escolha:não possui|possui}} restrições ambientais vinculadas ao seu {{doc}}. {{escolha:No entanto|Além disso}}, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontra-se bloqueada em razão de {{escolha:embargo do Ibama, ICMBio, Sema-MT, Semad-GO ou LDI-PA|restrição associada ao Protocolo Verde dos Grãos do Pará (PVG)|ausência de área de cultivo de grãos|desmatamento identificado no PRODES 2025}}.',
  idCarStatus: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontrava-se bloqueada em razão de o CAR constar com status {{carStatus}}.',
  idCultivo: '{{Sujeito}} {{nome}} não possui restrições ambientais vinculadas ao seu {{doc}}. No entanto, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontra-se bloqueada em razão da ausência de comprovação de que, no mínimo, 10% (dez por cento) de sua extensão seja destinada ao cultivo de grãos.',
  idPvg: '{{Sujeito}} {{nome}} possui restrições associadas ao Protocolo Verde dos Grãos do Pará (PVG), em decorrência de desmatamento superior ao limite permitido (25 hectares) na própria área indicada para análise, localizada no município de {{municipioPA}}/PA e registrada no CAR nº {{car}}, conforme Relatório de Conformidade Ambiental anexo.',
  idBase: '{{Sujeito}} {{nome}} {{escolha:não possui|possui}} restrições ambientais vinculadas ao seu {{doc}}. {{escolha:Da mesma forma|No entanto}}, a área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, {{escolha:não apresenta passivos ou bloqueios ambientais|encontra-se bloqueada em razão de {{motivoBloqueio}}}}, conforme Relatório de Conformidade Ambiental anexo.',
  reenqId: 'A empresa {{nome}} encontra-se atualmente classificada como cliente DIRETO. Contudo, conforme análise cadastral, sua atividade principal é a {{atividadePrincipal}}, e entre suas atividades secundárias constam {{atividadesSecundarias}}.',

  /* ---- 3 – Fundamentação ---- */
  embIsolado: 'Em análise às imagens de satélite, verificou-se que os polígonos embargados estão devidamente isolados da área destinada ao cultivo de grãos, encontrando-se a área, portanto, em conformidade.',
  emb150: 'A área indicada para análise, localizada no município de {{municipio}} e registrada no CAR nº {{car}}, encontra-se a uma distância superior a 150 km da área objeto do embargo. Dessa forma, atende ao critério de mitigação do risco de triangulação previsto na política da companhia, não tendo sido identificados impedimentos sob esse aspecto.',
  tiPolitica: 'De acordo com a política vigente da companhia, somente as áreas sobrepostas a terras indígenas com status “Homologada” pelo Governo Federal são passíveis de bloqueio.',
  tiDeclarada: 'Dessa forma, considerando que a Terra Indígena sobreposta à área objeto da presente análise possui status legal “Declarada”, conclui-se que, até o momento, a área permanece em conformidade com os critérios socioambientais estabelecidos pela companhia.',
  assentamento: 'O CAR nº {{carAssentamento}} corresponde a uma área de assentamento na qual o imóvel do cliente está inserido. Assim, o bloqueio identificado decorre exclusivamente de passivos ambientais pertencentes a terceiros, associados ao assentamento, e não ao cliente nem à sua área específica.',
  pvgRegularizacao: 'Para a regularização do referido passivo, é necessário apresentar o Licenciamento Ambiental Rural (LAR) válido e/ou o Plano de Recuperação de Áreas Degradadas (PRAD) elaborado por profissional habilitado e devidamente protocolado junto ao órgão ambiental competente.',
  pvgLarValido: 'No presente chamado, foi apresentado o Licenciamento Ambiental Rural (LAR) nº {{numDocumento}}, válido até {{dataValidade}}, que autoriza o desenvolvimento de atividades agrícolas de culturas de ciclo curto, incluindo soja, milho e demais culturas anuais.',
  pvgApta: 'Assim, a área encontra-se regularizada do ponto de vista ambiental e apta a operações comerciais.',
  carBcb: 'Tal condição está em desacordo com as diretrizes estabelecidas pela política interna da ADM, bem como com a Resolução BCB nº 140/2021, que dispõe sobre impedimentos e restrições aplicáveis à concessão de crédito rural para imóveis que apresentem pendências ou irregularidades de natureza socioambiental.',
  carStatusPolitica: 'Conforme os critérios internos vigentes, somente imóveis cadastrados no CAR com status “Ativo” ou “Pendente” podem ser vinculados a contratos e operações comerciais. Consequentemente, imóveis com status “Suspenso” ou “Cancelado” não são elegíveis para vinculação a negociações ou contratação de operações.',
  cultivoSatelite: 'Conforme análise das imagens de satélite, foi constatado que a propriedade não apresenta áreas de cultivo de grãos. Dessa forma, conclui-se que eventual volume de grãos negociado não poderia ter a referida área como origem ou como área de formação de lavoura.',
  naoApta: 'Dessa forma, a área em análise não atende aos critérios de compliance socioambiental e, consequentemente, não está apta a ser vinculada a qualquer operação.',
  larVencido: 'Com o intuito de regularizar o referido passivo, foi apresentado o Licenciamento Ambiental Rural (LAR) nº {{numLAR}}; todavia, o documento encontra-se vencido desde {{dataVencimento}}. {{escolha:Não foi apresentado protocolo de renovação da licença.|O protocolo de renovação foi realizado em {{dataProtocolo}}, fora do prazo legal.}}',
  lar120: 'Para que o LAR seja considerado válido e tenha sua eficácia prorrogada após o vencimento, o requerimento de renovação deve ter sido protocolado junto ao órgão ambiental competente com antecedência mínima de 120 (cento e vinte) dias da data de expiração da licença, conforme dispõem o art. 14, § 4º, da Lei Complementar Federal nº 140/2011 e o art. 18, § 4º, da Resolução CONAMA nº 237/1997.',
  larEficacia: 'Por conseguinte, caso o protocolo de renovação tenha sido realizado fora do prazo estabelecido ou após a data de expiração da licença, opera-se a perda de eficácia do ato administrativo, não havendo prorrogação automática.',
  larSancoes: 'Nesses casos, a atividade passa a ser exercida sem o devido licenciamento, sujeitando o empreendedor às sanções administrativas cabíveis, uma vez que o protocolo extemporâneo (fora do prazo) não tem o condão de restabelecer a validade da licença vencida.',
  prodesDiretriz: 'Conforme diretriz estabelecida pela Diretoria de Sustentabilidade da ADM, imóveis que apresentem registros dessa natureza devem ser automaticamente classificados como restritos para fins de vinculação a operações comerciais, independentemente de sua situação perante a legislação ambiental vigente.',
  prodesPolitica: 'É importante destacar que esse critério decorre de uma Política Global da ADM, não constituindo exigência legal nem obrigação prevista em acordos setoriais. Trata-se de compromisso voluntariamente assumido pela companhia como parte de sua estratégia de sustentabilidade e de gestão de riscos socioambientais.',
  prodesSemRegularizacao: 'Em razão desse enquadramento, não há previsão de regularização da restrição mediante a simples apresentação de documentação complementar, uma vez que o impedimento está vinculado ao atendimento das diretrizes corporativas internas da companhia.',
  fundBase: '[Descrever a análise realizada (imagens de satélite, bases consultadas, documentos apresentados) e citar a norma, o protocolo ou a política que fundamenta a conclusão.]',

  /* ---- Trechos fundamentados (enviados pela área) ---- */
  apa1: 'Quanto ao bloqueio por sobreposição à Unidade de Conservação, esclarece-se que a {{nomeUC}} pertence ao Grupo de Uso Sustentável (art. 15 da Lei Federal nº 9.985/2000 - SNUC).',
  apa2: 'Essa categoria permite expressamente o domínio privado e a exploração econômica do solo, inclusive para o cultivo de grãos, desde que respeitadas as limitações do Código Florestal (CAR, Reserva Legal e APP) e as diretrizes do seu Plano de Manejo. Portanto, sob a ótica estrita da categoria da UC, a área seria passível de liberação.',
  art54Intro: 'Nesse contexto, cabe destacar o disposto no artigo 54 do Decreto Federal nº 6.514/2008, que regulamenta a Lei de Crimes Ambientais (Lei nº 9.605/1998):',
  art54Texto: 'Art. 54. Adquirir, intermediar, transportar ou comercializar produto ou subproduto de origem animal ou vegetal produzido sobre área objeto de embargo.',
  art54Pena: 'Penalidade: multa de R$ 500,00 (quinhentos reais) por quilograma ou unidade.',
  ibamaDoc1: 'Verificou-se, ainda, a apresentação de documentação com o objetivo de demonstrar eventual regularização do passivo identificado.',
  ibamaDoc2: 'Todavia, os documentos anexados consistem em {{documentosApresentados}}',
  ibamaDoc3: 'Ressalta-se que tais documentos não possuem efeito de desembargo sobre autuações aplicadas pelo IBAMA, em razão da independência das esferas administrativas e da ausência de competência do órgão ambiental estadual para suspender, revogar ou anular sanções impostas pela autarquia federal.',
  ibamaDoc4: 'Nos termos da Lei Complementar nº 140/2011 e do Decreto Federal nº 6.514/2008, o levantamento de embargo aplicado pelo IBAMA depende de ato formal e específico expedido pelo próprio órgão federal competente, ou de decisão judicial expressa.',
  ibamaDoc5: 'Dessa forma, licenças, autorizações ou demais atos administrativos emitidos por órgão ambiental estadual não substituem nem afastam a necessidade de regularização do passivo ambiental junto à esfera federal.',
  ibamaDoc6: 'Diante do exposto, conclui-se que as áreas analisadas não atendem aos critérios de conformidade socioambiental exigidos para negociação.',
  ibamaDoc7: 'Assim, não recomendamos a realização de operações vinculadas às referidas áreas, tampouco a áreas que não observem o raio mínimo de 150km de distanciamento previsto na política de prevenção ao risco de triangulação da companhia, permanecendo o bloqueio socioambiental aplicável até que seja comprovada a regularização da restrição ambiental identificada.',
  novaArea1: 'Em análise das imagens de satélite, verificou-se que os polígonos embargados não estão isolados das áreas destinadas ao cultivo agrícola, havendo evidências de plantio de soja e milho na última safra dentro da área objeto da restrição.',
  novaArea2: 'Diante dos elementos analisados, verifica-se que a área objeto da presente solicitação possui embargo ambiental {{esferaEmbargo}} que não vem sendo efetivamente observado, uma vez que há indícios de continuidade da atividade agrícola em áreas embargadas.',
  novaArea3: 'Tal cenário evidencia risco de triangulação de produto, caracterizado pela mistura de grãos produzidos em áreas regulares com aqueles oriundos de áreas sujeitas a restrições ambientais.',
  novaArea4: 'Nesse contexto, destaca-se que o artigo 54 do Decreto Federal nº 6.514/2008 estabelece:',
  novaArea5: 'Art. 54. Adquirir, intermediar, transportar ou comercializar produto ou subproduto de origem animal ou vegetal produzido sobre área objeto de embargo:',
  novaArea6: 'Multa de R$ 500,00 (quinhentos reais) por quilograma ou unidade.',
  novaArea7: 'Dessa forma, considerando que a área objeto da presente análise não foi vinculada à operação desde sua origem, tampouco poderia ter sido em razão das restrições ambientais identificadas, conclui-se que a área não atende aos requisitos de conformidade socioambiental exigidos pela companhia.',
  novaArea8: 'Ademais, sua eventual vinculação à operação neste momento representaria relevante risco de descumprimento das diretrizes internas e da legislação aplicável.',
  novaArea9: 'Assim, **o bloqueio será mantido**, não sendo recomendada a vinculação da área à operação em questão.',
  washout1: 'Conforme informado no chamado, a solicitação de desbloqueio tem por objetivo viabilizar a continuidade da operação referente ao Contrato nº {{contrato}}, envolvendo a comercialização de algodão.',
  washout2: 'Ressalta-se que operações de washout, bem como contratações de volume envolvendo algodão, não estão sujeitas ao crivo da análise socioambiental realizada pela Sustentabilidade.',
  washout3: 'Dessa forma, considerando a natureza da operação, o desbloqueio foi realizado de forma excepcional, sem a necessidade de análise socioambiental da área ou do produtor.',
  washout4: 'Diante do exposto, o desbloqueio foi devidamente efetuado para permitir o prosseguimento da operação informada no chamado.',
  reenq2: 'Diante desse enquadramento operacional, conclui-se que a empresa possui perfil de atuação como cliente indireto, e não direto, como atualmente registrado.',
  reenqSemCar: 'Considerando que não foram identificadas restrições ambientais vinculadas ao CNPJ, entende-se que a impossibilidade de prosseguimento da operação decorre da ausência de CAR, uma vez que a empresa estava classificada de forma incorreta como cliente direto.',
  reenqFarelo: 'Conforme informado no chamado, o pedido de desbloqueio tem como finalidade a continuidade de operação envolvendo farelo de soja.',
  reenq3: 'Dessa forma, foi realizada a reclassificação da empresa de cliente DIRETO para INDIRETO, em conformidade com as diretrizes vigentes.',
  reenq4: 'A validação e a confirmação dessa alteração é conduzidas pelo time de MDM, para o qual o chamado já foi devidamente direcionado (chamado nº {{chamadoMDM}}).',

  /* ---- 4 – Capacidade produtiva ---- */
  capUF: 'Adicionalmente, a área indicada possui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado de {{uf}}, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de grãos e {{sacas}} sacas de 60 kg.',
  capPA: 'Adicionalmente, a área indicada possui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado do Pará, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de grãos e {{sacas}} sacas de 60 kg.',
  capPAInfo: 'A título de informação, a área indicada possui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado do Pará, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de grãos e {{sacas}} sacas de 60 kg.',
  capBase: '{{escolha:Adicionalmente|A título de informação}}, a área indicada possui aproximadamente {{areaProdutiva}} hectares de área produtiva. Considerando o fator médio de rendimento estabelecido pela CONAB para o Estado de {{uf}}, de {{rendimento}} kg/ha, a capacidade estimada de produção da área é de aproximadamente {{producaoKg}} kg, equivalente a {{producaoT}} toneladas de grãos e {{sacas}} sacas de 60 kg.',

  /* ---- 5 – Operação ---- */
  opAlcadaL: 'Conforme informado no chamado, o pedido de análise e eventual desbloqueio tem por objetivo viabilizar a continuidade da operação referente ao contrato {{tipoContrato}} nº {{contrato}}, envolvendo o volume de {{volume}} kg de {{produto}}, atualmente enquadrado na alçada L em razão do bloqueio acima mencionado.',
  opGerado: 'Conforme informado no chamado, o pedido de análise e eventual desbloqueio tem por objetivo viabilizar a continuidade da operação referente ao contrato {{tipoContrato}} nº {{contrato}}, envolvendo o volume de {{volume}} kg de {{produto}}, firmado em {{dataGeracao}}, que tem como área de formação de lavoura vinculada o imóvel registrado no CAR nº {{car}}.',
  opHedge: 'Conforme informado no chamado, o pedido de análise e eventual desbloqueio tem por finalidade a aplicação do hedge nº {{hedge}}, visando à geração de novo contrato no volume de {{volumeHedge}} kg de {{produto}}.',
  opInsumos: 'Conforme informado no chamado, o pedido de análise e eventual desbloqueio tem por objetivo viabilizar a continuidade da operação vinculada ao Pedido de Insumos nº {{pedido}}, emitido em {{dataEmissao}}, cuja área de entrega e/ou aplicação corresponde à área objeto da presente análise.',
  opExcContrato: 'Conforme informado no chamado, o pedido de desbloqueio tem por objetivo viabilizar a continuidade da operação vinculada ao contrato {{tipoContrato}} nº {{contrato}}, envolvendo o volume de {{volume}} kg de {{produto}}, firmado em {{dataGeracao}}, cuja área de formação de lavoura está vinculada ao CAR nº {{car}}.',
  opExcInsumos: 'Conforme informado no chamado, o pedido de desbloqueio tem por objetivo viabilizar a continuidade da operação vinculada ao Pedido de Insumos nº {{pedido}}, emitido em {{dataEmissao}}, cuja área de entrega e/ou aplicação corresponde à área objeto da presente análise.',
  opCarInsumos: 'Conforme informado no chamado, o pedido de desbloqueio tem por objetivo viabilizar a continuidade da operação relacionada ao Pedido de Insumos nº {{pedido}}, emitido em {{dataEmissao}}, cuja entrega está prevista para a Fazenda {{nomeFazenda}}, localizada no município de {{municipio}}.',
  opCarContrato: 'Conforme informado no chamado, o pedido de desbloqueio tem por objetivo viabilizar o cumprimento do contrato fixo nº {{contrato}}, firmado em {{dataGeracao|DATA}}, referente ao volume total de {{volume|VOLUME}} kg de {{produto}}, que tem como área de formação de lavoura vinculada o imóvel registrado no CAR nº {{car}}, localizado no município de {{municipio}}.',
  opBase: 'Conforme informado no chamado, o pedido de análise e eventual desbloqueio tem por objetivo [DESCREVER A OPERAÇÃO: contrato, hedge ou pedido de insumos, com número, volume e data].',

  /* ---- 6 – Conclusão ---- */
  conFavoravel: 'Diante do exposto, conclui-se que tanto {{sujeito}} quanto a área objeto da presente análise encontram-se em conformidade sob a ótica socioambiental, **não tendo sido identificados impedimentos à realização de negociações.**',
  conFavDesbloqueio: 'Diante do exposto, conclui-se que tanto {{sujeito}} quanto a área objeto da presente análise encontram-se em conformidade sob a ótica socioambiental, não tendo sido identificados impedimentos à realização de negociações, **motivo pelo qual o desbloqueio foi devidamente realizado.**',
  conFavOperacao: 'Diante do exposto, considerando que {{sujeito}} e a área objeto da presente análise encontram-se em conformidade sob a ótica socioambiental e que o volume negociado é compatível com a capacidade produtiva da área, conclui-se que não há impedimentos socioambientais à operação, **motivo pelo qual o desbloqueio foi devidamente realizado.**',
  conFavLar: 'Diante do exposto, considerando que {{sujeito}} e a área objeto da presente análise encontram-se em conformidade sob a ótica socioambiental, conforme comprovado pelo licenciamento vigente, e que o volume negociado é compatível com a capacidade produtiva estimada, conclui-se que não há impedimentos socioambientais à operação, **motivo pelo qual o desbloqueio foi devidamente realizado.**',
  excPontual: 'Considerando que a operação já foi formalizada e se encontra em fase de execução e cumprimento contratual, **o desbloqueio será concedido em caráter excepcional e pontual**, exclusivamente para permitir a conclusão da operação já existente, não constituindo autorização para a formalização de novos negócios vinculados à área em questão.',
  excVedadas: 'Ressalta-se que eventuais novas negociações, contratações ou operações envolvendo o cliente e/ou a área objeto desta análise permanecem vedadas e não contam com a anuência da equipe de Sustentabilidade.',
  excComunicar: 'Dessa forma, solicita-se que, após o integral cumprimento {{escolha:do contrato|do Pedido de Insumos}} nº {{numOperacao}}, a equipe responsável comunique a conclusão da operação, para que o bloqueio seja restabelecido no sistema, mitigando o risco de formalização de novas negociações sem a devida avaliação socioambiental.',
  excAnterior: 'Diante do exposto, considerando que a operação foi formalizada anteriormente ao apontamento que ensejou o bloqueio da área, presume-se que, à época de sua formalização, o imóvel atendia aos requisitos de elegibilidade então exigidos.',
  excSemRegularizar: 'Dessa forma, **o desbloqueio será realizado em caráter excepcional** e exclusivamente para possibilitar o cumprimento da operação já contratada, sem que isso represente a regularização da restrição atualmente existente.',
  excSuspenso: 'Ressalta-se que não estão autorizadas novas negociações, contratações ou vinculações envolvendo a área em questão enquanto o status do CAR permanecer “Suspenso”, sendo necessária a regularização cadastral para o restabelecimento de sua elegibilidade perante os critérios socioambientais aplicáveis.',
  excChamadoAberto: 'Por fim, este chamado permanecerá aberto. Solicita-se que, após a conclusão da operação vinculada ao {{escolha:Pedido de Insumos|Contrato}} nº {{numOperacao}}, a equipe responsável comunique o encerramento da entrega, para que o bloqueio da área seja restabelecido.',
  conCultivo: 'Diante do exposto, considerando que a análise das imagens de satélite confirmou a inexistência de áreas de cultivo de grãos na propriedade objeto desta avaliação, o que impossibilita seu enquadramento como área de formação de lavoura, e considerando, ainda, que o desbloqueio solicitado visa à {{escolha:continuidade da operação acima referida|formalização de nova operação}}, **o bloqueio deverá ser mantido.**',
  conPvg: 'Diante do exposto, verifica-se que a área em análise não está em conformidade socioambiental para negociações. Assim, **o bloqueio será mantido**, não sendo recomendadas negociações {{comEste}}, nesta área ou em áreas que não respeitem o raio de triangulação de 150 km previsto na política da companhia.',
  conLarVencido: 'Diante do exposto, considerando a existência da restrição ambiental apontada e a ausência de documento válido para sua regularização, **o bloqueio será mantido**, não sendo recomendadas negociações {{comEste}}, nesta área ou em áreas que não respeitem o raio de triangulação de 150 km previsto na política da companhia.',
  conProdes: 'Dessa forma, considerando que as áreas objeto da presente análise não atendem aos critérios de conformidade socioambiental atualmente adotados pela ADM, **o bloqueio será mantido**, não sendo recomendada sua vinculação a qualquer tipo de operação comercial, incluindo a comercialização de grãos, operações de originação ou negociações envolvendo insumos.',
  conBase: 'Diante do exposto, {{escolha:conclui-se que tanto {{sujeito}} quanto a área objeto da presente análise encontram-se em conformidade sob a ótica socioambiental, motivo pelo qual o desbloqueio foi devidamente realizado|considerando {{motivo}}, o bloqueio será mantido, não sendo recomendadas negociações {{comEste}} nesta área}}.',

  /* ---- 7 – Orientação ---- */
  monCapacidade: 'Ressalta-se, contudo, a importância do monitoramento contínuo da capacidade produtiva estimada da área, de modo a assegurar que os volumes comercializados e recebidos pela companhia permaneçam compatíveis com o potencial produtivo do imóvel rural.',
  monRastreabilidade: 'Tal procedimento contribui para a manutenção da rastreabilidade da produção, da coerência entre os volumes negociados e a capacidade produtiva da área e da conformidade socioambiental exigida pelas políticas e pelos procedimentos internos da companhia.',
  monTI: 'Recomenda-se, contudo, o monitoramento contínuo do cliente/fornecedor, a fim de identificar e reportar eventuais avanços no processo de demarcação da referida terra indígena.',
  oriAreas: 'Assim, orienta-se a apresentação de outras áreas de originação para análise, de modo que o volume negociado e a ser recebido pela companhia esteja devidamente respaldado por capacidade produtiva e regularidade socioambiental compatíveis com o montante da operação.',
  oriBase: '{{escolha:Assim, orienta-se a apresentação de {{documentoNecessario}}|Ressalta-se a importância de {{cuidado}}}}.',
};

/* Grupos de opções reutilizados */
const OP = {
  fundEmbargo: { grupo: 'Fundamentação', instrucao: 'mantenha apenas a opção aplicável.', opcoes: [
    { rotulo: 'Opção 1 – Embargo isolado (a área analisada é a mesma do embargo)', texto: TX.embIsolado },
    { rotulo: 'Opção 2 – Área de originação a mais de 150 km do embargo', texto: TX.emb150 },
  ] },
  operacao4: { grupo: 'Operação', instrucao: 'mantenha apenas a opção que corresponde ao chamado e apague as demais.', opcoes: [
    { rotulo: 'Opção 1 – Contrato fixo/balcão na alçada L', texto: TX.opAlcadaL },
    { rotulo: 'Opção 2 – Contrato fixo/balcão já gerado', texto: TX.opGerado },
    { rotulo: 'Opção 3 – Hedge para nova compra', texto: TX.opHedge },
    { rotulo: 'Opção 4 – Pedido de insumos', texto: TX.opInsumos },
  ] },
};

const OBS_CALC = 'Realizar o cálculo na Calculadora de Capacidade Produtiva.';

const MODELOS = [
  /* ===================== A. APROVADO – DESBLOQUEIO ===================== */
  {
    id: 'a-01', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Prospecção de clientes',
    titulo: 'CASO 1 – ANÁLISE DE PROSPECÇÃO DE CLIENTES – CLIENTE E ÁREA SEM BLOQUEIOS',
    quandoUsar: 'prospecção ou cadastro de cliente em que nem o CPF/CNPJ nem a área apresentam restrições.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idLimpo, TX.capUF, TX.conFavoravel, TX.monCapacidade, TX.monRastreabilidade],
  },
  {
    id: 'a-02', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Prospecção de clientes',
    titulo: 'CASO 2 – ANÁLISE DE PROSPECÇÃO DE CLIENTES – CLIENTE COM RESTRIÇÃO NO CPF/CNPJ E ÁREA DE ORIGINAÇÃO EM CONFORMIDADE',
    quandoUsar: 'prospecção em que o CPF/CNPJ tem embargo, mas o embargo está isolado da área de cultivo ou a área de originação fica a mais de 150 km do embargo.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idEmbargoCpf, OP.fundEmbargo, TX.capUF, TX.conFavDesbloqueio, TX.monCapacidade, TX.monRastreabilidade],
  },
  {
    id: 'a-03', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Prospecção de clientes',
    titulo: 'CASO 3 – ANÁLISE DE PROSPECÇÃO DE CLIENTES – CLIENTE SEM RESTRIÇÃO NO CPF/CNPJ E ÁREA DE ORIGINAÇÃO COM EMBARGO FEDERAL/ESTADUAL (IBAMA, ICMBio, SEMA-MT, SEMAD-GO E LDI-PA)',
    quandoUsar: 'prospecção em que o CPF/CNPJ está limpo, mas a área tem embargo e os polígonos embargados estão isolados da área de cultivo.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idEmbargoArea, TX.embIsolado, TX.capUF, TX.conFavDesbloqueio, TX.monCapacidade, TX.monRastreabilidade],
  },
  {
    id: 'a-04', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Operação em andamento',
    titulo: 'CASO 4 – OPERAÇÃO EM ANDAMENTO (CONTRATO FIXO/BALCÃO, HEDGE OU PEDIDO DE INSUMOS) – CLIENTE COM RESTRIÇÃO NO CPF/CNPJ E ÁREA DE ORIGINAÇÃO EM CONFORMIDADE',
    quandoUsar: 'mesma situação do Caso 2, mas o chamado se refere a uma operação (contrato, hedge ou pedido de insumos).',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idEmbargoCpf, OP.fundEmbargo, TX.capUF, OP.operacao4, TX.conFavOperacao],
  },
  {
    id: 'a-05', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Operação em andamento',
    titulo: 'CASO 5 – OPERAÇÃO EM ANDAMENTO (CONTRATO FIXO/BALCÃO, HEDGE OU PEDIDO DE INSUMOS) – CLIENTE SEM RESTRIÇÃO NO CPF/CNPJ E ÁREA DE ORIGINAÇÃO COM EMBARGO FEDERAL/ESTADUAL (IBAMA, ICMBio, SEMA-MT, SEMAD-GO E LDI-PA)',
    quandoUsar: 'mesma situação do Caso 3, mas o chamado se refere a uma operação (contrato, hedge ou pedido de insumos).',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idEmbargoArea, TX.embIsolado, TX.capUF, OP.operacao4, TX.conFavOperacao],
  },
  {
    id: 'a-06', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Demais casos',
    titulo: 'CASO 6 – SOBREPOSIÇÃO COM TERRA INDÍGENA COM STATUS “DECLARADA”',
    quandoUsar: 'a área foi bloqueada por sobreposição com Terra Indígena que ainda não está homologada (status “Declarada”).',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idTI, TX.tiPolitica, TX.tiDeclarada, TX.capUF, OP.operacao4, TX.conFavOperacao, TX.monTI],
  },
  {
    id: 'a-07', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Demais casos',
    titulo: 'CASO 7 – EMBARGOS DE TERCEIROS EM ÁREA DE ASSENTAMENTO',
    quandoUsar: 'o imóvel do cliente está dentro de um assentamento e o bloqueio decorre de embargos de terceiros vinculados ao CAR do assentamento.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idAssentamento, TX.assentamento, TX.capUF, OP.operacao4, TX.conFavOperacao],
  },
  {
    id: 'a-08', categoria: 'aprovado', status: 'aprovado', subcategoria: 'Demais casos',
    titulo: 'CASO 8 – PROTOCOLO VERDE DOS GRÃOS DO PARÁ (PVG) – DESMATAMENTO SUPERIOR A 25 HECTARES – LAR VÁLIDO APRESENTADO',
    quandoUsar: 'área no Pará com restrição do PVG, em que o cliente apresentou Licenciamento Ambiental Rural (LAR) dentro da validade.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idPvgLar, TX.pvgRegularizacao, TX.pvgLarValido, TX.pvgApta, TX.capPA, OP.operacao4, TX.conFavLar],
  },

  /* ============ B. DESBLOQUEIO EXCEPCIONAL – OPERAÇÃO FORMALIZADA ============ */
  {
    id: 'b-09', categoria: 'excepcional', status: 'excepcional',
    titulo: 'CASO 9 – RESTRIÇÃO AMBIENTAL (EMBARGO FEDERAL/ESTADUAL, PVG, AUSÊNCIA DE ÁREA DE CULTIVO OU PRODES 2025) – OPERAÇÃO JÁ FORMALIZADA',
    quandoUsar: 'a área tem restrição que, em regra, mantém o bloqueio, mas existe contrato ou pedido de insumos já formalizado e em execução. Se precisar detalhar a restrição, copie o parágrafo de fundamentação do caso correspondente da seção C (painel de trechos, bloco 3).',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [
      TX.idExcepcional, TX.capUF,
      { grupo: 'Operação', instrucao: 'mantenha apenas a opção que corresponde ao chamado e apague a outra.', opcoes: [
        { rotulo: 'Opção 1 – Contrato fixo/balcão', texto: TX.opExcContrato },
        { rotulo: 'Opção 2 – Pedido de insumos', texto: TX.opExcInsumos },
      ] },
      TX.excPontual, TX.excVedadas, TX.excComunicar,
    ],
  },
  {
    id: 'b-10', categoria: 'excepcional', status: 'excepcional',
    titulo: 'CASO 10 – CAR COM STATUS “SUSPENSO” OU “CANCELADO” – OPERAÇÃO JÁ FORMALIZADA',
    quandoUsar: 'o CAR da área está suspenso ou cancelado, mas a operação foi formalizada antes do apontamento que gerou o bloqueio.',
    fonte: 'Word',
    paragrafos: [
      TX.idCarStatus, TX.carBcb, TX.carStatusPolitica,
      { grupo: 'Operação', instrucao: 'mantenha apenas a opção que corresponde ao chamado e apague a outra.', opcoes: [
        { rotulo: 'Opção 1 – Pedido de insumos', texto: TX.opCarInsumos },
        { rotulo: 'Opção 2 – Contrato', texto: TX.opCarContrato },
      ] },
      TX.excAnterior, TX.excSemRegularizar,
      { se: 'carStatus=Suspenso', rotulo: 'Somente para CAR “Suspenso”', texto: TX.excSuspenso },
      TX.excChamadoAberto,
    ],
  },

  /* ========================= C. BLOQUEIO MANTIDO ========================= */
  {
    id: 'c-11', categoria: 'mantido', status: 'mantido',
    titulo: 'CASO 11 – AUSÊNCIA DE ÁREA DE CULTIVO – NOVAS NEGOCIAÇÕES',
    quandoUsar: 'o CPF/CNPJ não tem restrições, mas as imagens de satélite não comprovam o mínimo de 10% da área destinado ao cultivo de grãos.',
    fonte: 'Word',
    paragrafos: [
      TX.idCultivo, TX.cultivoSatelite,
      { grupo: 'Operação', instrucao: 'mantenha apenas a opção que corresponde ao chamado e apague as demais.', opcoes: [
        { rotulo: 'Opção 1 – Contrato fixo/balcão na alçada L', texto: TX.opAlcadaL },
        { rotulo: 'Opção 2 – Hedge para nova compra', texto: TX.opHedge },
      ] },
      TX.conCultivo, TX.oriAreas,
    ],
  },
  {
    id: 'c-12', categoria: 'mantido', status: 'mantido',
    titulo: 'CASO 12 – PROTOCOLO VERDE DOS GRÃOS DO PARÁ (PVG) – RESTRIÇÃO NA ÁREA DE ORIGINAÇÃO',
    quandoUsar: 'área no Pará com desmatamento acima do limite do PVG (25 hectares), sem apresentação de documento de regularização.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idPvg, TX.naoApta, TX.pvgRegularizacao, TX.capPAInfo, TX.conPvg],
  },
  {
    id: 'c-13', categoria: 'mantido', status: 'mantido',
    titulo: 'CASO 13 – PROTOCOLO VERDE DOS GRÃOS DO PARÁ (PVG) – LICENCIAMENTO AMBIENTAL RURAL (LAR) VENCIDO',
    quandoUsar: 'mesma restrição do Caso 12, mas o cliente apresentou LAR vencido, sem protocolo de renovação ou com protocolo fora do prazo legal de 120 dias.',
    obs: [OBS_CALC], fonte: 'Word',
    paragrafos: [TX.idPvg, TX.naoApta, TX.larVencido, TX.lar120, TX.larEficacia, TX.larSancoes, TX.capPAInfo, TX.conLarVencido],
  },
  {
    id: 'c-14', categoria: 'mantido', status: 'mantido',
    titulo: 'CASO 14 – PRODES 2025 – DESMATAMENTO SOBREPOSTO À CAMADA DE SOJA',
    quandoUsar: 'a área apresenta desmatamento identificado no PRODES/INPE sobreposto à camada de soja. A restrição decorre de política global da ADM e não pode ser regularizada com documentos.',
    fonte: 'Word',
    paragrafos: [TX.prodesDiretriz, TX.prodesPolitica, TX.prodesSemRegularizacao, TX.conProdes],
  },
  {
    id: 'c-nova-area', categoria: 'mantido', status: 'mantido',
    titulo: 'EMBARGO FEDERAL/ESTADUAL EM NOVA ÁREA INDICADA – DIVERSA DA ÁREA VINCULADA NA OPERAÇÃO – NÃO ISOLADO DA ÁREA DE CULTIVO',
    quandoUsar: 'foi indicada uma nova área (diferente da vinculada à operação) e o embargo dessa área não está isolado do cultivo, com indícios de plantio na última safra dentro da área embargada.',
    fonte: 'Trechos fundamentados',
    paragrafos: [
      { opcional: 'Identificação e situação da área (texto do Caso 3)', texto: TX.idEmbargoArea, incluido: true },
      TX.novaArea1, TX.novaArea2, TX.novaArea3, TX.novaArea4, TX.novaArea5, TX.novaArea6, TX.novaArea7, TX.novaArea8, TX.novaArea9,
    ],
  },

  /* ============== D. PROCEDIMENTOS OPERACIONAIS E CADASTRAIS ============== */
  {
    id: 'd-washout', categoria: 'procedimento', status: 'desbloqueio',
    titulo: 'OPERAÇÕES ENVOLVENDO CONTRATAÇÃO DE VOLUME OU WASHOUT DE ALGODÃO – DESBLOQUEIO SEM ANÁLISE SOCIOAMBIENTAL',
    quandoUsar: 'o chamado pede desbloqueio para operação de washout ou contratação de volume de algodão, que não passa pela análise socioambiental.',
    fonte: 'Trechos fundamentados',
    paragrafos: [TX.washout1, TX.washout2, TX.washout3, TX.washout4],
  },
  {
    id: 'd-reenquadramento', categoria: 'procedimento', status: 'reclassificacao',
    titulo: 'REENQUADRAMENTO DE CLIENTE DIRETO PARA INDIRETO',
    quandoUsar: 'empresa cadastrada como cliente DIRETO cuja atividade (CNAE principal e secundárias) indica perfil de cliente INDIRETO.',
    obs: ['Os parágrafos “Se for o caso inserir” estão no painel “Dados do caso”, em Opções do texto.'],
    fonte: 'Trechos fundamentados',
    padroes: { tipoPessoa: 'PJ' },
    paragrafos: [
      TX.reenqId, TX.reenq2,
      { opcional: 'Se for o caso: CNPJ sem restrições – impedimento pela ausência de CAR', texto: TX.reenqSemCar },
      { opcional: 'Se for o caso: finalidade – operação com farelo de soja', texto: TX.reenqFarelo },
      TX.reenq3, TX.reenq4,
    ],
  },

  /* ============================ MODELO-BASE ============================ */
  {
    id: 'base', categoria: 'base', status: '',
    titulo: '4. MODELO-BASE PARA CASOS NÃO PREVISTOS',
    quandoUsar: 'marque o status no painel “Dados do caso” e preencha cada bloco na ordem da estrutura padrão (seção 2). Fundamentação e orientação devem ser redigidas conforme o caso concreto.',
    fonte: 'Word',
    paragrafos: [
      { rotulo: '1 e 2 – Identificação e situação da área', bloco: 1 }, TX.idBase,
      { rotulo: '3 – Fundamentação', bloco: 3 }, TX.fundBase,
      { rotulo: '4 – Capacidade produtiva (quando aplicável)', bloco: 4 }, TX.capBase,
      { rotulo: '5 – Operação (quando houver)', bloco: 5 }, TX.opBase,
      { rotulo: '6 – Conclusão', bloco: 6 }, TX.conBase,
      { rotulo: '7 – Orientação', bloco: 7 }, TX.oriBase,
    ],
  },
];

/* =====================================================================
   TRECHOS REUTILIZÁVEIS (painel à direita do Editor)
   "blocos": em quais blocos da estrutura padrão o trecho se encaixa (1 a 7).
   "categoria" (opcional): agrupamento próprio; sem ela, o trecho aparece
   sob o nome do primeiro bloco. Um trecho tem "texto" (um parágrafo) ou
   "paragrafos" (vários, no mesmo formato dos MODELOS).
   ===================================================================== */
const TRECHOS = [
  /* 1 e 2 – Identificação e situação da área */
  { id: 'id-limpo', blocos: [1, 2], titulo: 'Cliente e área sem restrições', fonte: 'A – Caso 1', texto: TX.idLimpo },
  { id: 'id-emb-cpf', blocos: [1, 2], titulo: 'Embargo vinculado ao CPF/CNPJ (clifor bloqueado)', fonte: 'A – Casos 2 e 4', texto: TX.idEmbargoCpf },
  { id: 'id-emb-area', blocos: [1, 2], titulo: 'CPF/CNPJ sem restrição – área com embargo', fonte: 'A – Casos 3 e 5', texto: TX.idEmbargoArea },
  { id: 'id-ti', blocos: [1, 2], titulo: 'Sobreposição com Terra Indígena “Declarada”', fonte: 'A – Caso 6', texto: TX.idTI },
  { id: 'id-assent', blocos: [1, 2], titulo: 'Triangulação com embargos do assentamento', fonte: 'A – Caso 7', texto: TX.idAssentamento },
  { id: 'id-pvg-lar', blocos: [1, 2], titulo: 'Restrição PVG vinculada ao CPF/CNPJ', fonte: 'A – Caso 8', texto: TX.idPvgLar },
  { id: 'id-exc', blocos: [1, 2], titulo: 'Restrição na área – operação já formalizada', fonte: 'B – Caso 9', texto: TX.idExcepcional },
  { id: 'id-car', blocos: [1, 2], titulo: 'CAR com status Suspenso/Cancelado', fonte: 'B – Caso 10', texto: TX.idCarStatus },
  { id: 'id-cultivo', blocos: [1, 2], titulo: 'Ausência de comprovação de 10% de cultivo', fonte: 'C – Caso 11', texto: TX.idCultivo },
  { id: 'id-pvg', blocos: [1, 2], titulo: 'Desmatamento PVG na própria área (Pará)', fonte: 'C – Casos 12 e 13', texto: TX.idPvg },
  { id: 'id-base', blocos: [1, 2], titulo: 'Identificação e situação – modelo-base', fonte: 'Modelo-base', texto: TX.idBase },

  /* 3 – Fundamentação */
  { id: 'emb-iso', blocos: [3], titulo: 'Embargo isolado da área de cultivo', fonte: 'A – Casos 2 a 5', texto: TX.embIsolado },
  { id: 'emb-150', blocos: [3], titulo: 'Área de originação a mais de 150 km do embargo', fonte: 'A – Casos 2 e 4', texto: TX.emb150 },
  { id: 'ti-pol', blocos: [3], titulo: 'Terra Indígena – só “Homologada” bloqueia', fonte: 'A – Caso 6', texto: TX.tiPolitica },
  { id: 'ti-decl', blocos: [3], titulo: 'Terra Indígena “Declarada” – área em conformidade', fonte: 'A – Caso 6', texto: TX.tiDeclarada },
  { id: 'assent', blocos: [3], titulo: 'CAR de assentamento – passivos de terceiros', fonte: 'A – Caso 7', texto: TX.assentamento },
  { id: 'pvg-reg', blocos: [3], titulo: 'PVG – documentos para regularização (LAR/PRAD)', fonte: 'A – Caso 8; C – Caso 12', texto: TX.pvgRegularizacao },
  { id: 'pvg-lar-ok', blocos: [3], titulo: 'PVG – LAR válido apresentado', fonte: 'A – Caso 8', texto: TX.pvgLarValido },
  { id: 'pvg-apta', blocos: [3], titulo: 'Área regularizada e apta', fonte: 'A – Caso 8', texto: TX.pvgApta },
  { id: 'car-bcb', blocos: [3], titulo: 'CAR Suspenso/Cancelado – política e Resolução BCB nº 140/2021', fonte: 'B – Caso 10', texto: TX.carBcb },
  { id: 'car-status', blocos: [3], titulo: 'CAR – somente status Ativo ou Pendente', fonte: 'B – Caso 10', texto: TX.carStatusPolitica },
  { id: 'cultivo-sat', blocos: [3], titulo: 'Imagens de satélite sem áreas de cultivo', fonte: 'C – Caso 11', texto: TX.cultivoSatelite },
  { id: 'nao-apta', blocos: [3], titulo: 'Área não atende aos critérios de compliance', fonte: 'C – Casos 12 e 13', texto: TX.naoApta },
  { id: 'lar-venc', blocos: [3], titulo: 'LAR vencido apresentado', fonte: 'C – Caso 13', texto: TX.larVencido },
  { id: 'lar-120', blocos: [3], titulo: 'LAR – renovação com 120 dias (LC 140/2011 e CONAMA 237/1997)', fonte: 'C – Caso 13', texto: TX.lar120 },
  { id: 'lar-efic', blocos: [3], titulo: 'LAR – perda de eficácia', fonte: 'C – Caso 13', texto: TX.larEficacia },
  { id: 'lar-sanc', blocos: [3], titulo: 'LAR – atividade sem licenciamento', fonte: 'C – Caso 13', texto: TX.larSancoes },
  { id: 'prodes-1', blocos: [3], titulo: 'PRODES – diretriz da Diretoria de Sustentabilidade', fonte: 'C – Caso 14', texto: TX.prodesDiretriz },
  { id: 'prodes-2', blocos: [3], titulo: 'PRODES – Política Global (compromisso voluntário)', fonte: 'C – Caso 14', texto: TX.prodesPolitica },
  { id: 'prodes-3', blocos: [3], titulo: 'PRODES – sem regularização por documentos', fonte: 'C – Caso 14', texto: TX.prodesSemRegularizacao },
  { id: 'fund-base', blocos: [3], titulo: 'Fundamentação – a redigir (modelo-base)', fonte: 'Modelo-base', texto: TX.fundBase },

  /* Trechos fundamentados (enviados pela área) */
  { id: 'tf-apa', blocos: [3], categoria: 'Trechos fundamentados', titulo: 'Unidade de Conservação – APA (uso sustentável) – desbloqueada', fonte: 'Trechos fundamentados',
    paragrafos: [TX.apa1, TX.apa2] },
  { id: 'tf-art54', blocos: [3], categoria: 'Trechos fundamentados', titulo: 'Embargo não isolado – multa do art. 54 do Decreto nº 6.514/2008', fonte: 'Trechos fundamentados',
    paragrafos: [TX.art54Intro, TX.art54Texto, TX.art54Pena] },
  { id: 'tf-ibama-doc', blocos: [3, 6], categoria: 'Trechos fundamentados', titulo: 'Embargo IBAMA não isolado – documentação estadual não regulariza (com conclusão)', fonte: 'Trechos fundamentados',
    paragrafos: [TX.ibamaDoc1, TX.ibamaDoc2, TX.ibamaDoc3, TX.ibamaDoc4, TX.ibamaDoc5, TX.ibamaDoc6, TX.ibamaDoc7] },
  { id: 'tf-ibama-fund', blocos: [3], categoria: 'Trechos fundamentados', titulo: 'Embargo IBAMA – documentação estadual não regulariza (só fundamentação)', fonte: 'Trechos fundamentados',
    paragrafos: [TX.ibamaDoc1, TX.ibamaDoc2, TX.ibamaDoc3, TX.ibamaDoc4, TX.ibamaDoc5] },
  { id: 'tf-nova-area', blocos: [3, 6], categoria: 'Trechos fundamentados', titulo: 'Embargo em nova área indicada – não isolado do cultivo (com conclusão)', fonte: 'Trechos fundamentados',
    paragrafos: [TX.novaArea1, TX.novaArea2, TX.novaArea3, TX.novaArea4, TX.novaArea5, TX.novaArea6, TX.novaArea7, TX.novaArea8, TX.novaArea9] },
  { id: 'tf-washout', blocos: [5, 6], categoria: 'Trechos fundamentados', titulo: 'Washout / contratação de volume de algodão – desbloqueio sem análise', fonte: 'Trechos fundamentados',
    paragrafos: [TX.washout1, TX.washout2, TX.washout3, TX.washout4] },
  { id: 'tf-reenq', blocos: [1, 3, 6], categoria: 'Trechos fundamentados', titulo: 'Reenquadramento de cliente DIRETO para INDIRETO', fonte: 'Trechos fundamentados',
    paragrafos: [TX.reenqId, TX.reenq2, TX.reenq3, TX.reenq4] },
  { id: 'tf-reenq-car', blocos: [3], categoria: 'Trechos fundamentados', titulo: 'Reenquadramento – impedimento pela ausência de CAR', fonte: 'Trechos fundamentados', texto: TX.reenqSemCar },
  { id: 'tf-reenq-farelo', blocos: [5], categoria: 'Trechos fundamentados', titulo: 'Reenquadramento – operação com farelo de soja', fonte: 'Trechos fundamentados', texto: TX.reenqFarelo },

  /* 4 – Capacidade produtiva */
  { id: 'cap-uf', blocos: [4], titulo: 'Capacidade produtiva – Estado de [UF]', fonte: 'A – Casos 1 a 7; B – Caso 9', texto: TX.capUF },
  { id: 'cap-pa', blocos: [4], titulo: 'Capacidade produtiva – Pará (Adicionalmente)', fonte: 'A – Caso 8', texto: TX.capPA },
  { id: 'cap-pa-info', blocos: [4], titulo: 'Capacidade produtiva – Pará (A título de informação)', fonte: 'C – Casos 12 e 13', texto: TX.capPAInfo },
  { id: 'cap-base', blocos: [4], titulo: 'Capacidade produtiva – modelo-base', fonte: 'Modelo-base', texto: TX.capBase },

  /* 5 – Operação */
  { id: 'op-alcada', blocos: [5], titulo: 'Contrato fixo/balcão na alçada L', fonte: 'A – Casos 4 a 8; C – Caso 11', texto: TX.opAlcadaL },
  { id: 'op-gerado', blocos: [5], titulo: 'Contrato fixo/balcão já gerado', fonte: 'A – Casos 4 a 8', texto: TX.opGerado },
  { id: 'op-hedge', blocos: [5], titulo: 'Hedge para nova compra', fonte: 'A – Casos 4 a 8; C – Caso 11', texto: TX.opHedge },
  { id: 'op-insumos', blocos: [5], titulo: 'Pedido de insumos', fonte: 'A – Casos 4 a 8', texto: TX.opInsumos },
  { id: 'op-exc-contrato', blocos: [5], titulo: 'Contrato já formalizado (desbloqueio excepcional)', fonte: 'B – Caso 9', texto: TX.opExcContrato },
  { id: 'op-exc-insumos', blocos: [5], titulo: 'Pedido de insumos já formalizado (desbloqueio excepcional)', fonte: 'B – Caso 9', texto: TX.opExcInsumos },
  { id: 'op-car-insumos', blocos: [5], titulo: 'Pedido de insumos – entrega na fazenda (CAR Suspenso/Cancelado)', fonte: 'B – Caso 10', texto: TX.opCarInsumos },
  { id: 'op-car-contrato', blocos: [5], titulo: 'Contrato fixo (CAR Suspenso/Cancelado)', fonte: 'B – Caso 10', texto: TX.opCarContrato },
  { id: 'op-base', blocos: [5], titulo: 'Operação – a descrever (modelo-base)', fonte: 'Modelo-base', texto: TX.opBase },

  /* 6 – Conclusão */
  { id: 'con-fav', blocos: [6], titulo: 'Favorável – prospecção', fonte: 'A – Caso 1', texto: TX.conFavoravel },
  { id: 'con-fav-desb', blocos: [6], titulo: 'Favorável – com desbloqueio', fonte: 'A – Casos 2 e 3', texto: TX.conFavDesbloqueio },
  { id: 'con-fav-op', blocos: [6], titulo: 'Favorável – operação em andamento', fonte: 'A – Casos 4 a 7', texto: TX.conFavOperacao },
  { id: 'con-fav-lar', blocos: [6], titulo: 'Favorável – licenciamento vigente', fonte: 'A – Caso 8', texto: TX.conFavLar },
  { id: 'exc-pontual', blocos: [6], categoria: 'Desbloqueio excepcional', titulo: 'Desbloqueio excepcional e pontual', fonte: 'B – Caso 9', texto: TX.excPontual },
  { id: 'exc-vedadas', blocos: [6, 7], categoria: 'Desbloqueio excepcional', titulo: 'Novas negociações permanecem vedadas', fonte: 'B – Caso 9', texto: TX.excVedadas },
  { id: 'exc-comunicar', blocos: [7], categoria: 'Desbloqueio excepcional', titulo: 'Comunicar conclusão para restabelecer o bloqueio', fonte: 'B – Caso 9', texto: TX.excComunicar },
  { id: 'exc-anterior', blocos: [6], categoria: 'Desbloqueio excepcional', titulo: 'Operação formalizada antes do apontamento', fonte: 'B – Caso 10', texto: TX.excAnterior },
  { id: 'exc-sem-reg', blocos: [6], categoria: 'Desbloqueio excepcional', titulo: 'Desbloqueio sem regularização da restrição', fonte: 'B – Caso 10', texto: TX.excSemRegularizar },
  { id: 'exc-suspenso', blocos: [7], categoria: 'Desbloqueio excepcional', titulo: 'CAR Suspenso – novas negociações não autorizadas', fonte: 'B – Caso 10', texto: TX.excSuspenso },
  { id: 'exc-aberto', blocos: [7], categoria: 'Desbloqueio excepcional', titulo: 'Chamado permanecerá aberto', fonte: 'B – Caso 10', texto: TX.excChamadoAberto },
  { id: 'con-cultivo', blocos: [6], titulo: 'Bloqueio mantido – ausência de cultivo', fonte: 'C – Caso 11', texto: TX.conCultivo },
  { id: 'con-pvg', blocos: [6], titulo: 'Bloqueio mantido – PVG', fonte: 'C – Caso 12', texto: TX.conPvg },
  { id: 'con-lar', blocos: [6], titulo: 'Bloqueio mantido – LAR vencido', fonte: 'C – Caso 13', texto: TX.conLarVencido },
  { id: 'con-prodes', blocos: [6], titulo: 'Bloqueio mantido – PRODES', fonte: 'C – Caso 14', texto: TX.conProdes },
  { id: 'con-base', blocos: [6], titulo: 'Conclusão – modelo-base', fonte: 'Modelo-base', texto: TX.conBase },

  /* 7 – Orientação */
  { id: 'mon-cap', blocos: [7], titulo: 'Monitoramento contínuo da capacidade produtiva', fonte: 'A – Casos 1 a 3', texto: TX.monCapacidade },
  { id: 'mon-rastr', blocos: [7], titulo: 'Rastreabilidade e coerência dos volumes', fonte: 'A – Casos 1 a 3', texto: TX.monRastreabilidade },
  { id: 'mon-ti', blocos: [7], titulo: 'Monitoramento – demarcação da Terra Indígena', fonte: 'A – Caso 6', texto: TX.monTI },
  { id: 'ori-areas', blocos: [7], titulo: 'Apresentar outras áreas de originação', fonte: 'C – Caso 11', texto: TX.oriAreas },
  { id: 'ori-base', blocos: [7], titulo: 'Orientação – modelo-base', fonte: 'Modelo-base', texto: TX.oriBase },

  /* Estrutura completa */
  { id: 'base-completo', blocos: [], categoria: 'Modelo-base (estrutura padrão)', titulo: 'Modelo-base completo – blocos 1 a 7', fonte: 'Modelo-base (seção 4 do Word)',
    paragrafos: MODELOS.find((m) => m.id === 'base').paragrafos },
];

/* Pendências para validação humana. Os textos NÃO foram corrigidos. */
const PENDENCIAS_WORD = [
  { id: 'p01', modelos: [], descricao: 'O novo Word começa na seção 2: a seção 1 (orientações de preenchimento) não está no arquivo. O Guia mantém as orientações da versão anterior.' },
  { id: 'p03', modelos: ['c-14'], descricao: 'O Caso 14 não tem parágrafo de identificação e situação da área: começa em “Conforme diretriz…” e fala em “as áreas objeto da presente análise” (plural). Se necessário, insira a identificação pelo painel de trechos (bloco 1 e 2).' },
  { id: 'p04', modelos: ['a-08', 'c-12', 'c-13'], descricao: 'Os textos usam “Licenciamento Ambiental Rural (LAR)” com concordância masculina (“LAR válido/vencido”). A revisão anterior sugeria “Licença de Atividade Rural (LAR)”. Confirmar a nomenclatura com a SEMAS-PA.' },
  { id: 'p05', modelos: ['c-11'], descricao: '“Quando usar” do Caso 11: “o mínimo de 10% da área destinado ao cultivo” (concordância).' },
  { id: 'p06', modelos: ['b-09', 'b-10'], descricao: 'Os campos “[Nº]” da comunicação final (contrato ou pedido) usam o campo “Nº do contrato/pedido (comunicação final)”, separado do nº do contrato e do nº do pedido.' },
  { id: 'p07', modelos: ['base'], descricao: 'No modelo-base, as alternativas longas trazem campos dentro delas (MOTIVO, o produtor / a empresa…). Enquanto não forem escolhidas, aparecem como no Word; depois de escolhidas, os campos vazios aparecem entre colchetes.' },
  { id: 'p08', modelos: ['d-washout', 'd-reenquadramento'], descricao: 'Trechos enviados pela área: título “CONTATAÇÃO DE VOLUME” (contratação); “A validação e a confirmação dessa alteração é conduzidas” (são conduzidas).' },
  { id: 'p09', modelos: [], descricao: 'Trecho “Embargo IBAMA não isolado – documentação…”: a frase “Todavia, os documentos anexados consistem em ____” não tem ponto final; “150km” sem espaço (o Word usa “150 km”); conclui “não recomendamos”, em 1ª pessoa, enquanto os modelos usam linguagem impessoal.' },
  { id: 'p10', modelos: ['c-nova-area'], descricao: 'Modelo “Embargo em nova área”: o texto dizia “embargo ambiental estadual”, mas o título é “FEDERAL/ESTADUAL” — virou o campo [federal / estadual]. O texto enviado não tinha identificação: a ferramenta inclui a do Caso 3 como parágrafo opcional. “Em análise das imagens” (os modelos do Word usam “Em análise às imagens”). O negrito em “o bloqueio será mantido” foi aplicado pela regra da estrutura (decisão em negrito).' },
  { id: 'p11', modelos: [], descricao: 'O art. 54 aparece com duas redações nos trechos enviados (“…objeto de embargo.” + “Penalidade: multa…” e “…objeto de embargo:” + “Multa…”). Ambas foram mantidas.' },
  { id: 'p12', modelos: [], descricao: 'Trecho APA: o texto citava “APA Serra da Tabatinga”. Virou o campo “Unidade de Conservação (APA)”, que já vem preenchido com esse nome e pode ser trocado.' },
  { id: 'p13', modelos: ['d-reenquadramento'], descricao: 'Reenquadramento: “farelo de soja” está fixo no parágrafo opcional de finalidade; ajuste no texto se for outro produto.' },
];

/* Guia: estrutura do Word, guia rápido e orientações (somente consulta). */
const GUIA = {
  orientacoes: [
    'Os campos entre colchetes e destacados em amarelo, como [MUNICÍPIO/UF], devem ser substituídos pela informação do caso analisado. Na ferramenta, os campos parametrizados são preenchidos no painel “Dados do caso” e aplicados ao texto todo.',
    'Quando houver alternativas separadas por barra, como [O produtor / A empresa], mantenha apenas a opção aplicável. Na ferramenta, “O produtor”/“A empresa”, “CPF”/“CNPJ” e “com este produtor”/“com esta empresa” saem do campo Tipo de pessoa.',
    'Se a análise envolver mais de uma área ou CAR, ajuste a concordância para o plural (as áreas indicadas, localizadas, registradas nos CARs nº...).',
    'Números: use ponto como separador de milhar (130.290 kg) e um espaço entre o número e a unidade (150 km, 25 hectares).',
    'Os quadros “Quando usar” e “Obs.” são apenas orientações internas e não entram no parecer, assim como os destaques coloridos.',
    'Trechos destacados em azul, como !!este!!, precisam de validação da área responsável antes do uso.',
  ],
  estruturaIntro: 'Todos os modelos seguem a mesma sequência. Use-a também ao redigir casos não previstos (seção 4).',
  estrutura: [
    ['#', 'Bloco', 'Conteúdo', 'Uso'],
    ['1', 'Identificação', 'Produtor/empresa e se há ou não restrição vinculada ao CPF/CNPJ.', 'Obrigatório'],
    ['2', 'Situação da área', 'Município/UF, nº do CAR e motivo do bloqueio.', 'Obrigatório'],
    ['3', 'Fundamentação', 'Análise realizada (imagens de satélite, documentos, bases) e a norma, protocolo ou política aplicável.', 'Obrigatório'],
    ['4', 'Capacidade produtiva', 'Área produtiva, fator CONAB e produção estimada em kg, toneladas e sacas.', 'Quando aplicável'],
    ['5', 'Operação', 'O que foi pedido no chamado (contrato, hedge ou pedido de insumos).', 'Quando houver'],
    ['6', 'Conclusão', 'Iniciada por “Diante do exposto”, com a decisão em negrito.', 'Obrigatório'],
    ['7', 'Orientação', 'Próximos passos, documentos necessários ou cuidados na operação.', 'Recomendado'],
  ],
  guiaRapido: [
    ['Caso', 'Situação', 'Status'],
    ['A. Aprovado – desbloqueio'],
    ['1', 'Prospecção ou cadastro de cliente em que nem o CPF/CNPJ nem a área apresentam restrições.', 'Aprovado'],
    ['2', 'Prospecção em que o CPF/CNPJ tem embargo, mas o embargo está isolado da área de cultivo ou a área de originação fica a mais de 150 km do embargo.', 'Aprovado'],
    ['3', 'Prospecção em que o CPF/CNPJ está limpo, mas a área tem embargo e os polígonos embargados estão isolados da área de cultivo.', 'Aprovado'],
    ['4', 'Mesma situação do Caso 2, mas o chamado se refere a uma operação (contrato, hedge ou pedido de insumos).', 'Aprovado'],
    ['5', 'Mesma situação do Caso 3, mas o chamado se refere a uma operação (contrato, hedge ou pedido de insumos).', 'Aprovado'],
    ['6', 'A área foi bloqueada por sobreposição com Terra Indígena que ainda não está homologada (status “Declarada”).', 'Aprovado'],
    ['7', 'O imóvel do cliente está dentro de um assentamento e o bloqueio decorre de embargos de terceiros vinculados ao CAR do assentamento.', 'Aprovado'],
    ['8', 'Área no Pará com restrição do PVG, em que o cliente apresentou Licenciamento Ambiental Rural (LAR) dentro da validade.', 'Aprovado'],
    ['B. Desbloqueio excepcional'],
    ['9', 'A área tem restrição que, em regra, mantém o bloqueio, mas existe contrato ou pedido de insumos já formalizado e em execução.', 'Aprovado (excepcional)'],
    ['10', 'O CAR da área está suspenso ou cancelado, mas a operação foi formalizada antes do apontamento que gerou o bloqueio.', 'Aprovado (excepcional)'],
    ['C. Bloqueio mantido'],
    ['11', 'O CPF/CNPJ não tem restrições, mas as imagens de satélite não comprovam o mínimo de 10% da área destinado ao cultivo de grãos.', 'Bloqueio mantido'],
    ['12', 'Área no Pará com desmatamento acima do limite do PVG (25 hectares), sem apresentação de documento de regularização.', 'Bloqueio mantido'],
    ['13', 'Mesma restrição do Caso 12, mas o cliente apresentou LAR vencido, sem protocolo de renovação ou com protocolo fora do prazo legal de 120 dias.', 'Bloqueio mantido'],
    ['14', 'A área apresenta desmatamento identificado no PRODES/INPE sobreposto à camada de soja.', 'Bloqueio mantido'],
  ],
};
