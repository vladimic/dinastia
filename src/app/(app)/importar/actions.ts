"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PASTAS_PDF } from "@/lib/pastasPdf";
import { ehAdministrador } from "@/lib/usuario";

// Grava o caminho da pasta de uma família no parâmetro global correspondente.
export async function salvarPasta(campo: string, valor: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!(await ehAdministrador())) return { ok: false, erro: "Apenas administradores podem alterar as pastas." };
  if (!PASTAS_PDF.some((p) => p.campo === campo)) return { ok: false, erro: "Pasta desconhecida." };
  const caminho = String(valor ?? "").trim();
  if (caminho.length > 500) return { ok: false, erro: "Caminho muito longo (até 500 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("parametros_gerais")
    .update({ [campo]: caminho || null })
    .eq("id", 1);
  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/importar");
  revalidatePath("/parametros");
  return { ok: true };
}
