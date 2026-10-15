import { reais } from "@/lib/formato";

// LAYOUT PARA VALIDAÇÃO: todos os números abaixo são fictícios (não vêm do grupo nem de cálculo).
// Quando o layout for aprovado, esta estrutura recebe os dados reais do grupo e da simulação.

const brl0 = (v: number) => reais(v).replace(",00", "");
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

type Coluna = {
  chave: string;
  titulo: string[];
  numero?: number; // posição do lance (o sorteio não tem)
  concorrencia?: number; // % de concorrência
  proprioPct?: number; // % de recurso próprio no lance
  icone?: "cadeado" | "martelo";
  carta?: { rotulo: string; valor: number };
  proprio?: { rotulo: string; valor: number };
  creditoDisponivel: number;
  parcela: number;
  prazoRestante: number;
  rodape: { titulo: string; texto: string; cor: "navy" | "ouro" | "laranja" | "livre" };
  saldoDevedor: number;
  valorInvestido?: number;
  custoMensal: number;
  custoAnual: number;
  dinheiroNovo: number;
};

const PARAMETROS = {
  mesesContemplacao: 1,
  idPlano: "12212-1",
  tipoParcela: "PARCELA 100%",
  fidelidadeMeses: 36,
  vagas: 17,
  validade: "19/10/2026",
  indice: "INCC",
  indicePct: 6,
};

const CONTRATO = {
  valor: 140000,
  parcelaAntes: 794,
  mesesParaTerminar: 219,
  mesesDecorridos: 1,
  taxaAdmMensal: 0.11,
};

const COLUNAS: Coluna[] = [
  {
    chave: "sorteio",
    titulo: ["Sorteio"],
    creditoDisponivel: 140000,
    parcela: 794,
    prazoRestante: 218,
    rodape: { titulo: "Sem lance", texto: "Depende só da sorte", cor: "navy" },
    saldoDevedor: 173092,
    custoMensal: 0.21,
    custoAnual: 2.51,
    dinheiroNovo: 140000,
  },
  {
    chave: "fixo",
    titulo: ["Lance", "Fixo"],
    numero: 1,
    concorrencia: 25,
    proprioPct: 0,
    icone: "cadeado",
    carta: { rotulo: "embutido 100%", valor: 34776 },
    proprio: { rotulo: "dinheiro 0%", valor: 0 },
    creditoDisponivel: 105224,
    parcela: 634,
    prazoRestante: 218,
    rodape: { titulo: "Previsibilidade máxima", texto: "Valor de lance pré-definido", cor: "navy" },
    saldoDevedor: 138212,
    custoMensal: 0.27,
    custoAnual: 3.28,
    dinheiroNovo: 104430,
  },
  {
    chave: "limitado",
    titulo: ["Lance", "Limitado"],
    numero: 2,
    concorrencia: 10,
    proprioPct: 25,
    icone: "cadeado",
    carta: { rotulo: "embutido 50%", valor: 34776 },
    proprio: { rotulo: "dinheiro 50%", valor: 34776 },
    creditoDisponivel: 105224,
    parcela: 475,
    prazoRestante: 218,
    rodape: { titulo: "Equilíbrio e flexibilidade", texto: "Combina crédito + recurso próprio", cor: "ouro" },
    saldoDevedor: 103550,
    custoMensal: 0.39,
    custoAnual: 4.78,
    dinheiroNovo: 69654,
  },
  {
    chave: "livre",
    titulo: ["Lance", "Livre"],
    numero: 3,
    concorrencia: 8,
    proprioPct: 35,
    icone: "martelo",
    carta: { rotulo: "embutido 25%", valor: 35000 },
    proprio: { rotulo: "dinheiro 75%", valor: 52500 },
    creditoDisponivel: 105000,
    parcela: 520,
    prazoRestante: 218,
    rodape: { titulo: "Valor à sua escolha", texto: "Você define o lance, sem teto fixo", cor: "livre" },
    saldoDevedor: 96800,
    custoMensal: 0.46,
    custoAnual: 5.66,
    dinheiroNovo: 52500,
  },
  {
    chave: "fidelidade",
    titulo: ["Lance", "Fidelidade"],
    numero: 4,
    concorrencia: 3,
    proprioPct: 42,
    icone: "martelo",
    carta: { rotulo: "embutido 50%", valor: 59277 },
    proprio: { rotulo: "dinheiro 50%", valor: 59277 },
    creditoDisponivel: 80723,
    parcela: 250,
    prazoRestante: 218,
    rodape: { titulo: "Maior poder de contemplação", texto: "Funciona como leilão", cor: "laranja" },
    saldoDevedor: 54500,
    custoMensal: 1.1,
    custoAnual: 14.01,
    dinheiroNovo: 20651,
  },
];

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

