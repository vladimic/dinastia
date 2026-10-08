import { createClient } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";
import { MenuUsuario } from "./MenuUsuario";

export async function UsuarioRodape() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <RodapeConteudo email={user?.email ?? ""} />;
}

export function RodapeConteudo({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="break-all text-[13px] font-semibold text-white">{email || " "}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-ouro">Versão {APP_VERSION}</span>
        <MenuUsuario />
      </div>
    </div>
  );
}
