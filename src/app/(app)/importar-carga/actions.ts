"use server";

import { createClient } from "@/lib/supabase/server";
import carga from "@/data/carga-2026-10-20-imoveis.json";

export type Resultado =
  | { ok: number[]; jaExistia: number[]; erros: { numero: number; msg: string }[] }
  | undefined;

// Carga única dos grupos de imóveis lidos dos PDFs (assembleia de 20/10/2026).
// Cada grupo vai pela função importar_grupo do banco, com a sessão e as regras de acesso do usuário.
export async function importarCarga(): Promise<Resultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: [], jaExistia: [], erros: [{ numero: 0, msg: "Sessão expirada. Entre de novo." }] };

  const res = { ok: [] as number[], jaExistia: [] as number[], erros: [] as { numero: number; msg: string }[] };
  for (const item of carga as unknown as Record<string, unknown>[]) {
    const numero = Number(item.numero);
    const { error } = await supabase.rpc("importar_grupo", { p: { ...item, aprovado_por: user.email } });
    if (!error) res.ok.push(numero);
    else if (error.message.includes("já tem a")) res.jaExistia.push(numero);
    else res.erros.push({ numero, msg: error.message });
  }
  return res;
}
