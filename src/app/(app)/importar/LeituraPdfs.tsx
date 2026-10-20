"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { escolherPasta, guardarPasta, lerPastaGuardada, liberarLeitura, pdfsDaRaiz, suportaSeletorDePasta, type PastaHandle } from "@/lib/pastaLocal";
import { extrairLinhas } from "@/lib/pdf/extrair";
import { interpretar } from "@/lib/pdf/interpretar";
import type { Leitura } from "@/lib/pdf/tipos";
import { hashesJaLidos, registrarLeituras, type ResumoLote } from "./actions";

const LOTE = 15;

// "GRUPO 540 - 1%.pdf", "GRUPO 540 - 2%.pdf": variações do plano de antecipado do PDF principal (que é o "GRUPO 540.pdf"). Não são lidas.
const VARIACAO = /[-–]\s*\d+\s*%\s*\.pdf$/i;

async function sha256(dados: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const VAZIO: ResumoLote = { lidos: 0, novos: 0, novasAssembleias: 0, semMudanca: 0, comDiferencas: 0, ignorados: 0, erros: 0 };

// Lê os PDFs da pasta escolhida (só a raiz), no próprio navegador, e manda ao Dinastia o que foi lido (não os PDFs).
export function LeituraPdfs({ rotulo, caminho, chave }: { rotulo: string; caminho: string; chave: string }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<{ fase: string; feito: number; total: number } | null>(null);
  const [resumo, setResumo] = useState<{ pdfs: number; variacoes: number; duplicados: number; jaLidos: number; r: ResumoLote; ilegiveis: string[] } | null>(null);
  const [erro, setErro] = useState("");
  const ocupado = estado !== null;
  const [guardada, setGuardada] = useState<PastaHandle | null>(null);
  const [seletor, setSeletor] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- lê a pasta lembrada neste navegador */
    setSeletor(suportaSeletorDePasta());
    lerPastaGuardada(chave).then(setGuardada);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [chave]);

  // Chrome: reabre a pasta lembrada (só pede a permissão de leitura) ou abre o seletor; outros navegadores: seletor comum.
  async function comecar(trocar: boolean) {
    setErro("");
    if (!seletor) {
      entrada.current?.click();
      return;
    }
    try {
      let pasta = trocar ? null : guardada;
      if (pasta && !(await liberarLeitura(pasta))) pasta = null;
      if (!pasta) {
        pasta = await escolherPasta(chave, guardada);
        if (!pasta) return;
        await guardarPasta(chave, pasta);
        setGuardada(pasta);
      }
      await ler(await pdfsDaRaiz(pasta));
    } catch (e) {
      const nome = (e as DOMException).name;
      setErro(nome === "SecurityError" ? "O Chrome não permite ler esta pasta (é protegida). Escolha outra ou use o seletor comum abaixo." : (e as Error).message || "Não foi possível abrir a pasta.");
    }
  }

  async function ler(arquivos: File[]) {
    setErro("");
    setResumo(null);
    try {
      // só a raiz da pasta: caminho relativo "pasta/arquivo.pdf" (sem subpastas)
      const todosPdfs = arquivos.filter((f) => /\.pdf$/i.test(f.name) && (f.webkitRelativePath || f.name).split("/").length <= 2);
      const variacoes = todosPdfs.filter((f) => VARIACAO.test(f.name)).length;
      const pdfs = todosPdfs.filter((f) => !VARIACAO.test(f.name));
      if (!pdfs.length) {
        setErro("Nenhum PDF na raiz da pasta escolhida.");
        return;
      }

      setEstado({ fase: "Conferindo os arquivos", feito: 0, total: pdfs.length });
      const unicos = new Map<string, { file: File; dados: ArrayBuffer }>();
      let duplicados = 0;
      const ilegiveis: string[] = [];
      for (let i = 0; i < pdfs.length; i++) {
        let dados: ArrayBuffer;
        try {
          dados = await pdfs[i].arrayBuffer();
        } catch {
          ilegiveis.push(pdfs[i].name); // ex.: arquivo do iCloud ainda não baixado no Mac
          continue;
        }
        const hash = await sha256(dados);
        if (unicos.has(hash)) duplicados++; // mesmo conteúdo em outro nome: desprezado
        else unicos.set(hash, { file: pdfs[i], dados });
        if (i % 20 === 0) setEstado({ fase: "Conferindo os arquivos", feito: i + 1, total: pdfs.length });
      }

      const conhecidos = new Set<string>();
      const hashes = [...unicos.keys()];
      for (let i = 0; i < hashes.length; i += 200) for (const h of await hashesJaLidos(hashes.slice(i, i + 200))) conhecidos.add(h);
      const novos = hashes.filter((h) => !conhecidos.has(h)).sort((a, b) => unicos.get(a)!.file.name.localeCompare(unicos.get(b)!.file.name, "pt-BR", { numeric: true }));

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const total: ResumoLote = { ...VAZIO };
      let leituras: Leitura[] = [];
      let falhas: { arquivo: string; hash: string; motivo: string }[] = [];
      const enviar = async () => {
        if (!leituras.length && !falhas.length) return;
        const r = await registrarLeituras(leituras, falhas);
        if (!r.ok) throw new Error(r.erro);
        for (const k of Object.keys(total) as (keyof ResumoLote)[]) total[k] += r.resumo[k];
        leituras = [];
        falhas = [];
      };

      for (let i = 0; i < novos.length; i++) {
        setEstado({ fase: "Lendo os PDFs", feito: i, total: novos.length });
        const { file, dados } = unicos.get(novos[i])!;
        try {
          const linhas = await extrairLinhas(pdfjs, new Uint8Array(dados.slice(0)));
          leituras.push(interpretar(linhas, file.name, novos[i]));
        } catch (e) {
          falhas.push({ arquivo: file.name, hash: novos[i], motivo: (e as Error).message || "não foi possível ler o PDF" });
        }
        if (leituras.length + falhas.length >= LOTE) {
          setEstado({ fase: "Comparando com a base", feito: i + 1, total: novos.length });
          await enviar();
        }
      }
      setEstado({ fase: "Comparando com a base", feito: novos.length, total: novos.length });
      await enviar();
      setResumo({ pdfs: pdfs.length, variacoes, duplicados, jaLidos: unicos.size - novos.length, r: total, ilegiveis });
      router.refresh();
    } catch (e) {
      setErro((e as Error).message || "Não foi possível concluir a leitura.");
    } finally {
      setEstado(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 pl-[3.5rem]">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={entrada}
          type="file"
          className="hidden"
          // @ts-expect-error webkitdirectory não está nos tipos do React, mas o Chrome e o Safari aceitam
          webkitdirectory=""
          multiple
          onChange={(e) => e.target.files && ler(Array.from(e.target.files))}
          aria-label={`Pasta dos PDFs de ${rotulo}`}
        />
        <button type="button" disabled={ocupado} onClick={() => comecar(false)} className="min-h-9 rounded-[10px] bg-navy px-4 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
          {ocupado ? "Lendo…" : guardada ? `Ler os PDFs de ${rotulo}` : `Escolher a pasta e ler os PDFs de ${rotulo}`}
        </button>
        {guardada && !ocupado && (
          <span className="text-[11px] text-tinta">
            Pasta lembrada: <code className="font-mono">{guardada.name}</code>{" "}
            <button type="button" className="font-semibold text-navy underline" onClick={() => comecar(true)}>
              Trocar pasta
            </button>
          </span>
        )}
        {!guardada && (
          <span className="text-[11px] text-tinta">
            O navegador não abre direto no caminho cadastrado{caminho ? <> (<code className="font-mono">{caminho.split("/").pop()}</code>)</> : ""}: escolha a pasta esta primeira vez; depois ela fica lembrada. Só os PDFs da raiz são lidos.
          </span>
        )}
      </div>
      {estado && (
        <div role="status" className="flex flex-col gap-1">
          <span className="text-xs font-semibold">
            {estado.fase}: {estado.feito} de {estado.total}
          </span>
          <progress className="h-2 w-full max-w-md" value={estado.feito} max={Math.max(1, estado.total)} />
        </div>
      )}
      {erro && (
        <p role="alert" className="text-xs font-semibold text-[#9b1c1c]">
          {erro}
        </p>
      )}
      {resumo && (
        <p role="status" className="text-xs text-tinta">
          <strong className="text-navy">{resumo.pdfs} PDFs na pasta:</strong> {resumo.variacoes > 0 && `${resumo.variacoes} variações “- 1%” / “- 2%” desprezadas · `}{resumo.duplicados} duplicados desprezados · {resumo.jaLidos} já lidos antes · {resumo.r.lidos} lidos agora
          {resumo.r.lidos > 0 && ` (${resumo.r.novos} grupos novos, ${resumo.r.novasAssembleias} novas assembleias, ${resumo.r.semMudanca} sem mudança, ${resumo.r.ignorados} ignorados, ${resumo.r.erros} com erro)`}.
          {resumo.ilegiveis.length > 0 && (
            <span className="font-semibold text-[#9b1c1c]">
              {" "}
              {resumo.ilegiveis.length} não puderam ser abertos pelo navegador (no iCloud, baixe os arquivos antes): {resumo.ilegiveis.slice(0, 5).join(", ")}
              {resumo.ilegiveis.length > 5 ? "…" : ""}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
