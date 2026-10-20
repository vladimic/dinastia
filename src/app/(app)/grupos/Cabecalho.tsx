import { ExportarResumo } from "./ExportarResumo";

// Cabeçalho principal de Grupos e Tabelas: título, o seletor de grupo (quando há um grupo aberto) e as ações.
export function Cabecalho({ seletor }: { seletor?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-borda bg-white px-8 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex flex-col">
          <div className="text-[11px] text-tinta">Cadastros</div>
          <h1 className="text-xl leading-tight font-bold">Grupos e Tabelas</h1>
        </div>
        {seletor}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ExportarResumo />
        <button
          type="button"
          disabled
          title="Em breve"
          className="flex min-h-9 items-center gap-2 rounded-[10px] bg-navy px-3 text-[13px] font-semibold text-white opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ceaa5b" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
          </svg>
          Simular com IA
        </button>
      </div>
    </header>
  );
}
