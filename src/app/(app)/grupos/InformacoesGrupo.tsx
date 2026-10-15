"use client";

import { createContext, useContext, useRef, useState, useTransition } from "react";
import { MESES, milhar, pct } from "@/lib/formato";
import { salvarCampoGrupo, type CampoGrupo } from "./actions";

type Props = {
  numero: number;
  participantes: number | null;
  taxaAdm: number | null;
  fundoReserva: number | null;
  indice: string | null;
  mesReajuste: number | null;
  diaVencimento: number | null;
  primeiraCorrecao: string | null;
  indices: { sigla: string; nome: string }[];
  children: React.ReactNode;
};

type Estado = { tipo: "ocioso" } | { tipo: "salvando" } | { tipo: "salvo" } | { tipo: "erro"; msg: string };

type Valores = {
  participantes: string;
  taxa_adm_total: string;
  fundo_reserva: string;
  indice: string;
  mes_reajuste: string;
  dia_vencimento: string;
};

type Ctx = {
  valores: Valores;
  estado: Estado;
  primeiraCorrecao: string | null;
  indices: { sigla: string; nome: string }[];
  mostrar: boolean;
  alternarMostrar: () => void;
  muda: (c: CampoGrupo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  sai: (c: CampoGrupo) => (e: React.FocusEvent<HTMLInputElement>) => void;
  enter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  escolhe: (c: CampoGrupo) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const InfoCtx = createContext<Ctx | null>(null);
const useInfo = () => {
  const c = useContext(InfoCtx);
  if (!c) throw new Error("fora de <InformacoesProvider>");
  return c;
};

// Estado único dos dados do grupo: a faixa do cabeçalho e a janela "mais informações" editam os mesmos valores.
// Cada campo grava no banco assim que é alterado (ao sair do campo, ou ao escolher numa lista).
export function InformacoesProvider(p: Props) {
  const [valores, setValores] = useState<Valores>({
    participantes: milhar(p.participantes),
    taxa_adm_total: pct(p.taxaAdm),
    fundo_reserva: pct(p.fundoReserva),
    indice: p.indice ?? "",
    mes_reajuste: p.mesReajuste ? String(p.mesReajuste) : "",
    dia_vencimento: p.diaVencimento ? String(p.diaVencimento) : "",
  });
  const [gravados, setGravados] = useState(valores); // o que já está no banco
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [mostrar, setMostrar] = useState(true); // participantes, taxa e índice no cabeçalho (botão ⋯ mostra/oculta)
  const [, iniciar] = useTransition();

  function gravar(campo: CampoGrupo, valor: string) {
    if (valor === gravados[campo]) return;
    setEstado({ tipo: "salvando" });
    iniciar(async () => {
      const r = await salvarCampoGrupo(p.numero, campo, valor);
      if (r.ok) {
        setGravados((g) => ({ ...g, [campo]: valor }));
        setEstado({ tipo: "salvo" });
      } else {
        setEstado({ tipo: "erro", msg: r.erro });
      }
    });
  }

  const muda: Ctx["muda"] = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));
  const sai: Ctx["sai"] = (campo) => (e) => gravar(campo, e.target.value);
  const enter: Ctx["enter"] = (e) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };
  const escolhe: Ctx["escolhe"] = (campo) => (e) => {
    muda(campo)(e);
    gravar(campo, e.target.value);
  };

  return (
    <InfoCtx.Provider value={{ valores, estado, primeiraCorrecao: p.primeiraCorrecao, indices: p.indices, mostrar, alternarMostrar: () => setMostrar((v) => !v), muda, sai, enter, escolhe }}>
      {p.children}
    </InfoCtx.Provider>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5 text-[10px] font-semibold tracking-wide text-tinta uppercase">
      {rotulo}
      {children}
    </label>
  );
}

function Status({ estado, className = "" }: { estado: Estado; className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={"text-[11px] font-semibold " + (estado.tipo === "erro" ? "text-[#9b1c1c] " : estado.tipo === "salvo" ? "text-ok " : "text-tinta ") + className}
    >
      {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : estado.tipo === "erro" ? estado.msg : ""}
    </span>
  );
}

