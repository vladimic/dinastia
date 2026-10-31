import "server-only";
import { createClient } from "@/lib/supabase/server";
import { padroesDeLinha, type PadroesSimulador } from "@/lib/simulacao";
import { linhaDetalhada, modelar, montarOrdem, type Faixa as FaixaSeq } from "@/lib/sequencia";

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
  "SOR",
  "LIV",
  "LIM",
  "FIX",
  "F40",
  "F25",
  "FID",
];
export const ehLance = (codigo: string) => ["LIV", "LIM", "FIX", "F40", "F25", "FID"].includes(codigo);

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
  /** códigos das 20 primeiras contemplações do grupo */
  seq: string[];
  /** participantes do grupo */
  participantes: number | null;
  /** pagamento com furo ligado na versão vigente */
  furo: boolean;
  /** percentuais de parcela reduzida (abaixo de 100) oferecidos na versão vigente, do menor para o maior */
  reduzidas: number[];
  /** quantidade de parcelas reduzidas (fase 1) dos planos em duas fases, ex.: 12, 18, 24 (veículos) */
  fases: number[];
};

const TAMANHO_POPUP = 20;

export async function listarGrupos(familia: string): Promise<GrupoResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupo_atual")
    .select("numero, prazo_grupo_meses, assembleia_numero, data_assembleia, creditos, grupo_assembleia_id, participantes")
    .eq("familia", familia)
    .order("numero");
  if (error) throw error;

  // sequência da versão vigente de cada grupo, numa consulta só
  const ids = (data ?? []).map((g) => g.grupo_assembleia_id as number);
  const seqPorVersao = new Map<number, string[]>();
  const marcasPorVersao = new Map<number, { furo: boolean; reduzidas: number[]; fases: number[] }>();
  if (ids.length) {
    const { data: versoes, error: e2 } = await supabase
      .from("grupo_assembleia")
      .select(
        "id, fidelidade_meses, pagamento_com_furo, grupo_assembleia_tipo_parcela(fase1_parcelas, tipo_parcela(pct)), grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo, demais_tipo_2, grupo_sequencia(ordem, quantidade, tipo))",
      )
      .in("id", ids);
    if (e2) throw e2;
    for (const ver of versoes ?? []) {
      const faixas: FaixaSeq[] = (
        (ver.grupo_sequencia_faixa ?? []) as unknown as {
          assembleia_de: number;
          assembleia_ate: number;
          demais_tipo: string | null;
          demais_tipo_2: string | null;
          grupo_sequencia: { ordem: number; quantidade: number; tipo: string }[];
        }[]
      )
        .sort((a, b) => a.assembleia_de - b.assembleia_de)
        .map((f) => ({
          de: f.assembleia_de,
          ate: f.assembleia_ate,
          demais: f.demais_tipo,
          demais2: f.demais_tipo_2,
          itens: [...f.grupo_sequencia].sort((a, b) => a.ordem - b.ordem).map((i) => ({ codigo: i.tipo, qtd: i.quantidade })),
        }));
      const m = modelar(faixas);
      let seq: string[] = [];
      if (m?.simples) seq = linhaDetalhada(m, (ver.fidelidade_meses as number | null) ?? null, TAMANHO_POPUP).map((p) => p.codigo);
      else if (faixas.length) seq = montarOrdem(faixas[faixas.length - 1].itens, faixas[faixas.length - 1].demais, TAMANHO_POPUP, faixas[faixas.length - 1].demais2);
      seqPorVersao.set(ver.id as number, seq);
      const tps = (ver.grupo_assembleia_tipo_parcela ?? []) as unknown as { fase1_parcelas: number | null; tipo_parcela: { pct: number | string } | null }[];
      const pcts = tps.map((t) => Number(t.tipo_parcela?.pct));
      marcasPorVersao.set(ver.id as number, {
        furo: ver.pagamento_com_furo === true,
        reduzidas: [...new Set(pcts.filter((p) => Number.isFinite(p) && p < 100))].sort((a, b) => a - b),
        fases: [...new Set(tps.flatMap((t) => (t.fase1_parcelas ? [t.fase1_parcelas] : [])))].sort((a, b) => a - b),
      });
    }
  }

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
      seq: seqPorVersao.get(g.grupo_assembleia_id as number) ?? [],
      participantes: (g.participantes as number | null) ?? null,
      furo: marcasPorVersao.get(g.grupo_assembleia_id as number)?.furo ?? false,
      reduzidas: marcasPorVersao.get(g.grupo_assembleia_id as number)?.reduzidas ?? [],
      fases: marcasPorVersao.get(g.grupo_assembleia_id as number)?.fases ?? [],
    };
  });
}

