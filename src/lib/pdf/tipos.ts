// Formato do que sai da leitura de um PDF de tabela de grupo (o mesmo que o antigo scripts/importar_tabelas.py gerava).

export type Item = { s: string; x: number };
export type Linha = { y: number; itens: Item[]; texto: string };

export type Parcela = { plano: "DILUIDA" | "ANTECIPADO_1"; pct: number; primeira: number; demais: number };
export type LinhaCredito = { cod: string; credito: number; seguro: number; parcelas: Parcela[] };

export type Modalidade = {
  /** máximo de parcelas do lance; nulo = qualquer quantidade até o prazo do grupo */
  max: number | null;
  /** máximo de parcelas do lance que podem ser embutidas (pagas com a carta); nulo = sem limite em parcelas */
  emb_parc: number | null;
  /** % do lance ofertado que pode ser embutido; nulo = sem limite em % (100%). Os dois nulos = sem embutido */
  emb_pct: number | null;
  a_partir: number;
  req: string | null;
  /** veículos: lance fixo em % da categoria (F40 = 40, F25 = 25) */
  lance_pct?: number | null;
  /** veículos: teto do lance livre/fidelidade em % da categoria */
  max_lance_pct?: number | null;
  /** veículos: base do emb_pct (padrão: lance) */
  emb_base?: "lance" | "categoria";
};

/** Reduzida lida do PDF de veículos (tipo = RED, o único código de reduzida). Em duas fases: fase1_pct, fase1_parcelas e fase2_parcelas preenchidos. Até a contemplação (AC): só fase1_pct, que é o % da parcela linear (50 = metade). */
export type PlanoReduzidoLido = {
  tipo: string;
  /** % do crédito pago por mês na fase 1, sem taxas (ex.: 0,6 no Plano 50) */
  fase1_pct: number | null;
  fase1_parcelas: number | null;
  fase2_parcelas: number | null;
};

export type Faixa = { de: number; ate: number; itens: { qtd: number; tipo: string }[]; demais: string | null; demais2?: string | null };

/** Versão do leitor de PDFs: sobe quando uma correção muda o que é lido (PDFs lidos antes com versão menor são lidos de novo). */
export const LEITOR = 7;

export type Leitura = {
  leitor: number;
  arquivo: string;
  hash: string;
  numero: string;
  familia: string;
  assembleia: number;
  data_assembleia: string;
  taxa_adm: number;
  prazo_cota: number;
  prazo_grupo: number;
  participantes: number;
  indice: string | null;
  mes_reajuste: number | null;
  primeira_correcao: string | null;
  vencimento: number | null;
  fundo_reserva: number | null;
  seguro_opcional_pre: boolean;
  seguro_obrigatorio_pos: boolean;
  idade_limite: string | null;
  observacoes: string | null;
  planos: { DILUIDA: number[]; ANTECIPADO_1: number[] };
  /** % total antecipado e em quantas parcelas (ex.: 2% em 4 parcelas) */
  antecipado: { pct: number; parcelas: number };
  seguro_pct_mes: number | null;
  creditos: LinhaCredito[];
  modalidades: Record<string, Modalidade>;
  faixas: Faixa[];
  /** veículos: parcela mínima após a contemplação, % da categoria (crédito + taxas) */
  parcela_minima_pct?: number | null;
  /** veículos: plano reduzido oferecido (nulo = só o linear) */
  plano_reduzido?: PlanoReduzidoLido | null;
  erros: string[];
  avisos: string[];
};
