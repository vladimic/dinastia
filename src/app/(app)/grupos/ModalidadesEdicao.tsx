"use client";

import { useState, useTransition } from "react";
import type { Modalidade } from "@/lib/grupos";
import { lerPct } from "@/lib/formato";
import { salvarModalidadeGrupo, type CamposModalidade } from "./actions";
import { COLUNAS, COLUNAS_VEICULO, celulaVeiculo, pctEmbutido } from "./ModalidadesContemplacao";
import { useDados } from "./GrupoDetalhe";

// "Modalidades de contemplação" em Modo Edição: o mesmo quadro, com os campos que o usuário pode corrigir.
// Imóveis: quantidade de parcelas do lance e % do embutido. Veículos: teto do lance (livre e fidelidade), % do embutido e sua base.
// Cada alteração grava ao sair do campo; "Próprio" é só o resultado (lance − embutido).

const campo = "h-7 w-full min-w-0 rounded-md border border-borda-campo bg-white px-1 text-center text-[13px] font-semibold tabular-nums outline-none focus:border-laranja";
const vazioParaNulo = (t: string) => (t.trim() === "" || t.trim() === "*" ? null : t);

export function ModalidadesEdicao() {
  const { grupo: g } = useDados();
  const veiculo = g.familia === "veiculos";
  const [mods, setMods] = useState<Modalidade[]>(g.modalidades);
  const [texto, setTexto] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"ocioso" | "salvando" | "salvo" | string>("ocioso");
  const [, iniciar] = useTransition();
  const porTipo = new Map(mods.map((m) => [m.tipo, m]));
  const cadastro = new Map(g.tiposContemplacao.map((t) => [t.codigo, t]));
  const colunas = veiculo ? COLUNAS_VEICULO : COLUNAS;

  const chave = (tipo: string, c: string) => `${tipo}.${c}`;
  const valorDe = (tipo: string, c: string, padrao: string) => texto[chave(tipo, c)] ?? padrao;

  function gravar(tipo: string, mudanca: CamposModalidade) {
    setEstado("salvando");
    iniciar(async () => {
      const r = await salvarModalidadeGrupo(g.grupo_assembleia_id, tipo, mudanca);
      if (r.ok) {
        setMods((ms) => ms.map((m) => (m.tipo === tipo ? ({ ...m, ...mudanca } as Modalidade) : m)));
        setEstado("salvo");
      } else setEstado(r.erro);
      setTexto((t) => Object.fromEntries(Object.entries(t).filter(([k]) => !k.startsWith(`${tipo}.`))));
    });
  }

  const nomeCurto = (codigo: string) => (cadastro.get(codigo)?.nome ?? codigo).replace(/^Lance\s+/i, "");
  const numero = (t: string | null) => (t === null ? null : lerPct(t));

  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-laranja/50 bg-white p-4 shadow-[0_0_0_3px_var(--color-laranja-claro)]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">Modalidades de contemplação</h3>
        <span role="status" aria-live="polite" className={"text-[11px] font-semibold " + (estado === "salvo" ? "text-ok" : estado === "salvando" || estado === "ocioso" ? "text-tinta" : "text-[#9b1c1c]")}>
          {estado === "salvando" ? "Salvando…" : estado === "salvo" ? "Salvo ✓" : estado === "ocioso" ? "" : estado}
        </span>
      </div>
      <table className="w-full table-fixed border-separate border-spacing-x-1 border-spacing-y-1.5 text-[13px]">
        <colgroup>
          <col style={{ width: "5.6rem" }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            {colunas.map((c) => (
              <th key={c} className="text-center text-xs font-bold" style={{ color: cadastro.get(c)?.cor }}>
                {nomeCurto(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-semibold text-tinta">{veiculo ? "Percentual Categoria" : "Qtd Parcelas"}</td>
            {colunas.map((c) => {
              const m = porTipo.get(c);
              if (!m) return <td key={c} className="text-center text-tinta">—</td>;
              // veículos: o lance fixo (25% ou 40%) define a modalidade e não se altera; livre e fidelidade têm teto
              if (veiculo && m.lance_pct !== null) return <td key={c} className="text-center font-semibold tabular-nums">{Number(m.lance_pct)}%</td>;
              const campoQtd = veiculo ? "max_lance_pct" : "max_parcelas_lance";
              const atual = m[campoQtd] === null ? "*" : String(Number(m[campoQtd]));
              return (
                <td key={c}>
                  <input
                    className={campo}
                    inputMode="decimal"
                    aria-label={`${nomeCurto(c)}: ${veiculo ? "teto do lance (% da categoria)" : "quantidade de parcelas do lance"}`}
                    title="Em branco ou * = sem limite"
                    value={valorDe(c, campoQtd, atual)}
                    onChange={(e) => setTexto((t) => ({ ...t, [chave(c, campoQtd)]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    onBlur={(e) => {
                      const n = numero(vazioParaNulo(e.target.value));
                      if (n === (m[campoQtd] === null ? null : Number(m[campoQtd]))) return setTexto((t) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== chave(c, campoQtd))));
                      gravar(c, { [campoQtd]: n } as CamposModalidade);
                    }}
                  />
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="font-semibold text-tinta">Embutido{veiculo ? " (%)" : " (% do lance)"}</td>
            {colunas.map((c) => {
              const m = porTipo.get(c);
              if (!m) return <td key={c} className="text-center text-tinta">—</td>;
              const atual = m.embutido_pct === null ? "" : String(Number(m.embutido_pct));
              return (
                <td key={c}>
                  <div className="flex flex-col gap-1">
                    <input
                      className={campo}
                      inputMode="decimal"
                      aria-label={`${nomeCurto(c)}: embutido (%)`}
                      title="Em branco = sem embutido"
                      value={valorDe(c, "embutido_pct", atual)}
                      onChange={(e) => setTexto((t) => ({ ...t, [chave(c, "embutido_pct")]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      onBlur={(e) => {
                        const n = numero(vazioParaNulo(e.target.value));
                        if (n === (m.embutido_pct === null ? null : Number(m.embutido_pct))) return setTexto((t) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== chave(c, "embutido_pct"))));
                        gravar(c, { embutido_pct: n });
                      }}
                    />
                    {veiculo && (
                      <select
                        className="h-6 w-full rounded-md border border-borda-campo bg-white px-0.5 text-[11px] font-semibold"
                        aria-label={`${nomeCurto(c)}: base do embutido`}
                        value={m.embutido_base}
                        onChange={(e) => gravar(c, { embutido_base: e.target.value as "lance" | "categoria" })}
                      >
                        <option value="categoria">% categ.</option>
                        <option value="lance">% lance</option>
                      </select>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="font-semibold text-tinta">Próprio</td>
            {colunas.map((c) => {
              const m = porTipo.get(c);
              if (!m) return <td key={c} className="text-center text-tinta">—</td>;
              const teto = m.max_lance_pct !== null ? Number(m.max_lance_pct) : c === "FID" && porTipo.get("LIV")?.max_lance_pct != null ? Number(porTipo.get("LIV")!.max_lance_pct) : null;
              const proprio = veiculo ? celulaVeiculo(m, teto).proprio : `${100 - pctEmbutido(m, g.prazo_grupo_meses)}%`;
              return <td key={c} className="text-center font-semibold tabular-nums">{proprio}</td>;
            })}
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] leading-snug text-tinta">
        Em branco ou * = sem limite. {veiculo ? "O lance fixo (25% e 40%) vem da modalidade e não se altera." : ""} A próxima importação do PDF do grupo substitui estes valores.
      </p>
    </section>
  );
}
