"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GrupoDetalhe } from "@/lib/grupos";
import { calcularBase, type PadroesSimulador } from "@/lib/simulacao";
import { dataBR, lerPct, milhar, pct } from "@/lib/formato";
import { salvarCampoGrupo, type CampoGrupo } from "../grupos/actions";
import { SimulacaoProvider, useSimulacao } from "../grupos/SimulacaoContext";
import { DadosGrupo } from "./DadosGrupo";
import { SimuladorV2 } from "./SimuladorV2";

// Grupos e Tabelas ver2: um seletor de grupo, um resumo fixo e duas abas (Dados do grupo · Simulador).
// Os dados só ficam editáveis com a edição ligada; cada campo grava assim que é alterado, como na versão 1.

export type Estado = { tipo: "ocioso" } | { tipo: "salvando" } | { tipo: "salvo" } | { tipo: "erro"; msg: string };
export type Info = Record<CampoGrupo, string>;
export type Aba = "dados" | "simulador";

type Ctx = {
  grupo: GrupoDetalhe;
  familiaNome: string;
  indices: { sigla: string; nome: string }[];
  editando: boolean;
  info: Info;
  estadoInfo: Estado;
  mudarInfo: (c: CampoGrupo, v: string) => void;
  gravarInfo: (c: CampoGrupo, v: string) => void;
  /** taxa de administração total já gravada (o simulador usa esta) */
  taxaAdm: number | null;
  creditos: number[];
  setCreditos: (v: number[]) => void;
  disponiveis: Set<string>;
  setDisponiveis: (v: Set<string>) => void;
  cotas: number;
  setCotas: (v: number) => void;
  meses: string;
  setMeses: (v: string) => void;
  realizadas: number;
  faltam: number;
};

const DadosCtx = createContext<Ctx | null>(null);
export function useDados() {
  const c = useContext(DadosCtx);
  if (!c) throw new Error("fora de <GrupoV2>");
  return c;
}

type Props = {
  grupo: GrupoDetalhe;
  familiaNome: string;
  indices: { sigla: string; nome: string }[];
  hoje: string;
  padroes: PadroesSimulador;
  abaInicial: Aba;
  seletor: React.ReactNode;
};

export function GrupoV2(p: Props) {
  const g = p.grupo;
  // parcela inicial do simulador: a menor entre as oferecidas (como na versão 1)
  const tipoInicial = g.tiposParcela.filter((t) => t.disponivel).sort((a, b) => a.pct - b.pct)[0];
  return (
    <SimulacaoProvider
      creditoInicial={g.creditos[0] ?? null}
      tipoInicial={tipoInicial?.codigo ?? null}
      tipos={g.tiposParcela.map((t) => ({ codigo: t.codigo, descricao: t.descricao, pct: t.pct }))}
      furoInicial={g.pagamento_com_furo}
    >
      <Conteudo {...p} />
    </SimulacaoProvider>
  );
}

