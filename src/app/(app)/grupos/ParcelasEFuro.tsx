"use client";

import { useState, useTransition } from "react";
import { alternarTipoParcela, definirPagamentoComFuro } from "./actions";
import { Radio, classeOpcao, useSimulacao } from "./SimulacaoContext";

type Tipo = { codigo: string; descricao: string; disponivel: boolean };

const CAIXA = "flex flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5";

export function TiposParcela({ versaoId, tipos }: { versaoId: number; tipos: Tipo[] }) {
  const [marcados, setMarcados] = useState(() => new Set(tipos.filter((t) => t.disponivel).map((t) => t.codigo)));
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();
  const { tipoSel, setTipoSel, furo, setFuro } = useSimulacao(); // o simulador usa o mesmo valor do furo

  // pagamento com furo: liga/desliga e grava na versão vigente do grupo
  function alternarFuro() {
    const novo = !furo;
    setFuro(novo);
    setErro(false);
    iniciar(async () => {
      const r = await definirPagamentoComFuro(versaoId, novo);
      if (!r.ok) {
        setFuro(!novo);
        setErro(true);
      }
    });
  }

  function alternar(codigo: string, marcado: boolean) {
    setErro(false);
    // desmarcou o tipo escolhido para o simulador: passa para o primeiro que continua disponível
    if (!marcado && codigo === tipoSel) setTipoSel(tipos.find((t) => t.codigo !== codigo && marcados.has(t.codigo))?.codigo ?? null);
    if (marcado && tipoSel === null) setTipoSel(codigo);
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
    <section className={CAIXA + " w-[15rem]"} aria-busy={pendente}>
      <h3 className="text-sm font-bold">Tipos de parcela</h3>
      <ul className="flex flex-col gap-1">
        {tipos.map((t) => {
          const on = marcados.has(t.codigo);
          const sel = on && t.codigo === tipoSel;
          return (
            <li
              key={t.codigo}
              className={"flex items-center gap-1 rounded-md border pl-2 " + (on ? "border-[#cfe3d3] bg-ok-fundo" : "border-[#ece8de] hover:bg-linha")}
            >
              <input
                type="checkbox"
                checked={on}
                aria-label={`${t.descricao}: disponível no grupo`}
                title="Disponível no grupo"
                onChange={(e) => alternar(t.codigo, e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-[#1d5b2c]"
              />
              {on ? (
                <button type="button" aria-pressed={sel} onClick={() => setTipoSel(t.codigo)} className={classeOpcao(sel) + " text-[13px] " + (sel ? "font-bold" : "font-semibold text-ok")}>
                  <Radio marcado={sel} />
                  <span className="flex-1">{t.descricao}</span>
                </button>
              ) : (
                <span className="flex-1 px-2 py-1 text-[13px] text-tinta/70">{t.descricao}</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* pagamento com furo: só o rótulo e o sinalizador, no fundo do box */}
      <div className="mt-1 flex items-center justify-between border-t border-linha pt-2.5">
        <span id={`furo-${versaoId}`} className="text-[13px] font-bold">
          Furo
        </span>
        <button type="button" role="switch" aria-checked={furo} aria-labelledby={`furo-${versaoId}`} onClick={alternarFuro} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={"relative h-5 w-9 rounded-full transition-colors " + (furo ? "bg-ok" : "bg-[#cfcbe0]")}>
            <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (furo ? "left-[18px]" : "left-0.5")} />
          </span>
        </button>
      </div>
      {erro && (
        <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </section>
  );
}
