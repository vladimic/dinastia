import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APP_VERSION } from "@/lib/version";

// Backup lógico: tudo por chave natural (número do grupo + nº da assembleia), sem ids internos.
// Restaurar = repor o que falta e devolver os dados do grupo como estavam; nunca apaga nada.

export const FORMATO_BACKUP = 1;

type Linha = Record<string, unknown>;

async function todas(supabase: SupabaseClient, tabela: string, select = "*", ordem?: string) {
  const out: Linha[] = [];
  for (let de = 0; ; de += 1000) {
    let q = supabase.from(tabela).select(select).range(de, de + 999);
    if (ordem) q = q.order(ordem);
    const { data, error } = await q;
    if (error) throw new Error(`${tabela}: ${error.message}`);
    out.push(...((data ?? []) as unknown as Linha[]));
    if (!data || data.length < 1000) return out;
  }
}

export async function exportarBackup(supabase: SupabaseClient, email: string) {
  const [parametros, indices, tiposContemplacao, tiposParcela, grupos, versoes] = await Promise.all([
    todas(supabase, "parametros_gerais"),
    todas(supabase, "indice_correcao", "*", "sigla"),
    todas(supabase, "tipo_contemplacao", "*", "codigo"),
    todas(supabase, "tipo_parcela", "*", "codigo"),
    todas(supabase, "grupo", "*", "numero"),
    todas(
      supabase,
      "grupo_assembleia",
      `grupo_numero, assembleia_numero, data_assembleia, prazo_cota_meses, creditos, observacoes,
       aprovado_por, aprovado_em,
       arquivo:arquivo_importado(nome, hash_sha256, status, recebido_em, dados_extraidos),
       tipos_parcela:grupo_assembleia_tipo_parcela(tipo_parcela),
       modalidades:grupo_modalidade(tipo, max_parcelas_lance, pct_categoria, embutido_max_parcelas,
         embutido_base, embutido_pct, recurso_proprio_obrig, a_partir_assembleia_cota, requisitos,
         transferivel, embutido_texto),
       faixas:grupo_sequencia_faixa(assembleia_de, assembleia_ate, demais_tipo,
         itens:grupo_sequencia(ordem, tipo, quantidade))`,
      "id",
    ),
  ]);

  return {
    app: "dinastia",
    formato: FORMATO_BACKUP,
    versao_app: APP_VERSION,
    gerado_em: new Date().toISOString(),
    gerado_por: email,
    contagem: {
      grupos: grupos.length,
      versoes: versoes.length,
      indices: indices.length,
      tipos_contemplacao: tiposContemplacao.length,
      tipos_parcela: tiposParcela.length,
    },
    dados: { parametros, indices, tiposContemplacao, tiposParcela, grupos, versoes },
  };
}

export type Backup = Awaited<ReturnType<typeof exportarBackup>>;

export type ResultadoRestauracao = {
  versoesRepostas: number;
  versoesExistentes: number;
  gruposAtualizados: number;
  cadastrosAtualizados: number;
  erros: string[];
};

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function validarBackup(b: unknown): asserts b is Backup {
  const x = b as Partial<Backup> | null;
  if (!x || x.app !== "dinastia") throw new Error("Este arquivo não é uma exportação do Dinastia.");
  if (x.formato !== FORMATO_BACKUP) throw new Error(`Formato de backup ${String(x.formato)} não suportado.`);
  if (!x.dados || !Array.isArray(x.dados.grupos) || !Array.isArray(x.dados.versoes))
    throw new Error("Backup incompleto: faltam grupos ou versões.");
}

