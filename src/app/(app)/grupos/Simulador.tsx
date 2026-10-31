"use client";

import { useState } from "react";
import type { Modalidade } from "@/lib/grupos";
import { calcularBase, calcularColuna, type Coluna as Calc, type PadroesSimulador, type TipoColuna } from "@/lib/simulacao";
import { useSimulacao } from "./SimulacaoContext";
import { useDados } from "./GrupoDetalhe";

// Simulador do grupo: os cálculos vêm de src/lib/simulacao.ts, com os parâmetros numa coluna à esquerda
// e a grade de resultados à direita.

const p1 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const reais2 = (v: number) => brl2.format(v);
const dinheiro = (v: number | null | undefined) => (v === null || v === undefined ? "—" : reais2(v));
const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf4 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

type Meta = { chave: string; tipo: TipoColuna; titulo: string; numero?: number };

const COLUNAS: Meta[] = [
  { chave: "sorteio", tipo: "SOR", titulo: "Sorteio" },
  { chave: "fixo", tipo: "FIX", titulo: "Lance Fixo", numero: 1 },
  { chave: "limitado", tipo: "LIM", titulo: "Lance Limitado", numero: 2 },
  { chave: "livre", tipo: "LIV", titulo: "Lance Livre", numero: 3 },
  { chave: "fidelidade", tipo: "FID", titulo: "Lance Fidelidade", numero: 4 },
];

// cor de cada coluna só na borda de cima e em fundos claros: o corpo da página fica claro, distinto do menu azul
// cores de cada lance (as da Tabela Resumo, em pastel): faixa de cima, fundo e barra de concorrência
const BORDA: Record<TipoColuna, string> = { SOR: "border-t-[#8cc063]", FIX: "border-t-[#6f93d6]", LIM: "border-t-[#f0a06b]", LIV: "border-t-[#ee7a7a]", FID: "border-t-[#ee8fee]" };
const FUNDO: Record<TipoColuna, string> = { SOR: "bg-[#e6f2dc]", FIX: "bg-[#dde6f6]", LIM: "bg-[#fde6d6]", LIV: "bg-[#fbe0e0]", FID: "bg-[#fbe3fb]" };
const BARRA: Record<TipoColuna, string> = { SOR: "bg-[#8cc063]", FIX: "bg-[#6f93d6]", LIM: "bg-[#f0a06b]", LIV: "bg-[#ee7a7a]", FID: "bg-[#ee8fee]" };

type Coluna = Meta & {
  oferecido: boolean;
  bloqueio: string | null;
  qtd: string | null;
  qtdFixa: boolean;
  icone: "cadeado" | "martelo";
  /** máximo de parcelas do lance nesta simulação (nulo = sem teto) */
  teto: number | null;
  calc: Calc | null;
  prazoRestante: number;
  concorrencia: number | null;
  rodape: { titulo: string; texto: string };
};

function Cadeado() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Valor fixo">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
function Martelo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Disputado como leilão">
      <path d="M14 4l6 6-3 3-6-6zM11 7L4 14l3 3 7-7M3 21h10" />
    </svg>
  );
}

const GRADE = "grid grid-cols-[10.5rem_repeat(5,minmax(0,1fr))] gap-x-1.5";

// botão − ou + do campo de parcelas (o limite de cada lance vem de `teto`)
function Passo({ sinal, rotulo, desligado, aoClicar }: { sinal: string; rotulo: string; desligado: boolean; aoClicar: () => void }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      disabled={desligado}
      onClick={aoClicar}
      className="flex h-6 w-4 shrink-0 items-center justify-center rounded border border-borda-campo bg-white text-[14px] leading-none font-bold text-navy hover:border-navy disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-borda-campo"
    >
      {sinal}
    </button>
  );
}

