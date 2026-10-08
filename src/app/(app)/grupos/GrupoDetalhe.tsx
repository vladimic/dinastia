import { ehLance, nomeFamilia, type GrupoDetalhe, type Modalidade } from "@/lib/grupos";
import { dataBR, MESES, milhar, pct, reais } from "@/lib/formato";
import { salvarGrupo } from "./actions";

type Props = {
  grupo: GrupoDetalhe;
  indices: { sigla: string; nome: string }[];
  hoje: string;
  salvo: boolean;
  erro: boolean;
};

function textoEmbutido(m: Modalidade) {
  if (!ehLance(m.tipo)) return "—";
  if (m.embutido_pct === null) return "Não";
  const aprox = m.embutido_texto?.includes("aprox") ? "aprox. " : "";
  const base = m.embutido_base === "categoria" ? "da categoria" : "do ofertado";
  return m.embutido_max_parcelas !== null
    ? `${aprox}${m.embutido_max_parcelas} parcelas (${pct(m.embutido_pct, 0)} ${base})`
    : `${pct(m.embutido_pct, 0)} ${base}`;
}

function textoRecursoProprio(m: Modalidade) {
  if (!ehLance(m.tipo) || !m.recurso_proprio_obrig) return "—";
  if (m.embutido_pct === null) return "100% do ofertado";
  if (m.embutido_base === "ofertado" && m.embutido_max_parcelas === null)
    return `${pct(100 - Number(m.embutido_pct), 0)} do ofertado`;
  return "O restante";
}

function textoDisponivel(m: Modalidade) {
  const partes = [m.a_partir_assembleia_cota <= 1 ? "Desde a 1ª" : `${m.a_partir_assembleia_cota}ª assembleia da cota`];
  if (m.a_partir_assembleia_cota > 1 && m.requisitos) partes.push(m.requisitos);
  if (!m.transferivel) partes.push("não transfere com a cota");
  return partes.join(" · ");
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[1fr_6rem] items-center gap-2 text-xs font-semibold text-tinta">
      {rotulo}
      {children}
    </label>
  );
}

