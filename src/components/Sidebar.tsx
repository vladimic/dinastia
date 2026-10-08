"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = { href: string; label: string; pronto?: boolean };

const GRUPOS: { titulo?: string; itens: Item[] }[] = [
  {
    itens: [
      { href: "/inicio", label: "Início" },
      { href: "/clientes", label: "Clientes" },
      { href: "/propostas", label: "Propostas" },
    ],
  },
  {
    titulo: "Simuladores",
    itens: [
      { href: "/simuladores/padrao", label: "Consórcio padrão" },
      { href: "/simuladores/lance", label: "Consórcio com lance" },
      { href: "/simuladores/financiamento", label: "Consórcio × Financiamento" },
      { href: "/simuladores/alavancagem", label: "Alavancagem patrimonial" },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { href: "/grupos", label: "Grupos e Tabelas", pronto: true },
      { href: "/parametros", label: "Parâmetros globais", pronto: true },
      { href: "/modalidades", label: "Modalidades de Contemplação", pronto: true },
      { href: "/tipos-parcela", label: "Tipos de Parcela", pronto: true },
      { href: "/lances", label: "Histórico de lances" },
      { href: "/indices", label: "Índices de correção" },
      { href: "/importar", label: "Importar tabelas (PDF)" },
    ],
  },
];

export function Sidebar({ rodape }: { rodape: ReactNode }) {
  const path = usePathname();

  return (
    <nav
      aria-label="Menu principal"
      className="flex max-w-full flex-[1_1_248px] flex-col gap-6 bg-navy px-[18px] py-7 text-[#e9e6f5] lg:max-w-[260px]"
    >
      <div className="flex flex-col gap-1 px-2.5">
        <div className="font-display text-[34px] font-bold leading-none tracking-wide text-ouro">Dinastia</div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#b9b3d6]">Estruturação de Patrimônio</div>
        <div className="mt-3.5 h-px bg-ouro/50" />
      </div>

      {GRUPOS.map((g, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {g.titulo && (
            <div className="px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-ouro">{g.titulo}</div>
          )}
          {g.itens.map((item) => {
            const ativo = path === item.href || path.startsWith(item.href + "/");
            if (!item.pronto) {
              return (
                <span
                  key={item.href}
                  title="Em breve"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#e9e6f5]/55"
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={
                  "rounded-lg px-3 py-2 text-sm " +
                  (ativo
                    ? "bg-navy-2 font-semibold text-white shadow-[inset_3px_0_0_var(--color-laranja)]"
                    : "text-[#e9e6f5] hover:bg-navy-2")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto border-t border-navy-3 px-2.5 pt-4">{rodape}</div>
    </nav>
  );
}
