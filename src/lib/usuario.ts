import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Cadastro = {
  cpf: string;
  email: string;
  nome_completo: string;
  telefone: string;
  administrador: boolean;
};

/** Quem está logado e o cadastro dele em `usuario` (nulo se o e-mail não estiver cadastrado). Uma consulta por pedido. */
export const usuarioAtual = cache(async (): Promise<{ email: string; cadastro: Cadastro | null } | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  const { data } = await supabase
    .from("usuario")
    .select("cpf, email, nome_completo, telefone, administrador")
    .eq("email", email)
    .maybeSingle();
  return { email, cadastro: (data as Cadastro | null) ?? null };
});

export async function ehAdministrador(): Promise<boolean> {
  return (await usuarioAtual())?.cadastro?.administrador === true;
}
