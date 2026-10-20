"use client";

import { escolherPasta, suportaEscolherPasta } from "@/lib/pastaLocal";

export function IconePasta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

// Botão que abre o Finder (seletor de pastas do navegador) e devolve a pasta escolhida.
export function BotaoPasta({ rotulo, onEscolher }: { rotulo: string; onEscolher: (pasta: FileSystemDirectoryHandle) => void }) {
  const ok = suportaEscolherPasta();
  return (
    <button
      type="button"
      onClick={async () => {
        const pasta = await escolherPasta();
        if (pasta) onEscolher(pasta);
      }}
      disabled={!ok}
      title={ok ? `Escolher a pasta de ${rotulo} no Finder` : "Este navegador não permite escolher pastas. Use o Chrome."}
      aria-label={`Escolher a pasta de ${rotulo}`}
      className="flex min-h-[30px] w-9 shrink-0 items-center justify-center rounded-lg border border-borda-campo bg-white text-navy hover:bg-linha disabled:cursor-not-allowed disabled:opacity-50"
    >
      <IconePasta />
    </button>
  );
}
