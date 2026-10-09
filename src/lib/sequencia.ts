// Ordem de contemplação de uma faixa de assembleias, em códigos, para exibição horizontal.
// - expande as quantidades (2× LIV = LIV LIV);
// - descarta Sorteio Cancelada (SOC);
// - completa até o limite: se a faixa diz "demais" com um tipo (ex.: FIX), repete esse tipo;
//   se diz "mesma ordem", repete a ordem sem o sorteio (SOR).
export const LIMITE_ORDEM = 20;
const DESCARTADOS = new Set(["SOC"]);
const SORTEIO = "SOR";

export function montarOrdem(
  itens: { codigo: string; qtd: number }[],
  demais: string | null,
  limite = LIMITE_ORDEM,
): string[] {
  const base = itens.flatMap((i) => Array<string>(Math.max(1, i.qtd)).fill(i.codigo)).filter((c) => !DESCARTADOS.has(c));
  const ordem = base.slice(0, limite);
  if (ordem.length >= limite) return ordem;

  if (demais && !DESCARTADOS.has(demais)) {
    while (ordem.length < limite) ordem.push(demais);
    return ordem;
  }

  const ciclo = base.filter((c) => c !== SORTEIO);
  if (!ciclo.length) return ordem;
  for (let i = 0; ordem.length < limite; i++) ordem.push(ciclo[i % ciclo.length]);
  return ordem;
}

type ItemOrdem = { codigo: string; qtd: number };
export type FaixaOrdem = { de: number; ate: number; itens: ItemOrdem[]; demais: string | null };

const FIDELIDADE = "FID";
const semFidelidade = (f: FaixaOrdem) =>
  JSON.stringify([f.itens.filter((i) => i.codigo !== FIDELIDADE).map((i) => [i.codigo, i.qtd]), f.demais]);
const temFidelidade = (f: FaixaOrdem) => f.itens.some((i) => i.codigo === FIDELIDADE);

// Faixas vizinhas que só diferem pelo lance fidelidade viram uma só (a que traz o fidelidade).
export function unirFaixas(faixas: FaixaOrdem[]): FaixaOrdem[] {
  const out: FaixaOrdem[] = [];
  for (const f of faixas) {
    const ult = out[out.length - 1];
    if (ult && semFidelidade(ult) === semFidelidade(f)) {
      const base = temFidelidade(f) || !temFidelidade(ult) ? f : ult;
      out[out.length - 1] = { ...base, de: ult.de, ate: f.ate };
    } else out.push(f);
  }
  return out;
}