function dataLocal(ts: string) {
  return new Date(ts).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function GrupoDetalheView({ grupo, indices, hoje, salvo, erro }: Props) {
  const prazoCalculado = grupo.prazo_grupo_meses - (grupo.assembleia - 1);
  const prazoDiverge = prazoCalculado !== grupo.prazo_cota_meses;
  // a tabela vigente é da próxima assembleia enquanto a data dela não passou
  const realizadas = grupo.data_assembleia && grupo.data_assembleia >= hoje ? grupo.assembleia - 1 : grupo.assembleia;
  const faltam = Math.max(0, grupo.prazo_grupo_meses - realizadas);

  return (
    <form action={salvarGrupo} className="flex flex-col gap-4 border-t border-borda pt-4">
      <input type="hidden" name="numero" value={grupo.numero} />
      <input type="hidden" name="familia" value={grupo.familia} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
          <h2 className="text-lg font-bold">
            Grupo {grupo.numero} · {nomeFamilia(grupo.familia)}
          </h2>
          <span>
            <span className="text-tinta">Assembleia atual: </span>
            <strong>
              {grupo.assembleia}
              {grupo.data_assembleia ? ` – ${dataBR(grupo.data_assembleia)}` : ""}
            </strong>
          </span>
          <div
            className="flex items-end gap-2 self-center"
            title={`${realizadas} de ${grupo.prazo_grupo_meses} assembleias realizadas · faltam ${faltam}`}
          >
            <div className="w-72">
              <div className="mb-0.5 flex justify-between text-[11px] leading-none">
                <span className="font-bold text-laranja">
                  {realizadas} {realizadas === 1 ? "realizada" : "realizadas"}
                </span>
                <span className="text-tinta">
                  <strong className="text-navy">{faltam}</strong> faltam
                </span>
              </div>
              <div
                className="relative h-2 overflow-hidden rounded-full bg-lavanda"
                role="img"
                aria-label={`${realizadas} de ${grupo.prazo_grupo_meses} assembleias realizadas`}
              >
                <div
                  className="absolute inset-y-0 left-0 min-w-1.5 rounded-full bg-laranja"
                  style={{ width: `${Math.min(100, (realizadas / grupo.prazo_grupo_meses) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold leading-none tabular-nums">{grupo.prazo_grupo_meses}</span>
          </div>
          {grupo.atualizado_em && (
            <span className="text-xs text-tinta" title={grupo.arquivo ? `Tabela: ${grupo.arquivo}` : undefined}>
              (atualizado em: {dataLocal(grupo.atualizado_em)})
            </span>
          )}
        </div>
        <button type="submit" className="min-h-9 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95">
          Salvar grupo
        </button>
      </div>

      {salvo && (
        <p role="status" className="rounded-lg bg-ok-fundo px-4 py-2 text-sm font-semibold text-ok">
          Grupo salvo.
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-4 py-2 text-sm font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Confira os campos e tente de novo.
        </p>
      )}
      {prazoDiverge && (
        <p className="text-xs font-semibold text-alerta">
          Atenção: prazo da cota na tabela é {grupo.prazo_cota_meses} meses; pela regra (prazo − assembleia + 1) daria {prazoCalculado}.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <section className="flex w-[15.5rem] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
          <h3 className="text-sm font-bold">Informações do grupo</h3>
          <Linha rotulo="Participantes">
            <input className="campo-sm" name="participantes" inputMode="numeric" defaultValue={milhar(grupo.participantes)} />
          </Linha>
          <Linha rotulo="Taxa de adm. total">
            <input className="campo-sm" name="taxa_adm_total" inputMode="decimal" defaultValue={pct(grupo.taxa_adm_total)} />
          </Linha>
          <Linha rotulo="Fundo de reserva">
            <input
              className={"campo-sm " + (grupo.fundo_reserva === null ? "border-alerta-borda bg-alerta-fundo" : "")}
              name="fundo_reserva"
              inputMode="decimal"
              defaultValue={pct(grupo.fundo_reserva)}
              placeholder="—"
            />
          </Linha>
          <Linha rotulo="Índice de correção">
            <select className="campo-sm" name="indice" defaultValue={grupo.indice ?? ""}>
              <option value="">—</option>
              {indices.map((i) => (
                <option key={i.sigla} value={i.sigla}>
                  {i.sigla}
                </option>
              ))}
            </select>
          </Linha>
          <Linha rotulo="Reajuste anual em">
            <select className="campo-sm" name="mes_reajuste" defaultValue={grupo.mes_reajuste ?? ""}>
              <option value="">—</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Linha>
          <Linha rotulo="Dia de vencimento">
            <input className="campo-sm" name="dia_vencimento" inputMode="numeric" defaultValue={grupo.dia_vencimento ?? ""} />
          </Linha>
          {grupo.primeira_correcao && (
            <Linha rotulo="1ª correção">
              <input
                className="campo-sm"
                readOnly
                value={`${MESES[Number(grupo.primeira_correcao.slice(5, 7)) - 1]}/${grupo.primeira_correcao.slice(0, 4)}`}
              />
            </Linha>
          )}
        </section>

        <section className="flex w-[15.5rem] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
          <h3 className="text-sm font-bold">Faixa de crédito</h3>
          <ul className="flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1">
            {grupo.creditos.map((c) => (
              <li key={c} className="rounded-md border border-[#ece8de] px-2.5 py-0.5 text-right text-[13px] font-bold tabular-nums">
                {reais(c)}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex w-fit max-w-[230px] flex-col gap-3 rounded-2xl border border-borda bg-white p-3.5">
          <h3 className="text-sm font-bold">Sequência de contemplação</h3>
          {grupo.sequencia.map((f) => (
            <div key={f.de} className="flex flex-col gap-1">
              <div className="text-xs font-bold text-tinta">
                {f.de}ª a {f.ate}ª assembleia
              </div>
              <ol className="flex flex-col gap-0.5 text-xs">
                {f.itens.map((i) => (
                  <li key={i.ordem} className="flex items-center gap-1.5">
                    <span
                      className={
                        "inline-block h-2 w-2 shrink-0 rounded-full " +
                        (i.codigo === "FID" ? "bg-ouro" : ehLance(i.codigo) ? "bg-laranja" : "bg-navy-3")
                      }
                      aria-hidden="true"
                    />
                    <span className="tabular-nums text-tinta">{i.ordem}.</span>
                    <span className="font-semibold">
                      {i.qtd > 1 ? `${i.qtd}× ` : ""}
                      {i.nome}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="text-xs text-tinta">
                Demais: {f.demais ? <strong className="text-navy">{f.demais}</strong> : "mesma sequência"}
              </div>
            </div>
          ))}
        </section>

        <section className="flex w-fit max-w-[430px] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
          <h3 className="text-sm font-bold">Modalidades de contemplação</h3>
          <table className="tabela-sm border-collapse">
            <thead>
              <tr>
                <th>Modalidade</th>
                <th className="num">Lance máx.</th>
                <th>Embutido</th>
              </tr>
            </thead>
            <tbody>
              {grupo.modalidades.map((m) => {
                const lance = ehLance(m.tipo);
                const rp = textoRecursoProprio(m);
                return (
                  <tr key={m.tipo}>
                    <td>
                      <div className="font-semibold">{m.tipo_contemplacao.nome}</div>
                      {(m.a_partir_assembleia_cota > 1 || !m.transferivel) && (
                        <div className="text-[11px] text-alerta" title={m.requisitos ?? undefined}>
                          {textoDisponivel(m)}
                        </div>
                      )}
                    </td>
                    <td className="num whitespace-nowrap">
                      {!lance
                        ? "—"
                        : m.max_parcelas_lance === null
                          ? "Livre"
                          : `${m.max_parcelas_lance} parc.${m.pct_categoria !== null ? ` · ${pct(m.pct_categoria, 0)}` : ""}`}
                    </td>
                    <td className="max-w-[170px]">
                      {textoEmbutido(m)}
                      {lance && rp !== "—" && <div className="text-[11px] text-tinta">+ próprios: {rp}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] leading-snug text-tinta">
            % sobre a categoria (crédito + taxa + fundo de reserva). Parcela de lance = categoria ÷ {grupo.prazo_grupo_meses}.
          </p>
        </section>
      </div>
    </form>
  );
}
