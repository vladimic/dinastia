"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerInt, lerPct } from "@/lib/formato";
import { gerarFaixas, modelar, validarEdicao, type Edicao } from "@/lib/sequencia";

// Salva os dados estáveis do grupo. Créditos, parcelas e regras vêm da importação de PDF.
export async function salvarGrupo(formData: FormData) {
  const numero = Number(formData.get("numero"));
  const familia = String(formData.get("familia") ?? "");
  if (!numero) throw new Error("Grupo inválido.");

  const indice = String(formData.get("indice") ?? "");
  const mes = formData.get("mes_reajuste");

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupo")
    .update({
      participantes: lerInt(formData.get("participantes")),
      prazo_grupo_meses: lerInt(formData.get("prazo_grupo_meses")) ?? undefined,
      dia_vencimento: lerInt(formData.get("dia_vencimento")),
      taxa_adm_total: lerPct(formData.get("taxa_adm_total")),
      fundo_reserva: lerPct(formData.get("fundo_reserva")),
      indice: indice || null,
      mes_reajuste: mes ? Number(mes) : null,
    })
    .eq("numero", numero);

  const base = `/grupos?familia=${encodeURIComponent(familia)}&grupo=${numero}`;
  redirect(`${base}&${error ? "erro" : "salvo"}=1`);
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
      .select(
        "id, fidelidade_meses, grupo(prazo_grupo_meses), grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo, grupo_sequencia(ordem, quantidade, tipo))",
      )
      .eq("id", versaoId)
      .single(),
    supabase.from("tipo_contemplacao").select("codigo"),
  ]);
  if (atual.error || tipos.error) return FALHA;

  const prazo = (atual.data.grupo as unknown as { prazo_grupo_meses: number } | null)?.prazo_grupo_meses;
  if (!prazo) return FALHA;

  // mês em que o FID entra na ordem: acompanha o mês de liberação, salvo nos grupos em que o PDF já diverge
  const faixasAtuais = (
    (atual.data.grupo_sequencia_faixa ?? []) as unknown as {
      assembleia_de: number;
      assembleia_ate: number;
      demais_tipo: string | null;
      grupo_sequencia: { ordem: number; quantidade: number; tipo: string }[];
    }[]
  ).map((f) => ({
    de: f.assembleia_de,
    ate: f.assembleia_ate,
    demais: f.demais_tipo,
    itens: [...f.grupo_sequencia].sort((a, b) => a.ordem - b.ordem).map((i) => ({ codigo: i.tipo, qtd: i.quantidade })),
  }));
  const modeloAtual = modelar(faixasAtuais);
  const divergente = !!modeloAtual?.fidOrdemDe && modeloAtual.fidOrdemDe !== atual.data.fidelidade_meses;
  e.fidOrdemDe = e.fidelidadeMeses === null ? null : divergente ? modeloAtual!.fidOrdemDe : e.fidelidadeMeses;

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
