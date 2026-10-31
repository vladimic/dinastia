"use client";

import { useEffect, useState } from "react";
import { LeituraPdfs } from "./LeituraPdfs";

type Pasta = { campo: string; rotulo: string; caminho: string };

// Valem só para esta sessão do navegador (sessionStorage) e NÃO alteram os Parâmetros globais.
const CHAVE = "dinastia-importar";
type Prefs = Record<string, { ativa?: boolean; caminho?: string }>;

function lerPrefs(): Prefs {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE) ?? "{}");
  } catch {
    return {};
  }
}

export function ImportarTela({ pastas }: { pastas: Pasta[] }) {
  const [prefs, setPrefs] = useState<Prefs>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê as preferências da sessão
    setPrefs(lerPrefs());
  }, []);

  function mudar(campo: string, p: { ativa?: boolean; caminho?: string }) {
    const novo = { ...prefs, [campo]: { ...prefs[campo], ...p } };
    setPrefs(novo);
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {}
  }

  const ligada = (c: string) => prefs[c]?.ativa !== false; // padrão: ligada

  return (
    <div className="flex max-w-[60rem] flex-col gap-4">
      <p className="text-sm text-tinta">
        Ligue as famílias que serão lidas. O caminho vem dos Parâmetros globais e serve de referência (o que você mudar aqui vale só para esta sessão e não altera os Parâmetros); na hora de ler, o navegador pede para escolher a pasta no Finder.
      </p>
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
        <span id={idRotulo} className="text-sm font-bold">
          {pasta.rotulo}
        </span>
        {alterado && (
          <button type="button" className="ml-auto text-[11px] font-semibold text-navy underline" onClick={() => mudar({ caminho: pasta.caminho })}>
            Voltar ao padrão dos Parâmetros
          </button>
        )}
      </div>
      <textarea
        className="campo-sm !h-auto !min-h-[3.4rem] resize-none !py-1.5 !text-left [text-align-last:left]! font-mono leading-snug break-all"
        rows={2}
        value={caminho}
        onChange={(e) => mudar({ caminho: e.target.value.replace(/[\r\n]+/g, "") })}
        maxLength={500}
        spellCheck={false}
        autoComplete="off"
        aria-label={`Pasta dos PDFs de ${pasta.rotulo}`}
      />
      {ligada &&
        (pasta.campo === "pasta_pdf_imoveis" || pasta.campo === "pasta_pdf_veiculos" ? (
          <LeituraPdfs rotulo={pasta.rotulo} caminho={caminho} chave={pasta.campo} />
        ) : (
          <p className="pl-[3.5rem] text-[11px] text-tinta">Leitura desta família ainda não disponível (por enquanto só Imóveis e Veículos).</p>
        ))}
    </li>
  );
}
