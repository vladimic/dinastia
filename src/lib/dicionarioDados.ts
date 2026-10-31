// Dicionário de dados do Dinastia: fonte única das descrições de tabelas e campos.
// Usado na planilha "Exportar Excel" (abas Dicionário e Relacionamentos), no documento docs/modelo-de-dados.md
// (gerado por scripts/gerar_docs.mts) e nos comentários do banco (migração 0027).
// Ao mudar uma tabela do banco, atualize aqui na mesma entrega.

export type CampoDic = {
  nome: string;
  tipo: string;
  /** "sim" = obrigatório (não aceita vazio) */
  obrig: boolean;
  /** PK = chave primária; UK = único; FK→tabela.campo = chave estrangeira */
  chave?: string;
  descricao: string;
};

export type TabelaDic = {
  tabela: string;
  grupo: "Cadastros de apoio" | "Grupos e assembleias" | "Importação de PDFs" | "Acesso";
  descricao: string;
  colunas: CampoDic[];
};

const t = (nome: string, tipo: string, obrig: boolean, descricao: string, chave?: string): CampoDic => ({ nome, tipo, obrig, descricao, chave });
const criado = t("criado_em", "data e hora", true, "Quando a linha foi criada (automático).");
const atualizado = t("atualizado_em", "data e hora", true, "Última alteração da linha (automático).");

