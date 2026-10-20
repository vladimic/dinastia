"use client";

import { useState } from "react";
import { BotaoPasta } from "@/components/BotaoPasta";
import { ajustarCaminho } from "@/lib/pastaLocal";

export function CampoPasta({ nome, rotulo, inicial }: { nome: string; rotulo: string; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  const [aviso, setAviso] = useState("");

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
              setAviso("");
            }}
            maxLength={500}
            spellCheck={false}
            autoComplete="off"
          />
          <BotaoPasta
            rotulo={rotulo}
            onEscolher={(pasta) => {
              const r = ajustarCaminho(valor, pasta.name);
              setValor(r.caminho);
              setAviso(
                r.confere
                  ? "Pasta confirmada."
                  : "O navegador informa só o nome da pasta (" + pasta.name + "): confira o início do caminho e depois salve.",
              );
            }}
          />
        </span>
      </label>
      {aviso && (
        <p role="status" className="pl-[7.75rem] text-[11px] text-tinta max-sm:pl-0">
          {aviso}
        </p>
      )}
    </div>
  );
}
