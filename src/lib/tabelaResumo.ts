// Tabela Resumo (Imóveis e Veículos): uma linha por grupo, no formato da planilha "Tabelas Resumo".
// Este módulo só monta os dados e o estilo de cada célula; o Excel e o PDF só desenham o que ele devolve.
import { linhaDoModelo, modelar, montarOrdem, type Faixa } from "./sequencia";

export type ModalidadeEntrada = {
  tipo: string;
  max: number | null; // máximo de parcelas do lance; nulo = sem limite
  emb_parc: number | null; // máximo de parcelas do lance que podem ser embutidas
  emb_pct: number | null; // % do lance que pode ser embutido
  // veículos: lance em % da categoria
  lance_pct?: number | null; // lance fixo (F25 = 25, F40 = 40)
  max_lance_pct?: number | null; // teto do lance livre/fidelidade
  emb_base?: "lance" | "categoria"; // base do emb_pct
};

export type FamiliaResumo = "imoveis" | "veiculos";

export type GrupoEntrada = {
  numero: number;
  prazo_grupo: number;
  participantes: number | null;
  taxa: number | null; // em %, ex.: 24
  prazo_cota: number; // prazo atual (meses que faltam)
  creditos: number[];
  furo: boolean;
  fid_meses: number | null; // mês em que o FID entra na sequência (parcela de liberação + 1)
  pct_parcelas: number[]; // % de cada tipo de parcela oferecido
  modalidades: ModalidadeEntrada[];
  faixas: Faixa[];
  /** veículos: parcelas da fase 1 do plano reduzido em duas fases (nulo = sem plano em fases) */
  fase1_parcelas?: number | null;
};

export type Mes = { ano: number; mes: number };

export type Estilo = { cor?: string; negrito?: boolean };
export type CelulaResumo = {
  valor: string | number | Date | null;
  texto: string; // como aparece (formato pt-BR)
  fmt?: string; // formato do Excel
  alinh: "left" | "center" | "right";
  span?: number; // colunas ocupadas (a partir desta)
} & Estilo;

export const POSICOES = 15; // contemplações mostradas na ordem
export const COLUNAS_CREDITO = 11;

// larguras das colunas A..AR, em caracteres do Excel (as mesmas do modelo)
export const LARGURAS: number[] = [
  6.28515625, 5, 6, 4.7109375, 4.7109375, 4.7109375, 3, 4.5703125, 6.42578125,
  4, ...Array<number>(14).fill(3.7109375),
  4.7109375, 5.7109375, 4.7109375, 4.7109375, 4.7109375, 4.7109375, 4.7109375, 4.7109375, 6,
  ...Array<number>(COLUNAS_CREDITO).fill(5.5703125),
];
export const NCOLUNAS = LARGURAS.length; // 44

// PDF: quantos grupos cabem em cada página. 113 = os grupos até o 12172, onde a página 1 termina (padrão; o usuário pode mudar).
export const GRUPOS_POR_PAGINA = 113;
export const LIMITE_GRUPOS_POR_PAGINA = 500;
export function lerPorPagina(texto: string | null): number | null {
  if (texto === null || !/^\d{1,3}$/.test(texto)) return null;
  const n = Number(texto);
  return n >= 1 && n <= LIMITE_GRUPOS_POR_PAGINA ? n : null;
}

export const VERMELHO = "FF0000";
export const CINZA_ZEBRA = "D9D9D9";
const AZUL = "0000FF";
const VERDE = "00B050";
const LARANJA = "ED7D31";
const ROSA = "FF66FF";
const BORDO = "9C0006";
// cores das modalidades na ordem de contemplação (as do modelo)
// (veículos: f40 usa a cor do limitado e f25 a do fixo)
const COR_SEQ: Record<string, string> = { sor: "70AD47", lim: LARANJA, fix: "4472C4", f40: LARANJA, f25: "4472C4", fid: ROSA, liv: "FF0000" };


