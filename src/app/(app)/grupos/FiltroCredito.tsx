"use client";

import { useState, type CSSProperties } from "react";

// Filtro de valor do crédito da lista de grupos: slider duplo (mínimo e máximo) em duas linhas, com os dois valores também digitáveis.
// O valor digitado só é aplicado ao sair do campo ou com Enter; fora do intervalo é corrigido para o limite, e o mínimo nunca passa do máximo.

const PASSO = 1000;
const reais = (n: number) => n.toLocaleString("pt-BR");
const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

type Props = {
  minimo: number;
  maximo: number;
  de: number;
  ate: number;
  aoMudar: (de: number, ate: number) => void;
  className?: string;
};

export function FiltroCredito({ minimo, maximo, de, ate, aoMudar, className = "" }: Props) {
  const [rascunho, setRascunho] = useState<{ campo: "de" | "ate"; texto: string } | null>(null);
  const extensao = Math.max(1, maximo - minimo);
  const pa = (de - minimo) / extensao;
  const pb = (ate - minimo) / extensao;
  const ativo = de > minimo || ate < maximo;

  const aplicar = (campo: "de" | "ate", texto: string) => {
    setRascunho(null);
    const n = parseInt(texto.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return;
    if (campo === "de") aoMudar(limitar(n, minimo, ate), ate);
    else aoMudar(de, limitar(n, de, maximo));
  };

  const campo = (c: "de" | "ate", valor: number, rotulo: string) => (
    <span className="block w-[4.9rem]">
      <input
        inputMode="numeric"
        aria-label={rotulo}
        value={rascunho?.campo === c ? rascunho.texto : reais(valor)}
        onFocus={(e) => {
          setRascunho({ campo: c, texto: reais(valor) });
          e.currentTarget.select();
        }}
        onChange={(e) => setRascunho({ campo: c, texto: e.target.value })}
        onBlur={(e) => aplicar(c, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setRascunho(null);
            e.currentTarget.blur();
          }
        }}
        className="h-[22px] w-full rounded-md border border-borda-campo bg-white px-1.5 text-[12px] font-semibold tabular-nums text-navy outline-none focus:border-laranja"
      />
    </span>
  );

  return (
    <div role="group" aria-label="Valor do crédito" className={"flex h-[42px] w-fit shrink-0 flex-col justify-center gap-[2px] rounded-xl border border-borda-campo bg-campo px-2.5 " + className}>
      <div className="flex items-center gap-1.5">
        <span className="mr-auto text-[10px] leading-none font-extrabold tracking-wider whitespace-nowrap text-tinta uppercase">Crédito</span>
        {campo("de", de, "Crédito mínimo")}
        <span className="text-[11px] text-tinta">até</span>
        {campo("ate", ate, "Crédito máximo")}
        <button
          type="button"
          aria-label="Limpar filtro de crédito"
          aria-hidden={!ativo}
          tabIndex={ativo ? 0 : -1}
          onClick={() => aoMudar(minimo, maximo)}
          className={"w-3 text-[14px] leading-none text-tinta hover:text-navy " + (ativo ? "" : "invisible")}
        >
          ×
        </button>
      </div>
      <div className="faixa" style={{ "--pa": pa, "--pb": pb } as CSSProperties}>
        <span className="faixa-trilho" />
        <span className="faixa-preenchido" />
        <input
          type="range"
          aria-label="Crédito mínimo"
          min={minimo}
          max={maximo}
          step={PASSO}
          value={de}
          onChange={(e) => aoMudar(Math.min(Number(e.target.value), ate), ate)}
          style={{ zIndex: pa > 0.5 ? 4 : 2 }}
        />
        <input
          type="range"
          aria-label="Crédito máximo"
          min={minimo}
          max={maximo}
          step={PASSO}
          value={ate}
          onChange={(e) => aoMudar(de, Math.max(Number(e.target.value), de))}
          style={{ zIndex: 3 }}
        />
      </div>
    </div>
  );
}
