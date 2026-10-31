import { canon } from "./canon";
import type { Faixa, Leitura, Modalidade } from "./tipos";

// Compara o que veio de um PDF com o que está na base e lista cada diferença (que o administrador aceita, rejeita ou edita).

export const TIPO_PARCELA: Record<number, string> = { 100: "NORMAL", 85: "RED_85", 70: "RED_70", 55: "RED_55", 50: "RED_50" };

export type GrupoBase = {
  numero: number;
  familia: string;
  prazo_grupo_meses: number;
  participantes: number | null;
  taxa_adm_total: number | string | null;
  fundo_reserva: number | string | null;
  indice: string | null;
  mes_reajuste: number | null;
  primeira_correcao: string | null;
  dia_vencimento: number | null;
  /** veículos: parcela mínima após a contemplação, % da categoria */
  parcela_minima_pct: number | string | null;
};

/** Plano reduzido em duas fases de uma versão (veículos). */
export type PlanoFaseBase = { tipo: string; fase1_pct: number; fase1_parcelas: number; fase2_parcelas: number };

export type VersaoBase = {
  assembleia_numero: number;
  data_assembleia: string | null;
  prazo_cota_meses: number;
  creditos: (number | string)[];
  observacoes: string | null;
  pagamento_com_furo: boolean | null;
  tipos_parcela: string[];
  planos_fase: PlanoFaseBase[];
  modalidades: Record<string, Modalidade>;
  faixas: Faixa[];
};

/** O que a base já tem do grupo: o grupo e todas as versões (assembleias) com o conteúdo. */
export type EstadoGrupo = { grupo: GrupoBase | null; versoes: VersaoBase[] };

export type Tipo = "grupo_novo" | "nova_assembleia" | "mesma_assembleia" | "anterior";

export type Diferenca = {
  escopo: "grupo" | "versao" | "creditos" | "tipos_parcela" | "modalidade" | "sequencia";
  chave: string;
  campo: string;
  rotulo: string;
  valor_atual: unknown;
  valor_novo: unknown;
};

export type Classificacao = { tipo: Tipo; base: VersaoBase | null };

export function classificar(l: Leitura, e: EstadoGrupo): Classificacao {
  if (!e.grupo || !e.versoes.length) return { tipo: "grupo_novo", base: null };
  const igual = e.versoes.find((v) => v.assembleia_numero === l.assembleia);
  if (igual) return { tipo: "mesma_assembleia", base: igual };
  const vigente = e.versoes.reduce((a, b) => (b.assembleia_numero > a.assembleia_numero ? b : a));
  if (l.assembleia > vigente.assembleia_numero) return { tipo: "nova_assembleia", base: vigente };
  return { tipo: "anterior", base: null };
}

// veículos: linear (NORMAL) e, quando há, o plano reduzido pelo nome (Plano 50, Clearance…); imóveis: um tipo por % de parcela
export const tiposParcelaDe = (l: Leitura): string[] =>
  l.plano_reduzido !== undefined ? ["NORMAL", ...(l.plano_reduzido ? [l.plano_reduzido.tipo] : [])] : l.planos.DILUIDA.map((p) => TIPO_PARCELA[p]).filter(Boolean);

/** Planos em duas fases da leitura (veículos), no formato da base. */
export const planosFaseDe = (l: Leitura): PlanoFaseBase[] => {
  const p = l.plano_reduzido;
  return p && p.fase1_pct !== null && p.fase1_parcelas !== null && p.fase2_parcelas !== null
    ? [{ tipo: p.tipo, fase1_pct: p.fase1_pct, fase1_parcelas: p.fase1_parcelas, fase2_parcelas: p.fase2_parcelas }]
    : [];
};

const n = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
const mesmo = (a: unknown, b: unknown) => {
  const x = typeof a === "string" && a !== "" && !Number.isNaN(Number(a)) ? Number(a) : a;
  const y = typeof b === "string" && b !== "" && !Number.isNaN(Number(b)) ? Number(b) : b;
  if (typeof x === "number" && typeof y === "number") return Math.abs(x - y) < 1e-6;
  return (x ?? null) === (y ?? null);
};
const lista = (v: (number | string)[]) => v.map((x) => Math.round(Number(x) * 100) / 100).sort((a, b) => b - a);
const mesmaLista = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => mesmo(x, b[i]));

