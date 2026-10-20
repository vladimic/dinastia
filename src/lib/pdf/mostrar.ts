import { nomeModalidade } from "./comparar";
import { mostrar, tipoDoCampo } from "./edicao";
import type { Faixa, Modalidade } from "./tipos";

// Texto legível do valor de uma diferença (para a tela de decisões).

function faixa(f: Faixa) {
  const itens = f.itens.map((i) => `${i.qtd} ${nomeModalidade(i.tipo)}`).join(" + ");
  return `${f.de}ª a ${f.ate}ª: ${itens}${f.demais ? ` · demais: ${nomeModalidade(f.demais)}` : " · demais: repete a sequência"}`;
}

function modalidade(m: Modalidade) {
  const partes: string[] = [];
  if (m.max !== null) partes.push(`máx. ${m.max} parcelas`);
  if (m.pct_cat !== null) partes.push(`${String(m.pct_cat).replace(".", ",")}% da categoria`);
  if (m.emb_texto) partes.push(m.emb_texto);
  return partes.join(" · ") || "sem regras adicionais";
}

export function textoDoValor(escopo: string, campo: string, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (escopo === "sequencia" && campo === "*") return faixa(v as Faixa);
  if (escopo === "modalidade" && campo === "*") return modalidade(v as Modalidade);
  if (escopo === "grupo" && campo === "*") {
    const r = v as { participantes: number; prazo_grupo: number; taxa_adm: number; creditos: number; tipos_parcela: string[]; modalidades: string[] };
    return `${r.participantes} participantes · prazo ${r.prazo_grupo} meses · taxa ${String(r.taxa_adm).replace(".", ",")}% · ${r.creditos} créditos · parcelas ${r.tipos_parcela.join(", ")} · ${r.modalidades.map(nomeModalidade).join(", ")}`;
  }
  return mostrar(v, tipoDoCampo(escopo, campo));
}
