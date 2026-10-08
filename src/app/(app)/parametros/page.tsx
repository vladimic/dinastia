import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { pct } from "@/lib/formato";
import { salvarParametros } from "./actions";

export const metadata: Metadata = { title: "Parâmetros globais · Dinastia" };

export default function ParametrosPage({ searchParams }: PageProps<"/parametros">) {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Parâmetros globais</h1>
      </header>
      <div className="px-8 pt-5 pb-10">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Formulario searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Formulario({ searchParams }: { searchParams: PageProps<"/parametros">["searchParams"] }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parametros_gerais")
    .select("seguro_padrao_pct, atualizado_em")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;

  return (
    <form action={salvarParametros} className="flex w-[26rem] max-w-full flex-col gap-4 rounded-2xl border border-borda bg-white p-5">
      <h2 className="text-sm font-bold">Seguro prestamista</h2>
      <label className="grid grid-cols-[1fr_7rem] items-center gap-3 text-xs font-semibold text-tinta">
        % do crédito ao mês (todos os grupos)
        <input
          className="campo-sm"
          name="seguro_padrao_pct"
          inputMode="decimal"
          defaultValue={pct(data?.seguro_padrao_pct, 4)}
          required
        />
      </label>
      <p className="text-[11px] leading-snug text-tinta">
        Usado no cálculo do seguro de todos os grupos. Ex.: 0,0472% de R$ 300.000,00 = R$ 141,60 por mês.
      </p>

      {sp.salvo === "1" && (
        <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          Parâmetros salvos.
        </p>
      )}
      {sp.erro === "1" && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          Valor inválido. Informe um percentual entre 0 e 1, ex.: 0,0472.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-linha pt-3">
        <span className="text-xs text-tinta">
          {data?.atualizado_em
            ? `Atualizado em ${new Date(data.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            : ""}
        </span>
        <button type="submit" className="min-h-9 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95">
          Salvar
        </button>
      </div>
    </form>
  );
}
