"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refazerTodasAsListas } from "@/lib/listaGrupos";
import { ehAdministrador, usuarioAtual } from "@/lib/usuario";
import { carregarEstados } from "@/lib/pdf/estado";
import { calcularFaltantes, montarSalto } from "@/lib/pdf/faltantes";
import { classificar, comparar, montarFinal, tiposParcelaDe, type Decidida, type Diferenca } from "@/lib/pdf/comparar";
import { canon } from "@/lib/pdf/canon";
import { converterEdicao } from "@/lib/pdf/edicao";
import { LEITOR, type Leitura } from "@/lib/pdf/tipos";

type Falha = { ok: false; erro: string };
const NEGADO: Falha = { ok: false, erro: "Apenas administradores podem importar tabelas." };
const chave = (d: { escopo: string; chave: string; campo: string }) => `${d.escopo}|${d.chave}|${d.campo}`;

async function quem() {
  if (!(await ehAdministrador())) return null;
  return (await usuarioAtual())?.email ?? null;
}

/** Entre os hashes (SHA-256) dos PDFs, os que a base já conhece: não precisam ser lidos de novo. */
export async function hashesJaLidos(hashes: string[]): Promise<string[]> {
  if (!(await quem())) return [];
  const supabase = await createClient();
  const conhecidos = new Set<string>();
  for (let i = 0; i < hashes.length; i += 100) {
    const parte = hashes.slice(i, i + 100);
    const { data } = await supabase.from("importacao_item").select("hash_sha256, situacao, leitor:leitura->>leitor").in("hash_sha256", parte);
    // descartado pelo administrador nunca volta; o resto só é lido de novo se o leitor mudou desde a última leitura (ou deu erro)
    for (const r of (data ?? []) as { hash_sha256: string; situacao: string; leitor: string | null }[]) {
      if (r.situacao === "rejeitado" || (r.situacao !== "erro" && Number(r.leitor ?? 0) >= LEITOR)) conhecidos.add(r.hash_sha256);
    }
  }
  return [...conhecidos];
}

export type ResumoLote = { lidos: number; novos: number; novasAssembleias: number; semMudanca: number; comDiferencas: number; ignorados: number; erros: number };

// Dois PDFs do mesmo grupo e assembleia são "o mesmo" quando trazem os mesmos dados que o Dinastia guarda;
// o que a base não guarda (plano de antecipado, valores das parcelas) não conta (ex.: "GRUPO 540 - 1%" e "- 2%").
const assinatura = (l: Leitura) =>
  canon({
    numero: l.numero, familia: l.familia, assembleia: l.assembleia, data: l.data_assembleia, prazo_cota: l.prazo_cota, prazo_grupo: l.prazo_grupo,
    participantes: l.participantes, taxa_adm: l.taxa_adm, indice: l.indice, mes_reajuste: l.mes_reajuste, primeira_correcao: l.primeira_correcao,
    vencimento: l.vencimento, fundo_reserva: l.fundo_reserva, observacoes: l.observacoes, creditos: l.creditos.map((c) => c.credito).sort((a, b) => b - a),
    tipos: l.planos.DILUIDA, modalidades: l.modalidades, faixas: l.faixas,
  });

