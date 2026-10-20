// Gera docs/modelo-de-dados.md (MER em Mermaid + dicionário de dados) e os comentários do banco
// (supabase/migrations/0027_comentarios_dicionario.sql) a partir de src/lib/dicionarioDados.ts.
// Uso: npx tsx scripts/gerar_docs.mts
import fs from "node:fs";
import { DICIONARIO, OBJETOS_APOIO, RELACIONAMENTOS, mermaidER } from "../src/lib/dicionarioDados";

const esc = (s: string) => s.replace(/\|/g, "\\|");
const aspas = (s: string) => s.replace(/'/g, "''");
const grupos = ["Cadastros de apoio", "Grupos e assembleias", "Importação de PDFs", "Acesso"] as const;

let md = `# Dinastia · Modelo de dados

Gerado de \`src/lib/dicionarioDados.ts\` (rode \`npx tsx scripts/gerar_docs.mts\`). Banco: PostgreSQL (Supabase). Ao mudar uma tabela, atualize o dicionário na mesma entrega.

## Modelo entidade-relacionamento

![Modelo entidade-relacionamento](modelo-er.svg)

(O desenho acima, \`docs/modelo-er.svg\`, é mantido à mão; o diagrama abaixo é gerado e acompanha o dicionário.)

Cada linha liga a tabela "pai" (1) às tabelas "filhas" (vários). \`grupo_assembleia\` é o centro: cada grupo tem uma versão por assembleia, e cada versão tem seus tipos de parcela, modalidades e sequência.

\`\`\`mermaid
${mermaidER()}
\`\`\`

## Relacionamentos

| Tabela filha | Campo | Tabela pai | Campo | Ao apagar o pai | Significado |
|---|---|---|---|---|---|
${RELACIONAMENTOS.map((r) => `| ${r.origem} | ${r.colunaOrigem} | ${r.destino} | ${r.colunaDestino} | ${r.apagar} | ${esc(r.significado)} |`).join("\n")}

## Dicionário de dados
`;
for (const g of grupos) {
  md += `\n### ${g}\n`;
  for (const tb of DICIONARIO.filter((x) => x.grupo === g)) {
    md += `\n#### \`${tb.tabela}\`\n\n${tb.descricao}\n\n| Campo | Tipo | Obrig. | Chave | Descrição |\n|---|---|---|---|---|\n`;
    md += tb.colunas.map((c) => `| \`${c.nome}\` | ${c.tipo} | ${c.obrig ? "sim" : "não"} | ${c.chave ?? ""} | ${esc(c.descricao)} |`).join("\n") + "\n";
  }
}
md += `\n## Visões e funções de apoio\n\n| Nome | Tipo | Descrição |\n|---|---|---|\n${OBJETOS_APOIO.map((o) => `| \`${o.nome}\` | ${o.tipo} | ${esc(o.descricao)} |`).join("\n")}\n`;
fs.writeFileSync("docs/modelo-de-dados.md", md);

let sql = `-- Dinastia · 0027: comentários do banco (dicionário de dados). Gerado por scripts/gerar_docs.mts a partir de src/lib/dicionarioDados.ts.\n`;
for (const tb of DICIONARIO) {
  sql += `comment on table public.${tb.tabela} is '${aspas(tb.descricao)}';\n`;
  for (const c of tb.colunas) sql += `comment on column public.${tb.tabela}.${c.nome} is '${aspas(c.descricao)}';\n`;
}
fs.writeFileSync("supabase/migrations/0027_comentarios_dicionario.sql", sql);
console.log("ok", md.length, "caracteres;", sql.split("\n").length, "linhas de SQL");
