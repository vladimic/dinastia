"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

// Lista de grupos retrátil, comandada pela faixa de famílias ("Imóveis (146)") que fica no cabeçalho.
// - Sem grupo escolhido: a lista fica aberta.
// - Com grupo escolhido: a lista fica recolhida; passar o mouse na faixa de famílias reabre (empurrando o conteúdo para baixo).
// - Escolher um grupo recolhe a lista de novo e o conteúdo sobe.
// - No celular (sem mouse): tocar na família já ativa abre/fecha a lista.
type Ctx = { aberto: boolean; abrir: () => void; alternar: () => void; fechar: () => void; agendarFechar: () => void; cancelar: () => void };
const RetratilCtx = createContext<Ctx | null>(null);
const useRetratil = () => {
  const c = useContext(RetratilCtx);
  if (!c) throw new Error("fora de <RetratilProvider>");
  return c;
};

export function RetratilProvider({ temSelecao, children }: { temSelecao: boolean; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(!temSelecao);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelar = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancelar, []);

  const ctx: Ctx = {
    aberto,
    cancelar,
    abrir: () => {
      cancelar();
      setAberto(true);
    },
    alternar: () => setAberto((v) => !v),
    fechar: () => {
      cancelar();
      setAberto(false);
    },
    // sem grupo escolhido não há o que mostrar embaixo: mantém aberta
    agendarFechar: () => {
      if (!temSelecao) return;
      cancelar();
      timer.current = setTimeout(() => setAberto(false), 350);
    },
  };
  return <RetratilCtx.Provider value={ctx}>{children}</RetratilCtx.Provider>;
}

/** Envolve a faixa de famílias: o mouse em cima abre a lista. */
export function AreaFamilias({ children }: { children: React.ReactNode }) {
  const r = useRetratil();
  return (
    <div
      onMouseEnter={r.abrir}
      onMouseLeave={r.agendarFechar}
      onFocus={r.abrir}
      onKeyDown={(e) => e.key === "Escape" && r.fechar()}
      onClick={(e) => {
        // toque na família já ativa: alterna (em vez de recarregar e perder o grupo escolhido)
        if ((e.target as HTMLElement).closest("a[aria-current]")) {
          e.preventDefault();
          r.alternar();
        }
      }}
    >
      {children}
    </div>
  );
}

/** A lista de grupos: recolhe com animação e empurra o conteúdo de baixo. */
export function PainelGrupos({ children }: { children: React.ReactNode }) {
  const r = useRetratil();
  return (
    <div
      className={"grid transition-[grid-template-rows,opacity] duration-200 ease-out " + (r.aberto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      onMouseEnter={r.cancelar}
      onMouseLeave={r.agendarFechar}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) r.fechar();
      }}
      onKeyDown={(e) => e.key === "Escape" && r.fechar()}
      inert={!r.aberto}
    >
      <div className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}