/** Guarda as leituras (já feitas no navegador), compara cada uma com a base e registra as diferenças a decidir. */
export async function registrarLeituras(leiturasLidas: Leitura[], falhas: { arquivo: string; hash: string; motivo: string }[]): Promise<{ ok: true; resumo: ResumoLote } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  // Veículos já são lidos, mas a importação deles ainda não grava os campos novos (etapa 4): por ora ficam como erro, sem tocar na base
  const leituras = (Array.isArray(leiturasLidas) ? leiturasLidas : []).map((l) =>
    l.familia === "veiculos" ? { ...l, erros: [...l.erros, "importação de Veículos ainda não liberada"] } : l,
  );
  const resumo: ResumoLote = { lidos: leituras.length + falhas.length, novos: 0, novasAssembleias: 0, semMudanca: 0, comDiferencas: 0, ignorados: 0, erros: 0 };

  if (!Array.isArray(leituras) || !Array.isArray(falhas) || leituras.length + falhas.length > 100) return { ok: false, erro: "Lote de leituras inválido." };

  const vistos = new Map<string, { arquivo: string; sig: string }>();
  let estados: Awaited<ReturnType<typeof carregarEstados>>;
  let porHash: Map<string, { id: number; situacao: string }>;
  try {
    const numeros = [...new Set(leituras.filter((l) => !l.erros.length).map((l) => Number(l.numero)))];
    estados = await carregarEstados(supabase, numeros);
    const hashes = [...leituras.map((l) => l.hash), ...falhas.map((f) => f.hash)];
    const { data: existentes } = await supabase.from("importacao_item").select("id, hash_sha256, situacao").in("hash_sha256", hashes);
    porHash = new Map((existentes ?? []).map((x) => [x.hash_sha256 as string, x as { id: number; situacao: string }]));
    const { data: mesmos } = numeros.length
      ? await supabase.from("importacao_item").select("hash_sha256, arquivo, grupo_numero, assembleia_numero, leitura, situacao").in("grupo_numero", numeros).in("situacao", ["pendente", "sem_mudanca"])
      : { data: [] };
    // os itens deste mesmo lote (relidos) não contam como "outro PDF"
    for (const m of mesmos ?? []) if (m.leitura && !hashes.includes(m.hash_sha256 as string)) vistos.set(`${m.grupo_numero}|${m.assembleia_numero}`, { arquivo: m.arquivo as string, sig: assinatura(m.leitura as Leitura) });
  } catch (e) {
    return { ok: false, erro: "Não foi possível consultar a base: " + ((e as { message?: string }).message ?? "erro") };
  }

  async function gravar(linha: Record<string, unknown>, diffs: Diferenca[]) {
    const existente = porHash.get(linha.hash_sha256 as string);
    let id: number;
    let antigas: { escopo: string; chave: string; campo: string; valor_atual: unknown; valor_novo: unknown; decisao: string; valor_final: unknown; decidido_por: string | null; decidido_em: string | null }[] = [];
    if (existente) {
      if (existente.situacao === "rejeitado") return; // descartado pelo administrador: nunca é lido de novo
      // motivo e tipo antigos não podem sobrar numa releitura
      const { error } = await supabase.from("importacao_item").update({ motivo: null, tipo: null, ...linha, lido_por: email }).eq("id", existente.id);
      if (error) throw error;
      id = existente.id;
      // releitura (leitor mais novo): guarda as decisões já tomadas que continuam valendo
      const { data: velhas } = await supabase.from("importacao_diferenca").select("escopo, chave, campo, valor_atual, valor_novo, decisao, valor_final, decidido_por, decidido_em").eq("item_id", id);
      antigas = (velhas ?? []) as typeof antigas;
      await supabase.from("importacao_diferenca").delete().eq("item_id", id);
    } else {
      const { data, error } = await supabase.from("importacao_item").insert({ ...linha, lido_por: email }).select("id").single();
      if (error) throw error;
      id = data.id as number;
    }
    if (diffs.length) {
      const reaproveita = (d: Diferenca) => {
        const v = antigas.find((a) => a.escopo === d.escopo && a.chave === d.chave && a.campo === d.campo && a.decisao !== "pendente" && canon(a.valor_atual) === canon(d.valor_atual) && canon(a.valor_novo) === canon(d.valor_novo));
        return v ? { decisao: v.decisao, valor_final: v.valor_final, decidido_por: v.decidido_por, decidido_em: v.decidido_em } : {};
      };
      const { error } = await supabase.from("importacao_diferenca").insert(diffs.map((d) => ({ item_id: id, ...d, ...reaproveita(d) })));
      if (error) throw error;
    }
  }

  try {
    for (const f of falhas) {
      resumo.erros++;
      await gravar({ hash_sha256: f.hash, arquivo: f.arquivo, familia: "imoveis", situacao: "erro", motivo: f.motivo }, []);
    }
    for (const l of leituras) {
      const base = { hash_sha256: l.hash, arquivo: l.arquivo, familia: l.familia.replace("-", "_"), grupo_numero: Number(l.numero), assembleia_numero: l.assembleia, leitura: l };
      if (l.erros.length || tiposParcelaDe(l).length !== l.planos.DILUIDA.length) {
        resumo.erros++;
        await gravar({ ...base, situacao: "erro", motivo: l.erros.length ? l.erros.join("; ") : "parcela com percentual sem tipo de parcela cadastrado" }, []);
        continue;
      }
      const estado = estados.get(Number(l.numero)) ?? { grupo: null, versoes: [] };
      const c = classificar(l, estado);
      const k = `${l.numero}|${l.assembleia}`;
      const outro = vistos.get(k);
      if (outro) {
        resumo.ignorados++;
        const igual = outro.sig === assinatura(l);
        await gravar({ ...base, situacao: "ignorado", tipo: c.tipo, motivo: igual ? `Duplicado de ${outro.arquivo}` : `Outro PDF (${outro.arquivo}) já traz a ${l.assembleia}ª assembleia deste grupo com dados diferentes; este não foi considerado` }, []);
        continue;
      }
      if (c.tipo === "anterior") {
        resumo.ignorados++;
        const vigente = Math.max(...estado.versoes.map((v) => v.assembleia_numero));
        await gravar({ ...base, situacao: "ignorado", tipo: c.tipo, motivo: `A ${l.assembleia}ª assembleia é anterior à vigente na base (${vigente}ª)` }, []);
        continue;
      }
      const diffs = comparar(l, estado, c);
      vistos.set(k, { arquivo: l.arquivo, sig: assinatura(l) });
      if (c.tipo === "mesma_assembleia" && !diffs.length) {
        resumo.semMudanca++;
        await gravar({ ...base, situacao: "sem_mudanca", tipo: c.tipo }, []);
        continue;
      }
      if (c.tipo === "grupo_novo") resumo.novos++;
      else if (c.tipo === "nova_assembleia") resumo.novasAssembleias++;
      if (diffs.length) resumo.comDiferencas++;
      await gravar({ ...base, situacao: "pendente", tipo: c.tipo }, diffs);
    }
  } catch (e) {
    return { ok: false, erro: "Não foi possível registrar a leitura: " + ((e as { message?: string }).message ?? "erro no banco") };
  }
  revalidatePath("/importar");
  return { ok: true, resumo };
}

