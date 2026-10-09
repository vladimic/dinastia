"use client";

import Link from "next/link";
import { useState } from "react";

export type Chip = {
  numero: number;
  prazo: number;
  assembleia: number;
  data: string | null; // data da assembleia da tabela vigente (AAAA-MM-DD)
  min: number | null;
  max: number | null;
  seq: string[]; // códigos das 20 primeiras contemplações
};

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
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
                "flex h-6 items-center justify-center rounded text-xs font-bold tabular-nums " +
                (sel
                  ? "bg-navy text-white shadow-[inset_0_-3px_0_var(--color-laranja)]"
                  : "border border-borda-campo bg-white text-navy hover:border-navy")
              }
            >
              {g.numero}
            </Link>
          );
        })}
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
