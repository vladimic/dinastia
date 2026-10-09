// Ícone de lápis para entrar no modo de edição de um card
export function BotaoLapis({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="flex h-6 w-6 items-center justify-center rounded-md text-tinta hover:bg-linha hover:text-navy"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  );
}

export function BotaoFinalizar({ onClick, rotulo = "Finalizar edição" }: { onClick: () => void; rotulo?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-8 w-fit rounded-[10px] bg-navy px-3.5 text-xs font-bold text-white hover:brightness-110"
    >
      {rotulo}
    </button>
  );
}
