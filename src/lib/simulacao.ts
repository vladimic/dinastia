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
  /** veículos: plano reduzido em duas fases (nulo = plano linear ou reduzido até a contemplação, como nos imóveis) */
  plano?: PlanoFases | null;
  /** veículos: parcela mínima após a contemplação por lance, % do crédito */
  parcelaMinimaPct?: number | null;
};

/** Plano reduzido em duas fases: fase 1 paga `fase1Pct`% do crédito por mês (sem taxas); a fase 2 divide o que falta para 100%. */
export type PlanoFases = { fase1Pct: number; fase1Parcelas: number; fase2Parcelas: number };

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
  /** crédito + taxa de administração (+ fundo de reserva em veículos): a "categoria" em que os lances em % se baseiam */
  categoria: number;
  /** parcela mínima após a contemplação, em R$ (nulo = sem regra) */
  parcelaMinima: number | null;
  /** plano em duas fases: parcela da fase 1 e da fase 2, em R$ */
  fases: { parcela1: number; parcela2: number; parcelas1: number; parcelas2: number } | null;
};

export function calcularBase(e: Entrada): Base {
  const taxaAdmValor = e.credito * (e.taxaAdmPct / 100);
  const categoria = e.credito + taxaAdmValor;
  const parcelaMinima = e.parcelaMinimaPct ? (e.credito * e.parcelaMinimaPct) / 100 : null;
  const m = e.mesesContemplacao;

  if (e.plano) {
    // plano reduzido em duas fases (veículos): a parcela vai do crédito puro × (1 + taxas); a fase 2 fecha os 100%
    const { fase1Pct, fase1Parcelas: n1, fase2Parcelas: n2 } = e.plano;
    const fase2Pct = (100 - fase1Pct * n1) / n2;
    const fator = 1 + e.taxaAdmPct / 100;
    const parcela1 = ((e.credito * fase1Pct) / 100) * fator;
    const parcela2 = ((e.credito * fase2Pct) / 100) * fator;
    const prazoPlano = n1 + n2;
    const noPlano = Math.min(m, prazoPlano);
    const totalPago = Math.min(noPlano, n1) * parcela1 + Math.max(0, noPlano - n1) * parcela2;
    const prazoRestante = prazoPlano - m;
    return {
      taxaAdmValor,
      parcelaLance: 0,
      prazoAntes: prazoPlano,
      parcelaAntes: parcela1,
      totalPago,
      prazoRestante,
      parcelaApos: prazoRestante > 0 ? (categoria - totalPago) / prazoRestante : null,
      categoria,
      parcelaMinima,
      fases: { parcela1, parcela2, parcelas1: n1, parcelas2: n2 },
    };
  }

  const prazoAntes = e.furo ? e.prazoGrupo : e.mesesFaltam;
  const parcelaAntes = prazoAntes > 0 ? (e.credito * (e.pctParcela / 100) + taxaAdmValor) / prazoAntes : 0;
  const totalPago = parcelaAntes * m;
  const prazoRestante = e.mesesFaltam - m;
  return {
    taxaAdmValor,
    parcelaLance: e.prazoGrupo > 0 ? (e.credito + taxaAdmValor) / e.prazoGrupo : 0,
    prazoAntes,
    parcelaAntes,
    totalPago,
    prazoRestante,
    parcelaApos: prazoRestante > 0 ? (e.credito + taxaAdmValor - totalPago) / prazoRestante : null,
    categoria,
    parcelaMinima,
    fases: null,
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

/** Colunas do simulador: as cinco de sempre e, em veículos, os dois lances fixos em % (F25, F40). */
export type TipoLance = TipoColuna | "F25" | "F40";
/** Cores, concorrência e textos de rodapé de cada coluna: F25 usa os do Fixo e F40 os do Limitado. */
export const CHAVE_VISUAL: Record<TipoLance, TipoColuna> = { SOR: "SOR", FIX: "FIX", LIM: "LIM", LIV: "LIV", FID: "FID", F25: "FIX", F40: "LIM" };

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
  /** meses que restam depois da contemplação (com parcela mínima, o saldo pode quitar antes do prazo) */
  prazoRestante: number;
  /** parcela após × prazo restante */
  saldoDevedor: number | null;
  /** parcelas pagas até a contemplação */
  valorInvestido: number;
  /** recurso da carta + recurso próprio */
  lanceTotal: number;
  /** crédito disponível após a contemplação − lance com recurso próprio */
  creditoMenosProprio: number;
  /** lance com recurso próprio ÷ crédito contratado, em pontos (42,3 = 42,3%) */
  proprioPct: number;
  /** taxa mensal que iguala o crédito líquido (crédito − lance próprio − parcelas já pagas) às parcelas após a contemplação (função TAXA); nulo se não houver taxa positiva */
  custoMensal: number | null;
  /** (1 + custo mensal)^12 − 1 */
  custoAnual: number | null;
};

/** Sorteio: passe `lance = null`. */
export function calcularColuna(base: Base, credito: number, lance: { qtdParcelas: number; regra: RegraEmbutido } | null): Coluna {
  const fracaoCarta = lance ? fracaoEmbutido(lance.regra, lance.qtdParcelas) : 0;
  const totalLance = lance ? lance.qtdParcelas * base.parcelaLance : 0;
  return montarColuna(base, credito, totalLance, totalLance * fracaoCarta, fracaoCarta);
}

export type RegraEmbutidoVeiculo = {
  /** % que pode ser embutido, sobre a base abaixo; nulo = sem embutido */
  embutido_pct: number | null;
  /** lance = % do lance ofertado; categoria = % do crédito + taxas */
  embutido_base: "lance" | "categoria";
};

/** Veículos: o lance é `pct`% da categoria (crédito + taxas). Sorteio: passe `lance = null`. */
export function calcularColunaPct(base: Base, credito: number, lance: { pct: number; regra: RegraEmbutidoVeiculo } | null): Coluna {
  const totalLance = lance ? (base.categoria * lance.pct) / 100 : 0;
  let recursoCarta = 0;
  if (lance && lance.regra.embutido_pct !== null) {
    const p = Number(lance.regra.embutido_pct) / 100;
    recursoCarta = lance.regra.embutido_base === "categoria" ? Math.min(totalLance, base.categoria * p) : totalLance * Math.min(1, p);
  }
  return montarColuna(base, credito, totalLance, recursoCarta, totalLance > 0 ? recursoCarta / totalLance : 0);
}

function montarColuna(base: Base, credito: number, totalLance: number, recursoCarta: number, fracaoCarta: number): Coluna {
  const recursoProprio = totalLance - recursoCarta;
  const creditoDisponivel = credito - recursoCarta;
  const saldoAntes = credito + base.taxaAdmValor - base.totalPago;
  const saldo = Math.max(0, saldoAntes - totalLance);
  let parcelaApos: number | null = base.prazoRestante > 0 ? saldo / base.prazoRestante : null;
  let prazoRestante = base.prazoRestante;
  // parcela mínima (veículos): se o rateio ficar abaixo dela, paga-se o mínimo e o saldo quita antes do prazo
  if (parcelaApos !== null && base.parcelaMinima !== null && parcelaApos < base.parcelaMinima && saldo > 0) {
    parcelaApos = base.parcelaMinima;
    prazoRestante = Math.min(base.prazoRestante, Math.ceil(saldo / base.parcelaMinima));
  }
  const creditoMenosProprio = creditoDisponivel - recursoProprio;
  // o custo compara o que se recebe de fato (já descontadas as parcelas pagas até a contemplação) com as parcelas que restam
  const custoMensal = parcelaApos === null ? null : taxaMensal(prazoRestante, parcelaApos, creditoMenosProprio - base.totalPago);
  return {
    fracaoCarta,
    recursoCarta,
    recursoProprio,
    creditoDisponivel,
    parcelaApos,
    prazoRestante,
    saldoDevedor: parcelaApos === null ? null : parcelaApos * prazoRestante,
    valorInvestido: base.totalPago,
    lanceTotal: totalLance,
    creditoMenosProprio,
    proprioPct: credito > 0 ? (recursoProprio / credito) * 100 : 0,
    custoMensal,
    custoAnual: custoMensal === null ? null : Math.pow(1 + custoMensal, 12) - 1,
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
  /** veículos: % da categoria com que o simulador abre os lances livre e fidelidade */
  lanceLivrePct: number;
  lanceFidelidadePct: number;
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
    lanceLivrePct: n(l?.lance_livre_pct, 55),
    lanceFidelidadePct: n(l?.lance_fidelidade_pct, 45),
    concorrencia: {
      FIX: n(l?.concorrencia_fixo_pct, 25),
      LIM: n(l?.concorrencia_limitado_pct, 10),
      LIV: n(l?.concorrencia_livre_pct, 3),
      FID: n(l?.concorrencia_fidelidade_pct, 2),
    },
    rodape,
  };
}
