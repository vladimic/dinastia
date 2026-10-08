"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CODIGO = /^[A-Z0-9_-]{1,10}$/;
const COR = /^#[0-9a-fA-F]{6}$/;

function ler(formData: FormData) {
  return {
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    nome: String(formData.get("nome") ?? "").trim(),
    cor: String(formData.get("cor") ?? "").trim().toUpperCase(),
  };
}

// Inclui uma modalidade nova. O código não muda depois de criado (ele liga a modalidade aos grupos).
export async function incluirModalidade(formData: FormData) {
  const { codigo, nome, cor } = ler(formData);
  if (!CODIGO.test(codigo) || !nome || !COR.test(cor)) redirect("/modalidades?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").insert({ codigo, nome, cor });
  redirect(`/modalidades?${error ? (error.code === "23505" ? "erro=duplicado" : "erro=dados") : "salvo=1"}`);
}

export async function salvarModalidade(formData: FormData) {
  const { codigo, nome, cor } = ler(formData);
  if (!codigo || !nome || !COR.test(cor)) redirect("/modalidades?erro=dados");

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").update({ nome, cor }).eq("codigo", codigo);
  redirect(`/modalidades?${error ? "erro=dados" : "salvo=1"}`);
}

// Só exclui se nenhum grupo usa a modalidade (as chaves estrangeiras recusam).
export async function excluirModalidade(formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("tipo_contemplacao").delete().eq("codigo", codigo);
  redirect(`/modalidades?${error ? (error.code === "23503" ? "erro=emuso" : "erro=dados") : "salvo=1"}`);
}
