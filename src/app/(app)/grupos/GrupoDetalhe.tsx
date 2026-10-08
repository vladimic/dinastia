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
    <label className="grid grid-cols-[1fr_1.15fr] items-center gap-2 text-xs font-semibold text-tinta">
      {rotulo}
      {children}
    </label>
  );
}

function Info({ rotulo, valor, destaque }: { rotulo: string; valor: React.ReactNode; destaque?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-linha py-1.5 text-[13px] last:border-0">
      <span className="text-xs font-semibold text-tinta">{rotulo}</span>
      <span className={"font-bold tabular-nums " + (destaque ? "text-laranja" : "")}>{valor}</span>
    </div>
  );
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold">
            Grupo {grupo.numero} · {nomeFamilia(grupo.familia)}
          </h2>
          <span className="rounded-full bg-lavanda px-2.5 py-0.5 text-xs font-semibold text-navy-2">
            {grupo.totalVersoes} {grupo.totalVersoes === 1 ? "versão" : "versões"}
          </span>
          {grupo.arquivo && (
            <span className="text-xs text-tinta">
              Origem: {grupo.arquivo}
              {grupo.aprovado_em ? ` · importado em ${dataBR(grupo.aprovado_em)}` : ""}
            </span>
          )}
        </div>
        <button type="submit" className="min-h-10 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy">
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

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="cartao gap-2 p-4">
          <h3 className="text-sm font-bold">Dados do grupo</h3>
          <Linha rotulo="Grupo">
            <input className="campo-sm" value={grupo.numero} readOnly />
          </Linha>
          <Linha rotulo="Família">
            <input className="campo-sm" value={nomeFamilia(grupo.familia)} readOnly />
          </Linha>
          <Linha rotulo="Prazo do grupo (meses)">
            <input className="campo-sm" name="prazo_grupo_meses" inputMode="numeric" defaultValue={grupo.prazo_grupo_meses} required />
          </Linha>
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
              placeholder="Não informado"
            />
          </Linha>
          <Linha rotulo="Seguro (% ao mês)">
            <input className="campo-sm" name="seguro_pct_mes" inputMode="decimal" defaultValue={pct(grupo.seguro_pct_mes, 4)} />
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
          {grupo.primeira_correcao && (
            <Linha rotulo="1ª correção">
              <input
                className="campo-sm"
                readOnly
                value={`${MESES[Number(grupo.primeira_correcao.slice(5, 7)) - 1]}/${grupo.primeira_correcao.slice(0, 4)}`}
              />
            </Linha>
          )}
          <Linha rotulo="Dia de vencimento">
            <input className="campo-sm" name="dia_vencimento" inputMode="numeric" defaultValue={grupo.dia_vencimento ?? ""} />
          </Linha>
        </section>

        <section className="cartao gap-1 p-4">
          <h3 className="mb-1 text-sm font-bold">Assembleia</h3>
          <Info rotulo="Assembleia da tabela" valor={`${grupo.assembleia}ª`} />
          <Info rotulo="Data" valor={dataBR(grupo.data_assembleia) || "—"} />
          <Info rotulo="Total de assembleias" valor={grupo.prazo_grupo_meses} />
          <Info rotulo="Realizadas" valor={realizadas} />
          <Info rotulo="Faltam" valor={faltam} destaque />
          <Info rotulo="Prazo da cota (meses)" valor={grupo.prazo_cota_meses} />
          {prazoDiverge && (
            <p className="mt-1 text-xs font-semibold text-alerta">
              Pela regra (prazo − assembleia + 1) daria {prazoCalculado} meses; a tabela informa {grupo.prazo_cota_meses}.
            </p>
          )}
          <h3 className="mt-3 mb-1 text-sm font-bold">Tipos de parcela</h3>
          <div className="flex flex-wrap gap-1.5">
            {grupo.tiposParcela.map((t) => (
              <span key={t.codigo} className="rounded-md bg-lavanda px-2 py-1 text-xs font-semibold">
                {t.descricao} · {pct(t.pct, 0)}
              </span>
            ))}
          </div>
        </section>

        <section className="cartao gap-2 p-4">
          <h3 className="text-sm font-bold">
            Valores de crédito <span className="font-normal text-tinta">({grupo.creditos.length})</span>
          </h3>
          <ul className="grid max-h-[360px] grid-cols-2 gap-1.5 overflow-y-auto">
            {grupo.creditos.map((c) => (
              <li key={c} className="rounded-md border border-[#ece8de] px-2.5 py-1.5 text-right text-[13px] font-bold tabular-nums">
                {reais(c)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cartao">
        <h3 className="text-base font-bold">Modalidades de contemplação</h3>
        <p className="text-xs text-tinta">
          Categoria = fundo comum + taxa de administração + fundo de reserva. Parcela de lance = categoria ÷ prazo
          original do grupo ({grupo.prazo_grupo_meses}).
        </p>
        <div className="overflow-x-auto">
          <table className="tabela w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th>Modalidade</th>
                <th className="num">Máx. lance</th>
                <th className="num">% categoria</th>
                <th>Embutido permitido</th>
                <th>Recursos próprios</th>
                <th>Disponível</th>
              </tr>
            </thead>
            <tbody>
              {grupo.modalidades.map((m) => {
                const lance = ehLance(m.tipo);
                return (
                  <tr key={m.tipo} className={m.a_partir_assembleia_cota > 1 ? "bg-[#fbf7ee]" : ""}>
                    <td className="font-semibold">{m.tipo_contemplacao.nome}</td>
                    <td className="num">
                      {!lance ? "—" : m.max_parcelas_lance === null ? "Livre" : `${m.max_parcelas_lance} parcelas`}
                    </td>
                    <td className="num">{m.pct_categoria === null ? "—" : pct(m.pct_categoria, 0)}</td>
                    <td>{textoEmbutido(m)}</td>
                    <td>{textoRecursoProprio(m)}</td>
                    <td>{textoDisponivel(m)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-5">
        <section className="cartao flex-[2_1_480px]">
          <h3 className="text-base font-bold">Sequência de contemplação por assembleia</h3>
          {grupo.sequencia.map((f) => (
            <div key={f.de} className="flex flex-col gap-2">
              <div className="text-xs font-bold text-tinta">
                {f.de}ª a {f.ate}ª assembleia
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {f.itens.map((i) => (
                  <span
                    key={i.ordem}
                    className={
                      "rounded-lg px-2.5 py-1.5 " +
                      (i.codigo === "LANCE_FIDELIDADE" ? "bg-ouro-claro" : ehLance(i.codigo) ? "bg-laranja-claro" : "bg-lavanda")
                    }
                  >
                    {i.ordem} · {i.qtd > 1 ? `${i.qtd}× ` : ""}
                    {i.nome}
                  </span>
                ))}
              </div>
              <div className="text-xs text-tinta">
                Demais contemplações:{" "}
                {f.demais ? <strong className="text-navy">{f.demais}</strong> : "repetem a mesma sequência"}
              </div>
            </div>
          ))}
        </section>

        {grupo.observacoes && (
          <section className="cartao flex-[1_1_300px]">
            <h3 className="text-base font-bold">Observações da tabela</h3>
            <p className="text-[13px] leading-relaxed text-[#2b2550]">{grupo.observacoes}</p>
          </section>
        )}
      </div>
    </form>
  );
}