function Conteudo({ grupo: g, familiaNome, indices, hoje, padroes, abaInicial, seletor }: Props) {
  const router = useRouter();
  const inicial: Info = {
    participantes: milhar(g.participantes),
    taxa_adm_total: pct(g.taxa_adm_total),
    fundo_reserva: pct(g.fundo_reserva),
    indice: g.indice ?? "",
    mes_reajuste: g.mes_reajuste ? String(g.mes_reajuste) : "",
    dia_vencimento: g.dia_vencimento ? String(g.dia_vencimento) : "",
  };
  const [info, setInfo] = useState<Info>(inicial);
  const [gravada, setGravada] = useState<Info>(inicial);
  const [estadoInfo, setEstadoInfo] = useState<Estado>({ tipo: "ocioso" });
  const [, iniciar] = useTransition();
  const [editando, setEditando] = useState(false);
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [creditos, setCreditos] = useState(g.creditos);
  const [disponiveis, setDisponiveis] = useState(() => new Set(g.tiposParcela.filter((t) => t.disponivel).map((t) => t.codigo)));
  const [cotas, setCotas] = useState(1);
  const [meses, setMeses] = useState(String(padroes.contemplacaoMeses));

  // a tabela vigente é da próxima assembleia enquanto a data dela não passou
  const realizadas = g.data_assembleia && g.data_assembleia >= hoje ? g.assembleia - 1 : g.assembleia;
  const faltam = Math.max(0, g.prazo_grupo_meses - realizadas);

  function gravarInfo(campo: CampoGrupo, valor: string) {
    if (valor === gravada[campo]) return;
    setEstadoInfo({ tipo: "salvando" });
    iniciar(async () => {
      const r = await salvarCampoGrupo(g.numero, campo, valor);
      if (r.ok) {
        setGravada((x) => ({ ...x, [campo]: valor }));
        setEstadoInfo({ tipo: "salvo" });
      } else setEstadoInfo({ tipo: "erro", msg: r.erro });
    });
  }

  function trocarAba(a: Aba) {
    setAba(a);
    // guarda a aba na URL (recarregar ou trocar de grupo mantém a aba)
    const u = new URL(window.location.href);
    if (a === "dados") u.searchParams.delete("aba");
    else u.searchParams.set("aba", a);
    u.searchParams.delete("lista");
    window.history.replaceState(null, "", u);
  }

  function alternarEdicao() {
    // ao desligar, busca de novo os dados do servidor (a sequência usa o editor da versão 1, que grava por conta própria)
    if (editando) router.refresh();
    setEditando(!editando);
    setEstadoInfo({ tipo: "ocioso" });
  }

  const ctx: Ctx = {
    grupo: g,
    familiaNome,
    indices,
    editando,
    info,
    estadoInfo,
    mudarInfo: (c, v) => setInfo((x) => ({ ...x, [c]: v })),
    gravarInfo,
    taxaAdm: lerPct(gravada.taxa_adm_total),
    creditos,
    setCreditos,
    disponiveis,
    setDisponiveis,
    cotas,
    setCotas,
    meses,
    setMeses,
    realizadas,
    faltam,
  };

  return (
    <DadosCtx.Provider value={ctx}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {seletor}
          <div className="flex flex-col gap-0.5 text-[13px]">
            <span>
              <span className="text-tinta">Assembleia atual: </span>
              <strong>
                {g.assembleia}
                {g.data_assembleia ? ` – ${dataBR(g.data_assembleia)}` : ""}
              </strong>
            </span>
            {g.atualizado_em && (
              <span className="text-[11px] text-tinta" title={g.arquivo ? `Tabela: ${g.arquivo}` : undefined}>
                Atualizado em {new Date(g.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </span>
            )}
          </div>
        </div>

        <Resumo />

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-borda">
          <div role="tablist" aria-label="Seções do grupo" className="-mb-px flex gap-1">
            {(
              [
                ["dados", "Dados do grupo"],
                ["simulador", "Simulador"],
              ] as const
            ).map(([k, rotulo]) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`aba-${k}`}
                aria-selected={aba === k}
                aria-controls={`painel-${k}`}
                onClick={() => trocarAba(k)}
                className={
                  "border-b-[3px] px-4 py-2.5 text-sm font-bold " +
                  (aba === k ? "border-laranja text-navy" : "border-transparent text-tinta hover:text-navy")
                }
              >
                {rotulo}
              </button>
            ))}
          </div>
          {aba === "dados" && (
            <div className="flex items-center gap-2.5 pb-2">
              <span id="rotulo-edicao" className={"text-[13px] font-bold " + (editando ? "text-alerta" : "text-tinta")}>
                {editando ? "Edição ligada" : "Edição desligada"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={editando}
                aria-labelledby="rotulo-edicao"
                onClick={alternarEdicao}
                className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (editando ? "bg-laranja" : "bg-[#cfcbe0]")}
              >
                <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (editando ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>
          )}
        </div>

        {/* os dois painéis ficam montados: trocar de aba não perde o que foi digitado no simulador */}
        <div role="tabpanel" id="painel-dados" aria-labelledby="aba-dados" hidden={aba !== "dados"}>
          <DadosGrupo />
        </div>
        <div role="tabpanel" id="painel-simulador" aria-labelledby="aba-simulador" hidden={aba !== "simulador"}>
          <SimuladorV2 hoje={hoje} padroes={padroes} />
        </div>
      </div>
    </DadosCtx.Provider>
  );
}

const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, minimumFractionDigits: 0 });
export const reais0 = (v: number) => brl0.format(Math.ceil(Number(v.toFixed(4))));