export const DICIONARIO: TabelaDic[] = [
  {
    tabela: "parametros_gerais",
    grupo: "Cadastros de apoio",
    descricao: "Parâmetros globais do sistema. Tem sempre uma única linha (id = 1). Tela: Cadastros › Parâmetros globais (só administrador altera).",
    colunas: [
      t("id", "inteiro", true, "Sempre 1: a tabela guarda uma linha só.", "PK"),
      t("seguro_padrao_pct", "número decimal", false, "Seguro prestamista, em % do crédito ao mês, usado no cálculo de todos os grupos."),
      atualizado,
      t("incc_pct_ano", "número decimal", true, "INCC projetado (imóveis), em % ao ano, com que o simulador abre (o simulador pode alterar na tela, sem mudar o parâmetro)."),
      t("inpc_pct_ano", "número decimal", true, "INPC projetado (veículos), em % ao ano, com que o simulador abre (padrão 5)."),
      t("contemplacao_meses", "inteiro", true, "Mês de contemplação com que o simulador abre (imóveis e veículos)."),
      t("lance_livre_parcelas", "inteiro", true, "Imóveis: parcelas do lance livre com que o simulador abre."),
      t("lance_fidelidade_parcelas", "inteiro", true, "Imóveis: parcelas do lance fidelidade com que o simulador abre."),
      t("parcela_minima_padrao_pct", "número decimal", true, "Veículos: parcela mínima após a contemplação por lance (% da categoria: crédito + taxas) usada nos grupos cujo PDF não informa a sua (padrão 0,7)."),
      t("lance_livre_pct", "número decimal", true, "Veículos: % da categoria do lance livre com que o simulador abre (padrão 55)."),
      t("lance_fidelidade_pct", "número decimal", true, "Veículos: % da categoria do lance fidelidade com que o simulador abre (padrão 45)."),
      t("concorrencia_fixo_pct", "número decimal", true, "Imóveis: % de concorrência do lance fixo, mostrado no cabeçalho da coluna do simulador."),
      t("concorrencia_limitado_pct", "número decimal", true, "Imóveis: % de concorrência do lance limitado."),
      t("concorrencia_livre_pct", "número decimal", true, "Imóveis: % de concorrência do lance livre."),
      t("concorrencia_fidelidade_pct", "número decimal", true, "Imóveis: % de concorrência do lance fidelidade."),
      t("concorrencia_veic_fixo25_pct", "número decimal", true, "Veículos: % de concorrência do Lance Fixo 25%."),
      t("concorrencia_veic_fixo40_pct", "número decimal", true, "Veículos: % de concorrência do Lance Fixo 40%."),
      t("concorrencia_veic_livre_pct", "número decimal", true, "Veículos: % de concorrência do Lance Livre."),
      t("concorrencia_veic_fidelidade_pct", "número decimal", true, "Veículos: % de concorrência do Lance Fidelidade."),
      t("rodape_textos", "JSON", true, "Título e texto sob o prazo restante de cada coluna do simulador, por tipo (SOR, FIX, LIM, LIV, FID)."),
      t("contemplacao_prazos", "lista de números", true, "Os 7 prazos (em meses) que aparecem como atalhos no campo “Contemplação em” do simulador."),
      t("pasta_pdf_imoveis", "texto", false, "Pasta padrão dos PDFs das tabelas de Imóveis (referência para a importação)."),
      t("pasta_pdf_veiculos", "texto", false, "Pasta padrão dos PDFs das tabelas de Veículos."),
      t("pasta_pdf_servicos", "texto", false, "Pasta padrão dos PDFs das tabelas de Serviços."),
      t("pasta_pdf_outros_bens", "texto", false, "Pasta padrão dos PDFs das tabelas de Outros Bens."),
    ],
  },
  {
    tabela: "indice_correcao",
    grupo: "Cadastros de apoio",
    descricao: "Índices de correção monetária que os grupos podem usar (INCC, IPCA, IGP-M…).",
    colunas: [
      t("sigla", "texto", true, "Sigla do índice (INCC, IPCA, IGP-M, INPC, CDI, TR).", "PK"),
      t("nome", "texto", true, "Nome por extenso."),
      t("fonte", "texto", false, "Instituição que divulga o índice."),
    ],
  },
  {
    tabela: "tipo_contemplacao",
    grupo: "Cadastros de apoio",
    descricao: "Modalidades de contemplação: SOR (sorteio ativo), LIV (lance livre), LIM (limitado), FIX (fixo) e FID (fidelidade); em veículos, também F40 (lance fixo de 40% da categoria) e F25 (lance fixo de 25%). Tela: Cadastros › Modalidades de Contemplação.",
    colunas: [
      t("codigo", "texto", true, "Código curto da modalidade (SOR, LIV, LIM, FIX, FID, F40, F25).", "PK"),
      t("nome", "texto", true, "Nome exibido nas telas."),
      t("cor", "texto", true, "Cor da modalidade (#RRGGBB) usada nos quadros e na sequência."),
    ],
  },
  {
    tabela: "tipo_parcela",
    grupo: "Cadastros de apoio",
    descricao: "Tipos de parcela (forma de pagamento): normal e reduzidas. Tela: Cadastros › Tipos de Parcela.",
    colunas: [
      t("codigo", "texto", true, "Código do tipo (NORMAL, RED_85, RED_70, RED_55, RED_50 e, em veículos, PLANO_40, PLANO_50, PLANO_75, CLEARANCE).", "PK"),
      t("descricao", "texto", true, "Descrição exibida nas telas."),
      t("pct", "número decimal", true, "Percentual da parcela cheia que o tipo representa (100 = normal; 50 = reduzida a 50%). Nos planos de veículos em duas fases é só o número do nome (Plano 50 = 50; Clearance = 99)."),
      t("rotulo", "texto", false, "Texto curto exibido no lugar de “N%” (ex.: Plano 50, Clearance). Vazio = mostra o percentual."),
    ],
  },
  {
    tabela: "grupo",
    grupo: "Grupos e assembleias",
    descricao: "Dados estáveis de cada grupo de consórcio (uma linha por grupo). O que muda a cada assembleia fica em grupo_assembleia. O seguro prestamista é global (parametros_gerais).",
    colunas: [
      t("numero", "inteiro", true, "Número do grupo na administradora.", "PK"),
      t("familia", "texto", true, "Família do bem: imoveis, veiculos, servicos ou outros_bens."),
      t("prazo_grupo_meses", "inteiro", true, "Prazo total do grupo, em meses."),
      t("participantes", "inteiro", false, "Número de participantes (cotas) do grupo."),
      t("taxa_adm_total", "número decimal", false, "Taxa de administração total, em % (ex.: 24,00)."),
      t("fundo_reserva", "número decimal", false, "Fundo de reserva, em %. Nos imóveis é 0, salvo se o PDF disser outro valor; vazio = não informado."),
      t("indice", "texto", false, "Índice de correção do grupo.", "FK→indice_correcao.sigla"),
      t("mes_reajuste", "inteiro", false, "Mês do reajuste anual (1 a 12)."),
      t("primeira_correcao", "data", false, "Data da primeira correção, quando o PDF informa."),
      t("dia_vencimento", "inteiro", false, "Dia do mês do vencimento das parcelas (1 a 31)."),
      t("parcela_minima_pct", "número decimal", false, "Veículos: parcela mínima mensal após a contemplação por lance, em % da categoria (crédito + taxas; ex.: 0,70). Vazio em imóveis, que não têm essa regra."),
      criado,
      atualizado,
    ],
  },
  {
    tabela: "arquivo_importado",
    grupo: "Importação de PDFs",
    descricao: "Registro de cada PDF (ou carga) que originou uma versão de grupo, com o resumo do que foi lido. Serve de auditoria.",
    colunas: [
      t("id", "número", true, "Identificador do arquivo.", "PK"),
      t("nome", "texto", true, "Nome do arquivo PDF."),
      t("hash_sha256", "texto", false, "Impressão digital (SHA-256) do conteúdo do arquivo."),
      t("recebido_em", "data e hora", true, "Quando o arquivo foi registrado."),
      t("status", "texto", true, "Situação do arquivo (recebido ou aprovado)."),
      t("dados_extraidos", "JSON", false, "Resumo da leitura do PDF: grupo, assembleia, prazo da cota, taxa e as parcelas diluídas de cada crédito (casos de teste do cálculo)."),
    ],
  },
  {
    tabela: "grupo_assembleia",
    grupo: "Grupos e assembleias",
    descricao: "Versão de um grupo em cada assembleia (cada PDF aprovado gera uma). A de maior número é a vigente, que o simulador usa.",
    colunas: [
      t("id", "número", true, "Identificador da versão.", "PK"),
      t("grupo_numero", "inteiro", true, "Grupo a que a versão pertence.", "UK (com assembleia_numero) · FK→grupo.numero"),
      t("assembleia_numero", "inteiro", true, "Número da assembleia (a 122ª, a 7ª…). Um grupo não repete o número."),
      t("data_assembleia", "data", false, "Data em que a assembleia acontece."),
      t("prazo_cota_meses", "inteiro", true, "Prazo restante da cota nesta assembleia (prazo do grupo − (assembleia − 1))."),
      t("creditos", "lista de números", true, "Créditos oferecidos na versão, do maior para o menor."),
      t("observacoes", "texto", false, "Avisos do PDF (sequência com mais de uma modalidade, entregas condicionadas, sorteio pela Loteria Federal…)."),
      t("arquivo_id", "número", false, "PDF de onde veio a versão.", "FK→arquivo_importado.id"),
      t("aprovado_por", "texto", false, "Quem aprovou a importação."),
      t("aprovado_em", "data e hora", false, "Quando a versão foi aprovada."),
      t("pagamento_com_furo", "sim/não", true, "O grupo permite pagamento com furo nesta versão? Padrão: não."),
      t("fidelidade_meses", "inteiro", false, "Assembleia da cota a partir da qual o lance fidelidade libera (ex.: 37 = após 36 parcelas pagas). Vazio = sem fidelidade ou não informado."),
    ],
  },
  {
    tabela: "grupo_assembleia_tipo_parcela",
    grupo: "Grupos e assembleias",
    descricao: "Quais tipos de parcela (formas de pagamento) cada versão do grupo oferece. Relação muitos para muitos entre grupo_assembleia e tipo_parcela.",
    colunas: [
      t("grupo_assembleia_id", "número", true, "Versão do grupo.", "PK · FK→grupo_assembleia.id"),
      t("tipo_parcela", "texto", true, "Tipo de parcela oferecido.", "PK · FK→tipo_parcela.codigo"),
      t("fase1_pct", "número decimal", false, "Plano reduzido em duas fases (veículos): % do crédito pago por mês na fase 1, sem taxa e fundo (ex.: 0,60 no Plano 50). A fase 2 é o que falta para fechar 100%."),
      t("fase1_parcelas", "inteiro", false, "Plano em duas fases: quantidade de parcelas da fase 1 (ex.: 24)."),
      t("fase2_parcelas", "inteiro", false, "Plano em duas fases: quantidade de parcelas da fase 2 (ex.: 66). Fase 1 + fase 2 = prazo do plano."),
    ],
  },
  {
    tabela: "grupo_modalidade",
    grupo: "Grupos e assembleias",
    descricao:
      "Regras de cada modalidade de lance em cada versão do grupo. O % do lance em relação à categoria não é guardado (= máx. de parcelas ÷ prazo do grupo) e o recurso próprio também não (= lance − embutido).",
    colunas: [
      t("id", "número", true, "Identificador da regra.", "PK"),
      t("grupo_assembleia_id", "número", true, "Versão do grupo.", "UK (com tipo) · FK→grupo_assembleia.id"),
      t("tipo", "texto", true, "Modalidade.", "FK→tipo_contemplacao.codigo"),
      t("max_parcelas_lance", "inteiro", false, "Máximo de parcelas do lance. Vazio ou igual ao prazo do grupo = qualquer quantidade (aparece como *)."),
      t("embutido_max_parcelas", "inteiro", false, "Máximo de parcelas do lance que podem ser embutidas (pagas com a carta de crédito). Vazio = sem limite em parcelas."),
      t("embutido_pct", "número decimal", false, "% que pode ser embutido, sobre a base de embutido_base. Vazio = sem limite em %. Os dois campos de embutido vazios = a modalidade não permite embutido (100% recurso próprio)."),
      t("embutido_base", "texto", true, "Base do embutido_pct: lance (% do lance ofertado; padrão) ou categoria (% do crédito + taxas, em veículos)."),
      t("lance_pct", "número decimal", false, "Veículos: lance fixo, em % da categoria (F40 = 40; F25 = 25). Vazio nas demais modalidades."),
      t("max_lance_pct", "número decimal", false, "Veículos: teto do lance livre e do fidelidade, em % da categoria (ex.: 55). Vazio = sem teto (até 100%)."),
      t("a_partir_assembleia_cota", "inteiro", true, "A partir de qual assembleia da cota a modalidade vale (1 = desde o início; fidelidade costuma ser 37)."),
      t("requisitos", "texto", false, "Requisitos para usar a modalidade (ex.: 36 parcelas pagas e participação em 36 assembleias, na fidelidade)."),
    ],
  },
  {
    tabela: "grupo_sequencia_faixa",
    grupo: "Grupos e assembleias",
    descricao: "Faixas de assembleias da sequência de contemplação (ex.: da 1ª à 36ª; da 37ª à 240ª) de uma versão do grupo.",
    colunas: [
      t("id", "número", true, "Identificador da faixa.", "PK"),
      t("grupo_assembleia_id", "número", true, "Versão do grupo.", "UK (com assembleia_de) · FK→grupo_assembleia.id"),
      t("assembleia_de", "inteiro", true, "Primeira assembleia da cota da faixa."),
      t("assembleia_ate", "inteiro", true, "Última assembleia da cota da faixa."),
      t("demais_tipo", "texto", false, "Modalidade das demais contemplações depois da sequência. Vazio = repete a sequência (sem o sorteio).", "FK→tipo_contemplacao.codigo"),
      t("demais_tipo_2", "texto", false, "Segunda modalidade das demais contemplações (“seguem com Livre e Fidelidade”). Preenchida, as demais alternam demais_tipo, demais_tipo_2, demais_tipo… Vazio = só demais_tipo.", "FK→tipo_contemplacao.codigo"),
    ],
  },
  {
    tabela: "grupo_sequencia",
    grupo: "Grupos e assembleias",
    descricao: "Itens de cada faixa: a ordem em que as modalidades contemplam em cada assembleia.",
    colunas: [
      t("id", "número", true, "Identificador do item.", "PK"),
      t("faixa_id", "número", true, "Faixa a que o item pertence.", "UK (com ordem) · FK→grupo_sequencia_faixa.id"),
      t("ordem", "inteiro", true, "Posição do item dentro da faixa."),
      t("tipo", "texto", true, "Modalidade que contempla nesta posição.", "FK→tipo_contemplacao.codigo"),
      t("quantidade", "inteiro", true, "Quantas contemplações dessa modalidade (ex.: 2 sorteios)."),
    ],
  },
  {
    tabela: "importacao_item",
    grupo: "Importação de PDFs",
    descricao: "Cada PDF lido na importação e a situação dele. O mesmo conteúdo (hash) nunca entra duas vezes. Tela: Cadastros › Importar tabelas (PDF).",
    colunas: [
      t("id", "número", true, "Identificador do item.", "PK"),
      t("hash_sha256", "texto", true, "Impressão digital (SHA-256) do PDF.", "UK"),
      t("arquivo", "texto", true, "Nome do arquivo."),
      t("familia", "texto", true, "Família do bem lida do PDF."),
      t("grupo_numero", "inteiro", false, "Número do grupo lido do PDF."),
      t("assembleia_numero", "inteiro", false, "Número da assembleia lido do PDF."),
      t("leitura", "JSON", false, "Tudo o que o leitor extraiu do PDF."),
      t("situacao", "texto", true, "pendente, sem_mudanca, aplicado, rejeitado (descartado), ignorado ou erro."),
      t("tipo", "texto", false, "grupo_novo, nova_assembleia, mesma_assembleia ou anterior (em relação à base)."),
      t("motivo", "texto", false, "Explicação (erro de leitura, duplicado, descartado…)."),
      t("lido_por", "texto", false, "E-mail de quem leu o PDF."),
      t("lido_em", "data e hora", true, "Quando foi lido."),
      atualizado,
    ],
  },
  {
    tabela: "importacao_diferenca",
    grupo: "Importação de PDFs",
    descricao: "Cada diferença entre um PDF e a base, com a decisão do administrador (aceitar, rejeitar ou editar). Nada vai para a base antes de tudo estar decidido.",
    colunas: [
      t("id", "número", true, "Identificador da diferença.", "PK"),
      t("item_id", "número", true, "PDF a que a diferença pertence.", "UK (com escopo, chave, campo) · FK→importacao_item.id"),
      t("escopo", "texto", true, "Onde: grupo, versao, creditos, tipos_parcela, modalidade ou sequencia."),
      t("chave", "texto", true, "Qual item do escopo (ex.: a modalidade FIX, ou a faixa que começa na 37ª)."),
      t("campo", "texto", true, "Qual campo mudou (* = o item inteiro)."),
      t("rotulo", "texto", true, "Descrição legível da diferença."),
      t("valor_atual", "JSON", false, "Valor que a base tem hoje."),
      t("valor_novo", "JSON", false, "Valor que o PDF traz."),
      t("decisao", "texto", true, "pendente, aceita, rejeitada ou editada."),
      t("valor_final", "JSON", false, "Valor digitado, quando a decisão é editada."),
      t("decidido_por", "texto", false, "E-mail de quem decidiu."),
      t("decidido_em", "data e hora", false, "Quando decidiu."),
    ],
  },
  {
    tabela: "importacao_faltante",
    grupo: "Importação de PDFs",
    descricao: "Grupos para os quais não veio PDF na leitura da pasta e o administrador escolheu esperar o PDF (reimportar). O salto automático de assembleia não precisa de registro aqui: ele grava a nova versão do grupo (e um item em importacao_item).",
    colunas: [
      t("grupo_numero", "inteiro", true, "Grupo sem PDF na assembleia de referência.", "PK · FK→grupo.numero"),
      t("decisao", "texto", true, "aguardando_pdf: o administrador vai reimportar o PDF deste grupo."),
      t("data_ref", "data", true, "Data da assembleia de referência da leitura em que o PDF faltou."),
      t("decidido_por", "texto", false, "E-mail de quem decidiu."),
      t("decidido_em", "data e hora", true, "Quando decidiu."),
    ],
  },
  {
    tabela: "lista_grupos",
    grupo: "Grupos e assembleias",
    descricao: "Lista de grupos de cada família (a do seletor em Grupos e Tabelas), guardada pronta para a tela abrir rápido. Derivada das demais tabelas: é refeita ao aplicar a importação e ao editar um grupo.",
    colunas: [
      t("familia", "texto", true, "Família dos grupos (imoveis, veiculos, servicos, outros_bens).", "PK"),
      t("dados", "JSON", true, "Lista de grupos da família: número, prazo, assembleia, créditos mínimo e máximo, sequência, participantes, furo e parcelas reduzidas."),
      t("atualizado_em", "data e hora", true, "Quando a lista foi refeita."),
    ],
  },
  {
    tabela: "usuario",
    grupo: "Acesso",
    descricao: "Quem pode entrar no Dinastia e se é administrador. Contém dados pessoais (CPF, telefone): proteja o arquivo exportado. Tela: Cadastros › Usuários.",
    colunas: [
      t("cpf", "texto", true, "CPF, só dígitos, validado. Chave do cadastro.", "PK"),
      t("email", "texto", true, "E-mail do login (minúsculo, único).", "UK"),
      t("nome_completo", "texto", true, "Nome completo."),
      t("telefone", "texto", true, "Telefone com DDD, só dígitos."),
      t("administrador", "sim/não", true, "Administrador pode alterar cadastros, grupos, importar PDFs e gerenciar usuários. O sistema nunca fica sem administrador."),
      criado,
      atualizado,
    ],
  },
  {
    tabela: "usuario_autorizado",
    grupo: "Acesso",
    descricao: "OBSOLETA: lista antiga de e-mails autorizados, substituída por usuario na migração 0023. Sem uso.",
    colunas: [t("email", "texto", true, "E-mail autorizado (lista antiga).", "PK"), criado],
  },
];

