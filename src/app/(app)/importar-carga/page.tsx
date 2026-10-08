import type { Metadata } from "next";
import carga from "@/data/carga-2026-10-20-imoveis.json";
import { ImportarForm } from "./ImportarForm";

export const metadata: Metadata = { title: "Importar carga · Dinastia" };

export default function ImportarCargaPage() {
  const grupos = (carga as unknown as { numero: number }[]).map((g) => g.numero);

  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-[18px]">
        <div className="text-xs text-tinta">Cadastros</div>
        <h1 className="text-[22px] font-bold">Importar carga de imóveis</h1>
      </header>
      <div className="flex max-w-3xl flex-col gap-5 px-8 pt-6 pb-10">
        <p className="text-sm leading-relaxed">
          {grupos.length} grupos de imóveis lidos dos PDFs da assembleia de <strong>20/10/2026</strong>, já validados
          (prazo da cota, parcela × prazo, 1% antecipado e seguro). Grupos já cadastrados nessa assembleia são ignorados.
        </p>
        <ImportarForm total={grupos.length} />
        <details className="text-xs text-tinta">
          <summary className="cursor-pointer">Grupos incluídos</summary>
          <p className="mt-2 leading-relaxed">{grupos.join(", ")}</p>
        </details>
      </div>
    </>
  );
}