// ---------- regras de cada coluna ----------

// "Qtd": máximo de parcelas do lance ("60P"); "*" = qualquer quantidade até o prazo; "não" = o grupo não tem a modalidade
function qtd(m: ModalidadeEntrada | undefined, prazo: number): string {
  if (!m) return "não";
  return m.max === null || m.max >= prazo ? "*" : `${m.max}P`;
}

// "Emb": fração do lance que pode ser embutida (1 = 100%), sempre em percentual, como no quadro Modalidades de contemplação
// de Grupos e Tabelas: o menor entre o % do lance e o limite em parcelas sobre o lance máximo (sem máximo, o prazo do grupo),
// arredondado para baixo. Sem regra de embutido, 0.
function emb(m: ModalidadeEntrada | undefined, prazo: number): number | null {
  if (!m) return null;
  if (m.emb_pct === null && m.emb_parc === null) return 0;
  const porPct = m.emb_pct === null ? 100 : Number(m.emb_pct);
  const porParcelas = m.emb_parc === null ? 100 : (100 * m.emb_parc) / (m.max ?? prazo);
  return Math.floor(Math.min(100, porPct, porParcelas)) / 100;
}

// Veículos, "Qtd": o lance fixo em % da categoria ("25%", "40%"); livre e fidelidade, o teto em % ("55%") ou "*" se não há teto.
function qtdVeiculo(m: ModalidadeEntrada | undefined, teto: number | null): string {
  if (!m) return "não";
  if (m.lance_pct != null) return `${Number(m.lance_pct)}%`;
  return teto === null ? "*" : `${teto}%`;
}

// Veículos, "Emb": fração do lance que pode ser embutida, no lance máximo (o fixo, o teto do livre ou, sem teto, 100% da categoria).
// "% da categoria" (ex.: até 25% da categoria) vira fração do lance; "% do lance" vale como está. Sem regra de embutido, 0.
function embVeiculo(m: ModalidadeEntrada | undefined, lanceMax: number): number | null {
  if (!m) return null;
  if (m.emb_pct === null) return 0;
  const pct = Number(m.emb_pct);
  const fracao = m.emb_base === "categoria" ? Math.min(100, (100 * pct) / lanceMax) : Math.min(100, pct);
  return Math.floor(fracao) / 100;
}

// Ordem de contemplação: o máximo de sorteios + a ordem do grupo, até POSICOES posições.
// Até 2 sorteios aparecem um a um ("sor sor"); a partir de 3 viram uma célula só ("sor3", "sor5").
export function ordemResumo(faixas: Faixa[]): string[] {
  const m = modelar(faixas);
  if (!m) return [];
  if (!m.simples) {
    const ult = [...faixas].sort((a, b) => a.de - b.de).at(-1);
    return ult ? montarOrdem(ult.itens, ult.demais, POSICOES, ult.demais2).map((c) => c.toLowerCase()) : [];
  }
  const maxSor = Math.max(0, ...m.sorteios.map((s) => s.qtd));
  const junta = maxSor >= 3;
  const linha = linhaDoModelo(m, POSICOES + (junta ? maxSor - 1 : 0));
  const final = junta ? [`SOR${maxSor}`, ...linha.slice(maxSor)] : linha;
  return final.slice(0, POSICOES).map((c) => c.toLowerCase());
}

export type LinhaResumo = {
  numero: number;
  tx: number | null;
  part: number | null;
  orig: number;
  atu: number;
  rod: number;
  fu: "S" | "N";
  /** o que a coluna Par mostra: o % da menor parcela (imóveis) ou, em veículos com plano em fases, as parcelas reduzidas */
  par: number | "?";
  /** o % da menor parcela oferecida, que define a cor (50/55 verde, 70 laranja) */
  parCor: number | "?";
  fim: Mes;
  ordem: string[];
  fix: { qtd: string; emb: number | string | null };
  lim: { qtd: string; emb: number | string | null };
  fid: { meses: number | "não" | "?"; qtd: string; emb: number | string | null };
  liv: { qtd: string; emb: number | string | null };
  creditos: number[]; // em mil, do menor para o maior
};

