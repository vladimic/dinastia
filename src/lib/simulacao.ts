// Cálculos do simulador do grupo (funções puras, sem dependências).
// Todos os valores em R$ e prazos em meses; percentuais em pontos (24 = 24%).

export type Entrada = {
  /** crédito contratado */
  credito: number;
  /** taxa de administração total do grupo (%) */
  taxaAdmPct: number;
  /** % da parcela do tipo escolhido (100 = Normal, 50 = Reduzida 50%) */
  pctParcela: number;
  /** prazo original do grupo, em meses */
  prazoGrupo: number;
  /** meses que faltam para o grupo terminar */
  mesesFaltam: number;
  /** pagamento com furo: sim = parcela calculada sobre o prazo total do grupo; não = sobre o prazo que falta */
  furo: boolean;
  /** contemplação daqui a quantos meses */
  mesesContemplacao: number;
};

export type Base = {
  taxaAdmValor: number;
  /** (crédito + taxa de administração) / prazo original do grupo */
  parcelaLance: number;
  prazoAntes: number;
  /** ((crédito × % parcela) + (crédito × taxa de administração)) / prazo */
  parcelaAntes: number;
  /** parcela antes × meses até a contemplação */
  totalPago: number;
  /** prazo que falta do grupo − meses até a contemplação */
  prazoRestante: number;
  /** ((crédito + taxa de administração) − total pago até a contemplação) / prazo restante; nulo se o prazo restante acabou */
  parcelaApos: number | null;
};

export function calcularBase(e: Entrada): Base {
  const taxaAdmValor = e.credito * (e.taxaAdmPct / 100);
  const prazoAntes = e.furo ? e.prazoGrupo : e.mesesFaltam;
  const parcelaAntes = prazoAntes > 0 ? (e.credito * (e.pctParcela / 100) + taxaAdmValor) / prazoAntes : 0;
  const totalPago = parcelaAntes * e.mesesContemplacao;
  const prazoRestante = e.mesesFaltam - e.mesesContemplacao;
  return {
    taxaAdmValor,
    parcelaLance: e.prazoGrupo > 0 ? (e.credito + taxaAdmValor) / e.prazoGrupo : 0,
    prazoAntes,
    parcelaAntes,
    totalPago,
    prazoRestante,
    parcelaApos: prazoRestante > 0 ? (e.credito + taxaAdmValor - totalPago) / prazoRestante : null,
  };
}

export type RegraEmbutido = {
  /** máximo de parcelas do lance que podem ser embutidas; nulo = sem limite em parcelas */
  embutido_max_parcelas: number | null;
  /** % do lance ofertado que pode ser embutido; nulo = sem limite em %. Os dois nulos = sem embutido */
  embutido_pct: number | null;
};

/**
 * Fração do lance (0 a 1) que pode ser paga com a carta (embutido): o menor entre
 * - o % do lance da regra (ex.: 50% do valor ofertado) e
 * - o limite em parcelas dividido pelas parcelas do lance (ex.: embutir até 60 parcelas).
 * Sem nenhum dos dois: 0 (todo o lance com recursos próprios).
 */
export function fracaoEmbutido(r: RegraEmbutido, qtdParcelas: number): number {
  if (r.embutido_pct === null && r.embutido_max_parcelas === null) return 0;
  const porPct = r.embutido_pct === null ? 1 : Number(r.embutido_pct) / 100;
  const porParcelas = r.embutido_max_parcelas === null ? 1 : qtdParcelas > 0 ? r.embutido_max_parcelas / qtdParcelas : 0;
  return Math.max(0, Math.min(1, porPct, porParcelas));
}

export type TipoColuna = "SOR" | "FIX" | "LIM" | "LIV" | "FID";

export type Coluna = {
  fracaoCarta: number;
  /** parcelas do lance × parcela para lance × % embutido */
  recursoCarta: number;
  /** parcelas do lance × parcela para lance × % próprio */
  recursoProprio: number;
  /** crédito contratado − recurso da carta */
  creditoDisponivel: number;
  /** ((crédito + taxa) − total pago até a contemplação − lance da carta − lance próprio) / prazo restante; nulo se o prazo restante acabou */
  parcelaApos: number | null;
  /** parcela após × prazo restante */
  saldoDevedor: number | null;
  /** parcelas pagas até a contemplação */
  valorInvestido: number;
  /** crédito disponível − lance próprio − parcelas pagas */
  dinheiroNovo: number;
  /** taxa mensal que iguala o dinheiro novo às parcelas após a contemplação (função TAXA); nulo se não houver taxa positiva */
  custoMensal: number | null;
  /** (1 + custo mensal)^12 − 1 */
  custoAnual: number | null;
};

