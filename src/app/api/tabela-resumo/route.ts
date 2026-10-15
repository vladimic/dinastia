import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { carregarGruposImoveis } from "@/lib/tabelaResumoDados";
import { lerMes, montarLinhas, nomeArquivo } from "@/lib/tabelaResumo";
import { tabelaResumoExcel } from "@/lib/tabelaResumoExcel";
import { tabelaResumoPdf } from "@/lib/tabelaResumoPdf";

// Tabela Resumo dos imóveis: ?formato=xlsx (só a aba Imóvel) ou ?formato=pdf (igual ao modelo), com ?mes=AAAA-MM de referência
export async function GET(request: NextRequest) {
  const formato = request.nextUrl.searchParams.get("formato");
  if (formato !== "xlsx" && formato !== "pdf") return NextResponse.json({ erro: "Formato inválido (xlsx ou pdf)." }, { status: 400 });

  const base = lerMes(request.nextUrl.searchParams.get("mes"));
  if (!base) return NextResponse.json({ erro: "Informe o mês de referência (mes=AAAA-MM)." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  try {
    const grupos = await carregarGruposImoveis(supabase);
    const linhas = montarLinhas(grupos, base);
    const cab = { "Cache-Control": "no-store", "X-Grupos": String(linhas.length) };
    if (formato === "xlsx") {
      const buffer = await tabelaResumoExcel(linhas, base);
      return new Response(buffer, {
        headers: {
          ...cab,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${nomeArquivo(base, "xlsx")}"`,
        },
      });
    }
    const { bytes, paginas } = await tabelaResumoPdf(linhas, base);
    return new Response(bytes as BodyInit, {
      headers: {
        ...cab,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo(base, "pdf")}"`,
        "X-Paginas": String(paginas),
      },
    });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
