"use client";

import { useState } from "react";
import { ArquivoBaixavel, Modal, hoje } from "@/components/ExportarArquivo";
import { MES_REFERENCIA, rotuloMes } from "@/lib/tabelaResumo";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Botão do cabeçalho de Grupos e Tabelas: gera a Tabela Resumo dos imóveis em Excel (aba Imóvel) e em PDF
export function ExportarResumo() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
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
            Imóveis, com a versão vigente de cada grupo. Mês de referência: {rotuloMes(MES_REFERENCIA)} (título e mês final).
          </p>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold">Excel (só a aba Imóvel)</h3>
            <ArquivoBaixavel
              url="/api/tabela-resumo?formato=xlsx"
              tipo={XLSX}
              extensao=".xlsx"
              descricao="Tabela Resumo (Excel)"
              gerar={(r) => ({
                nome: `tabela-resumo-imoveis-${hoje()}.xlsx`,
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
              url="/api/tabela-resumo?formato=pdf"
              tipo="application/pdf"
              extensao=".pdf"
              descricao="Tabela Resumo (PDF)"
              gerar={(r) => ({
                nome: `tabela-resumo-imoveis-${hoje()}.pdf`,
                resumo: (
                  <>
                    PDF pronto: <strong>{r.headers.get("X-Grupos")}</strong> grupos em <strong>{r.headers.get("X-Paginas")}</strong>{" "}
                    página(s).
                  </>
                ),
              })}
            />
          </section>
        </Modal>
      )}
    </>
  );
}
