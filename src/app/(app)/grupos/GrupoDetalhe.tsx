import type { GrupoDetalhe } from "@/lib/grupos";
import { dataBR, MESES, milhar, pct, reais } from "@/lib/formato";
import { salvarGrupo } from "./actions";

type Props = {
  grupo: GrupoDetalhe;
  indices: { id: number; sigla: string }[];
  salvo: boolean;
  erro: boolean;
};

export function GrupoDetalheView({ grupo, indices, salvo, erro }: Props) {
  const v = grupo.vigente;
  const prazoCalculado = v ? grupo.prazo_grupo_meses - (v.assembleia_numero - 1) : null;
  const prazoDiverge = v && prazoCalculado !== null && prazoCalculado !== v.prazo_cota_meses;

  // planos presentes na tabela vigente
  const planos = new Map<string, string>();
  for (const c of grupo.creditos)
    for (const p of c.credito_parcela) planos.set(p.plano_pagamento.codigo, p.plano_pagamento.nome);
  const temDiluida = planos.has("DILUIDA");
  const temAntecipado = planos.has("ANTECIPADO_1");
  const temReduzida = planos.has("REDUZIDA");
  const parcela = (c: GrupoDetalhe["creditos"][number], codigo: string) =>
    c.credito_parcela.find((p) => p.plano_pagamento.codigo === codigo && Number(p.pct_parcela) === 100);

  const fundoVazio = grupo.fundo_reserva === null;

  return (
    <form action={salvarGrupo} className="flex flex-col gap-5 border-t border-borda pt-[22px]">
      <input type="hidden" name="id" value={grupo.id} />
      <input type="hidden" name="familia_slug" value={grupo.familia?.slug ?? ""} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[22px] font-bold">
            Grupo {grupo.numero} · {grupo.familia?.nome}
          </h2>
          <span className="rounded-full bg-ok-fundo px-2.5 py-1 text-xs font-semibold text-ok capitalize">
            {grupo.status}
          </span>
          {v && (
            <span className="rounded-full bg-ouro-claro px-2.5 py-1 text-xs font-semibold text-ouro-texto">
              Tabela vigente: {v.assembleia_numero}ª assembleia{v.data_assembleia ? ` · ${dataBR(v.data_assembleia)}` : ""}
            </span>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled
            title="Em breve"
            className="min-h-11 rounded-[10px] border border-navy bg-white px-4 text-sm font-semibold opacity-60"
          >
            Histórico de vigências ({grupo.totalVigencias})
          </button>
          <button type="submit" className="min-h-11 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy">
            Salvar grupo
          </button>
        </div>
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
      {v?.arquivo_importado?.nome && (
        <div className="rounded-lg border border-[#efe4c8] bg-[#fbf7ee] px-4 py-2.5 text-[13px] text-[#5c4510]">
          <span className="font-bold">Origem da tabela:</span> {v.arquivo_importado.nome}
        </div>
      )}

      <section className="cartao">
        <h3 className="text-base font-bold">Identificação e características</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
          <label className="rotulo">
            Família de produto
            <input className="campo" value={grupo.familia?.nome ?? ""} readOnly />
          </label>
          <label className="rotulo">
            Número do grupo
            <input className="campo" name="numero" defaultValue={grupo.numero} required />
          </label>
          <label className="rotulo">
            Participantes
            <input className="campo" name="participantes" inputMode="numeric" defaultValue={milhar(grupo.participantes)} />
          </label>
          <label className="rotulo">
            Prazo do grupo (meses)
            <input className="campo" name="prazo_grupo_meses" inputMode="numeric" defaultValue={grupo.prazo_grupo_meses} required />
          </label>
          <label className="rotulo">
            Prazo da cota (meses)
            <input className="campo" value={v?.prazo_cota_meses ?? ""} readOnly />
          </label>
          <label className="rotulo">
            Assembleia vigente
            <input
              className="campo"
              value={v ? `${v.assembleia_numero}ª${v.data_assembleia ? ` · ${dataBR(v.data_assembleia)}` : ""}` : ""}
              readOnly
            />
          </label>
          <label className="rotulo">
            Dia de vencimento
            <input className="campo" name="dia_vencimento" inputMode="numeric" defaultValue={grupo.dia_vencimento ?? ""} />
          </label>
          <label className="rotulo">
            Taxa de administração total
            <input className="campo" name="taxa_adm_total" inputMode="decimal" defaultValue={pct(grupo.taxa_adm_total)} />
          </label>
          <label className="rotulo">
            Fundo de reserva
            <input
              className={"campo " + (fundoVazio ? "border-alerta-borda bg-alerta-fundo" : "")}
              name="fundo_reserva"
              inputMode="decimal"
              defaultValue={pct(grupo.fundo_reserva)}
              placeholder="Não informado na tabela"
            />
          </label>
          <label className="rotulo">
            Índice de correção
            <select className="campo" name="indice_id" defaultValue={grupo.indice_id ?? ""}>
              <option value="">—</option>
              {indices.map((i) => (
                <option key={i.id} value={i.id}>
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
        </div>
        <p className="text-xs text-tinta">
          Prazo da cota = prazo do grupo − (assembleia vigente − 1).
          {prazoDiverge && (
            <span className="ml-1 font-semibold text-alerta">
              Atenção: pela regra daria {prazoCalculado} meses, mas a tabela informa {v!.prazo_cota_meses}.
            </span>
          )}
        </p>
      </section>

      <div className="flex flex-wrap gap-5">
        <section className="cartao flex-[1_1_380px]">
          <h3 className="text-base font-bold">Planos de pagamento</h3>
          <div className="flex flex-col gap-2.5 text-[13px]">
            {temDiluida && (
              <div className="flex justify-between gap-3 rounded-[10px] border border-[#ece8de] px-3.5 py-3">
                <span className="font-bold">Parcela diluída</span>
                <span className="text-tinta">Normal 100% · parcelas iguais</span>
              </div>
            )}
            {temAntecipado && (
              <div className="flex justify-between gap-3 rounded-[10px] border border-[#ece8de] px-3.5 py-3">
                <span className="font-bold">1% antecipado</span>
                <span className="text-tinta">1ª parcela maior · demais menores</span>
              </div>
            )}
            {!temReduzida && (
              <div className="flex justify-between gap-3 rounded-[10px] border border-dashed border-alerta-borda bg-alerta-fundo px-3.5 py-3">
                <span className="font-bold">Parcela reduzida</span>
                <span className="text-alerta">Percentual não informado na tabela</span>
              </div>
            )}
          </div>
        </section>

        <section className="cartao flex-[1_1_380px]">
          <h3 className="text-base font-bold">Seguro prestamista</h3>
          <div className="grid grid-cols-2 gap-3.5">
            <label className="rotulo">
              Até a contemplação
              <select className="campo" name="seguro_pre" defaultValue={grupo.seguro_opcional_pre ? "opcional" : "obrigatorio"}>
                <option value="opcional">Opcional</option>
                <option value="obrigatorio">Obrigatório</option>
              </select>
            </label>
            <label className="rotulo">
              Após a contemplação
              <select className="campo" name="seguro_pos" defaultValue={grupo.seguro_obrigatorio_pos ? "obrigatorio" : "opcional"}>
                <option value="obrigatorio">Obrigatório</option>
                <option value="opcional">Opcional</option>
              </select>
            </label>
            <label className="rotulo col-span-2">
              Limite: idade + prazo de encerramento do grupo
              <input className="campo" name="idade_limite_seguro" defaultValue={grupo.idade_limite_seguro ?? ""} />
            </label>
          </div>
        </section>
      </div>

      <section className="cartao">
        <h3 className="text-base font-bold">Tabela de créditos</h3>
        {grupo.creditos.length === 0 ? (
          <p className="text-sm text-tinta">Nenhum crédito na tabela vigente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th rowSpan={2}>Cód. bem</th>
                  <th rowSpan={2} className="num">Crédito</th>
                  {temDiluida && <th className="num" style={{ borderBottom: "2px solid var(--color-navy)" }}>Parcela diluída</th>}
                  {temAntecipado && (
                    <th colSpan={2} className="text-center" style={{ borderBottom: "2px solid var(--color-ouro)", textAlign: "center" }}>
                      1% antecipado
                    </th>
                  )}
                  <th rowSpan={2} className="num">Seguro / mês</th>
                </tr>
                <tr>
                  {temDiluida && <th className="num">Normal 100%</th>}
                  {temAntecipado && <th className="num">1ª parcela</th>}
                  {temAntecipado && <th className="num">Demais</th>}
                </tr>
              </thead>
              <tbody>
                {grupo.creditos.map((c) => {
                  const d = parcela(c, "DILUIDA");
                  const a = parcela(c, "ANTECIPADO_1");
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.cod_bem}</td>
                      <td className="num font-bold">{reais(c.valor_credito)}</td>
                      {temDiluida && <td className="num">{reais(d?.valor_demais)}</td>}
                      {temAntecipado && <td className="num">{reais(a?.valor_primeira)}</td>}
                      {temAntecipado && <td className="num">{reais(a?.valor_demais)}</td>}
                      <td className="num text-tinta">{reais(c.seguro_mensal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                const lance = m.tipo_contemplacao.codigo.startsWith("LANCE");
                const embutido = !lance
                  ? "—"
                  : m.embutido_max_parcelas === null
                    ? "Não"
                    : `${m.tipo_contemplacao.codigo === "LANCE_LIMITADO" ? "Até " : ""}${m.embutido_max_parcelas} parcelas (${pct(m.embutido_pct, 0)} ${m.embutido_base === "categoria" ? "da categoria" : "do ofertado"})`;
                const proprios = !lance
                  ? "—"
                  : m.recurso_proprio_obrig
                    ? m.embutido_max_parcelas !== null
                      ? "O restante"
                      : "100% do ofertado"
                    : "—";
                const disponivel = [
                  m.a_partir_assembleia_cota <= 1 ? "Desde a 1ª" : `${m.a_partir_assembleia_cota}ª assembleia da cota`,
                  m.requisitos && m.a_partir_assembleia_cota > 1 ? m.requisitos : null,
                  !m.transferivel ? "não transfere com a cota" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr key={m.tipo_contemplacao.codigo} className={m.a_partir_assembleia_cota > 1 ? "bg-[#fbf7ee]" : ""}>
                    <td className="font-semibold">{m.tipo_contemplacao.nome}</td>
                    <td className="num">
                      {!lance ? "—" : m.max_parcelas_lance === null ? "Livre" : `${m.max_parcelas_lance} parcelas`}
                    </td>
                    <td className="num">{m.pct_categoria === null ? "—" : pct(m.pct_categoria, 0)}</td>
                    <td>{embutido}</td>
                    <td>{proprios}</td>
                    <td>{disponivel}</td>
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
            <div key={`${f.de}-${f.ate}`} className="flex flex-col gap-2">
              <div className="text-xs font-bold text-tinta">
                {f.de}ª a {f.ate}ª assembleia
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {f.itens.map((i) => (
                  <span
                    key={i.ordem}
                    className={
                      "rounded-lg px-2.5 py-1.5 " +
                      (i.codigo === "LANCE_FIDELIDADE" ? "bg-ouro-claro" : i.eh_lance ? "bg-laranja-claro" : "bg-lavanda")
                    }
                  >
                    {i.ordem} · {i.nome}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-tinta">Demais contemplações seguem a mesma sequência.</p>
        </section>

        <section className="cartao flex-[1_1_300px]">
          <h3 className="text-base font-bold">Observações</h3>
          {grupo.observacoes && <p className="text-[13px] leading-relaxed text-[#2b2550]">{grupo.observacoes}</p>}
          <label className="rotulo">
            Notas internas
            <textarea className="campo min-h-20 py-2.5" name="notas_internas" rows={3} defaultValue={grupo.notas_internas ?? ""} />
          </label>
        </section>
      </div>
    </form>
  );
}
