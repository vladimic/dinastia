import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { APP_VERSION } from "@/lib/version";

export async function UsuarioRodape() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <RodapeConteudo email={user?.email ?? ""} />;
}

export function RodapeConteudo({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <div className="break-all text-[13px] font-semibold text-white">{email || " "}</div>
        <div className="text-xs tabular-nums text-ouro">Versão {APP_VERSION}</div>
      </div>
      <form action={sair}>
        <button
          type="submit"
          className="flex min-h-9 items-center gap-2 rounded-lg border border-[#3a3080] px-3 text-[13px] text-[#e9e6f5] hover:bg-navy-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
          </svg>
          Sair
        </button>
      </form>
    </div>
  );
}
