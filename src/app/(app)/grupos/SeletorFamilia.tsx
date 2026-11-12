"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Familia = { slug: string; nome: string };

// Escolha da família de produto (Imóveis, Veículos, Serviços, Outros Bens), no cabeçalho principal ao lado do título.
// Com um grupo aberto, trocar de família mantém o grupo e a aba e reabre a lista de grupos da nova família.
export function SeletorFamilia({ familias, familia, contagem }: { familias: readonly Familia[]; familia: string; contagem: Record<string, number> }) {
  const sp = useSearchParams();
  const grupo = sp.get("grupo") ?? undefined;
  const aba = sp.get("aba") ?? undefined;
  const link = (slug: string) => {
    const p = new URLSearchParams({ familia: slug });
    if (grupo) p.set("grupo", grupo);
    if (aba) p.set("aba", aba);
    if (grupo) p.set("lista", "1");
    return `/grupos?${p.toString()}`;
  };
  return (
    <nav aria-label="Família de produto" className="flex shrink-0 flex-nowrap gap-1 rounded-xl border border-borda bg-linha p-1">
      {familias.map((f) => {
        const on = f.slug === familia;
        return (
          <Link
            key={f.slug}
            href={link(f.slug)}
            aria-current={on ? "true" : undefined}
            className={"flex min-h-8 items-center rounded-lg px-2.5 text-[13px] font-bold " + (on ? "bg-white text-navy shadow ring-1 ring-laranja" : "text-tinta hover:text-navy")}
          >
            {f.nome} <span className="ml-1 font-semibold opacity-70">{contagem[f.slug] ?? 0}</span>
          </Link>
        );
      })}
    </nav>
  );
}