/** Sorteio: passe `lance = null`. */
export function calcularColuna(base: Base, credito: number, lance: { qtdParcelas: number; regra: RegraEmbutido } | null): Coluna {
  const fracaoCarta = lance ? fracaoEmbutido(lance.regra, lance.qtdParcelas) : 0;
  const totalLance = lance ? lance.qtdParcelas * base.parcelaLance : 0;
  const recursoCarta = totalLance * fracaoCarta;
  const recursoProprio = totalLance - recursoCarta;
  const creditoDisponivel = credito - recursoCarta;
  const saldoAntes = credito + base.taxaAdmValor - base.totalPago;
  const parcelaApos = base.prazoRestante > 0 ? Math.max(0, (saldoAntes - totalLance) / base.prazoRestante) : null;
  const dinheiroNovo = creditoDisponivel - recursoProprio - base.totalPago;
  const custoMensal = parcelaApos === null ? null : taxaMensal(base.prazoRestante, parcelaApos, dinheiroNovo);
  return {
    fracaoCarta,
    recursoCarta,
    recursoProprio,
    creditoDisponivel,
    parcelaApos,
    saldoDevedor: parcelaApos === null ? null : parcelaApos * base.prazoRestante,
    valorInvestido: base.totalPago,
    dinheiroNovo,
    custoMensal,
    custoAnual: custoMensal === null ? null : (Math.pow(1 + custoMensal, 12) - 1),
  };
}

/**
 * Taxa mensal i tal que valorPresente = parcela × (1 − (1+i)^−n) / i (anuidade postecipada, como a função TAXA da planilha).
 * Nulo quando não existe taxa positiva (valor presente ≤ 0, parcela ≤ 0, ou as parcelas somam menos que o valor presente).
 */
export function taxaMensal(n: number, parcela: number, valorPresente: number): number | null {
  if (n <= 0 || parcela <= 0 || valorPresente <= 0 || parcela * n <= valorPresente) return null;
  const f = (i: number) => (parcela * (1 - Math.pow(1 + i, -n))) / i - valorPresente; // decrescente em i
  let lo = 1e-9;
  let hi = 1;
  if (f(hi) > 0) return null; // taxa acima de 100% ao mês: fora do que faz sentido
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------------------------
// Padrões do simulador (Parâmetros globais)

export type Rodape = { titulo: string; texto: string };

export type PadroesSimulador = {
  /** INCC projetado, % ao ano */
  incc: number;
  contemplacaoMeses: number;
  /** os 7 prazos (meses) que aparecem como atalhos em "Contemplação em" */
  contemplacaoPrazos: number[];
  /** seguro, % do crédito ao mês (o mesmo parâmetro de todos os grupos) */
  seguroPct: number;
  lanceLivreParcelas: number;
  lanceFidelidadeParcelas: number;
  /** concorrência de cada lance, % (só se altera em Parâmetros globais) */
  concorrencia: Record<"FIX" | "LIM" | "LIV" | "FID", number>;
  /** textos do rodapé de cada coluna */
  rodape: Record<TipoColuna, Rodape>;
};

/** prazos de atalho de "Contemplação em" (valores de fábrica, os mesmos com que o parâmetro foi carregado) */
export const PRAZOS_CONTEMPLACAO_PADRAO = [1, 12, 24, 36, 48, 60, 120];

export const RODAPE_PADRAO: Record<TipoColuna, Rodape> = {
  SOR: { titulo: "Sem lance", texto: "Depende só da sorte" },
  FIX: { titulo: "Previsibilidade máxima", texto: "Valor de lance pré-definido" },
  LIM: { titulo: "Equilíbrio e flexibilidade", texto: "Combina crédito + recurso próprio" },
  LIV: { titulo: "Valor à sua escolha", texto: "Você define o lance, sem teto fixo" },
  FID: { titulo: "Maior poder de contemplação", texto: "Funciona como leilão" },
};

/** Linha de parametros_gerais → padrões (valores de fábrica onde a coluna ainda não existir ou vier vazia) */
export function padroesDeLinha(l: Record<string, unknown> | null | undefined): PadroesSimulador {
  const n = (v: unknown, padrao: number) => (v === null || v === undefined || v === "" ? padrao : Number(v));
  const r = (l?.rodape_textos ?? {}) as Partial<Record<TipoColuna, Partial<Rodape>>>;
  const rodape = { ...RODAPE_PADRAO };
  for (const k of Object.keys(RODAPE_PADRAO) as TipoColuna[]) rodape[k] = { ...RODAPE_PADRAO[k], ...(r[k] ?? {}) };
  // 7 prazos válidos (inteiros de 1 a 999); qualquer outra coisa volta aos valores de fábrica
  const bruto = Array.isArray(l?.contemplacao_prazos) ? (l.contemplacao_prazos as unknown[]).map(Number) : [];
  const prazos = bruto.length === 7 && bruto.every((v) => Number.isInteger(v) && v >= 1 && v <= 999) ? bruto : PRAZOS_CONTEMPLACAO_PADRAO;
  return {
    incc: n(l?.incc_pct_ano, 6),
    contemplacaoMeses: n(l?.contemplacao_meses, 1),
    contemplacaoPrazos: prazos,
    seguroPct: n(l?.seguro_padrao_pct, 0),
    lanceLivreParcelas: n(l?.lance_livre_parcelas, 150),
    lanceFidelidadeParcelas: n(l?.lance_fidelidade_parcelas, 130),
    concorrencia: {
      FIX: n(l?.concorrencia_fixo_pct, 25),
      LIM: n(l?.concorrencia_limitado_pct, 10),
      LIV: n(l?.concorrencia_livre_pct, 3),
      FID: n(l?.concorrencia_fidelidade_pct, 2),
    },
    rodape,
  };
}