export async function restaurarBackup(supabase: SupabaseClient, b: Backup, email: string): Promise<ResultadoRestauracao> {
  const r: ResultadoRestauracao = {
    versoesRepostas: 0,
    versoesExistentes: 0,
    gruposAtualizados: 0,
    cadastrosAtualizados: 0,
    erros: [],
  };
  const d = b.dados;

  // 1) cadastros de apoio (chave natural)
  for (const [tabela, linhas, chave] of [
    ["parametros_gerais", d.parametros, "id"],
    ["indice_correcao", d.indices, "sigla"],
    ["tipo_contemplacao", d.tiposContemplacao, "codigo"],
    ["tipo_parcela", d.tiposParcela, "codigo"],
  ] as const) {
    if (!linhas?.length) continue;
    const { error } = await supabase.from(tabela).upsert(linhas, { onConflict: chave });
    if (error) r.erros.push(`${tabela}: ${error.message}`);
    else r.cadastrosAtualizados += linhas.length;
  }

  // 2) versões que faltam, pela mesma função da importação de PDF
  const { data: existentes, error: e1 } = await supabase.from("grupo_assembleia").select("grupo_numero, assembleia_numero").range(0, 99999);
  if (e1) throw new Error(e1.message);
  const tem = new Set((existentes ?? []).map((v) => `${v.grupo_numero}/${v.assembleia_numero}`));
  const grupoPorNumero = new Map(d.grupos.map((g) => [Number(g.numero), g]));

  for (const v of d.versoes as Linha[]) {
    const chave = `${v.grupo_numero}/${v.assembleia_numero}`;
    if (tem.has(chave)) {
      r.versoesExistentes++;
      continue;
    }
    const g = grupoPorNumero.get(Number(v.grupo_numero));
    if (!g) {
      r.erros.push(`versão ${chave}: grupo não está no backup`);
      continue;
    }
    const arq = (v.arquivo ?? {}) as Linha;
    const payload = {
      numero: Number(v.grupo_numero),
      familia: g.familia,
      assembleia: Number(v.assembleia_numero),
      data_assembleia: v.data_assembleia,
      prazo_grupo: g.prazo_grupo_meses,
      prazo_cota: v.prazo_cota_meses,
      participantes: g.participantes,
      taxa_adm: g.taxa_adm_total,
      indice: g.indice,
      mes_reajuste: g.mes_reajuste,
      primeira_correcao: g.primeira_correcao,
      vencimento: g.dia_vencimento,
      observacoes: v.observacoes,
      arquivo: arq.nome ?? "backup",
      hash: arq.hash_sha256 ?? null,
      auditoria: arq.dados_extraidos ?? null,
      aprovado_por: v.aprovado_por ?? `restaurado por ${email}`,
      creditos: ((v.creditos as unknown[]) ?? []).map(num),
      tipos_parcela: ((v.tipos_parcela as Linha[]) ?? []).map((t) => t.tipo_parcela),
      modalidades: ((v.modalidades as Linha[]) ?? []).map((m) => ({
        tipo: m.tipo,
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
      })),
      faixas: ((v.faixas as Linha[]) ?? []).map((f) => ({
        de: f.assembleia_de,
        ate: f.assembleia_ate,
        demais: f.demais_tipo,
        itens: [...((f.itens as Linha[]) ?? [])]
          .sort((a, b) => Number(a.ordem) - Number(b.ordem))
          .map((i) => ({ tipo: i.tipo, qtd: i.quantidade })),
      })),
    };
    const { error } = await supabase.rpc("importar_grupo", { p: payload });
    if (error) r.erros.push(`versão ${chave}: ${error.message}`);
    else r.versoesRepostas++;
  }

  // 3) dados do grupo exatamente como no backup (inclui edições manuais, ex.: fundo de reserva)
  // seguro_pct_mes saiu do grupo (0004): exportações antigas ainda trazem o campo
  const grupos = d.grupos.map(({ criado_em: _c, atualizado_em: _a, seguro_pct_mes: _s, ...g }) => g);
  for (let i = 0; i < grupos.length; i += 200) {
    const lote = grupos.slice(i, i + 200);
    const { error } = await supabase.from("grupo").upsert(lote, { onConflict: "numero" });
    if (error) r.erros.push(`grupos: ${error.message}`);
    else r.gruposAtualizados += lote.length;
  }

  return r;
}
