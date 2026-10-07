"use client";

import { useActionState } from "react";
import { novaSenha } from "@/app/login/actions";
import { AuthShell, Mensagem } from "@/components/AuthShell";

export default function NovaSenhaPage() {
  const [estado, acao, enviando] = useActionState(novaSenha, undefined);

  return (
    <AuthShell>
      <form action={acao} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold">Nova senha</h1>
          <p className="text-sm text-tinta">Mínimo de 8 caracteres.</p>
        </div>
        <Mensagem erro={estado?.erro} />
        <label className="rotulo text-[13px]">
          Nova senha
          <input className="campo min-h-12 bg-white text-[15px]" type="password" name="senha" autoComplete="new-password" required minLength={8} />
        </label>
        <label className="rotulo text-[13px]">
          Confirme a senha
          <input className="campo min-h-12 bg-white text-[15px]" type="password" name="confirma" autoComplete="new-password" required minLength={8} />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="min-h-[50px] rounded-[10px] bg-laranja text-base font-bold text-navy disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
    </AuthShell>
  );
}