// os créditos cabem em COLUNAS_CREDITO colunas: com mais valores, entram os de posições igualmente espaçadas (sempre o menor e o maior)
function creditosEmMil(creditos: number[]): number[] {
  const o = [...creditos].sort((a, b) => a - b).map((c) => c / 1000);
  if (o.length <= COLUNAS_CREDITO) return o;
  return Array.from({ length: COLUNAS_CREDITO }, (_, i) => o[Math.round((i * (o.length - 1)) / (COLUNAS_CREDITO - 1))]);
}

export function montarLinhas(grupos: GrupoEntrada[], base: Mes, familia: FamiliaResumo = "imoveis"): LinhaResumo[] {
  const veic = familia === "veiculos";
  return [...grupos]
    .sort((a, b) => a.numero - b.numero)
    .map((g) => {
      const mods = new Map(g.modalidades.map((m) => [m.tipo, m]));
      // veículos: o fidelidade segue o teto do livre; os dois fixos ocupam as colunas FIXO (25%) e LIMITADO/FIXO 40% (40%)
      const tetoLivre = mods.get("LIV")?.max_lance_pct ?? null;
      const teto = (m: ModalidadeEntrada | undefined) => (m?.max_lance_pct != null ? Number(m.max_lance_pct) : tetoLivre !== null ? Number(tetoLivre) : null);
      const mod = (t: string) =>
        veic
          ? (() => {
              const m = mods.get(t);
              const tt = t === "LIV" || t === "FID" ? teto(m) : null;
              const lanceMax = m?.lance_pct != null ? Number(m.lance_pct) : tt ?? 100;
              return { qtd: qtdVeiculo(m, tt), emb: embVeiculo(m, lanceMax) };
            })()
          : { qtd: qtd(mods.get(t), g.prazo_grupo), emb: emb(mods.get(t), g.prazo_grupo) };
      const total = base.ano * 12 + (base.mes - 1) + (g.prazo_cota - 1);
      const f = mods.get("FID");
      return {
        numero: g.numero,
        tx: g.taxa,
        part: g.participantes,
        orig: g.prazo_grupo,
        atu: g.prazo_cota,
        rod: g.prazo_grupo - g.prazo_cota,
        fu: g.furo ? "S" : "N",
        par: veic && g.fase1_parcelas ? g.fase1_parcelas : g.pct_parcelas.length ? Math.min(...g.pct_parcelas) : "?",
        parCor: g.pct_parcelas.length ? Math.min(...g.pct_parcelas) : "?",
        fim: { ano: Math.floor(total / 12), mes: (total % 12) + 1 },
        ordem: ordemResumo(g.faixas),
        fix: mod(veic ? "F25" : "FIX"),
        lim: mod(veic ? "F40" : "LIM"),
        fid: {
          // o banco guarda o mês em que o FID entra na sequência (37); aqui vale a parcela em que libera (36)
          meses: !f ? "não" : g.fid_meses ? g.fid_meses - 1 : "?",
          qtd: qtd(f, g.prazo_grupo),
          emb: emb(f, g.prazo_grupo),
        },
        liv: mod("LIV"),
        creditos: creditosEmMil(g.creditos),
      } satisfies LinhaResumo;
    });
}

// ---------- células (valor + estilo), na ordem das colunas A..AR ----------

const fmtNum = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: false });
const mm = (n: number) => String(n).padStart(2, "0");

function celulasEmb(v: number | string | null): Pick<CelulaResumo, "valor" | "texto" | "fmt"> {
  if (v === null) return { valor: null, texto: "" };
  if (typeof v === "string") return { valor: v, texto: v };
  return { valor: v, texto: `${Math.round(v * 100)}%`, fmt: "0%" };
}