/** Faixa fixa no topo, igual nas duas abas: o essencial do grupo e da simulação em curso. */
function Resumo() {
  const { grupo: g, info, realizadas, faltam, taxaAdm, cotas, meses } = useDados();
  const { creditoSel, tipoSel, tipos, furo } = useSimulacao();
  const tipo = tipos.find((t) => t.codigo === tipoSel);
  const credito = creditoSel === null ? null : creditoSel * cotas;
  const base =
    credito !== null && taxaAdm !== null && tipo
      ? calcularBase({
          credito,
          taxaAdmPct: taxaAdm,
          pctParcela: tipo.pct,
          prazoGrupo: g.prazo_grupo_meses,
          mesesFaltam: faltam,
          furo,
          mesesContemplacao: Number(meses) || 0,
        })
      : null;
  const item = "flex min-w-0 flex-col gap-0.5 px-4 py-2.5";
  const rotulo = "text-[10px] font-bold tracking-wider text-tinta uppercase";
  const valor = "text-lg leading-tight font-bold tabular-nums";

  return (
    <section
      aria-label="Resumo do grupo"
      className="sticky top-0 z-10 grid grid-cols-2 divide-borda overflow-hidden rounded-2xl border border-borda bg-white shadow-[0_6px_18px_rgba(13,5,64,0.06)] sm:grid-cols-3 sm:divide-x lg:grid-cols-[1fr_1.6fr_1fr_1fr_1fr]"
    >
      <div className={item}>
        <span className={rotulo}>Assembleia atual</span>
        <span className={valor}>{g.assembleia}ª</span>
        <span className="text-[11px] text-tinta">{g.data_assembleia ? dataBR(g.data_assembleia) : "—"}</span>
      </div>
      <div className={item} title={`${realizadas} de ${g.prazo_grupo_meses} assembleias realizadas · faltam ${faltam}`}>
        <span className={rotulo}>Andamento</span>
        <div className="flex justify-between text-[11px]">
          <span className="font-bold text-laranja">
            {realizadas} {realizadas === 1 ? "realizada" : "realizadas"}
          </span>
          <span className="text-tinta">
            <strong className="text-navy">{faltam}</strong> faltam · {g.prazo_grupo_meses}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-lavanda" role="img" aria-label={`${realizadas} de ${g.prazo_grupo_meses} assembleias realizadas`}>
          <div className="absolute inset-y-0 left-0 min-w-1.5 rounded-full bg-laranja" style={{ width: `${Math.min(100, (realizadas / g.prazo_grupo_meses) * 100)}%` }} />
        </div>
      </div>
      <div className={item}>
        <span className={rotulo}>Crédito escolhido</span>
        <span className={valor + " text-ouro-texto"}>{credito === null ? "—" : reais0(credito)}</span>
        <span className="text-[11px] text-tinta">
          {cotas} {cotas === 1 ? "cota" : "cotas"}
        </span>
      </div>
      <div className={item}>
        <span className={rotulo}>Parcela {tipo ? `· ${tipo.descricao}` : ""}</span>
        <span className={valor + " text-ouro-texto"}>{base ? reais0(base.parcelaAntes) : "—"}</span>
        <span className="text-[11px] text-tinta">antes de contemplar{furo ? " · furo" : ""}</span>
      </div>
      <div className={item}>
        <span className={rotulo}>Taxa · Índice</span>
        <span className={valor}>{taxaAdm === null ? "—" : pct(taxaAdm)}</span>
        <span className="text-[11px] text-tinta">{info.indice || "sem índice"}</span>
      </div>
    </section>
  );
}
