"use client";

import { useRef, useState, useTransition } from "react";
import { MESES } from "@/lib/formato";
import { FIDELIDADE, SORTEIO, notaFidelidade, notaSorteios, parcelaFidelidade } from "@/lib/sequencia";
import { alternarTipoParcela, definirPagamentoComFuro, salvarCreditos, type CampoGrupo } from "../grupos/actions";
import { useSimulacao } from "../grupos/SimulacaoContext";
import { ModalidadesContemplacao } from "../grupos/ModalidadesContemplacao";
import { SequenciaContemplacao } from "../grupos/SequenciaContemplacao";
import { useDados, type Estado } from "./GrupoV2";

// Aba "Dados do grupo": tudo o que se sabe do grupo. Com a edição desligada é só leitura;
// ligada, os mesmos blocos viram campos e cada alteração grava na hora.

const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CAIXA = "flex min-w-0 flex-col gap-3 rounded-2xl border bg-white p-4";
const caixa = (editando: boolean) => CAIXA + (editando ? " border-laranja/50 shadow-[0_0_0_3px_var(--color-laranja-claro)]" : " border-borda");

function Status({ estado }: { estado: Estado }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={"text-[11px] font-semibold " + (estado.tipo === "erro" ? "text-[#9b1c1c]" : estado.tipo === "salvo" ? "text-ok" : "text-tinta")}
    >
      {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : estado.tipo === "erro" ? estado.msg : ""}
    </span>
  );
}

export function DadosGrupo() {
  const { grupo: g, editando } = useDados();
  return (
    <div className="flex flex-col gap-4">
      {editando && (
        <p className="rounded-xl border border-alerta-borda bg-alerta-fundo px-4 py-2 text-[13px] font-semibold text-alerta">
          Edição ligada: cada alteração é gravada assim que você sai do campo. Desligue para voltar à leitura.
        </p>
      )}
      {/* informações · faixa de crédito · tipos de parcela · modalidades (informações e faixa mais estreitas) */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.8fr)_minmax(0,1.35fr)]">
        <Informacoes />
        <Creditos key={`cred-${editando}`} />
        <Tipos />
        {/* só leitura (vem da tabela importada): o mesmo box da versão 1, esticado à largura da coluna */}
        <div className="[&>section]:h-full [&>section]:w-full [&>section]:p-4 [&_table]:flex-1 [&_tbody_tr]:h-[32%] [&_td]:py-2.5! [&_td]:text-[13px]! [&_th]:text-[13px]!">
          <ModalidadesContemplacao modalidades={g.modalidades} tipos={g.tiposContemplacao} prazoGrupo={g.prazo_grupo_meses} />
        </div>
      </div>
      <Sequencia />
    </div>
  );
}

/* ---------------- informações ---------------- */

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[10px] font-bold tracking-wider text-tinta uppercase">{rotulo}</dt>
      <dd className="m-0 min-h-[30px] text-[15px] font-bold tabular-nums">{children}</dd>
    </div>
  );
}

