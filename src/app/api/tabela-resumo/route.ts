import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { carregarGrupos } from "@/lib/tabelaResumoDados";
import { GRUPOS_POR_PAGINA, lerMes, lerPorPagina, montarLinhas, nomeArquivo, type FamiliaResumo } from "@/lib/tabelaResumo";
import { tabelaResumoExcel } from "@/lib/tabelaResumoExcel";
import { tabelaResumoPdf } from "@/lib/tabelaResumoPdf";

// Tabela Resumo de uma família (?familia=imoveis, padrão, ou veiculos): ?formato=xlsx (só a aba Imóvel) ou ?formato=pdf (igual ao modelo), com ?mes=AAAA-MM de referência e, no PDF, ?porPagina=N (grupos por página)
export async function GET(request: NextRequest) {
  const formato = request.nextUrl.searchParams.get("formato");
  if (formato !== "xlsx" && formato !== "pdf") return NextResponse.json({ erro: "Formato inválido (xlsx ou pdf)." }, { status: 400 });

  const base = lerMes(request.nextUrl.searchParams.get("mes"));
  if (!base) return NextResponse.json({ erro: "Informe o mês de referência (mes=AAAA-MM)." }, { status: 400 });

  const pedidaFamilia = request.nextUrl.searchParams.get("familia") ?? "imoveis";
  if (pedidaFamilia !== "imoveis" && pedidaFamilia !== "veiculos") return NextResponse.json({ erro: "Família inválida (imoveis ou veiculos)." }, { status: 400 });
  const familia: FamiliaResumo = pedidaFamilia;

  const pedido = request.nextUrl.searchParams.get("porPagina");
  const porPagina = pedido === null ? GRUPOS_POR_PAGINA : lerPorPagina(pedido);
  if (porPagina === null) return NextResponse.json({ erro: "Grupos por página: número de 1 a 500." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  try {
    const grupos = await carregarGrupos(supabase, familia);
    const linhas = montarLinhas(grupos, base, familia);
    const cab = { "Cache-Control": "no-store", "X-Grupos": String(linhas.length) };
    if (formato === "xlsx") {
      const buffer = await tabelaResumoExcel(linhas, base, familia);
      return new Response(buffer, {
        headers: {
          ...cab,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${nomeArquivo(base, "xlsx", familia)}"`,
        },
      });
    }
    const { bytes, paginas } = await tabelaResumoPdf(linhas, base, porPagina, familia);
    return new Response(bytes as BodyInit, {
      headers: {
        ...cab,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo(base, "pdf", familia)}"`,
        "X-Paginas": String(paginas),
      },
    });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
