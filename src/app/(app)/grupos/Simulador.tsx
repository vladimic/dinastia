"use client";

import { useState } from "react";
import type { Modalidade } from "@/lib/grupos";
import { calcularBase, calcularColuna, type Coluna as Calc, type PadroesSimulador, type TipoColuna } from "@/lib/simulacao";
import { useSimulacao } from "./SimulacaoContext";
import { reais0, useDados } from "./GrupoDetalhe";

// Simulador do grupo: os cálculos vêm de src/lib/simulacao.ts, com os parâmetros numa coluna à esquerda
// e a grade de resultados à direita.

const p1 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
const dinheiro = (v: number | null | undefined) => (v === null || v === undefined ? "—" : reais0(v));
const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf4 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

type Cor = "navy" | "ouro" | "laranja" | "livre";
type Meta = { chave: string; tipo: TipoColuna; titulo: string; numero?: number; icone?: "cadeado" | "martelo"; cor: Cor };

const COLUNAS: Meta[] = [
  { chave: "sorteio", tipo: "SOR", titulo: "Sorteio", cor: "navy" },
  { chave: "fixo", tipo: "FIX", titulo: "Lance Fixo", numero: 1, icone: "cadeado", cor: "navy" },
  { chave: "limitado", tipo: "LIM", titulo: "Lance Limitado", numero: 2, icone: "cadeado", cor: "ouro" },
  { chave: "livre", tipo: "LIV", titulo: "Lance Livre", numero: 3, icone: "martelo", cor: "livre" },
  { chave: "fidelidade", tipo: "FID", titulo: "Lance Fidelidade", numero: 4, icone: "martelo", cor: "laranja" },
];

// cor de cada coluna só na borda de cima e em fundos claros: o corpo da página fica claro, distinto do menu azul
const BORDA: Record<Cor, string> = { navy: "border-t-navy", ouro: "border-t-ouro", laranja: "border-t-laranja", livre: "border-t-tinta" };
const FUNDO: Record<Cor, string> = { navy: "bg-lavanda", ouro: "bg-ouro-claro", laranja: "bg-laranja-claro", livre: "bg-[#efedf5]" };

