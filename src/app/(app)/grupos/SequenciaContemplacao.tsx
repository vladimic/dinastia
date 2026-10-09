"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  CANCELADA,
  linhaDoModelo,
  notaFidelidade,
  notaSorteios,
  SORTEIO,
  validarEdicao,
  type Edicao,
  type ModeloSequencia,
} from "@/lib/sequencia";
import { BotaoFinalizar, BotaoLapis } from "./Lapis";
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

const CTRL =
  "h-8 rounded-lg border border-borda-campo bg-campo px-2 text-[13px] text-navy outline-none focus:ring-2 focus:ring-laranja read-only:bg-linha";
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

type Campos = { sorteios: { de: string; qtd: string }[]; ordem: string[]; demais: string; fid: string };
type Estado = { tipo: "ocioso" } | { tipo: "salvando" } | { tipo: "salvo" } | { tipo: "erro"; msg: string };

const paraEdicao = (c: Campos): Edicao => ({
  sorteios: c.sorteios.map((s) => ({ de: Number(s.de), qtd: Number(s.qtd) })),
  ordem: c.ordem,
  demais: c.demais || null,
  fidelidadeMeses: c.fid.trim() ? Number(c.fid) : null,
});

export function SequenciaContemplacao({ versaoId, modelo, linha, faixas, tipos, fidelidadeMeses }: Props) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<Campos>({ sorteios: [], ordem: [], demais: "", fid: "" });
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [descartar, setDescartar] = useState(false);
  const [, iniciar] = useTransition();

  // cópia síncrona dos campos e controle da fila de gravação (só usados dentro de eventos)
  const atual = useRef<Campos>(campos);
  const ultimoGravado = useRef("");
  const fila = useRef<Edicao | null>(null);
  const emVoo = useRef(false);

  const livres = tipos.filter((t) => t.codigo !== SORTEIO && t.codigo !== CANCELADA);
  const porCodigo = useMemo(() => new Map(tipos.map((t) => [t.codigo, t])), [tipos]);
  const codigos = useMemo(() => new Set(tipos.map((t) => t.codigo)), [tipos]);

  function abrir() {
    if (!modelo) return;
    const c: Campos = {
      sorteios: modelo.sorteios.map((s) => ({ de: String(s.de), qtd: String(s.qtd) })),
      ordem: [...modelo.ordem],
      demais: modelo.demais ?? "",
      fid: fidelidadeMeses ? String(fidelidadeMeses) : "",
    };
    atual.current = c;
    ultimoGravado.current = JSON.stringify(paraEdicao(c));
    fila.current = null;
    setCampos(c);
    setEstado({ tipo: "ocioso" });
    setDescartar(false);
    setEditando(true);
  }

  // grava o que estiver na fila, uma gravação por vez (a última alteração sempre vence)
  function gravarFila() {
    if (emVoo.current) return;
    iniciar(async () => {
      while (fila.current) {
        const e = fila.current;
        fila.current = null;
        emVoo.current = true;
        setEstado({ tipo: "salvando" });
        const r = await salvarSequencia(versaoId, e);
        emVoo.current = false;
        if (r.ok) {
          ultimoGravado.current = JSON.stringify(e);
          setEstado({ tipo: "salvo" });
        } else {
          setEstado({ tipo: "erro", msg: r.erro });
          break;
        }
      }
    });
  }

  function persistir(c: Campos) {
    const e = paraEdicao(c);
    const erro = validarEdicao(e, codigos);
    if (erro) return setEstado({ tipo: "erro", msg: erro });
    if (JSON.stringify(e) === ultimoGravado.current) return setEstado({ tipo: "ocioso" });
    fila.current = e;
    gravarFila();
  }

  // altera os campos; "gravar" = grava já (listas e botões); digitação só grava ao sair do campo
  function mudar(fn: (c: Campos) => Campos, gravar: boolean) {
    const prox = fn(atual.current);
    atual.current = prox;
    setCampos(prox);
    if (gravar) persistir(prox);
  }

  // prévia da linha com o que está nos campos
  const previa: Posicao[] = useMemo(() => {
    if (!modelo || !editando) return [];
    const s = campos.sorteios.map((x) => ({ de: Number(x.de) || 1, qtd: Number(x.qtd) || 0 }));
    const m: ModeloSequencia = {
      ...modelo,
      sorteios: s.length ? s : [{ de: 1, qtd: 1 }],
      ordem: campos.ordem,
      demais: campos.demais || null,
    };
    return linhaDoModelo(m).map((c) => porCodigo.get(c) ?? { codigo: c, nome: c, cor: "#5b5680" });
  }, [modelo, editando, campos, porCodigo]);

  // Enter dentro do editor não pode enviar nada; sai do campo (e grava)
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  const notas = modelo?.simples ? [notaSorteios(modelo), notaFidelidade(fidelidadeMeses)].filter(Boolean) : [];

  if (!editando) {
    return (
      <section className={CAIXA}>
        <div className="flex items-center justify-between gap-6">
          <h3 className="text-sm font-bold">Sequência de contemplação</h3>
          {modelo?.simples && <BotaoLapis rotulo="Editar sequência de contemplação" onClick={abrir} />}
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
    <section className={CAIXA + " w-[34rem]"} onKeyDown={aoTeclar}>
      <div className="flex items-center justify-between gap-6">
        <h3 className="text-sm font-bold">Sequência de contemplação</h3>
        <span
          role="status"
          aria-live="polite"
          className={"text-[11px] font-semibold " + (estado.tipo === "salvo" ? "text-ok" : "text-tinta")}
        >
          {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : ""}
        </span>
      </div>
      <Codigos itens={previa} />

      <div className="flex flex-col gap-1.5 border-t border-linha pt-2">
        <div className="text-xs font-bold text-tinta">Sorteios</div>
        {campos.sorteios.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-tinta">
            <select
              className={CTRL + " w-14"}
              value={s.qtd}
              aria-label="Quantidade de sorteios"
              onChange={(e) =>
                mudar((c) => ({ ...c, sorteios: c.sorteios.map((x, k) => (k === i ? { ...x, qtd: e.target.value } : x)) }), true)
              }
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
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                mudar((c) => ({ ...c, sorteios: c.sorteios.map((x, k) => (k === i ? { ...x, de: v } : x)) }), false);
              }}
              onBlur={() => persistir(atual.current)}
            />
            {i > 0 && (
              <button
                type="button"
                aria-label="Remover linha de sorteios"
                onClick={() => mudar((c) => ({ ...c, sorteios: c.sorteios.filter((_, k) => k !== i) }), true)}
                className="px-1 text-sm font-bold text-tinta hover:text-navy"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            mudar((c) => {
              const ult = c.sorteios[c.sorteios.length - 1];
              return { ...c, sorteios: [...c.sorteios, { de: String((Number(ult?.de) || 1) + 12), qtd: ult?.qtd ?? "1" }] };
            }, true)
          }
          className="w-fit text-xs font-semibold text-tinta underline hover:text-navy"
        >
          + mudança de sorteios
        </button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-linha pt-2">
        <div className="text-xs font-bold text-tinta">Ordem depois dos sorteios</div>
        <div className="flex flex-wrap gap-1">
          {campos.ordem.map((c, i) => (
            <select
              key={i}
              className={CTRL + " w-[4.6rem] font-bold uppercase"}
              style={{ color: porCodigo.get(c)?.cor }}
              value={c}
              aria-label={`Posição ${i + 1}`}
              onChange={(e) =>
                mudar(
                  (x) => ({
                    ...x,
                    ordem:
                      e.target.value === "-" ? x.ordem.filter((_, k) => k !== i) : x.ordem.map((y, k) => (k === i ? e.target.value : y)),
                  }),
                  true,
                )
              }
            >
              {livres.map((t) => (
                <option key={t.codigo} value={t.codigo}>
                  {t.codigo}
                </option>
              ))}
              <option value="-">✕ remover</option>
            </select>
          ))}
          {campos.ordem.length < 24 && (
            <button
              type="button"
              onClick={() => mudar((c) => ({ ...c, ordem: [...c.ordem, c.ordem[c.ordem.length - 1] ?? livres[0]?.codigo ?? "LIV"] }), true)}
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
          <select
            className={CTRL + " w-full"}
            value={campos.demais}
            onChange={(e) => mudar((c) => ({ ...c, demais: e.target.value }), true)}
          >
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
          <input
            className={CTRL + " w-full"}
            inputMode="numeric"
            placeholder="em branco = sem fidelidade"
            value={campos.fid}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              mudar((c) => ({ ...c, fid: v }), false);
            }}
            onBlur={() => persistir(atual.current)}
          />
        </label>
      </div>

      {estado.tipo === "erro" && (
        <p role="alert" className="text-xs font-semibold text-[#9b1c1c]">
          {estado.msg}
        </p>
      )}
      {descartar && (
        <p className="text-[11px] font-semibold text-alerta">
          A última alteração não foi salva. Corrija o campo ou finalize para descartá-la.
        </p>
      )}
      <BotaoFinalizar
        rotulo={descartar ? "Descartar e finalizar" : undefined}
        onClick={() => {
          if (estado.tipo === "erro" && !descartar) return setDescartar(true);
          setEditando(false);
        }}
      />
    </section>
  );
}
