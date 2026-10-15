import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportarExcel } from "@/lib/excel";

// Exporta todas as tabelas que o usuário pode ler, em um .xlsx (uma aba por tabela)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  try {
    const { buffer, tabelas, linhas } = await exportarExcel(supabase);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
        "X-Tabelas": String(tabelas),
        "X-Linhas": String(linhas),
      },
    });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
