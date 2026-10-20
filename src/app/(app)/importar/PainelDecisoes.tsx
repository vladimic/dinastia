"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FILTROS, NOME_FILTRO, type Filtro } from "@/lib/pdf/filtros";
import { paraEdicao, tipoDoCampo } from "@/lib/pdf/edicao";
import { textoDoValor } from "@/lib/pdf/mostrar";
import { aplicarItens, decidir, decidirPorCampo, descartarItem, editarDiferenca } from "./actions";

export type Contagens = { pendentes: number; prontos: number; aplicados: number; sem_mudanca: number; erros: number; ignorados: number; diferencasPendentes: number };
export type Agregado = { escopo: string; campo: string; total: number };
export type Dif = { id: number; escopo: string; chave: string; campo: string; rotulo: string; valor_atual: unknown; valor_novo: unknown; decisao: "pendente" | "aceita" | "rejeitada" | "editada"; valor_final: unknown };
export type ItemTela = { id: number; arquivo: string; grupo_numero: number | null; assembleia_numero: number | null; situacao: string; tipo: string | null; motivo: string | null; importacao_diferenca: Dif[] };

const TIPO: Record<string, string> = { grupo_novo: "Grupo novo", nova_assembleia: "Nova assembleia", mesma_assembleia: "Mesma assembleia", anterior: "Assembleia anterior" };
const ROTULO_CAMPO: Record<string, string> = { "*": "(item inteiro)", creditos: "Créditos", tipos_parcela: "Tipos de parcela", participantes: "Número de participantes", taxa_adm_total: "Taxa de administração", prazo_grupo_meses: "Prazo do grupo", fundo_reserva: "Fundo de reserva", indice: "Índice", mes_reajuste: "Mês do reajuste", primeira_correcao: "1ª correção", dia_vencimento: "Dia de vencimento", observacoes: "Observações", data_assembleia: "Data da assembleia", prazo_cota: "Prazo da cota" };
const ESCOPO: Record<string, string> = { grupo: "Grupo", versao: "Versão", creditos: "Créditos", tipos_parcela: "Tipos de parcela", modalidade: "Modalidade", sequencia: "Sequência" };

const BTN = "min-h-8 rounded-[10px] px-3 text-xs font-bold disabled:opacity-50";

