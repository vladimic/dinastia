"use client";

import { createContext, useContext, useState } from "react";

// Escolhas que a tela do grupo repassa ao simulador: o crédito (caixa "Faixa de crédito") e o tipo de parcela (caixa "Tipos de parcela").
export type TipoSim = { codigo: string; descricao: string; pct: number };

type Ctx = {
  creditoSel: number | null;
  setCreditoSel: (v: number | null) => void;
  tipoSel: string | null;
  setTipoSel: (v: string | null) => void;
  tipos: TipoSim[];
  /** pagamento com furo do grupo (muda no card "Pagamento com furo" e o simulador acompanha) */
  furo: boolean;
  setFuro: (v: boolean) => void;
  /** furo usado só na simulação: com furo = sim no grupo, dá para simular como não; com não, nunca como sim */
  furoSim: boolean;
  setFuroSim: (v: boolean) => void;
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
  furoInicial,
  children,
}: {
  creditoInicial: number | null;
  tipoInicial: string | null;
  tipos: TipoSim[];
  furoInicial: boolean;
  children: React.ReactNode;
}) {
  const [creditoSel, setCreditoSel] = useState(creditoInicial);
  const [tipoSel, setTipoSel] = useState(tipoInicial);
  const [furo, setFuro] = useState(furoInicial);
  const [escolhaSim, setFuroSim] = useState(true); // a escolha só vale enquanto o grupo tem furo
  return (
    <SimulacaoCtx.Provider value={{ creditoSel, setCreditoSel, tipoSel, setTipoSel, tipos, furo, setFuro, furoSim: furo && escolhaSim, setFuroSim }}>
      {children}
    </SimulacaoCtx.Provider>
  );
}

/** Aparência de uma opção selecionável (linha com bolinha; a escolhida fica em laranja). */
export function classeOpcao(sel: boolean) {
  return "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left " + (sel ? "bg-laranja-claro ring-1 ring-inset ring-laranja" : "hover:bg-linha");
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
