"use client";

import { useState } from "react";
import { calcularBase, calcularColuna, type Coluna as Calc, type RegraEmbutido } from "@/lib/simulacao";

// ---------------------------------------------------------------------------------------------
// PROTÓTIPO DE LAYOUT — grupo fictício; nenhum dado é lido ou gravado.
// Sugestão 1: grade do simulador com rótulos só na coluna da esquerda (e prazo restante único).
// Sugestão 2: "barra de cenário" horizontal (crédito e parcela em chips + parâmetros da simulação).
// Sugestão 3: Sequência e Modalidades como "Regras do grupo", fechadas, com resumo em chips.
// ---------------------------------------------------------------------------------------------

const nf0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0, minimumFractionDigits: 0 });
const brl0 = (v: number) => nf0.format(Math.ceil(Number(v.toFixed(4))));
const p2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
const milhar = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// grupo fictício
const GRUPO = { numero: 690, prazoGrupo: 240, faltam: 219, realizadas: 21, taxaAdm: 24, fidelidadeMeses: 36 };
const CREDITOS = [1022073.74, 970970.05, 919866.37, 868762.69, 817659, 766555.31, 715451.61, 664347.94, 613244.25, 562140.57, 511036.87];
const TIPOS = [
  { id: "NORMAL", nome: "Normal", pct: 100 },
  { id: "RED_70", nome: "Reduzida 70%", pct: 70 },
  { id: "RED_50", nome: "Reduzida 50%", pct: 50 },
];
const PRE_DEFINIDOS = [1, 12, 24, 36, 48, 60, 120];

type Tipo = "SOR" | "FIX" | "LIM" | "LIV" | "FID";
const COLUNAS: { tipo: Tipo; titulo: string; numero?: number; qtd: number | null; fixa: boolean; regra: RegraEmbutido | null; conc: number | null; perfil: string; cor: string }[] = [
  { tipo: "SOR", titulo: "Sorteio", qtd: null, fixa: true, regra: null, conc: null, perfil: "Sem lance", cor: "bg-navy text-[#e9e6f5]" },
  { tipo: "FIX", titulo: "Lance Fixo", numero: 1, qtd: 44, fixa: true, regra: { embutido_base: "ofertado", embutido_pct: 100, embutido_max_parcelas: 44 }, conc: 25, perfil: "Previsibilidade máxima", cor: "bg-navy text-[#e9e6f5]" },
  { tipo: "LIM", titulo: "Lance Limitado", numero: 2, qtd: 88, fixa: true, regra: { embutido_base: "ofertado", embutido_pct: 50, embutido_max_parcelas: null }, conc: 10, perfil: "Equilíbrio e flexibilidade", cor: "bg-ouro text-navy" },
  { tipo: "LIV", titulo: "Lance Livre", numero: 3, qtd: 150, fixa: false, regra: { embutido_base: "ofertado", embutido_pct: 50, embutido_max_parcelas: null }, conc: 3, perfil: "Valor à sua escolha", cor: "bg-[#5b5680] text-white" },
  { tipo: "FID", titulo: "Lance Fidelidade", numero: 4, qtd: 130, fixa: false, regra: { embutido_base: "ofertado", embutido_pct: 50, embutido_max_parcelas: null }, conc: 2, perfil: "Maior poder de contemplação", cor: "bg-laranja text-navy" },
];

const chip = (sel: boolean) =>
  "h-7 shrink-0 rounded-md border px-2 text-[12px] font-bold tabular-nums transition-colors " +
  (sel ? "border-laranja bg-laranja-claro text-navy ring-1 ring-laranja" : "border-borda-campo bg-white text-navy hover:border-navy");
const rotuloBarra = "w-[4.5rem] shrink-0 text-[10px] font-bold tracking-wide text-tinta uppercase";

