"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { sair } from "@/app/login/actions";

type Contagem = { grupos: number; versoes: number };
type Restauracao = {
  versoesRepostas: number;
  versoesExistentes: number;
  gruposAtualizados: number;
  cadastrosAtualizados: number;
  erros: string[];
};

type SavePicker = (o: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;

const hoje = () => new Date().toISOString().slice(0, 10);
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024)).toLocaleString("pt-BR")} KB`;

function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 text-navy"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl">
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

const botao = "min-h-11 rounded-[10px] px-4 text-sm font-bold disabled:opacity-60";

function ExportarBackup({ onFechar }: { onFechar: () => void }) {
  const [estado, setEstado] = useState<"preparando" | "pronto" | "salvo" | "erro">("preparando");
  const [arquivo, setArquivo] = useState<{ blob: Blob; nome: string; contagem: Contagem } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/backup", { cache: "no-store" })
      .then(async (r) => {
        const texto = await r.text();
        if (!r.ok) throw new Error(JSON.parse(texto).erro ?? "Falha ao gerar o backup.");
        const j = JSON.parse(texto);
        if (!vivo) return;
        setArquivo({
          blob: new Blob([texto], { type: "application/json" }),
          nome: `dinastia-backup-${hoje()}.json`,
          contagem: j.contagem,
        });
        setEstado("pronto");
      })
      .catch((e: Error) => vivo && (setMsg(e.message), setEstado("erro")));
    return () => {
      vivo = false;
    };
  }, []);

  async function salvar() {
    if (!arquivo) return;
    const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    try {
      if (picker) {
        const h = await picker({
          suggestedName: arquivo.nome,
          types: [{ description: "Backup Dinastia", accept: { "application/json": [".json"] } }],
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
    <Modal titulo="Exportar backup" onFechar={onFechar}>
      {estado === "preparando" && <p className="text-sm text-tinta">Preparando o arquivo com todos os dados…</p>}
      {estado === "erro" && <p className="text-sm font-semibold text-[#9b1c1c]">{msg}</p>}
      {arquivo && estado !== "erro" && (
        <>
          <p className="text-sm leading-relaxed">
            Backup pronto: <strong>{arquivo.contagem.grupos}</strong> grupos, <strong>{arquivo.contagem.versoes}</strong>{" "}
            versões por assembleia e cadastros de apoio ({kb(arquivo.blob.size)}).
          </p>
          {estado === "salvo" ? (
            <p className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">Arquivo salvo.</p>
          ) : (
            <button type="button" onClick={salvar} className={`${botao} bg-laranja text-navy`}>
              Escolher pasta e salvar
            </button>
          )}
        </>
      )}
    </Modal>
  );
}

function ImportarBackup({ onFechar }: { onFechar: () => void }) {
  const [texto, setTexto] = useState<string | null>(null);
  const [resumo, setResumo] = useState<{ gerado_em: string; versao_app: string; contagem: Contagem } | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [res, setRes] = useState<Restauracao | null>(null);

  async function escolher(f: File | undefined) {
    setErro("");
    setResumo(null);
    setRes(null);
    if (!f) return;
    try {
      const t = await f.text();
      const j = JSON.parse(t);
      if (j.app !== "dinastia" || !j.dados) throw new Error("Este arquivo não é um backup do Dinastia.");
      setTexto(t);
      setResumo({ gerado_em: j.gerado_em, versao_app: j.versao_app, contagem: j.contagem });
    } catch (e) {
      setErro(e instanceof SyntaxError ? "Arquivo inválido (não é JSON)." : (e as Error).message);
    }
  }

  async function restaurar() {
    if (!texto) return;
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: texto });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? "Falha na restauração.");
      setRes(j);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Importar backup" onFechar={onFechar}>
      {!res && (
        <>
          <label className="rotulo text-[13px]">
            Arquivo de backup (.json)
            <input type="file" accept=".json,application/json" onChange={(e) => escolher(e.target.files?.[0])} className="text-sm" />
          </label>
          {resumo && (
            <div className="flex flex-col gap-3 text-sm leading-relaxed">
              <p>
                Backup de <strong>{new Date(resumo.gerado_em).toLocaleString("pt-BR")}</strong> (versão {resumo.versao_app}):{" "}
                {resumo.contagem.grupos} grupos e {resumo.contagem.versoes} versões.
              </p>
              <p className="rounded-lg bg-alerta-fundo px-3 py-2 text-[13px] text-alerta">
                A restauração <strong>não apaga nada</strong>: repõe as versões que faltarem e devolve os dados de cada grupo
                (participantes, taxa, fundo de reserva, seguro, índice, vencimento) <strong>como estavam no arquivo</strong>,
                desfazendo edições feitas depois dele.
              </p>
              <button type="button" onClick={restaurar} disabled={enviando} className={`${botao} bg-navy text-white`}>
                {enviando ? "Restaurando…" : "Restaurar este backup"}
              </button>
            </div>
          )}
        </>
      )}
      {erro && <p className="text-sm font-semibold text-[#9b1c1c]">{erro}</p>}
      {res && (
        <div className="flex flex-col gap-2 text-sm">
          <p>
            <strong>{res.versoesRepostas}</strong> versões repostas · <strong>{res.versoesExistentes}</strong> já existiam ·{" "}
            <strong>{res.gruposAtualizados}</strong> grupos atualizados.
          </p>
          {res.erros.length > 0 && (
            <ul className="max-h-40 overflow-auto text-[13px] text-[#9b1c1c]">
              {res.erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => location.reload()} className={`${botao} bg-laranja text-navy`}>
            Fechar e recarregar
          </button>
        </div>
      )}
    </Modal>
  );
}

export function MenuUsuario() {
  const [aberto, setAberto] = useState(false);
  const [modal, setModal] = useState<"exportar" | "importar" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const item = "block w-full rounded-lg px-4 py-2.5 text-left text-[15px] font-semibold text-navy hover:bg-creme";
  const abrir = (m: "exportar" | "importar") => {
    setAberto(false);
    setModal(m);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#e9e6f5] hover:bg-navy-2"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-2xl bg-white p-2 shadow-[0_10px_40px_rgba(13,5,64,0.25)]"
        >
          <button role="menuitem" type="button" className={item} onClick={() => abrir("exportar")}>
            Exportar backup
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => abrir("importar")}>
            Importar backup
          </button>
          <Link role="menuitem" href="/versoes" className={item} onClick={() => setAberto(false)}>
            Histórico de versões
          </Link>
          <form action={sair}>
            <button role="menuitem" type="submit" className={item}>
              Sair
            </button>
          </form>
        </div>
      )}

      {modal === "exportar" && <ExportarBackup onFechar={() => setModal(null)} />}
      {modal === "importar" && <ImportarBackup onFechar={() => setModal(null)} />}
    </div>
  );
}
