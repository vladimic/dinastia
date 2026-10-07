const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR");

export function reais(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return brl.format(Number(v));
}

export function milhar(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return num.format(Number(v));
}

/** 553368.1 → "R$ 553 mil" */
export function reaisMil(v: number | string) {
  return `R$ ${num.format(Math.round(Number(v) / 1000))} mil`;
}

/** 24 → "24,00%"; casas configuráveis */
export function pct(v: number | string | null | undefined, casas = 2) {
  if (v === null || v === undefined || v === "") return "";
  return (
    Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + "%"
  );
}

/** "24,5%" ou "24,5" → 24.5 ; vazio → null */
export function lerPct(s: FormDataEntryValue | null): number | null {
  const t = String(s ?? "").replace("%", "").replace(/\./g, "").replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** "3.333" → 3333 ; vazio → null */
export function lerInt(s: FormDataEntryValue | null): number | null {
  const t = String(s ?? "").replace(/\D/g, "");
  return t ? Number(t) : null;
}

export function dataBR(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
