"use client";

import { useEffect, useState, type ReactNode } from "react";

type SavePicker = (o: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;

export const hoje = () => new Date().toISOString().slice(0, 10);
export const kb = (n: number) => `${Math.max(1, Math.round(n / 1024)).toLocaleString("pt-BR")} KB`;

export function Modal({
  titulo,
  onFechar,
  children,
  largo,
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 text-navy"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className={`flex max-h-[85vh] w-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl ${largo ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-lg px-2 text-xl leading-none text-tinta">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const botao = "min-h-11 rounded-[10px] px-4 text-sm font-bold disabled:opacity-60";

export type Pronto = { blob: Blob; nome: string; resumo: ReactNode };
export type Descricao = Omit<Pronto, "blob">;

// Baixa o arquivo gerado pelo servidor e deixa o usuário escolher a pasta para salvar
export function ArquivoBaixavel({
  url,
  tipo,
  extensao,
  descricao,
  gerar,
}: {
  url: string;
  tipo: string;
  extensao: string;
  descricao: string;
  gerar: (r: Response, texto: string | null) => Descricao;
}) {
  const [estado, setEstado] = useState<"preparando" | "pronto" | "salvo" | "erro">("preparando");
  const [arquivo, setArquivo] = useState<Pronto | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro ?? "Falha ao gerar o arquivo.");
        const texto = tipo === "application/json" ? await r.text() : null;
        const pronto: Pronto = { ...gerar(r, texto), blob: texto !== null ? new Blob([texto], { type: tipo }) : await r.blob() };
        if (!vivo) return;
        setArquivo(pronto);
        setEstado("pronto");
      })
      .catch((e: Error) => vivo && (setMsg(e.message), setEstado("erro")));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar() {
    if (!arquivo) return;
    const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    try {
      if (picker) {
        const h = await picker({
          suggestedName: arquivo.nome,
          types: [{ description: descricao, accept: { [tipo]: [extensao] } }],
        });
        const w = await h.createWritable();
        await w.write(arquivo.blob);
        await w.close();
      } else {
        // navegador sem seletor de pasta: baixa para a pasta padrão de downloads
        const url = URL.createObjectURL(arquivo.blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: arquivo.nome });
        a.click();
        URL.revokeObjectURL(url);
      }
      setEstado("salvo");
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") {
        setMsg((e as Error).message);
        setEstado("erro");
      }
    }
  }

  return (
    <>
      {estado === "preparando" && <p className="text-sm text-tinta">Preparando o arquivo com todos os dados…</p>}
      {estado === "erro" && <p className="text-sm font-semibold text-[#9b1c1c]">{msg}</p>}
      {arquivo && estado !== "erro" && (
        <>
          <p className="text-sm leading-relaxed">{arquivo.resumo}</p>
          {estado === "salvo" ? (
            <p className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">Arquivo salvo.</p>
          ) : (
            <button type="button" onClick={salvar} className={`${botao} bg-laranja text-navy`}>
              Escolher pasta e salvar
            </button>
          )}
        </>
      )}
    </>
  );
}


type PropsArquivo = Parameters<typeof ArquivoBaixavel>[0];

export function ExportarArquivo({ titulo, onFechar, ...arquivo }: PropsArquivo & { titulo: string; onFechar: () => void }) {
  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <ArquivoBaixavel {...arquivo} />
    </Modal>
  );
}
