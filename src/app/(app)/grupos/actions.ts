"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerInt, lerPct } from "@/lib/formato";

// Salva os dados estáveis do grupo. Créditos, parcelas e regras vêm da importação de PDF.
export async function salvarGrupo(formData: FormData) {
  const numero = Number(formData.get("numero"));
  const familia = String(formData.get("familia") ?? "");
  if (!numero) throw new Error("Grupo inválido.");

  const indice = String(formData.get("indice") ?? "");
  const mes = formData.get("mes_reajuste");

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupo")
    .update({
      participantes: lerInt(formData.get("participantes")),
      prazo_grupo_meses: lerInt(formData.get("prazo_grupo_meses")) ?? undefined,
      dia_vencimento: lerInt(formData.get("dia_vencimento")),
      taxa_adm_total: lerPct(formData.get("taxa_adm_total")),
      fundo_reserva: lerPct(formData.get("fundo_reserva")),
      indice: indice || null,
      mes_reajuste: mes ? Number(mes) : null,
    })
    .eq("numero", numero);

  const base = `/grupos?familia=${encodeURIComponent(familia)}&grupo=${numero}`;
  redirect(`${base}&${error ? "erro" : "salvo"}=1`);
}
