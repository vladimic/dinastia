"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PASTAS_PDF } from "@/lib/pastasPdf";
import { ehAdministrador } from "@/lib/usuario";
import { lerPct } from "@/lib/formato";
import { RODAPE_PADRAO, type TipoColuna } from "@/lib/simulacao";

const inteiro = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isInteger(n) ? n : NaN;
};

export async function salvarParametros(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/parametros");
  const seguro = lerPct(formData.get("seguro_padrao_pct"));
  if (seguro === null || seguro < 0 || seguro > 1) redirect("/parametros?erro=1");
  const incc = lerPct(formData.get("incc_pct_ano"));
  if (incc === null || incc < 0 || incc > 100) redirect("/parametros?erro=2");
  const inpc = lerPct(formData.get("inpc_pct_ano"));
  if (inpc === null || inpc < 0 || inpc > 100) redirect("/parametros?erro=2");
  const contemplacao = inteiro(formData.get("contemplacao_meses"));
  if (!(contemplacao >= 1 && contemplacao <= 999)) redirect("/parametros?erro=3");
  // 7 prazos de atalho de "Contemplação em": inteiros de 1 a 999, sem repetir; gravados em ordem crescente
  const prazos = [1, 2, 3, 4, 5, 6, 7].map((i) => inteiro(formData.get(`contemplacao_prazo_${i}`)));
  if (prazos.some((v) => !(v >= 1 && v <= 999)) || new Set(prazos).size !== 7) redirect("/parametros?erro=7");
  prazos.sort((a, b) => a - b);
  const livre = inteiro(formData.get("lance_livre_parcelas"));
  const fidelidade = inteiro(formData.get("lance_fidelidade_parcelas"));
  if (!(livre >= 1 && livre <= 999) || !(fidelidade >= 1 && fidelidade <= 999)) redirect("/parametros?erro=4");
  // veículos: lances livre e fidelidade em % da categoria
  const livrePct = lerPct(formData.get("lance_livre_pct"));
  const fidelidadePct = lerPct(formData.get("lance_fidelidade_pct"));
  const minimaPct = lerPct(formData.get("parcela_minima_padrao_pct"));
  if (minimaPct === null || !(minimaPct > 0 && minimaPct <= 100)) redirect("/parametros?erro=4");
  if (livrePct === null || fidelidadePct === null || !(livrePct > 0 && livrePct <= 100) || !(fidelidadePct > 0 && fidelidadePct <= 100)) redirect("/parametros?erro=4");

  const conc: Record<string, number> = {};
  for (const k of ["fixo", "limitado", "livre", "fidelidade"]) {
    const v = lerPct(formData.get(`concorrencia_${k}_pct`));
    if (v === null || v < 0 || v > 100) redirect("/parametros?erro=5");
    conc[`concorrencia_${k}_pct`] = v;
  }

  // concorrência dos lances de veículos
  const concVeic: Record<string, number> = {};
  for (const k of ["fixo25", "fixo40", "livre", "fidelidade"]) {
    const v = lerPct(formData.get(`concorrencia_veic_${k}_pct`));
    if (v === null || v < 0 || v > 100) redirect("/parametros?erro=5");
    concVeic[`concorrencia_veic_${k}_pct`] = v;
  }

  const rodape = {} as Record<TipoColuna, { titulo: string; texto: string }>;
  for (const k of Object.keys(RODAPE_PADRAO) as TipoColuna[]) {
    const titulo = String(formData.get(`rodape_${k}_titulo`) ?? "").trim();
    const texto = String(formData.get(`rodape_${k}_texto`) ?? "").trim();
    if (!titulo || !texto || titulo.length > 60 || texto.length > 80) redirect("/parametros?erro=6");
    rodape[k] = { titulo, texto };
  }

  const pastas: Record<string, string | null> = {};
  for (const { campo } of PASTAS_PDF) {
    const v = String(formData.get(campo) ?? "").replace(/[\r\n]+/g, "").trim();
    if (v.length > 500) redirect("/parametros?erro=8");
    pastas[campo] = v || null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("parametros_gerais")
    .update({
      seguro_padrao_pct: seguro,
      incc_pct_ano: incc,
      inpc_pct_ano: inpc,
      contemplacao_meses: contemplacao,
      contemplacao_prazos: prazos,
      lance_livre_parcelas: livre,
      lance_fidelidade_parcelas: fidelidade,
      parcela_minima_padrao_pct: minimaPct,
      lance_livre_pct: livrePct,
      lance_fidelidade_pct: fidelidadePct,
      ...conc,
      ...concVeic,
      rodape_textos: rodape,
      ...pastas,
    })
    .eq("id", 1);
  redirect(`/parametros?${error ? "erro" : "salvo"}=1`);
}
