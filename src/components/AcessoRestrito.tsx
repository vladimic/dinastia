export function AcessoRestrito({ aviso }: { aviso?: string }) {
  return (
    <div role="alert" className="max-w-[34rem] rounded-2xl border border-alerta-borda bg-alerta-fundo p-5 text-sm text-alerta">
      <p className="font-bold">Acesso restrito a administradores.</p>
      <p className="mt-1">{aviso ?? "Peça a um administrador para alterar esta tela ou para marcar seu cadastro como Administrador."}</p>
    </div>
  );
}