function Cabecalho({ c, aoMudarQtd }: { c: Coluna; aoMudarQtd: (v: string) => void }) {
  const qtdNum = Number(c.qtd) || 0;
  return (
    <div className={`@container flex min-h-[7rem] flex-col gap-1.5 rounded-t-lg border-t-4 px-2.5 py-2 ${BORDA[c.tipo]} ${FUNDO[c.tipo]}`}>
      <div className="flex items-center gap-1.5">
        {c.numero && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-navy text-[11px] leading-none font-extrabold">{c.numero}</span>
        )}
        <span className="text-[13px] leading-tight font-extrabold">{c.titulo}</span>
      </div>
      {!c.numero ? (
        <span className="mt-auto text-[11px] font-semibold text-tinta">Sem lance</span>
      ) : (
        <>
          {c.oferecido && c.qtd !== null && (
            <div className="flex flex-col gap-0.5">
              <label
                className={"flex items-center text-[11px] font-semibold text-tinta " + (c.qtdFixa ? "gap-1" : "gap-0.5 whitespace-nowrap")}
                title={
                  c.icone === "cadeado"
                    ? `Lance com máximo pré-definido pelo grupo${c.teto !== null ? ` (${c.teto} parcelas)` : ""}`
                    : "Lance em leilão: você define as parcelas nesta simulação"
                }
              >
                {!c.qtdFixa && <Passo sinal="−" rotulo={`Diminuir as parcelas do ${c.titulo}`} desligado={qtdNum <= 1} aoClicar={() => aoMudarQtd(String(Math.max(1, qtdNum - 1)))} />}
                <span
                  className={
                    "flex h-6 items-center gap-px rounded border px-0.5 text-navy " +
                    (c.icone === "cadeado" ? "border-dashed border-navy " : "border-solid border-[#c2410c] ") + (c.qtdFixa ? "bg-linha" : "bg-white")
                  }
                >
                  {c.icone === "cadeado" ? <Cadeado /> : <Martelo />}
                  <input
                    inputMode="numeric"
                    readOnly={c.qtdFixa}
                    value={c.qtd}
                    aria-label={`Parcelas do ${c.titulo}`}
                    onChange={(e) => aoMudarQtd(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className={(c.qtdFixa ? "w-7" : "w-6") + " bg-transparent text-right text-[12px] font-bold tabular-nums outline-none"}
                  />
                </span>
                {!c.qtdFixa && (
                  <Passo
                    sinal="+"
                    rotulo={`Aumentar as parcelas do ${c.titulo}`}
                    desligado={c.teto !== null && qtdNum >= c.teto}
                    aoClicar={() => aoMudarQtd(String(Math.min(c.teto ?? 999, qtdNum + 1)))}
                  />
                )}
                {c.qtdFixa ? (
                  <span>parcelas</span>
                ) : (
                  // com a coluna estreita, “parc.”; com espaço, “parcelas” por extenso
                  <>
                    <span className="@[8.5rem]:hidden">parc.</span>
                    <span className="hidden @[8.5rem]:inline">parcelas</span>
                  </>
                )}
              </label>
            </div>
          )}
          <div className="text-[10px] font-bold text-tinta">
            <div className="flex justify-between">
              <span>Concorrência</span>
              <span className="tabular-nums">{c.concorrencia === null ? "—" : `${c.concorrencia.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white" role="img" aria-label={`Concorrência ${c.concorrencia ?? 0}%`}>
              <div className={"h-full " + BARRA[c.tipo]} style={{ width: `${Math.min(100, (c.concorrencia ?? 0) * 3)}%` }} />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-[10px] font-bold whitespace-nowrap text-tinta">
            {c.calc ? p1(c.calc.proprioPct) : "—"} próprio
          </div>
        </>
      )}
    </div>
  );
}

function Grade({ colunas, aoMudarQtd }: { colunas: Coluna[]; aoMudarQtd: (t: TipoColuna) => (v: string) => void }) {
  const rotulo = "flex items-center px-2 text-[12px] leading-tight font-bold text-tinta";
  const celula = "flex min-h-[2.5rem] flex-col items-center justify-center border-b border-linha px-1 text-center";
  const valor = "text-[14px] leading-tight font-bold tabular-nums";
  const aviso = (c: Coluna) => c.bloqueio ?? (c.oferecido ? null : "Grupo não oferece");
  const [aberto, setAberto] = useState(true); // mostra ou recolhe recurso da carta e recurso próprio
  const lance: { r: string; v: (c: Coluna) => string; forte?: boolean }[] = [
    { r: "Recurso da Carta (embutido)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoCarta) : "—") },
    { r: "Recurso Próprio (dinheiro)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoProprio) : "—") },
    { r: "Lance Total", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.lanceTotal) : "—"), forte: true },
  ];
  const visiveis = aberto ? lance : lance.slice(-1);
  const linhasCima: { r: string; v: (c: Coluna) => string; avisar?: boolean; forte?: boolean }[] = [
    { r: "Crédito Disponível após a Contemplação", v: (c) => dinheiro(c.calc?.creditoDisponivel), forte: true },
    { r: "Valor da Parcela após a Contemplação", v: (c) => dinheiro(c.calc?.parcelaApos), forte: true },
    { r: "Prazo Restante", v: (c) => (c.calc && c.prazoRestante > 0 ? String(c.prazoRestante) : "—") },
  ];
  const linhasBaixo: { r: string; v: (c: Coluna) => string }[] = [
    { r: "Saldo Devedor", v: (c) => dinheiro(c.calc?.saldoDevedor) },
    { r: "Valor Investido", v: (c) => dinheiro(c.calc?.valorInvestido) },
    { r: "Custo Mensal", v: (c) => (c.calc?.custoMensal == null ? "—" : p2(c.calc.custoMensal * 100)) },
    { r: "Custo Anual", v: (c) => (c.calc?.custoAnual == null ? "—" : p2(c.calc.custoAnual * 100)) },
    { r: "Crédito - Lance com Recurso Próprio", v: (c) => dinheiro(c.calc?.creditoMenosProprio) },
  ];

  return (
    <div className="min-w-[46rem] rounded-2xl border border-borda bg-white p-2">
      <div className={GRADE}>
        <div aria-hidden="true" />
        {colunas.map((c) => (
          <Cabecalho key={c.chave} c={c} aoMudarQtd={aoMudarQtd(c.tipo)} />
        ))}
      </div>
      {/* bloco LANCE: recurso da carta, recurso próprio e o total */}
      <div className={GRADE + " border-b border-linha"}>
        <div>
          <div className="flex h-full overflow-hidden rounded-l-lg border border-borda-campo">
            <div className="flex w-6 shrink-0 items-center justify-center bg-navy text-white">
              <span className="text-[10px] font-extrabold tracking-[0.14em] [writing-mode:vertical-rl] rotate-180">LANCE</span>
            </div>
            <div className="flex flex-1 flex-col">
              {visiveis.map((l) => (
                <div key={l.r} className={(aberto ? "min-h-[2.5rem] " : "min-h-[3.25rem] ") + "flex flex-1 items-center gap-1 px-2 text-[12px] leading-tight text-tinta " + (l.forte ? "bg-lavanda font-extrabold" : "font-bold")}>
                  {l.r}
                  {l.forte && (
                    <button
                      type="button"
                      onClick={() => setAberto((v) => !v)}
                      aria-expanded={aberto}
                      aria-label={aberto ? "Recolher recurso da carta e recurso próprio" : "Expandir recurso da carta e recurso próprio"}
                      title={aberto ? "Recolher embutido e dinheiro" : "Expandir embutido e dinheiro"}
                      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded border border-borda-campo bg-white text-navy hover:border-navy"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" className={aberto ? "" : "rotate-180"}>
                        <path d="M6 15l6-6 6 6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {colunas.map((c) => {
            const msg = aviso(c);
            return (
              <div key={c.chave} className="flex flex-col rounded-md border border-linha">
                {visiveis.map((l) => (
                  <div key={l.r} className={(aberto ? "min-h-[2.5rem] " : "min-h-[3.25rem] ") + "flex flex-1 flex-col items-center justify-center px-1 text-center " + (l.forte ? FUNDO[c.tipo] : "")}>
                    {msg ? (
                      l === visiveis[0] && <span className="text-[10px] leading-tight text-tinta">{msg}</span>
                    ) : (
                      <span className={`${valor} ${l.forte ? "text-navy" : "text-ouro-texto"}`}>{l.v(c)}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
      </div>
      {linhasCima.map((l) => (
        <div key={l.r} className={GRADE}>
          <div className={rotulo + " border-b border-linha"}>{l.r}</div>
          {colunas.map((c) => {
            const msg = l.avisar ? aviso(c) : null;
            return (
              <div key={c.chave} className={celula}>
                {msg ? <span className="text-[10px] leading-tight text-tinta">{msg}</span> : <span className={`${valor} ${l.forte ? "text-navy" : "text-ouro-texto"}`}>{l.v(c)}</span>}
              </div>
            );
          })}
        </div>
      ))}
      <div className={GRADE + " py-1.5"}>
        <div aria-hidden="true" />
        {colunas.map((c) => (
          <div key={c.chave} className={`flex min-h-[3.2rem] flex-col items-center justify-center rounded-md px-1.5 py-1 text-center ${FUNDO[c.tipo]}`}>
            <div className="text-[11px] font-bold">{c.rodape.titulo}</div>
            <div className="text-[10px] text-tinta">{c.rodape.texto}</div>
          </div>
        ))}
      </div>
      {linhasBaixo.map((l) => (
        <div key={l.r} className={GRADE}>
          <div className={rotulo + " rounded-md bg-linha text-navy"}>{l.r}</div>
          {colunas.map((c) => (
            <div key={c.chave} className={celula}>
              <span className={`${valor} text-ouro-texto`}>{l.v(c)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// validade da proposta: não pode ser anterior a hoje; acima de 15 dias avisa, mas deixa
const LIMITE_VALIDADE_DIAS = 15;

// data de hoje no fuso do navegador (AAAA-MM-DD)
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate + "T00:00:00Z") - Date.parse(de + "T00:00:00Z")) / 86400000);

// números de destaque da coluna de parâmetros (crédito, parcela, meses): mesma fonte e tamanho
const GRANDE = "text-[28px] leading-none font-extrabold tracking-tight tabular-nums";

/** Bloco da coluna de parâmetros */
function Bloco({ titulo, children, id, junto, compacto }: { titulo: React.ReactNode; children: React.ReactNode; id?: string; junto?: boolean; compacto?: boolean }) {
  // junto = sem a linha e sem o espaço de baixo (o bloco seguinte "cola" neste); compacto = menos espaço entre os itens
  return (
    <div className={(compacto ? "flex flex-col gap-1 " : "flex flex-col gap-1.5 ") + (junto ? "-mb-1" : "border-b border-linha pb-4 last:border-b-0 last:pb-0")}>
      <h3 id={id} className="text-[10px] font-bold tracking-[0.1em] text-ouro-texto uppercase">
        {titulo}
      </h3>
      {children}
    </div>
  );
}

// campo "só com o risco embaixo" (como o Contemplação em)
const RISCO = "border-b-2 border-borda-campo bg-transparent text-right text-[13px] font-bold tabular-nums outline-none focus:border-laranja";

function Interruptor({ ligado, rotulo, aoAlternar }: { ligado: boolean; rotulo: string; aoAlternar: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={"relative h-5 w-9 shrink-0 rounded-full transition-colors " + (ligado ? "bg-ok" : "bg-[#cfcbe0]")}
    >
      <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (ligado ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

/** Linha de rótulo à esquerda e valor à direita; `interruptor` fica logo depois do rótulo. */
function Linha({ r, htmlFor, interruptor, children }: { r: string; htmlFor?: string; interruptor?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3 text-[13px]">
      <span className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-tinta">
          {r}
        </label>
        {interruptor}
      </span>
      {children}
    </div>
  );
}

function Par({ r, v, className = "" }: { r: string; v: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-tinta">{r}</span>
      <span className={"font-bold tabular-nums " + className}>{v}</span>
    </div>
  );
}

export function Simulador({ hoje, padroes }: { hoje: string; padroes: PadroesSimulador }) {
  const { grupo: g, cotas, meses, setMeses, faltam, taxaAdm, disponiveis } = useDados();
  const { creditoSel, tipoSel, setTipoSel, tipos, furo: furoGrupo, furoSim: furo, setFuroSim } = useSimulacao();
  const [vagas, setVagas] = useState("17");
  const [validade, setValidade] = useState(() => somarDias(hoje, 7));
  const [validadeAjustada, setValidadeAjustada] = useState(false); // uma data passada foi trocada por hoje
  const diasValidade = diasEntre(hojeLocal(), validade);
  const [inccLigado, setInccLigado] = useState(false); // padrão: desligado
  const [seguroLigado, setSeguroLigado] = useState(false); // padrão: desligado
  const [seguro, setSeguro] = useState(() => nf4.format(padroes.seguroPct)); // % do crédito ao mês, do parâmetro global
  const [incc, setIncc] = useState(() => nf2.format(padroes.incc));

  // parcela em que a fidelidade libera (36), e não o mês em que entra na sequência (37)
  const fidelidadeMeses = g.fidelidade_meses ? g.fidelidade_meses - 1 : null;
  const prazoGrupo = g.prazo_grupo_meses;
  const taxaMensal = taxaAdm !== null && faltam > 0 ? taxaAdm / faltam : null;

  const porTipo = new Map(g.modalidades.map((m) => [m.tipo as string, m]));
  // o lance livre também não pode passar dos meses que faltam para o grupo terminar
  const tetoQtd = (tipo: string) => {
    const max = porTipo.get(tipo)?.max_parcelas_lance ?? null;
    return tipo === "LIV" ? (max === null ? faltam : Math.min(max, faltam)) : max;
  };
  const limitar = (tipo: string, n: number) => {
    const teto = tetoQtd(tipo);
    return teto !== null && n > teto ? teto : n;
  };
  const [qtds, setQtds] = useState<Record<string, string>>(() => ({
    FIX: String(tetoQtd("FIX") ?? 0),
    LIM: String(tetoQtd("LIM") ?? 0),
    LIV: String(limitar("LIV", padroes.lanceLivreParcelas)),
    FID: String(limitar("FID", padroes.lanceFidelidadeParcelas)),
  }));
  const mudarQtd = (tipo: TipoColuna) => (v: string) => setQtds((q) => ({ ...q, [tipo]: v === "" ? "" : String(limitar(tipo, Number(v))) }));

  const tipo = tipos.find((t) => t.codigo === tipoSel);
  const mesesContemplacao = Number(meses) || 0;
  const creditoContratado = creditoSel === null ? null : creditoSel * cotas;
  const maxMeses = Math.max(1, faltam);

  const base =
    creditoContratado !== null && taxaAdm !== null && tipo
      ? calcularBase({ credito: creditoContratado, taxaAdmPct: taxaAdm, pctParcela: tipo.pct, prazoGrupo, mesesFaltam: faltam, furo, mesesContemplacao })
      : null;

  const colunas: Coluna[] = COLUNAS.map((c) => {
    const m = porTipo.get(c.tipo);
    const oferecido = c.tipo === "SOR" || Boolean(m);
    const bloqueio =
      c.tipo === "FID" && oferecido && fidelidadeMeses !== null && mesesContemplacao < fidelidadeMeses ? `Disponível a partir de ${fidelidadeMeses} meses` : null;
    const qtd = c.tipo === "SOR" ? null : qtds[c.tipo];
    const calc =
      !base || !oferecido || bloqueio
        ? null
        : c.tipo === "SOR"
          ? calcularColuna(base, creditoContratado as number, null)
          : calcularColuna(base, creditoContratado as number, { qtdParcelas: Number(qtd) || 0, regra: m as Modalidade });
    return {
      ...c,
      oferecido,
      bloqueio,
      qtd,
      qtdFixa: c.tipo === "FIX" || c.tipo === "LIM",
      // cadeado = o grupo limita as parcelas do lance (ex.: fidelidade até 99); martelo = leilão sem teto do grupo
      icone: m?.max_parcelas_lance != null ? ("cadeado" as const) : ("martelo" as const),
      teto: c.tipo === "SOR" ? null : tetoQtd(c.tipo),
      calc,
      prazoRestante: base?.prazoRestante ?? 0,
      concorrencia: c.tipo === "SOR" ? null : padroes.concorrencia[c.tipo],
      rodape: padroes.rodape[c.tipo],
    };
  });


  return (
    <section aria-label={`Simulador do grupo ${g.numero}`} className="grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside aria-label="Parâmetros da simulação" className="flex flex-col gap-4 rounded-2xl border border-borda bg-white p-4 lg:sticky lg:top-[7.5rem]">
        {/* crédito, cotas e tipo de parcela são escolhidos no cabeçalho do grupo */}
        <Bloco titulo="Crédito contratado" junto>
          <div className={GRANDE + " text-right text-ouro-texto"}>{creditoContratado === null ? "—" : reais2(creditoContratado)}</div>
          <span className="text-right text-[11px] text-tinta">
            {creditoSel === null ? "Escolha um crédito no cabeçalho" : `${cotas} ${cotas === 1 ? "cota" : "cotas"} × ${reais2(creditoSel)}`}
          </span>
        </Bloco>

        <Bloco titulo="Parcela antes da contemplação">
          <div className={GRANDE + " text-right text-ouro-texto"}>{base ? reais2(base.parcelaAntes) : "—"}</div>
          <span className="text-right text-[11px] text-tinta">
            {tipo ? `Parcela ${tipo.descricao}` : "Escolha o tipo de parcela no cabeçalho"}
            {furo ? " · com furo" : " · sem furo"}
          </span>
          <div className="pt-1">
            {/* verde = o grupo oferece; laranja = o escolhido nesta simulação; o título é a frase "Parcela … · com furo" logo acima */}
            <div role="group" aria-label="Tipo de parcela" className="flex gap-1">
              {[...tipos]
                .sort((a, b) => b.pct - a.pct)
                .map((t) => {
                  const possivel = disponiveis.has(t.codigo);
                  const marcado = possivel && t.codigo === tipoSel;
                  return (
                    <button
                      key={t.codigo}
                      type="button"
                      disabled={!possivel}
                      aria-pressed={marcado}
                      onClick={() => setTipoSel(t.codigo)}
                      title={possivel ? `${t.descricao}: simular com este tipo` : `${t.descricao}: não oferecido pelo grupo`}
                      className={
                        "h-6 min-w-0 flex-1 rounded-md border px-1 text-[12px] font-bold tabular-nums " +
                        (!possivel
                          ? "cursor-not-allowed border-borda bg-linha text-tinta/50"
                          : marcado
                            ? "border-laranja bg-laranja-claro text-navy"
                            : "border-[#b8dcc0] bg-ok-fundo text-ok hover:border-ok")
                      }
                    >
                      {t.pct}%
                    </button>
                  );
                })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[13px] text-tinta" id="furo-sim-rotulo">
              Pagamento com furo
            </span>
            <div role="group" aria-labelledby="furo-sim-rotulo" className="flex gap-1">
              {[true, false].map((opcao) => {
                const possivel = opcao ? furoGrupo : true; // sem furo no grupo, não libera o sim
                const marcado = furo === opcao;
                return (
                  <button
                    key={String(opcao)}
                    type="button"
                    disabled={!possivel}
                    aria-pressed={marcado}
                    onClick={() => setFuroSim(opcao)}
                    title={possivel ? (opcao ? "Simular com furo" : "Simular sem furo (não altera o grupo)") : "O grupo não tem pagamento com furo"}
                    className={
                      "h-6 min-w-11 rounded-md border px-2 text-[12px] font-bold " +
                      (!possivel
                        ? "cursor-not-allowed border-borda bg-linha text-tinta/50"
                        : marcado
                          ? "border-laranja bg-laranja-claro text-navy"
                          : "border-[#b8dcc0] bg-ok-fundo text-ok hover:border-ok")
                    }
                  >
                    {opcao ? "Sim" : "Não"}
                  </button>
                );
              })}
            </div>
          </div>
        </Bloco>

        {/* "Contemplação em" da proposta D: número grande, régua e atalhos */}
        <Bloco
          compacto
          titulo={
            <label htmlFor="meses-grupo" className="flex items-baseline gap-2">
              Contemplação em
            </label>
          }
        >
          <div className="flex items-baseline gap-2">
            <input
              id="meses-grupo"
              inputMode="numeric"
              value={meses}
              onChange={(e) => setMeses(e.target.value.replace(/\D/g, "").slice(0, 3))}
              className={"w-[3.5ch] border-b-2 border-borda-campo bg-transparent text-laranja outline-none focus:border-laranja " + GRANDE}
            />
            <span className="text-[15px] font-bold text-laranja">meses</span>
          </div>
          {/* fim, régua e atalhos colados uns nos outros */}
          <div className="flex flex-col">
            <div className="text-right text-[11px] leading-none font-semibold text-tinta tabular-nums">
              fim: {maxMeses} {maxMeses === 1 ? "mês" : "meses"}
            </div>
            <input
              type="range"
              min={1}
              max={maxMeses}
              value={Math.min(Math.max(1, mesesContemplacao), maxMeses)}
              onChange={(e) => setMeses(e.target.value)}
              aria-label="Contemplação em meses"
              aria-valuetext={`${mesesContemplacao} meses`}
              className="h-5 w-full cursor-pointer accent-[#ff751f]"
            />
            <div className="flex gap-1" role="group" aria-label="Atalhos de meses">
              {/* os 7 prazos vêm do parâmetro global (Parâmetros globais › Simulador) */}
              {padroes.contemplacaoPrazos.filter((m) => m <= maxMeses).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={Number(meses) === m && meses !== ""}
                  onClick={() => setMeses(String(m))}
                  className={
                    "h-6 flex-1 rounded-md text-[11px] font-bold tabular-nums " +
                    (Number(meses) === m && meses !== "" ? "border border-laranja bg-laranja-claro text-navy" : "border border-borda-campo hover:border-navy")
                  }
                >
                  {m === 1 ? "01" : m}
                </button>
              ))}
            </div>
          </div>
          {fidelidadeMeses !== null && mesesContemplacao < fidelidadeMeses && (
            <p className="text-[11px] text-tinta">Lance fidelidade só a partir de {fidelidadeMeses} meses.</p>
          )}
        </Bloco>

        <Bloco titulo="Informações complementares">
          <Par r="Fidelidade em" v={fidelidadeMeses ? `${fidelidadeMeses} meses` : "—"} />
          <Par r="Taxa de adm. mensal" v={taxaMensal === null ? "—" : p2(taxaMensal)} />
          <Par r="Parcela para lance" v={base ? reais2(base.parcelaLance) : "—"} />
        </Bloco>

        {/* mesmo desenho de Informações complementares: rótulo à esquerda, valor à direita; campos só com o risco embaixo */}
        <Bloco titulo="Proposta">
          <Linha r="Vagas" htmlFor="vagas-grupo">
            <input id="vagas-grupo" className={RISCO + " w-16 text-[#c62828]"} inputMode="numeric" value={vagas} onChange={(e) => setVagas(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </Linha>
          <Linha r="Validade" htmlFor="validade-grupo">
            <input
              id="validade-grupo"
              type="date"
              // o seletor de datas já não oferece dias anteriores a hoje (a data local só existe no navegador)
              min={hojeLocal()}
              suppressHydrationWarning
              aria-describedby="aviso-validade"
              className={RISCO + " w-[8.5rem] text-[#c62828]"}
              value={validade}
              onChange={(e) => {
                if (!e.target.value) return;
                setValidade(e.target.value);
                setValidadeAjustada(false);
              }}
              // ao sair do campo, uma data anterior a hoje volta para hoje
              onBlur={() => {
                const h = hojeLocal();
                if (validade < h) {
                  setValidade(h);
                  setValidadeAjustada(true);
                }
              }}
            />
          </Linha>
          <div id="aviso-validade" role="status" aria-live="polite" className="-mt-1 text-right text-[11px] leading-tight font-semibold">
            {diasValidade < 0 ? (
              <span className="text-[#9b1c1c]">Validade não pode ser anterior a hoje.</span>
            ) : validadeAjustada ? (
              <span className="text-alerta">Ajustada para hoje: a validade não pode ser anterior.</span>
            ) : diasValidade > LIMITE_VALIDADE_DIAS ? (
              <span className="text-alerta">Atenção: validade acima de {LIMITE_VALIDADE_DIAS} dias (daqui a {diasValidade}).</span>
            ) : null}
          </div>
          <Linha
            r="INCC"
            interruptor={<Interruptor ligado={inccLigado} rotulo="Considerar o INCC (desligado = 0%)" aoAlternar={() => setInccLigado((v) => !v)} />}
          >
            <span className="flex items-baseline gap-1">
              <input
                id="incc-grupo"
                aria-label="INCC (% ao ano)"
                className={RISCO + " w-16" + (inccLigado ? "" : " text-tinta/60")}
                inputMode="decimal"
                readOnly={!inccLigado}
                value={inccLigado ? incc : "0,00"}
                title="Vem de Parâmetros globais; aqui pode ser alterado só para esta simulação"
                onChange={(e) => setIncc(e.target.value.replace(/[^\d,]/g, "").slice(0, 6))}
                onBlur={() => {
                  const n = Number(incc.replace(",", "."));
                  setIncc(nf2.format(Number.isFinite(n) && incc !== "" ? n : padroes.incc));
                }}
              />
              <span className="font-bold">%</span>
            </span>
          </Linha>
          <Linha r="Seguro" interruptor={<Interruptor ligado={seguroLigado} rotulo="Considerar o seguro (desligado = 0%)" aoAlternar={() => setSeguroLigado((v) => !v)} />}>
            <span className="flex items-baseline gap-1">
              <input
                id="seguro-grupo"
                aria-label="Seguro (% do crédito ao mês)"
                className={RISCO + " w-[4.5rem]" + (seguroLigado ? "" : " text-tinta/60")}
                inputMode="decimal"
                readOnly={!seguroLigado}
                value={seguroLigado ? seguro : "0,0000"}
                title="Vem de Parâmetros globais (% do crédito ao mês); aqui pode ser alterado só para esta simulação"
                onChange={(e) => setSeguro(e.target.value.replace(/[^\d,]/g, "").slice(0, 7))}
                onBlur={() => {
                  const n = Number(seguro.replace(",", "."));
                  setSeguro(nf4.format(Number.isFinite(n) && seguro !== "" ? n : padroes.seguroPct));
                }}
              />
              <span className="font-bold">%</span>
            </span>
          </Linha>
        </Bloco>
      </aside>

      <div className="min-w-0 overflow-x-auto pb-2">
        <Grade colunas={colunas} aoMudarQtd={mudarQtd} />
      </div>
    </section>
  );
}
