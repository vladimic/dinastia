import type { ReactNode } from "react";
import { APP_VERSION } from "@/lib/version";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="flex flex-[1_1_420px] flex-col justify-between gap-10 bg-navy p-10 sm:p-14">
        <div className="flex flex-col gap-2">
          <div className="font-display text-6xl font-bold leading-none tracking-wide text-ouro">
            Dinastia
          </div>
          <div className="text-[13px] uppercase tracking-[0.2em] text-[#b9b3d6]">
            Estruturação de Patrimônio
          </div>
          <div className="mt-5 h-0.5 w-18 bg-laranja" />
        </div>
        <p className="max-w-md font-display text-3xl leading-tight text-[#e9e6f5]">
          Patrimônio que atravessa gerações.
        </p>
      </div>

      <main className="flex flex-[1_1_460px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-4">
          {children}
          <div className="mt-3 text-center text-xs tabular-nums text-[#6b6690]">
            Versão {APP_VERSION}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Mensagem({ erro, ok }: { erro?: string; ok?: string }) {
  if (erro)
    return (
      <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
        {erro}
      </p>
    );
  if (ok)
    return (
      <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
        {ok}
      </p>
    );
  return null;
}
