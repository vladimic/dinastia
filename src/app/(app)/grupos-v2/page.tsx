import type { Metadata } from "next";
import { Suspense } from "react";
import { FAMILIAS, carregarGrupo, carregarPadroesSimulador, contarPorFamilia, listarGrupos, listarIndices, nomeFamilia } from "@/lib/grupos";
import { padroesDeLinha } from "@/lib/simulacao";
import { ExportarResumo } from "../grupos/ExportarResumo";
import { GrupoV2 } from "./GrupoV2";
import { SeletorGrupo } from "./SeletorGrupo";

// Grupos e Tabelas ver2: mesma base de dados e mesmas gravações da versão 1 (/grupos), outra organização da tela.
export const metadata: Metadata = { title: "Grupos e Tabelas ver2 · Dinastia" };

export default function GruposV2Page({ searchParams }: PageProps<"/grupos-v2">) {
  return (
    <>
      <Cabecalho />
      <Suspense fallback={<p className="px-8 py-6 text-sm text-tinta">Carregando…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Cabecalho() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-borda bg-white px-8 py-3">
      <div className="flex flex-col">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="flex items-center gap-2 text-xl leading-tight font-bold">
          Grupos e Tabelas
          <span className="rounded-md bg-laranja-claro px-1.5 py-0.5 text-[11px] font-bold text-alerta">ver2</span>
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ExportarResumo />
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
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/grupos-v2">["searchParams"] }) {
  const sp = await searchParams;
  const numeroGrupo = typeof sp.grupo === "string" ? Number(sp.grupo) : undefined;
  const pedida = FAMILIAS.find((f) => f.slug === sp.familia);
  const aba = sp.aba === "simulador" ? "simulador" : "dados";

  const detalhe = numeroGrupo ? await carregarGrupo(numeroGrupo) : null;
  // sem família na URL, a lista mostra a família do grupo aberto
  const familia = pedida ?? FAMILIAS.find((f) => f.slug === detalhe?.familia) ?? FAMILIAS[0];

  const [grupos, contagem, indices, padroes] = await Promise.all([
    listarGrupos(familia.slug),
    contarPorFamilia(),
    detalhe ? listarIndices() : Promise.resolve([]),
    detalhe ? carregarPadroesSimulador() : Promise.resolve(padroesDeLinha(null)),
  ]);
  const hoje = new Date().toISOString().slice(0, 10);

  const seletor = (
    <SeletorGrupo
      familias={FAMILIAS}
      familia={familia.slug}
      contagem={contagem}
      hoje={hoje}
      atual={detalhe ? { numero: detalhe.numero, familiaNome: nomeFamilia(detalhe.familia) } : null}
      grupos={grupos.map((g) => ({
        numero: g.numero,
        prazo: g.prazo_grupo_meses,
        assembleia: g.assembleia,
        data: g.data_assembleia,
        min: g.min,
        max: g.max,
        participantes: g.participantes,
        furo: g.furo,
        reduzidas: g.reduzidas,
      }))}
    />
  );

  return (
    <div className="flex flex-col gap-4 px-8 pt-4 pb-10 max-sm:px-4">
      {detalhe ? (
        <GrupoV2
          key={detalhe.grupo_assembleia_id}
          grupo={detalhe}
          familiaNome={nomeFamilia(detalhe.familia)}
          indices={indices}
          hoje={hoje}
          padroes={padroes}
          abaInicial={aba}
          seletor={seletor}
        />
      ) : (
        <>
          {numeroGrupo ? <p className="text-sm font-semibold text-[#9b1c1c]">Grupo {numeroGrupo} não encontrado.</p> : null}
          {seletor}
          {grupos.length > 0 && <p className="text-sm text-tinta">Escolha um grupo para ver os dados e simular.</p>}
        </>
      )}
    </div>
  );
}
