"use client";

import { useMemo, useState } from "react";
import { FiltroCredito } from "./FiltroCredito";
import type { ItemGrupo } from "./SeletorGrupo";

// Filtros da lista de grupos (furo, parcela 70, parcela 50/55, faixa de crédito e participantes).
// Usados na lista do seletor de grupo e na edição em lote: o mesmo comportamento nos dois lugares.

export const temAte55 = (g: Pick<ItemGrupo, "reduzidas">) => g.reduzidas.some((p) => p <= 55);
/** veículos: parcela reduzida simples, que vale até a contemplação (sem quantidade fixa de parcelas): "AC" */
export const temAC = (g: Pick<ItemGrupo, "reduzidas" | "fases">) => g.reduzidas.length > 0 && !(g.fases ?? []).length;
export const tem70 = (g: Pick<ItemGrupo, "reduzidas">) => g.reduzidas.includes(70);

/** Estado dos filtros + a barra desenhada (`barra`) + os grupos que passam (`visiveis`, em ordem de número). */
/** meses que faltam para o grupo terminar (a tabela vigente é da próxima assembleia enquanto a data dela não passou) */
export const prazoRestante = (g: Pick<ItemGrupo, "data" | "assembleia" | "prazo">, hoje: string) =>
  Math.max(0, g.prazo - (g.data && g.data >= hoje ? g.assembleia - 1 : g.assembleia));

export function useFiltrosGrupos(grupos: ItemGrupo[], familia: string, hoje: string) {
  const [filtros, setFiltros] = useState({ furo: false, r70: false, r55: false, red: false, fid: false });
  // quantidades de parcelas reduzidas marcadas (veículos; vazio = todas)
  const [fasesMarcadas, setFasesMarcadas] = useState<(number | "AC")[]>([]);
  const veic = familia === "veiculos";
  // faixa de crédito escolhida (null = toda a faixa da família) e participantes marcados (vazio = todos)
  const [faixa, setFaixa] = useState<{ de: number; ate: number } | null>(null);
  const [faixaPrazo, setFaixaPrazo] = useState<{ de: number; ate: number } | null>(null);
  const [marcados, setMarcados] = useState<number[]>([]);
  // trocou de família: os limites e os valores mudam, então os dois filtros voltam ao início
  const [familiaDoFiltro, setFamiliaDoFiltro] = useState(familia);
  if (familiaDoFiltro !== familia) {
    setFamiliaDoFiltro(familia);
    setFaixa(null);
    setFaixaPrazo(null);
    setMarcados([]);
    setFasesMarcadas([]);
    setFiltros({ furo: false, r70: false, r55: false, red: false, fid: false });
  }

  // do menor ao maior crédito de todos os grupos da família (em múltiplos de R$ 1.000)
  const limites = useMemo(() => {
    const mins = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.min] : []));
    const maxs = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.max] : []));
    if (!mins.length) return null;
    return { minimo: Math.floor(Math.min(...mins) / 1000) * 1000, maximo: Math.ceil(Math.max(...maxs) / 1000) * 1000 };
  }, [grupos]);
  // do menor ao maior prazo restante entre os grupos da família
  const limitesPrazo = useMemo(() => {
    const v = grupos.map((g) => prazoRestante(g, hoje));
    return v.length ? { minimo: Math.min(...v), maximo: Math.max(...v) } : null;
  }, [grupos, hoje]);
  const dePrazo = limitesPrazo ? Math.max(limitesPrazo.minimo, Math.min(faixaPrazo?.de ?? limitesPrazo.minimo, limitesPrazo.maximo)) : 0;
  const atePrazo = limitesPrazo ? Math.max(dePrazo, Math.min(faixaPrazo?.ate ?? limitesPrazo.maximo, limitesPrazo.maximo)) : 0;
  const filtraPrazo = limitesPrazo !== null && (dePrazo > limitesPrazo.minimo || atePrazo < limitesPrazo.maximo);
  const noPrazo = (g: ItemGrupo) => !filtraPrazo || (prazoRestante(g, hoje) >= dePrazo && prazoRestante(g, hoje) <= atePrazo);
  const valoresFases = useMemo<(number | "AC")[]>(() => {
    const nums = [...new Set(grupos.flatMap((g) => g.fases ?? []))].sort((a, b) => a - b);
    return grupos.some(temAC) ? [...nums, "AC"] : nums;
  }, [grupos]);
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
        noPrazo(g) &&
        (!marcados.length || (g.participantes !== null && marcados.includes(g.participantes))) &&
        (!fasesMarcadas.length || (g.fases ?? []).some((x) => fasesMarcadas.includes(x)) || (temAC(g) && fasesMarcadas.includes("AC"))) &&
        (!filtros.red || g.reduzidas.length > 0) &&
        (!filtros.fid || g.fidelidade === true) &&
        (!filtros.furo || g.furo) &&
        (!filtros.r70 || tem70(g)) &&
        (!filtros.r55 || temAte55(g)),
    )
    .sort((a, b) => a.numero - b.numero);

  const temFiltro = filtraCredito || filtraPrazo || marcados.length > 0 || fasesMarcadas.length > 0 || filtros.red || filtros.fid || filtros.furo || filtros.r70 || filtros.r55;
  const limparTudo = () => {
    setFiltros({ furo: false, r70: false, r55: false, red: false, fid: false });
    setFaixa(null);
    setFaixaPrazo(null);
    setMarcados([]);
    setFasesMarcadas([]);
  };

  const chip = (on: boolean) =>
    "flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-[12px] font-bold whitespace-nowrap " + (on ? "border-tinta bg-lavanda text-navy" : "border-borda-campo bg-white text-tinta hover:border-navy");

  const barra = (
    <>
    <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Filtros">
      <button type="button" aria-pressed={filtros.fid} onClick={() => setFiltros((f) => ({ ...f, fid: !f.fid }))} className={chip(filtros.fid)}>
        <i aria-hidden="true" className="h-2 w-2 rounded-full bg-navy" /> Fidel.
      </button>
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
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-setenta" /> Parc70
          </button>
          <button type="button" aria-pressed={filtros.r55} onClick={() => setFiltros((f) => ({ ...f, r55: !f.r55 }))} className={chip(filtros.r55)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-reduzida" /> Parc50/55
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
    {limitesPrazo && limitesPrazo.minimo < limitesPrazo.maximo && (
      <FiltroCredito
        rotulo="Prazo"
        passo={1}
        larguraCampo="w-[2.3rem]"
        minimo={limitesPrazo.minimo}
        maximo={limitesPrazo.maximo}
        de={dePrazo}
        ate={atePrazo}
        aoMudar={(a, b) => setFaixaPrazo({ de: a, ate: b })}
      />
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
