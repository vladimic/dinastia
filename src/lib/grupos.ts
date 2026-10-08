import "server-only";
import { createClient } from "@/lib/supabase/server";

// família: lista fixa (sem tabela)
export const FAMILIAS = [
  { slug: "imoveis", nome: "Imóveis" },
  { slug: "veiculos", nome: "Veículos" },
  { slug: "servicos", nome: "Serviços" },
  { slug: "outros_bens", nome: "Outros Bens" },
] as const;
export type FamiliaSlug = (typeof FAMILIAS)[number]["slug"];
export const nomeFamilia = (slug: string) => FAMILIAS.find((f) => f.slug === slug)?.nome ?? slug;

// ordem de exibição das modalidades
const ORDEM_TIPO = [
  "SORTEIO_ATIVO",
  "SORTEIO_COTA_CANCELADA",
  "LANCE_LIVRE",
  "LANCE_LIMITADO",
  "LANCE_FIXO",
  "LANCE_FIDELIDADE",
];
export const ehLance = (codigo: string) => codigo.startsWith("LANCE_");

const nums = (v: unknown) => ((v ?? []) as (number | string)[]).map(Number);

export async function contarPorFamilia(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grupo").select("familia");
  if (error) throw error;
  const c: Record<string, number> = {};
  for (const g of data ?? []) c[g.familia] = (c[g.familia] ?? 0) + 1;
  return c;
}

export type GrupoResumo = {
  numero: number;
  prazo_grupo_meses: number;
  assembleia: number;
  data_assembleia: string | null;
  qtdCreditos: number;
  min: number | null;
  max: number | null;
};

export async function listarGrupos(familia: string): Promise<GrupoResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupo_atual")
    .select("numero, prazo_grupo_meses, assembleia_numero, data_assembleia, creditos")
    .eq("familia", familia)
    .order("numero");
  if (error) throw error;
  return (data ?? []).map((g) => {
    const v = nums(g.creditos);
    return {
      numero: g.numero,
      prazo_grupo_meses: g.prazo_grupo_meses,
      assembleia: g.assembleia_numero,
      data_assembleia: g.data_assembleia,
      qtdCreditos: v.length,
      min: v.length ? Math.min(...v) : null,
      max: v.length ? Math.max(...v) : null,
    };
  });
}

export async function listarIndices() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("indice_correcao").select("sigla, nome").order("sigla");
  if (error) throw error;
  return data ?? [];
}

type TipoRef = { codigo: string; nome: string };

export type Modalidade = {
  tipo: string;
  max_parcelas_lance: number | null;
  pct_categoria: number | null;
  embutido_max_parcelas: number | null;
  embutido_base: "ofertado" | "categoria" | null;
  embutido_pct: number | null;
  recurso_proprio_obrig: boolean | null;
  a_partir_assembleia_cota: number;
  requisitos: string | null;
  transferivel: boolean;
  embutido_texto: string | null;
  tipo_contemplacao: TipoRef;
};

export type GrupoDetalhe = NonNullable<Awaited<ReturnType<typeof carregarGrupo>>>;

export async function carregarGrupo(numero: number) {
  const supabase = await createClient();

  const { data: g, error } = await supabase.from("grupo_atual").select("*").eq("numero", numero).maybeSingle();
  if (error) throw error;
  if (!g) return null;

  const [versao, contagem] = await Promise.all([
    supabase
      .from("grupo_assembleia")
      .select(
        `id, aprovado_por, aprovado_em, observacoes,
         arquivo_importado(nome),
         grupo_assembleia_tipo_parcela(tipo_parcela(codigo, descricao, pct)),
         grupo_modalidade(tipo, max_parcelas_lance, pct_categoria, embutido_max_parcelas, embutido_base,
           embutido_pct, recurso_proprio_obrig, a_partir_assembleia_cota, requisitos, transferivel,
           embutido_texto, tipo_contemplacao(codigo, nome)),
         grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo, tipo_contemplacao(nome),
           grupo_sequencia(ordem, quantidade, tipo, tipo_contemplacao(codigo, nome)))`,
      )
      .eq("id", g.grupo_assembleia_id)
      .single(),
    supabase.from("grupo_assembleia").select("id", { count: "exact", head: true }).eq("grupo_numero", numero),
  ]);
  if (versao.error) throw versao.error;
  const v = versao.data;

  const tiposParcela = (
    (v.grupo_assembleia_tipo_parcela ?? []) as unknown as { tipo_parcela: { codigo: string; descricao: string; pct: number } }[]
  )
    .map((t) => ({ ...t.tipo_parcela, pct: Number(t.tipo_parcela.pct) }))
    .sort((a, b) => b.pct - a.pct);

  const modalidades = ((v.grupo_modalidade ?? []) as unknown as Modalidade[]).sort(
    (a, b) => ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo),
  );

  type Faixa = {
    assembleia_de: number;
    assembleia_ate: number;
    demais_tipo: string | null;
    tipo_contemplacao: { nome: string } | null;
    grupo_sequencia: { ordem: number; quantidade: number; tipo: string; tipo_contemplacao: TipoRef }[];
  };
  const sequencia = ((v.grupo_sequencia_faixa ?? []) as unknown as Faixa[])
    .sort((a, b) => a.assembleia_de - b.assembleia_de)
    .map((f) => ({
      de: f.assembleia_de,
      ate: f.assembleia_ate,
      demais: f.tipo_contemplacao?.nome ?? null,
      itens: [...f.grupo_sequencia]
        .sort((a, b) => a.ordem - b.ordem)
        .map((i) => ({ ordem: i.ordem, qtd: i.quantidade, codigo: i.tipo, nome: i.tipo_contemplacao.nome })),
    }));

  return {
    numero: g.numero as number,
    familia: g.familia as string,
    prazo_grupo_meses: g.prazo_grupo_meses as number,
    participantes: g.participantes as number | null,
    taxa_adm_total: g.taxa_adm_total as number | null,
    fundo_reserva: g.fundo_reserva as number | null,
    seguro_pct_mes: g.seguro_pct_mes as number | null,
    indice: g.indice as string | null,
    mes_reajuste: g.mes_reajuste as number | null,
    primeira_correcao: g.primeira_correcao as string | null,
    dia_vencimento: g.dia_vencimento as number | null,
    assembleia: g.assembleia_numero as number,
    data_assembleia: g.data_assembleia as string | null,
    prazo_cota_meses: g.prazo_cota_meses as number,
    creditos: nums(g.creditos).sort((a, b) => a - b),
    observacoes: v.observacoes as string | null,
    arquivo: (v.arquivo_importado as unknown as { nome: string } | null)?.nome ?? null,
    aprovado_por: v.aprovado_por as string | null,
    aprovado_em: v.aprovado_em as string | null,
    totalVersoes: contagem.count ?? 1,
    tiposParcela,
    modalidades,
    sequencia,
  };
}
