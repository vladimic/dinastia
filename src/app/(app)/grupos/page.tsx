import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FAMILIAS, carregarGrupo, contarPorFamilia, listarCoresContemplacao, listarGrupos, listarIndices } from "@/lib/grupos";
import { GrupoDetalheView } from "./GrupoDetalhe";
import { GrupoChips } from "./GrupoChips";

export const metadata: Metadata = { title: "Grupos e Tabelas · Dinastia" };

export default function GruposPage({ searchParams }: PageProps<"/grupos">) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-borda bg-white px-8 py-3">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div className="flex flex-col">
            <div className="text-[11px] text-tinta">Cadastros</div>
            <h1 className="text-xl font-bold leading-tight">Grupos e Tabelas</h1>
          </div>
          <Suspense fallback={<div className="h-8 w-80" />}>
            <SeletorFamilia searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Em breve"
            className="flex min-h-9 items-center gap-2 rounded-[10px] border border-navy bg-white px-3 text-[13px] font-semibold opacity-60"
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
            className="flex min-h-9 items-center gap-2 rounded-[10px] bg-navy px-3 text-[13px] font-semibold text-white opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ceaa5b" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </svg>
            Simular com IA
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-8 pt-4 pb-10">
        <Suspense fallback={<div className="py-10 text-sm text-tinta">Carregando…</div>}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function familiaPedida(sp: Record<string, string | string[] | undefined>) {
  const pedida = typeof sp.familia === "string" ? sp.familia : undefined;
  return FAMILIAS.find((f) => f.slug === pedida) ?? FAMILIAS[0];
}

async function SeletorFamilia({ searchParams }: { searchParams: PageProps<"/grupos">["searchParams"] }) {
  const [sp, contagem] = await Promise.all([searchParams, contarPorFamilia()]);
  const familia = familiaPedida(sp);
  return (
    <nav aria-label="Família de produto" className="flex flex-wrap gap-1.5">
      {FAMILIAS.map((f) => {
        const ativo = f.slug === familia.slug;
        return (
          <Link
            key={f.slug}
            href={`/grupos?familia=${f.slug}`}
            aria-current={ativo ? "true" : undefined}
            className={
              "flex h-8 items-center rounded-lg px-3 text-[13px] font-bold " +
              (ativo
                ? "bg-navy text-white shadow-[inset_0_-3px_0_var(--color-laranja)]"
                : "border border-borda-campo bg-white text-navy hover:border-navy")
            }
          >
            {f.nome} ({contagem[f.slug] ?? 0})
          </Link>
        );
      })}
    </nav>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/grupos">["searchParams"] }) {
  const sp = await searchParams;
  const familia = familiaPedida(sp);
  const numeroGrupo = typeof sp.grupo === "string" ? Number(sp.grupo) : undefined;

  const [grupos, cores, detalhe, indices] = await Promise.all([
    listarGrupos(familia.slug),
    listarCoresContemplacao(),
    numeroGrupo ? carregarGrupo(numeroGrupo) : Promise.resolve(null),
    numeroGrupo ? listarIndices() : Promise.resolve([]),
  ]);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      {grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda-campo bg-white px-5 py-4 text-sm text-tinta">
          Nenhum grupo cadastrado em {familia.nome}.
        </p>
      ) : (
        <GrupoChips
          familia={familia.slug}
          ativo={detalhe?.numero}
          hoje={hoje}
          cores={cores}
          grupos={grupos.map((g) => ({
            numero: g.numero,
            prazo: g.prazo_grupo_meses,
            assembleia: g.assembleia,
            data: g.data_assembleia,
            min: g.min,
            max: g.max,
            seq: g.seq,
            participantes: g.participantes,
            furo: g.furo,
            reduzidas: g.reduzidas,
          }))}
        />
      )}

      {detalhe ? (
        <GrupoDetalheView grupo={detalhe} indices={indices} hoje={hoje} />
      ) : numeroGrupo ? (
        <p className="py-2 text-sm font-semibold text-[#9b1c1c]">Grupo {numeroGrupo} não encontrado.</p>
      ) : grupos.length > 0 ? (
        <p className="py-2 text-sm text-tinta">Selecione um grupo para ver os dados da tabela.</p>
      ) : null}
    </>
  );
}
