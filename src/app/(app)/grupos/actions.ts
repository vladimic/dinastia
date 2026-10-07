"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerInt, lerPct } from "@/lib/formato";

export async function salvarGrupo(formData: FormData) {
  const id = Number(formData.get("id"));
  const familia = String(formData.get("familia_slug") ?? "");
  if (!id) throw new Error("Grupo inválido.");

  const indice = formData.get("indice_id");
  const mes = formData.get("mes_reajuste");

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupo")
    .update({
      numero: String(formData.get("numero") ?? "").trim(),
      participantes: lerInt(formData.get("participantes")),
      prazo_grupo_meses: lerInt(formData.get("prazo_grupo_meses")) ?? undefined,
      dia_vencimento: lerInt(formData.get("dia_vencimento")),
      taxa_adm_total: lerPct(formData.get("taxa_adm_total")),
      fundo_reserva: lerPct(formData.get("fundo_reserva")),
      indice_id: indice ? Number(indice) : null,
      mes_reajuste: mes ? Number(mes) : null,
      seguro_opcional_pre: formData.get("seguro_pre") === "opcional",
      seguro_obrigatorio_pos: formData.get("seguro_pos") === "obrigatorio",
      idade_limite_seguro: String(formData.get("idade_limite_seguro") ?? "").trim() || null,
      notas_internas: String(formData.get("notas_internas") ?? "").trim() || null,
    })
    .eq("id", id);

  const base = `/grupos?familia=${encodeURIComponent(familia)}&grupo=${id}`;
  if (error) redirect(`${base}&erro=1`);
  redirect(`${base}&salvo=1`);
}
