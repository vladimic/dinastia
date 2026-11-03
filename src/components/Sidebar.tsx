"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";

// Voltar a uma tela pelo menu leva de volta ao que estava aberto nela (grupo, aba, filtros), e não à tela em branco.
// O Next guarda o estado de cada tela pelo endereço completo (com o ?grupo=…); por isso o menu lembra o último endereço de cada tela.
const CHAVE_ULTIMAS = "dinastia:ultimas-telas";
const PARAMETROS_PASSAGEIROS = ["salvo", "erro"]; // avisos de uma gravação: não voltam junto

const EVENTO_ULTIMAS = "dinastia:ultimas-telas";
const assinar = (aviso: () => void) => {
  window.addEventListener(EVENTO_ULTIMAS, aviso);
  return () => window.removeEventListener(EVENTO_ULTIMAS, aviso);
};
const instantaneo = () => {
  try {
    return sessionStorage.getItem(CHAVE_ULTIMAS) ?? "{}";
  } catch {
    return "{}";
  }
};
const instantaneoServidor = () => "{}";

/** Anota o endereço completo da tela atual (sem os avisos de gravação). Não desenha nada. */
function Rastreador({ aoMudar }: { aoMudar: (caminho: string, endereco: string) => void }) {
  const caminho = usePathname();
  const busca = useSearchParams();
  const texto = busca.toString();
  useEffect(() => {
    const q = new URLSearchParams(texto);
    for (const k of PARAMETROS_PASSAGEIROS) q.delete(k);
    const resto = q.toString();
    aoMudar(caminho, resto ? `${caminho}?${resto}` : caminho);
  }, [caminho, texto, aoMudar]);
  return null;
}

type Item = { href: string; label: string; pronto?: boolean; admin?: boolean };

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
      { href: "/parametros", label: "Parâmetros globais", pronto: true, admin: true },
      { href: "/modalidades", label: "Modalidades de Contemplação", pronto: true, admin: true },
      { href: "/tipos-parcela", label: "Tipos de Parcela", pronto: true, admin: true },
      { href: "/usuarios", label: "Usuários", pronto: true, admin: true },
      { href: "/lances", label: "Histórico de lances" },
      { href: "/indices", label: "Índices de correção" },
      { href: "/importar", label: "Importar tabelas (PDF)", pronto: true, admin: true },
    ],
  },
];

export function Sidebar({ rodape, admin = false }: { rodape: ReactNode; admin?: boolean }) {
  const path = usePathname();
  const ultimas = JSON.parse(useSyncExternalStore(assinar, instantaneo, instantaneoServidor)) as Record<string, string>;
  const lembrar = useCallback((caminho: string, endereco: string) => {
    const base = "/" + caminho.split("/")[1];
    const atuais = JSON.parse(instantaneo()) as Record<string, string>;
    if (atuais[base] === endereco) return;
    try {
      sessionStorage.setItem(CHAVE_ULTIMAS, JSON.stringify({ ...atuais, [base]: endereco }));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(EVENTO_ULTIMAS));
  }, []);

  return (
    <nav
      aria-label="Menu principal"
      className="flex max-w-full flex-[1_1_248px] flex-col gap-6 bg-navy px-[18px] py-7 text-[#e9e6f5] lg:max-w-[260px]"
    >
      <Suspense fallback={null}>
        <Rastreador aoMudar={lembrar} />
      </Suspense>
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
          {g.itens.filter((item) => admin || !item.admin).map((item) => {
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
                href={ultimas[item.href] ?? item.href}
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
