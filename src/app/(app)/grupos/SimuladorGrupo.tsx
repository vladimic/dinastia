"use client";

import { useRef, useState } from "react";
import { dataBR } from "@/lib/formato";
import { useSimulacao } from "./SimulacaoContext";

// Simulador do grupo. Só o "% Próprio" do cabeçalho de cada lance ainda é número de exemplo (leva a bolinha amarela, <Fic />).
// Todo valor em R$ é arredondado para cima, sem casas decimais; os cálculos em si usam os valores exatos (src/lib/simulacao.ts).

import type { Modalidade } from "@/lib/grupos";
import { calcularBase, calcularColuna, type Coluna as Calc, type PadroesSimulador, type TipoColuna } from "@/lib/simulacao";

const nf0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, minimumFractionDigits: 0 });
/** R$ arredondado para cima, sem centavos (as contas de ponto flutuante são limpas antes: 34720,00000001 continua 34.720) */
const brl0 = (v: number) => nf0.format(Math.ceil(Number(v.toFixed(4))));
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

type Meta = {
  chave: string;
  tipo: TipoColuna;
  titulo: string[];
  numero?: number; // posição do lance (o sorteio não tem)
  proprioPct?: number; // (exemplo) % de recurso próprio no lance
  icone?: "cadeado" | "martelo";
  cor: "navy" | "ouro" | "laranja" | "livre";
};

const COLUNAS: Meta[] = [
  { chave: "sorteio", tipo: "SOR", titulo: ["Sorteio"], cor: "navy" },
  { chave: "fixo", tipo: "FIX", titulo: ["Lance", "Fixo"], numero: 1, proprioPct: 0, icone: "cadeado", cor: "navy" },
  { chave: "limitado", tipo: "LIM", titulo: ["Lance", "Limitado"], numero: 2, proprioPct: 25, icone: "cadeado", cor: "ouro" },
  { chave: "livre", tipo: "LIV", titulo: ["Lance", "Livre"], numero: 3, proprioPct: 35, icone: "martelo", cor: "livre" },
  { chave: "fidelidade", tipo: "FID", titulo: ["Lance", "Fidelidade"], numero: 4, proprioPct: 42, icone: "martelo", cor: "laranja" },
];

