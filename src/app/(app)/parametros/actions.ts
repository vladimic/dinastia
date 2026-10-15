"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerPct } from "@/lib/formato";

export async function salvarParametros(formData: FormData) {
  const seguro = lerPct(formData.get("seguro_padrao_pct"));
  if (seguro === null || seguro < 0 || seguro > 1) redirect("/parametros?erro=1");
  const incc = lerPct(formData.get("incc_pct_ano"));
  if (incc === null || incc < 0 || incc > 100) redirect("/parametros?erro=2");

  const supabase = await createClient();
  const { error } = await supabase.from("parametros_gerais").update({ seguro_padrao_pct: seguro, incc_pct_ano: incc }).eq("id", 1);
  redirect(`/parametros?${error ? "erro" : "salvo"}=1`);
}
