"use client";

import { useEffect, useRef, useState } from "react";
import { sair } from "@/app/login/actions";
import { ExportarArquivo, Modal, botao, hoje, kb } from "@/components/ExportarArquivo";
import { VERSOES } from "@/lib/versoes";

type Contagem = { grupos: number; versoes: number };
type Restauracao = {
  versoesRepostas: number;
  versoesExistentes: number;
  gruposAtualizados: number;
  cadastrosAtualizados: number;
  erros: string[];
};

function HistoricoVersoes({ onFechar }: { onFechar: () => void }) {
  return (
    <Modal titulo="Histórico de versões" onFechar={onFechar} largo>
      <div className="-mr-2 flex flex-col gap-4 overflow-y-auto pr-2">
        {VERSOES.map((v, i) => (
          <section key={v.numero} className="flex flex-col gap-1.5 border-b border-linha pb-3 last:border-0">
            <div className="flex items-baseline gap-3">
              <h3 className="text-base font-bold tabular-nums">{v.numero}</h3>
              <span className="text-xs text-tinta">{v.data}</span>
              {i === 0 && (
                <span className="rounded-full bg-ouro-claro px-2 py-0.5 text-[11px] font-bold text-ouro-texto">atual</span>
              )}
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed">
              {v.itens.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <button type="button" onClick={onFechar} className="min-h-11 self-end rounded-[10px] bg-laranja px-8 text-sm font-bold text-navy">
        OK
      </button>
    </Modal>
  );
}


function ExportarBackup({ onFechar }: { onFechar: () => void }) {
  return (
    <ExportarArquivo
      titulo="Exportar Backup"
      url="/api/backup"
      tipo="application/json"
      extensao=".json"
      descricao="Backup do Dinastia"
      onFechar={onFechar}
      gerar={(_, texto) => {
        const j = JSON.parse(texto ?? "{}");
        const c: Contagem = j.contagem;
        return {
          nome: `dinastia-backup-${hoje()}.json`,
          resumo: (
            <>
              Arquivo pronto: <strong>{c.grupos}</strong> grupos, <strong>{c.versoes}</strong> versões por assembleia e cadastros de
              apoio ({kb((texto ?? "").length)}).
            </>
          ),
        };
      }}
    />
  );
}

function ExportarExcel({ onFechar }: { onFechar: () => void }) {
  return (
    <ExportarArquivo
      titulo="Exportar Excel"
      url="/api/exportar-excel"
      tipo="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      extensao=".xlsx"
      descricao="Planilha do Dinastia"
      onFechar={onFechar}
      gerar={(r) => ({
        nome: `dinastia-dados-${hoje()}.xlsx`,
        resumo: (
          <>
            Planilha pronta: <strong>{r.headers.get("X-Tabelas")}</strong> abas (uma por tabela) com{" "}
            <strong>{Number(r.headers.get("X-Linhas")).toLocaleString("pt-BR")}</strong> linhas no total.
          </>
        ),
      })}
    />
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
      if (!r.ok) throw new Error(j.erro ?? "Falha na importação.");
      setRes(j);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Importar Backup" onFechar={onFechar}>
      {!res && (
        <>
          <label className="rotulo text-[13px]">
            Backup exportado pelo Dinastia (.json)
            <input type="file" accept=".json,application/json" onChange={(e) => escolher(e.target.files?.[0])} className="text-sm" />
          </label>
          {resumo && (
            <div className="flex flex-col gap-3 text-sm leading-relaxed">
              <p>
                Exportação de <strong>{new Date(resumo.gerado_em).toLocaleString("pt-BR")}</strong> (versão {resumo.versao_app}):{" "}
                {resumo.contagem.grupos} grupos e {resumo.contagem.versoes} versões.
              </p>
              <p className="rounded-lg bg-alerta-fundo px-3 py-2 text-[13px] text-alerta">
                A importação <strong>não apaga nada</strong>: repõe as versões que faltarem e devolve os dados de cada grupo
                (participantes, taxa, fundo de reserva, seguro, índice, vencimento) <strong>como estavam no arquivo</strong>,
                desfazendo edições feitas depois dele.
              </p>
              <button type="button" onClick={restaurar} disabled={enviando} className={`${botao} bg-navy text-white`}>
                {enviando ? "Importando…" : "Importar este backup"}
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
  const [modal, setModal] = useState<"exportar" | "excel" | "importar" | "versoes" | null>(null);
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
  const abrir = (m: "exportar" | "excel" | "importar" | "versoes") => {
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
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#e9e6f5] hover:bg-navy-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-2xl bg-white p-2 shadow-[0_10px_40px_rgba(13,5,64,0.25)]"
        >
          <button role="menuitem" type="button" className={item} onClick={() => abrir("exportar")}>
            Exportar Backup
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => abrir("excel")}>
            Exportar Excel
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => abrir("importar")}>
            Importar Backup
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => abrir("versoes")}>
            Histórico de versões
          </button>
          <form action={sair}>
            <button role="menuitem" type="submit" className={item}>
              Sair
            </button>
          </form>
        </div>
      )}

      {modal === "exportar" && <ExportarBackup onFechar={() => setModal(null)} />}
      {modal === "excel" && <ExportarExcel onFechar={() => setModal(null)} />}
      {modal === "importar" && <ImportarBackup onFechar={() => setModal(null)} />}
      {modal === "versoes" && <HistoricoVersoes onFechar={() => setModal(null)} />}
    </div>
  );
}
