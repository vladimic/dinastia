"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Chip = {
  numero: number;
  prazo: number;
  assembleia: number;
  data: string | null; // data da assembleia da tabela vigente (AAAA-MM-DD)
  min: number | null;
  max: number | null;
  seq: string[]; // códigos das 20 primeiras contemplações
  participantes: number | null; // tamanho do grupo (a barra na base é proporcional a ele)
  furo: boolean; // pagamento com furo ligado
  reduzida: boolean; // oferece parcela reduzida de 55% ou menos
};

const LARGURA_MIN = 44; // px, igual ao minmax da grade
const FOLGA = 4; // px, gap da grade
const COLUNAS_LEGENDA = 8; // colunas livres necessárias para a legenda caber ao lado do último grupo

const PARTICIPANTES_MAX = 9999; // barra cheia

const mil = (v: number) => `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;
const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

export function GrupoChips({
  grupos,
  familia,
  ativo,
  hoje,
  cores,
}: {
  grupos: Chip[];
  familia: string;
  ativo?: number;
  hoje: string;
  cores: Record<string, string>;
}) {
  // a legenda entra ao lado do último grupo quando sobra espaço na última linha da grade
  const gradeRef = useRef<HTMLDivElement>(null);
  const [colunas, setColunas] = useState(0);
  useEffect(() => {
    const el = gradeRef.current;
    if (!el) return;
    const medir = () => setColunas(Math.max(1, Math.floor((el.clientWidth + FOLGA) / (LARGURA_MIN + FOLGA))));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const resto = colunas ? (grupos.length % colunas === 0 ? 0 : colunas - (grupos.length % colunas)) : 0;
  const legendaAoLado = resto >= COLUNAS_LEGENDA;

  const temFuro = grupos.some((g) => g.furo);
  const temReduzida = grupos.some((g) => g.reduzida);
  const temParticipantes = grupos.some((g) => g.participantes);
  const [pop, setPop] = useState<{ g: Chip; x: number; y: number; acima: boolean } | null>(null);

  function mostrar(g: Chip, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const largura = 260;
    const x = Math.min(Math.max(8, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 8);
    const acima = r.bottom + 160 > window.innerHeight;
    setPop({ g, x, y: acima ? r.top - 6 : r.bottom + 6, acima });
  }

  return (
    <>
      <div ref={gradeRef} className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
        {grupos.map((g) => {
          const sel = g.numero === ativo;
          return (
            <Link
              key={g.numero}
              href={`/grupos?familia=${familia}&grupo=${g.numero}`}
              aria-current={sel ? "true" : undefined}
              onMouseEnter={(e) => mostrar(g, e.currentTarget)}
              onMouseLeave={() => setPop(null)}
              onFocus={(e) => mostrar(g, e.currentTarget)}
              onBlur={() => setPop(null)}
              className={
                "relative flex h-6 items-center justify-center rounded pl-[5px] font-bold tabular-nums " +
                (g.numero > 9999 ? "text-[11px] " : "text-xs ") +
                (sel ? "bg-navy text-white" : "border border-borda-campo bg-white text-navy hover:border-navy")
              }
            >
              {(g.furo || g.reduzida) && (
                <span
                  aria-hidden="true"
                  className={"absolute inset-y-0 left-0 w-[5px] rounded-l-[3px] " + (g.furo && g.reduzida ? "" : g.furo ? "bg-furo" : "bg-reduzida")}
                  style={g.furo && g.reduzida ? { background: "linear-gradient(to bottom, var(--color-furo) 50%, var(--color-reduzida) 50%)" } : undefined}
                />
              )}
              {g.participantes ? (
                <span
                  aria-hidden="true"
                  style={{ width: `${Math.min(100, (g.participantes / PARTICIPANTES_MAX) * 100)}%` }}
                  className={"absolute bottom-[2px] left-[7px] h-[3px] max-w-[calc(100%-10px)] rounded-full " + (sel ? "bg-[#cfcbe9]" : "bg-[#8b83c9]")}
                />
              ) : null}
              {g.numero}
              {g.participantes ? <span className="sr-only"> · {g.participantes.toLocaleString("pt-BR")} participantes</span> : null}
              {g.furo && <span className="sr-only"> · furo ligado</span>}
              {g.reduzida && <span className="sr-only"> · parcela reduzida até 55%</span>}
            </Link>
          );
        })}
        {(temFuro || temReduzida || temParticipantes) && (
          <div
            style={{ gridColumn: legendaAoLado ? `span ${resto}` : "1 / -1" }}
            className={"flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-tinta " + (colunas ? (legendaAoLado ? "pl-2" : "pt-0.5") : "invisible")}
          >
            {temFuro && (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i aria-hidden="true" className="h-3.5 w-[5px] rounded-sm bg-furo" />
                furo ligado
              </span>
            )}
            {temParticipantes && (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i aria-hidden="true" className="h-[3px] w-5 rounded-full bg-[#8b83c9]" />
                barra = participantes
              </span>
            )}
            {temReduzida && (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i aria-hidden="true" className="h-3.5 w-[5px] rounded-sm bg-reduzida" />
                parcela reduzida ≤ 55%
              </span>
            )}
          </div>
        )}
      </div>

      {pop && <Popup {...pop} hoje={hoje} cores={cores} />}
    </>
  );
}

function Popup({ g, x, y, acima, hoje, cores }: { g: Chip; x: number; y: number; acima: boolean; hoje: string; cores: Record<string, string> }) {
  // a tabela vigente é da próxima assembleia enquanto a data dela não passou
  const realizadas = g.data && g.data >= hoje ? g.assembleia - 1 : g.assembleia;
  const faltam = Math.max(0, g.prazo - realizadas);
  const linha = "flex justify-between gap-3";

  return (
    <div
      role="tooltip"
      style={{ left: x, top: y, width: 260, transform: acima ? "translateY(-100%)" : undefined }}
      className="pointer-events-none fixed z-50 flex flex-col gap-1.5 rounded-xl bg-navy p-3.5 text-[13px] text-[#e9e6f5] shadow-[0_10px_30px_rgba(13,5,64,0.35)]"
    >
      <div className="text-sm font-bold text-ouro">
        Grupo {g.numero} · {g.assembleia}ª{g.data ? ` · ${dataBR(g.data)}` : ""}
      </div>
      <div className={linha}>
        <span>Crédito</span>
        <span className="font-semibold text-white">
          {g.min !== null && g.max !== null ? `${mil(g.min)} a ${mil(g.max)}` : "—"}
        </span>
      </div>
      <div className={linha}>
        <span>Participantes</span>
        <span className="font-semibold text-white tabular-nums">{g.participantes ? g.participantes.toLocaleString("pt-BR") : "—"}</span>
      </div>
      <div className={linha}>
        <span>Assembleias</span>
        <span className="font-semibold text-white tabular-nums">{g.prazo}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span>
          Realizadas <span className="font-semibold text-white tabular-nums">{realizadas}</span>
        </span>
        <span>
          Faltam <span className="font-semibold text-laranja tabular-nums">{faltam}</span>
        </span>
      </div>
      {g.seq.length > 0 && (
        <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px] pt-0.5" aria-label={`Sequência: ${g.seq.join(", ")}`}>
          {g.seq.map((c, k) => (
            <span key={k} style={{ background: cores[c] ?? "#b9b3d6" }} className="aspect-square rounded-[2px]" />
          ))}
        </div>
      )}
    </div>
  );
}
