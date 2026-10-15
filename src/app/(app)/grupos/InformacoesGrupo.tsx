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
    <label className="flex flex-col gap-0.5 text-[10px] font-semibold tracking-wide text-tinta uppercase">
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

  // faixa horizontal no cabeçalho do grupo; cada campo grava ao sair dele
  return (
    <section aria-label="Informações do grupo" className="flex flex-wrap items-end gap-x-3 gap-y-1.5 self-center">
      <Linha rotulo="Participantes">
        <input className="campo-sm !w-[5.5rem]" inputMode="numeric" value={valores.participantes} onChange={muda("participantes")} onBlur={sai("participantes")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Taxa adm. total">
        <input className="campo-sm !w-[5.5rem]" inputMode="decimal" value={valores.taxa_adm_total} onChange={muda("taxa_adm_total")} onBlur={sai("taxa_adm_total")} onKeyDown={enter} />
      </Linha>
      <Linha rotulo="Fundo de reserva">
        <input
          className={"campo-sm !w-[5.5rem] " + (valores.fundo_reserva === "" ? "border-alerta-borda bg-alerta-fundo" : "")}
          inputMode="decimal"
          placeholder="—"
          value={valores.fundo_reserva}
          onChange={muda("fundo_reserva")}
          onBlur={sai("fundo_reserva")}
          onKeyDown={enter}
        />
      </Linha>
      <Linha rotulo="Índice">
        <select className="campo-sm !w-[6.5rem]" value={valores.indice} onChange={escolhe("indice")}>
          <option value="">—</option>
          {p.indices.map((i) => (
            <option key={i.sigla} value={i.sigla}>
              {i.sigla}
            </option>
          ))}
        </select>
      </Linha>
      <Linha rotulo="Reajuste em">
        <select className="campo-sm !w-[6.5rem]" value={valores.mes_reajuste} onChange={escolhe("mes_reajuste")}>
          <option value="">—</option>
          {MESES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </Linha>
      <Linha rotulo="Vencimento">
        <input className="campo-sm !w-[5.5rem]" inputMode="numeric" value={valores.dia_vencimento} onChange={muda("dia_vencimento")} onBlur={sai("dia_vencimento")} onKeyDown={enter} />
      </Linha>
      {p.primeiraCorrecao && (
        <Linha rotulo="1ª correção">
          <input
            className="campo-sm !w-[6.5rem]"
            readOnly
            value={`${MESES[Number(p.primeiraCorrecao.slice(5, 7)) - 1]}/${p.primeiraCorrecao.slice(0, 4)}`}
          />
        </Linha>
      )}

      <span
        role="status"
        aria-live="polite"
        className={"pb-1.5 text-[11px] font-semibold " + (estado.tipo === "erro" ? "text-[#9b1c1c]" : estado.tipo === "salvo" ? "text-ok" : "text-tinta")}
      >
        {estado.tipo === "salvando" ? "Salvando…" : estado.tipo === "salvo" ? "Salvo ✓" : estado.tipo === "erro" ? estado.msg : ""}
      </span>
    </section>
  );
}