export function PrototipoGrupo() {
  const [credito, setCredito] = useState(CREDITOS[0]);
  const [tipo, setTipo] = useState("RED_50");
  const [furo, setFuro] = useState(false);
  const [meses, setMeses] = useState("1");
  const [vagas, setVagas] = useState("17");
  const [incc, setIncc] = useState(true);
  const [qtds, setQtds] = useState<Record<string, string>>({ LIV: "150", FID: "130" });
  const [regras, setRegras] = useState(false);

  const mesesNum = Number(meses) || 0;
  const pctTipo = TIPOS.find((t) => t.id === tipo)?.pct ?? 100;
  const base = calcularBase({ credito, taxaAdmPct: GRUPO.taxaAdm, pctParcela: pctTipo, prazoGrupo: GRUPO.prazoGrupo, mesesFaltam: GRUPO.faltam, furo, mesesContemplacao: mesesNum });

  const cols = COLUNAS.map((c) => {
    const bloqueada = c.tipo === "FID" && mesesNum < GRUPO.fidelidadeMeses;
    const qtd = c.qtd === null ? null : Number(qtds[c.tipo] ?? c.qtd) || 0;
    const calc: Calc | null = bloqueada ? null : calcularColuna(base, credito, c.regra && qtd !== null ? { qtdParcelas: qtd, regra: c.regra } : null);
    return { ...c, bloqueada, qtd, calc };
  });

  const din = (v: number | null | undefined) => (v === null || v === undefined ? "—" : brl0(v));
  const pc = (v: number | null | undefined) => (v === null || v === undefined ? "—" : p2(v * 100));

  const grade = "grid grid-cols-[9.5rem_repeat(5,minmax(0,1fr))] gap-x-1";
  const celula = "flex items-center justify-end px-2 tabular-nums";

  return (
    <>
      <div className="flex items-center gap-2 bg-laranja-claro px-8 py-1 text-[11px] font-semibold text-alerta">
        Protótipo de layout · grupo fictício · nada é lido nem gravado. A tela real não foi alterada.
      </div>

      {/* faixa de família (como na tela real) */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-borda bg-white px-8 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] text-tinta">Cadastros</span>
          <h1 className="text-lg font-bold leading-tight">Grupos e Tabelas</h1>
        </div>
        <nav className="flex gap-1.5" aria-label="Família">
          <span className="flex h-7 items-center rounded-lg bg-navy px-3 text-[13px] font-bold text-white shadow-[inset_0_-3px_0_var(--color-laranja)]">Imóveis (146)</span>
          {["Veículos (0)", "Serviços (0)", "Outros Bens (0)"].map((n) => (
            <span key={n} className="flex h-7 items-center rounded-lg border border-borda-campo bg-white px-3 text-[13px] font-bold text-navy">{n}</span>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-2 px-8 pt-2 pb-4">
        {/* cabeçalho do grupo */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            Grupo {GRUPO.numero} · Imóveis
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-borda-campo bg-white text-base leading-none">+</span>
          </h2>
          <span className="text-[13px]">
            <span className="text-tinta">Assembleia atual: </span>
            <strong>131 – 20/10/2026</strong> <span className="text-[11px] text-tinta">(atualizado em: 14/10/2026)</span>
          </span>
          <div className="w-44" title={`${GRUPO.realizadas} de ${GRUPO.prazoGrupo} realizadas`}>
            <div className="mb-0.5 flex justify-between text-[11px] leading-none">
              <span className="font-bold text-laranja">{GRUPO.realizadas} realizadas</span>
              <span className="text-tinta"><strong className="text-navy">{GRUPO.faltam}</strong> faltam</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-lavanda">
              <div className="absolute inset-y-0 left-0 rounded-full bg-laranja" style={{ width: `${(GRUPO.realizadas / GRUPO.prazoGrupo) * 100}%` }} />
            </div>
          </div>
          {[
            ["Participantes", "2.000"],
            ["Taxa adm. total", "24,00%"],
            ["Índice", "INCC"],
            ["1ª correção", "janeiro/2027"],
          ].map(([r, v]) => (
            <div key={r} className="flex flex-col text-[10px] font-semibold tracking-wide text-tinta uppercase">
              {r}
              <span className="rounded-md border border-borda-campo bg-campo px-2 py-0.5 text-right text-[13px] font-semibold tracking-normal text-navy normal-case">{v}</span>
            </div>
          ))}
        </div>

        {/* SUGESTÃO 2 · barra de cenário */}
        <section aria-label="Cenário da simulação" className="flex flex-col gap-1.5 rounded-xl border border-borda bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex w-[4.5rem] shrink-0 items-center gap-0.5 text-[10px] font-bold tracking-wide text-tinta uppercase">
              Crédito
              <button type="button" title="Editar a faixa de crédito" aria-label="Editar a faixa de crédito" className="flex h-6 w-6 items-center justify-center rounded-md text-tinta hover:bg-linha hover:text-navy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </span>
            {CREDITOS.map((c) => (
              <button key={c} type="button" aria-pressed={c === credito} onClick={() => setCredito(c)} className={chip(c === credito)}>
                {milhar(c)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-linha pt-1.5">
            <div className="flex items-center gap-1.5">
              <span className={rotuloBarra}>Parcela</span>
              {TIPOS.map((t) => (
                <button key={t.id} type="button" aria-pressed={t.id === tipo} onClick={() => setTipo(t.id)} className={chip(t.id === tipo)}>
                  {t.nome}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[12px] font-semibold">
              Furo
              <button
                type="button"
                role="switch"
                aria-checked={furo}
                onClick={() => setFuro((v) => !v)}
                className={"relative h-4 w-7 rounded-full transition-colors " + (furo ? "bg-ok" : "bg-[#cfcbe0]")}
              >
                <span className={"absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all " + (furo ? "left-[14px]" : "left-0.5")} />
              </button>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wide text-tinta uppercase">Contemplação em</span>
              <input
                inputMode="numeric"
                aria-label="Contemplação em meses"
                value={meses}
                onChange={(e) => setMeses(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="h-7 w-11 rounded-md border border-borda-campo bg-campo px-1 text-right text-[12px] font-bold tabular-nums outline-none focus:border-laranja"
              />
              <span className="text-[11px] text-tinta">meses</span>
              <div className="flex gap-0.5">
                {PRE_DEFINIDOS.map((m) => (
                  <button key={m} type="button" aria-pressed={Number(meses) === m && meses !== ""} onClick={() => setMeses(String(m))} className={"h-6 min-w-7 rounded px-1 text-[11px] font-bold " + (Number(meses) === m && meses !== "" ? "bg-navy text-white ring-1 ring-laranja" : "border border-borda-campo hover:border-navy")}>
                    {m === 1 ? "01" : m}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-tinta uppercase">
              Vagas
              <input value={vagas} onChange={(e) => setVagas(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-7 w-12 rounded-md border border-borda-campo bg-campo px-1 text-right text-[12px] font-bold tracking-normal text-[#c62828] outline-none focus:border-laranja" />
            </label>
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-tinta uppercase">
              Validade <strong className="text-[12px] tracking-normal text-[#c62828] tabular-nums">22/10/2026</strong>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-tinta uppercase">
              INCC
              <button type="button" role="switch" aria-checked={incc} onClick={() => setIncc((v) => !v)} className={"relative h-4 w-7 rounded-full transition-colors " + (incc ? "bg-ok" : "bg-[#cfcbe0]")}>
                <span className={"absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all " + (incc ? "left-[14px]" : "left-0.5")} />
              </button>
              <strong className="text-[12px] tracking-normal tabular-nums">{incc ? "6,00%" : "0,00%"}</strong>
            </span>
          </div>
        </section>

        {/* SUGESTÃO 3 · regras do grupo, sob demanda */}
        <div className="relative">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-borda bg-white px-3 py-1.5">
            <button type="button" aria-expanded={regras} onClick={() => setRegras((v) => !v)} className="flex h-7 items-center gap-1.5 rounded-md bg-navy px-2.5 text-[12px] font-bold text-white">
              Regras do grupo <span aria-hidden="true">{regras ? "▴" : "▾"}</span>
            </button>
            {[
              `Furo: ${furo ? "sim" : "não"}`,
              "Reduzidas 50 · 70",
              `Fidelidade: ${GRUPO.fidelidadeMeses} meses`,
              "Fixo 44 parc.",
              "Limitado 88 parc.",
              "Livre sem teto",
              "Sequência: 1 sorteio · cancelada · livre · fixo",
            ].map((t) => (
              <span key={t} className="rounded-full bg-lavanda px-2.5 py-0.5 text-[11px] font-semibold text-navy">{t}</span>
            ))}
          </div>

          {regras && (
            <div className="absolute top-full left-0 z-20 mt-1 flex w-[min(52rem,100%)] flex-wrap gap-4 rounded-xl border border-borda bg-white p-4 shadow-[0_12px_30px_rgba(13,5,64,0.18)]">
              <div className="min-w-[16rem] flex-1">
                <h3 className="mb-1.5 text-sm font-bold">Sequência de contemplação</h3>
                <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]">
                  {Array.from({ length: 20 }, (_, i) => ["#0d0540", "#e0a25a", "#0f9d8a", "#c99a2e"][i % 4]).map((c, i) => (
                    <span key={i} style={{ background: c }} className="aspect-square rounded-[2px]" />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-tinta">Exemplo: 1 sorteio por mês; fidelidade entra no mês 37.</p>
              </div>
              <div className="min-w-[18rem] flex-1">
                <h3 className="mb-1.5 text-sm font-bold">Modalidades de contemplação</h3>
                <table className="tabela-sm w-full border-collapse">
                  <thead><tr><th /><th>FIX</th><th>LIM</th><th>FID</th><th>LIV</th></tr></thead>
                  <tbody>
                    <tr><td className="font-semibold text-tinta">Qtd parcelas</td><td>44</td><td>88</td><td>99</td><td>*</td></tr>
                    <tr><td className="font-semibold text-tinta">Embutido</td><td>100%</td><td>50%</td><td>50%</td><td>50%</td></tr>
                    <tr><td className="font-semibold text-tinta">Próprio</td><td>0%</td><td>50%</td><td>50%</td><td>50%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* resumo do contrato (era o cartão da esquerda) */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1">
          {[
            ["Valor contratado", brl0(credito), "text-[18px]"],
            ["Parcela antes da contemplação", brl0(base.parcelaAntes), "text-[15px]"],
            ["Parcela para lance", brl0(base.parcelaLance), "text-[15px]"],
            ["Meses para terminar", String(GRUPO.faltam), "text-[15px]"],
            ["Meses decorridos", String(GRUPO.realizadas).padStart(2, "0"), "text-[15px]"],
            ["Taxa adm. mensal", p2(GRUPO.taxaAdm / GRUPO.faltam), "text-[15px]"],
          ].map(([r, v, t]) => (
            <div key={r} className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold tracking-wide text-tinta uppercase">{r}</span>
              <span className={`font-bold tabular-nums text-ouro ${t}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* SUGESTÃO 1 · simulador compacto: rótulos só à esquerda, prazo restante único */}
        <section aria-label="Simulador" className="flex flex-col gap-1 overflow-x-auto">
          <div className={`${grade} min-w-[900px]`}>
            <div className="flex flex-col justify-center rounded-md bg-lavanda px-2 py-1 leading-tight">
              <span className="text-[10px] font-bold tracking-wide text-tinta uppercase">Prazo restante</span>
              <span className="text-[16px] font-extrabold tabular-nums">{Math.max(0, base.prazoRestante)} meses</span>
            </div>
            {cols.map((c) => (
              <div key={c.tipo} className="flex min-h-[3.6rem] flex-col justify-center gap-0.5 rounded-md bg-[#d9d9d9] px-2 py-1 text-navy">
                <div className="flex items-center gap-1.5">
                  {c.numero && <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 border-navy text-[10px] font-extrabold leading-none">{c.numero}</span>}
                  <span className="text-[13px] leading-tight font-extrabold">{c.titulo}</span>
                </div>
                {c.qtd !== null ? (
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    <input
                      readOnly={c.fixa}
                      inputMode="numeric"
                      aria-label={`Parcelas do ${c.titulo}`}
                      value={qtds[c.tipo] ?? String(c.qtd)}
                      onChange={(e) => setQtds((q) => ({ ...q, [c.tipo]: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                      className={"h-[18px] w-9 rounded border border-borda-campo px-1 text-right text-[11px] font-bold tabular-nums outline-none focus:border-laranja " + (c.fixa ? "bg-linha" : "bg-white")}
                    />
                    parcelas · conc. {c.conc}%
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-tinta">sem lance</span>
                )}
              </div>
            ))}
          </div>

          {[
            { r: "Recurso da carta", v: (c: Calc) => din(c.recursoCarta), forte: false },
            { r: "Recurso próprio", v: (c: Calc) => din(c.recursoProprio), forte: false },
            { r: "Crédito disponível", v: (c: Calc) => din(c.creditoDisponivel), forte: true },
            { r: "Parcela após contemplação", v: (c: Calc) => din(c.parcelaApos), forte: true },
          ].map((l) => (
            <div key={l.r} className={`${grade} min-w-[900px]`}>
              <div className="flex items-center rounded-md bg-campo px-2 text-[11px] leading-tight font-bold">{l.r}</div>
              {cols.map((c) => (
                <div key={c.tipo} className={`${celula} h-8 rounded-md border border-borda bg-white ${l.forte ? "text-[16px] font-extrabold" : "text-[13px] font-bold"} text-ouro`}>
                  {c.bloqueada ? "—" : c.tipo === "SOR" && !l.forte ? "—" : c.calc ? l.v(c.calc) : "—"}
                </div>
              ))}
            </div>
          ))}

          <div className={`${grade} min-w-[900px]`}>
            <div className="flex items-center rounded-md bg-campo px-2 text-[11px] font-bold">Perfil</div>
            {cols.map((c) => (
              <div key={c.tipo} className={`flex h-7 items-center justify-center rounded-md px-1 text-center text-[11px] leading-tight font-bold ${c.cor}`}>
                {c.bloqueada ? `Libera em ${GRUPO.fidelidadeMeses} meses` : c.perfil}
              </div>
            ))}
          </div>

          {[
            { r: "Saldo devedor", v: (c: Calc) => din(c.saldoDevedor), forte: false },
            { r: "Valor investido", v: (c: Calc) => din(c.valorInvestido), forte: false },
            { r: "Dinheiro novo", v: (c: Calc) => din(c.dinheiroNovo), forte: true },
            { r: "Custo mensal", v: (c: Calc) => pc(c.custoMensal), forte: false },
            { r: "Custo anual", v: (c: Calc) => pc(c.custoAnual), forte: true },
          ].map((l, i, arr) => (
            <div key={l.r} className={`${grade} min-w-[900px] ${i === 0 ? "mt-0.5" : ""}`}>
              <div className={"flex h-6 items-center bg-navy px-2 text-[11px] font-bold text-ouro " + (i === 0 ? "rounded-t-md" : i === arr.length - 1 ? "rounded-b-md" : "")}>{l.r}</div>
              {cols.map((c) => (
                <div key={c.tipo} className={`${celula} h-6 bg-navy text-ouro ${l.forte ? "text-[13px] font-extrabold" : "text-[12px]"} ${i === 0 ? "rounded-t-md" : i === arr.length - 1 ? "rounded-b-md" : ""}`}>
                  {c.calc ? l.v(c.calc) : "—"}
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
