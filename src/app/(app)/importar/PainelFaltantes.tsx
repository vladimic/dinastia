"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { aguardarPdf, aplicarSaltos } from "./actions";

export type FaltanteTela = { numero: number; assembleia: number; data: string; proxima: number; decisao: "pendente" | "aguardando_pdf" };

const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const BTN = "min-h-8 rounded-[10px] px-3 text-xs font-bold disabled:opacity-50";

// Grupos que não vieram na leitura: ou o PDF será reimportado, ou o sistema faz o salto automático de assembleia.
export function PainelFaltantes({ familiaNome, dataRef, pdfsNaData, faltantes }: { familiaNome: string; dataRef: string; pdfsNaData: number; faltantes: FaltanteTela[] }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ erro: boolean; texto: string } | null>(null);
  const [verAguardando, setVerAguardando] = useState(false);

  const pendentes = faltantes.filter((f) => f.decisao === "pendente");
  const aguardando = faltantes.filter((f) => f.decisao === "aguardando_pdf");
  const lista = verAguardando ? aguardando : pendentes;
  if (!faltantes.length) return null;

  function saltar(grupos: number[]) {
    if (grupos.length > 1 && !window.confirm(`Aplicar o salto automático de assembleia em ${grupos.length} grupos? Cada um ganha a próxima assembleia, com tudo igual à anterior.`)) return;
    setMsg(null);
    iniciar(async () => {
      let aplicados = 0;
      const falhas: string[] = [];
      for (let i = 0; i < grupos.length; i += 10) {
        const r = await aplicarSaltos(grupos.slice(i, i + 10));
        if (!r.ok) {
          setMsg({ erro: true, texto: r.erro });
          router.refresh();
          return;
        }
        aplicados += r.aplicados;
        falhas.push(...r.falhas.map((f) => `grupo ${f.grupo}: ${f.motivo}`));
      }
      setMsg({ erro: falhas.length > 0, texto: `${aplicados} grupos com salto de assembleia aplicado.` + (falhas.length ? ` ${falhas.length} não aplicados — ${falhas.slice(0, 3).join(" | ")}` : "") });
      router.refresh();
    });
  }

  function esperar(grupos: number[], aguardar: boolean) {
    setMsg(null);
    iniciar(async () => {
      const r = await aguardarPdf(grupos, aguardar);
      if (!r.ok) setMsg({ erro: true, texto: r.erro });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-alerta-borda bg-alerta-fundo p-4" aria-label={`Grupos sem PDF · ${familiaNome}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-alerta">
          {familiaNome}: grupos sem PDF para a assembleia de {dataBR(dataRef)}: {pendentes.length}
          {aguardando.length > 0 && <span className="ml-2 text-xs font-semibold text-tinta">({aguardando.length} aguardando PDF)</span>}
        </h2>
        <span className="text-xs text-tinta">Referência: o PDF mais recente lido ({pdfsNaData} {pdfsNaData === 1 ? "grupo" : "grupos"} com PDF dessa data).</span>
      </div>
      <p className="text-[13px]">
        Para cada grupo abaixo não veio PDF desta assembleia. Escolha: <strong>vou reimportar o PDF</strong> (o grupo fica aguardando) ou <strong>salto automático</strong> (não existe PDF específico: o grupo passa para a próxima assembleia mantendo todas as outras informações iguais às da anterior).
      </p>

      {msg && (
        <p role={msg.erro ? "alert" : "status"} className={"rounded-lg px-3 py-2 text-sm font-semibold " + (msg.erro ? "bg-[#fbe4e4] text-[#9b1c1c]" : "bg-ok-fundo text-ok")}>
          {msg.texto}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setVerAguardando(false)} className={"rounded-full px-3 py-1 text-xs font-bold ring-1 " + (!verAguardando ? "bg-navy text-white ring-navy" : "bg-white text-tinta ring-borda-campo")}>
          A decidir ({pendentes.length})
        </button>
        <button type="button" onClick={() => setVerAguardando(true)} className={"rounded-full px-3 py-1 text-xs font-bold ring-1 " + (verAguardando ? "bg-navy text-white ring-navy" : "bg-white text-tinta ring-borda-campo")}>
          Aguardando PDF ({aguardando.length})
        </button>
        {lista.length > 0 && (
          <span className="ml-auto flex gap-2">
            {!verAguardando && (
              <button type="button" disabled={ocupado} className={BTN + " border border-borda-campo bg-white text-tinta hover:bg-linha"} onClick={() => esperar(lista.map((f) => f.numero), true)}>
                Vou reimportar todos
              </button>
            )}
            <button type="button" disabled={ocupado} className={BTN + " min-h-9 bg-laranja px-4 text-sm text-navy hover:brightness-95"} onClick={() => saltar(lista.map((f) => f.numero))}>
              {ocupado ? "Aplicando…" : `Salto automático em todos os ${lista.length}`}
            </button>
          </span>
        )}
      </div>

      <ul className="grid max-h-[24rem] gap-1.5 overflow-auto">
        {lista.map((f) => (
          <li key={f.numero} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2 text-[13px]">
            <strong className="w-24">Grupo {f.numero}</strong>
            <span className="text-tinta">
              vigente: {f.assembleia}ª ({dataBR(f.data)}) → salto para a <strong className="text-navy">{f.proxima}ª</strong> ({dataBR(dataRef)})
            </span>
            <span className="ml-auto flex gap-2">
              {f.decisao === "pendente" ? (
                <button type="button" disabled={ocupado} className={BTN + " border border-borda-campo text-tinta hover:bg-linha"} onClick={() => esperar([f.numero], true)}>
                  Vou reimportar o PDF
                </button>
              ) : (
                <button type="button" disabled={ocupado} className="text-[11px] font-semibold text-navy underline" onClick={() => esperar([f.numero], false)}>
                  Desfazer
                </button>
              )}
              <button type="button" disabled={ocupado} className={BTN + " bg-navy text-white hover:brightness-110"} onClick={() => saltar([f.numero])}>
                Salto automático
              </button>
            </span>
          </li>
        ))}
        {!lista.length && <li className="px-1 text-sm text-tinta">Nada nesta lista.</li>}
      </ul>
    </section>
  );
}
