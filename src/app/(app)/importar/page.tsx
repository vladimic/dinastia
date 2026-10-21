import type { Metadata } from "next";
import { Suspense } from "react";
import { AcessoRestrito } from "@/components/AcessoRestrito";
import { createClient } from "@/lib/supabase/server";
import { FILTROS, type Filtro } from "@/lib/pdf/filtros";
import { PASTAS_PDF } from "@/lib/pastasPdf";
import { ehAdministrador } from "@/lib/usuario";
import { calcularFaltantes } from "@/lib/pdf/faltantes";
import { ImportarTela } from "./ImportarTela";
import { PainelFaltantes } from "./PainelFaltantes";
import { PainelDecisoes, type Contagens, type ItemTela, type Agregado } from "./PainelDecisoes";

export const metadata: Metadata = { title: "Importar tabelas (PDF) · Dinastia" };

const POR_PAGINA = 15;

export default function ImportarPage({ searchParams }: PageProps<"/importar">) {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Importar tabelas (PDF)</h1>
      </header>
      <div className="px-8 pt-5 pb-10 max-sm:px-4">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function todas<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const saida: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await consulta(de, de + 999);
    if (error) throw error;
    saida.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return saida;
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/importar">["searchParams"] }) {
  if (!(await ehAdministrador())) return <AcessoRestrito />;
  const sp = await searchParams;
  const filtro = (FILTROS as readonly string[]).includes(String(sp.v)) ? (sp.v as Filtro) : "pendentes";
  const pagina = Math.max(1, Number(sp.p) || 1);
  const supabase = await createClient();

  const [{ data: parametros, error }, itens, pendentesDif] = await Promise.all([
    supabase.from("parametros_gerais").select("*").eq("id", 1).maybeSingle(),
    todas<{ id: number; situacao: string }>((a, b) => supabase.from("importacao_item").select("id, situacao").order("id").range(a, b)),
    todas<{ id: number; item_id: number; escopo: string; campo: string }>((a, b) => supabase.from("importacao_diferenca").select("id, item_id, escopo, campo").eq("decisao", "pendente").order("id").range(a, b)),
  ]);
  if (error) throw error;

  const comPendencia = new Set(pendentesDif.map((d) => d.item_id));
  const pendentes = itens.filter((i) => i.situacao === "pendente");
  const prontos = pendentes.filter((i) => !comPendencia.has(i.id));
  const contagens: Contagens = {
    pendentes: pendentes.length,
    prontos: prontos.length,
    aplicados: itens.filter((i) => i.situacao === "aplicado").length,
    sem_mudanca: itens.filter((i) => i.situacao === "sem_mudanca").length,
    erros: itens.filter((i) => i.situacao === "erro").length,
    ignorados: itens.filter((i) => i.situacao === "ignorado" || i.situacao === "rejeitado").length,
    diferencasPendentes: pendentesDif.length,
  };

  const mapa = new Map<string, Agregado>();
  for (const d of pendentesDif) {
    const k = `${d.escopo}|${d.campo}`;
    mapa.set(k, { escopo: d.escopo, campo: d.campo, total: (mapa.get(k)?.total ?? 0) + 1 });
  }
  const agregados = [...mapa.values()].sort((a, b) => b.total - a.total);

  const idsFiltro: number[] =
    filtro === "pendentes" ? pendentes.map((i) => i.id)
    : filtro === "prontos" ? prontos.map((i) => i.id)
    : itens.filter((i) => (filtro === "aplicados" ? i.situacao === "aplicado" : filtro === "sem_mudanca" ? i.situacao === "sem_mudanca" : filtro === "erros" ? i.situacao === "erro" : i.situacao === "ignorado" || i.situacao === "rejeitado")).map((i) => i.id);
  const totalPaginas = Math.max(1, Math.ceil(idsFiltro.length / POR_PAGINA));
  const idsPagina = idsFiltro.slice((Math.min(pagina, totalPaginas) - 1) * POR_PAGINA, Math.min(pagina, totalPaginas) * POR_PAGINA);

  let lista: ItemTela[] = [];
  if (idsPagina.length) {
    const { data, error: e2 } = await supabase
      .from("importacao_item")
      .select("id, arquivo, grupo_numero, assembleia_numero, situacao, tipo, motivo, importacao_diferenca(id, escopo, chave, campo, rotulo, valor_atual, valor_novo, decisao, valor_final)")
      .in("id", idsPagina)
      .order("grupo_numero");
    if (e2) throw e2;
    lista = (data ?? []) as unknown as ItemTela[];
  }

  const faltantes = await calcularFaltantes(supabase);
  const pastas = PASTAS_PDF.map((p) => ({ ...p, caminho: ((parametros as Record<string, string | null> | null)?.[p.campo] ?? "") as string }));
  return (
    <div className="flex max-w-[72rem] flex-col gap-6">
      <ImportarTela pastas={pastas} />
      {faltantes.dataRef && <PainelFaltantes dataRef={faltantes.dataRef} pdfsNaData={faltantes.pdfsNaData} faltantes={faltantes.faltantes} />}
      <PainelDecisoes contagens={contagens} agregados={agregados} itens={lista} filtro={filtro} pagina={Math.min(pagina, totalPaginas)} totalPaginas={totalPaginas} idsProntos={prontos.map((i) => i.id)} />
    </div>
  );
}
