"use client";

import { useState } from "react";

// Pasta dos PDFs: texto livre, em duas linhas (rótulo em cima, caminho inteiro embaixo).
export function CampoPasta({ nome, rotulo, inicial }: { nome: string; rotulo: string; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-tinta">
      {rotulo}
      <input
        className="campo-sm !text-left font-mono"
        name={nome}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        maxLength={500}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}
