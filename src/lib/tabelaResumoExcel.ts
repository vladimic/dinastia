import ExcelJS from "exceljs";
import {
  CABECALHO,
  CINZA_ZEBRA,
  COLUNA_DATA,
  LARGURAS,
  LINHA_DIREITA,
  LINHA_ESQUERDA,
  NCOLUNAS,
  TITULO,
  VERMELHO,
  celulasDaLinha,
  type LinhaResumo,
  type Mes,
} from "./tabelaResumo";

// Excel da Tabela Resumo: uma única aba "Imóvel", igual ao modelo (título, cabeçalho em 2 linhas,
// zebra cinza, cores por regra), só que com os valores já calculados, sem fórmulas nem abas de apoio.

const FINA = { style: "thin" as const };
const BRANCO = { argb: "FFFFFFFF" };
const argb = (hex: string) => ({ argb: `FF${hex}` });

export async function tabelaResumoExcel(linhas: LinhaResumo[], base: Mes): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dinastia";
  wb.created = new Date();
  const ws = wb.addWorksheet("Imóvel", {
    views: [{ state: "frozen", xSplit: 8, ySplit: 3, showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: { left: 0.079, right: 0.079, top: 0.079, bottom: 0, header: 0, footer: 0 },
      printTitlesRow: "2:3",
    },
  });
  ws.columns = LARGURAS.map((width) => ({ width }));

  // linha 1: título (A..AN) e mês/ano (AO..AR)
  ws.getRow(1).height = 31.5;
  const fundo = { type: "pattern" as const, pattern: "solid" as const, fgColor: argb(VERMELHO) };
  ws.mergeCells(1, 1, 1, COLUNA_DATA);
  ws.mergeCells(1, COLUNA_DATA + 1, 1, NCOLUNAS);
  const titulo = ws.getCell(1, 1);
  titulo.value = TITULO;
  titulo.font = { name: "Calibri", size: 24, bold: true, color: BRANCO };
  titulo.alignment = { horizontal: "center", vertical: "middle" };
  const data = ws.getCell(1, COLUNA_DATA + 1);
  data.value = new Date(Date.UTC(base.ano, base.mes - 1, 1));
  data.numFmt = "mmm/yyyy";
  data.font = { name: "Calibri", size: 18, bold: true, color: BRANCO };
  data.alignment = { horizontal: "center", vertical: "middle" };
  for (let c = 1; c <= NCOLUNAS; c++) ws.getCell(1, c).fill = fundo;

  // linhas 2 e 3: cabeçalho
  ws.getRow(2).height = 15;
  ws.getRow(3).height = 15;
  for (let r = 2; r <= 3; r++) for (let c = 1; c <= NCOLUNAS; c++) {
    const cel = ws.getCell(r, c);
    cel.fill = fundo;
    cel.border = { left: FINA, right: FINA, top: FINA, bottom: FINA };
  }
  // sob "Créditos (mil)" a 2ª linha não tem divisórias entre as colunas (como no modelo)
  for (let c = 34; c <= NCOLUNAS; c++)
    ws.getCell(3, c).border = { bottom: FINA, ...(c === 34 ? { left: FINA } : {}), ...(c === NCOLUNAS ? { right: FINA } : {}) };
  for (const h of CABECALHO) {
    const r = 2 + h.linha;
    if (h.c1 > h.c0 || h.linhas > 1) ws.mergeCells(r, h.c0 + 1, r + h.linhas - 1, h.c1 + 1);
    const cel = ws.getCell(r, h.c0 + 1);
    cel.value = h.texto;
    cel.font = { name: "Calibri", size: h.tamanho, bold: h.negrito, color: BRANCO };
    cel.alignment = { horizontal: h.alinh, vertical: "top" };
  }

  // corpo
  linhas.forEach((l, i) => {
    const r = 4 + i;
    const zebra = i % 2 === 1;
    ws.getRow(r).height = 15;
    const celulas = celulasDaLinha(l);
    for (let c = 0; c < NCOLUNAS; c++) {
      const x = celulas[c];
      const cel = ws.getCell(r, c + 1);
      cel.value = x.valor;
      if (x.fmt) cel.numFmt = x.fmt;
      cel.font = { name: "Calibri", size: 11, bold: !!x.negrito, ...(x.cor ? { color: argb(x.cor) } : {}) };
      cel.alignment = { horizontal: x.alinh, vertical: "middle" };
      if (zebra) cel.fill = { type: "pattern", pattern: "solid", fgColor: argb(CINZA_ZEBRA) };
      cel.border = {
        ...(LINHA_ESQUERDA.has(c) ? { left: FINA } : {}),
        ...(LINHA_DIREITA.has(c) ? { right: FINA } : {}),
        ...(i === 0 ? { top: FINA } : {}),
        ...(i === linhas.length - 1 ? { bottom: FINA } : {}),
      };
    }
    // FID inexistente: "não" centralizado sobre as 3 colunas (AC..AE)
    if (celulas[28].span === 3) ws.mergeCells(r, 29, r, 31);
  });

  if (linhas.length) ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: NCOLUNAS } };
  return wb.xlsx.writeBuffer();
}
