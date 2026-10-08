"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerPct } from "@/lib/formato";

const CODIGO = /^[A-Z0-9_-]{1,20}$/;

function ler(formData: FormData) {
  return {
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    descricao: String(formData.get("descricao") ?? "").trim(),
    pct: lerPct(formData.get("pct")),
  };
}

const pctValido = (v: number | null): v is number => v !== null && v > 0 && v <= 100;

// Inclui um tipo novo. O código não muda depois de criado (ele liga o tipo às versões dos grupos).
export async function incluirTipoParcela(formData: FormData) {
  const { codigo, descricao, pct } = ler(formData);
  if (!CODIGO.test(codigo) || !descricao || !pctValido(pct)) redirect("/tipos-parcela?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").insert({ codigo, descricao, pct });
  redirect(`/tipos-parcela?${error ? (error.code === "23505" ? "erro=duplicado" : "erro=dados") : "salvo=1"}`);
}

export async function salvarTipoParcela(formData: FormData) {
  const { codigo, descricao, pct } = ler(formData);
  if (!codigo || !descricao || !pctValido(pct)) redirect("/tipos-parcela?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").update({ descricao, pct }).eq("codigo", codigo);
  redirect(`/tipos-parcela?${error ? "erro=dados" : "salvo=1"}`);
}

// Só exclui se nenhuma versão de grupo usa o tipo (a chave estrangeira recusa).
export async function excluirTipoParcela(formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("tipo_parcela").delete().eq("codigo", codigo);
  redirect(`/tipos-parcela?${error ? (error.code === "23503" ? "erro=emuso" : "erro=dados") : "salvo=1"}`);
}
