import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Familia = { id: number; slug: string; nome: string; ordem: number; qtd: number };

export type GrupoResumo = {
  id: number;
  numero: string;
  prazo_grupo_meses: number;
  status: string;
  assembleia: number | null;
  qtdCreditos: number;
  min: number | null;
  max: number | null;
};

export async function listarFamilias(): Promise<Familia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("familia_produto")
    .select("id, slug, nome, ordem, grupo(count)")
    .order("ordem");
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    nome: f.nome,
    ordem: f.ordem,
    qtd: (f.grupo as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function listarGrupos(familiaId: number): Promise<GrupoResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupo")
    .select(
      "id, numero, prazo_grupo_meses, status, tabela_vigencia(assembleia_numero, vigente, credito(valor_credito))",
    )
    .eq("familia_id", familiaId)
    .order("numero");
  if (error) throw error;

  return (data ?? []).map((g) => {
    const vigencias = (g.tabela_vigencia ?? []) as {
      assembleia_numero: number;
      vigente: boolean;
      credito: { valor_credito: number }[];
    }[];
    const v = vigencias.find((x) => x.vigente);
    const valores = (v?.credito ?? []).map((c) => Number(c.valor_credito));
    return {
      id: g.id,
      numero: g.numero,
      prazo_grupo_meses: g.prazo_grupo_meses,
      status: g.status,
      assembleia: v?.assembleia_numero ?? null,
      qtdCreditos: valores.length,
      min: valores.length ? Math.min(...valores) : null,
      max: valores.length ? Math.max(...valores) : null,
    };
  });
}

export async function listarIndices() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("indice_correcao").select("id, sigla").order("id");
  if (error) throw error;
  return data ?? [];
}

export type Parcela = {
  valor_primeira: number;
  valor_demais: number;
  pct_parcela: number;
  plano_pagamento: { codigo: string; nome: string };
};

export type GrupoDetalhe = NonNullable<Awaited<ReturnType<typeof carregarGrupo>>>;

export async function carregarGrupo(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupo")
    .select(
      `id, numero, participantes, prazo_grupo_meses, dia_vencimento, indice_id, mes_reajuste,
       taxa_adm_total, fundo_reserva, seguro_opcional_pre, seguro_obrigatorio_pos,
       idade_limite_seguro, observacoes, notas_internas, status, familia_id,
       familia_produto(nome, slug),
       tabela_vigencia(id, assembleia_numero, data_assembleia, prazo_cota_meses, vigente,
         arquivo_importado(nome),
         credito(id, cod_bem, valor_credito, seguro_mensal,
           credito_parcela(valor_primeira, valor_demais, pct_parcela, plano_pagamento(codigo, nome)))),
       grupo_modalidade(max_parcelas_lance, pct_categoria, embutido_max_parcelas, embutido_base,
         embutido_pct, recurso_proprio_obrig, a_partir_assembleia_cota, requisitos, transferivel,
         tipo_contemplacao(codigo, nome, ordem)),
       grupo_sequencia(assembleia_de, assembleia_ate, ordem, quantidade, tipo_contemplacao(nome, eh_lance, codigo))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const vigencias = data.tabela_vigencia ?? [];
  const vigente = vigencias.find((v) => v.vigente) ?? null;
  const creditos = [...(vigente?.credito ?? [])].sort(
    (a, b) => Number(b.valor_credito) - Number(a.valor_credito),
  );

  const modalidades = [...(data.grupo_modalidade ?? [])].sort(
    (a, b) =>
      ((a.tipo_contemplacao as unknown as { ordem: number })?.ordem ?? 0) -
      ((b.tipo_contemplacao as unknown as { ordem: number })?.ordem ?? 0),
  );

  // sequência agrupada por faixa de assembleias
  const faixas = new Map<string, { de: number; ate: number; itens: { ordem: number; nome: string; codigo: string; eh_lance: boolean }[] }>();
  for (const s of data.grupo_sequencia ?? []) {
    const t = s.tipo_contemplacao as unknown as { nome: string; eh_lance: boolean; codigo: string };
    const k = `${s.assembleia_de}-${s.assembleia_ate}`;
    if (!faixas.has(k)) faixas.set(k, { de: s.assembleia_de, ate: s.assembleia_ate, itens: [] });
    faixas.get(k)!.itens.push({ ordem: s.ordem, nome: t.nome, codigo: t.codigo, eh_lance: t.eh_lance });
  }
  const sequencia = [...faixas.values()]
    .sort((a, b) => a.de - b.de)
    .map((f) => ({ ...f, itens: f.itens.sort((a, b) => a.ordem - b.ordem) }));

  return {
    ...data,
    familia: data.familia_produto as unknown as { nome: string; slug: string },
    vigente: vigente as null | {
      id: number;
      assembleia_numero: number;
      data_assembleia: string | null;
      prazo_cota_meses: number;
      arquivo_importado: { nome: string } | null;
    },
    totalVigencias: vigencias.length,
    creditos: creditos as unknown as {
      id: number;
      cod_bem: string;
      valor_credito: number;
      seguro_mensal: number | null;
      credito_parcela: Parcela[];
    }[],
    modalidades: modalidades as unknown as {
      max_parcelas_lance: number | null;
      pct_categoria: number | null;
      embutido_max_parcelas: number | null;
      embutido_base: "ofertado" | "categoria" | null;
      embutido_pct: number | null;
      recurso_proprio_obrig: boolean | null;
      a_partir_assembleia_cota: number;
      requisitos: string | null;
      transferivel: boolean;
      tipo_contemplacao: { codigo: string; nome: string; ordem: number };
    }[],
    sequencia,
  };
}