const CAMPOS_GRUPO: { campo: keyof GrupoBase; rotulo: string; leitura: (l: Leitura) => unknown }[] = [
  { campo: "prazo_grupo_meses", rotulo: "Prazo do grupo (meses)", leitura: (l) => l.prazo_grupo },
  { campo: "participantes", rotulo: "Número de participantes", leitura: (l) => l.participantes },
  { campo: "taxa_adm_total", rotulo: "Taxa de administração (%)", leitura: (l) => l.taxa_adm },
  { campo: "fundo_reserva", rotulo: "Fundo de reserva (%)", leitura: (l) => l.fundo_reserva },
  { campo: "indice", rotulo: "Índice de correção", leitura: (l) => l.indice },
  { campo: "mes_reajuste", rotulo: "Mês do reajuste", leitura: (l) => l.mes_reajuste },
  { campo: "primeira_correcao", rotulo: "1ª correção", leitura: (l) => l.primeira_correcao },
  { campo: "dia_vencimento", rotulo: "Dia de vencimento", leitura: (l) => l.vencimento },
  { campo: "parcela_minima_pct", rotulo: "Parcela mínima (% da categoria)", leitura: (l) => l.parcela_minima_pct },
];

const CAMPOS_MODALIDADE: { campo: keyof Modalidade; rotulo: string; vazioConta: boolean }[] = [
  { campo: "max", rotulo: "máx. de parcelas do lance", vazioConta: false },
  // o embutido é sempre decidido pelo PDF: vazio = sem embutido (ou sem limite naquele critério)
  { campo: "emb_parc", rotulo: "embutido: máx. de parcelas", vazioConta: true },
  { campo: "emb_pct", rotulo: "embutido: % do lance", vazioConta: true },
  { campo: "a_partir", rotulo: "a partir da assembleia da cota", vazioConta: false },
  { campo: "req", rotulo: "requisitos", vazioConta: false },
  // veículos: lances em % da categoria e a base do embutido
  { campo: "lance_pct", rotulo: "lance fixo (% da categoria)", vazioConta: false },
  { campo: "max_lance_pct", rotulo: "teto do lance (% da categoria)", vazioConta: false },
  { campo: "emb_base", rotulo: "embutido: base (lance ou categoria)", vazioConta: false },
];

// o que a base e a leitura trazem de cada campo (sem base de embutido, vale "lance", como nos imóveis)
const valorDe = (m: Modalidade, campo: keyof Modalidade) => (campo === "emb_base" ? (m.emb_base ?? "lance") : (m[campo] ?? null));

const NOME_MODALIDADE: Record<string, string> = { SOR: "Sorteio", LIV: "Lance livre", LIM: "Lance limitado", FIX: "Lance fixo", F40: "Lance fixo 40%", F25: "Lance fixo 25%", FID: "Lance fidelidade" };
export const nomeModalidade = (t: string) => NOME_MODALIDADE[t] ?? t;

