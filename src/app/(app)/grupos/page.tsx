import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FAMILIAS, carregarGrupo, contarPorFamilia, listarGrupos, listarIndices } from "@/lib/grupos";
import { GrupoDetalheView } from "./GrupoDetalhe";
import { GrupoChips } from "./GrupoChips";

export const metadata: Metadata = { title: "Grupos e Tabelas · Dinastia" };

export default function GruposPage({ searchParams }: PageProps<"/grupos">) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-borda bg-white px-8 py-[18px]">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-tinta">Cadastros</div>
          <h1 className="text-[22px] font-bold">Grupos e Tabelas</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled
            title="Em breve"
            className="flex min-h-11 items-center gap-2 rounded-[10px] border border-navy bg-white px-4 text-sm font-semibold opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
            </svg>
            Importar PDFs
          </button>
          <button
            type="button"
            disabled
            title="Em breve"
            className="flex min-h-11 items-center gap-2 rounded-[10px] bg-navy px-4 text-sm font-semibold text-white opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ceaa5b" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </svg>
            Simular com IA
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-8 pt-6 pb-10">
        <Suspense fallback={<div className="py-10 text-sm text-tinta">Carregando…</div>}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function Etapa({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-[0.12em] text-tinta">
      {n} · {children}
    </div>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/grupos">["searchParams"] }) {
  const sp = await searchParams;
  const pedida = typeof sp.familia === "string" ? sp.familia : undefined;
  const familia = FAMILIAS.find((f) => f.slug === pedida) ?? FAMILIAS[0];
  const numeroGrupo = typeof sp.grupo === "string" ? Number(sp.grupo) : undefined;

  const [contagem, grupos, detalhe, indices] = await Promise.all([
    contarPorFamilia(),
    listarGrupos(familia.slug),
    numeroGrupo ? carregarGrupo(numeroGrupo) : Promise.resolve(null),
    numeroGrupo ? listarIndices() : Promise.resolve([]),
  ]);

  return (
    <>
      <section aria-label="Família de produto" className="flex flex-col gap-3">
        <Etapa n={1}>Família de produto</Etapa>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {FAMILIAS.map((f) => {
            const ativo = f.slug === familia.slug;
            const qtd = contagem[f.slug] ?? 0;
            return (
              <Link
                key={f.slug}
                href={`/grupos?familia=${f.slug}`}
                aria-current={ativo ? "true" : undefined}
                className={
                  "flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-[14px] px-[18px] py-3.5 " +
                  (ativo
                    ? "border-2 border-navy bg-navy text-white shadow-[inset_0_-4px_0_var(--color-laranja)]"
                    : "border border-borda-campo bg-white text-navy hover:border-navy")
                }
              >
                <span className="text-base font-bold">{f.nome}</span>
                <span className="text-xs opacity-80">{qtd === 0 ? "Nenhum grupo" : qtd === 1 ? "1 grupo" : `${qtd} grupos`}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Grupos" className="flex flex-col gap-3">
        <Etapa n={2}>Grupo{grupos.length ? ` · ${grupos.length}` : ""}</Etapa>
        {grupos.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-borda-campo bg-white p-7">
            <span className="text-sm text-tinta">Nenhum grupo cadastrado em {familia.nome}.</span>
            <span className="text-sm font-bold text-tinta" title="Em breve">
              Importar PDF de tabela
            </span>
          </div>
        ) : (
          <GrupoChips
            familia={familia.slug}
            ativo={detalhe?.numero}
            hoje={new Date().toISOString().slice(0, 10)}
            grupos={grupos.map((g) => ({
              numero: g.numero,
              prazo: g.prazo_grupo_meses,
              assembleia: g.assembleia,
              data: g.data_assembleia,
              min: g.min,
              max: g.max,
              qtdCreditos: g.qtdCreditos,
            }))}
          />
        )}
      </section>

      {detalhe ? (
        <GrupoDetalheView grupo={detalhe} indices={indices} salvo={sp.salvo === "1"} erro={sp.erro === "1"} />
      ) : numeroGrupo ? (
        <p className="py-2 text-sm font-semibold text-[#9b1c1c]">Grupo {numeroGrupo} não encontrado.</p>
      ) : grupos.length > 0 ? (
        <p className="py-2 text-sm text-tinta">Selecione um grupo para ver os dados da tabela.</p>
      ) : null}
    </>
  );
}
