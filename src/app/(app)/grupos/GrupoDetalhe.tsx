import { nomeFamilia, type GrupoDetalhe } from "@/lib/grupos";
import { dataBR } from "@/lib/formato";
import { PagamentoComFuro, TiposParcela } from "./ParcelasEFuro";
import { FaixaCredito } from "./FaixaCredito";
import { InformacoesGrupo } from "./InformacoesGrupo";
import { SequenciaContemplacao } from "./SequenciaContemplacao";
import { ModalidadesContemplacao } from "./ModalidadesContemplacao";
import { SimuladorGrupo } from "./SimuladorGrupo";
import { SimulacaoProvider } from "./SimulacaoContext";

type Props = {
  grupo: GrupoDetalhe;
  indices: { sigla: string; nome: string }[];
  hoje: string;
  padroes: { incc: number; contemplacaoMeses: number };
};

function dataLocal(ts: string) {
  return new Date(ts).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function GrupoDetalheView({ grupo, indices, hoje, padroes }: Props) {
  const prazoCalculado = grupo.prazo_grupo_meses - (grupo.assembleia - 1);
  const prazoDiverge = prazoCalculado !== grupo.prazo_cota_meses;
  // a tabela vigente é da próxima assembleia enquanto a data dela não passou
  const realizadas = grupo.data_assembleia && grupo.data_assembleia >= hoje ? grupo.assembleia - 1 : grupo.assembleia;
  const faltam = Math.max(0, grupo.prazo_grupo_meses - realizadas);

  // parcela inicial do simulador: a menor entre as oferecidas (a menor reduzida; só Normal se não houver reduzida)
  const tipoInicial = grupo.tiposParcela.filter((t) => t.disponivel).sort((a, b) => a.pct - b.pct)[0];

  return (
    <SimulacaoProvider
      key={grupo.numero}
      creditoInicial={grupo.creditos[0] ?? null}
      tipoInicial={tipoInicial?.codigo ?? null}
      tipos={grupo.tiposParcela.map((t) => ({ codigo: t.codigo, descricao: t.descricao, pct: t.pct }))}
      furoInicial={grupo.pagamento_com_furo}
    >
    <div className="flex flex-col gap-4 border-t border-borda pt-4">

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
          <PagamentoComFuro key={`furo-${grupo.grupo_assembleia_id}`} versaoId={grupo.grupo_assembleia_id} />
          <TiposParcela key={`tipos-${grupo.grupo_assembleia_id}`} versaoId={grupo.grupo_assembleia_id} tipos={grupo.tiposParcela} />
        </div>

        <div className="flex flex-col gap-3">
        <SequenciaContemplacao
          key={`seq-${grupo.grupo_assembleia_id}`}
          versaoId={grupo.grupo_assembleia_id}
          modelo={grupo.sequencia.modelo}
          linha={grupo.sequencia.linha}
          faixas={grupo.sequencia.faixas}
          tipos={grupo.tiposContemplacao}
          fidelidadeMeses={grupo.fidelidade_meses}
        />

        <ModalidadesContemplacao
          modalidades={grupo.modalidades}
          tipos={grupo.tiposContemplacao}
          prazoGrupo={grupo.prazo_grupo_meses}
        />
        </div>

      </div>

      <SimuladorGrupo
        numero={grupo.numero}
        hoje={hoje}
        padroes={padroes}
        fidelidadeMeses={grupo.fidelidade_meses ? grupo.fidelidade_meses - 1 : null}
        mesesFaltam={faltam}
        mesesDecorridos={realizadas}
        taxaAdm={grupo.taxa_adm_total}
        prazoGrupo={grupo.prazo_grupo_meses}
        modalidades={grupo.modalidades}
      />
    </div>
    </SimulacaoProvider>
  );
}