export function PainelDecisoes({
  contagens,
  agregados,
  itens,
  filtro,
  pagina,
  totalPaginas,
  idsProntos,
}: {
  contagens: Contagens;
  agregados: Agregado[];
  itens: ItemTela[];
  filtro: Filtro;
  pagina: number;
  totalPaginas: number;
  idsProntos: number[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ erro: boolean; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();

  function rodar(fn: () => Promise<{ ok: boolean; erro?: string } | void>, ok?: string) {
    setMsg(null);
    iniciar(async () => {
      const r = await fn();
      if (r && !r.ok) setMsg({ erro: true, texto: r.erro ?? "Não foi possível concluir." });
      else if (ok) setMsg({ erro: false, texto: ok });
      router.refresh();
    });
  }

  function aplicarTodosProntos() {
    setMsg(null);
    iniciar(async () => {
      let aplicados = 0;
      const falhas: string[] = [];
      for (let i = 0; i < idsProntos.length; i += 10) {
        const r = await aplicarItens(idsProntos.slice(i, i + 10));
        if (!r.ok) {
          setMsg({ erro: true, texto: r.erro });
          router.refresh();
          return;
        }
        aplicados += r.aplicados;
        falhas.push(...r.falhas.map((f) => `${f.arquivo}: ${f.motivo}`));
      }
      setMsg({ erro: falhas.length > 0, texto: `${aplicados} aplicados na base.` + (falhas.length ? ` ${falhas.length} não aplicados — ${falhas.slice(0, 3).join(" | ")}` : "") });
      router.refresh();
    });
  }

  const vazio = contagens.pendentes + contagens.aplicados + contagens.sem_mudanca + contagens.erros + contagens.ignorados === 0;

  return (
    <section className="flex flex-col gap-4" aria-label="Decisões da importação">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">Decisões da importação</h2>
        {contagens.diferencasPendentes > 0 ? (
          <span className="rounded-full bg-alerta-fundo px-3 py-1 text-xs font-bold text-alerta ring-1 ring-alerta-borda">
            Falta decidir: {contagens.diferencasPendentes} {contagens.diferencasPendentes === 1 ? "diferença" : "diferenças"} em {contagens.pendentes - contagens.prontos} PDFs
          </span>
        ) : (
          !vazio && <span className="rounded-full bg-ok-fundo px-3 py-1 text-xs font-bold text-ok">Nada pendente de decisão</span>
        )}
      </div>

      {vazio && <p className="text-sm text-tinta">Nenhum PDF lido ainda. Leia uma pasta acima e as diferenças em relação à base aparecem aqui.</p>}

      {msg && (
        <p role={msg.erro ? "alert" : "status"} className={"rounded-lg px-3 py-2 text-sm font-semibold " + (msg.erro ? "bg-[#fbe4e4] text-[#9b1c1c]" : "bg-ok-fundo text-ok")}>
          {msg.texto}
        </p>
      )}

      {agregados.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-borda bg-white p-4">
          <h3 className="text-sm font-bold">Decidir em bloco (todas as pendentes de cada tipo)</h3>
          <ul className="flex flex-col gap-1.5">
            {agregados.map((a) => (
              <li key={`${a.escopo}|${a.campo}`} className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="min-w-[16rem] flex-1">
                  <strong>{ESCOPO[a.escopo] ?? a.escopo}</strong> · {ROTULO_CAMPO[a.campo] ?? a.campo} <span className="text-tinta">({a.total})</span>
                </span>
                <button type="button" disabled={ocupado} className={BTN + " bg-ok text-white hover:brightness-110"} onClick={() => rodar(() => decidirPorCampo(a.escopo, a.campo, "aceita"), "Diferenças aceitas.")}>
                  Aceitar todas
                </button>
                <button type="button" disabled={ocupado} className={BTN + " border border-borda-campo text-tinta hover:bg-linha"} onClick={() => rodar(() => decidirPorCampo(a.escopo, a.campo, "rejeitada"), "Diferenças rejeitadas.")}>
                  Rejeitar todas
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => {
          const n = f === "aplicados" ? contagens.aplicados : f === "sem_mudanca" ? contagens.sem_mudanca : f === "erros" ? contagens.erros : f === "ignorados" ? contagens.ignorados : f === "prontos" ? contagens.prontos : contagens.pendentes;
          return (
            <Link
              key={f}
              href={`/importar?v=${f}`}
              scroll={false}
              className={"rounded-full px-3 py-1 text-xs font-bold ring-1 " + (f === filtro ? "bg-navy text-white ring-navy" : "bg-white text-tinta ring-borda-campo hover:bg-linha")}
            >
              {NOME_FILTRO[f]} ({n})
            </Link>
          );
        })}
        {contagens.prontos > 0 && (
          <button type="button" disabled={ocupado} onClick={aplicarTodosProntos} className={BTN + " ml-auto min-h-9 bg-laranja px-4 text-sm text-navy hover:brightness-95"}>
            {ocupado ? "Aplicando…" : `Aplicar os ${contagens.prontos} prontos na base`}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {itens.map((it) => (
          <Item key={it.id} item={it} ocupado={ocupado} rodar={rodar} />
        ))}
        {!itens.length && !vazio && <li className="text-sm text-tinta">Nada nesta lista.</li>}
      </ul>

      {totalPaginas > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && <Link href={`/importar?v=${filtro}&p=${pagina - 1}`} className="font-semibold text-navy underline">‹ Anterior</Link>}
          <span className="text-tinta">Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas && <Link href={`/importar?v=${filtro}&p=${pagina + 1}`} className="font-semibold text-navy underline">Próxima ›</Link>}
        </nav>
      )}
    </section>
  );
}

function Item({ item, ocupado, rodar }: { item: ItemTela; ocupado: boolean; rodar: (fn: () => Promise<{ ok: boolean; erro?: string } | void>, ok?: string) => void }) {
  const difs = [...item.importacao_diferenca].sort((a, b) => a.id - b.id);
  const pend = difs.filter((d) => d.decisao === "pendente");
  const editavel = item.situacao === "pendente";
  const pronto = editavel && pend.length === 0;

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-borda bg-white p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong className="text-sm">Grupo {item.grupo_numero ?? "?"}</strong>
        {item.assembleia_numero && <span className="text-xs text-tinta">{item.assembleia_numero}ª assembleia</span>}
        {item.tipo && <span className="rounded-full bg-linha px-2 py-0.5 text-[11px] font-bold text-navy">{TIPO[item.tipo] ?? item.tipo}</span>}
        <span className="text-xs text-tinta">{item.arquivo}</span>
        <span className="ml-auto flex gap-2">
          {pronto && (
            <button type="button" disabled={ocupado} className={BTN + " bg-laranja text-navy hover:brightness-95"} onClick={() => rodar(async () => {
              const r = await aplicarItens([item.id]);
              if (!r.ok) return r;
              if (r.falhas.length) return { ok: false, erro: `${r.falhas[0].arquivo}: ${r.falhas[0].motivo}` };
            }, "Aplicado na base.")}>
              Aplicar na base
            </button>
          )}
          {editavel && (
            <button type="button" disabled={ocupado} className={BTN + " border border-borda-campo text-tinta hover:bg-linha"} onClick={() => rodar(() => descartarItem(item.id), "PDF descartado.")}>
              Descartar PDF
            </button>
          )}
        </span>
      </div>
      {item.motivo && <p className="text-xs text-alerta">{item.motivo}</p>}
      {editavel && difs.length === 0 && <p className="text-xs text-tinta">Sem diferenças: nova assembleia igual à anterior. Pronto para aplicar.</p>}
      {difs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-[13px]">
            <thead>
              <tr className="border-b border-linha text-[11px] font-semibold uppercase tracking-wide text-tinta">
                <th className="py-1.5 pr-3">Diferença</th>
                <th className="py-1.5 pr-3">Base hoje</th>
                <th className="py-1.5 pr-3">PDF</th>
                <th className="py-1.5">Decisão</th>
              </tr>
            </thead>
            <tbody>
              {difs.map((d) => (
                <Linha key={d.id} d={d} editavel={editavel} ocupado={ocupado} rodar={rodar} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}

function Linha({ d, editavel, ocupado, rodar }: { d: Dif; editavel: boolean; ocupado: boolean; rodar: (fn: () => Promise<{ ok: boolean; erro?: string } | void>, ok?: string) => void }) {
  const tipo = tipoDoCampo(d.escopo, d.campo);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(paraEdicao(d.valor_novo, tipo));
  const cor = d.decisao === "pendente" ? "text-alerta" : d.decisao === "rejeitada" ? "text-tinta" : "text-ok";
  const nome = d.decisao === "pendente" ? "Falta decidir" : d.decisao === "aceita" ? "Aceita" : d.decisao === "rejeitada" ? "Rejeitada" : "Editada";

  return (
    <tr className="border-b border-linha align-top last:border-0">
      <td className="py-2 pr-3 font-semibold">{d.rotulo}</td>
      <td className="py-2 pr-3 break-words text-tinta">{textoDoValor(d.escopo, d.campo, d.valor_atual)}</td>
      <td className="py-2 pr-3 break-words">{textoDoValor(d.escopo, d.campo, d.valor_novo)}</td>
      <td className="py-2">
        <div className={"mb-1 text-xs font-bold " + cor}>
          {nome}
          {d.decisao === "editada" && <span className="font-normal text-tinta"> → {textoDoValor(d.escopo, d.campo, d.valor_final)}</span>}
        </div>
        {editavel && !editando && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" disabled={ocupado || d.decisao === "aceita"} className={BTN + " bg-ok text-white hover:brightness-110"} onClick={() => rodar(() => decidir([d.id], "aceita"))}>
              Aceitar
            </button>
            <button type="button" disabled={ocupado || d.decisao === "rejeitada"} className={BTN + " border border-borda-campo text-tinta hover:bg-linha"} onClick={() => rodar(() => decidir([d.id], "rejeitada"))}>
              Rejeitar
            </button>
            {tipo !== "nenhum" && (
              <button type="button" disabled={ocupado} className={BTN + " bg-navy text-white hover:brightness-110"} onClick={() => setEditando(true)}>
                Editar
              </button>
            )}
            {d.decisao !== "pendente" && (
              <button type="button" disabled={ocupado} className="text-[11px] font-semibold text-navy underline" onClick={() => rodar(() => decidir([d.id], "pendente"))}>
                Desfazer
              </button>
            )}
          </div>
        )}
        {editavel && editando && (
          <form
            className="flex flex-wrap items-center gap-1.5"
            onSubmit={(ev) => {
              ev.preventDefault();
              rodar(async () => {
                const r = await editarDiferenca(d.id, texto);
                if (r.ok) setEditando(false);
                return r;
              });
            }}
          >
            <input className="campo-sm !w-48 !text-left" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={`Novo valor de ${d.rotulo}`} autoFocus />
            <button type="submit" disabled={ocupado} className={BTN + " bg-laranja text-navy"}>Salvar</button>
            <button type="button" className="text-[11px] font-semibold text-navy underline" onClick={() => setEditando(false)}>Cancelar</button>
          </form>
        )}
      </td>
    </tr>
  );
}