function CelulaColuna({ c }: { c: Coluna }) {
  const borda = "border border-borda-campo bg-white";
  return (
    <div className="col-span-1 row-span-8 grid grid-rows-subgrid">
      {/* 1 · cabeçalho */}
      <div className="flex min-h-[78px] overflow-hidden bg-[#d9d9d9] text-navy">
        {c.numero ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2">
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border-2 border-navy text-xs font-extrabold leading-none">
                {c.numero}
              </span>
              <span className="text-sm leading-[1.1] font-extrabold">
                {c.titulo[0]}
                <br />
                {c.titulo[1]}
              </span>
            </div>
            <div className="flex w-[47%] shrink-0 flex-col bg-navy">
              <div className="whitespace-nowrap px-1.5 pt-1 text-[10px] font-bold text-white">Concorrência {c.concorrencia}%</div>
              <div className="mx-1.5 mt-0.5 h-[18px] bg-white" role="img" aria-label={`Concorrência ${c.concorrencia}%`}>
                <div className="h-full bg-ouro" style={{ width: `${Math.min(100, (c.concorrencia ?? 0) * 3)}%` }} />
              </div>
              <div className="mt-auto flex items-center justify-end gap-1 whitespace-nowrap bg-[#d9d9d9] px-1.5 py-0.5 text-[10.5px] font-bold">
                {c.proprioPct}% {c.icone === "cadeado" ? <Cadeado /> : <Martelo />} Próprio
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
        {c.carta && c.proprio ? (
          <>
            <div>
              <div className={rotulo}>Recurso da Carta</div>
              <div className="text-[9px] text-tinta">({c.carta.rotulo})</div>
              <div className={valorOuro}>{brl0(c.carta.valor)}</div>
            </div>
            <div>
              <div className={rotulo}>Recurso Próprio</div>
              <div className="text-[9px] text-tinta">({c.proprio.rotulo})</div>
              <div className={valorOuro}>{brl0(c.proprio.valor)}</div>
            </div>
          </>
        ) : (
          <div className="col-span-2 self-center text-xs text-tinta">—</div>
        )}
      </div>

      {/* 3 · crédito, 4 · parcela, 5 · prazo */}
      <Metrica rotulo="Crédito Disponível após a Contemplação" valor={brl0(c.creditoDisponivel)} />
      <Metrica rotulo="Valor da Parcela após a Contemplação" valor={brl0(c.parcela)} />
      <Metrica rotulo="Prazo Restante" valor={String(c.prazoRestante)} />

      {/* 6 · rodapé de perfil */}
      <div className={`flex flex-col items-center justify-center px-2 py-1 text-center ${COR_RODAPE[c.rodape.cor]}`}>
        <div className="text-[11px] font-bold">{c.rodape.titulo}</div>
        <div className="text-[10px] opacity-90">{c.rodape.texto}</div>
      </div>

      {/* 7 · espaço · 8 · custos */}
      <div aria-hidden="true" />
      <div className="bg-navy px-2.5 py-1.5 text-xs text-white">
        <Linha t="Saldo Devedor" v={brl0(c.saldoDevedor).replace("R$ ", "")} />
        <Linha t="Valor Investido" v={c.valorInvestido ? brl0(c.valorInvestido).replace("R$ ", "") : ""} />
        <Linha t="Custo Mensal" v={p2(c.custoMensal)} />
        <Linha t="Custo Anual" v={p2(c.custoAnual)} />
        <Linha t="Dinheiro Novo" v={brl0(c.dinheiroNovo).replace("R$ ", "")} />
      </div>
    </div>
  );
}

function Linha({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-px">
      <span className="font-semibold text-ouro">{t}</span>
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

function Parametro({ t, v, destaque }: { t: string; v: string; destaque?: "alerta" }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-borda-campo bg-white px-3 py-1.5">
      <span className="text-[10px] font-semibold tracking-wide text-tinta uppercase">{t}</span>
      <span className={"text-[13px] font-bold tabular-nums " + (destaque === "alerta" ? "text-[#c62828]" : "")}>{v}</span>
    </div>
  );
}

export function SimuladorGrupo({ numero }: { numero: number }) {
  return (
    <section className="flex flex-col gap-3 border-t border-borda pt-4" aria-label={`Simulador do grupo ${numero}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">Simulador · Grupo {numero}</h2>
        <span className="rounded-full bg-laranja-claro px-2.5 py-0.5 text-[11px] font-bold text-alerta">
          Dados fictícios — validação de layout
        </span>
      </div>

      {/* parâmetros da simulação (antes ficavam sob a 1ª coluna) */}
      <div className="flex flex-wrap gap-2">
        <Parametro t="Contemplação em (meses)" v={String(PARAMETROS.mesesContemplacao)} />
        <Parametro t="ID do plano" v={PARAMETROS.idPlano} />
        <Parametro t="Parcela antes da contemplação" v={PARAMETROS.tipoParcela} />
        <Parametro t="Fidelidade disponível em" v={`${PARAMETROS.fidelidadeMeses}M`} />
        <Parametro t="Vagas disponíveis" v={String(PARAMETROS.vagas)} destaque="alerta" />
        <Parametro t="Validade da proposta" v={PARAMETROS.validade} destaque="alerta" />
        <Parametro t={`Índice (${PARAMETROS.indice})`} v={p2(PARAMETROS.indicePct)} />
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
              <span className={`text-[28px] leading-tight ${valorOuro}`}>{brl0(CONTRATO.valor)}</span>
              <span className="mt-1 text-[15px] leading-tight font-extrabold">Parcela antes da Contemplação</span>
              <span className={`text-base ${valorOuro}`}>{brl0(CONTRATO.parcelaAntes)}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Mini t="Meses para Terminar o Plano" v={String(CONTRATO.mesesParaTerminar)} />
              <Mini t="Meses Decorridos" v={String(CONTRATO.mesesDecorridos).padStart(2, "0")} />
            </div>
            <div className="flex flex-col items-center justify-center border border-borda-campo bg-white px-2 text-center">
              <span className="text-[13px] font-extrabold">Taxa de administração mensal</span>
              <span className="text-base font-extrabold tabular-nums">{p2(CONTRATO.taxaAdmMensal)}</span>
            </div>
            <div aria-hidden="true" />
          </div>

          {COLUNAS.map((c) => (
            <CelulaColuna key={c.chave} c={c} />
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