export type Relacionamento = { origem: string; colunaOrigem: string; destino: string; colunaDestino: string; apagar: string; significado: string };

export const RELACIONAMENTOS: Relacionamento[] = [
  { origem: "grupo", colunaOrigem: "indice", destino: "indice_correcao", colunaDestino: "sigla", apagar: "bloqueia", significado: "Cada grupo usa um índice de correção." },
  { origem: "grupo_assembleia", colunaOrigem: "grupo_numero", destino: "grupo", colunaDestino: "numero", apagar: "apaga junto", significado: "Um grupo tem várias versões, uma por assembleia." },
  { origem: "grupo_assembleia", colunaOrigem: "arquivo_id", destino: "arquivo_importado", colunaDestino: "id", apagar: "bloqueia", significado: "Cada versão veio de um PDF registrado." },
  { origem: "grupo_assembleia_tipo_parcela", colunaOrigem: "grupo_assembleia_id", destino: "grupo_assembleia", colunaDestino: "id", apagar: "apaga junto", significado: "Tipos de parcela oferecidos na versão." },
  { origem: "grupo_assembleia_tipo_parcela", colunaOrigem: "tipo_parcela", destino: "tipo_parcela", colunaDestino: "codigo", apagar: "bloqueia", significado: "Qual tipo de parcela." },
  { origem: "grupo_modalidade", colunaOrigem: "grupo_assembleia_id", destino: "grupo_assembleia", colunaDestino: "id", apagar: "apaga junto", significado: "Regras de lance da versão." },
  { origem: "grupo_modalidade", colunaOrigem: "tipo", destino: "tipo_contemplacao", colunaDestino: "codigo", apagar: "bloqueia", significado: "De qual modalidade é a regra." },
  { origem: "grupo_sequencia_faixa", colunaOrigem: "grupo_assembleia_id", destino: "grupo_assembleia", colunaDestino: "id", apagar: "apaga junto", significado: "Faixas da sequência de contemplação da versão." },
  { origem: "grupo_sequencia_faixa", colunaOrigem: "demais_tipo", destino: "tipo_contemplacao", colunaDestino: "codigo", apagar: "bloqueia", significado: "Modalidade das demais contemplações." },
  { origem: "grupo_sequencia_faixa", colunaOrigem: "demais_tipo_2", destino: "tipo_contemplacao", colunaDestino: "codigo", apagar: "bloqueia", significado: "Segunda modalidade, alternada com a primeira, nas demais contemplações." },
  { origem: "grupo_sequencia", colunaOrigem: "faixa_id", destino: "grupo_sequencia_faixa", colunaDestino: "id", apagar: "apaga junto", significado: "Itens (ordem) de cada faixa." },
  { origem: "grupo_sequencia", colunaOrigem: "tipo", destino: "tipo_contemplacao", colunaDestino: "codigo", apagar: "bloqueia", significado: "Modalidade do item da sequência." },
  { origem: "importacao_faltante", colunaOrigem: "grupo_numero", destino: "grupo", colunaDestino: "numero", apagar: "apaga junto", significado: "Grupo que ficou aguardando PDF na leitura." },
  { origem: "importacao_diferenca", colunaOrigem: "item_id", destino: "importacao_item", colunaDestino: "id", apagar: "apaga junto", significado: "Diferenças encontradas em cada PDF lido." },
];

