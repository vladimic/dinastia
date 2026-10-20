"use client";

import { useState } from "react";
import { BotaoPasta } from "@/components/BotaoPasta";

export function CampoPasta({ nome, rotulo, inicial }: { nome: string; rotulo: string; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <label className="grid grid-cols-[7rem_1fr] items-center gap-3 text-xs font-semibold text-tinta max-sm:grid-cols-1">
        {rotulo}
        <span className="flex gap-2">
          <input
            className="campo-sm !text-left font-mono"
            name={nome}
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setAviso(null);
            }}
            maxLength={500}
            spellCheck={false}
            autoComplete="off"
          />
          <BotaoPasta
            rotulo={rotulo}
            inicio={valor}
            onEscolher={(c) => {
              setValor(c);
              setAviso({ erro: false, texto: "Pasta escolhida. Clique em Salvar para gravar." });
            }}
            onErro={(texto) => setAviso({ erro: true, texto })}
          />
        </span>
      </label>
      {aviso && (
        <p role="status" className={"pl-[7.75rem] text-[11px] max-sm:pl-0 " + (aviso.erro ? "font-semibold text-[#9b1c1c]" : "text-tinta")}>
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