// cor de cada modalidade, para os desenhos de sequência
export async function listarCoresContemplacao(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tipo_contemplacao").select("codigo, cor");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((t) => [t.codigo as string, t.cor as string]));
}

export async function listarIndices() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("indice_correcao").select("sigla, nome").order("sigla");
  if (error) throw error;
  return data ?? [];
}

/** Padrões do simulador, vindos dos parâmetros globais */
export async function carregarPadroesSimulador(): Promise<PadroesSimulador> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("parametros_gerais").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return padroesDeLinha(data);
}

type TipoRef = { codigo: string; nome: string };

export type Modalidade = {
  tipo: string;
  max_parcelas_lance: number | null;
  embutido_max_parcelas: number | null;
  embutido_pct: number | null;
  /** base do embutido_pct: "lance" (% do lance) ou "categoria" (% do crédito + taxas) */
  embutido_base: "lance" | "categoria";
  /** veículos: lance fixo em % da categoria */
  lance_pct: number | null;
  /** veículos: teto do lance livre/fidelidade em % da categoria */
  max_lance_pct: number | null;
  a_partir_assembleia_cota: number;
  requisitos: string | null;
  tipo_contemplacao: TipoRef;
};

export type GrupoDetalhe = NonNullable<Awaited<ReturnType<typeof carregarGrupo>>>;

