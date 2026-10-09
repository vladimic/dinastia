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