// ---------------------------------------------------------------- decisões

type Decisao = "aceita" | "rejeitada" | "editada";

type Marca = { id: number; decisao: "aceita" | "rejeitada" | "pendente" };

/** Grava de uma vez as marcações feitas na tela (a tela marca na hora e manda em lote). Não recarrega a página. */
export async function decidirLote(marcas: Marca[]): Promise<{ ok: true } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  const agora = new Date().toISOString();
  for (const decisao of ["aceita", "rejeitada", "pendente"] as const) {
    const ids = [...new Set(marcas.filter((m) => m.decisao === decisao).map((m) => m.id))];
    const nova = decisao === "pendente" ? { decisao, valor_final: null, decidido_por: null, decidido_em: null } : { decisao, valor_final: null, decidido_por: email, decidido_em: agora };
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase.from("importacao_diferenca").update(nova).in("id", ids.slice(i, i + 200));
      if (error) return { ok: false, erro: "Não foi possível salvar as marcações." };
    }
  }
  return { ok: true };
}

/** Aceita ou rejeita de uma vez todas as diferenças pendentes de um tipo (ex.: todos os "Número de participantes"). */
export async function decidirPorCampo(escopo: string, campo: string, decisao: "aceita" | "rejeitada"): Promise<{ ok: true; total: number } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("importacao_diferenca")
    .update({ decisao, valor_final: null, decidido_por: email, decidido_em: new Date().toISOString() })
    .eq("escopo", escopo)
    .eq("campo", campo)
    .eq("decisao", "pendente")
    .select("id");
  if (error) return { ok: false, erro: "Não foi possível salvar a decisão." };
  revalidatePath("/importar");
  return { ok: true, total: data?.length ?? 0 };
}

