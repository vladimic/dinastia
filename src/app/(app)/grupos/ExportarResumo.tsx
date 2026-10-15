"use client";

import { useState } from "react";
import { ArquivoBaixavel, Modal, botao } from "@/components/ExportarArquivo";
import { lerMes, nomeArquivo, rotuloMes } from "@/lib/tabelaResumo";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CHAVE = "dinastia-resumo-mes";

// mês de hoje no formato do campo de mês (AAAA-MM)
function mesDeHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// o último mês escolhido, se o navegador guardou (só uma comodidade); senão o mês de hoje
function mesInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (lerMes(salvo)) return salvo as string;
  } catch {
    /* sem armazenamento: usa o mês de hoje */
  }
  return mesDeHoje();
}

// Botão do cabeçalho de Grupos e Tabelas: pergunta o mês de referência e gera a Tabela Resumo dos imóveis
// em Excel (aba Imóvel) e em PDF
export function ExportarResumo() {
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState("");
  const [gerado, setGerado] = useState<string | null>(null);

  function abrir() {
    setMes(mesInicial());
    setGerado(null);
    setAberto(true);
  }

  function gerar() {
    if (!lerMes(mes)) return;
    try {
      localStorage.setItem(CHAVE, mes);
    } catch {
      /* sem armazenamento: segue sem lembrar */
    }
    setGerado(mes);
  }

  const ref = lerMes(gerado);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex min-h-9 items-center gap-2 rounded-[10px] border border-navy bg-white px-3 text-[13px] font-semibold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        Exportar Tabela Resumo
      </button>

      {aberto && (
        <Modal titulo="Exportar Tabela Resumo" onFechar={() => setAberto(false)}>
          <p className="text-sm leading-relaxed text-tinta">
            Imóveis, com a versão vigente de cada grupo. O mês de referência vai no título e é a base do mês final (Fim).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="rotulo text-[13px]">
              Mês de referência
              <input
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="h-10 rounded-lg border border-borda-campo bg-campo px-2 text-sm text-navy outline-none focus:ring-2 focus:ring-laranja"
              />
            </label>
            <button type="button" onClick={gerar} disabled={!lerMes(mes)} className={`${botao} bg-navy text-white`}>
              {gerado ? "Gerar de novo" : "Gerar arquivos"}
            </button>
          </div>

          {ref && gerado && (
            <div key={gerado} className="flex flex-col gap-4">
              <p className="text-[13px] font-semibold">Referência: {rotuloMes(ref)}</p>
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-bold">Excel (só a aba Imóvel)</h3>
                <ArquivoBaixavel
                  url={`/api/tabela-resumo?formato=xlsx&mes=${gerado}`}
                  tipo={XLSX}
                  extensao=".xlsx"
                  descricao="Tabela Resumo (Excel)"
                  gerar={(r) => ({
                    nome: nomeArquivo(ref, "xlsx"),
                    resumo: (
                      <>
                        Planilha pronta: <strong>{r.headers.get("X-Grupos")}</strong> grupos.
                      </>
                    ),
                  })}
                />
              </section>
              <section className="flex flex-col gap-2 border-t border-linha pt-4">
                <h3 className="text-sm font-bold">PDF (igual ao modelo)</h3>
                <ArquivoBaixavel
                  url={`/api/tabela-resumo?formato=pdf&mes=${gerado}`}
                  tipo="application/pdf"
                  extensao=".pdf"
                  descricao="Tabela Resumo (PDF)"
                  gerar={(r) => ({
                    nome: nomeArquivo(ref, "pdf"),
                    resumo: (
                      <>
                        PDF pronto: <strong>{r.headers.get("X-Grupos")}</strong> grupos em <strong>{r.headers.get("X-Paginas")}</strong>{" "}
                        página(s).
                      </>
                    ),
                  })}
                />
              </section>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