export async function carregarGrupo(numero: number) {
  const supabase = await createClient();

  const { data: g, error } = await supabase.from("grupo_atual").select("*").eq("numero", numero).maybeSingle();
  if (error) throw error;
  if (!g) return null;

  const [versao, contagem, cadastroParcelas, cadastroTipos] = await Promise.all([
    supabase
      .from("grupo_assembleia")
      .select(
        `id, aprovado_por, aprovado_em, observacoes, pagamento_com_furo, fidelidade_meses,
         arquivo_importado(nome),
         grupo_assembleia_tipo_parcela(fase1_pct, fase1_parcelas, fase2_parcelas, tipo_parcela(codigo, descricao, pct, rotulo)),
         grupo_modalidade(tipo, max_parcelas_lance, embutido_max_parcelas, embutido_pct, embutido_base, lance_pct, max_lance_pct,
           a_partir_assembleia_cota, requisitos, tipo_contemplacao(codigo, nome)),
         grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo, demais_tipo_2,
           grupo_sequencia(ordem, quantidade, tipo, tipo_contemplacao(codigo, nome)))`,
      )
      .eq("id", g.grupo_assembleia_id)
      .single(),
    supabase.from("grupo_assembleia").select("id", { count: "exact", head: true }).eq("grupo_numero", numero),
    supabase.from("tipo_parcela").select("codigo, descricao, pct, rotulo").eq("familia", g.familia).order("pct", { ascending: false }),
    supabase.from("tipo_contemplacao").select("codigo, nome, cor").eq("familia", g.familia),
  ]);
  if (versao.error) throw versao.error;
  if (cadastroParcelas.error) throw cadastroParcelas.error;
  if (cadastroTipos.error) throw cadastroTipos.error;
  const v = versao.data;

  // todos os tipos do cadastro, marcando os oferecidos pelo grupo na versão vigente
  const ofertas = ((v.grupo_assembleia_tipo_parcela ?? []) as unknown as {
    fase1_pct: number | string | null;
    fase1_parcelas: number | null;
    fase2_parcelas: number | null;
    tipo_parcela: { codigo: string };
  }[]).map((t) => [t.tipo_parcela.codigo, t] as const);
  const oferecidos = new Map(ofertas);
  // o cadastro já vem só da família do grupo
  const tiposParcela = (cadastroParcelas.data ?? [])
    .map((t) => {
      const o = oferecidos.get(t.codigo as string);
      return {
        codigo: t.codigo as string,
        descricao: t.descricao as string,
        pct: Number(t.pct),
        rotulo: (t.rotulo as string | null) ?? null,
        disponivel: oferecidos.has(t.codigo as string),
        /** plano em duas fases: % do crédito da fase 1 e quantidade de parcelas de cada fase */
        fase1Pct: o?.fase1_pct != null ? Number(o.fase1_pct) : null,
        fase1Parcelas: o?.fase1_parcelas ?? null,
        fase2Parcelas: o?.fase2_parcelas ?? null,
      };
    });

  const modalidades = ((v.grupo_modalidade ?? []) as unknown as Modalidade[]).sort(
    (a, b) => ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo),
  );

  type Faixa = {
    assembleia_de: number;
    assembleia_ate: number;
    demais_tipo: string | null;
    demais_tipo_2: string | null;
    grupo_sequencia: { ordem: number; quantidade: number; tipo: string; tipo_contemplacao: TipoRef }[];
  };
  const tipos = new Map((cadastroTipos.data ?? []).map((t) => [t.codigo as string, { nome: t.nome as string, cor: t.cor as string }]));
  const faixas: FaixaSeq[] = ((v.grupo_sequencia_faixa ?? []) as unknown as Faixa[])
    .sort((a, b) => a.assembleia_de - b.assembleia_de)
    .map((f) => ({
      de: f.assembleia_de,
      ate: f.assembleia_ate,
      demais: f.demais_tipo,
      demais2: f.demais_tipo_2,
      itens: [...f.grupo_sequencia]
        .sort((a, b) => a.ordem - b.ordem)
        .map((i) => ({ codigo: i.tipo, qtd: i.quantidade })),
    }));
  const tiposContemplacao = (cadastroTipos.data ?? []).map((t) => ({
    codigo: t.codigo as string,
    nome: t.nome as string,
    cor: t.cor as string,
  }));
  const enriquecer = (codigo: string, desde: number | null = null) => ({
    codigo,
    nome: tipos.get(codigo)?.nome ?? codigo,
    cor: tipos.get(codigo)?.cor ?? "#5b5680",
    desde,
  });
  // uma linha por grupo (sorteios, cancelada e fidelidade viram notas); se as faixas diferem por outro
  // motivo ("regra específica"), cai para uma linha por faixa
  const modelo = modelar(faixas);
  const sequencia = {
    modelo,
    linha: modelo?.simples ? linhaDetalhada(modelo, (v.fidelidade_meses as number | null) ?? null).map((p) => enriquecer(p.codigo, p.desde)) : [],
    faixas: modelo && !modelo.simples ? faixas.map((f) => ({ de: f.de, ate: f.ate, ordem: montarOrdem(f.itens, f.demais, undefined, f.demais2).map((c) => enriquecer(c)) })) : [],
  };

  return {
    numero: g.numero as number,
    familia: g.familia as string,
    prazo_grupo_meses: g.prazo_grupo_meses as number,
    participantes: g.participantes as number | null,
    taxa_adm_total: g.taxa_adm_total as number | null,
    fundo_reserva: g.fundo_reserva as number | null,
    indice: g.indice as string | null,
    mes_reajuste: g.mes_reajuste as number | null,
    primeira_correcao: g.primeira_correcao as string | null,
    dia_vencimento: g.dia_vencimento as number | null,
    parcela_minima_pct: g.parcela_minima_pct != null ? Number(g.parcela_minima_pct) : null,
    grupo_assembleia_id: v.id as number,
    pagamento_com_furo: Boolean(v.pagamento_com_furo),
    fidelidade_meses: v.fidelidade_meses as number | null,
    assembleia: g.assembleia_numero as number,
    data_assembleia: g.data_assembleia as string | null,
    prazo_cota_meses: g.prazo_cota_meses as number,
    creditos: nums(g.creditos).sort((a, b) => a - b),
    observacoes: v.observacoes as string | null,
    arquivo: (v.arquivo_importado as unknown as { nome: string } | null)?.nome ?? null,
    aprovado_por: v.aprovado_por as string | null,
    aprovado_em: v.aprovado_em as string | null,
    atualizado_em: g.atualizado_em as string | null,
    totalVersoes: contagem.count ?? 1,
    tiposParcela,
    modalidades,
    sequencia,
    tiposContemplacao,
  };
}