export type ObjetoApoio = { nome: string; tipo: "visão" | "função"; descricao: string };

export const OBJETOS_APOIO: ObjetoApoio[] = [
  { nome: "grupo_atual", tipo: "visão", descricao: "Cada grupo com a versão vigente (maior assembleia): é o que a tela Grupos e Tabelas e o simulador leem." },
  { nome: "autorizado()", tipo: "função", descricao: "Verdadeira se o e-mail do login está em usuario. Base das regras de leitura." },
  { nome: "eh_admin()", tipo: "função", descricao: "Verdadeira se o e-mail do login é de um administrador. Base das regras de gravação." },
  { nome: "cpf_valido(texto)", tipo: "função", descricao: "Confere os dígitos verificadores de um CPF." },
  { nome: "logins_existentes()", tipo: "função", descricao: "Lista os e-mails que já têm conta de login (só administrador); usada pela tela Usuários." },
  { nome: "salvar_sequencia(json)", tipo: "função", descricao: "Troca, numa transação só, as faixas de sequência de uma versão (editor de sequência)." },
  { nome: "aplicar_importacao(json)", tipo: "função", descricao: "Grava na base o estado final de um grupo e de uma assembleia depois de todas as decisões da importação (só administrador)." },
  { nome: "set_atualizado_em()", tipo: "função", descricao: "Gatilho que atualiza o campo atualizado_em a cada alteração." },
];