function Informacoes() {
  const { grupo: g, editando, info, estadoInfo, mudarInfo, gravarInfo, indices } = useDados();
  const sai = (c: CampoGrupo) => (e: React.FocusEvent<HTMLInputElement>) => gravarInfo(c, e.target.value);
  const muda = (c: CampoGrupo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => mudarInfo(c, e.target.value);
  const escolhe = (c: CampoGrupo) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    mudarInfo(c, e.target.value);
    gravarInfo(c, e.target.value);
  };
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.currentTarget.blur();
  const semFundo = info.fundo_reserva === "";
  const nomeIndice = indices.find((i) => i.sigla === info.indice)?.nome;
  const mes = info.mes_reajuste ? MESES[Number(info.mes_reajuste) - 1] : "";
  const campo = "campo-sm !w-full";

  return (
    <section className={caixa(editando)} aria-label="Informações do grupo">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">Informações do grupo</h3>
        <Status estado={estadoInfo} />
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3">
        <Campo rotulo="Participantes">
          {editando ? (
            <input className={campo} inputMode="numeric" aria-label="Participantes" value={info.participantes} onChange={muda("participantes")} onBlur={sai("participantes")} onKeyDown={enter} />
          ) : (
            info.participantes || "—"
          )}
        </Campo>
        <Campo rotulo="Taxa adm. total">
          {editando ? (
            <input className={campo} inputMode="decimal" aria-label="Taxa de administração total" value={info.taxa_adm_total} onChange={muda("taxa_adm_total")} onBlur={sai("taxa_adm_total")} onKeyDown={enter} />
          ) : (
            info.taxa_adm_total || "—"
          )}
        </Campo>
        <Campo rotulo="Fundo de reserva">
          {editando ? (
            <input
              className={campo + (semFundo ? " border-alerta-borda bg-alerta-fundo" : "")}
              inputMode="decimal"
              placeholder="—"
              aria-label="Fundo de reserva"
              value={info.fundo_reserva}
              onChange={muda("fundo_reserva")}
              onBlur={sai("fundo_reserva")}
              onKeyDown={enter}
            />
          ) : semFundo ? (
            <span className="text-alerta">não informado</span>
          ) : (
            info.fundo_reserva
          )}
        </Campo>
        <Campo rotulo="Índice">
          {editando ? (
            <select className={campo} aria-label="Índice de correção" value={info.indice} onChange={escolhe("indice")}>
              <option value="">—</option>
              {indices.map((i) => (
                <option key={i.sigla} value={i.sigla}>
                  {i.sigla}
                </option>
              ))}
            </select>
          ) : (
            <span title={nomeIndice}>{info.indice || "—"}</span>
          )}
        </Campo>
        <Campo rotulo="Reajuste em">
          {editando ? (
            <select className={campo} aria-label="Mês do reajuste anual" value={info.mes_reajuste} onChange={escolhe("mes_reajuste")}>
              <option value="">—</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <span className="capitalize">{mes || "—"}</span>
          )}
        </Campo>
        <Campo rotulo="Dia de vencimento">
          {editando ? (
            <input className={campo} inputMode="numeric" aria-label="Dia de vencimento" value={info.dia_vencimento} onChange={muda("dia_vencimento")} onBlur={sai("dia_vencimento")} onKeyDown={enter} />
          ) : (
            info.dia_vencimento || "—"
          )}
        </Campo>

        {/* vêm da tabela importada: sempre só leitura */}
        <Campo rotulo="1ª correção">
          {g.primeira_correcao ? <span className="capitalize">{`${MESES[Number(g.primeira_correcao.slice(5, 7)) - 1]}/${g.primeira_correcao.slice(0, 4)}`}</span> : "—"}
        </Campo>
        <Campo rotulo="Fidelidade libera">{g.fidelidade_meses ? `parcela ${parcelaFidelidade(g.fidelidade_meses)}` : "sem fidelidade"}</Campo>
      </dl>
    </section>
  );
}

/* ---------------- faixa de crédito ---------------- */

