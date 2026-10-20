import type { Metadata } from "next";
import { Suspense } from "react";
import { AcessoRestrito } from "@/components/AcessoRestrito";
import { createClient } from "@/lib/supabase/server";
import { PASTAS_PDF } from "@/lib/pastasPdf";
import { ehAdministrador } from "@/lib/usuario";
import { ImportarTela } from "./ImportarTela";

export const metadata: Metadata = { title: "Importar tabelas (PDF) · Dinastia" };

export default function ImportarPage() {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Importar tabelas (PDF)</h1>
      </header>
      <div className="px-8 pt-5 pb-10 max-sm:px-4">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Conteudo />
        </Suspense>
      </div>
    </>
  );
}

async function Conteudo() {
  if (!(await ehAdministrador())) return <AcessoRestrito />;
  const supabase = await createClient();
  const { data, error } = await supabase.from("parametros_gerais").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  const pastas = PASTAS_PDF.map((p) => ({ ...p, caminho: ((data as Record<string, string | null> | null)?.[p.campo] ?? "") as string }));
  return <ImportarTela pastas={pastas} />;
}
