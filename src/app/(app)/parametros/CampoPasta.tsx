"use client";

import { useState } from "react";

// Pasta dos PDFs: texto livre, caminho quebrado em duas linhas.
export function CampoPasta({ nome, rotulo, inicial }: { nome: string; rotulo: string; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-tinta">
      {rotulo}
      <textarea
        className="campo-sm !h-auto !min-h-[3.4rem] resize-none !py-1.5 !text-left [text-align-last:left]! font-mono leading-snug break-all"
        name={nome}
        rows={2}
        value={valor}
        onChange={(e) => setValor(e.target.value.replace(/[\r\n]+/g, ""))}
        maxLength={500}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}
