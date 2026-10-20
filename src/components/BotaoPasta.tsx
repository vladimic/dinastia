"use client";

import { useState } from "react";
import { escolherPastaNoFinder } from "@/lib/ajudanteLocal";

export function IconePasta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

// Abre o Finder (pelo Dinastia Local) posicionado na pasta atual e devolve o caminho completo escolhido.
export function BotaoPasta({
  rotulo,
  inicio,
  onEscolher,
  onErro,
}: {
  rotulo: string;
  inicio: string;
  onEscolher: (caminho: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const [abrindo, setAbrindo] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setAbrindo(true);
        const r = await escolherPastaNoFinder(inicio, `Escolha a pasta dos PDFs de ${rotulo}`);
        setAbrindo(false);
        if ("caminho" in r) onEscolher(r.caminho);
        else if ("erro" in r) onErro(r.erro);
      }}
      disabled={abrindo}
      title={`Escolher a pasta de ${rotulo} no Finder`}
      aria-label={`Escolher a pasta de ${rotulo}`}
      className="flex min-h-[30px] w-9 shrink-0 items-center justify-center rounded-lg border border-borda-campo bg-white text-navy hover:bg-linha disabled:opacity-50"
    >
      <IconePasta />
    </button>
  );
}
