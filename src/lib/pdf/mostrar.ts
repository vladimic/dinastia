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
  if (m.emb_parc === null && m.emb_pct === null) partes.push("sem embutido");
  else {
    if (m.emb_parc !== null) partes.push(`embutir até ${m.emb_parc} parcelas`);
    if (m.emb_pct !== null) partes.push(`embutir até ${String(m.emb_pct).replace(".", ",")}% do lance`);
  }
  return partes.join(" · ");
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
