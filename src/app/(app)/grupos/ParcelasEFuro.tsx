"use client";

import { useState, useTransition } from "react";
import { alternarTipoParcela, definirPagamentoComFuro } from "./actions";

type Tipo = { codigo: string; descricao: string; disponivel: boolean };

const CAIXA = "flex flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5";

export function PagamentoComFuro({ versaoId, valor }: { versaoId: number; valor: boolean | null }) {
  const [atual, setAtual] = useState(valor);
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();

  function escolher(novo: boolean) {
    if (novo === atual) return;
    const anterior = atual;
    setAtual(novo);
    setErro(false);
    iniciar(async () => {
      const r = await definirPagamentoComFuro(versaoId, novo);
      if (!r.ok) {
        setAtual(anterior);
        setErro(true);
      }
    });
  }

  return (
    <section className={CAIXA + " w-[13rem]"} aria-busy={pendente}>
      <h3 className="text-sm font-bold">Pagamento com furo</h3>
      <div role="radiogroup" aria-label="Pagamento com furo" className="grid grid-cols-2 gap-1.5">
        {([true, false] as const).map((op) => (
          <button
            key={String(op)}
            type="button"
            role="radio"
            aria-checked={atual === op}
            onClick={() => escolher(op)}
            className={
              "min-h-8 rounded-md border text-[13px] font-semibold " +
              (atual === op
                ? "border-navy bg-navy text-white"
                : "border-borda-campo bg-white text-tinta hover:bg-linha")
            }
          >
            {op ? "Sim" : "Não"}
          </button>
        ))}
      </div>
      {atual === null && <p className="text-[11px] text-tinta">Ainda não informado.</p>}
      {erro && (
        <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </section>
  );
}

export function TiposParcela({ versaoId, tipos }: { versaoId: number; tipos: Tipo[] }) {
  const [marcados, setMarcados] = useState(() => new Set(tipos.filter((t) => t.disponivel).map((t) => t.codigo)));
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();

  function alternar(codigo: string, marcado: boolean) {
    setErro(false);
    setMarcados((s) => {
      const n = new Set(s);
      if (marcado) n.add(codigo);
      else n.delete(codigo);
      return n;
    });
    iniciar(async () => {
      const r = await alternarTipoParcela(versaoId, codigo, marcado);
      if (!r.ok) {
        setErro(true);
        setMarcados((s) => {
          const n = new Set(s);
          if (marcado) n.delete(codigo);
          else n.add(codigo);
          return n;
        });
      }
    });
  }

  return (
    <section className={CAIXA + " w-[13rem]"} aria-busy={pendente}>
      <h3 className="text-sm font-bold">Tipos de parcela</h3>
      <ul className="flex flex-col gap-1">
        {tipos.map((t) => {
          const on = marcados.has(t.codigo);
          return (
            <li key={t.codigo}>
              <label
                className={
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] " +
                  (on ? "border-[#cfe3d3] bg-ok-fundo font-semibold text-ok" : "border-[#ece8de] text-tinta/70 hover:bg-linha")
                }
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => alternar(t.codigo, e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[#1d5b2c]"
                />
                <span className="flex-1">{t.descricao}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {erro && (
        <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </section>
  );
}