/** Coluna pronta para desenhar */
type Coluna = Meta & {
  oferecido: boolean; // o grupo tem essa modalidade
  bloqueio: string | null; // motivo de a coluna não poder ser simulada (ex.: fidelidade ainda não liberada)
  qtd: string | null; // parcelas do lance (texto do campo); nulo no sorteio
  qtdFixa: boolean; // valor definido pelo grupo, não editável
  calc: Calc | null;
  prazoRestante: number;
  concorrencia: number | null;
  rodape: { titulo: string; texto: string };
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

const COR_RODAPE: Record<Meta["cor"], string> = {
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

const valorOuro = "font-bold tabular-nums text-ouro";

const GRADE = "grid grid-cols-[10rem_repeat(5,minmax(0,1fr))] gap-x-2";
const dinheiro = (v: number | null | undefined) => (v === null || v === undefined ? "—" : brl0(v));

/** Cabeçalho de uma coluna (título, parcelas do lance, concorrência e % próprio), empilhado para caber em coluna estreita */
function CabecalhoColuna({ c, aoMudarQtd }: { c: Coluna; aoMudarQtd: (v: string) => void }) {
  const conc = c.concorrencia;
  if (!c.numero) {
    return (
      <div className="flex min-h-[6.25rem] flex-col justify-center bg-navy px-3">
        <span className="font-display text-[24px] leading-none font-bold text-ouro">{c.titulo[0]}</span>
        <span className="self-end text-[11px] font-semibold text-ouro">Sem lance</span>
      </div>
    );
  }
  return (
    <div className="flex min-h-[6.25rem] flex-col overflow-hidden text-navy">
      <div className="flex flex-1 flex-col justify-center gap-1 bg-[#d9d9d9] px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded border-2 border-navy text-[11px] font-extrabold leading-none">
            {c.numero}
          </span>
          <span className="text-[12px] leading-[1.1] font-extrabold">
            {c.titulo[0]}
            <br />
            {c.titulo[1]}
          </span>
        </div>
        {c.oferecido && c.qtd !== null && (
          <label className="flex items-center gap-1 text-[10px] font-semibold" title={c.qtdFixa ? "Parcelas do lance definidas pelo grupo" : "Parcelas do lance (editável nesta simulação)"}>
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
      <div className="bg-navy px-1.5 py-1">
        <div className="flex items-center justify-between text-[9px] font-bold whitespace-nowrap text-white">
          <span>Concorrência</span>
          <span className="tabular-nums">{conc === null ? "—" : `${conc.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</span>
        </div>
        <div className="mt-0.5 h-[7px] bg-white" role="img" aria-label={`Concorrência ${conc ?? 0}%`}>
          <div className="h-full bg-ouro" style={{ width: `${Math.min(100, (conc ?? 0) * 3)}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 bg-[#d9d9d9] px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
        <Fic /> {c.proprioPct}% {c.icone === "cadeado" ? <Cadeado /> : <Martelo />} Próprio
      </div>
    </div>
  );
}

// Rótulos só na 1ª coluna; as colunas trazem apenas os valores (sem repetir os nomes).
function GradeSimulador({ colunas, aoMudarQtd }: { colunas: Coluna[]; aoMudarQtd: (tipo: TipoColuna) => (v: string) => void }) {
  const rotuloLinha = "flex items-center rounded-md border border-borda-campo bg-white px-2 text-[11px] leading-tight font-bold text-navy";
  const rotuloLinhaEscuro = "flex items-center rounded-md bg-navy px-2 text-[11px] leading-tight font-bold text-ouro";
  const celula = "flex flex-col items-center justify-center border border-borda-campo bg-white px-1 text-center";
  // as linhas de cima mostram um aviso no lugar do valor quando a coluna não se aplica (ex.: fidelidade ainda não liberada)
  const aviso = (c: Coluna) => c.bloqueio ?? (c.oferecido ? null : "Grupo não oferece");
  const linhasClaras: { r: string; v: (c: Coluna) => string; avisar?: boolean }[] = [
    { r: "Recurso da Carta (embutido)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoCarta) : "—"), avisar: true },
    { r: "Recurso Próprio (dinheiro)", v: (c) => (c.calc && c.tipo !== "SOR" ? dinheiro(c.calc.recursoProprio) : "—") },
    { r: "Crédito Disponível após a Contemplação", v: (c) => dinheiro(c.calc?.creditoDisponivel) },
    { r: "Valor da Parcela após a Contemplação", v: (c) => dinheiro(c.calc?.parcelaApos) },
    { r: "Prazo Restante", v: (c) => (c.calc && c.prazoRestante > 0 ? String(c.prazoRestante) : "—") },
  ];
  // linhas de baixo: mesmo padrão de fonte e de caixa das de cima (sem fundo azul nos valores)
  const linhasBaixo: { r: string; v: (c: Coluna) => string }[] = [
    { r: "Saldo Devedor", v: (c) => dinheiro(c.calc?.saldoDevedor) },
    { r: "Valor Investido", v: (c) => dinheiro(c.calc?.valorInvestido) },
    { r: "Custo Mensal", v: (c) => (c.calc?.custoMensal == null ? "—" : p2(c.calc.custoMensal * 100)) },
    { r: "Custo Anual", v: (c) => (c.calc?.custoAnual == null ? "—" : p2(c.calc.custoAnual * 100)) },
    { r: "Dinheiro Novo", v: (c) => dinheiro(c.calc?.dinheiroNovo) },
  ];

  return (
    <div className="flex flex-col gap-1.5" style={{ width: "var(--larg-cards, 100%)", minWidth: "46rem" }}>
      <div className={GRADE}>
        <div aria-hidden="true" />
        {colunas.map((c) => (
          <CabecalhoColuna key={c.chave} c={c} aoMudarQtd={aoMudarQtd(c.tipo)} />
        ))}
      </div>

      {linhasClaras.map((l) => (
        <div key={l.r} className={GRADE}>
          <div className={rotuloLinha}>{l.r}</div>
          {colunas.map((c) => {
            const msg = l.avisar ? aviso(c) : null;
            return (
              <div key={c.chave} className={`${celula} min-h-[2.4rem]`}>
                {msg ? (
                  <span className="text-[9px] leading-tight text-tinta">{msg}</span>
                ) : (
                  <span className={`text-[15px] leading-tight ${valorOuro}`}>{l.v(c)}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* perfil de cada coluna (textos em Parâmetros globais) */}
      <div className={GRADE}>
        <div aria-hidden="true" />
        {colunas.map((c) => (
          <div key={c.chave} className={`flex min-h-[3.4rem] flex-col items-center justify-center px-1.5 py-1 text-center ${COR_RODAPE[c.cor]}`}>
            <div className="text-[11px] font-bold">{c.rodape.titulo}</div>
            <div className="text-[10px] opacity-90">{c.rodape.texto}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {linhasBaixo.map((l) => (
          <div key={l.r} className={GRADE}>
            <div className={rotuloLinhaEscuro}>{l.r}</div>
            {colunas.map((c) => (
              <div key={c.chave} className={`${celula} h-[1.9rem]`}>
                <span className={`text-[15px] leading-tight ${valorOuro}`}>{l.v(c)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Todos os boxes: título com 2 linhas reservadas + linha do valor de altura fixa => os valores ficam alinhados entre os boxes.
const caixaBase = "flex flex-col rounded-lg border border-borda-campo bg-white px-2.5 py-1.5";
const tituloParam = "flex min-h-[1.5rem] items-start text-[10px] font-semibold leading-[1.15] tracking-wide text-tinta uppercase";
const linhaValor = "flex h-6 items-center text-[14px] font-bold tabular-nums";
// boxes com mais de uma linha de conteúdo (Meses, Contemplação): título de 1 linha e conteúdo subindo, para não ficarem mais altos que os outros
const tituloCurto = "flex items-start text-[10px] font-semibold leading-[1.15] tracking-wide text-tinta uppercase";
const linhaCompacta = "flex h-5 items-center text-[14px] font-bold tabular-nums";
const campoParam = "w-full min-w-0 bg-transparent text-[14px] font-bold tabular-nums outline-none focus:text-laranja";
const PRE_DEFINIDOS = [1, 12, 24, 36, 48, 60, 120];

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
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
  /** valores iniciais vindos de Parâmetros globais (INCC, contemplação e parcelas dos lances livre/fidelidade podem ser alterados nesta tela) */
  padroes: PadroesSimulador;
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
  // crédito contratado = cotas × crédito escolhido na Faixa de crédito; o campo aceita digitar (vazio vale 1 enquanto se digita)
  const [cotasTxt, setCotasTxt] = useState("1");
  const cotas = Math.min(99, Math.max(1, Number(cotasTxt) || 1));
  const taxaMensal = taxaAdm !== null && mesesFaltam > 0 ? taxaAdm / mesesFaltam : null;
  const [meses, setMeses] = useState(String(padroes.contemplacaoMeses));
  const [vagas, setVagas] = useState("17");
  const validadeRef = useRef<HTMLInputElement>(null);
  const [validade, setValidade] = useState(() => somarDias(hoje, 7));
  const [inccLigado, setInccLigado] = useState(true);
  const [incc, setIncc] = useState(() => padroes.incc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  const porTipo = new Map(modalidades.map((m) => [m.tipo as string, m]));
  const tetoQtd = (tipo: string) => porTipo.get(tipo)?.max_parcelas_lance ?? null; // sem teto = livre
  const limitar = (tipo: string, n: number) => {
    const teto = tetoQtd(tipo);
    return teto !== null && n > teto ? teto : n;
  };
  // parcelas do lance: Fixo e Limitado = as do grupo (não editáveis); Livre e Fidelidade = parâmetro global (editáveis só aqui),
  // sempre respeitando o teto de parcelas que o grupo informa para a modalidade
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

  // cálculos (precisam do crédito, da taxa de administração e do tipo de parcela)
  const base =
    creditoContratado !== null && taxaAdm !== null && tipo
      ? calcularBase({ credito: creditoContratado, taxaAdmPct: taxaAdm, pctParcela: tipo.pct, prazoGrupo, mesesFaltam, furo, mesesContemplacao })
      : null;

  const colunas: Coluna[] = COLUNAS.map((c) => {
    const m = porTipo.get(c.tipo);
    const oferecido = c.tipo === "SOR" || Boolean(m);
    // fidelidade só libera a partir da parcela informada pelo grupo (ex.: 36); antes disso não dá para contemplar por ela
    const bloqueio =
      c.tipo === "FID" && oferecido && fidelidadeMeses !== null && mesesContemplacao < fidelidadeMeses
        ? `Disponível a partir de ${fidelidadeMeses} meses`
        : null;
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
    <section className="flex flex-col gap-3 border-t border-borda pt-4" aria-label={`Simulador do grupo ${numero}`}>
      {/* parâmetros da simulação (antes ficavam sob a 1ª coluna) */}
      <div className="flex flex-wrap gap-2">
        <div className={"w-[5.5rem] " + caixaBase}>
          <span className={tituloParam}>Simulador</span>
          <span className={linhaValor}>{numero}</span>
        </div>

        <div className={"w-[8.5rem] " + caixaBase}>
          <div className="flex min-h-[1.5rem] items-start justify-between gap-1">
            <span className="text-[8px] leading-[1.15] font-semibold text-tinta uppercase">
              Crédito
              <br />
              Contratado
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-px pl-1" role="group" aria-label="Quantidade de cotas" title="Quantidade de cotas (multiplica o crédito escolhido)">
              <button
                type="button"
                aria-label="Menos uma cota"
                disabled={cotas <= 1}
                onClick={() => setCotasTxt(String(Math.max(1, cotas - 1)))}
                className="h-4 w-3 rounded border border-borda-campo text-[10px] leading-none font-bold hover:border-navy disabled:opacity-40"
              >
                −
              </button>
              <input
                inputMode="numeric"
                aria-label="Quantidade de cotas"
                value={cotasTxt}
                onChange={(e) => setCotasTxt(e.target.value.replace(/\D/g, "").slice(0, 2))}
                onBlur={() => setCotasTxt(String(cotas))}
                className="h-4 w-4 bg-transparent text-center text-[11px] font-bold tabular-nums outline-none focus:text-laranja"
              />
              <button
                type="button"
                aria-label="Mais uma cota"
                disabled={cotas >= 99}
                onClick={() => setCotasTxt(String(Math.min(99, cotas + 1)))}
                className="h-4 w-3 rounded border border-borda-campo text-[10px] leading-none font-bold hover:border-navy disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <span className={`${linhaValor} text-ouro`}>{creditoContratado === null ? "—" : brl0(creditoContratado)}</span>
        </div>

        <div className={"w-[8.5rem] " + caixaBase} title={tipo ? `Parcela ${tipo.descricao}` : undefined}>
          <span className={tituloParam}>
            Parcela antes da
            <br />
            contemplação
          </span>
          <span className={`${linhaValor} text-ouro`}>{base ? brl0(base.parcelaAntes) : "—"}</span>
        </div>

        <div className={"w-[8.5rem] " + caixaBase}>
          <span className={tituloCurto}>Meses</span>
          <div className={linhaCompacta + " justify-between"}>
            <span className="text-[11px] font-normal text-tinta">para terminar</span>
            <span>{mesesFaltam}</span>
          </div>
          <div className="flex h-4 items-center justify-between text-[11px] tabular-nums">
            <span className="text-tinta">decorridos</span>
            <strong>{String(mesesDecorridos).padStart(2, "0")}</strong>
          </div>
        </div>

        <div className={"w-[6.5rem] " + caixaBase}>
          <span className={tituloParam}>
            Fidelidade
            <br />
            em
          </span>
          <span className={linhaValor}>{fidelidadeMeses ? `${fidelidadeMeses} Meses` : "—"}</span>
        </div>

        <div className={"w-[12rem] " + caixaBase}>
          <span className={tituloCurto}>Contemplação em</span>
          <div className={linhaCompacta + " gap-1"}>
            <input
              className={campoParam + " w-8 border-b border-borda-campo text-right"}
              inputMode="numeric"
              aria-label="Contemplação em meses"
              value={meses}
              onChange={(e) => setMeses(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
            <span className="text-[11px] font-normal text-tinta">meses</span>
          </div>
          <div className="flex gap-0.5 pt-0.5">
            {PRE_DEFINIDOS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={Number(meses) === m && meses !== ""}
                onClick={() => setMeses(String(m))}
                className={"h-[18px] flex-1 rounded text-[10px] leading-none font-bold " + (Number(meses) === m && meses !== "" ? "bg-navy text-white ring-1 ring-laranja" : "border border-borda-campo hover:border-navy")}
              >
                {m === 1 ? "01" : m}
              </button>
            ))}
          </div>
        </div>

        <div className={"w-[6.5rem] " + caixaBase}>
          <span className={tituloParam}>
            Taxa de adm.
            <br />
            mensal
          </span>
          <span className={linhaValor}>{taxaMensal === null ? "—" : p2(taxaMensal)}</span>
        </div>

        <div className={"w-[6.5rem] " + caixaBase}>
          <span className={tituloParam}>
            Parcela para
            <br />
            lance
          </span>
          <span className={linhaValor + " truncate"} title="(crédito + taxa de administração) ÷ prazo original do grupo">
            {base ? brl0(base.parcelaLance) : "—"}
          </span>
        </div>

        <label className={"w-[4.5rem] " + caixaBase}>
          <span className={tituloParam}>Vagas</span>
          <input
            className={`${campoParam} h-6 text-[#c62828]`}
            inputMode="numeric"
            value={vagas}
            onChange={(e) => setVagas(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>

        <div className={"relative w-[6.5rem] " + caixaBase}>
          <div className={tituloParam + " items-center gap-1.5"}>
            <span>Validade</span>
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
          <span className={`${linhaValor} text-[#c62828]`}>{dataBR(validade)}</span>
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

        <div className={"w-[5.5rem] " + caixaBase}>
          <div className={tituloParam + " items-center justify-between gap-2"}>
            <label htmlFor="incc-sim">INCC</label>
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
          <div className={linhaValor + " gap-0.5"}>
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
        <GradeSimulador colunas={colunas} aoMudarQtd={mudarQtd} />
      </div>
    </section>
  );
}