export async function editarDiferenca(id: number, texto: string): Promise<{ ok: true; valor: unknown } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  const { data: d } = await supabase.from("importacao_diferenca").select("escopo, campo").eq("id", id).maybeSingle();
  if (!d) return { ok: false, erro: "Diferença não encontrada." };
  const r = converterEdicao(d.escopo as string, d.campo as string, texto);
  if (!r.ok) return r;
  const { error } = await supabase
    .from("importacao_diferenca")
    .update({ decisao: "editada" satisfies Decisao, valor_final: r.valor, decidido_por: email, decidido_em: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, erro: "Não foi possível salvar a edição." };
  return { ok: true, valor: r.valor };
}

/** Descarta o PDF inteiro (nada dele entra na base). */
export async function descartarItem(itemId: number): Promise<{ ok: true } | Falha> {
  if (!(await quem())) return NEGADO;
  const supabase = await createClient();
  const { error } = await supabase.from("importacao_item").update({ situacao: "rejeitado", motivo: "Descartado pelo administrador" }).eq("id", itemId).eq("situacao", "pendente");
  if (error) return { ok: false, erro: "Não foi possível descartar." };
  revalidatePath("/importar");
  return { ok: true };
}

/** Tira da lista um PDF descartado, ignorado ou com erro: na próxima leitura da pasta ele volta a ser lido. */
export async function reativarItem(itemId: number): Promise<{ ok: true } | Falha> {
  if (!(await quem())) return NEGADO;
  const supabase = await createClient();
  const { error } = await supabase.from("importacao_item").delete().eq("id", itemId).in("situacao", ["rejeitado", "ignorado", "erro"]);
  if (error) return { ok: false, erro: "Não foi possível reativar." };
  revalidatePath("/importar");
  return { ok: true };
}

// ---------------------------------------------------------------- grupos sem PDF

/** "Vou reimportar o PDF deste grupo": só registra a escolha (o grupo fica na lista "aguardando PDF"). Desfazer = volta a pendente. */
export async function aguardarPdf(grupos: number[], aguardar: boolean): Promise<{ ok: true } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  const { dataRef } = await calcularFaltantes(supabase);
  if (!dataRef) return { ok: false, erro: "Não há assembleia de referência na leitura." };
  if (aguardar) {
    const { error } = await supabase.from("importacao_faltante").upsert(grupos.map((g) => ({ grupo_numero: g, decisao: "aguardando_pdf", data_ref: dataRef, decidido_por: email, decidido_em: new Date().toISOString() })), { onConflict: "grupo_numero" });
    if (error) return { ok: false, erro: "Não foi possível registrar." };
  } else {
    const { error } = await supabase.from("importacao_faltante").delete().in("grupo_numero", grupos);
    if (error) return { ok: false, erro: "Não foi possível desfazer." };
  }
  revalidatePath("/importar");
  return { ok: true };
}

/** Salto automático: o grupo sem PDF ganha a assembleia seguinte, com todo o resto igual à versão anterior. */
export async function aplicarSaltos(grupos: number[]): Promise<{ ok: true; aplicados: number; falhas: { grupo: number; motivo: string }[] } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  // só entra quem realmente ainda falta (a lista é recalculada aqui, não vem da tela)
  const { dataRef, faltantes } = await calcularFaltantes(supabase);
  if (!dataRef) return { ok: false, erro: "Não há assembleia de referência na leitura." };
  const permitidos = new Set(faltantes.map((f) => f.numero));
  const estados = await carregarEstados(supabase, grupos.filter((g) => permitidos.has(g)));
  let aplicados = 0;
  const falhas: { grupo: number; motivo: string }[] = [];
  for (const g of grupos) {
    const estado = estados.get(g);
    if (!permitidos.has(g) || !estado?.grupo) {
      falhas.push({ grupo: g, motivo: "o grupo não está mais na lista de faltantes" });
      continue;
    }
    const { _nova, _de, _prazoCota, ...payload } = montarSalto(estado, dataRef, email);
    const { error } = await supabase.rpc("aplicar_importacao", { p: payload });
    if (error) {
      falhas.push({ grupo: g, motivo: error.message });
      continue;
    }
    await supabase.from("importacao_item").insert({
      hash_sha256: payload.hash,
      arquivo: payload.arquivo,
      familia: String(payload.grupo.familia),
      grupo_numero: g,
      assembleia_numero: _nova,
      situacao: "aplicado",
      tipo: "nova_assembleia",
      motivo: `Salto automático da ${_de}ª para a ${_nova}ª assembleia (prazo da cota ${_prazoCota}): sem PDF específico, dados iguais aos da ${_de}ª.`,
      lido_por: email,
    });
    await supabase.from("importacao_faltante").delete().eq("grupo_numero", g);
    aplicados++;
  }
  if (aplicados > 0) await refazerTodasAsListas(supabase); // a lista de grupos só muda aqui
  revalidatePath("/importar");
  revalidatePath("/grupos");
  return { ok: true, aplicados, falhas };
}

