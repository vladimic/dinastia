import type { Leitura, Linha } from "./tipos";

// "Estratégia Comercial" de Veículos: um PDF só, com uma linha por grupo (créditos, taxa, prazos e o plano reduzido do mês).
// Não é fonte de dados: o PDF individual de cada grupo manda. Serve para conferir a leitura (conferirComEstrategia).

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

const nomeDoTipo = (tipo: string) => (tipo === "CLEARANCE" ? "CLEARANCE" : tipo.startsWith("PLANO_") ? `PLANO ${tipo.slice(6)}` : `PLANO REDUZIDO ${tipo.slice(4)}%`);

/** Diferenças entre o PDF individual e a linha do grupo na Estratégia (avisos: o PDF individual vale). */
export function conferirComEstrategia(l: Leitura, e: EstrategiaGrupo): string[] {
  const av: string[] = [];
  const cr = l.creditos.map((c) => c.credito);
  const min = Math.min(...cr);
  const max = Math.max(...cr);
  if (Math.abs(min - e.creditoMin) > 0.01 || Math.abs(max - e.creditoMax) > 0.01)
    av.push(`Estratégia: créditos ${e.creditoMin.toLocaleString("pt-BR")} a ${e.creditoMax.toLocaleString("pt-BR")}, PDF ${min.toLocaleString("pt-BR")} a ${max.toLocaleString("pt-BR")}`);
  if (Math.abs(l.taxa_adm - e.taxa) > 0.001) av.push(`Estratégia: taxa ${e.taxa}%, PDF ${l.taxa_adm}%`);
  if (l.fundo_reserva !== null && Math.abs(l.fundo_reserva - e.fundo) > 0.001) av.push(`Estratégia: fundo ${e.fundo}%, PDF ${l.fundo_reserva}%`);
  if (l.prazo_grupo !== e.prazoGrupo) av.push(`Estratégia: prazo do grupo ${e.prazoGrupo}, PDF ${l.prazo_grupo}`);
  if (l.prazo_cota !== e.prazoRestante) av.push(`Estratégia: prazo restante ${e.prazoRestante}, PDF ${l.prazo_cota}`);
  const p = l.plano_reduzido;
  if (!p && e.plano) av.push(`Estratégia: plano ${e.plano}, o PDF não traz plano reduzido`);
  else if (p && !e.plano) av.push(`PDF: plano reduzido ${nomeDoTipo(p.tipo)}, a Estratégia não o lista`);
  else if (p && e.plano) {
    if (nomeDoTipo(p.tipo) !== e.plano.toUpperCase()) av.push(`Estratégia: plano ${e.plano}, PDF ${nomeDoTipo(p.tipo)}`);
    if (p.fase1_parcelas !== null && (p.fase1_parcelas !== e.reduzidas || p.fase2_parcelas !== e.demais || p.fase1_parcelas + (p.fase2_parcelas ?? 0) !== e.prazoComl))
      av.push(`Estratégia: ${e.reduzidas}+${e.demais} parcelas (prazo ${e.prazoComl}), PDF ${p.fase1_parcelas}+${p.fase2_parcelas}`);
  }
  return av;
}
