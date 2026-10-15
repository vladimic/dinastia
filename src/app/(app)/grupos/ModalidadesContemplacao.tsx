import type { Modalidade } from "@/lib/grupos";

type Tipo = { codigo: string; nome: string; cor: string };

type Props = {
  modalidades: Modalidade[];
  tipos: Tipo[];
  prazoGrupo: number;
};

// colunas fixas, nesta ordem
const COLUNAS = ["FIX", "LIM", "FID", "LIV"];

const DICA_ASTERISCO = "Qualquer quantidade de parcelas até o limite do plano";
const DICA_EMBUTIDO =
  "% do lance ofertado que pode ser embutido (descontado do crédito). Com lance abaixo do máximo, o embutido pode representar mais.";

// % do lance que pode ser embutido, calculado no lance máximo; sem limite de parcelas usa o prazo do grupo
function pctEmbutido(m: Modalidade, prazo: number): number {
  if (m.embutido_pct === null) return 0;
  if (m.embutido_base === "ofertado") return Math.round(Number(m.embutido_pct));
  if (m.embutido_max_parcelas === null) return Math.round(Number(m.embutido_pct));
  return Math.floor((100 * m.embutido_max_parcelas) / (m.max_parcelas_lance ?? prazo)); // "aprox. 50 parcelas" de 99 = 50%
}

export function ModalidadesContemplacao({ modalidades, tipos, prazoGrupo }: Props) {
  const porTipo = new Map(modalidades.map((m) => [m.tipo, m]));
  const cadastro = new Map(tipos.map((t) => [t.codigo, t]));

  const celulas = COLUNAS.map((codigo) => {
    const m = porTipo.get(codigo);
    if (!m) return { codigo, m: null, qtd: "—", emb: "—", proprio: "—", asterisco: false };
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
    <section className="flex w-0 min-w-full flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
      <h3 className="text-sm font-bold">Modalidades de contemplação</h3>
      <table className="tabela-sm w-full table-fixed border-collapse">
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
            <td className="font-semibold text-tinta">Qtd Parcelas</td>
            {celulas.map((c) => (
              <td key={c.codigo} className="text-center tabular-nums" title={c.asterisco ? DICA_ASTERISCO : undefined}>
                {c.qtd}
              </td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-tinta" title={DICA_EMBUTIDO}>
              Embutido
            </td>
            {celulas.map((c) => (
              <td key={c.codigo} className="text-center tabular-nums">
                {c.emb}
              </td>
            ))}
          </tr>
          <tr>
            <td className="font-semibold text-tinta">Próprio</td>
            {celulas.map((c) => (
              <td key={c.codigo} className="text-center tabular-nums">
                {c.proprio}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}
