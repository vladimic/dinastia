"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { alternarTipoParcela, carregarLote, definirPagamentoComFuro, fecharLote, type DadosLote, type LinhaLote } from "./actions";
import { useFiltrosGrupos } from "./FiltrosGrupos";
import type { ItemGrupo } from "./SeletorGrupo";

// Edição em lote (botão do cabeçalho de Grupos e Tabelas): uma tabela com todos os grupos da família, em que se liga ou desliga
// cada tipo de parcela e o furo. Cada clique já grava na base. Os filtros são os mesmos da lista de grupos.
// Os filtros valem para o que foi lido ao abrir: a linha não some da tela no meio da edição.

type Estado = { tipo: "carregando" } | { tipo: "erro"; msg: string } | { tipo: "pronto"; dados: DadosLote };

export function EdicaoLote({ familia, nomeFamilia }: { familia: string; nomeFamilia: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  function abrir() {
    setEstado({ tipo: "carregando" });
    setAberto(true);
    carregarLote(familia).then((r) => setEstado(r.ok ? { tipo: "pronto", dados: r.dados } : { tipo: "erro", msg: r.erro }));
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex min-h-9 items-center gap-2 rounded-[10px] border border-navy bg-white px-3 text-[13px] font-semibold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M9 4v16M15 10v10" />
        </svg>
        Edição em lote
      </button>
      {aberto &&
        createPortal(
          <Tela
            familia={familia}
            nomeFamilia={nomeFamilia}
            estado={estado}
            aoFechar={() => setAberto(false)}
          />,
          document.body,
        )}
    </>
  );
}

function Tela({ familia, nomeFamilia, estado, aoFechar }: { familia: string; nomeFamilia: string; estado: Estado; aoFechar: () => void }) {
  const [fechando, iniciarFechar] = useTransition();
  const [pendentes, setPendentes] = useState(0);
  const [falha, setFalha] = useState("");

  // a tela cobre a página: a rolagem da página fica parada enquanto ela está aberta
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  const fechar = () =>
    iniciarFechar(async () => {
      await fecharLote(familia); // refaz a lista guardada da família
      aoFechar();
    });

  return (
    <div role="dialog" aria-modal="true" aria-label="Edição em lote" className="fixed inset-0 z-50 flex flex-col bg-campo">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-white px-6 py-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-tinta">Grupos e Tabelas · {nomeFamilia}</span>
          <h2 className="text-xl leading-tight font-bold">Edição em lote</h2>
        </div>
        <div className="flex items-center gap-3">
          <span role="status" aria-live="polite" className={"text-[12px] font-semibold " + (falha ? "text-[#9b1c1c]" : "text-tinta")}>
            {falha || (pendentes > 0 ? "Salvando…" : estado.tipo === "pronto" ? "Tudo salvo" : "")}
          </span>
          <button
            type="button"
            onClick={fechar}
            disabled={fechando || pendentes > 0}
            className="min-h-9 rounded-[10px] bg-navy px-4 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            {fechando ? "Fechando…" : "Fechar edição em lote"}
          </button>
        </div>
      </header>
      {estado.tipo === "carregando" && <p className="px-6 py-6 text-sm text-tinta">Carregando os grupos…</p>}
      {estado.tipo === "erro" && (
        <p role="alert" className="px-6 py-6 text-sm font-semibold text-[#9b1c1c]">
          {estado.msg}
        </p>
      )}
      {estado.tipo === "pronto" && <Tabela familia={familia} dados={estado.dados} mudarPendentes={(n) => setPendentes((p) => p + n)} aviso={setFalha} />}
    </div>
  );
}

const paraItem = (l: LinhaLote, tipos: DadosLote["tipos"]): ItemGrupo => ({
  numero: l.numero,
  prazo: l.prazo,
  assembleia: l.assembleia,
  data: l.data,
  min: l.min,
  max: l.max,
  participantes: l.participantes,
  furo: l.furo,
  reduzidas: tipos.filter((t) => t.pct < 100 && l.tipos.includes(t.codigo)).map((t) => t.pct).sort((a, b) => a - b),
  seq: [],
});

function Tabela({ familia, dados, mudarPendentes, aviso }: { familia: string; dados: DadosLote; mudarPendentes: (n: number) => void; aviso: (m: string) => void }) {
  const [linhas, setLinhas] = useState(dados.linhas);
  // fotografia da lista ao abrir: é ela que os filtros enxergam
  const [fotos] = useState(() => dados.linhas.map((l) => paraItem(l, dados.tipos)));
  const { visiveis, barra } = useFiltrosGrupos(fotos, familia);
  const mostrar = new Set(visiveis.map((g) => g.numero));
  const lista = linhas.filter((l) => mostrar.has(l.numero));

  // liga ou desliga na tela já e grava; se a gravação falhar, a célula volta ao que era
  async function gravar(numero: number, mudar: (l: LinhaLote) => LinhaLote, desfazer: (l: LinhaLote) => LinhaLote, enviar: () => Promise<{ ok: boolean }>) {
    aviso("");
    setLinhas((ls) => ls.map((l) => (l.numero === numero ? mudar(l) : l)));
    mudarPendentes(1);
    let ok = false;
    try {
      ok = (await enviar()).ok;
    } catch {
      ok = false;
    }
    mudarPendentes(-1);
    if (!ok) {
      setLinhas((ls) => ls.map((l) => (l.numero === numero ? desfazer(l) : l)));
      aviso(`Não foi possível salvar o grupo ${numero}. A alteração foi desfeita.`);
    }
  }

  const alternarTipo = (l: LinhaLote, codigo: string) => {
    const marcado = !l.tipos.includes(codigo);
    return gravar(
      l.numero,
      (x) => ({ ...x, tipos: marcado ? [...x.tipos, codigo] : x.tipos.filter((t) => t !== codigo) }),
      (x) => ({ ...x, tipos: marcado ? x.tipos.filter((t) => t !== codigo) : [...x.tipos, codigo] }),
      () => alternarTipoParcela(l.versaoId, codigo, marcado, false),
    );
  };
  const alternarFuro = (l: LinhaLote) => {
    const novo = !l.furo;
    return gravar(l.numero, (x) => ({ ...x, furo: novo }), (x) => ({ ...x, furo: !novo }), () => definirPagamentoComFuro(l.versaoId, novo, false));
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-borda bg-white px-6 py-3">{barra}</div>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <table className="border-separate border-spacing-0 text-[13px]">
          <caption className="sr-only">Grupos, tipos de parcela e furo</caption>
          <thead>
            <tr>
              <th scope="col" className={CAB + " sticky left-0 z-20 text-left"}>
                Grupo
              </th>
              {dados.tipos.map((t) => (
                <th key={t.codigo} scope="col" className={CAB + " text-center"} title={t.descricao}>
                  {t.pct}%
                </th>
              ))}
              <th scope="col" className={CAB + " text-center"}>
                Furo
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map((l) => (
              <tr key={l.numero} className="group">
                <th scope="row" className={CEL + " sticky left-0 z-10 bg-white text-left font-extrabold tabular-nums group-hover:bg-lavanda"}>
                  {l.numero}
                </th>
                {dados.tipos.map((t) => (
                  <td key={t.codigo} className={CEL + " bg-white text-center group-hover:bg-lavanda"}>
                    <Chave ligada={l.tipos.includes(t.codigo)} rotulo={`Grupo ${l.numero}: parcela ${t.pct}%`} aoAlternar={() => alternarTipo(l, t.codigo)} />
                  </td>
                ))}
                <td className={CEL + " bg-white text-center group-hover:bg-lavanda"}>
                  <Chave ligada={l.furo} rotulo={`Grupo ${l.numero}: pagamento com furo`} aoAlternar={() => alternarFuro(l)} />
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={dados.tipos.length + 2} className="px-3 py-4 text-sm text-tinta">
                  Nenhum grupo com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const CAB = "sticky top-0 z-10 border-b border-borda bg-linha px-4 py-2 text-[12px] font-bold text-navy first:rounded-tl-lg last:rounded-tr-lg";
const CEL = "border-b border-linha px-4 py-1.5";

// verde = ligado (o grupo oferece / tem furo); cinza = desligado
function Chave({ ligada, rotulo, aoAlternar }: { ligada: boolean; rotulo: string; aoAlternar: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={"relative h-5 w-9 shrink-0 rounded-full transition-colors " + (ligada ? "bg-ok" : "bg-[#cfcbe0]")}
    >
      <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (ligada ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}
