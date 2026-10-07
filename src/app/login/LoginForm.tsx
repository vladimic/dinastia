"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar } from "./actions";
import { Mensagem } from "@/components/AuthShell";

export function LoginForm() {
  const [estado, acao, enviando] = useActionState(entrar, undefined);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold">Entrar</h1>
        <p className="text-sm text-tinta">Acesse com seu e-mail e senha.</p>
      </div>

      <Mensagem erro={estado?.erro} />

      <label className="rotulo text-[13px]">
        E-mail
        <input className="campo min-h-12 bg-white text-[15px]" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="rotulo text-[13px]">
        Senha
        <input
          className="campo min-h-12 bg-white text-[15px]"
          type="password"
          name="senha"
          autoComplete="current-password"
          required
        />
      </label>

      <div className="flex justify-end">
        <Link href="/esqueci-senha" className="text-[13px] font-semibold underline-offset-2 hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="min-h-[50px] rounded-[10px] bg-laranja text-base font-bold text-navy disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
