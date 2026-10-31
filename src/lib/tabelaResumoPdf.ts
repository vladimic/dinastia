import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  cabecalhoDa,
  type FamiliaResumo,
  CINZA_ZEBRA,
  COLUNA_DATA,
  LARGURAS,
  LINHA_DIREITA,
  LINHA_ESQUERDA,
  NCOLUNAS,
  TITULOS,
  GRUPOS_POR_PAGINA,
  VERMELHO,
  celulasDaLinha,
  rotuloMes,
  type LinhaResumo,
  type Mes,
} from "./tabelaResumo";

// PDF da Tabela Resumo, igual ao modelo: A4 em pé, uma quantidade fixa de grupos por página (escala reduzida),
// título e cabeçalho vermelhos, zebra cinza e as mesmas cores por regra do Excel.
// Desenhado em "pontos de planilha" (largura do Excel e linhas de 15) e depois reduzido pela escala.

const A4 = { w: 595.28, h: 841.89 };
const MARGEM = 14;
const ALTURA_LINHA = 15;
const ALTURA_TITULO = 31.5;
const ALTURA_CABECALHO = 2 * ALTURA_LINHA;

// largura de coluna do Excel (caracteres) em pontos
const pontos = (w: number) => Math.trunc(w * 7 + 5) * 0.75;
const COL_W = LARGURAS.map(pontos);
const COL_X = COL_W.reduce<number[]>((acc, w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + COL_W[i - 1]], []);
const LARGURA_TABELA = COL_X[NCOLUNAS - 1] + COL_W[NCOLUNAS - 1];

const cor = (hex: string) => rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
const seguro = (t: string) => t.replace(/[^\x20-\x7E -ÿ]/g, "?"); // só o que a fonte padrão do PDF representa

type Fontes = { normal: PDFFont; negrito: PDFFont };