export function celulasDaLinha(l: LinhaResumo): CelulaResumo[] {
  const azul: Estilo = { cor: AZUL, negrito: true };
  const corGrupo: Estilo = l.parCor === 70 ? { cor: LARANJA } : l.parCor === 50 || l.parCor === 55 ? { cor: VERDE, negrito: true } : l.parCor === "?" ? { cor: VERMELHO } : {};
  const corPart: Estilo =
    l.part === 3333 ? { cor: ROSA, negrito: true } : l.part === 5000 ? { cor: LARANJA, negrito: true } : l.part === 9999 ? { cor: BORDO, negrito: true } : {};
  const c = (valor: CelulaResumo["valor"], texto: string, alinh: CelulaResumo["alinh"], extra: Partial<CelulaResumo> = {}): CelulaResumo => ({
    valor,
    texto,
    alinh,
    ...extra,
  });

  const out: CelulaResumo[] = [
    c(l.numero, String(l.numero), "right", corGrupo),
    c(l.tx, l.tx === null ? "" : fmtNum(l.tx, 1), "right", { ...azul, fmt: "0.0" }),
    c(l.part, l.part === null ? "" : String(l.part), "right", corPart),
    c(l.orig, String(l.orig), "right", { ...azul, fmt: "#,##0" }),
    c(l.atu, String(l.atu), "right", { ...azul, fmt: "#,##0" }),
    c(l.rod, String(l.rod), "right", { ...azul, fmt: "#,##0" }),
    c(l.fu, l.fu, "center", l.fu === "S" ? { cor: VERDE, negrito: true } : {}),
    c(l.par, String(l.par), "center", l.par === "?" ? { cor: VERMELHO } : { ...corGrupo, fmt: "#,##0" }), // mesma cor do número do grupo
    c(new Date(Date.UTC(l.fim.ano, l.fim.mes - 1, 1)), `${mm(l.fim.mes)}/${mm(l.fim.ano % 100)}`, "center", { ...azul, fmt: "mm/yy" }),
  ];
  for (let i = 0; i < POSICOES; i++) {
    const cod = l.ordem[i] ?? "";
    out.push(c(cod || null, cod, "center", { negrito: true, cor: COR_SEQ[cod.slice(0, 3)] }));
  }
  const e = (m: { emb: number | string | null }) => ({ ...celulasEmb(m.emb), alinh: "center" as const });
  out.push(c(l.fix.qtd, l.fix.qtd, "center"), c(null, "", "center", e(l.fix)));
  out.push(c(l.lim.qtd, l.lim.qtd, "center"), c(null, "", "center", e(l.lim)));
  if (l.fid.meses === "não") {
    out.push(c("não", "não", "center", { span: 3 }), c(null, "", "center"), c(null, "", "center"));
  } else {
    out.push(c(l.fid.meses, String(l.fid.meses), "center"), c(l.fid.qtd, l.fid.qtd, "center"), c(null, "", "center", e(l.fid)));
  }
  out.push(c(l.liv.qtd, l.liv.qtd, "center"), c(null, "", "center", e(l.liv)));
  for (let i = 0; i < COLUNAS_CREDITO; i++) {
    const v = l.creditos[i];
    out.push(
      v === undefined
        ? c(null, "", "right")
        : c(v, String(Math.round(v)), "right", { ...azul, fmt: "0" }),
    );
  }
  return out;
}

// ---------- cabeçalho (linhas 1 e 2 da tabela), igual ao modelo ----------

export type CelulaCabecalho = {
  c0: number; // coluna inicial (0 = A)
  c1: number; // coluna final
  linha: 0 | 1;
  linhas: 1 | 2; // linhas ocupadas
  texto: string;
  alinh: "left" | "center" | "right";
  tamanho: number;
  negrito: boolean;
};

