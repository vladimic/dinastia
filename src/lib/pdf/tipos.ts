// Formato do que sai da leitura de um PDF de tabela de grupo (o mesmo que o antigo scripts/importar_tabelas.py gerava).

export type Item = { s: string; x: number };
export type Linha = { y: number; itens: Item[]; texto: string };

export type Parcela = { plano: "DILUIDA" | "ANTECIPADO_1"; pct: number; primeira: number; demais: number };
export type LinhaCredito = { cod: string; credito: number; seguro: number; parcelas: Parcela[] };

export type Modalidade = {
  max: number | null;
  pct_cat: number | null;
  emb_parc: number | null;
  emb_base: "ofertado" | "categoria" | null;
  emb_pct: number | null;
  rec_proprio: boolean | null;
  a_partir: number;
  req: string | null;
  transf: boolean;
  emb_texto: string | null;
};

export type Faixa = { de: number; ate: number; itens: { qtd: number; tipo: string }[]; demais: string | null };

/** Versão do leitor de PDFs: sobe quando uma correção muda o que é lido (PDFs lidos antes com versão menor são lidos de novo). */
export const LEITOR = 3;

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
  indice: string;
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
  erros: string[];
  avisos: string[];
};
