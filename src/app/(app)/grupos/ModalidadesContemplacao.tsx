import type { Modalidade } from "@/lib/grupos";

type Tipo = { codigo: string; nome: string; cor: string };

type Props = {
  modalidades: Modalidade[];
  tipos: Tipo[];
  prazoGrupo: number;
  /** veículos: lances em % da categoria */
  veiculo?: boolean;
};

// colunas fixas, nesta ordem
const COLUNAS = ["FIX", "LIM", "FID", "LIV"];
const COLUNAS_VEICULO = ["F25", "F40", "FID", "LIV"];

const DICA_ASTERISCO = "Qualquer quantidade de parcelas até o limite do plano";
const DICA_EMBUTIDO =
  "% do lance ofertado que pode ser embutido (descontado do crédito). Com lance abaixo do máximo, o embutido pode representar mais.";

// % do lance que pode ser embutido, calculado no lance máximo; sem limite de parcelas usa o prazo do grupo
function pctEmbutido(m: Modalidade, prazo: number): number {
  if (m.embutido_pct === null && m.embutido_max_parcelas === null) return 0;
  const porPct = m.embutido_pct === null ? 100 : Number(m.embutido_pct);
  const porParcelas = m.embutido_max_parcelas === null ? 100 : (100 * m.embutido_max_parcelas) / (m.max_parcelas_lance ?? prazo); // "aprox. 50 parcelas" de 99 = 50%
  return Math.floor(Math.min(100, porPct, porParcelas));
}

// veículos: lance em % da categoria. Lance = fixo (25/40) ou "até" o teto; embutido = % da categoria; próprio = lance − embutido.
function celulaVeiculo(m: Modalidade, teto: number | null) {
  const lance = m.lance_pct !== null ? Number(m.lance_pct) : null;
  const max = lance ?? teto;
  const qtd = lance !== null ? `${lance}%` : teto !== null ? `até ${teto}%` : "*";
  const fmt = (v: number) => `${String(Math.round(v * 100) / 100).replace(".", ",")}%`;
  if (m.embutido_pct === null) return { qtd, emb: "0%", proprio: max !== null ? fmt(max) : "—" };
  const pct = Number(m.embutido_pct);
  // regra em % do lance (PDF: "50% do valor ofertado"): embutido e próprio são partes do lance, sem conta
  if (m.embutido_base === "lance") return { qtd, emb: `${pct}% do lance`, proprio: `${Math.round((100 - pct) * 100) / 100}% do lance` };
  const emb = max !== null ? Math.min(pct, max) : pct;
  return { qtd, emb: fmt(emb), proprio: max !== null ? fmt(max - emb) : "—" };
}

export function ModalidadesContemplacao({ modalidades, tipos, prazoGrupo, veiculo }: Props) {
  const porTipo = new Map(modalidades.map((m) => [m.tipo, m]));
  const cadastro = new Map(tipos.map((t) => [t.codigo, t]));

  const celulas = (veiculo ? COLUNAS_VEICULO : COLUNAS).map((codigo) => {
    const m = porTipo.get(codigo);
    if (!m) return { codigo, m: null, qtd: "—", emb: "—", proprio: "—", asterisco: false };
    if (veiculo) {
      // o fidelidade segue o teto do livre
      const teto = m.max_lance_pct !== null ? Number(m.max_lance_pct) : codigo === "FID" && porTipo.get("LIV")?.max_lance_pct != null ? Number(porTipo.get("LIV")!.max_lance_pct) : null;
      return { codigo, m, ...celulaVeiculo(m, teto), asterisco: false };
    }
    const asterisco = m.max_parcelas_lance === null || m.max_parcelas_lance >= prazoGrupo;
    const emb = pctEmbutido(m, prazoGrupo);
    return {
      codigo,
      m,
      qtd: asterisco ? "*" : String(m.max_parcelas_lance),
      emb: `${emb}%`,
      proprio: `${100 - emb}%`,
      asterisco,
    };
  });

  return (
    <section className="flex w-[16.5rem] flex-col gap-1.5 rounded-2xl border border-borda bg-white p-3.5">
      <h3 className="text-sm leading-tight font-bold">Modalidades de contemplação</h3>
      <table className="tabela-sm w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: "4.6rem" }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            {celulas.map((c) => {
              const t = cadastro.get(c.codigo);
              return (
                <th key={c.codigo} className="!text-center !text-xs !font-bold" style={{ color: t?.cor }}>
                  {(t?.nome ?? c.codigo).replace(/^Lance\s+/i, "")}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-semibold text-tinta">{veiculo ? "Percentual Categoria" : "Qtd Parcelas"}</td>
            {celulas.map((c) => (
              <td key={c.codigo} className="!px-1 text-center tabular-nums" title={c.asterisco ? DICA_ASTERISCO : undefined}>
                {c.qtd}
              </td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-tinta" title={DICA_EMBUTIDO}>
              Embutido
            </td>
            {celulas.map((c) => (
              <td key={c.codigo} className="!px-1 text-center tabular-nums">
                {c.emb}
              </td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-tinta">Próprio</td>
            {celulas.map((c) => (
              <td key={c.codigo} className="!px-1 text-center tabular-nums">
                {c.proprio}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}
