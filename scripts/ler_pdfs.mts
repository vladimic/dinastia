// Lê todos os PDFs de uma pasta com o mesmo leitor do programa (imóveis ou veículos) e resume erros e avisos.
// Uso: npx tsx scripts/ler_pdfs.mts <pasta> [saida.json] [av]
import fs from "node:fs";
import crypto from "node:crypto";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extrairLinhas } from "../src/lib/pdf/extrair";
import { interpretar } from "../src/lib/pdf/interpretar";

const [dir, saida, modo] = process.argv.slice(2);
if (!dir) throw new Error("informe a pasta dos PDFs");
const lidos: unknown[] = [];
let ok = 0;
let ruim = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.toLowerCase().endsWith(".pdf")).sort()) {
  const buf = fs.readFileSync(`${dir}/${f}`);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  try {
    const l = interpretar(await extrairLinhas(pdfjs as never, new Uint8Array(buf)), f, hash);
    lidos.push(l);
    if (l.erros.length) {
      ruim++;
      console.log("ERRO", f, l.erros.join("; "));
    } else ok++;
    if (modo === "av" && l.avisos.length) console.log("AVISO", f, l.avisos.join("; "));
  } catch (e) {
    ruim++;
    console.log("FALHA", f, (e as Error).message);
  }
}
console.log({ ok, ruim });
if (saida) fs.writeFileSync(saida, JSON.stringify(lidos, null, 1));