export function comparar(l: Leitura, e: EstadoGrupo, c: Classificacao): Diferenca[] {
  if (c.tipo === "grupo_novo") {
    return [{ escopo: "grupo", chave: "", campo: "*", rotulo: `Grupo ${l.numero} novo (${l.assembleia}ª assembleia)`, valor_atual: null, valor_novo: resumoGrupoNovo(l) }];
  }
  if (c.tipo === "anterior" || !c.base || !e.grupo) return [];
  const d: Diferenca[] = [];
  const g = e.grupo;

  for (const f of CAMPOS_GRUPO) {
    const novo = f.leitura(l);
    if (novo === null || novo === undefined) continue; // o PDF não informa: mantém o que a base tem
    if (!mesmo(g[f.campo], novo)) d.push({ escopo: "grupo", chave: "", campo: f.campo, rotulo: f.rotulo, valor_atual: g[f.campo] ?? null, valor_novo: novo });
  }

  const v = c.base;
  if (c.tipo === "mesma_assembleia") {
    if (!mesmo(v.data_assembleia, l.data_assembleia)) d.push({ escopo: "versao", chave: "", campo: "data_assembleia", rotulo: "Data da assembleia", valor_atual: v.data_assembleia, valor_novo: l.data_assembleia });
    if (!mesmo(v.prazo_cota_meses, l.prazo_cota)) d.push({ escopo: "versao", chave: "", campo: "prazo_cota", rotulo: "Prazo da cota (meses)", valor_atual: v.prazo_cota_meses, valor_novo: l.prazo_cota });
  }
  if (l.observacoes !== null && (v.observacoes ?? null) !== l.observacoes)
    d.push({ escopo: "versao", chave: "", campo: "observacoes", rotulo: "Observações", valor_atual: v.observacoes, valor_novo: l.observacoes });

  const atuais = lista(v.creditos);
  const novos = lista(l.creditos.map((x) => x.credito));
  if (!mesmaLista(atuais, novos)) d.push({ escopo: "creditos", chave: "", campo: "creditos", rotulo: "Créditos", valor_atual: atuais, valor_novo: novos });

  const tNovos = [...tiposParcelaDe(l)].sort();
  const tAtuais = [...v.tipos_parcela].sort();
  if (!mesmaLista(tAtuais, tNovos)) d.push({ escopo: "tipos_parcela", chave: "", campo: "tipos_parcela", rotulo: "Tipos de parcela", valor_atual: tAtuais, valor_novo: tNovos });

  // veículos: plano reduzido em duas fases (% da fase 1 e parcelas de cada fase); só se compara quando o leitor é o de veículos
  if (l.plano_reduzido !== undefined) {
    const pNovos = planosFaseDe(l);
    const pAtuais = [...v.planos_fase].sort((x, y) => x.tipo.localeCompare(y.tipo));
    if (canon(pAtuais) !== canon(pNovos)) d.push({ escopo: "tipos_parcela", chave: "", campo: "planos_fase", rotulo: "Plano reduzido em duas fases", valor_atual: pAtuais, valor_novo: pNovos });
  }

  for (const t of new Set([...Object.keys(v.modalidades), ...Object.keys(l.modalidades)])) {
    const a = v.modalidades[t];
    const b = l.modalidades[t];
    if (!a || !b) {
      d.push({ escopo: "modalidade", chave: t, campo: "*", rotulo: `${nomeModalidade(t)}: ${b ? "passa a existir" : "deixa de existir"}`, valor_atual: a ?? null, valor_novo: b ?? null });
      continue;
    }
    for (const f of CAMPOS_MODALIDADE) {
      // campo vazio no PDF não apaga o que a base tem (exceto o embutido, que o PDF sempre define)
      if (!f.vazioConta && valorDe(b, f.campo) === null) continue;
      if (!mesmo(valorDe(a, f.campo), valorDe(b, f.campo))) d.push({ escopo: "modalidade", chave: t, campo: f.campo, rotulo: `${nomeModalidade(t)}: ${f.rotulo}`, valor_atual: valorDe(a, f.campo), valor_novo: valorDe(b, f.campo) });
    }
  }

  const fa = new Map(v.faixas.map((f) => [f.de, normalizarFaixa(f)]));
  const fb = new Map(l.faixas.map((f) => [f.de, normalizarFaixa(f)]));
  for (const de of [...new Set([...fa.keys(), ...fb.keys()])].sort((x, y) => x - y)) {
    const a = fa.get(de);
    const b = fb.get(de);
    if (canon(a) !== canon(b))
      d.push({ escopo: "sequencia", chave: String(de), campo: "*", rotulo: `Sequência de contemplação, a partir da ${de}ª assembleia`, valor_atual: a ?? null, valor_novo: b ?? null });
  }
  return d;
}

// Mesma ordem de chaves nos dois lados, para a comparação por texto não depender de quem montou o objeto.
const normalizarFaixa = (f: Faixa): Faixa => ({ de: f.de, ate: f.ate, itens: f.itens.map((i) => ({ qtd: i.qtd, tipo: i.tipo })), demais: f.demais ?? null, demais2: f.demais2 ?? null });

function resumoGrupoNovo(l: Leitura) {
  return {
    participantes: l.participantes,
    prazo_grupo: l.prazo_grupo,
    taxa_adm: l.taxa_adm,
    creditos: l.creditos.length,
    tipos_parcela: tiposParcelaDe(l),
    // em ordem fixa: o banco (jsonb) devolve as chaves de l.modalidades noutra ordem e a conferência antes de aplicar compara este resumo
    modalidades: ["SOR", "LIV", "LIM", "FIX", "F40", "F25", "FID"].filter((t) => t in l.modalidades),
  };
}

// ---------- estado final (base + decisões) -> JSON da função aplicar_importacao ----------

export type Decidida = Diferenca & { decisao: "aceita" | "rejeitada" | "editada"; valor_final: unknown };

/** Valor que vale depois da decisão: aceita = o do PDF; rejeitada = o que a base já tinha; editada = o que o administrador digitou. */
export const valorDecidido = (x: Pick<Decidida, "decisao" | "valor_atual" | "valor_novo" | "valor_final">) =>
  x.decisao === "aceita" ? x.valor_novo : x.decisao === "editada" ? x.valor_final : x.valor_atual;

