import type { Metadata } from "next";
import { Suspense } from "react";
import { FAMILIAS, carregarGrupo, carregarPadroesSimulador, contarPorFamilia, listarCoresContemplacao, listarGrupos, listarIndices, nomeFamilia } from "@/lib/grupos";
import { padroesDeLinha } from "@/lib/simulacao";
import { ehAdministrador } from "@/lib/usuario";
import { Cabecalho } from "./Cabecalho";
import { GrupoDetalhe } from "./GrupoDetalhe";
import { SeletorGrupo } from "./SeletorGrupo";

export const metadata: Metadata = { title: "Grupos e Tabelas · Dinastia" };

export default function GruposPage({ searchParams }: PageProps<"/grupos">) {
  return (
    <Suspense fallback={<Cabecalho />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/grupos">["searchParams"] }) {
  const sp = await searchParams;
  const numeroGrupo = typeof sp.grupo === "string" ? Number(sp.grupo) : undefined;
  const pedida = FAMILIAS.find((f) => f.slug === sp.familia);
  const aba = sp.aba === "simulador" ? "simulador" : "dados";

  // tudo o que não depende do grupo aberto é buscado junto com ele (antes eram três etapas em fila).
  // Os links da tela sempre levam a família na URL; sem ela, a lista precisa esperar o grupo para saber qual é.
  const [detalhe, gruposPedida, cores, contagem, indices, padroes, admin] = await Promise.all([
    numeroGrupo ? carregarGrupo(numeroGrupo) : Promise.resolve(null),
    pedida ? listarGrupos(pedida.slug) : Promise.resolve(null),
    listarCoresContemplacao(),
    contarPorFamilia(),
    numeroGrupo ? listarIndices() : Promise.resolve([]),
    numeroGrupo ? carregarPadroesSimulador() : Promise.resolve(padroesDeLinha(null)),
    ehAdministrador(),
  ]);
  // sem família na URL, a lista mostra a família do grupo aberto
  const familia = pedida ?? FAMILIAS.find((f) => f.slug === detalhe?.familia) ?? FAMILIAS[0];
  const grupos = gruposPedida ?? (await listarGrupos(familia.slug));
  const hoje = new Date().toISOString().slice(0, 10);

  const seletor = (
    <SeletorGrupo
      cores={cores}
      familias={FAMILIAS}
      familia={familia.slug}
      contagem={contagem}
      hoje={hoje}
      atual={
        detalhe
          ? {
              numero: detalhe.numero,
              familiaNome: nomeFamilia(detalhe.familia),
              atualizadoEm: detalhe.atualizado_em ? new Date(detalhe.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null,
              arquivo: detalhe.arquivo,
            }
          : null
      }
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
        seq: g.seq,
      }))}
    />
  );

  // com um grupo aberto, o seletor fica no cabeçalho principal; sem grupo, a lista aparece aberta no corpo da página
  return (
    <>
      <Cabecalho seletor={detalhe ? seletor : undefined} />
      <div className="flex flex-col gap-4 px-8 pt-4 pb-10 max-sm:px-4">
        {detalhe ? (
          <GrupoDetalhe
            key={detalhe.grupo_assembleia_id}
            grupo={detalhe}
            familiaNome={nomeFamilia(detalhe.familia)}
            indices={indices}
            hoje={hoje}
            padroes={padroes}
            abaInicial={aba}
            podeEditar={admin}
          />
        ) : (
          <>
            {numeroGrupo ? <p className="text-sm font-semibold text-[#9b1c1c]">Grupo {numeroGrupo} não encontrado.</p> : null}
            {seletor}
            {grupos.length > 0 && <p className="text-sm text-tinta">Escolha um grupo para ver os dados e simular.</p>}
          </>
        )}
      </div>
    </>
  );
}