/** Mermaid erDiagram das tabelas do modelo (sem as obsoletas). */
export function mermaidER(): string {
  const tipoMermaid = (c: CampoDic) => (c.tipo.includes("inteiro") || c.tipo === "número" ? "int" : c.tipo.includes("decimal") ? "decimal" : c.tipo.includes("data") ? "datetime" : c.tipo === "sim/não" ? "boolean" : c.tipo === "JSON" ? "json" : c.tipo.includes("lista") ? "array" : "string");
  const linhas: string[] = ["erDiagram"];
  for (const r of RELACIONAMENTOS) {
    // o destino é o "pai" (1) e a origem é o "filho" (vários)
    linhas.push(`  ${r.destino} ||--o{ ${r.origem} : "${r.colunaOrigem}"`);
  }
  for (const tb of DICIONARIO.filter((x) => x.tabela !== "usuario_autorizado")) {
    linhas.push(`  ${tb.tabela} {`);
    for (const c of tb.colunas) {
      const ch = c.chave?.startsWith("PK") ? " PK" : c.chave?.includes("FK") ? " FK" : c.chave?.includes("UK") ? " UK" : "";
      linhas.push(`    ${tipoMermaid(c)} ${c.nome}${ch}`);
    }
    linhas.push("  }");
  }
  return linhas.join("\n");
}
