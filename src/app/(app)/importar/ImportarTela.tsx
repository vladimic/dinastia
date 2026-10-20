"use client";

import { useEffect, useState } from "react";
import { BotaoPasta } from "@/components/BotaoPasta";

type Pasta = { campo: string; rotulo: string; caminho: string };

// Preferências desta tela ficam só neste navegador: mudar o caminho aqui NÃO altera os Parâmetros globais.
const CHAVE = "dinastia-importar";
type Prefs = Record<string, { ativa?: boolean; caminho?: string }>;

function lerPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
  } catch {
    return {};
  }
}

export function ImportarTela({ pastas }: { pastas: Pasta[] }) {
  const [prefs, setPrefs] = useState<Prefs>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê as preferências guardadas neste navegador
    setPrefs(lerPrefs());
  }, []);

  function mudar(campo: string, p: { ativa?: boolean; caminho?: string }) {
    const novo = { ...prefs, [campo]: { ...prefs[campo], ...p } };
    setPrefs(novo);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {}
  }

  const ligada = (c: string) => prefs[c]?.ativa !== false; // padrão: ligada
  const quantas = pastas.filter((p) => ligada(p.campo)).length;

  return (
    <div className="flex max-w-[60rem] flex-col gap-4">
      <p className="text-sm text-tinta">
        Ligue as famílias que serão lidas e confira a pasta de PDFs de cada uma. O caminho padrão vem dos Parâmetros globais; o que você mudar aqui vale só para as próximas importações neste computador e não altera os Parâmetros.
      </p>
      <AjudanteLocal />
      <ul className="flex flex-col gap-3">
        {pastas.map((p) => (
          <Familia
            key={p.campo}
            pasta={p}
            ligada={ligada(p.campo)}
            caminho={prefs[p.campo]?.caminho ?? p.caminho}
            mudar={(x) => mudar(p.campo, x)}
          />
        ))}
      </ul>
      <div className="flex items-center gap-3 border-t border-linha pt-3">
        <button type="button" disabled title="Próxima etapa" className="min-h-9 rounded-[10px] bg-navy px-5 text-sm font-bold text-white opacity-60">
          Ler os PDFs das pastas ativas
        </button>
        <span className="text-xs text-tinta">
          {quantas} {quantas === 1 ? "família ligada" : "famílias ligadas"} · leitura e comparação com a base: próxima etapa
        </span>
      </div>
    </div>
  );
}

function Familia({
  pasta,
  ligada,
  caminho,
  mudar,
}: {
  pasta: Pasta;
  ligada: boolean;
  caminho: string;
  mudar: (p: { ativa?: boolean; caminho?: string }) => void;
}) {
  const [erro, setErro] = useState("");
  const idRotulo = `fam-${pasta.campo}`;
  const alterado = caminho !== pasta.caminho;

  return (
    <li className={"flex flex-col gap-2 rounded-2xl border bg-white p-4 " + (ligada ? "border-borda" : "border-linha opacity-70")}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={ligada}
          aria-labelledby={idRotulo}
          onClick={() => mudar({ ativa: !ligada })}
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
          onChange={(e) => mudar({ caminho: e.target.value })}
          maxLength={500}
          spellCheck={false}
          autoComplete="off"
          aria-label={`Pasta dos PDFs de ${pasta.rotulo}`}
        />
        <BotaoPasta
          rotulo={pasta.rotulo}
          inicio={caminho}
          onEscolher={(c) => {
            setErro("");
            mudar({ caminho: c });
          }}
          onErro={setErro}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[3.5rem] text-[11px]">
        {erro && (
          <span role="alert" className="font-semibold text-[#9b1c1c]">
            {erro}
          </span>
        )}
        {alterado && (
          <button type="button" className="font-semibold text-navy underline" onClick={() => mudar({ caminho: pasta.caminho })}>
            Voltar ao padrão dos Parâmetros
          </button>
        )}
      </div>
    </li>
  );
}

const COMANDO = "python3 ~/Downloads/dinastia_local.py";

// Passo a passo para baixar e abrir o Dinastia Local no Mac (o arquivo já sai com o endereço deste site autorizado).
function AjudanteLocal() {
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function baixar() {
    setErro("");
    try {
      const r = await fetch("/dinastia_local.py", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const texto = (await r.text()).replace('"https://dinastia.vercel.app"', JSON.stringify(window.location.origin));
      const url = URL.createObjectURL(new Blob([texto], { type: "text/x-python" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "dinastia_local.py";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não foi possível baixar o arquivo. Tente de novo.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-borda bg-white p-4">
      <h2 className="text-sm font-bold">Dinastia Local (uma vez por sessão de trabalho)</h2>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[13px]">
        <li>
          <button type="button" onClick={baixar} className="font-bold text-navy underline">
            Baixar o Dinastia Local
          </button>{" "}
          (o arquivo vai para a pasta Downloads).
        </li>
        <li>Abra o <strong>Terminal</strong> do Mac (aperte Cmd + Espaço, digite Terminal e Enter).</li>
        <li>
          Cole este comando e aperte Enter:{" "}
          <code className="rounded bg-linha px-1.5 py-0.5 font-mono text-xs">{COMANDO}</code>{" "}
          <button
            type="button"
            className="text-xs font-semibold text-navy underline"
            onClick={() => {
              navigator.clipboard?.writeText(COMANDO).then(() => setCopiado(true), () => {});
            }}
          >
            {copiado ? "Copiado ✓" : "Copiar"}
          </button>
        </li>
        <li>Deixe a janela do Terminal aberta. Se o Mac pedir para instalar as “ferramentas de linha de comando”, aceite e repita o comando depois.</li>
      </ol>
      {erro && (
        <p role="alert" className="text-xs font-semibold text-[#9b1c1c]">
          {erro}
        </p>
      )}
    </div>
  );
}
