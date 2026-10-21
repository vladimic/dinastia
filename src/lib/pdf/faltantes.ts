import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoGrupo } from "./comparar";

// Grupos que "não vieram" na leitura da pasta: a assembleia de referência é a mais recente entre os PDFs lidos;
// quem ainda está numa assembleia mais antiga e não tem PDF dessa data entra na lista de faltantes.

export type Faltante = {
  numero: number;
  assembleia: number;
  data: string;
  /** número da assembleia que o salto automático criaria */
  proxima: number;
  decisao: "pendente" | "aguardando_pdf";
};

export type ResumoFaltantes = { dataRef: string | null; pdfsNaData: number; faltantes: Faltante[] };

type Linha = Record<string, unknown>;

async function todas<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const saida: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await consulta(de, de + 999);
    if (error) throw error;
    saida.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return saida;
}

const meses = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));

/** Quantas assembleias passaram entre a data da versão vigente e a data de referência (no mínimo 1: assembleias mensais). */
export const saltoDeAssembleias = (dataVigente: string, dataRef: string) => Math.max(1, meses(dataRef) - meses(dataVigente));

export async function calcularFaltantes(supabase: SupabaseClient): Promise<ResumoFaltantes> {
  const [itens, atuais, esperando] = await Promise.all([
    todas<Linha>((a, b) => supabase.from("importacao_item").select("id, grupo_numero, situacao, d:leitura->>data_assembleia").in("situacao", ["pendente", "sem_mudanca", "aplicado", "erro"]).order("id").range(a, b)),
    todas<Linha>((a, b) => supabase.from("grupo_atual").select("numero, familia, assembleia_numero, data_assembleia").eq("familia", "imoveis").order("numero").range(a, b)),
    todas<Linha>((a, b) => supabase.from("importacao_faltante").select("grupo_numero, data_ref").order("grupo_numero").range(a, b)),
  ]);

  const datas = itens.map((i) => i.d as string | null).filter((d): d is string => !!d);
  const dataRef = datas.length ? datas.reduce((a, b) => (b > a ? b : a)) : null;
  if (!dataRef) return { dataRef: null, pdfsNaData: 0, faltantes: [] };

  const comPdf = new Set(itens.filter((i) => i.d === dataRef || (i.situacao === "erro" && i.grupo_numero !== null)).map((i) => Number(i.grupo_numero)));
  const aguardando = new Set(esperando.filter((e) => e.data_ref === dataRef).map((e) => Number(e.grupo_numero)));

  const faltantes: Faltante[] = atuais
    .filter((g) => String(g.data_assembleia) < dataRef && !comPdf.has(Number(g.numero)))
    .map((g) => ({
      numero: Number(g.numero),
      assembleia: Number(g.assembleia_numero),
      data: String(g.data_assembleia),
      proxima: Number(g.assembleia_numero) + saltoDeAssembleias(String(g.data_assembleia), dataRef),
      decisao: aguardando.has(Number(g.numero)) ? ("aguardando_pdf" as const) : ("pendente" as const),
    }));
  return { dataRef, pdfsNaData: new Set(itens.filter((i) => i.d === dataRef).map((i) => Number(i.grupo_numero))).size, faltantes };
}

/** Versão nova igual à vigente (créditos, tipos de parcela, modalidades, sequência e dados do grupo), só com assembleia, data e prazo da cota atualizados. */
export function montarSalto(estado: EstadoGrupo, dataRef: string, email: string) {
  const g = estado.grupo!;
  const v = estado.versoes.reduce((a, b) => (b.assembleia_numero > a.assembleia_numero ? b : a));
  const nova = v.assembleia_numero + saltoDeAssembleias(String(v.data_assembleia), dataRef);
  const prazoCota = g.prazo_grupo_meses - (nova - 1);
  return {
    numero: g.numero,
    assembleia: nova,
    arquivo: "(sem PDF) salto automático",
    hash: `salto:${g.numero}:${nova}`,
    aprovado_por: email,
    auditoria: { salto_automatico: true, de_assembleia: v.assembleia_numero, para_assembleia: nova, data: dataRef },
    grupo: {
      familia: g.familia,
      prazo_grupo_meses: g.prazo_grupo_meses,
      participantes: g.participantes,
      taxa_adm_total: g.taxa_adm_total,
      fundo_reserva: g.fundo_reserva,
      indice: g.indice,
      mes_reajuste: g.mes_reajuste,
      primeira_correcao: g.primeira_correcao,
      dia_vencimento: g.dia_vencimento,
    },
    versao: {
      data_assembleia: dataRef,
      prazo_cota: prazoCota,
      observacoes: v.observacoes,
      pagamento_com_furo: v.pagamento_com_furo ?? false,
      creditos: v.creditos.map(Number),
      tipos_parcela: v.tipos_parcela,
      modalidades: Object.entries(v.modalidades).map(([tipo, m]) => Object.fromEntries(Object.entries({ tipo, ...m }).filter(([, x]) => x !== null && x !== undefined))),
      faixas: v.faixas.map((f) => Object.fromEntries(Object.entries({ de: f.de, ate: f.ate, demais: f.demais, itens: f.itens }).filter(([, x]) => x !== null && x !== undefined))),
    },
    _nova: nova,
    _de: v.assembleia_numero,
    _prazoCota: prazoCota,
  };
}