/** Faixa do cabeçalho do grupo: participantes, taxa e índice (o botão ⋯ mostra/oculta). */
export function InformacoesGrupo() {
  const { valores, estado, indices, mostrar, muda, sai, enter, escolhe } = useInfo();
  if (!mostrar) return null;
  return (
    <section aria-label="Informações do grupo" className="flex flex-wrap items-end gap-x-3 gap-y-1.5 self-center">
      <Linha rotulo="Participantes">
        <input className="campo-sm !w-[5.5rem]" inputMode="numeric" value={valores.participantes} onChange={muda("participantes")} onBlur={sai("participantes")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Taxa adm. total">
        <input className="campo-sm !w-[5.5rem]" inputMode="decimal" value={valores.taxa_adm_total} onChange={muda("taxa_adm_total")} onBlur={sai("taxa_adm_total")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Índice">
        <select className="campo-sm !w-[6.5rem]" value={valores.indice} onChange={escolhe("indice")}>
          <option value="">—</option>
          {indices.map((i) => (
            <option key={i.sigla} value={i.sigla}>
              {i.sigla}
            </option>
          ))}
        </select>
      </Linha>
      <Status estado={estado} className="pb-1.5" />
    </section>
  );
}

/** Botão ⋯ ao lado do "+": mostra ou oculta participantes, taxa de adm. total e índice no cabeçalho. */
export function AlternarInformacoes() {
  const { mostrar, alternarMostrar } = useInfo();
  return (
    <button
      type="button"
      aria-pressed={mostrar}
      onClick={alternarMostrar}
      aria-label={mostrar ? "Ocultar participantes, taxa e índice" : "Mostrar participantes, taxa e índice"}
      title={mostrar ? "Ocultar participantes, taxa e índice" : "Mostrar participantes, taxa e índice"}
      className={"flex h-6 w-6 items-center justify-center rounded-md border text-base leading-none font-bold " + (mostrar ? "border-navy bg-lavanda text-navy" : "border-borda-campo bg-white text-tinta hover:border-navy")}
    >
      <span aria-hidden="true" className="-mt-1.5">…</span>
    </button>
  );
}

/** Botão "+" ao lado do título do grupo: abre a janela com fundo de reserva, reajuste e vencimento. */
export function MaisInformacoes({ numero }: { numero: number }) {
  const { valores, estado, primeiraCorrecao, muda, sai, enter, escolhe } = useInfo();
  const janela = useRef<HTMLDialogElement>(null);
  const semFundo = valores.fundo_reserva === "";

  return (
    <>
      <button
        type="button"
        onClick={() => janela.current?.showModal()}
        aria-label="Mais informações do grupo"
        title="Mais informações do grupo"
        className="flex h-6 w-6 items-center justify-center rounded-md border border-borda-campo bg-white text-base leading-none font-bold text-navy hover:border-navy"
      >
        +
      </button>

      <dialog
        ref={janela}
        aria-label={`Mais informações do grupo ${numero}`}
        onClick={(e) => e.target === janela.current && janela.current?.close()} // clique no fundo fecha
        className="m-auto w-[22rem] max-w-[92vw] rounded-2xl border border-borda bg-white p-0 text-navy shadow-[0_20px_60px_rgba(13,5,64,0.3)] backdrop:bg-navy/40"
      >
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Grupo {numero} · mais informações</h3>
            <Status estado={estado} />
          </div>

          <Linha rotulo="Fundo de reserva">
            <input
              className={"campo-sm !w-full " + (semFundo ? "border-alerta-borda bg-alerta-fundo" : "")}
              inputMode="decimal"
              placeholder="—"
              value={valores.fundo_reserva}
              onChange={muda("fundo_reserva")}
              onBlur={sai("fundo_reserva")}
              onKeyDown={enter}
            />
          </Linha>
          <Linha rotulo="Reajuste anual em">
            <select className="campo-sm !w-full" value={valores.mes_reajuste} onChange={escolhe("mes_reajuste")}>
              <option value="">—</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Linha>
          {primeiraCorrecao && (
            <Linha rotulo="1ª correção">
              <input
                className="campo-sm !w-full"
                readOnly
                value={`${MESES[Number(primeiraCorrecao.slice(5, 7)) - 1]}/${primeiraCorrecao.slice(0, 4)}`}
              />
            </Linha>
          )}
          <Linha rotulo="Dia de vencimento">
            <input className="campo-sm !w-full" inputMode="numeric" value={valores.dia_vencimento} onChange={muda("dia_vencimento")} onBlur={sai("dia_vencimento")} onKeyDown={enter} />
          </Linha>

          <button
            type="button"
            onClick={() => janela.current?.close()}
            className="mt-1 min-h-8 w-fit self-end rounded-[10px] bg-navy px-4 text-xs font-bold text-white hover:brightness-110"
          >
            Fechar
          </button>
        </div>
      </dialog>
    </>
  );
}
