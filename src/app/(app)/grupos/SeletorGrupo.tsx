"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { FiltroCredito } from "./FiltroCredito";

// Seletor de grupo (fica no cabeçalho principal da tela): um botão com o grupo atual que abre a lista (larga) da família, com busca, filtros,
// o tamanho de cada grupo (participantes). Os filtros são: parcela, valor do crédito (slider duplo) e participantes. Sem grupo escolhido, a lista aparece aberta na página.
// O número do grupo no botão é um campo: digitar outro número e Enter abre esse grupo.

export type ItemGrupo = {
  numero: number;
  prazo: number;
  assembleia: number;
  data: string | null;
  min: number | null;
  max: number | null;
  participantes: number | null;
  furo: boolean;
  reduzidas: number[];
  /** códigos das 20 primeiras contemplações (desenhadas no pop-up) */
  seq: string[];
};

type Familia = { slug: string; nome: string };

const PARTICIPANTES_MAX = 9999; // barra cheia
const temAte55 = (g: ItemGrupo) => g.reduzidas.some((p) => p <= 55);
const tem70 = (g: ItemGrupo) => g.reduzidas.includes(70);
const mil = (v: number) => `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;
const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

type Props = {
  familias: readonly Familia[];
  familia: string;
  contagem: Record<string, number>;
  grupos: ItemGrupo[];
  atual: { numero: number; familiaNome: string; atualizadoEm?: string | null; arquivo?: string | null } | null;
  hoje: string;
  /** cor de cada modalidade, para a sequência do pop-up */
  cores: Record<string, string>;
};

export function SeletorGrupo({ familias, familia, contagem, grupos, atual, hoje, cores }: Props) {
  const sp = useSearchParams();
  const aba = sp.get("aba") ?? undefined;
  const pediuLista = sp.get("lista") === "1";
  const [aberto, setAberto] = useState(pediuLista);
  // a URL pediu a lista (trocou de família com a lista aberta): reabre, mesmo que a página tenha sido preservada
  const [ultimaUrl, setUltimaUrl] = useState(sp.toString());
  if (ultimaUrl !== sp.toString()) {
    setUltimaUrl(sp.toString());
    if (pediuLista) setAberto(true);
  }
  const caixa = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // navegar entre grupos leva um tempo: enquanto isso, os controles mostram a espera e não aceitam novos cliques
  const [navegando, iniciarNavegacao] = useTransition();
  const [destino, setDestino] = useState<string | null>(null);
  const navegar = (url: string) => {
    if (navegando) return;
    setDestino(url);
    iniciarNavegacao(() => router.push(url));
  };
  // número digitado no campo do grupo; volta ao grupo aberto quando a página troca de grupo
  const [codigo, setCodigo] = useState(atual ? String(atual.numero) : "");
  const [grupoDoCampo, setGrupoDoCampo] = useState(atual?.numero);
  if (grupoDoCampo !== atual?.numero) {
    setGrupoDoCampo(atual?.numero);
    setCodigo(atual ? String(atual.numero) : "");
  }
  const painel = useRef<HTMLDivElement>(null);

  // ao sair da página (ela fica preservada, escondida), a lista volta fechada
  useLayoutEffect(() => () => setAberto(false), []);

  // com um grupo aberto e a lista aberta, as telas Dados do grupo e Simulador ficam ocultas (globals.css: html[data-lista-aberta])
  useLayoutEffect(() => {
    if (!aberto || !atual) return;
    document.documentElement.dataset.listaAberta = "";
    return () => {
      delete document.documentElement.dataset.listaAberta;
    };
  }, [aberto, atual]);

  useEffect(() => {
    if (!aberto || !atual) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, atual]);

  // a lista ocupa a largura da tela (por cima do menu, para caber mais grupos por linha),
  // logo abaixo do botão; acompanha a rolagem da página enquanto estiver aberta
  useLayoutEffect(() => {
    if (!aberto) return;
    // a lista começa na margem esquerda do conteúdo da página (a do título do cabeçalho) e vai até a margem direita da tela
    const posicionar = () => {
      if (!botao.current || !painel.current) return;
      const r = botao.current.getBoundingClientRect();
      painel.current.style.top = `${Math.round(r.bottom + 8)}px`;
      const cab = botao.current.closest("header");
      painel.current.style.left = `${Math.round(Math.max(16, cab ? cab.getBoundingClientRect().left + 32 : r.left))}px`;
    };
    posicionar();
    window.addEventListener("scroll", posicionar, { passive: true });
    window.addEventListener("resize", posicionar);
    return () => {
      window.removeEventListener("scroll", posicionar);
      window.removeEventListener("resize", posicionar);
    };
  }, [aberto]);

  const href = (q: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") p.set(k, String(v));
    return `/grupos?${p.toString()}`;
  };
  const linkGrupo = (n: number) => href({ familia, grupo: n, aba });

  const i = atual ? grupos.findIndex((g) => g.numero === atual.numero) : -1;
  const anterior = i > 0 ? grupos[i - 1] : null;
  const proximo = i >= 0 && i < grupos.length - 1 ? grupos[i + 1] : null;
  const nomeFamilia = familias.find((f) => f.slug === familia)?.nome ?? familia;

  const lista = (
    <Lista
      familias={familias}
      familia={familia}
      contagem={contagem}
      grupos={grupos}
      ativo={atual?.numero}
      hoje={hoje}
      cores={cores}
      linkGrupo={linkGrupo}
      linkFamilia={(slug) => href({ familia: slug, grupo: atual?.numero, aba, lista: atual ? 1 : undefined })}
      aoEscolher={() => setAberto(false)}
      navegar={navegar}
    />
  );

  if (!atual) {
    return <section className="rounded-2xl border border-borda bg-white p-4">{lista}</section>;
  }

  // clique normal navega com a espera visível; com Ctrl/Cmd/Shift o navegador abre em outra aba, como um link comum
  const clicarSeta = (e: React.MouseEvent, url: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navegar(url);
  };
  const seta = "flex h-10 w-10 items-center justify-center rounded-xl border border-borda-campo bg-white text-navy hover:border-navy";
  return (
    <div ref={caixa} className="relative flex items-center gap-2">
      <div
        ref={botao}
        className="flex min-h-[3.25rem] items-center rounded-2xl border border-navy bg-white focus-within:ring-2 focus-within:ring-laranja-claro hover:shadow-[0_4px_14px_rgba(13,5,64,0.12)]"
      >
        <input
          inputMode="numeric"
          aria-label="Número do grupo (digite e tecle Enter)"
          title="Digite o número de um grupo e tecle Enter"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Escape") return setCodigo(String(atual.numero));
            if (e.key !== "Enter") return;
            const n = Number(codigo);
            if (!n || n === atual.numero) return setCodigo(String(atual.numero));
            setAberto(false);
            // sem a família: a página usa a do grupo digitado
            navegar(href({ grupo: n, aba }));
          }}
          onBlur={() => setCodigo(String(atual.numero))}
          style={{ width: `${Math.max(3, codigo.length) + 0.6}ch` }}
          className="ml-3 rounded-lg bg-transparent px-1 text-[26px] leading-none font-extrabold tracking-tight tabular-nums outline-none focus:bg-campo"
        />
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="flex items-center gap-3 self-stretch rounded-r-2xl py-1.5 pr-3 pl-2 text-left"
        >
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold">Grupo {atual.numero}</span>
            <span className="text-[11px] text-tinta">{atual.familiaNome}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={"transition-transform " + (aberto ? "rotate-180" : "")}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {anterior ? (
        <Link
          href={linkGrupo(anterior.numero)}
          onClick={(e) => clicarSeta(e, linkGrupo(anterior.numero))}
          className={seta + (navegando ? " cursor-wait opacity-70" : "")}
          aria-label={`Grupo anterior (${anterior.numero})`}
          aria-busy={navegando && destino === linkGrupo(anterior.numero)}
          title={`Grupo anterior: ${anterior.numero}`}
        >
          {navegando && destino === linkGrupo(anterior.numero) ? <Espera /> : "‹"}
        </Link>
      ) : (
        <span className={seta + " opacity-35"} aria-hidden="true">
          ‹
        </span>
      )}
      {proximo ? (
        <Link
          href={linkGrupo(proximo.numero)}
          onClick={(e) => clicarSeta(e, linkGrupo(proximo.numero))}
          className={seta + (navegando ? " cursor-wait opacity-70" : "")}
          aria-label={`Próximo grupo (${proximo.numero})`}
          aria-busy={navegando && destino === linkGrupo(proximo.numero)}
          title={`Próximo grupo: ${proximo.numero}`}
        >
          {navegando && destino === linkGrupo(proximo.numero) ? <Espera /> : "›"}
        </Link>
      ) : (
        <span className={seta + " opacity-35"} aria-hidden="true">
          ›
        </span>
      )}
      {navegando && (
        <span role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-tinta">
          <Espera /> Abrindo grupo…
        </span>
      )}
      {atual.atualizadoEm && !navegando && (
        <span className="max-w-[5.5rem] text-[11px] leading-tight text-tinta" title={atual.arquivo ? `Tabela: ${atual.arquivo}` : undefined}>
          Atualizado em {atual.atualizadoEm}
        </span>
      )}

      {aberto && (
        <div
          ref={painel}
          role="dialog"
          aria-label={`Escolher grupo · ${nomeFamilia}`}
          className="fixed right-4 left-4 z-40 rounded-2xl border border-borda-campo bg-white p-4 shadow-[0_24px_60px_rgba(13,5,64,0.28)]"
        >
          {lista}
        </div>
      )}
    </div>
  );
}

function Lista({
  familias,
  familia,
  contagem,
  grupos,
  ativo,
  hoje,
  cores,
  linkGrupo,
  navegar,
  linkFamilia,
  aoEscolher,
}: {
  familias: readonly Familia[];
  familia: string;
  contagem: Record<string, number>;
  grupos: ItemGrupo[];
  ativo?: number;
  hoje: string;
  cores: Record<string, string>;
  linkGrupo: (n: number) => string;
  navegar: (url: string) => void;
  linkFamilia: (slug: string) => string;
  aoEscolher: () => void;
}) {
  // pop-up de detalhes do grupo sob o mouse (ou com o foco do teclado)
  const [pop, setPop] = useState<{ g: ItemGrupo; x: number; y: number; acima: boolean } | null>(null);
  function mostrar(g: ItemGrupo, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const largura = 260;
    const x = Math.min(Math.max(8, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 8);
    const acima = r.bottom + 210 > window.innerHeight; // o pop-up tem ~195 px de altura: sem espaço embaixo, abre acima
    setPop({ g, x, y: acima ? r.top - 6 : r.bottom + 6, acima });
  }
  const [filtros, setFiltros] = useState({ furo: false, r70: false, r55: false });
  // faixa de crédito escolhida (null = toda a faixa da família) e participantes marcados (vazio = todos)
  const [faixa, setFaixa] = useState<{ de: number; ate: number } | null>(null);
  const [marcados, setMarcados] = useState<number[]>([]);
  // trocou de família: os limites e os valores mudam, então os dois filtros voltam ao início
  const [familiaDoFiltro, setFamiliaDoFiltro] = useState(familia);
  if (familiaDoFiltro !== familia) {
    setFamiliaDoFiltro(familia);
    setFaixa(null);
    setMarcados([]);
  }

  // do menor ao maior crédito de todos os grupos da família (em múltiplos de R$ 1.000)
  const limites = useMemo(() => {
    const mins = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.min] : []));
    const maxs = grupos.flatMap((g) => (g.min !== null && g.max !== null ? [g.max] : []));
    if (!mins.length) return null;
    return { minimo: Math.floor(Math.min(...mins) / 1000) * 1000, maximo: Math.ceil(Math.max(...maxs) / 1000) * 1000 };
  }, [grupos]);
  const valoresParticipantes = useMemo(() => [...new Set(grupos.flatMap((g) => (g.participantes ? [g.participantes] : [])))].sort((a, b) => a - b), [grupos]);
  const de = limites ? Math.max(limites.minimo, Math.min(faixa?.de ?? limites.minimo, limites.maximo)) : 0;
  const ate = limites ? Math.max(de, Math.min(faixa?.ate ?? limites.maximo, limites.maximo)) : 0;
  const filtraCredito = limites !== null && (de > limites.minimo || ate < limites.maximo);

  const realizadas = (g: ItemGrupo) => (g.data && g.data >= hoje ? g.assembleia - 1 : g.assembleia);
  const faltam = (g: ItemGrupo) => Math.max(0, g.prazo - realizadas(g));

  // o grupo entra na faixa quando algum crédito dele cai dentro dela (os grupos têm um menor e um maior crédito)
  const noCredito = (g: ItemGrupo) => !filtraCredito || (g.min !== null && g.max !== null && g.max >= de && g.min <= ate);
  const visiveis = grupos
    .filter(
      (g) =>
        noCredito(g) &&
        (!marcados.length || (g.participantes !== null && marcados.includes(g.participantes))) &&
        (!filtros.furo || g.furo) &&
        (!filtros.r70 || tem70(g)) &&
        (!filtros.r55 || temAte55(g)),
    )
    .sort((a, b) => a.numero - b.numero);

  const temFiltro = filtraCredito || marcados.length > 0 || filtros.furo || filtros.r70 || filtros.r55;
  const limparTudo = () => {
    setFiltros({ furo: false, r70: false, r55: false });
    setFaixa(null);
    setMarcados([]);
  };

  const chip = (on: boolean) =>
    "flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold " + (on ? "border-tinta bg-lavanda text-navy" : "border-borda-campo bg-white text-tinta hover:border-navy");

  return (
    <div className="@container flex flex-col gap-3">
      {/* cabeçalho da lista numa linha só: família, busca e filtros */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <nav aria-label="Família de produto" className="flex shrink-0 flex-wrap gap-1 rounded-xl border border-borda bg-linha p-1">
          {familias.map((f) => {
            const on = f.slug === familia;
            return (
              <Link
                key={f.slug}
                href={linkFamilia(f.slug)}
                aria-current={on ? "true" : undefined}
                className={"flex min-h-8 items-center rounded-lg px-3 text-[13px] font-bold " + (on ? "bg-white text-navy shadow ring-1 ring-laranja" : "text-tinta hover:text-navy")}
              >
                {f.nome} <span className="ml-1 font-semibold opacity-70">{contagem[f.slug] ?? 0}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Filtros">
          <button type="button" aria-pressed={filtros.furo} onClick={() => setFiltros((f) => ({ ...f, furo: !f.furo }))} className={chip(filtros.furo)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-furo" /> Furo
          </button>
          <button type="button" aria-pressed={filtros.r70} onClick={() => setFiltros((f) => ({ ...f, r70: !f.r70 }))} className={chip(filtros.r70)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-setenta" /> Parcela 70
          </button>
          <button type="button" aria-pressed={filtros.r55} onClick={() => setFiltros((f) => ({ ...f, r55: !f.r55 }))} className={chip(filtros.r55)}>
            <i aria-hidden="true" className="h-2 w-2 rounded-full bg-reduzida" /> Parcela 50 / 55
          </button>
        </div>
        {limites && (
          <FiltroCredito minimo={limites.minimo} maximo={limites.maximo} de={de} ate={ate} aoMudar={(a, b) => setFaixa({ de: a, ate: b })} />
        )}
        {valoresParticipantes.length > 0 && (
          <div role="group" aria-labelledby="rotulo-participantes" className="flex h-[42px] shrink-0 flex-col justify-center gap-[3px]">
            <div className="flex h-3 items-center justify-between">
              <span id="rotulo-participantes" className="text-[10px] leading-none font-extrabold tracking-wider text-tinta uppercase">
                Participantes
              </span>
              <button
                type="button"
                aria-label="Limpar filtro de participantes"
                aria-hidden={!marcados.length}
                tabIndex={marcados.length ? 0 : -1}
                onClick={() => setMarcados([])}
                className={"w-4 text-[14px] leading-[12px] text-tinta hover:text-navy " + (marcados.length ? "" : "invisible")}
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-1">
              {valoresParticipantes.map((v) => {
                const on = marcados.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMarcados((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                    className={
                      "flex h-[26px] min-w-[2.5rem] items-center justify-center rounded-full border px-2 text-[12px] font-bold tabular-nums " +
                      (on ? "border-laranja bg-laranja-claro text-navy" : "border-borda-campo bg-white text-navy hover:border-navy")
                    }
                  >
                    {v.toLocaleString("pt-BR", { useGrouping: false })}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={!temFiltro}
          onClick={limparTudo}
          aria-label="Limpa tudo"
          title="Limpa tudo (Parcela, Crédito e Participantes)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-borda-campo bg-white text-tinta hover:border-navy hover:text-navy disabled:cursor-default disabled:opacity-40 disabled:hover:border-borda-campo disabled:hover:text-tinta"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
            <path d="M16.5 15.5l5 5M21.5 15.5l-5 5" />
          </svg>
        </button>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda-campo px-4 py-3 text-sm text-tinta">Nenhum grupo cadastrado nesta família.</p>
      ) : visiveis.length === 0 ? (
        <p className="px-1 py-3 text-sm text-tinta">Nenhum grupo com esses filtros.</p>
      ) : (
        <ul className="m-0 grid max-h-[min(60vh,34rem)] list-none grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))] gap-1.5 overflow-auto p-0.5">
          {visiveis.map((g) => {
            const sel = g.numero === ativo;
            const r = realizadas(g);
            const tam = g.participantes;
            const marcas = [g.furo && "furo", tem70(g) && "parcela 70", temAte55(g) && "parcela 50 ou 55"].filter(Boolean).join(", ");
            return (
              <li key={g.numero}>
                <Link
                  href={linkGrupo(g.numero)}
                  onClick={(e) => {
                    setPop(null);
                    aoEscolher();
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    navegar(linkGrupo(g.numero));
                  }}
                  aria-current={sel ? "true" : undefined}
                  onMouseEnter={(e) => mostrar(g, e.currentTarget)}
                  onMouseLeave={() => setPop(null)}
                  onFocus={(e) => mostrar(g, e.currentTarget)}
                  onBlur={() => setPop(null)}
                  className={
                    "relative flex min-w-0 flex-col gap-1 rounded-xl border px-2 pt-1.5 pb-2 " +
                    (sel ? "border-navy bg-lavanda ring-2 ring-laranja" : "border-borda-campo bg-white hover:border-navy")
                  }
                >
                  {/* 1ª linha: número e sinalizadores · 2ª: realizadas/faltam::prazo (ex.: 80/160::240) · 3ª: participantes */}
                  <span className="flex items-center justify-between gap-1">
                    <span className="text-[14px] leading-tight font-extrabold tabular-nums">{g.numero}</span>
                    <span aria-hidden="true" className="flex shrink-0 gap-[2px]">
                      {g.furo && <i className="h-[7px] w-[7px] rounded-full bg-furo" />}
                      {tem70(g) && <i className="h-[7px] w-[7px] rounded-full bg-setenta" />}
                      {temAte55(g) && <i className="h-[7px] w-[7px] rounded-full bg-reduzida" />}
                    </span>
                  </span>
                  <span className="truncate text-[10px] leading-none font-semibold text-tinta tabular-nums">
                    {r}/{faltam(g)}::{g.prazo}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-lavanda" aria-hidden="true">
                      {tam ? <span className="absolute inset-y-0 left-0 rounded-full bg-[#8b83c9]" style={{ width: `${Math.min(100, (tam / PARTICIPANTES_MAX) * 100)}%` }} /> : null}
                    </span>
                    <span className="text-[11px] leading-none font-bold tabular-nums">{tam ? tam.toLocaleString("pt-BR") : "—"}</span>
                  </span>
                  <span className="sr-only">
                    {tam ? ` · ${tam.toLocaleString("pt-BR")} participantes` : ""}
                    {marcas ? ` · ${marcas}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pop && <Popup {...pop} hoje={hoje} cores={cores} />}
    </div>
  );
}

// Pop-up com os detalhes do grupo (o mesmo da versão antiga da tela): crédito, participantes, reduzidas,
// assembleias, realizadas/faltam e a sequência de contemplação em quadradinhos coloridos.
function Popup({ g, x, y, acima, hoje, cores }: { g: ItemGrupo; x: number; y: number; acima: boolean; hoje: string; cores: Record<string, string> }) {
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
        <span className="font-semibold text-white">{g.min !== null && g.max !== null ? `${mil(g.min)} a ${mil(g.max)}` : "—"}</span>
      </div>
      <div className={linha}>
        <span>Participantes</span>
        <span className="font-semibold text-white tabular-nums">{g.participantes ? g.participantes.toLocaleString("pt-BR") : "—"}</span>
      </div>
      {g.reduzidas.length > 0 && (
        <div className={linha}>
          <span>Reduzidas</span>
          <span className="font-semibold text-white tabular-nums">{g.reduzidas.join(" · ")}</span>
        </div>
      )}
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

/** Indicador de espera (círculo girando) */
function Espera() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin text-laranja">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
