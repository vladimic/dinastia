"use client";

import { useRef, useState, useTransition } from "react";
import { BotaoFinalizar, BotaoLapis } from "./Lapis";
import { salvarCreditos } from "./actions";

const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "R$ 553.368,10" → 553368.1 ; texto inválido → NaN
function lerValor(s: string) {
  return Number(s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
}

type Linha = { id: number; texto: string; valor: number | null }; // valor = o que já está no banco

type Estado = { tipo: "ocioso" } | { tipo: "salvando" } | { tipo: "salvo" } | { tipo: "erro"; msg: string };

const porValor = (a: Linha, b: Linha) => (a.valor ?? Infinity) - (b.valor ?? Infinity);

// Cada valor é um campo: ao sair dele (ou Enter) grava; campo vazio remove o valor.
export function FaixaCredito({ versaoId, creditos }: { versaoId: number; creditos: number[] }) {
  const proximoId = useRef(creditos.length);
  const [editando, setEditando] = useState(false);
  const [linhas, setLinhas] = useState<Linha[]>(() => creditos.map((c, id) => ({ id, texto: numero.format(c), valor: c })));
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [, iniciar] = useTransition();

  function enviar(novos: number[], aoSalvar: () => void, aoFalhar: () => void) {
    setEstado({ tipo: "salvando" });
    iniciar(async () => {
      const r = await salvarCreditos(versaoId, novos);
      if (r.ok) {
        aoSalvar();
        setEstado({ tipo: "salvo" });
      } else {
        aoFalhar();
        setEstado({ tipo: "erro", msg: r.erro });
      }
    });
  }

  function aoSair(id: number) {
    const linha = linhas.find((l) => l.id === id);
    if (!linha) return;
    const texto = linha.texto.trim();

    // vazio: remove (a linha nova ainda não gravada some sem avisar o banco)
    if (!texto) {
      if (linha.valor === null) return setLinhas((l) => l.filter((x) => x.id !== id));
      return remover(id);
    }

    const v = Math.round(lerValor(texto) * 100) / 100;
    if (!Number.isFinite(v) || v <= 0) {
      setEstado({ tipo: "erro", msg: "Valor inválido. Ex.: 553.368,10" });
      return setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: x.valor === null ? "" : numero.format(x.valor) } : x)));
    }
    if (v === linha.valor) return setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: numero.format(v) } : x)));
    if (linhas.some((x) => x.id !== id && x.valor === v)) {
      setEstado({ tipo: "erro", msg: "Esse valor já está na lista." });
      return setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: x.valor === null ? "" : numero.format(x.valor) } : x)));
    }

    const outros = linhas.filter((x) => x.id !== id && x.valor !== null).map((x) => x.valor as number);
    enviar(
      [...outros, v],
      () => setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: numero.format(v), valor: v } : x)).sort(porValor)),
      () => setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: x.valor === null ? "" : numero.format(x.valor) } : x))),
    );
  }

  function remover(id: number) {
    const linha = linhas.find((l) => l.id === id);
    if (!linha) return;
    if (linha.valor === null) return setLinhas((l) => l.filter((x) => x.id !== id));
    const restantes = linhas.filter((x) => x.id !== id && x.valor !== null).map((x) => x.valor as number);
    if (!restantes.length) {
      setEstado({ tipo: "erro", msg: "A faixa precisa ter ao menos um valor." });
      return setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: numero.format(x.valor as number) } : x)));
    }
    enviar(
      restantes,
      () => setLinhas((l) => l.filter((x) => x.id !== id)),
      () => undefined,
    );
  }

  return (
    <section className="flex w-[11.5rem] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Faixa de crédito</h3>
        {editando ? (
          <span
            role="status"
            aria-live="polite"
            className={"text-[11px] font-semibold " + (estado.tipo === "salvo" ? "text-ok" : "text-tinta")}
          >
            {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : ""}
          </span>
        ) : (
          <BotaoLapis
            rotulo="Editar faixa de crédito"
            onClick={() => {
              setEstado({ tipo: "ocioso" });
              setEditando(true);
            }}
          />
        )}
      </div>

      {!editando ? (
        <ul className="flex max-h-[340px] flex-col overflow-y-auto">
          {linhas
            .filter((l) => l.valor !== null)
            .map((l) => (
              <li
                key={l.id}
                className="flex items-baseline justify-between gap-3 border-b border-linha py-1 text-[13px] font-bold tabular-nums last:border-b-0"
              >
                <span className="text-[11px] font-semibold text-tinta">R$</span>
                <span>{numero.format(l.valor as number)}</span>
              </li>
            ))}
        </ul>
      ) : (
        <>
          <ul className="flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1">
            {linhas.map((l) => (
              <li key={l.id} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Remover ${l.texto || "valor"}`}
                  onClick={() => remover(l.id)}
                  className="w-4 shrink-0 text-sm leading-none text-[#b9b3d6] hover:text-[#9b1c1c]"
                >
                  ×
                </button>
                <div className="relative flex-1">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-semibold text-tinta"
                  >
                    R$
                  </span>
                  <input
                    inputMode="decimal"
                    autoFocus={l.valor === null}
                    value={l.texto}
                    placeholder="0,00"
                    aria-label="Valor do crédito"
                    onChange={(e) => {
                      const texto = e.target.value;
                      setLinhas((x) => x.map((y) => (y.id === l.id ? { ...y, texto } : y)));
                    }}
                    onBlur={() => aoSair(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        const texto = l.valor === null ? "" : numero.format(l.valor);
                        setLinhas((x) => x.map((y) => (y.id === l.id ? { ...y, texto } : y)));
                        e.currentTarget.blur();
                      }
                    }}
                    className="h-7 w-full rounded-md border border-borda-campo bg-campo pr-2.5 pl-8 text-right text-[13px] font-bold tabular-nums text-navy outline-none focus:border-laranja focus:bg-white focus:ring-2 focus:ring-laranja-claro"
                  />
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setLinhas((l) => [...l, { id: proximoId.current++, texto: "", valor: null }])}
            className="rounded-md border border-dashed border-borda-campo py-1 text-xs font-bold text-tinta hover:bg-linha"
          >
            + valor
          </button>

          {estado.tipo === "erro" && (
            <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
              {estado.msg}
            </p>
          )}

          <BotaoFinalizar
            onClick={() => {
              setLinhas((l) => l.filter((x) => x.valor !== null));
              setEditando(false);
            }}
          />
        </>
      )}
    </section>
  );
}
