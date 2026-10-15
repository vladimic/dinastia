"use client";

import { useRef, useState } from "react";
import { dataBR, reais } from "@/lib/formato";
import { useSimulacao } from "./SimulacaoContext";

// Simulador do grupo. Já calculado (conforme as regras combinadas): parcela para lance, parcela antes da contemplação,
// e, em cada coluna, recurso da carta, recurso próprio, crédito disponível, valor da parcela após e prazo restante.
// Tudo que ainda é número de exemplo leva a bolinha amarela (<Fic />) e só será calculado quando as regras forem definidas.

import type { Modalidade } from "@/lib/grupos";
import { calcularBase, calcularLance, type Lance } from "@/lib/simulacao";

const brl0 = (v: number) => reais(v).replace(",00", "");
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

type Meta = {
  chave: string;
  tipo: "SOR" | "FIX" | "LIM" | "LIV" | "FID";
  titulo: string[];
  numero?: number; // posição do lance (o sorteio não tem)
  concorrencia?: number; // (fictício) % de concorrência
  proprioPct?: number; // (fictício) % de recurso próprio no lance
  icone?: "cadeado" | "martelo";
  rodape: { titulo: string; texto: string; cor: "navy" | "ouro" | "laranja" | "livre" };
  // números de exemplo, ainda não calculados
  saldoDevedor: number;
  custoMensal: number;
  custoAnual: number;
  dinheiroNovo: number;
};

const CREDITO_BASE = 140000; // os exemplos abaixo foram montados sobre este crédito (só escalam com o crédito escolhido)

const COLUNAS: Meta[] = [
  {
    chave: "sorteio",
    tipo: "SOR",
    titulo: ["Sorteio"],
    rodape: { titulo: "Sem lance", texto: "Depende só da sorte", cor: "navy" },
    saldoDevedor: 173092,
    custoMensal: 0.21,
    custoAnual: 2.51,
    dinheiroNovo: 140000,
  },
  {
    chave: "fixo",
    tipo: "FIX",
    titulo: ["Lance", "Fixo"],
    numero: 1,
    concorrencia: 25,
    proprioPct: 0,
    icone: "cadeado",
    rodape: { titulo: "Previsibilidade máxima", texto: "Valor de lance pré-definido", cor: "navy" },
    saldoDevedor: 138212,
    custoMensal: 0.27,
    custoAnual: 3.28,
    dinheiroNovo: 104430,
  },
  {
    chave: "limitado",
    tipo: "LIM",
    titulo: ["Lance", "Limitado"],
    numero: 2,
    concorrencia: 10,
    proprioPct: 25,
    icone: "cadeado",
    rodape: { titulo: "Equilíbrio e flexibilidade", texto: "Combina crédito + recurso próprio", cor: "ouro" },
    saldoDevedor: 103550,
    custoMensal: 0.39,
    custoAnual: 4.78,
    dinheiroNovo: 69654,
  },
  {
    chave: "livre",
    tipo: "LIV",
    titulo: ["Lance", "Livre"],
    numero: 3,
    concorrencia: 8,
    proprioPct: 35,
    icone: "martelo",
    rodape: { titulo: "Valor à sua escolha", texto: "Você define o lance, sem teto fixo", cor: "livre" },
    saldoDevedor: 96800,
    custoMensal: 0.46,
    custoAnual: 5.66,
    dinheiroNovo: 52500,
  },
  {
    chave: "fidelidade",
    tipo: "FID",
    titulo: ["Lance", "Fidelidade"],
    numero: 4,
    concorrencia: 3,
    proprioPct: 42,
    icone: "martelo",
    rodape: { titulo: "Maior poder de contemplação", texto: "Funciona como leilão", cor: "laranja" },
    saldoDevedor: 54500,
    custoMensal: 1.1,
    custoAnual: 14.01,
    dinheiroNovo: 20651,
  },
];

/** Coluna pronta para desenhar: números calculados + exemplos (marcados com a bolinha) */
type Coluna = Meta & {
  oferecido: boolean; // o grupo tem essa modalidade
  qtd: string | null; // parcelas do lance (texto do campo); nulo no sorteio
  qtdFixa: boolean; // valor definido pelo grupo, não editável
  lance: Lance | null;
  parcelaApos: number | null;
  prazoRestante: number;
  creditoDisponivel: number | null;
};