export function montarFinal(l: Leitura, e: EstadoGrupo, c: Classificacao, decididas: Decidida[], aprovadoPor: string) {
  const auditoria = {
    grupo: l.numero, assembleia: l.assembleia, prazo_cota: l.prazo_cota, taxa_adm: l.taxa_adm, seguro_pct_mes: l.seguro_pct_mes, avisos: l.avisos,
    parcelas_diluidas: Object.fromEntries(l.creditos.map((x) => [x.credito.toFixed(2), Object.fromEntries(x.parcelas.filter((p) => p.plano === "DILUIDA").map((p) => [String(p.pct), p.primeira]))])),
  };
  const comum = { numero: Number(l.numero), assembleia: l.assembleia, arquivo: l.arquivo, hash: l.hash, aprovado_por: aprovadoPor, auditoria };
  const limpa = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));

  if (c.tipo === "grupo_novo") {
    return {
      ...comum,
      grupo: { familia: l.familia.replace("-", "_"), prazo_grupo_meses: l.prazo_grupo, participantes: l.participantes, taxa_adm_total: l.taxa_adm, fundo_reserva: l.fundo_reserva, indice: l.indice, mes_reajuste: l.mes_reajuste, primeira_correcao: l.primeira_correcao, dia_vencimento: l.vencimento, parcela_minima_pct: l.parcela_minima_pct },
      versao: {
        data_assembleia: l.data_assembleia, prazo_cota: l.prazo_cota, observacoes: l.observacoes, creditos: l.creditos.map((x) => x.credito), tipos_parcela: tiposParcelaDe(l),
        pagamento_com_furo: l.familia !== "veiculos", // grupo novo entra com pagamento com furo = sim (veículos não trabalham com furo)
        planos_fase: planosFaseDe(l),
        modalidades: Object.entries(l.modalidades).map(([tipo, m]) => limpa({ tipo, ...m })),
        faixas: l.faixas.map((f) => limpa({ de: f.de, ate: f.ate, demais: f.demais, demais2: f.demais2, itens: f.itens })),
      },
    };
  }

  const g = e.grupo!;
  const v = c.base!;
  const dec = new Map(decididas.map((x) => [`${x.escopo}|${x.chave}|${x.campo}`, x]));
  const val = (escopo: string, chave: string, campo: string, atual: unknown) => {
    const x = dec.get(`${escopo}|${chave}|${campo}`);
    return x ? valorDecidido(x) : atual;
  };

  const grupo = {
    familia: g.familia,
    prazo_grupo_meses: val("grupo", "", "prazo_grupo_meses", g.prazo_grupo_meses),
    participantes: val("grupo", "", "participantes", g.participantes),
    taxa_adm_total: val("grupo", "", "taxa_adm_total", g.taxa_adm_total),
    fundo_reserva: val("grupo", "", "fundo_reserva", g.fundo_reserva),
    indice: val("grupo", "", "indice", g.indice),
    mes_reajuste: val("grupo", "", "mes_reajuste", g.mes_reajuste),
    primeira_correcao: val("grupo", "", "primeira_correcao", g.primeira_correcao),
    dia_vencimento: val("grupo", "", "dia_vencimento", g.dia_vencimento),
    parcela_minima_pct: val("grupo", "", "parcela_minima_pct", g.parcela_minima_pct),
  };

  const mods: Record<string, Modalidade> = {};
  for (const t of new Set([...Object.keys(v.modalidades), ...Object.keys(l.modalidades)])) {
    const existencia = dec.get(`modalidade|${t}|*`);
    if (existencia) {
      const m = valorDecidido(existencia) as Modalidade | null;
      if (m) mods[t] = { ...m };
      continue;
    }
    const base = v.modalidades[t];
    if (!base) continue;
    const m = { ...base } as Record<string, unknown>;
    for (const f of CAMPOS_MODALIDADE) m[f.campo] = val("modalidade", t, f.campo, base[f.campo]);
    mods[t] = m as unknown as Modalidade;
  }

  const faixas = new Map(v.faixas.map((f) => [f.de, f as Faixa | null]));
  for (const x of decididas) if (x.escopo === "sequencia") faixas.set(Number(x.chave), valorDecidido(x) as Faixa | null);

  return {
    ...comum,
    grupo,
    versao: {
      data_assembleia: c.tipo === "mesma_assembleia" ? val("versao", "", "data_assembleia", v.data_assembleia) : l.data_assembleia,
      prazo_cota: c.tipo === "mesma_assembleia" ? val("versao", "", "prazo_cota", v.prazo_cota_meses) : l.prazo_cota,
      observacoes: val("versao", "", "observacoes", v.observacoes),
      creditos: val("creditos", "", "creditos", lista(v.creditos)),
      tipos_parcela: val("tipos_parcela", "", "tipos_parcela", v.tipos_parcela),
      planos_fase: val("tipos_parcela", "", "planos_fase", v.planos_fase),
      pagamento_com_furo: v.pagamento_com_furo ?? false,
      modalidades: Object.entries(mods).map(([tipo, m]) => limpa({ tipo, ...m })),
      faixas: [...faixas.values()].filter((f): f is Faixa => !!f).sort((a, b) => a.de - b.de).map((f) => limpa({ de: f.de, ate: f.ate, demais: f.demais, demais2: f.demais2, itens: f.itens })),
    },
  };
}

export const numeroOuNulo = n;
