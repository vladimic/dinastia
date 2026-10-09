"use client";

import { useState, useTransition } from "react";
import { reais } from "@/lib/formato";
import { salvarCreditos } from "./actions";

const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "R$ 553.368,10" → 553368.1 ; texto inválido → NaN
function lerValor(s: string) {
  return Number(s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
}

export function FaixaCredito({ versaoId, creditos }: { versaoId: number; creditos: number[] }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function abrir() {
    setTexto(creditos.map((c) => numero.format(c)).join("\n"));
    setErro(null);
    setEditando(true);
  }

  function salvar() {
    const valores = texto
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(lerValor);
    if (valores.some((v) => !Number.isFinite(v) || v <= 0)) {
      setErro("Há um valor inválido. Use um valor por linha, ex.: 553.368,10");
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await salvarCreditos(versaoId, valores);
      if (r.ok) setEditando(false);
      else setErro(r.erro);
    });
  }

  return (
    <section className="flex w-[15.5rem] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Faixa de crédito</h3>
        {!editando && (
          <button type="button" onClick={abrir} className="text-xs font-semibold text-tinta underline hover:text-navy">
            Editar
          </button>
        )}
      </div>
      {editando ? (
        <>
          <textarea
            rows={Math.min(14, Math.max(6, texto.split("\n").length + 1))}
            className="campo py-2 text-right font-mono text-[13px] font-bold tabular-nums"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Valores de crédito, um por linha"
            spellCheck={false}
          />
          <p className="text-[11px] text-tinta">Um valor por linha. A ordem é ajustada ao salvar.</p>
          {erro && (
            <p role="alert" className="text-xs font-semibold text-[#9b1c1c]">
              {erro}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button type="button" disabled={pendente} onClick={salvar} className="min-h-8 rounded-[10px] bg-navy px-4 text-xs font-bold text-white hover:brightness-110 disabled:opacity-60">
              {pendente ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" disabled={pendente} onClick={() => setEditando(false)} className="min-h-8 rounded-[10px] border border-borda-campo px-3 text-xs font-semibold text-tinta hover:bg-linha">
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <ul className="flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1">
          {creditos.map((c) => (
            <li key={c} className="rounded-md border border-[#ece8de] px-2.5 py-0.5 text-right text-[13px] font-bold tabular-nums">
              {reais(c)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