export async function tabelaResumoPdf(
  linhas: LinhaResumo[],
  base: Mes,
  porPagina = GRUPOS_POR_PAGINA,
  familia: FamiliaResumo = "imoveis",
): Promise<{ bytes: Uint8Array; paginas: number }> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tabela Resumo · ${familia === "veiculos" ? "Veículos" : "Imóveis"} · ${rotuloMes(base)}`);
  doc.setCreator("Dinastia");
  const fontes: Fontes = { normal: await doc.embedFont(StandardFonts.Helvetica), negrito: await doc.embedFont(StandardFonts.HelveticaBold) };

  // cada página tem até "porPagina" grupos (a 1ª leva o título); o cabeçalho se repete em todas.
  // A escala é a mesma em todas as páginas: a que faz caber a 1ª página cheia.
  const util = { w: A4.w - 2 * MARGEM, h: A4.h - 2 * MARGEM };
  const porPag = Math.max(1, Math.min(porPagina, linhas.length || 1));
  const escala = Math.min(util.w / LARGURA_TABELA, util.h / (ALTURA_TITULO + ALTURA_CABECALHO + porPag * ALTURA_LINHA));
  const paginas: LinhaResumo[][] = [];
  for (let i = 0; i < linhas.length; i += porPag) paginas.push(linhas.slice(i, i + porPag));
  if (!paginas.length) paginas.push([]);

  const x0 = (A4.w - LARGURA_TABELA * escala) / 2;
  let desenhadas = 0; // linhas já desenhadas, para a zebra continuar de uma página para a outra
  paginas.forEach((grupo, p) => {
    desenharPagina(doc.addPage([A4.w, A4.h]), grupo, p === 0, base, escala, x0, fontes, desenhadas, familia);
    desenhadas += grupo.length;
  });

  return { bytes: await doc.save(), paginas: paginas.length };
}

function desenharPagina(page: PDFPage, linhas: LinhaResumo[], comTitulo: boolean, base: Mes, s: number, x0: number, f: Fontes, primeira: number, familia: FamiliaResumo) {
  const topo = A4.h - MARGEM;
  const X = (u: number) => x0 + u * s;
  const Y = (v: number) => topo - v * s; // v = distância do topo da tabela, em pontos de planilha
  const fino = Math.max(0.2, 0.75 * s);

  const retangulo = (u: number, v: number, w: number, h: number, hex: string) =>
    page.drawRectangle({ x: X(u), y: Y(v + h), width: w * s, height: h * s, color: cor(hex) });
  const linha = (u1: number, v1: number, u2: number, v2: number) =>
    page.drawLine({ start: { x: X(u1), y: Y(v1) }, end: { x: X(u2), y: Y(v2) }, thickness: fino, color: rgb(0, 0, 0) });

  // texto dentro de uma célula (u, v = canto superior esquerdo; w, h = tamanho); encolhe se não couber
  const texto = (t: string, u: number, v: number, w: number, h: number, tam: number, alinh: "left" | "center" | "right", negrito: boolean, hex: string, topoAlinhado = false) => {
    if (!t) return;
    const fonte = negrito ? f.negrito : f.normal;
    const limpo = seguro(t);
    const folga = 1.5;
    let fs = tam * s;
    const largura = fonte.widthOfTextAtSize(limpo, fs);
    const disponivel = (w - 2 * folga) * s;
    if (largura > disponivel) fs = Math.max(fs * 0.55, fs * (disponivel / largura));
    const lg = fonte.widthOfTextAtSize(limpo, fs);
    const px = alinh === "left" ? X(u) + folga * s : alinh === "right" ? X(u + w) - folga * s - lg : X(u) + (w * s - lg) / 2;
    const py = topoAlinhado ? Y(v) - fs * 0.95 - 1 * s : Y(v + h) + (h * s - fs * 0.72) / 2;
    page.drawText(limpo, { x: px, y: py, size: fs, font: fonte, color: cor(hex) });
  };

  let v = 0;
  if (comTitulo) {
    retangulo(0, 0, LARGURA_TABELA, ALTURA_TITULO, VERMELHO);
    const larguraTitulo = COL_X[COLUNA_DATA];
    texto(TITULOS[familia], 0, 0, larguraTitulo, ALTURA_TITULO, 24, "center", true, "FFFFFF");
    texto(rotuloMes(base), COL_X[COLUNA_DATA], 0, LARGURA_TABELA - COL_X[COLUNA_DATA], ALTURA_TITULO, 18, "center", true, "FFFFFF");
    v = ALTURA_TITULO;
  }

  // cabeçalho (2 linhas)
  retangulo(0, v, LARGURA_TABELA, ALTURA_CABECALHO, VERMELHO);
  for (const c of cabecalhoDa(familia)) {
    const u = COL_X[c.c0];
    const w = COL_X[c.c1] + COL_W[c.c1] - u;
    const top = v + c.linha * ALTURA_LINHA;
    const h = c.linhas * ALTURA_LINHA;
    linha(u, top, u + w, top);
    linha(u, top + h, u + w, top + h);
    linha(u, top, u, top + h);
    linha(u + w, top, u + w, top + h);
    texto(c.texto, u, top, w, h, c.tamanho, c.alinh, c.negrito, "FFFFFF", true);
  }
  v += ALTURA_CABECALHO;

  // corpo
  const inicioCorpo = v;
  linhas.forEach((l, i) => {
    const top = v + i * ALTURA_LINHA;
    if ((primeira + i) % 2 === 1) retangulo(0, top, LARGURA_TABELA, ALTURA_LINHA, CINZA_ZEBRA);
    const cs = celulasDaLinha(l);
    for (let c = 0; c < NCOLUNAS; c++) {
      const x = cs[c];
      if (!x.texto) continue;
      const w = x.span ? COL_X[c + x.span - 1] + COL_W[c + x.span - 1] - COL_X[c] : COL_W[c];
      texto(x.texto, COL_X[c], top, w, ALTURA_LINHA, 11, x.alinh, !!x.negrito, x.cor ?? "000000");
    }
  });
  const fimCorpo = inicioCorpo + linhas.length * ALTURA_LINHA;
  if (linhas.length) {
    linha(0, inicioCorpo, LARGURA_TABELA, inicioCorpo);
    linha(0, fimCorpo, LARGURA_TABELA, fimCorpo);
    for (const c of LINHA_ESQUERDA) linha(COL_X[c], inicioCorpo, COL_X[c], fimCorpo);
    for (const c of LINHA_DIREITA) linha(COL_X[c] + COL_W[c], inicioCorpo, COL_X[c] + COL_W[c], fimCorpo);
  }
}
