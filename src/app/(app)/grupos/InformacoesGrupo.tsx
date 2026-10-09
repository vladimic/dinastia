"use client";

import { useState, useTransition } from "react";
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
};

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[1fr_6rem] items-center gap-2 text-xs font-semibold text-tinta">
      {rotulo}
      {children}
    </label>
  );
}

type Estado = { tipo: "ocioso" } | { tipo: "salvando" } | { tipo: "salvo" } | { tipo: "erro"; msg: string };

// Cada campo grava no banco assim que é alterado (ao sair do campo, ou ao escolher numa lista).
export function InformacoesGrupo(p: Props) {
  const [valores, setValores] = useState({
    participantes: milhar(p.participantes),
    taxa_adm_total: pct(p.taxaAdm),
    fundo_reserva: pct(p.fundoReserva),
    indice: p.indice ?? "",
    mes_reajuste: p.mesReajuste ? String(p.mesReajuste) : "",
    dia_vencimento: p.diaVencimento ? String(p.diaVencimento) : "",
  });
  const [gravados, setGravados] = useState(valores); // o que já está no banco
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
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

  const muda = (campo: CampoGrupo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValores((v) => ({ ...v, [campo]: e.target.value }));
  const sai = (campo: CampoGrupo) => (e: React.FocusEvent<HTMLInputElement>) => gravar(campo, e.target.value);
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };
  const escolhe = (campo: CampoGrupo) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    muda(campo)(e);
    gravar(campo, e.target.value);
  };

  return (
    <section className="flex w-[15.5rem] flex-col gap-2 rounded-2xl border border-borda bg-white p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Informações do grupo</h3>
        <span
          role="status"
          aria-live="polite"
          className={
            "text-[11px] font-semibold " +
            (estado.tipo === "erro" ? "text-[#9b1c1c]" : estado.tipo === "salvo" ? "text-ok" : "text-tinta")
          }
        >
          {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : ""}
        </span>
      </div>

      <Linha rotulo="Participantes">
        <input className="campo-sm" inputMode="numeric" value={valores.participantes} onChange={muda("participantes")} onBlur={sai("participantes")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Taxa de adm. total">
        <input className="campo-sm" inputMode="decimal" value={valores.taxa_adm_total} onChange={muda("taxa_adm_total")} onBlur={sai("taxa_adm_total")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Fundo de reserva">
        <input
          className={"campo-sm " + (valores.fundo_reserva === "" ? "border-alerta-borda bg-alerta-fundo" : "")}
          inputMode="decimal"
          placeholder="—"
          value={valores.fundo_reserva}
          onChange={muda("fundo_reserva")}
          onBlur={sai("fundo_reserva")}
          onKeyDown={enter}
        />
      </Linha>
      <Linha rotulo="Índice de correção">
        <select className="campo-sm" value={valores.indice} onChange={escolhe("indice")}>
          <option value="">—</option>
          {p.indices.map((i) => (
            <option key={i.sigla} value={i.sigla}>
              {i.sigla}
            </option>
          ))}
        </select>
      </Linha>
      <Linha rotulo="Reajuste anual em">
        <select className="campo-sm" value={valores.mes_reajuste} onChange={escolhe("mes_reajuste")}>
          <option value="">—</option>
          {MESES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </Linha>
      <Linha rotulo="Dia de vencimento">
        <input className="campo-sm" inputMode="numeric" value={valores.dia_vencimento} onChange={muda("dia_vencimento")} onBlur={sai("dia_vencimento")} onKeyDown={enter} />
      </Linha>
      {p.primeiraCorrecao && (
        <Linha rotulo="1ª correção">
          <input
            className="campo-sm"
            readOnly
            value={`${MESES[Number(p.primeiraCorrecao.slice(5, 7)) - 1]}/${p.primeiraCorrecao.slice(0, 4)}`}
          />
        </Linha>
      )}

      {estado.tipo === "erro" && (
        <p role="alert" className="text-[11px] font-semibold text-[#9b1c1c]">
          {estado.msg}
        </p>
      )}
    </section>
  );
}
