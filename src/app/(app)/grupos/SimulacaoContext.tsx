"use client";

import { createContext, useContext, useState } from "react";

// Escolhas que a tela do grupo repassa ao simulador: o crédito (caixa "Faixa de crédito") e o tipo de parcela (caixa "Tipos de parcela").
// O "modo" é só para comparar 3 jeitos de selecionar e escolher um deles (provisório, some depois da decisão).
export type Modo = 1 | 2 | 3;
export type TipoSim = { codigo: string; descricao: string };

type Ctx = {
  creditoSel: number | null;
  setCreditoSel: (v: number | null) => void;
  tipoSel: string | null;
  setTipoSel: (v: string | null) => void;
  tipos: TipoSim[];
  modo: Modo;
  setModo: (m: Modo) => void;
};

const SimulacaoCtx = createContext<Ctx | null>(null);

export function useSimulacao() {
  const c = useContext(SimulacaoCtx);
  if (!c) throw new Error("fora de <SimulacaoProvider>");
  return c;
}

export function SimulacaoProvider({
  creditoInicial,
  tipoInicial,
  tipos,
  children,
}: {
  creditoInicial: number | null;
  tipoInicial: string | null;
  tipos: TipoSim[];
  children: React.ReactNode;
}) {
  const [creditoSel, setCreditoSel] = useState(creditoInicial);
  const [tipoSel, setTipoSel] = useState(tipoInicial);
  const [modo, setModo] = useState<Modo>(1);
  return (
    <SimulacaoCtx.Provider value={{ creditoSel, setCreditoSel, tipoSel, setTipoSel, tipos, modo, setModo }}>
      {children}
    </SimulacaoCtx.Provider>
  );
}

/** Aparência de uma opção selecionável nos 3 modos. */
export function classeOpcao(modo: Modo, sel: boolean) {
  const base = "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left ";
  if (modo === 1) return base + (sel ? "bg-navy text-white" : "hover:bg-linha");
  if (modo === 2) return base + (sel ? "bg-laranja-claro ring-1 ring-laranja" : "hover:bg-linha");
  return base + "cursor-default border-l-4 " + (sel ? "border-laranja bg-laranja-claro" : "border-transparent");
}

export function Radio({ marcado }: { marcado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={"flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 " + (marcado ? "border-laranja" : "border-[#b9b3d6]")}
    >
      {marcado && <span className="h-1.5 w-1.5 rounded-full bg-laranja" />}
    </span>
  );
}

/** Modo 3: setas ‹ › com o valor escolhido em destaque. */
export function Seletor({ texto, onAnterior, onProximo, rotulo }: { texto: string; onAnterior: () => void; onProximo: () => void; rotulo: string }) {
  const seta = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-sm font-bold text-white hover:brightness-125";
  return (
    <div className="flex items-center gap-1" role="group" aria-label={rotulo}>
      <button type="button" onClick={onAnterior} aria-label="Anterior" className={seta}>
        ‹
      </button>
      <span className="flex-1 truncate rounded-md border border-laranja bg-laranja-claro py-1 text-center text-[13px] font-bold tabular-nums">{texto}</span>
      <button type="button" onClick={onProximo} aria-label="Próximo" className={seta}>
        ›
      </button>
    </div>
  );
}
