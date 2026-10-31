"use client";

import { useMemo, useState } from "react";
import { FiltroCredito } from "./FiltroCredito";
import type { ItemGrupo } from "./SeletorGrupo";

// Filtros da lista de grupos (furo, parcela 70, parcela 50/55, faixa de crédito e participantes).
// Usados na lista do seletor de grupo e na edição em lote: o mesmo comportamento nos dois lugares.

export const temAte55 = (g: Pick<ItemGrupo, "reduzidas">) => g.reduzidas.some((p) => p <= 55);
export const tem70 = (g: Pick<ItemGrupo, "reduzidas">) => g.reduzidas.includes(70);

/** Estado dos filtros + a barra desenhada (`barra`) + os grupos que passam (`visiveis`, em ordem de número). */
export function useFiltrosGrupos(grupos: ItemGrupo[], familia: string) {
  const [filtros, setFiltros] = useState({ furo: false, r70: false, r55: false, red: false });
  // quantidades de parcelas reduzidas marcadas (veículos; vazio = todas)
  const [fasesMarcadas, setFasesMarcadas] = useState<number[]>([]);
  const veic = familia === "veiculos";
  // faixa de crédito escolhida (null = toda a faixa da família) e participantes marcados (vazio = todos)
  const [faixa, setFaixa] = useState<{ de: number; ate: number } | null>(null);
  const [marcados, setMarcados] = useState<number[]>([]);
  // trocou de família: os limites e os valores mudam, então os dois filtros voltam ao início
  const [familiaDoFiltro, setFamiliaDoFiltro] = useState(familia);
  if (familiaDoFiltro !== familia) {
    setFamiliaDoFiltro(familia);
    setFaixa(null);
    setMarcados([]);
    setFasesMarcadas([]);
    setFiltros({ furo: false, r70: false, r55: false, red: false });
  }

  // do menor ao maior crédito de todos os grupos da família (em múltiplos de R$ 1.000)
  const limites = useMemo(() => {
    const mins = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.min] : []));
    const maxs = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.max] : []));
    if (!mins.length) return null;
    return { minimo: Math.floor(Math.min(...mins) / 1000) * 1000, maximo: Math.ceil(Math.max(...maxs) / 1000) * 1000 };
  }, [grupos]);
  const valoresFases = useMemo(() => [...new Set(grupos.flatMap((g) => g.fases ?? []))].sort((a, b) => a - b), [grupos]);
  const valoresParticipantes = useMemo(() => [...new Set(grupos.flatMap((g) => (g.participantes ? [g.participantes] : [])))].sort((a, b) => a - b), [grupos]);
  const de = limites ? Math.max(limites.minimo, Math.min(faixa?.de ?? limites.minimo, limites.maximo)) : 0;
  const ate = limites ? Math.max(de, Math.min(faixa?.ate ?? limites.maximo, limites.maximo)) : 0;
  const filtraCredito = limites !== null && (de > limites.minimo || ate < limites.maximo);

  // o grupo entra na faixa quando algum crédito dele cai dentro dela (os grupos têm um menor e um maior crédito)
  const noCredito = (g: ItemGrupo) => !filtraCredito || (g.min !== null && g.max !== null && g.max >= de && g.min <= ate);
  const visiveis = grupos
    .filter(
      (g) =>
        noCredito(g) &&
        (!marcados.length || (g.participantes !== null && marcados.includes(g.participantes))) &&
        (!fasesMarcadas.length || (g.fases ?? []).some((x) => fasesMarcadas.includes(x))) &&
        (!filtros.red || g.reduzidas.length > 0) &&
        (!filtros.furo || g.furo) &&
        (!filtros.r70 || tem70(g)) &&
        (!filtros.r55 || temAte55(g)),
    )
    .sort((a, b) => a.numero - b.numero);

  const temFiltro = filtraCredito || marcados.length > 0 || fasesMarcadas.length > 0 || filtros.red || filtros.furo || filtros.r70 || filtros.r55;
  const limparTudo = () => {
    setFiltros({ furo: false, r70: false, r55: false, red: false });
    setFaixa(null);
    setMarcados([]);
    setFasesMarcadas([]);
  };

  const chip = (on: boolean) =>
    "flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold " + (on ? "border-tinta bg-lavanda text-navy" : "border-borda-campo bg-white text-tinta hover:border-navy");

  const barra = (
    <>
    <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Filtros">
      {veic ? (
        <button type="button" aria-pressed={filtros.red} onClick={() => setFiltros((f) => ({ ...f, red: !f.red }))} className={chip(filtros.red)}>
          <i aria-hidden="true" className="h-2 w-2 rounded-full bg-reduzida" /> Parcela reduzida
        </button>
      ) : (
        <>
          <button type="button" aria-pressed={filtros.furo} onClick={() => setFiltros((f) => ({ ...f, furo: !f.furo }))} className={chip(filtros.furo)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-furo" /> Furo
          </button>
          <button type="button" aria-pressed={filtros.r70} onClick={() => setFiltros((f) => ({ ...f, r70: !f.r70 }))} className={chip(filtros.r70)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-setenta" /> Parcela 70
          </button>
          <button type="button" aria-pressed={filtros.r55} onClick={() => setFiltros((f) => ({ ...f, r55: !f.r55 }))} className={chip(filtros.r55)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-reduzida" /> Parcela 50 / 55
          </button>
        </>
      )}
    </div>
    {veic && valoresFases.length > 0 && (
      <div role="group" aria-labelledby="rotulo-fases" className="flex h-[42px] shrink-0 flex-col justify-center gap-[3px]">
        <div className="flex h-3 items-center">
          <span id="rotulo-fases" className="text-[10px] leading-none font-extrabold tracking-wider text-tinta uppercase">
            Parcelas reduzidas
          </span>
        </div>
        <div className="flex items-center gap-1">
          {valoresFases.map((v) => {
            const on = fasesMarcadas.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setFasesMarcadas((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                className={
                  "flex h-[26px] min-w-[2.5rem] items-center justify-center rounded-full border px-2 text-[12px] font-bold tabular-nums " +
                  (on ? "border-laranja bg-laranja-claro text-navy" : "border-borda-campo bg-white text-navy hover:border-navy")
                }
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
    )}
    {limites && (
      <FiltroCredito minimo={limites.minimo} maximo={limites.maximo} de={de} ate={ate} aoMudar={(a, b) => setFaixa({ de: a, ate: b })} />
    )}
    {valoresParticipantes.length > 0 && (
      <div role="group" aria-labelledby="rotulo-participantes" className="flex h-[42px] shrink-0 flex-col justify-center gap-[3px]">
        <div className="flex h-3 items-center justify-between">
          <span id="rotulo-participantes" className="text-[10px] leading-none font-extrabold tracking-wider text-tinta uppercase">
            Participantes
          </span>
          <button
            type="button"
            aria-label="Limpar filtro de participantes"
            aria-hidden={!marcados.length}
            tabIndex={marcados.length ? 0 : -1}
            onClick={() => setMarcados([])}
            className={"w-4 text-[14px] leading-[12px] text-tinta hover:text-navy " + (marcados.length ? "" : "invisible")}
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-1">
          {valoresParticipantes.map((v) => {
            const on = marcados.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setMarcados((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                className={
                  "flex h-[26px] min-w-[2.5rem] items-center justify-center rounded-full border px-2 text-[12px] font-bold tabular-nums " +
                  (on ? "border-laranja bg-laranja-claro text-navy" : "border-borda-campo bg-white text-navy hover:border-navy")
                }
              >
                {v.toLocaleString("pt-BR", { useGrouping: false })}
              </button>
            );
          })}
        </div>
      </div>
    )}
    <button
      type="button"
      disabled={!temFiltro}
      onClick={limparTudo}
      aria-label="Limpa tudo"
      title="Limpa tudo (Parcela, Crédito e Participantes)"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-borda-campo bg-white text-tinta hover:border-navy hover:text-navy disabled:cursor-default disabled:opacity-40 disabled:hover:border-borda-campo disabled:hover:text-tinta"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
        <path d="M16.5 15.5l5 5M21.5 15.5l-5 5" />
      </svg>
    </button>
    </>
  );

  return { visiveis, barra };
}
