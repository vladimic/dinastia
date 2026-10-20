import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Faixa } from "./sequencia";
import type { GrupoEntrada, ModalidadeEntrada } from "./tabelaResumo";

// Lê do banco a versão vigente de cada grupo de imóveis, no formato que a Tabela Resumo usa.

type Linha = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function carregarGruposImoveis(supabase: SupabaseClient): Promise<GrupoEntrada[]> {
  const atuais: Linha[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("grupo_atual")
      .select("numero, prazo_grupo_meses, participantes, taxa_adm_total, prazo_cota_meses, creditos, grupo_assembleia_id")
      .eq("familia", "imoveis")
      .order("numero")
      .range(de, de + 999);
    if (error) throw new Error(`grupo_atual: ${error.message}`);
    atuais.push(...((data ?? []) as Linha[]));
    if (!data || data.length < 1000) break;
  }

  // detalhes das versões vigentes, em lotes (o filtro .in vai na URL)
  const versoes = new Map<number, Linha>();
  const ids = atuais.map((g) => Number(g.grupo_assembleia_id));
  for (let i = 0; i < ids.length; i += 60) {
    const { data, error } = await supabase
      .from("grupo_assembleia")
      .select(
        `id, pagamento_com_furo, fidelidade_meses,
         tipos:grupo_assembleia_tipo_parcela(tipo_parcela(pct)),
         modalidades:grupo_modalidade(tipo, max_parcelas_lance, embutido_max_parcelas, embutido_pct),
         faixas:grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo, itens:grupo_sequencia(ordem, tipo, quantidade))`,
      )
      .in("id", ids.slice(i, i + 60));
    if (error) throw new Error(`grupo_assembleia: ${error.message}`);
    for (const v of (data ?? []) as Linha[]) versoes.set(Number(v.id), v);
  }

  return atuais.map((g) => {
    const v = versoes.get(Number(g.grupo_assembleia_id)) ?? {};
    const tipos = (v.tipos ?? []) as { tipo_parcela: { pct: number | string } | null }[];
    const mods = (v.modalidades ?? []) as Linha[];
    const faixas = (v.faixas ?? []) as { assembleia_de: number; assembleia_ate: number; demais_tipo: string | null; itens: { ordem: number; tipo: string; quantidade: number }[] }[];
    return {
      numero: Number(g.numero),
      prazo_grupo: Number(g.prazo_grupo_meses),
      participantes: num(g.participantes),
      taxa: num(g.taxa_adm_total),
      prazo_cota: Number(g.prazo_cota_meses),
      creditos: ((g.creditos as unknown[]) ?? []).map(Number),
      furo: v.pagamento_com_furo === true,
      fid_meses: num(v.fidelidade_meses),
      pct_parcelas: tipos.map((t) => Number(t.tipo_parcela?.pct)).filter((n) => Number.isFinite(n)),
      modalidades: mods.map(
        (m): ModalidadeEntrada => ({
          tipo: String(m.tipo),
          max: num(m.max_parcelas_lance),
          emb_parc: num(m.embutido_max_parcelas),
          emb_pct: num(m.embutido_pct),
        }),
      ),
      faixas: faixas
        .map(
          (f): Faixa => ({
            de: f.assembleia_de,
            ate: f.assembleia_ate,
            demais: f.demais_tipo,
            itens: [...f.itens].sort((a, b) => a.ordem - b.ordem).map((i) => ({ codigo: i.tipo, qtd: i.quantidade })),
          }),
        )
        .sort((a, b) => a.de - b.de),
    };
  });
}
