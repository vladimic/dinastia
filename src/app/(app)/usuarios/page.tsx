import type { Metadata } from "next";
import { Suspense } from "react";
import { AcessoRestrito } from "@/components/AcessoRestrito";
import { createClient } from "@/lib/supabase/server";
import { ehAdministrador, usuarioAtual } from "@/lib/usuario";
import { UsuariosTela, type Linha } from "./UsuariosTela";

export const metadata: Metadata = { title: "Usuários · Dinastia" };

export default function UsuariosPage() {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Usuários</h1>
      </header>
      <div className="px-8 pt-5 pb-10 max-sm:px-4">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Lista />
        </Suspense>
      </div>
    </>
  );
}

async function Lista() {
  if (!(await ehAdministrador())) return <AcessoRestrito />;
  const supabase = await createClient();
  const [{ data, error }, { data: logins }, atual] = await Promise.all([
    supabase.from("usuario").select("cpf, email, nome_completo, telefone, administrador").order("nome_completo"),
    supabase.rpc("logins_existentes"),
    usuarioAtual(),
  ]);
  if (error) throw error;
  const comLogin = new Set(((logins ?? []) as { email: string }[]).map((l) => l.email));
  const linhas: Linha[] = ((data ?? []) as Omit<Linha, "login">[]).map((u) => ({ ...u, login: comLogin.has(u.email) }));

  return <UsuariosTela linhas={linhas} meuCpf={atual?.cadastro?.cpf ?? ""} podeCriarLogin={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />;
}