type Coluna = Meta & {
  oferecido: boolean;
  bloqueio: string | null;
  qtd: string | null;
  qtdFixa: boolean;
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

function Cabecalho({ c, aoMudarQtd }: { c: Coluna; aoMudarQtd: (v: string) => void }) {
  return (
    <div className={`flex min-h-[7rem] flex-col gap-1.5 rounded-t-lg border-t-4 px-2.5 py-2 ${BORDA[c.cor]} ${FUNDO[c.cor]}`}>
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
            <label className="flex items-center gap-1 text-[11px] font-semibold text-tinta" title={c.qtdFixa ? "Parcelas do lance definidas pelo grupo" : "Parcelas do lance (editável nesta simulação)"}>
              <input
                inputMode="numeric"
                readOnly={c.qtdFixa}
                value={c.qtd}
                aria-label={`Parcelas do ${c.titulo}`}
                onChange={(e) => aoMudarQtd(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className={"h-6 w-11 rounded border border-borda-campo px-1 text-right text-[12px] font-bold tabular-nums text-navy outline-none focus:border-laranja " + (c.qtdFixa ? "bg-linha" : "bg-white")}
              />
              parcelas
            </label>
          )}
          <div className="text-[10px] font-bold text-tinta">
            <div className="flex justify-between">
              <span>Concorrência</span>
              <span className="tabular-nums">{c.concorrencia === null ? "—" : `${c.concorrencia.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white" role="img" aria-label={`Concorrência ${c.concorrencia ?? 0}%`}>
              <div className="h-full bg-ouro" style={{ width: `${Math.min(100, (c.concorrencia ?? 0) * 3)}%` }} />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 text-[10px] font-bold whitespace-nowrap text-tinta">
            {c.calc ? p1(c.calc.proprioPct) : "—"} {c.icone === "cadeado" ? <Cadeado /> : <Martelo />} próprio
          </div>
        </>
      )}
    </div>
  );
}

function Grade({ colunas, aoMudarQtd }: { colunas: Coluna[]; aoMudarQtd: (t: TipoColuna) => (v: string) => void }) {
  const rotulo = "flex items-center px-2 text-[12px] leading-tight font-bold text-tinta";
  const celula = "flex min-h-[2.5rem] flex-col items-center justify-center border-b border-linha px-1 text-center";
  const valor = "text-[15px] leading-tight font-bold tabular-nums";
  const aviso = (c: Coluna) => c.bloqueio ?? (c.oferecido ? null : "Grupo não oferece");
  const linhasCima: { r: string; v: (c: Coluna) => string; avisar?: boolean; forte?: boolean }[] = [
    { r: "Recurso da Carta (embutido)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoCarta) : "—"), avisar: true },
    { r: "Recurso Próprio (dinheiro)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoProprio) : "—") },
    { r: "Crédito Disponível após a Contemplação", v: (c) => dinheiro(c.calc?.creditoDisponivel), forte: true },
    { r: "Valor da Parcela após a Contemplação", v: (c) => dinheiro(c.calc?.parcelaApos), forte: true },
    { r: "Prazo Restante", v: (c) => (c.calc && c.prazoRestante > 0 ? String(c.prazoRestante) : "—") },
  ];
  const linhasBaixo: { r: string; v: (c: Coluna) => string }[] = [
    { r: "Saldo Devedor", v: (c) => dinheiro(c.calc?.saldoDevedor) },
    { r: "Valor Investido", v: (c) => dinheiro(c.calc?.valorInvestido) },
    { r: "Custo Mensal", v: (c) => (c.calc?.custoMensal == null ? "—" : p2(c.calc.custoMensal * 100)) },
    { r: "Custo Anual", v: (c) => (c.calc?.custoAnual == null ? "—" : p2(c.calc.custoAnual * 100)) },
    { r: "Dinheiro Novo", v: (c) => dinheiro(c.calc?.dinheiroNovo) },
  ];

  return (
    <div className="min-w-[46rem] rounded-2xl border border-borda bg-white p-2">
      <div className={GRADE}>
        <div aria-hidden="true" />
        {colunas.map((c) => (
          <Cabecalho key={c.chave} c={c} aoMudarQtd={aoMudarQtd(c.tipo)} />
        ))}
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
          <div key={c.chave} className={`flex min-h-[3.2rem] flex-col items-center justify-center rounded-md px-1.5 py-1 text-center ${FUNDO[c.cor]}`}>
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
  const { grupo: g, cotas, meses, setMeses, faltam, taxaAdm } = useDados();
  const { creditoSel, tipoSel, tipos, furo } = useSimulacao();
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
  const tetoQtd = (tipo: string) => porTipo.get(tipo)?.max_parcelas_lance ?? null;
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
          <div className={GRANDE + " text-right text-ouro-texto"}>{creditoContratado === null ? "—" : reais0(creditoContratado)}</div>
          <span className="text-right text-[11px] text-tinta">
            {creditoSel === null ? "Escolha um crédito no cabeçalho" : `${cotas} ${cotas === 1 ? "cota" : "cotas"} × ${reais0(creditoSel)}`}
          </span>
        </Bloco>

        <Bloco titulo="Parcela antes da contemplação">
          <div className={GRANDE + " text-right text-ouro-texto"}>{base ? reais0(base.parcelaAntes) : "—"}</div>
          <span className="text-right text-[11px] text-tinta">
            {tipo ? `Parcela ${tipo.descricao}` : "Escolha o tipo de parcela no cabeçalho"}
            {furo ? " · com furo" : " · sem furo"}
          </span>
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
          <Par r="Parcela para lance" v={base ? reais0(base.parcelaLance) : "—"} />
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
