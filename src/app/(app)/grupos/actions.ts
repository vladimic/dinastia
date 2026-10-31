"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refazerLista, refazerListaDaVersao, refazerListaDoGrupo } from "@/lib/listaGrupos";
import { ehAdministrador } from "@/lib/usuario";
import { lerInt, lerPct } from "@/lib/formato";
import { gerarFaixas, validarEdicao, type Edicao } from "@/lib/sequencia";

// Salva um campo do grupo assim que ele é alterado (dados estáveis; créditos, parcelas e regras vêm do PDF).
const CAMPOS_GRUPO = ["participantes", "taxa_adm_total", "fundo_reserva", "indice", "mes_reajuste", "dia_vencimento"] as const;
export type CampoGrupo = (typeof CAMPOS_GRUPO)[number];

const NEGADO = { ok: false, erro: "Apenas administradores podem alterar os dados dos grupos." } as const;

export async function salvarCampoGrupo(numero: number, campo: CampoGrupo, valor: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!(await ehAdministrador())) return NEGADO;
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
  await refazerListaDoGrupo(supabase, numero);
  revalidatePath("/grupos");
  return { ok: true };
}

// Marca ou desmarca um tipo de parcela oferecido pelo grupo na versão (assembleia) vigente.
export async function alternarTipoParcela(versaoId: number, tipo: string, marcado: boolean, atualizarLista = true): Promise<{ ok: boolean }> {
  if (!(await ehAdministrador()) || !Number.isInteger(versaoId) || !tipo) return { ok: false };
  const supabase = await createClient();
  const { error } = marcado
    ? await supabase
        .from("grupo_assembleia_tipo_parcela")
        .upsert({ grupo_assembleia_id: versaoId, tipo_parcela: tipo }, { onConflict: "grupo_assembleia_id,tipo_parcela" })
    : await supabase.from("grupo_assembleia_tipo_parcela").delete().eq("grupo_assembleia_id", versaoId).eq("tipo_parcela", tipo);
  if (error) return { ok: false };
  if (atualizarLista) await refazerListaDaVersao(supabase, versaoId);
  revalidatePath("/grupos");
  return { ok: true };
}

// Pagamento com furo na versão vigente: true = sim, false = não.
export async function definirPagamentoComFuro(versaoId: number, valor: boolean, atualizarLista = true): Promise<{ ok: boolean }> {
  if (!(await ehAdministrador()) || !Number.isInteger(versaoId)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("grupo_assembleia").update({ pagamento_com_furo: valor }).eq("id", versaoId);
  if (error) return { ok: false };
  if (atualizarLista) await refazerListaDaVersao(supabase, versaoId);
  revalidatePath("/grupos");
  return { ok: true };
}

type Resultado = { ok: true } | { ok: false; erro: string };
const FALHA: Resultado = { ok: false, erro: "Não foi possível salvar. Tente de novo." };

// Edita a sequência de contemplação da versão vigente: refaz as faixas a partir de sorteios por mês,
// ordem, "demais" e mês de liberação do fidelidade (tudo numa transação, pela função salvar_sequencia).
export async function salvarSequencia(versaoId: number, entrada: Edicao): Promise<Resultado> {
  if (!(await ehAdministrador())) return NEGADO;
  if (!Number.isInteger(versaoId)) return FALHA;
  const e: Edicao = {
    sorteios: (entrada.sorteios ?? []).map((x) => ({ de: Number(x.de), qtd: Number(x.qtd) })),
    ordem: (entrada.ordem ?? []).map(String),
    demais: entrada.demais ? String(entrada.demais) : null,
    demais2: entrada.demais && entrada.demais2 ? String(entrada.demais2) : null,
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
    demais2: f.demais2 ?? null,
    itens: f.itens.map((i) => ({ tipo: i.codigo, qtd: i.qtd })),
  }));
  const r1 = await supabase.rpc("salvar_sequencia", { p: { versao_id: versaoId, faixas } });
  if (r1.error) return FALHA;
  const r2 = await supabase.from("grupo_assembleia").update({ fidelidade_meses: e.fidelidadeMeses }).eq("id", versaoId);
  if (r2.error) return FALHA;

  await refazerListaDaVersao(supabase, versaoId);
  revalidatePath("/grupos");
  return { ok: true };
}

