import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { excluirModalidade, incluirModalidade, salvarModalidade } from "./actions";

export const metadata: Metadata = { title: "Modalidades de Contemplação · Dinastia" };

const ERROS: Record<string, string> = {
  dados: "Dados inválidos. Código: até 10 letras/números (A-Z, 0-9, _ ou -). Nome obrigatório. Cor no formato #RRGGBB.",
  duplicado: "Já existe uma modalidade com esse código.",
  emuso: "Essa modalidade está em uso por grupos e não pode ser excluída.",
};

export default function ModalidadesPage({ searchParams }: PageProps<"/modalidades">) {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Modalidades de Contemplação</h1>
      </header>
      <div className="px-8 pt-5 pb-10">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Lista searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Lista({ searchParams }: { searchParams: PageProps<"/modalidades">["searchParams"] }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("tipo_contemplacao").select("codigo, nome, cor").order("codigo");
  if (error) throw error;
  const erro = typeof sp.erro === "string" ? (ERROS[sp.erro] ?? ERROS.dados) : null;

  return (
    <div className="flex w-[40rem] max-w-full flex-col gap-4">
      {sp.salvo === "1" && (
        <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          Modalidades salvas.
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          {erro}
        </p>
      )}

      <div className="rounded-2xl border border-borda bg-white p-5">
        <div className="mb-2 grid grid-cols-[6rem_1fr_4rem_auto] gap-3 text-[11px] font-semibold uppercase tracking-wide text-tinta">
          <span>Código</span>
          <span>Nome</span>
          <span>Cor</span>
          <span className="w-[10.5rem]" />
        </div>
        <ul className="flex flex-col gap-2">
          {(data ?? []).map((m) => (
            <li key={m.codigo} className="flex items-center gap-2">
              <form action={salvarModalidade} className="grid flex-1 grid-cols-[6rem_1fr_4rem_auto] items-center gap-3">
                <input type="hidden" name="codigo" value={m.codigo} />
                <span className="font-mono text-sm font-bold">{m.codigo}</span>
                <input className="campo-sm" name="nome" defaultValue={m.nome} maxLength={80} required aria-label={`Nome de ${m.codigo}`} />
                <input type="color" name="cor" defaultValue={m.cor.toLowerCase()} className="h-8 w-14 cursor-pointer rounded border border-borda-campo bg-campo p-0.5" aria-label={`Cor de ${m.codigo}`} />
                <button type="submit" className="min-h-8 rounded-[10px] bg-navy px-3 text-xs font-bold text-white hover:brightness-110">
                  Salvar
                </button>
              </form>
              <form action={excluirModalidade}>
                <input type="hidden" name="codigo" value={m.codigo} />
                <button type="submit" className="min-h-8 rounded-[10px] border border-borda-campo px-3 text-xs font-semibold text-tinta hover:bg-linha">
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <form action={incluirModalidade} className="grid grid-cols-[6rem_1fr_4rem_auto] items-end gap-3 rounded-2xl border border-borda bg-white p-5">
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          Código
          <input className="campo-sm font-mono uppercase" name="codigo" maxLength={10} required />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          Nome
          <input className="campo-sm" name="nome" maxLength={80} required />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          Cor
          <input type="color" name="cor" defaultValue="#8a8a94" className="h-8 w-14 cursor-pointer rounded border border-borda-campo bg-campo p-0.5" />
        </label>
        <button type="submit" className="min-h-8 rounded-[10px] bg-laranja px-4 text-xs font-bold text-navy hover:brightness-95">
          Incluir
        </button>
      </form>
    </div>
  );
}
