import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportarBackup, restaurarBackup, validarBackup } from "@/lib/backup";

async function usuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Exporta tudo que o usuário pode ler, em um JSON
export async function GET() {
  const { supabase, user } = await usuario();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  try {
    const backup = await exportarBackup(supabase, user.email ?? "");
    return NextResponse.json(backup, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}

// Restaura um backup (repõe o que falta; nunca apaga)
export async function POST(request: NextRequest) {
  const { supabase, user } = await usuario();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  try {
    const b = await request.json();
    validarBackup(b);
    const r = await restaurarBackup(supabase, b, user.email ?? "");
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 400 });
  }
}
