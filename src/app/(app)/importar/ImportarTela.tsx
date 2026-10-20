"use client";

import { useEffect, useState, useTransition } from "react";
import { BotaoPasta } from "@/components/BotaoPasta";
import { ajustarCaminho, guardarPasta, lerPastaGuardada } from "@/lib/pastaLocal";
import { salvarPasta } from "./actions";

type Pasta = { campo: string; rotulo: string; caminho: string };

const CHAVE_ATIVAS = "dinastia-importar-ativas";

export function ImportarTela({ pastas }: { pastas: Pasta[] }) {
  const [ativas, setAtivas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_ATIVAS) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê a preferência guardada neste navegador
      setAtivas(salvo);
    } catch {}
  }, []);

  const ligada = (campo: string) => ativas[campo] !== false; // padrão: ligada
  function alternar(campo: string) {
    const novo = { ...ativas, [campo]: !ligada(campo) };
    setAtivas(novo);
    try {
      localStorage.setItem(CHAVE_ATIVAS, JSON.stringify(novo));
    } catch {}
  }

  const quantas = pastas.filter((p) => ligada(p.campo)).length;

  return (
    <div className="flex max-w-[60rem] flex-col gap-4">
      <p className="text-sm text-tinta">
        Ligue as famílias que serão lidas e confira a pasta de PDFs de cada uma. O caminho vem dos Parâmetros globais; ao alterá-lo aqui ele passa a valer para todos.
      </p>
      <ul className="flex flex-col gap-3">
        {pastas.map((p) => (
          <Familia key={p.campo} pasta={p} ligada={ligada(p.campo)} alternar={() => alternar(p.campo)} />
        ))}
      </ul>
      <div className="flex items-center gap-3 border-t border-linha pt-3">
        <button
          type="button"
          disabled
          title="Próxima etapa"
          className="min-h-9 rounded-[10px] bg-navy px-5 text-sm font-bold text-white opacity-60"
        >
          Ler os PDFs das pastas ativas
        </button>
        <span className="text-xs text-tinta">
          {quantas} {quantas === 1 ? "família ligada" : "famílias ligadas"} · leitura e comparação com a base: próxima etapa
        </span>
      </div>
    </div>
  );
}

function Familia({ pasta, ligada, alternar }: { pasta: Pasta; ligada: boolean; alternar: () => void }) {
  const [caminho, setCaminho] = useState(pasta.caminho);
  const [salvo, setSalvo] = useState(pasta.caminho);
  const [liberada, setLiberada] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro" | "info"; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();
  const idRotulo = `fam-${pasta.campo}`;

  useEffect(() => {
    let vivo = true;
    lerPastaGuardada(pasta.campo).then((h) => {
      if (vivo && h) setLiberada(h.name);
    });
    return () => {
      vivo = false;
    };
  }, [pasta.campo]);

  function gravar(valor: string) {
    iniciar(async () => {
      const r = await salvarPasta(pasta.campo, valor);
      if (r.ok) {
        setSalvo(valor.trim());
        setMsg({ tipo: "ok", texto: "Caminho salvo." });
      } else setMsg({ tipo: "erro", texto: r.erro });
    });
  }

  return (
    <li className={"flex flex-col gap-2 rounded-2xl border bg-white p-4 " + (ligada ? "border-borda" : "border-linha opacity-70")}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={ligada}
          aria-labelledby={idRotulo}
          onClick={alternar}
          className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (ligada ? "bg-laranja" : "bg-[#cfcbe0]")}
        >
          <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (ligada ? "left-[22px]" : "left-0.5")} />
        </button>
        <span id={idRotulo} className="w-28 shrink-0 text-sm font-bold">
          {pasta.rotulo}
        </span>
        <input
          className="campo-sm !text-left font-mono"
          value={caminho}
          onChange={(e) => {
            setCaminho(e.target.value);
            setMsg(null);
          }}
          maxLength={500}
          spellCheck={false}
          autoComplete="off"
          aria-label={`Pasta dos PDFs de ${pasta.rotulo}`}
        />
        <BotaoPasta
          rotulo={pasta.rotulo}
          onEscolher={(h) => {
            const r = ajustarCaminho(caminho, h.name);
            setCaminho(r.caminho);
            setLiberada(h.name);
            guardarPasta(pasta.campo, h);
            setMsg(
              r.confere
                ? { tipo: "ok", texto: "Pasta liberada para leitura neste navegador." }
                : { tipo: "info", texto: `O navegador informa só o nome da pasta (${h.name}): confira o início do caminho e salve.` },
            );
          }}
        />
        <button
          type="button"
          onClick={() => gravar(caminho)}
          disabled={pendente || caminho.trim() === salvo}
          className="min-h-[30px] shrink-0 rounded-lg bg-navy px-3 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[3.5rem] text-[11px]">
        <span className={liberada ? "font-semibold text-ok" : "text-tinta"}>
          {liberada ? `Leitura liberada neste navegador: ${liberada}` : "Escolha a pasta (ícone) para liberar a leitura neste navegador."}
        </span>
        {msg && (
          <span role="status" className={msg.tipo === "erro" ? "font-semibold text-[#9b1c1c]" : msg.tipo === "ok" ? "font-semibold text-ok" : "text-tinta"}>
            {msg.texto}
          </span>
        )}
      </div>
    </li>
  );
}
