import "server-only";
import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Exportação para Excel: uma aba por tabela do banco, com todas as linhas e colunas, como estão gravadas.
// Segue a ordem de dependência (cadastros, grupo, versões, filhos). As tabelas usuario e usuario_autorizado não entram:
// guardam dados pessoais e a lista de acesso, e não fazem parte do backup.

type Linha = Record<string, unknown>;

export const TABELAS_EXCEL: { tabela: string; ordem: string[] }[] = [
  { tabela: "parametros_gerais", ordem: ["id"] },
  { tabela: "indice_correcao", ordem: ["sigla"] },
  { tabela: "tipo_contemplacao", ordem: ["codigo"] },
  { tabela: "tipo_parcela", ordem: ["codigo"] },
  { tabela: "grupo", ordem: ["numero"] },
  { tabela: "arquivo_importado", ordem: ["id"] },
  { tabela: "grupo_assembleia", ordem: ["id"] },
  { tabela: "grupo_assembleia_tipo_parcela", ordem: ["grupo_assembleia_id", "tipo_parcela"] },
  { tabela: "grupo_modalidade", ordem: ["id"] },
  { tabela: "grupo_sequencia_faixa", ordem: ["id"] },
  { tabela: "grupo_sequencia", ordem: ["id"] },
];

const LIMITE_CELULA = 32000; // o Excel aceita 32.767 caracteres por célula

async function todas(supabase: SupabaseClient, tabela: string, ordem: string[]) {
  const out: Linha[] = [];
  for (let de = 0; ; de += 1000) {
    let q = supabase.from(tabela).select("*").range(de, de + 999);
    for (const o of ordem) q = q.order(o);
    const { data, error } = await q;
    if (error) throw new Error(`${tabela}: ${error.message}`);
    out.push(...((data ?? []) as Linha[]));
    if (!data || data.length < 1000) return out;
  }
}

// Valor de uma célula: números e booleanos ficam como são; listas (ex.: créditos) viram "a; b; c";
// JSON (ex.: auditoria do PDF) vira texto, cortado se passar do limite da célula.
function celula(v: unknown): ExcelJS.CellValue {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : String(x))).join("; ");
  const texto = typeof v === "object" ? JSON.stringify(v) : String(v);
  return texto.length > LIMITE_CELULA ? `${texto.slice(0, LIMITE_CELULA)} …[cortado: passa do limite de uma célula do Excel]` : texto;
}

export async function exportarExcel(supabase: SupabaseClient) {
  const dados = await Promise.all(TABELAS_EXCEL.map(async (t) => ({ ...t, linhas: await todas(supabase, t.tabela, t.ordem) })));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Dinastia";
  wb.created = new Date();

  for (const { tabela, linhas } of dados) {
    const ws = wb.addWorksheet(tabela);
    const colunas = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
    ws.columns = colunas.map((c) => ({
      header: c,
      key: c,
      width: Math.min(
        50,
        Math.max(c.length, ...linhas.slice(0, 200).map((l) => String(celula(l[c]) ?? "").length)) + 2,
      ),
    }));
    for (const l of linhas) ws.addRow(Object.fromEntries(colunas.map((c) => [c, celula(l[c])])));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    if (colunas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return {
    buffer,
    tabelas: dados.length,
    linhas: dados.reduce((s, d) => s + d.linhas.length, 0),
  };
}
