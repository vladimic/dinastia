import { ehLance, nomeFamilia, type GrupoDetalhe, type Modalidade } from "@/lib/grupos";
import { dataBR, pct } from "@/lib/formato";
import { PagamentoComFuro, TiposParcela } from "./ParcelasEFuro";
import { FaixaCredito } from "./FaixaCredito";
import { InformacoesGrupo } from "./InformacoesGrupo";
import { SequenciaContemplacao } from "./SequenciaContemplacao";

type Props = {
  grupo: GrupoDetalhe;
  indices: { sigla: string; nome: string }[];
  hoje: string;
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

function dataLocal(ts: string) {
  return new Date(ts).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function GrupoDetalheView({ grupo, indices, hoje }: Props) {
  const prazoCalculado = grupo.prazo_grupo_meses - (grupo.assembleia - 1);
  const prazoDiverge = prazoCalculado !== grupo.prazo_cota_meses;
  // a tabela vigente é da próxima assembleia enquanto a data dela não passou
  const realizadas = grupo.data_assembleia && grupo.data_assembleia >= hoje ? grupo.assembleia - 1 : grupo.assembleia;
  const faltam = Math.max(0, grupo.prazo_grupo_meses - realizadas);

  return (
    <div key={grupo.numero} className="flex flex-col gap-4 border-t border-borda pt-4">

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
      </div>

      {prazoDiverge && (
        <p className="text-xs font-semibold text-alerta">
          Atenção: prazo da cota na tabela é {grupo.prazo_cota_meses} meses; pela regra (prazo − assembleia + 1) daria {prazoCalculado}.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <InformacoesGrupo
          numero={grupo.numero}
          participantes={grupo.participantes}
          taxaAdm={grupo.taxa_adm_total}
          fundoReserva={grupo.fundo_reserva}
          indice={grupo.indice}
          mesReajuste={grupo.mes_reajuste}
          diaVencimento={grupo.dia_vencimento}
          primeiraCorrecao={grupo.primeira_correcao}
          indices={indices}
        />

        <FaixaCredito key={`cred-${grupo.grupo_assembleia_id}`} versaoId={grupo.grupo_assembleia_id} creditos={grupo.creditos} />

        <div className="flex flex-col gap-3">
          <PagamentoComFuro key={`furo-${grupo.grupo_assembleia_id}`} versaoId={grupo.grupo_assembleia_id} valor={grupo.pagamento_com_furo} />
          <TiposParcela key={`tipos-${grupo.grupo_assembleia_id}`} versaoId={grupo.grupo_assembleia_id} tipos={grupo.tiposParcela} />
        </div>

        <SequenciaContemplacao
          key={`seq-${grupo.grupo_assembleia_id}`}
          versaoId={grupo.grupo_assembleia_id}
          modelo={grupo.sequencia.modelo}
          linha={grupo.sequencia.linha}
          faixas={grupo.sequencia.faixas}
          tipos={grupo.tiposContemplacao}
          fidelidadeMeses={grupo.fidelidade_meses}
        />

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
    </div>
  );
}