/** Bolinha amarela: valor ainda não calculado (número de exemplo) */
function Fic({ className = "" }: { className?: string }) {
  return (
    <i
      aria-label="Ainda não calculado"
      title="Ainda não calculado (valor de exemplo)"
      className={"inline-block h-2 w-2 shrink-0 rounded-full bg-[#f5c400] ring-1 ring-[#b38f00] " + className}
    />
  );
}

const COR_RODAPE: Record<Coluna["rodape"]["cor"], string> = {
  navy: "bg-navy text-[#e9e6f5]",
  ouro: "bg-ouro text-navy",
  laranja: "bg-laranja text-navy",
  livre: "bg-[#5b5680] text-white",
};

function Cadeado() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Valor fixo">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
function Martelo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Disputado como leilão">
      <path d="M14 4l6 6-3 3-6-6zM11 7L4 14l3 3 7-7M3 21h10" />
    </svg>
  );
}

const rotulo = "text-[11px] font-bold leading-tight text-navy";
const valorOuro = "font-bold tabular-nums text-ouro";

function CelulaColuna({ c, fator, aoMudarQtd }: { c: Coluna; fator: number; aoMudarQtd: (v: string) => void }) {
  const borda = "border border-borda-campo bg-white";
  const ex = (v: number) => Math.round(v * fator); // exemplo escalado pelo crédito
  const pctCarta = c.lance ? Math.round(c.lance.fracaoCarta * 100) : 0;
  return (
    <div className="col-span-1 row-span-8 grid grid-rows-subgrid">
      {/* 1 · cabeçalho */}
      <div className="flex min-h-[78px] overflow-hidden bg-[#d9d9d9] text-navy">
        {c.numero ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border-2 border-navy text-xs font-extrabold leading-none">
                  {c.numero}
                </span>
                <span className="text-sm leading-[1.1] font-extrabold">
                  {c.titulo[0]}
                  <br />
                  {c.titulo[1]}
                </span>
              </div>
              {c.oferecido && c.qtd !== null && (
                <label className="flex items-center gap-1 text-[10px] font-semibold" title={c.qtdFixa ? "Parcelas do lance definidas pelo grupo" : "Parcelas do lance (editável)"}>
                  <input
                    inputMode="numeric"
                    readOnly={c.qtdFixa}
                    value={c.qtd}
                    aria-label={`Parcelas do lance ${c.titulo.join(" ")}`}
                    onChange={(e) => aoMudarQtd(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className={"h-[18px] w-9 rounded border border-borda-campo px-1 text-right text-[11px] font-bold tabular-nums outline-none focus:border-laranja " + (c.qtdFixa ? "bg-linha" : "bg-white")}
                  />
                  parcelas
                </label>
              )}
            </div>
            <div className="relative flex w-[47%] shrink-0 flex-col bg-navy">
              <div className="whitespace-nowrap px-1.5 pt-1 text-[10px] font-bold text-white">Concorrência {c.concorrencia}%</div>
              <Fic className="absolute top-[3px] right-[3px]" />
              <div className="mx-1.5 mt-0.5 h-[18px] bg-white" role="img" aria-label={`Concorrência ${c.concorrencia}%`}>
                <div className="h-full bg-ouro" style={{ width: `${Math.min(100, (c.concorrencia ?? 0) * 3)}%` }} />
              </div>
              <div className="mt-auto flex items-center justify-end gap-1 whitespace-nowrap bg-[#d9d9d9] px-1.5 py-0.5 text-[10.5px] font-bold">
                <Fic /> {c.proprioPct}% {c.icone === "cadeado" ? <Cadeado /> : <Martelo />} Próprio
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center bg-navy px-4">
            <span className="font-display text-[26px] leading-none font-bold text-ouro">{c.titulo[0]}</span>
            <span className="self-end text-[11px] font-semibold text-ouro">Sem lance</span>
          </div>
        )}
      </div>

      {/* 2 · recursos */}
      <div className={`${borda} grid grid-cols-2 items-start px-1 py-1.5 text-center`}>
        {c.lance ? (
          <>
            <div>
              <div className={rotulo}>Recurso da Carta</div>
              <div className="text-[9px] text-tinta">(embutido {pctCarta}%)</div>
              <div className={valorOuro}>{brl0(c.lance.recursoCarta)}</div>
            </div>
            <div>
              <div className={rotulo}>Recurso Próprio</div>
              <div className="text-[9px] text-tinta">(dinheiro {100 - pctCarta}%)</div>
              <div className={valorOuro}>{brl0(c.lance.recursoProprio)}</div>
            </div>
          </>
        ) : (
          <div className="col-span-2 self-center text-xs text-tinta">{c.tipo === "SOR" ? "—" : "Grupo não oferece"}</div>
        )}
      </div>

      {/* 3 · crédito, 4 · parcela, 5 · prazo */}
      <Metrica rotulo="Crédito Disponível após a Contemplação" valor={c.creditoDisponivel === null ? "—" : brl0(c.creditoDisponivel)} />
      <Metrica rotulo="Valor da Parcela após a Contemplação" valor={c.parcelaApos === null || !c.oferecido ? "—" : brl0(c.parcelaApos)} />
      <Metrica rotulo="Prazo Restante" valor={c.prazoRestante > 0 && c.oferecido ? String(c.prazoRestante) : "—"} />

      {/* 6 · rodapé de perfil */}
      <div className={`flex flex-col items-center justify-center px-2 py-1 text-center ${COR_RODAPE[c.rodape.cor]}`}>
        <div className="text-[11px] font-bold">{c.rodape.titulo}</div>
        <div className="text-[10px] opacity-90">{c.rodape.texto}</div>
      </div>

      {/* 7 · espaço · 8 · custos (ainda de exemplo) */}
      <div aria-hidden="true" />
      <div className="bg-navy px-2.5 py-1.5 text-xs text-white">
        <Linha t="Saldo Devedor" v={brl0(ex(c.saldoDevedor)).replace("R$ ", "")} />
        <Linha t="Valor Investido" v="" />
        <Linha t="Custo Mensal" v={p2(c.custoMensal)} />
        <Linha t="Custo Anual" v={p2(c.custoAnual)} />
        <Linha t="Dinheiro Novo" v={brl0(ex(c.dinheiroNovo)).replace("R$ ", "")} />
      </div>
    </div>
  );
}

function Linha({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-px">
      <span className="flex items-center gap-1.5 font-semibold text-ouro">
        <Fic /> {t}
      </span>
      <span className="tabular-nums text-ouro">{v}</span>
    </div>
  );
}

function Metrica({ rotulo: r, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-borda-campo bg-white px-2 py-1.5 text-center">
      <div className={rotulo}>{r}</div>
      <div className={`text-[19px] leading-tight ${valorOuro}`}>{valor}</div>
    </div>
  );
}

const caixaParam = "flex w-[8.5rem] flex-col gap-0.5 rounded-lg border border-borda-campo bg-white px-3 py-1.5";
const tituloParam = "text-[10px] font-semibold tracking-wide text-tinta uppercase";
const campoParam = "w-full min-w-0 bg-transparent text-[13px] font-bold tabular-nums outline-none focus:text-laranja";
const PRE_DEFINIDOS = [12, 24, 36, 48, 60];

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function ParametroTexto({ t, v }: { t: string; v: string }) {
  return (
    <div className={caixaParam}>
      <span className={tituloParam}>{t}</span>
      <span className="text-[13px] font-bold tabular-nums">{v}</span>
    </div>
  );
}

export function SimuladorGrupo({
  numero,
  hoje,
  padroes,
  fidelidadeMeses,
  mesesFaltam,
  mesesDecorridos,
  taxaAdm,
  prazoGrupo,
  modalidades,
}: {
  numero: number;
  hoje: string;
  /** valores iniciais vindos de Parâmetros globais (podem ser alterados nesta tela) */
  padroes: { incc: number; contemplacaoMeses: number };
  /** parcela em que a fidelidade libera (36), e não o mês em que entra na sequência (37) */
  fidelidadeMeses: number | null;
  /** meses que faltam para terminar o plano = assembleias que ainda faltam no grupo */
  mesesFaltam: number;
  /** meses decorridos = assembleias realizadas */
  mesesDecorridos: number;
  /** taxa de administração total do grupo (%) */
  taxaAdm: number | null;
  /** prazo original do grupo, em meses */
  prazoGrupo: number;
  modalidades: Modalidade[];
}) {
  const { creditoSel, tipoSel, tipos, furo } = useSimulacao();
  const taxaMensal = taxaAdm !== null && mesesFaltam > 0 ? taxaAdm / mesesFaltam : null;
  const [meses, setMeses] = useState(String(padroes.contemplacaoMeses));
  const [vagas, setVagas] = useState("17");
  const validadeRef = useRef<HTMLInputElement>(null);
  const [validade, setValidade] = useState(() => somarDias(hoje, 7));
  const [inccLigado, setInccLigado] = useState(true);
  const [incc, setIncc] = useState(() => padroes.incc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  const porTipo = new Map(modalidades.map((m) => [m.tipo as string, m]));
  const tetoQtd = (tipo: string) => porTipo.get(tipo)?.max_parcelas_lance ?? null; // sem teto = livre
  const qtdFix = porTipo.get("FIX")?.max_parcelas_lance ?? 0;
  // parcelas do lance de cada modalidade: o teto do grupo; no Livre (sem teto) começa igual ao Fixo; editável, menos no Fixo
  const [qtds, setQtds] = useState<Record<string, string>>(() => ({
    FIX: String(qtdFix),
    LIM: String(tetoQtd("LIM") ?? 0),
    LIV: String(tetoQtd("LIV") ?? qtdFix),
    FID: String(tetoQtd("FID") ?? 0),
  }));
  const mudarQtd = (tipo: string) => (v: string) => {
    const teto = tetoQtd(tipo);
    setQtds((q) => ({ ...q, [tipo]: teto !== null && Number(v) > teto ? String(teto) : v }));
  };

  const credito = creditoSel ?? CREDITO_BASE;
  const fator = credito / CREDITO_BASE;
  const tipo = tipos.find((t) => t.codigo === tipoSel);
  const mesesContemplacao = Number(meses) || 0;

  // cálculos (precisam do crédito, da taxa de administração e do tipo de parcela)
  const base =
    creditoSel !== null && taxaAdm !== null && tipo
      ? calcularBase({ credito: creditoSel, taxaAdmPct: taxaAdm, pctParcela: tipo.pct, prazoGrupo, mesesFaltam, furo, mesesContemplacao })
      : null;

  const colunas: Coluna[] = COLUNAS.map((c) => {
    const m = porTipo.get(c.tipo);
    const oferecido = c.tipo === "SOR" || Boolean(m);
    const qtd = c.tipo === "SOR" ? null : qtds[c.tipo];
    const lance: Lance | null =
      base && m && c.tipo !== "SOR" ? calcularLance(base, creditoSel as number, Number(qtd) || 0, m) : null;
    return {
      ...c,
      oferecido,
      qtd,
      qtdFixa: c.tipo === "FIX",
      lance,
      parcelaApos: base?.parcelaApos ?? null,
      prazoRestante: base?.prazoRestante ?? 0,
      creditoDisponivel: !base ? null : c.tipo === "SOR" ? creditoSel : lance ? lance.creditoDisponivel : null,
    };
  });

  return (
    <section className="flex flex-col gap-3 border-t border-borda pt-4" aria-label={`Simulador do grupo ${numero}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">Simulador · Grupo {numero}</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-laranja-claro px-2.5 py-0.5 text-[11px] font-bold text-alerta">
          <Fic /> Valor ainda não calculado (exemplo)
        </span>
      </div>

      {/* parâmetros da simulação (antes ficavam sob a 1ª coluna) */}
      <div className="flex flex-wrap gap-2">
        <div className={caixaParam}>
          <span className={tituloParam}>Contemplação em</span>
          <div className="flex items-baseline gap-1">
            <input
              className={campoParam + " w-8 border-b border-borda-campo text-right"}
              inputMode="numeric"
              aria-label="Contemplação em meses"
              value={meses}
              onChange={(e) => setMeses(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
            <span className="text-[11px] text-tinta">meses</span>
          </div>
          <div className="flex gap-0.5">
            {PRE_DEFINIDOS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={meses === String(m)}
                onClick={() => setMeses(String(m))}
                className={"h-[18px] flex-1 rounded text-[10px] leading-none font-bold " + (meses === String(m) ? "bg-navy text-white" : "border border-borda-campo hover:border-navy")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className={caixaParam}>
          <span className={tituloParam + " leading-tight"}>
            Parcela antes da
            <br />
            contemplação
          </span>
          <span className="text-[13px] font-bold tabular-nums">{tipo?.descricao ?? "—"}</span>
        </div>
        <div className={caixaParam}>
          <span className={tituloParam + " leading-tight"}>
            Parcela para
            <br />
            lance
          </span>
          <span className="text-[13px] font-bold tabular-nums" title="(crédito + taxa de administração) ÷ prazo original do grupo">
            {base ? reais(base.parcelaLance) : "—"}
          </span>
        </div>
        <ParametroTexto t="Fidelidade em" v={fidelidadeMeses ? `${fidelidadeMeses} Meses` : "—"} />
        <label className={caixaParam}>
          <span className={tituloParam}>Vagas</span>
          <input
            className={campoParam + " text-[#c62828]"}
            inputMode="numeric"
            value={vagas}
            onChange={(e) => setVagas(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>
        <div className={caixaParam + " relative"}>
          <div className="flex items-center gap-1.5">
            <span className={tituloParam}>Validade</span>
            <button
              type="button"
              aria-label="Trocar a data de validade"
              title="Trocar a data"
              onClick={() => validadeRef.current?.showPicker?.()}
              className="text-tinta hover:text-navy"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
            </button>
          </div>
          <span className="text-[13px] font-bold tabular-nums text-[#c62828]">{dataBR(validade)}</span>
          {/* seletor de data nativo, escondido: abre pelo botão do calendário */}
          <input
            ref={validadeRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            value={validade}
            onChange={(e) => e.target.value && setValidade(e.target.value)}
          />
        </div>
        <div className={caixaParam}>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="incc-sim" className={tituloParam}>
              INCC
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={inccLigado}
              aria-label="Considerar o INCC (desligado = 0%)"
              title={inccLigado ? "Ligado: considera o INCC informado" : "Desligado: assume 0%"}
              onClick={() => setInccLigado((v) => !v)}
              className={"relative h-4 w-7 shrink-0 rounded-full transition-colors " + (inccLigado ? "bg-ok" : "bg-[#cfcbe0]")}
            >
              <span className={"absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all " + (inccLigado ? "left-[14px]" : "left-0.5")} />
            </button>
          </div>
          <div className="flex items-baseline gap-0.5 text-[13px] font-bold">
            <input
              id="incc-sim"
              className={campoParam + " text-right" + (inccLigado ? "" : " text-tinta/60")}
              inputMode="decimal"
              readOnly={!inccLigado}
              value={inccLigado ? incc : "0,00"}
              title="Vem de Parâmetros globais; aqui pode ser alterado só para esta simulação"
              onChange={(e) => setIncc(e.target.value.replace(/[^\d,]/g, "").slice(0, 6))}
              onBlur={() => {
                const n = Number(incc.replace(",", "."));
                const v = Number.isFinite(n) && incc !== "" ? n : padroes.incc;
                setIncc(v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              }}
            />
            <span aria-hidden="true" className={inccLigado ? "" : "text-tinta/60"}>%</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1200px] grid-cols-[240px_repeat(5,minmax(176px,1fr))] gap-x-2 gap-y-1.5">
          {/* cartão do contrato */}
          <div className="col-span-1 row-span-6 grid grid-rows-subgrid">
            <div className="flex items-center justify-center bg-[#d9d9d9] px-3 text-center">
              <span className="font-display text-[26px] leading-tight font-bold">Crédito Imobiliário</span>
            </div>
            <div className="row-span-2 flex flex-col items-center justify-center gap-0.5 border border-borda-campo bg-white px-3 text-center">
              <span className="text-[15px] font-extrabold">Valor Contratado</span>
              <span className={`text-[28px] leading-tight ${valorOuro}`}>{creditoSel === null ? "—" : brl0(creditoSel)}</span>
              <span className="mt-1 text-[15px] leading-tight font-extrabold">Parcela antes da Contemplação</span>
              <span className={`text-base ${valorOuro}`}>{base ? brl0(base.parcelaAntes) : "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Mini t="Meses para Terminar o Plano" v={String(mesesFaltam)} />
              <Mini t="Meses Decorridos" v={String(mesesDecorridos).padStart(2, "0")} />
            </div>
            <div className="flex flex-col items-center justify-center border border-borda-campo bg-white px-2 text-center">
              <span className="text-[13px] font-extrabold">Taxa de administração mensal</span>
              <span className="text-base font-extrabold tabular-nums">{taxaMensal === null ? "—" : p2(taxaMensal)}</span>
            </div>
            <div aria-hidden="true" />
          </div>

          {colunas.map((c) => (
            <CelulaColuna key={c.chave} c={c} fator={fator} aoMudarQtd={mudarQtd(c.tipo)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Mini({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-borda-campo bg-white px-1 py-1 text-center">
      <span className="text-[12px] leading-tight font-extrabold">{t}</span>
      <span className={`text-[17px] ${valorOuro}`}>{v}</span>
    </div>
  );
}