// ---------------------------------------------------------------- aplicar na base

type ItemLinha = { id: number; hash_sha256: string; arquivo: string; grupo_numero: number; assembleia_numero: number; leitura: Leitura; situacao: string; tipo: string };

/** Aplica um item cujas diferenças já foram todas decididas: confere se a base não mudou desde a leitura e grava. */
async function aplicarUm(supabase: Awaited<ReturnType<typeof createClient>>, item: ItemLinha, email: string): Promise<{ erro: string } | { rejeitado: boolean }> {
  const { data: difs } = await supabase.from("importacao_diferenca").select("*").eq("item_id", item.id);
  const lista = (difs ?? []) as (Diferenca & { decisao: string; valor_final: unknown })[];
  if (lista.some((d) => d.decisao === "pendente")) return { erro: "ainda há diferenças sem decisão" };

  const estados = await carregarEstados(supabase, [item.grupo_numero]);
  const estado = estados.get(item.grupo_numero) ?? { grupo: null, versoes: [] };
  const c = classificar(item.leitura, estado);
  const novas = comparar(item.leitura, estado, c);
  const guardadas = new Map(lista.map((d) => [chave(d), d]));
  const mudou =
    novas.length !== lista.length ||
    novas.some((n) => {
      const g = guardadas.get(chave(n));
      return !g || canon(g.valor_atual) !== canon(n.valor_atual) || canon(g.valor_novo) !== canon(n.valor_novo);
    });
  if (mudou || c.tipo === "anterior") return { erro: "a base mudou desde a leitura; leia o PDF de novo" };

  if (c.tipo === "grupo_novo" && lista[0]?.decisao === "rejeitada") {
    await supabase.from("importacao_item").update({ situacao: "rejeitado", motivo: "Grupo novo rejeitado" }).eq("id", item.id);
    return { rejeitado: true };
  }
  const decididas = lista.map((d) => ({ ...d, decisao: d.decisao as Decisao })) as Decidida[];
  const final = montarFinal(item.leitura, estado, c, decididas, email);
  const { error } = await supabase.rpc("aplicar_importacao", { p: final });
  if (error) return { erro: error.message };
  await supabase.from("importacao_item").update({ situacao: "aplicado", motivo: null }).eq("id", item.id);
  return { rejeitado: false };
}

export async function aplicarItens(ids: number[]): Promise<{ ok: true; aplicados: number; falhas: { arquivo: string; motivo: string }[] } | Falha> {
  const email = await quem();
  if (!email) return NEGADO;
  const supabase = await createClient();
  const { data } = await supabase.from("importacao_item").select("id, hash_sha256, arquivo, grupo_numero, assembleia_numero, leitura, situacao, tipo").in("id", ids).eq("situacao", "pendente");
  let aplicados = 0;
  const falhas: { arquivo: string; motivo: string }[] = [];
  // em ordem de assembleia: se o mesmo grupo vier com duas assembleias, a mais antiga entra primeiro
  const itens = ((data ?? []) as ItemLinha[]).sort((a, b) => a.grupo_numero - b.grupo_numero || a.assembleia_numero - b.assembleia_numero);
  for (const item of itens) {
    const r = await aplicarUm(supabase, item, email);
    if ("erro" in r) falhas.push({ arquivo: item.arquivo, motivo: r.erro });
    else if (!r.rejeitado) aplicados++;
  }
  if (aplicados > 0) await refazerTodasAsListas(supabase); // a lista de grupos só muda aqui
  revalidatePath("/importar");
  revalidatePath("/grupos");
  return { ok: true, aplicados, falhas };
}
