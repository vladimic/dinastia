"use server";

import { revalidatePath } from "next/cache";
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

// Marca ou desmarca um tipo de parcela oferecido pelo grupo na versão (assembleia) vigente.
export async function alternarTipoParcela(versaoId: number, tipo: string, marcado: boolean): Promise<{ ok: boolean }> {
  if (!Number.isInteger(versaoId) || !tipo) return { ok: false };
  const supabase = await createClient();
  const { error } = marcado
    ? await supabase
        .from("grupo_assembleia_tipo_parcela")
        .upsert({ grupo_assembleia_id: versaoId, tipo_parcela: tipo }, { onConflict: "grupo_assembleia_id,tipo_parcela" })
    : await supabase.from("grupo_assembleia_tipo_parcela").delete().eq("grupo_assembleia_id", versaoId).eq("tipo_parcela", tipo);
  if (error) return { ok: false };
  revalidatePath("/grupos");
  return { ok: true };
}

// Pagamento com furo na versão vigente: true = sim, false = não.
export async function definirPagamentoComFuro(versaoId: number, valor: boolean): Promise<{ ok: boolean }> {
  if (!Number.isInteger(versaoId)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("grupo_assembleia").update({ pagamento_com_furo: valor }).eq("id", versaoId);
  if (error) return { ok: false };
  revalidatePath("/grupos");
  return { ok: true };
}
