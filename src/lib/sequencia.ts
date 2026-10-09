// Sequência de contemplação de um grupo, numa linha só.
//
// O banco guarda faixas de assembleias (grupo_sequencia_faixa) com itens (grupo_sequencia).
// Nos grupos lidos até hoje, as faixas só diferem em três coisas: quantos sorteios (SOR) há,
// o Sorteio Cancelada (CAN, sempre com a mesma quantidade do SOR) e a entrada do fidelidade (FID).
// Este módulo transforma as faixas num modelo simples (sorteios por mês + ordem + "demais") e de volta.
export const LIMITE_ORDEM = 25;
export const SORTEIO = "SOR";
export const CANCELADA = "CAN"; // não aparece na linha
export const FIDELIDADE = "FID";

export type Item = { codigo: string; qtd: number };
export type Faixa = { de: number; ate: number; itens: Item[]; demais: string | null };

export type ModeloSequencia = {
  /** false = as faixas diferem por outro motivo além de SOR/CAN/FID (regra específica) */
  simples: boolean;
  /** quantos sorteios a partir de cada mês (o primeiro sempre começa no mês 1) */
  sorteios: { de: number; qtd: number }[];
  /** posições depois dos sorteios, uma por contemplação, sem SOR/CAN */
  ordem: string[];
  /** tipo das demais contemplações; nulo = repete a ordem, sem o sorteio */
  demais: string | null;
  /** último mês da sequência (prazo do grupo) */
  prazo: number;
};

const soma = (itens: Item[], codigo: string) => itens.filter((i) => i.codigo === codigo).reduce((s, i) => s + i.qtd, 0);
const expandir = (itens: Item[]) => itens.flatMap((i) => Array<string>(Math.max(1, i.qtd)).fill(i.codigo));
const assinatura = (f: Faixa) =>
  JSON.stringify([f.itens.filter((i) => ![SORTEIO, CANCELADA, FIDELIDADE].includes(i.codigo)).map((i) => [i.codigo, i.qtd]), f.demais]);

export function modelar(faixas: Faixa[]): ModeloSequencia | null {
  if (!faixas.length) return null;
  const fs = [...faixas].sort((a, b) => a.de - b.de);
  const ultima = fs[fs.length - 1];
  const comFid = fs.find((f) => soma(f.itens, FIDELIDADE) > 0) ?? null;

  const sorteios: ModeloSequencia["sorteios"] = [];
  for (const f of fs) {
    const qtd = soma(f.itens, SORTEIO);
    if (!sorteios.length || sorteios[sorteios.length - 1].qtd !== qtd) sorteios.push({ de: f.de, qtd });
  }
  sorteios[0].de = 1;

  const base = comFid && comFid.de >= ultima.de ? comFid : ultima;
  return {
    simples: fs.every((f) => assinatura(f) === assinatura(ultima)),
    sorteios,
    ordem: expandir(base.itens).filter((c) => c !== SORTEIO && c !== CANCELADA),
    demais: ultima.demais,
    prazo: ultima.ate,
  };
}

// Completa a ordem até o limite: se há tipo para as demais contemplações, repete esse tipo;
// se a regra é "mesma ordem", repete a ordem sem o sorteio. Sorteio Cancelada nunca aparece.
export function montarOrdem(itens: Item[], demais: string | null, limite = LIMITE_ORDEM): string[] {
  const base = expandir(itens).filter((c) => c !== CANCELADA);
  const ordem = base.slice(0, limite);
  if (ordem.length >= limite) return ordem;

  if (demais && demais !== CANCELADA) {
    while (ordem.length < limite) ordem.push(demais);
    return ordem;
  }

  const ciclo = base.filter((c) => c !== SORTEIO);
  if (!ciclo.length) return ordem;
  for (let i = 0; ordem.length < limite; i++) ordem.push(ciclo[i % ciclo.length]);
  return ordem;
}

// A linha mostrada: o máximo de sorteios + a ordem (com fidelidade) + as demais, até o limite.
export function linhaDoModelo(m: ModeloSequencia, limite = LIMITE_ORDEM): string[] {
  const maxSor = Math.max(0, ...m.sorteios.map((s) => s.qtd));
  const itens: Item[] = [...(maxSor > 0 ? [{ codigo: SORTEIO, qtd: maxSor }] : []), ...m.ordem.map((codigo) => ({ codigo, qtd: 1 }))];
  return montarOrdem(itens, m.demais, limite);
}

