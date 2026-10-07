"use client";

import Link from "next/link";
import { useActionState } from "react";
import { esqueciSenha } from "@/app/login/actions";
import { AuthShell, Mensagem } from "@/components/AuthShell";

export default function EsqueciSenhaPage() {
  const [estado, acao, enviando] = useActionState(esqueciSenha, undefined);

  return (
    <AuthShell>
      <form action={acao} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold">Esqueci minha senha</h1>
          <p className="text-sm text-tinta">Enviaremos um link para você criar uma nova senha.</p>
        </div>
        <Mensagem erro={estado?.erro} ok={estado?.ok} />
        <label className="rotulo text-[13px]">
          E-mail
          <input className="campo min-h-12 bg-white text-[15px]" type="email" name="email" autoComplete="email" required />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="min-h-[50px] rounded-[10px] bg-laranja text-base font-bold text-navy disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar link"}
        </button>
        <Link href="/login" className="text-center text-[13px] font-semibold underline-offset-2 hover:underline">
          Voltar para o login
        </Link>
      </form>
    </AuthShell>
  );
}
