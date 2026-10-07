import { ehLance, nomeFamilia, type GrupoDetalhe, type Modalidade } from "@/lib/grupos";
import { dataBR, MESES, milhar, pct, reais } from "@/lib/formato";
import { salvarGrupo } from "./actions";

type Props = {
  grupo: GrupoDetalhe;
  indices: { sigla: string; nome: string }[];
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

export function GrupoDetalheView({ grupo, indices, salvo, erro }: Props) {
  const prazoCalculado = grupo.prazo_grupo_meses - (grupo.assembleia - 1);
  const prazoDiverge = prazoCalculado !== grupo.prazo_cota_meses;

  return (
    <form action={salvarGrupo} className="flex flex-col gap-5 border-t border-borda pt-[22px]">
      <input type="hidden" name="numero" value={grupo.numero} />
      <input type="hidden" name="familia" value={grupo.familia} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[22px] font-bold">
            Grupo {grupo.numero} · {nomeFamilia(grupo.familia)}
          </h2>
          <span className="rounded-full bg-ouro-claro px-2.5 py-1 text-xs font-semibold text-ouro-texto">
            Versão vigente: {grupo.assembleia}ª assembleia{grupo.data_assembleia ? ` · ${dataBR(grupo.data_assembleia)}` : ""}
          </span>
          <span className="rounded-full bg-lavanda px-2.5 py-1 text-xs font-semibold text-navy-2">
            {grupo.totalVersoes} {grupo.totalVersoes === 1 ? "versão" : "versões"}
          </span>
        </div>
        <button type="submit" className="min-h-11 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy">
          Salvar grupo
        </button>
      </div>

      {salvo && (
        <p role="status" className="rounded-lg bg-ok-fundo px-4 py-2.5 text-sm font-semibold text-ok">
          Grupo salvo.
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-4 py-2.5 text-sm font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Confira os campos e tente de novo.
        </p>
      )}
      {grupo.arquivo && (
        <div className="rounded-lg border border-[#efe4c8] bg-[#fbf7ee] px-4 py-2.5 text-[13px] text-[#5c4510]">
          <span className="font-bold">Origem da versão:</span> {grupo.arquivo}
          {grupo.aprovado_em ? ` · importado em ${dataBR(grupo.aprovado_em)}` : ""}
        </div>
      )}

      <section className="cartao">
        <h3 className="text-base font-bold">Dados do grupo</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
          <label className="rotulo">
            Número do grupo
            <input className="campo" value={grupo.numero} readOnly />
          </label>
          <label className="rotulo">
            Família
            <input className="campo" value={nomeFamilia(grupo.familia)} readOnly />
          </label>
          <label className="rotulo">
            Prazo do grupo (meses)
            <input className="campo" name="prazo_grupo_meses" inputMode="numeric" defaultValue={grupo.prazo_grupo_meses} required />
          </label>
          <label className="rotulo">
            Participantes
            <input className="campo" name="participantes" inputMode="numeric" defaultValue={milhar(grupo.participantes)} />
          </label>
          <label className="rotulo">
            Taxa de administração total
            <input className="campo" name="taxa_adm_total" inputMode="decimal" defaultValue={pct(grupo.taxa_adm_total)} />
          </label>
          <label className="rotulo">
            Fundo de reserva
            <input
              className={"campo " + (grupo.fundo_reserva === null ? "border-alerta-borda bg-alerta-fundo" : "")}
              name="fundo_reserva"
              inputMode="decimal"
              defaultValue={pct(grupo.fundo_reserva)}
              placeholder="Não informado na tabela"
            />
          </label>
          <label className="rotulo">
            Seguro prestamista (% ao mês)
            <input className="campo" name="seguro_pct_mes" inputMode="decimal" defaultValue={pct(grupo.seguro_pct_mes, 4)} />
          </label>
          <label className="rotulo">
            Índice de correção
            <select className="campo" name="indice" defaultValue={grupo.indice ?? ""}>
              <option value="">—</option>
              {indices.map((i) => (
                <option key={i.sigla} value={i.sigla}>
                  {i.sigla}
                </option>
              ))}
            </select>
          </label>
          <label className="rotulo">
            Reajuste anual em
            <select className="campo" name="mes_reajuste" defaultValue={grupo.mes_reajuste ?? ""}>
              <option value="">—</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {grupo.primeira_correcao && (
            <label className="rotulo">
              1ª correção
              <input
                className="campo"
                readOnly
                value={`${MESES[Number(grupo.primeira_correcao.slice(5, 7)) - 1]} de ${grupo.primeira_correcao.slice(0, 4)}`}
              />
            </label>
          )}
          <label className="rotulo">
            Dia de vencimento
            <input className="campo" name="dia_vencimento" inputMode="numeric" defaultValue={grupo.dia_vencimento ?? ""} />
          </label>
        </div>
      </section>

      <section className="cartao">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold">Versão vigente · {grupo.assembleia}ª assembleia</h3>
          <span className="text-xs text-tinta">Dados da tabela importada. Mudam a cada assembleia.</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
          <label className="rotulo">
            Data da assembleia
            <input className="campo" readOnly value={dataBR(grupo.data_assembleia)} />
          </label>
          <label className="rotulo">
            Prazo da cota (meses)
            <input className="campo" readOnly value={grupo.prazo_cota_meses} />
          </label>
        </div>
        <p className="text-xs text-tinta">
          Prazo da cota = prazo do grupo − (assembleia − 1).
          {prazoDiverge && (
            <span className="ml-1 font-semibold text-alerta">
              Atenção: pela regra daria {prazoCalculado} meses, mas a tabela informa {grupo.prazo_cota_meses}.
            </span>
          )}
        </p>
      </section>

      <div className="flex flex-wrap gap-5">
        <section className="cartao flex-[2_1_480px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-bold">Valores de crédito</h3>
            <span className="text-xs text-tinta">
              {grupo.creditos.length} {grupo.creditos.length === 1 ? "valor" : "valores"}
            </span>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
            {grupo.creditos.map((c) => (
              <li
                key={c}
                className="rounded-[10px] border border-[#ece8de] px-3.5 py-3 text-right text-[15px] font-bold tabular-nums"
              >
                {reais(c)}
              </li>
            ))}
          </ul>
        </section>

        <section className="cartao flex-[1_1_280px]">
          <h3 className="text-base font-bold">Tipos de parcela</h3>
          <ul className="flex flex-col gap-2 text-[13px]">
            {grupo.tiposParcela.map((t) => (
              <li key={t.codigo} className="flex justify-between gap-3 rounded-[10px] border border-[#ece8de] px-3.5 py-3">
                <span className="font-bold">{t.descricao}</span>
                <span className="tabular-nums text-tinta">{pct(t.pct, 0)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-tinta">Reduzida: fundo comum reduzido até a contemplação; recalculada no prazo restante.</p>
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
