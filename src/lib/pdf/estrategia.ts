import type { Leitura, Linha } from "./tipos";

// "Estratégia Comercial" de Veículos: um PDF só, com uma linha por grupo (créditos, taxa, prazos e o plano reduzido do mês).
// REGRA: a Estratégia NÃO é parâmetro de valores (créditos, taxa, prazos, plano): vale só o PDF individual de cada grupo, inclusive para o
// tipo de plano. Da Estratégia usa-se apenas a quantidade de parcelas reduzidas (parcelasReduzidasDa), e só se o PDF individual não a trouxer.

export type EstrategiaGrupo = {
  numero: string;
  creditoMin: number;
  creditoMax: number;
  taxa: number;
  fundo: number;
  prazoGrupo: number;
  prazoRestante: number;
  /** prazo em que o plano reduzido vale (fase 1 + fase 2); nulo = grupo sem plano reduzido */
  prazoComl: number | null;
  reduzidas: number | null;
  demais: number | null;
  furos: number | null;
  /** nome do plano: PLANO 40, PLANO 50, PLANO 75, CLEARANCE ou PLANO REDUZIDO 50% */
  plano: string | null;
};

const MONEY = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const inteiro = (s: string | undefined) => {
  const m = s?.match(/^(\d+)\s*(?:meses|furos?)$/i);
  return m ? Number(m[1]) : null;
};

export const ehEstrategia = (linhas: Linha[]) => /Estrat[ée]gia Comercial/i.test(linhas.slice(0, 3).map((l) => l.texto).join(" "));

export function lerEstrategia(linhas: Linha[]): EstrategiaGrupo[] {
  const out: EstrategiaGrupo[] = [];
  for (const l of linhas) {
    const it = l.itens.map((i) => i.s);
    if (!/^\d{4}$/.test(it[0] ?? "") || !MONEY.test(it[1] ?? "") || !MONEY.test(it[2] ?? "")) continue;
    const prazoGrupo = inteiro(it[5]);
    const prazoRestante = inteiro(it[6]);
    if (prazoGrupo === null || prazoRestante === null) continue;
    const nomePlano = it[11] && it[11] !== "-" && /PLANO|CLEARANCE/i.test(it[11]) ? it[11].replace(/\s*\(.*\)$/, "").trim() : null;
    out.push({
      numero: it[0],
      creditoMin: num(it[1]),
      creditoMax: num(it[2]),
      taxa: num(it[3].replace("%", "")),
      fundo: num(it[4].replace("%", "")),
      prazoGrupo,
      prazoRestante,
      prazoComl: inteiro(it[7]),
      reduzidas: inteiro(it[8]),
      demais: inteiro(it[9]),
      furos: inteiro(it[10]),
      plano: nomePlano,
    });
  }
  return out;
}

/** Parcelas reduzidas (fase 1) e demais (fase 2) do grupo na Estratégia; nulo = grupo sem plano reduzido por fases. */
export function parcelasReduzidasDa(e: EstrategiaGrupo | undefined): { fase1: number; fase2: number } | null {
  return e && e.reduzidas !== null && e.demais !== null ? { fase1: e.reduzidas, fase2: e.demais } : null;
}

/** Avisa se a quantidade de parcelas do PDF individual difere da Estratégia (o PDF individual vale). */
export function conferirParcelasComEstrategia(l: Leitura, e: EstrategiaGrupo | undefined): string[] {
  const p = l.plano_reduzido;
  const ref = parcelasReduzidasDa(e);
  if (!p || p.fase1_parcelas === null || !ref) return [];
  return p.fase1_parcelas !== ref.fase1 || p.fase2_parcelas !== ref.fase2
    ? [`parcelas reduzidas: PDF ${p.fase1_parcelas}+${p.fase2_parcelas}, Estratégia ${ref.fase1}+${ref.fase2} (vale o PDF)`]
    : [];
}
