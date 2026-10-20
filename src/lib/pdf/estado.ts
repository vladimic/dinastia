import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Faixa, Modalidade } from "./tipos";
import type { EstadoGrupo, GrupoBase, VersaoBase } from "./comparar";

const SELECT = `numero, familia, prazo_grupo_meses, participantes, taxa_adm_total, fundo_reserva, indice, mes_reajuste, primeira_correcao, dia_vencimento,
  grupo_assembleia (assembleia_numero, data_assembleia, prazo_cota_meses, creditos, observacoes, pagamento_com_furo,
    grupo_assembleia_tipo_parcela (tipo_parcela),
    grupo_modalidade (tipo, max_parcelas_lance, pct_categoria, embutido_max_parcelas, embutido_base, embutido_pct, recurso_proprio_obrig, a_partir_assembleia_cota, requisitos, transferivel, embutido_texto),
    grupo_sequencia_faixa (assembleia_de, assembleia_ate, demais_tipo, grupo_sequencia (ordem, tipo, quantidade)))`;

type Linha = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function versao(v: Linha): VersaoBase {
  const modalidades: Record<string, Modalidade> = {};
  for (const m of v.grupo_modalidade ?? []) {
    modalidades[m.tipo] = {
      max: m.max_parcelas_lance,
      pct_cat: num(m.pct_categoria),
      emb_parc: m.embutido_max_parcelas,
      emb_base: m.embutido_base,
      emb_pct: num(m.embutido_pct),
      rec_proprio: m.recurso_proprio_obrig,
      a_partir: m.a_partir_assembleia_cota,
      req: m.requisitos,
      transf: m.transferivel,
      emb_texto: m.embutido_texto,
    };
  }
  const faixas: Faixa[] = (v.grupo_sequencia_faixa ?? [])
    .map((f: Linha) => ({
      de: f.assembleia_de,
      ate: f.assembleia_ate,
      demais: f.demais_tipo,
      itens: [...(f.grupo_sequencia ?? [])].sort((a: Linha, b: Linha) => a.ordem - b.ordem).map((s: Linha) => ({ qtd: s.quantidade, tipo: s.tipo })),
    }))
    .sort((a: Faixa, b: Faixa) => a.de - b.de);
  return {
    assembleia_numero: v.assembleia_numero,
    data_assembleia: v.data_assembleia,
    prazo_cota_meses: v.prazo_cota_meses,
    creditos: (v.creditos ?? []).map(Number),
    observacoes: v.observacoes,
    pagamento_com_furo: v.pagamento_com_furo,
    tipos_parcela: (v.grupo_assembleia_tipo_parcela ?? []).map((t: Linha) => t.tipo_parcela),
    modalidades,
    faixas,
  };
}

/** Lê da base os grupos pedidos, com todas as versões (assembleias) e o conteúdo de cada uma. */
export async function carregarEstados(supabase: SupabaseClient, numeros: number[]): Promise<Map<number, EstadoGrupo>> {
  const mapa = new Map<number, EstadoGrupo>();
  for (let i = 0; i < numeros.length; i += 40) {
    const { data, error } = await supabase.from("grupo").select(SELECT).in("numero", numeros.slice(i, i + 40));
    if (error) throw error;
    for (const g of (data ?? []) as Linha[]) {
      const grupo: GrupoBase = {
        numero: g.numero,
        familia: g.familia,
        prazo_grupo_meses: g.prazo_grupo_meses,
        participantes: g.participantes,
        taxa_adm_total: num(g.taxa_adm_total),
        fundo_reserva: num(g.fundo_reserva),
        indice: g.indice,
        mes_reajuste: g.mes_reajuste,
        primeira_correcao: g.primeira_correcao,
        dia_vencimento: g.dia_vencimento,
      };
      mapa.set(g.numero, { grupo, versoes: (g.grupo_assembleia ?? []).map(versao) });
    }
  }
  return mapa;
}
