"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdministrador } from "@/lib/usuario";
import { lerPct } from "@/lib/formato";
import { FAMILIAS } from "@/lib/grupos";

const CODIGO = /^[A-Z0-9_-]{1,20}$/;

function ler(formData: FormData) {
  const familia = String(formData.get("familia") ?? "");
  return {
    familia: FAMILIAS.some((f) => f.slug === familia) ? familia : "",
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    descricao: String(formData.get("descricao") ?? "").trim(),
    pct: lerPct(formData.get("pct")),
  };
}

const pctValido = (v: number | null): v is number => v !== null && v > 0 && v <= 100;

// Inclui um tipo novo numa família (o mesmo tipo em duas famílias é criado duas vezes). O código não muda depois de criado (ele liga o tipo às versões dos grupos).
export async function incluirTipoParcela(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/tipos-parcela");
  const { familia, codigo, descricao, pct } = ler(formData);
  if (!familia || !CODIGO.test(codigo) || !descricao || !pctValido(pct)) redirect("/tipos-parcela?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").insert({ familia, codigo, descricao, pct });
  redirect(`/tipos-parcela?${error ? (error.code === "23505" ? "erro=duplicado" : "erro=dados") : "salvo=1"}`);
}

export async function salvarTipoParcela(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/tipos-parcela");
  const { familia, codigo, descricao, pct } = ler(formData);
  if (!familia || !codigo || !descricao || !pctValido(pct)) redirect("/tipos-parcela?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").update({ descricao, pct }).eq("familia", familia).eq("codigo", codigo);
  redirect(`/tipos-parcela?${error ? "erro=dados" : "salvo=1"}`);
}

// Só exclui se nenhuma versão de grupo usa o tipo (a chave estrangeira recusa).
export async function excluirTipoParcela(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/tipos-parcela");
  const { familia, codigo } = ler(formData);
  if (!familia || !codigo) redirect("/tipos-parcela?erro=dados");
  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").delete().eq("familia", familia).eq("codigo", codigo);
  redirect(`/tipos-parcela?${error ? (error.code === "23503" ? "erro=emuso" : "erro=dados") : "salvo=1"}`);
}
