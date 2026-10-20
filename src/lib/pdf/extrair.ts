import type { Linha } from "./tipos";

// Lê o texto de um PDF com pdf.js e devolve as linhas (de cima para baixo), cada uma com seus itens (da esquerda para a direita).

type Pdfjs = typeof import("pdfjs-dist");

export function linhasDeItens(itens: { str: string; transform: number[] }[]): Linha[] {
  const cru = itens.filter((i) => i.str.trim()).map((i) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5] }));
  cru.sort((a, b) => b.y - a.y || a.x - b.x);
  const linhas: { y: number; itens: { s: string; x: number }[] }[] = [];
  for (const it of cru) {
    const atual = linhas[linhas.length - 1];
    if (atual && Math.abs(atual.y - it.y) <= 2.5) atual.itens.push({ s: it.s, x: it.x });
    else linhas.push({ y: it.y, itens: [{ s: it.s, x: it.x }] });
  }
  return linhas.map((l) => {
    l.itens.sort((a, b) => a.x - b.x);
    return { y: l.y, itens: l.itens, texto: l.itens.map((i) => i.s).join(" ") };
  });
}

export async function extrairLinhas(pdfjs: Pdfjs, dados: Uint8Array): Promise<Linha[]> {
  const doc = await pdfjs.getDocument({ data: dados, useSystemFonts: true }).promise;
  const todas: Linha[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const conteudo = await pagina.getTextContent();
      todas.push(...linhasDeItens(conteudo.items.filter((i): i is Extract<typeof i, { str: string }> => "str" in i)));
    }
  } finally {
    await doc.destroy();
  }
  return todas;
}
