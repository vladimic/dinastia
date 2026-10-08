import type { Metadata } from "next";
import { VERSOES } from "@/lib/versoes";

export const metadata: Metadata = { title: "Histórico de versões · Dinastia" };

export default function VersoesPage() {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-[18px]">
        <div className="text-xs text-tinta">Sistema</div>
        <h1 className="text-[22px] font-bold">Histórico de versões</h1>
      </header>
      <div className="flex max-w-3xl flex-col gap-4 px-8 pt-6 pb-10">
        {VERSOES.map((v, i) => (
          <section key={v.numero} className="cartao gap-2.5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-bold tabular-nums">{v.numero}</h2>
              <span className="text-xs text-tinta">{v.data}</span>
              {i === 0 && (
                <span className="rounded-full bg-ouro-claro px-2 py-0.5 text-[11px] font-bold text-ouro-texto">atual</span>
              )}
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed">
              {v.itens.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
