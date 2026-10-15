"use client";

import { useEffect, useRef, useState } from "react";

// Faixa "Imóveis (146)" + lista de grupos retrátil.
// - Sem grupo escolhido: a lista fica aberta.
// - Com grupo escolhido: a lista fica recolhida; passar o mouse na faixa de famílias reabre (empurrando o conteúdo para baixo).
// - Escolher um grupo recolhe a lista de novo e o conteúdo sobe.
// - No celular (sem mouse): tocar na família já ativa abre/fecha a lista.
export function SeletorRetratil({
  familias,
  grupos,
  temSelecao,
}: {
  familias: React.ReactNode;
  grupos: React.ReactNode;
  temSelecao: boolean;
}) {
  const [aberto, setAberto] = useState(!temSelecao);
  const fecharEm = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const cancelar = () => {
    if (fecharEm.current) clearTimeout(fecharEm.current);
    fecharEm.current = null;
  };
  useEffect(() => cancelar, []);

  function abrir() {
    cancelar();
    setAberto(true);
  }
  function agendarFechar() {
    if (!temSelecao) return; // sem grupo escolhido não há o que mostrar embaixo: mantém aberta
    cancelar();
    fecharEm.current = setTimeout(() => setAberto(false), 350);
  }

  return (
    <div
      ref={raiz}
      onMouseLeave={agendarFechar}
      onMouseEnter={cancelar}
      onKeyDown={(e) => e.key === "Escape" && temSelecao && setAberto(false)}
    >
      <div
        onMouseEnter={abrir}
        onFocus={abrir}
        onClick={(e) => {
          // toque na família já ativa: alterna (em vez de recarregar e perder o grupo escolhido)
          const a = (e.target as HTMLElement).closest("a[aria-current]");
          if (a) {
            e.preventDefault();
            setAberto((v) => !v);
          }
        }}
      >
        {familias}
      </div>

      <div
        className={"grid transition-[grid-template-rows,opacity] duration-200 ease-out " + (aberto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) {
            cancelar();
            setAberto(false);
          }
        }}
        inert={!aberto}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{grupos}</div>
        </div>
      </div>
    </div>
  );
}