const h = (c0: number, c1: number, linha: 0 | 1, linhas: 1 | 2, texto: string, extra: Partial<CelulaCabecalho> = {}): CelulaCabecalho => ({
  c0,
  c1,
  linha,
  linhas,
  texto,
  alinh: "center",
  tamanho: 12,
  negrito: true,
  ...extra,
});

export const TITULO = "GRUPOS E COTAS IMÓVEIS";
export const TITULOS: Record<FamiliaResumo, string> = { imoveis: TITULO, veiculos: "GRUPOS E COTAS VEÍCULOS" };
export const NOME_ABA: Record<FamiliaResumo, string> = { imoveis: "Imóvel", veiculos: "Veículo" };
export const COLUNA_DATA = 40; // a data (mmm/aaaa) ocupa as colunas AO..AR; o título, A..AN

export const CABECALHO: CelulaCabecalho[] = [
  h(0, 0, 0, 2, "#", { alinh: "right", negrito: false }),
  h(1, 1, 0, 2, "Tx"),
  h(2, 2, 0, 2, "Part"),
  h(3, 5, 0, 1, "PRAZO"),
  h(3, 3, 1, 1, "Orig"),
  h(4, 4, 1, 1, "Atual"),
  h(5, 5, 1, 1, "Rodado"),
  h(6, 6, 0, 2, "Fu"),
  h(7, 7, 0, 2, "Par"),
  h(8, 8, 0, 2, "Fim"),
  h(9, 23, 0, 2, "Ordem Contemplação"),
  h(24, 25, 0, 1, "FIXO", { alinh: "left", tamanho: 14 }),
  h(24, 24, 1, 1, "Qtd"),
  h(25, 25, 1, 1, "Emb"),
  h(26, 27, 0, 1, "LIMITADO", { alinh: "left", tamanho: 14 }),
  h(26, 26, 1, 1, "Qtd"),
  h(27, 27, 1, 1, "Emb"),
  h(28, 30, 0, 1, "FIDELIDADE", { alinh: "left", tamanho: 14 }),
  h(28, 28, 1, 1, "Meses"),
  h(29, 29, 1, 1, "Qtd"),
  h(30, 30, 1, 1, "Em"),
  h(31, 32, 0, 1, "LIVRE", { alinh: "left", tamanho: 14 }),
  h(31, 31, 1, 1, "Qtd"),
  h(32, 32, 1, 1, "Emb"),
  h(33, 43, 0, 1, "Créditos (mil)"),
];

// divisórias verticais do corpo da tabela: coluna (0 = A) que tem linha à esquerda / à direita
export const LINHA_ESQUERDA = new Set([0, 24, 26, 28, 31]);
export const LINHA_DIREITA = new Set([8, 25, 27, 30, 32]); // I, Z, AB, AE, AG

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const rotuloMes = (m: Mes) => `${MESES[m.mes - 1]}/${m.ano}`;

// Mês de referência da Tabela Resumo (título e base do mês final: Fim = referência + prazo atual - 1).
// É escolhido na hora de exportar, no formato "AAAA-MM" (o do campo de mês do navegador).
export function lerMes(texto: string | null): Mes | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(texto ?? "");
  if (!m || Number(m[1]) < 2000 || Number(m[1]) > 2100) return null;
  return { ano: Number(m[1]), mes: Number(m[2]) };
}

// em veículos os dois lances fixos ocupam as colunas FIXO e LIMITADO
export const cabecalhoDa = (familia: FamiliaResumo): CelulaCabecalho[] =>
  familia === "imoveis" ? CABECALHO : CABECALHO.map((c) => (c.c0 === 24 && c.linha === 0 ? { ...c, texto: "FIXO 25%" } : c.c0 === 26 && c.linha === 0 ? { ...c, texto: "FIXO 40%" } : c));

export const nomeArquivo = (m: Mes, ext: "xlsx" | "pdf", familia: FamiliaResumo = "imoveis") => `tabela-resumo-${familia}-${m.ano}-${mm(m.mes)}.${ext}`;
