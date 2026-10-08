import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { pct } from "@/lib/formato";
import { excluirTipoParcela, incluirTipoParcela, salvarTipoParcela } from "./actions";

export const metadata: Metadata = { title: "Tipos de Parcela · Dinastia" };

const ERROS: Record<string, string> = {
  dados: "Dados inválidos. Código: até 20 letras/números (A-Z, 0-9, _ ou -). Descrição obrigatória. Percentual maior que 0 e até 100, ex.: 85,00.",
  duplicado: "Já existe um tipo de parcela com esse código.",
  emuso: "Esse tipo está em uso por versões de grupos e não pode ser excluído.",
};

const COLUNAS = "grid-cols-[8rem_1fr_6rem_5rem_auto]";

export default function TiposParcelaPage({ searchParams }: PageProps<"/tipos-parcela">) {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Tipos de Parcela</h1>
      </header>
      <div className="px-8 pt-5 pb-10">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Lista searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Lista({ searchParams }: { searchParams: PageProps<"/tipos-parcela">["searchParams"] }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [tipos, usos] = await Promise.all([
    supabase.from("tipo_parcela").select("codigo, descricao, pct").order("pct", { ascending: false }),
    supabase.from("grupo_assembleia_tipo_parcela").select("tipo_parcela").range(0, 99999),
  ]);
  if (tipos.error) throw tipos.error;
  if (usos.error) throw usos.error;

  const emUso = new Map<string, number>();
  for (const u of usos.data ?? []) emUso.set(u.tipo_parcela, (emUso.get(u.tipo_parcela) ?? 0) + 1);
  const erro = typeof sp.erro === "string" ? (ERROS[sp.erro] ?? ERROS.dados) : null;

  return (
    <div className="flex w-[46rem] max-w-full flex-col gap-4">
      {sp.salvo === "1" && (
        <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          Tipos de parcela salvos.
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          {erro}
        </p>
      )}

      <div className="rounded-2xl border border-borda bg-white p-5">
        <div className={`mb-2 grid ${COLUNAS} gap-3 text-[11px] font-semibold uppercase tracking-wide text-tinta`}>
          <span>Código</span>
          <span>Descrição</span>
          <span>% da parcela</span>
          <span>Em uso</span>
          <span className="w-[10.5rem]" />
        </div>
        <ul className="flex flex-col gap-2">
          {(tipos.data ?? []).map((t) => {
            const n = emUso.get(t.codigo) ?? 0;
            return (
              <li key={t.codigo} className="flex items-center gap-2">
                <form action={salvarTipoParcela} className={`grid flex-1 ${COLUNAS} items-center gap-3`}>
                  <input type="hidden" name="codigo" value={t.codigo} />
                  <span className="font-mono text-sm font-bold">{t.codigo}</span>
                  <input className="campo-sm" name="descricao" defaultValue={t.descricao} maxLength={80} required aria-label={`Descrição de ${t.codigo}`} />
                  <input className="campo-sm text-right" name="pct" inputMode="decimal" defaultValue={pct(t.pct)} required aria-label={`Percentual de ${t.codigo}`} />
                  <span className="text-xs tabular-nums text-tinta" title="Versões de grupos que oferecem este tipo">
                    {n.toLocaleString("pt-BR")}
                  </span>
                  <button type="submit" className="min-h-8 rounded-[10px] bg-navy px-3 text-xs font-bold text-white hover:brightness-110">
                    Salvar
                  </button>
                </form>
                <form action={excluirTipoParcela}>
                  <input type="hidden" name="codigo" value={t.codigo} />
                  <button
                    type="submit"
                    disabled={n > 0}
                    title={n > 0 ? "Em uso por versões de grupos" : undefined}
                    className="min-h-8 rounded-[10px] border border-borda-campo px-3 text-xs font-semibold text-tinta hover:bg-linha disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Excluir
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>

      <form action={incluirTipoParcela} className={`grid ${COLUNAS} items-end gap-3 rounded-2xl border border-borda bg-white p-5`}>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          Código
          <input className="campo-sm font-mono uppercase" name="codigo" maxLength={20} required />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          Descrição
          <input className="campo-sm" name="descricao" maxLength={80} required />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-tinta">
          % da parcela
          <input className="campo-sm text-right" name="pct" inputMode="decimal" required />
        </label>
        <span />
        <button type="submit" className="min-h-8 rounded-[10px] bg-laranja px-4 text-xs font-bold text-navy hover:brightness-95">
          Incluir
        </button>
      </form>
    </div>
  );
}
