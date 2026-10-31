"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdministrador } from "@/lib/usuario";
import { FAMILIAS } from "@/lib/grupos";

const CODIGO = /^[A-Z0-9_-]{1,10}$/;
const COR = /^#[0-9a-fA-F]{6}$/;

function ler(formData: FormData) {
  const familia = String(formData.get("familia") ?? "");
  return {
    familia: FAMILIAS.some((f) => f.slug === familia) ? familia : "",
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    nome: String(formData.get("nome") ?? "").trim(),
    cor: String(formData.get("cor") ?? "").trim().toUpperCase(),
  };
}

// Inclui uma modalidade nova numa família. O código não muda depois de criado (ele liga a modalidade aos grupos). A mesma modalidade em duas famílias é criada duas vezes.
export async function incluirModalidade(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/modalidades");
  const { familia, codigo, nome, cor } = ler(formData);
  if (!familia || !CODIGO.test(codigo) || !nome || !COR.test(cor)) redirect("/modalidades?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").insert({ familia, codigo, nome, cor });
  redirect(`/modalidades?${error ? (error.code === "23505" ? "erro=duplicado" : "erro=dados") : "salvo=1"}`);
}

export async function salvarModalidade(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/modalidades");
  const { familia, codigo, nome, cor } = ler(formData);
  if (!familia || !codigo || !nome || !COR.test(cor)) redirect("/modalidades?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").update({ nome, cor }).eq("familia", familia).eq("codigo", codigo);
  redirect(`/modalidades?${error ? "erro=dados" : "salvo=1"}`);
}

// Só exclui se nenhum grupo usa a modalidade (as chaves estrangeiras recusam).
export async function excluirModalidade(formData: FormData) {
  if (!(await ehAdministrador())) redirect("/modalidades");
  const { familia, codigo } = ler(formData);
  if (!familia || !codigo) redirect("/modalidades?erro=dados");
  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").delete().eq("familia", familia).eq("codigo", codigo);
  redirect(`/modalidades?${error ? (error.code === "23503" ? "erro=emuso" : "erro=dados") : "salvo=1"}`);
}