// Faixa de crédito da versão vigente (guardada do maior para o menor).
export async function salvarCreditos(versaoId: number, valores: number[]): Promise<Resultado> {
  if (!(await ehAdministrador())) return NEGADO;
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
  await refazerListaDaVersao(supabase, versaoId);
  revalidatePath("/grupos");
  return { ok: true };
}

// ---------------------------------------------------------------- edição em lote

export type LinhaLote = {
  numero: number;
  versaoId: number;
  prazo: number;
  assembleia: number;
  data: string | null;
  min: number | null;
  max: number | null;
  participantes: number | null;
  furo: boolean;
  /** códigos dos tipos de parcela oferecidos */
  tipos: string[];
};
export type DadosLote = { tipos: { codigo: string; descricao: string; pct: number }[]; linhas: LinhaLote[] };

// Todos os grupos da família, com os tipos de parcela e o furo da versão vigente, para a tela de edição em lote.
export async function carregarLote(familia: string): Promise<{ ok: true; dados: DadosLote } | { ok: false; erro: string }> {
  if (!(await ehAdministrador())) return NEGADO;
  const supabase = await createClient();
  const [atuais, tipos] = await Promise.all([
    supabase
      .from("grupo_atual")
      .select("numero, prazo_grupo_meses, assembleia_numero, data_assembleia, creditos, grupo_assembleia_id, participantes")
      .eq("familia", familia)
      .order("numero"),
    supabase.from("tipo_parcela").select("codigo, descricao, pct").is("rotulo", null).order("pct", { ascending: false }), // os planos em duas fases vêm só da importação
  ]);
  if (atuais.error || tipos.error) return { ok: false, erro: "Não foi possível carregar os grupos." };
  const ids = (atuais.data ?? []).map((g) => g.grupo_assembleia_id as number);
  const versoes = ids.length
    ? await supabase.from("grupo_assembleia").select("id, pagamento_com_furo, grupo_assembleia_tipo_parcela(tipo_parcela)").in("id", ids)
    : { data: [], error: null };
  if (versoes.error) return { ok: false, erro: "Não foi possível carregar os grupos." };
  const porId = new Map(
    ((versoes.data ?? []) as unknown as { id: number; pagamento_com_furo: boolean; grupo_assembleia_tipo_parcela: { tipo_parcela: string }[] }[]).map((v) => [v.id, v]),
  );
  const linhas: LinhaLote[] = (atuais.data ?? []).map((g) => {
    const v = porId.get(g.grupo_assembleia_id as number);
    const cr = ((g.creditos ?? []) as (number | string)[]).map(Number);
    return {
      numero: g.numero,
      versaoId: g.grupo_assembleia_id as number,
      prazo: g.prazo_grupo_meses,
      assembleia: g.assembleia_numero,
      data: g.data_assembleia,
      min: cr.length ? Math.min(...cr) : null,
      max: cr.length ? Math.max(...cr) : null,
      participantes: (g.participantes as number | null) ?? null,
      furo: v?.pagamento_com_furo === true,
      tipos: (v?.grupo_assembleia_tipo_parcela ?? []).map((t) => t.tipo_parcela),
    };
  });
  return { ok: true, dados: { tipos: (tipos.data ?? []).map((t) => ({ codigo: t.codigo as string, descricao: t.descricao as string, pct: Number(t.pct) })), linhas } };
}

// Ao fechar a edição em lote, a lista guardada da família é refeita uma vez só (e não a cada alteração).
export async function fecharLote(familia: string): Promise<{ ok: boolean }> {
  if (!(await ehAdministrador())) return { ok: false };
  const supabase = await createClient();
  await refazerLista(supabase, familia);
  revalidatePath("/grupos");
  return { ok: true };
}
