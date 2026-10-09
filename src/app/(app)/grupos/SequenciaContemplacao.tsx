"use client";

import { useMemo, useState, useTransition } from "react";
import { CANCELADA, linhaDoModelo, notaFidelidade, notaSorteios, SORTEIO, type ModeloSequencia } from "@/lib/sequencia";
import { salvarSequencia } from "./actions";

type Tipo = { codigo: string; nome: string; cor: string };
type Posicao = { codigo: string; nome: string; cor: string };

type Props = {
  versaoId: number;
  modelo: ModeloSequencia | null;
  linha: Posicao[];
  faixas: { de: number; ate: number; ordem: Posicao[] }[];
  tipos: Tipo[];
  fidelidadeMeses: number | null;
};

const CTRL = "h-8 rounded-lg border border-borda-campo bg-campo px-2 text-[13px] text-navy outline-none focus:ring-2 focus:ring-laranja read-only:bg-linha";
const CAIXA = "flex w-fit max-w-full flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5";

function Codigos({ itens }: { itens: Posicao[] }) {
  return (
    <ol className="flex flex-wrap gap-x-0.5 gap-y-0.5 text-[13px] font-bold lowercase">
      {itens.map((o, k) => (
        <li
          key={k}
          tabIndex={0}
          style={{ color: o.cor }}
          className="group relative w-[1.45rem] cursor-help rounded outline-none focus-visible:ring-1 focus-visible:ring-navy"
        >
          {o.codigo}
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-semibold normal-case text-white shadow-lg group-hover:block group-focus:block"
          >
            {o.nome}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function SequenciaContemplacao({ versaoId, modelo, linha, faixas, tipos, fidelidadeMeses }: Props) {
  const [editando, setEditando] = useState(false);
  const [sorteios, setSorteios] = useState<{ de: string; qtd: string }[]>([]);
  const [ordem, setOrdem] = useState<string[]>([]);
  const [demais, setDemais] = useState("");
  const [fid, setFid] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const livres = tipos.filter((t) => t.codigo !== SORTEIO && t.codigo !== CANCELADA);
  const porCodigo = useMemo(() => new Map(tipos.map((t) => [t.codigo, t])), [tipos]);

  function abrir() {
    if (!modelo) return;
    setSorteios(modelo.sorteios.map((s) => ({ de: String(s.de), qtd: String(s.qtd) })));
    setOrdem([...modelo.ordem]);
    setDemais(modelo.demais ?? "");
    setFid(fidelidadeMeses ? String(fidelidadeMeses) : "");
    setErro(null);
    setEditando(true);
  }

  // prévia da linha com o que está digitado
  const previa: Posicao[] = useMemo(() => {
    if (!modelo || !editando) return [];
    const s = sorteios.map((x) => ({ de: Number(x.de) || 1, qtd: Number(x.qtd) || 0 }));
    const m: ModeloSequencia = { ...modelo, sorteios: s.length ? s : [{ de: 1, qtd: 1 }], ordem, demais: demais || null };
    return linhaDoModelo(m).map((c) => porCodigo.get(c) ?? { codigo: c, nome: c, cor: "#5b5680" });
  }, [modelo, editando, sorteios, ordem, demais, porCodigo]);

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await salvarSequencia(versaoId, {
        sorteios: sorteios.map((s) => ({ de: Number(s.de), qtd: Number(s.qtd) })),
        ordem,
        demais: demais || null,
        fidelidadeMeses: fid.trim() ? Number(fid) : null,
      });
      if (r.ok) setEditando(false);
      else setErro(r.erro);
    });
  }

  // Enter dentro do editor não pode enviar o formulário do grupo
  const semEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
  };

  const notas = modelo?.simples ? [notaSorteios(modelo), notaFidelidade(fidelidadeMeses)].filter(Boolean) : [];

  if (!editando) {
    return (
      <section className={CAIXA}>
        <div className="flex items-center justify-between gap-6">
          <h3 className="text-sm font-bold">Sequência de contemplação</h3>
          {modelo?.simples && (
            <button type="button" onClick={abrir} className="text-xs font-semibold text-tinta underline hover:text-navy">
              Editar
            </button>
          )}
        </div>
        {modelo?.simples ? (
          <Codigos itens={linha} />
        ) : (
          <>
            {faixas.map((f) => (
              <div key={f.de} className="flex items-center gap-3">
                <div className="w-[5.5rem] shrink-0 text-xs font-bold text-tinta">
                  {f.de}ª a {f.ate}ª
                </div>
                <Codigos itens={f.ordem} />
              </div>
            ))}
            {modelo && (
              <p className="text-[11px] font-semibold text-alerta">
                Regra específica: as faixas diferem além de sorteio e fidelidade; edição desativada.
              </p>
            )}
          </>
        )}
        {notas.map((n) => (
          <p key={n} className="text-[11px] text-tinta">
            {n}
          </p>
        ))}
      </section>
    );
  }

  return (
    <section className={CAIXA + " w-[34rem]"} onKeyDown={semEnter}>
      <h3 className="text-sm font-bold">Editar sequência de contemplação</h3>
      <Codigos itens={previa} />

      <div className="flex flex-col gap-1.5 border-t border-linha pt-2">
        <div className="text-xs font-bold text-tinta">Sorteios</div>
        {sorteios.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-tinta">
            <select
              className={CTRL + " w-14"}
              value={s.qtd}
              aria-label="Quantidade de sorteios"
              onChange={(e) => setSorteios((l) => l.map((x, k) => (k === i ? { ...x, qtd: e.target.value } : x)))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            sorteio(s) a partir do mês
            <input
              className={CTRL + " w-16 text-right"}
              inputMode="numeric"
              value={s.de}
              readOnly={i === 0}
              aria-label="A partir do mês"
              onChange={(e) => setSorteios((l) => l.map((x, k) => (k === i ? { ...x, de: e.target.value.replace(/\D/g, "") } : x)))}
            />
            {i > 0 && (
              <button type="button" aria-label="Remover linha de sorteios" onClick={() => setSorteios((l) => l.filter((_, k) => k !== i))} className="px-1 text-sm font-bold text-tinta hover:text-navy">
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSorteios((l) => [...l, { de: String((Number(l[l.length - 1]?.de) || 1) + 12), qtd: l[l.length - 1]?.qtd ?? "1" }])}
          className="w-fit text-xs font-semibold text-tinta underline hover:text-navy"
        >
          + mudança de sorteios
        </button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-linha pt-2">
        <div className="text-xs font-bold text-tinta">Ordem depois dos sorteios</div>
        <div className="flex flex-wrap gap-1">
          {ordem.map((c, i) => (
            <select
              key={i}
              className={CTRL + " w-[4.6rem] font-bold uppercase"}
              style={{ color: porCodigo.get(c)?.cor }}
              value={c}
              aria-label={`Posição ${i + 1}`}
              onChange={(e) => (e.target.value === "-" ? setOrdem((l) => l.filter((_, k) => k !== i)) : setOrdem((l) => l.map((x, k) => (k === i ? e.target.value : x))))}
            >
              {livres.map((t) => (
                <option key={t.codigo} value={t.codigo}>
                  {t.codigo}
                </option>
              ))}
              <option value="-">✕ remover</option>
            </select>
          ))}
          {ordem.length < 24 && (
            <button
              type="button"
              onClick={() => setOrdem((l) => [...l, l[l.length - 1] ?? livres[0]?.codigo ?? "LIV"])}
              className="min-h-8 rounded-[10px] border border-borda-campo px-2.5 text-xs font-semibold text-tinta hover:bg-linha"
            >
              + posição
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-linha pt-2">
        <label className="flex flex-col gap-1 text-xs font-bold text-tinta">
          Demais contemplações
          <select className={CTRL + " w-full"} value={demais} onChange={(e) => setDemais(e.target.value)}>
            <option value="">repetir a ordem (sem sorteio)</option>
            {livres.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                só {t.codigo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-tinta">
          Fidelidade libera no mês
          <input className={CTRL + " w-full"} inputMode="numeric" placeholder="em branco = sem fidelidade" value={fid} onChange={(e) => setFid(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>

      {erro && (
        <p role="alert" className="text-xs font-semibold text-[#9b1c1c]">
          {erro}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="button" disabled={pendente} onClick={salvar} className="min-h-8 rounded-[10px] bg-navy px-4 text-xs font-bold text-white hover:brightness-110 disabled:opacity-60">
          {pendente ? "Salvando…" : "Salvar sequência"}
        </button>
        <button type="button" disabled={pendente} onClick={() => setEditando(false)} className="min-h-8 rounded-[10px] border border-borda-campo px-3 text-xs font-semibold text-tinta hover:bg-linha">
          Cancelar
        </button>
      </div>
    </section>
  );
}