export type Posicao = { codigo: string; desde: number | null };

// A linha mostrada, com o mês a partir do qual cada posição passa a existir (nulo = desde o início):
// o 2º e o 3º sorteio entram quando a quantidade de sorteios sobe; o FID entra no mês em que o fidelidade libera.
export function linhaDetalhada(m: ModeloSequencia, fidelidadeMeses: number | null, limite = LIMITE_ORDEM): Posicao[] {
  const maxSor = Math.max(0, ...m.sorteios.map((s) => s.qtd));
  const desdeSorteio = (k: number) => {
    const de = m.sorteios.find((s) => s.qtd >= k)?.de ?? 1;
    return de > 1 ? de : null;
  };
  let sorVisto = 0;
  return linhaDoModelo(m, limite).map((codigo) => {
    if (codigo === SORTEIO) return { codigo, desde: desdeSorteio(++sorVisto <= maxSor ? sorVisto : maxSor) };
    if (codigo === FIDELIDADE) return { codigo, desde: fidelidadeMeses && fidelidadeMeses > 1 ? fidelidadeMeses : null };
    return { codigo, desde: null };
  });
}

export type Edicao = {
  sorteios: { de: number; qtd: number }[];
  ordem: string[];
  demais: string | null;
  /** mês em que o fidelidade libera; é também o mês em que o FID passa a constar na ordem */
  fidelidadeMeses: number | null;
};

// Valida a edição; devolve a mensagem de erro ou null.
export function validarEdicao(e: Edicao, codigosValidos: Set<string>): string | null {
  if (!e.sorteios.length || e.sorteios[0].de !== 1) return "A primeira linha de sorteios começa no mês 1.";
  for (let i = 0; i < e.sorteios.length; i++) {
    const s = e.sorteios[i];
    if (!Number.isInteger(s.qtd) || s.qtd < 0 || s.qtd > 9) return "Quantidade de sorteios: de 0 a 9.";
    if (!Number.isInteger(s.de) || s.de < 1) return "Mês inválido nos sorteios.";
    if (i > 0 && s.de <= e.sorteios[i - 1].de) return "Os meses dos sorteios precisam estar em ordem crescente.";
  }
  if (!e.ordem.length || e.ordem.length > LIMITE_ORDEM - 1) return `A ordem tem de 1 a ${LIMITE_ORDEM - 1} posições.`;
  const livres = (c: string) => codigosValidos.has(c) && c !== SORTEIO && c !== CANCELADA;
  if (!e.ordem.every(livres)) return "Modalidade inválida na ordem (SOR e CAN não entram aqui).";
  if (e.demais !== null && !livres(e.demais)) return "Modalidade inválida nas demais contemplações.";
  if (e.fidelidadeMeses !== null && (!Number.isInteger(e.fidelidadeMeses) || e.fidelidadeMeses < 2))
    return "Mês de liberação do fidelidade: número maior que 1.";
  if (e.ordem.includes(FIDELIDADE) && !e.fidelidadeMeses)
    return "A ordem tem FID: informe o mês em que o fidelidade libera.";
  return null;
}

// Gera as faixas (uma por trecho de meses em que sorteios/fidelidade são iguais) a partir da edição.
export function gerarFaixas(e: Edicao, prazo: number): Faixa[] {
  const fidDe = e.fidelidadeMeses;
  const cortes = [...new Set([...e.sorteios.map((s) => s.de), ...(fidDe && fidDe > 1 ? [fidDe] : [])])].sort((a, b) => a - b);
  return cortes
    .filter((de) => de <= prazo)
    .map((de, i, arr) => {
      const qtd = [...e.sorteios].reverse().find((s) => s.de <= de)?.qtd ?? 0;
      const fidAtivo = !!fidDe && de >= fidDe;
      const ordem = e.ordem.filter((c) => fidAtivo || c !== FIDELIDADE);
      const itens: Item[] = [];
      const poe = (codigo: string, n: number) => {
        const ult = itens[itens.length - 1];
        if (ult && ult.codigo === codigo) ult.qtd += n;
        else itens.push({ codigo, qtd: n });
      };
      if (qtd > 0) {
        poe(SORTEIO, qtd);
        poe(CANCELADA, qtd);
      }
      for (const c of ordem) poe(c, 1);
      return { de, ate: i + 1 < arr.length ? arr[i + 1] - 1 : prazo, itens, demais: e.demais };
    });
}
