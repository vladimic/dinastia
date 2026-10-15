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
  embutido_base: "ofertado" | "categoria" | null;
  embutido_pct: number | null;
  embutido_max_parcelas: number | null;
};

/**
 * Fração do lance (0 a 1) que pode ser paga com a carta (embutido).
 * - base "ofertado": o percentual da regra (ex.: 50% do valor ofertado);
 * - base "categoria" com limite em parcelas: o limite dividido pelas parcelas do lance (ex.: embutir até 60 parcelas);
 * - sem regra de embutido: 0 (todo o lance com recursos próprios).
 */
export function fracaoEmbutido(r: RegraEmbutido, qtdParcelas: number): number {
  if (r.embutido_pct === null) return 0;
  if (r.embutido_base === "categoria" && r.embutido_max_parcelas !== null) {
    return qtdParcelas > 0 ? Math.min(1, r.embutido_max_parcelas / qtdParcelas) : 0;
  }
  return Math.min(1, Number(r.embutido_pct) / 100);
}

export type Lance = {
  fracaoCarta: number;
  /** parcelas do lance × parcela para lance × % embutido */
  recursoCarta: number;
  /** parcelas do lance × parcela para lance × % próprio */
  recursoProprio: number;
  /** crédito contratado − recurso da carta */
  creditoDisponivel: number;
};

export function calcularLance(base: Base, credito: number, qtdParcelas: number, regra: RegraEmbutido): Lance {
  const fracaoCarta = fracaoEmbutido(regra, qtdParcelas);
  const total = qtdParcelas * base.parcelaLance;
  return {
    fracaoCarta,
    recursoCarta: total * fracaoCarta,
    recursoProprio: total * (1 - fracaoCarta),
    creditoDisponivel: credito - total * fracaoCarta,
  };
}