// "R$ 553.368,10" → 553368.1 ; texto inválido → NaN
const lerValor = (s: string) => Number(s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
type Linha = { id: number; texto: string; valor: number | null };

function Creditos() {
  const { grupo: g, editando, creditos, setCreditos } = useDados();
  const { creditoSel, setCreditoSel } = useSimulacao();
  const proximoId = useRef(creditos.length);
  const [linhas, setLinhas] = useState<Linha[]>(() => creditos.map((c, id) => ({ id, texto: numero.format(c), valor: c })));
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [, iniciar] = useTransition();

  function enviar(novos: number[], aoSalvar: () => void, aoFalhar: () => void) {
    setEstado({ tipo: "salvando" });
    iniciar(async () => {
      const r = await salvarCreditos(g.grupo_assembleia_id, novos);
      if (r.ok) {
        aoSalvar();
        setCreditos([...novos].sort((a, b) => a - b));
        setEstado({ tipo: "salvo" });
      } else {
        aoFalhar();
        setEstado({ tipo: "erro", msg: r.erro });
      }
    });
  }

  const desfazer = (id: number) => setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: x.valor === null ? "" : numero.format(x.valor) } : x)));

  function aoSair(id: number) {
    const linha = linhas.find((l) => l.id === id);
    if (!linha) return;
    const texto = linha.texto.trim();
    if (!texto) {
      if (linha.valor === null) return setLinhas((l) => l.filter((x) => x.id !== id));
      return remover(id);
    }
    const v = Math.round(lerValor(texto) * 100) / 100;
    if (!Number.isFinite(v) || v <= 0) {
      setEstado({ tipo: "erro", msg: "Valor inválido. Ex.: 553.368,10" });
      return desfazer(id);
    }
    if (v === linha.valor) return setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: numero.format(v) } : x)));
    if (linhas.some((x) => x.id !== id && x.valor === v)) {
      setEstado({ tipo: "erro", msg: "Esse valor já está na lista." });
      return desfazer(id);
    }
    const outros = linhas.filter((x) => x.id !== id && x.valor !== null).map((x) => x.valor as number);
    enviar(
      [...outros, v],
      () => {
        setLinhas((l) => l.map((x) => (x.id === id ? { ...x, texto: numero.format(v), valor: v } : x)));
        if (linha.valor !== null && linha.valor === creditoSel) setCreditoSel(v); // o simulador acompanha
      },
      () => desfazer(id),
    );
  }

  function remover(id: number) {
    const linha = linhas.find((l) => l.id === id);
    if (!linha) return;
    if (linha.valor === null) return setLinhas((l) => l.filter((x) => x.id !== id));
    const restantes = linhas.filter((x) => x.id !== id && x.valor !== null).map((x) => x.valor as number);
    if (!restantes.length) {
      setEstado({ tipo: "erro", msg: "A faixa precisa ter ao menos um valor." });
      return desfazer(id);
    }
    enviar(
      restantes,
      () => {
        setLinhas((l) => l.filter((x) => x.id !== id));
        if (linha.valor === creditoSel) setCreditoSel(Math.min(...restantes));
      },
      () => undefined,
    );
  }

  const lista = editando ? linhas : creditos.map((c, id) => ({ id, texto: numero.format(c), valor: c }));
  const porColuna = lista.length > 6 ? Math.ceil(lista.length / 2) : lista.length;
  const grade = {
    gridAutoFlow: "column",
    gridTemplateRows: `repeat(${Math.max(1, porColuna)}, auto)`,
    gridTemplateColumns: lista.length > 6 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
  } as const;

  return (
    <section className={caixa(editando)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">
          Faixa de crédito <span className="font-semibold text-tinta">(R$) · {creditos.length}</span>
        </h3>
        {editando && <Status estado={estado} />}
      </div>
      {!editando ? (
        // leitura: os valores se distribuem por toda a altura do box (que acompanha o box mais alto da linha)
        <ul className="m-0 grid flex-1 list-none gap-x-6 p-0" style={{ ...grade, gridTemplateRows: `repeat(${Math.max(1, porColuna)}, minmax(0, 1fr))` }}>
          {creditos.map((c) => (
            <li key={c} className="flex items-center justify-end border-b border-linha text-[16px] font-bold tabular-nums">
              {numero.format(c)}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="m-0 grid list-none gap-x-3 gap-y-1.5 p-0" style={grade}>
            {linhas.map((l) => (
              <li key={l.id} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Remover ${l.texto || "valor"}`}
                  onClick={() => remover(l.id)}
                  className="h-7 w-6 shrink-0 rounded text-base leading-none text-[#9c96c2] hover:bg-linha hover:text-[#9b1c1c]"
                >
                  ×
                </button>
                <div className="relative flex-1">
                  <input
                    inputMode="decimal"
                    autoFocus={l.valor === null}
                    value={l.texto}
                    placeholder="0,00"
                    aria-label="Valor do crédito"
                    onChange={(e) => {
                      const texto = e.target.value;
                      setLinhas((x) => x.map((y) => (y.id === l.id ? { ...y, texto } : y)));
                    }}
                    onBlur={() => aoSair(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        desfazer(l.id);
                        e.currentTarget.blur();
                      }
                    }}
                    className="h-8 w-full rounded-md border border-borda-campo bg-campo px-2 text-right text-[13px] font-bold tabular-nums text-navy outline-none focus:border-laranja focus:bg-white focus:ring-2 focus:ring-laranja-claro"
                  />
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setLinhas((l) => [...l, { id: proximoId.current++, texto: "", valor: null }])}
            className="min-h-8 rounded-md border border-dashed border-borda-campo text-xs font-bold text-tinta hover:bg-linha"
          >
            + valor
          </button>
        </>
      )}
    </section>
  );
}

/* ---------------- tipos de parcela e furo ---------------- */

function Tipos() {
  const { grupo: g, editando, disponiveis, setDisponiveis } = useDados();
  const { tipoSel, setTipoSel, furo, setFuro } = useSimulacao();
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();

  function alternar(codigo: string, marcado: boolean) {
    setErro(false);
    // desmarcou o tipo usado no simulador: passa para o menor que continua disponível
    if (!marcado && codigo === tipoSel) {
      const resto = g.tiposParcela.filter((t) => t.codigo !== codigo && disponiveis.has(t.codigo)).sort((a, b) => a.pct - b.pct);
      setTipoSel(resto[0]?.codigo ?? null);
    }
    if (marcado && tipoSel === null) setTipoSel(codigo);
    const novo = new Set(disponiveis);
    if (marcado) novo.add(codigo);
    else novo.delete(codigo);
    setDisponiveis(novo);
    iniciar(async () => {
      const r = await alternarTipoParcela(g.grupo_assembleia_id, codigo, marcado);
      if (!r.ok) {
        setErro(true);
        setDisponiveis(disponiveis);
      }
    });
  }

  function alternarFuro() {
    const novo = !furo;
    setFuro(novo);
    setErro(false);
    iniciar(async () => {
      const r = await definirPagamentoComFuro(g.grupo_assembleia_id, novo);
      if (!r.ok) {
        setFuro(!novo);
        setErro(true);
      }
    });
  }

  return (
    <section className={caixa(editando)} aria-busy={pendente}>
      <h3 className="text-sm font-bold">Tipos de parcela</h3>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {g.tiposParcela.map((t) => {
          const on = disponiveis.has(t.codigo);
          return (
            <li
              key={t.codigo}
              className={"flex min-h-9 items-center gap-2.5 rounded-lg border px-3 text-[13px] " + (on ? "border-[#cfe3d3] bg-ok-fundo font-bold text-ok" : "border-[#ece8de] text-tinta")}
            >
              {editando ? (
                <input
                  type="checkbox"
                  checked={on}
                  aria-label={`${t.descricao}: oferecido no grupo`}
                  onChange={(e) => alternar(t.codigo, e.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[#1d5b2c]"
                />
              ) : (
                <span aria-hidden="true" className="w-4 text-center">
                  {on ? "✓" : "–"}
                </span>
              )}
              <span className="flex-1 whitespace-nowrap">{t.descricao}</span>
              {!on && <span className="sr-only">não oferecido</span>}
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between border-t border-linha pt-3">
        <span id="furo-v2" className="text-[13px] font-bold">
          Pagamento com furo
        </span>
        {editando ? (
          <button type="button" role="switch" aria-checked={furo} aria-labelledby="furo-v2" onClick={alternarFuro} className={"relative h-5 w-9 rounded-full transition-colors " + (furo ? "bg-ok" : "bg-[#cfcbe0]")}>
            <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (furo ? "left-[18px]" : "left-0.5")} />
          </button>
        ) : (
          <span className={"rounded-full px-2.5 py-0.5 text-[12px] font-bold " + (furo ? "bg-ok-fundo text-ok" : "bg-linha text-tinta")}>{furo ? "Sim" : "Não"}</span>
        )}
      </div>
      {erro && (
        <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </section>
  );
}

/* ---------------- sequência ---------------- */

type Posicao = { codigo: string; nome: string; cor: string; desde?: number | null };

function Codigos({ itens }: { itens: Posicao[] }) {
  return (
    <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
      {itens.map((o, k) => (
        <li
          key={k}
          tabIndex={0}
          className="group relative flex cursor-help rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-navy"
          aria-label={`${k + 1}ª: ${o.nome}`}
        >
          <span
            style={{ color: o.cor, background: `${o.cor}1f`, borderColor: `${o.cor}${o.desde ? "aa" : "66"}` }}
            className={"flex h-8 w-8 items-center justify-center rounded-[8px] border text-[12px] font-bold lowercase " + (o.desde ? "border-dashed" : "")}
          >
            {o.codigo}
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 rounded-md bg-navy px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg group-hover:block group-focus:block"
          >
            {k + 1}ª · {o.nome}
            {!o.desde
              ? ""
              : o.codigo === FIDELIDADE
                ? ` · liberado na parcela ${parcelaFidelidade(o.desde)}`
                : o.codigo === SORTEIO
                  ? ` · sorteio adicional a partir do mês ${o.desde}`
                  : ` · a partir do mês ${o.desde}`}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Sequencia() {
  const { grupo: g, editando } = useDados();
  const s = g.sequencia;

  // com a edição ligada, usa o editor da versão 1 (lápis dentro do box)
  if (editando) {
    return (
      <div className="flex flex-col gap-1.5">
        <SequenciaContemplacao
          key={`seq-${g.grupo_assembleia_id}`}
          versaoId={g.grupo_assembleia_id}
          modelo={s.modelo}
          linha={s.linha}
          faixas={s.faixas}
          tipos={g.tiposContemplacao}
          fidelidadeMeses={g.fidelidade_meses}
        />
        <p className="text-[11px] text-tinta">Use o lápis do box para editar a sequência. Ao desligar a edição, a leitura é atualizada.</p>
      </div>
    );
  }

  const notas = s.modelo?.simples ? [notaSorteios(s.modelo), notaFidelidade(g.fidelidade_meses)].filter((n): n is string => !!n) : [];
  const usados = new Set([...s.linha, ...s.faixas.flatMap((f) => f.ordem)].map((p) => p.codigo));

  return (
    <section className={caixa(false)}>
      <h3 className="text-sm font-bold">Sequência de contemplação</h3>
      {s.modelo?.simples ? (
        <Codigos itens={s.linha} />
      ) : s.faixas.length ? (
        <div className="flex flex-col gap-2">
          {s.faixas.map((f) => (
            <div key={f.de} className="flex flex-wrap items-center gap-3">
              <div className="w-[5.5rem] shrink-0 text-xs font-bold text-tinta">
                {f.de}ª a {f.ate}ª
              </div>
              <Codigos itens={f.ordem} />
            </div>
          ))}
          <p className="text-[11px] font-semibold text-alerta">Regra específica: as faixas diferem além de sorteio e fidelidade.</p>
        </div>
      ) : (
        <p className="text-[13px] text-tinta">Sem sequência cadastrada.</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-tinta">
        {g.tiposContemplacao
          .filter((t) => usados.has(t.codigo))
          .map((t) => (
            <span key={t.codigo} className="flex items-center gap-1.5">
              <i aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: t.cor }} />
              <strong className="lowercase" style={{ color: t.cor }}>
                {t.codigo}
              </strong>{" "}
              {t.nome}
            </span>
          ))}
        <span>Pontilhado: entra só a partir de certo mês.</span>
      </div>
      {notas.map((n) => (
        <p key={n} className="text-[12px] text-tinta">
          {n}
        </p>
      ))}
    </section>
  );
}
