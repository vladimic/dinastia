"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lerInt, lerPct } from "@/lib/formato";
import { gerarFaixas, validarEdicao, type Edicao } from "@/lib/sequencia";

// Salva um campo do grupo assim que ele é alterado (dados estáveis; créditos, parcelas e regras vêm do PDF).
const CAMPOS_GRUPO = ["participantes", "taxa_adm_total", "fundo_reserva", "indice", "mes_reajuste", "dia_vencimento"] as const;
export type CampoGrupo = (typeof CAMPOS_GRUPO)[number];

export async function salvarCampoGrupo(numero: number, campo: CampoGrupo, valor: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!Number.isInteger(numero) || !CAMPOS_GRUPO.includes(campo)) return { ok: false, erro: "Campo inválido." };
  const bruto = String(valor ?? "").trim();

  let novo: number | string | null;
  switch (campo) {
    case "participantes":
      novo = lerInt(bruto);
      if (novo === null || novo < 1) return { ok: false, erro: "Participantes: informe um número maior que zero." };
      break;
    case "taxa_adm_total":
    case "fundo_reserva": {
      novo = lerPct(bruto);
      if (campo === "taxa_adm_total" && novo === null) return { ok: false, erro: "Taxa de administração: informe o percentual." };
      if (novo !== null && (novo < 0 || novo > 100)) return { ok: false, erro: "Percentual entre 0 e 100, ex.: 24,00" };
      break;
    }
    case "indice":
      novo = bruto || null;
      break;
    case "mes_reajuste":
      novo = bruto ? Number(bruto) : null;
      if (novo !== null && !(Number.isInteger(novo) && novo >= 1 && novo <= 12)) return { ok: false, erro: "Mês inválido." };
      break;
    case "dia_vencimento":
      novo = bruto ? lerInt(bruto) : null;
      if (novo !== null && (novo < 1 || novo > 31)) return { ok: false, erro: "Dia de vencimento de 1 a 31." };
      break;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("grupo").update({ [campo]: novo }).eq("numero", numero);
  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/grupos");
  return { ok: true };
}

// Marca ou desmarca um tipo de parcela oferecido pelo grupo na versão (assembleia) vigente.
export async function alternarTipoParcela(versaoId: number, tipo: string, marcado: boolean): Promise<{ ok: boolean }> {
  if (!Number.isInteger(versaoId) || !tipo) return { ok: false };
  const supabase = await createClient();
  const { error } = marcado
    ? await supabase
        .from("grupo_assembleia_tipo_parcela")
        .upsert({ grupo_assembleia_id: versaoId, tipo_parcela: tipo }, { onConflict: "grupo_assembleia_id,tipo_parcela" })
    : await supabase.from("grupo_assembleia_tipo_parcela").delete().eq("grupo_assembleia_id", versaoId).eq("tipo_parcela", tipo);
  if (error) return { ok: false };
  revalidatePath("/grupos");
  return { ok: true };
}

// Pagamento com furo na versão vigente: true = sim, false = não.
export async function definirPagamentoComFuro(versaoId: number, valor: boolean): Promise<{ ok: boolean }> {
  if (!Number.isInteger(versaoId)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("grupo_assembleia").update({ pagamento_com_furo: valor }).eq("id", versaoId);
  if (error) return { ok: false };
  revalidatePath("/grupos");
  return { ok: true };
}

type Resultado = { ok: true } | { ok: false; erro: string };
const FALHA: Resultado = { ok: false, erro: "Não foi possível salvar. Tente de novo." };

// Edita a sequência de contemplação da versão vigente: refaz as faixas a partir de sorteios por mês,
// ordem, "demais" e mês de liberação do fidelidade (tudo numa transação, pela função salvar_sequencia).
export async function salvarSequencia(versaoId: number, entrada: Edicao): Promise<Resultado> {
  if (!Number.isInteger(versaoId)) return FALHA;
  const e: Edicao = {
    sorteios: (entrada.sorteios ?? []).map((x) => ({ de: Number(x.de), qtd: Number(x.qtd) })),
    ordem: (entrada.ordem ?? []).map(String),
    demais: entrada.demais ? String(entrada.demais) : null,
    fidelidadeMeses: entrada.fidelidadeMeses ? Number(entrada.fidelidadeMeses) : null,
  };

  const supabase = await createClient();
  const [atual, tipos] = await Promise.all([
    supabase
      .from("grupo_assembleia")
      .select("id, grupo(prazo_grupo_meses)")
      .eq("id", versaoId)
      .single(),
    supabase.from("tipo_contemplacao").select("codigo"),
  ]);
  if (atual.error || tipos.error) return FALHA;

  const prazo = (atual.data.grupo as unknown as { prazo_grupo_meses: number } | null)?.prazo_grupo_meses;
  if (!prazo) return FALHA;

  const erro = validarEdicao(e, new Set((tipos.data ?? []).map((t) => t.codigo as string)));
  if (erro) return { ok: false, erro };

  const faixas = gerarFaixas(e, prazo).map((f) => ({
    de: f.de,
    ate: f.ate,
    demais: f.demais,
    itens: f.itens.map((i) => ({ tipo: i.codigo, qtd: i.qtd })),
  }));
  const r1 = await supabase.rpc("salvar_sequencia", { p: { versao_id: versaoId, faixas } });
  if (r1.error) return FALHA;
  const r2 = await supabase.from("grupo_assembleia").update({ fidelidade_meses: e.fidelidadeMeses }).eq("id", versaoId);
  if (r2.error) return FALHA;

  revalidatePath("/grupos");
  return { ok: true };
}

// Faixa de crédito da versão vigente (guardada do maior para o menor).
export async function salvarCreditos(versaoId: number, valores: number[]): Promise<Resultado> {
  if (!Number.isInteger(versaoId)) return FALHA;
  const lista = (valores ?? []).map((v) => Math.round(Number(v) * 100) / 100);
  if (!lista.length || lista.length > 40 || lista.some((v) => !Number.isFinite(v) || v <= 0))
    return { ok: false, erro: "Informe de 1 a 40 valores maiores que zero." };
  if (new Set(lista).size !== lista.length) return { ok: false, erro: "Há valores repetidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupo_assembleia")
    .update({ creditos: [...lista].sort((a, b) => b - a) })
    .eq("id", versaoId);
  if (error) return FALHA;
  revalidatePath("/grupos");
  return { ok: true };
}
