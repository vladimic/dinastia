import { LEITOR, type Faixa, type Leitura, type Linha, type LinhaCredito, type Modalidade, type Parcela } from "./tipos";

// Interpreta as linhas de texto (com posição) de um PDF de tabela de grupo da Ademicon.
// Porta do antigo scripts/importar_tabelas.py; o que muda é o texto de entrada (pdf.js em vez de pdftotext)
// e a leitura do cabeçalho do plano antecipado ("1% ANTECIPADO", "2% ANTECIPADO EM 4 PARCELAS").

export class ErroLeitura extends Error {}

const MESES: Record<string, number> = Object.fromEntries(
  ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"].map((m, i) => [m, i + 1]),
);
const FAMILIAS: Record<string, string> = {
  imóveis: "imoveis",
  imoveis: "imoveis",
  veículos: "veiculos",
  veiculos: "veiculos",
  serviços: "servicos",
  servicos: "servicos",
};
const LANCES = new Set(["LIV", "LIM", "FIX", "FID"]);
const L = "\\p{L}"; // letra (com acento)

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const dois = (n: number) => String(n).padStart(2, "0");
const MONEY = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;

function tipoPorNome(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("sorteio") && n.includes("cancel")) return "CAN";
  if (n.includes("sorteio")) return "SOR";
  if (n.includes("livre")) return "LIV";
  if (n.includes("limitado")) return "LIM";
  if (n.includes("fixo")) return "FIX";
  if (n.includes("fidelidade")) return "FID";
  throw new ErroLeitura(`modalidade desconhecida: ${nome}`);
}

export function interpretar(linhas: Linha[], arquivo: string, hash: string): Leitura {
  const erros: string[] = [];
  const avisos: string[] = [];
  const plano = linhas.map((l) => l.texto).join(" ").replace(/\s+/g, " ");

  const mc = plano.match(new RegExp(`Grupo (\\d+) - Consórcio de ((?:${L}| )+?)(?= \\d+ª Assembleia| Cod\\.| Grupo |$)`, "u"));
  if (!mc) throw new ErroLeitura("cabeçalho 'Grupo N - Consórcio de ...' não encontrado");
  const numero = mc[1];
  const famTxt = mc[2].trim().toLowerCase();
  const familia = FAMILIAS[famTxt] ?? "outros-bens";

  const ma = plano.match(new RegExp(`(\\d+)ª Assembleia de Contemplação - (\\d+) de (${L}+) de (\\d{4})`, "u"));
  if (!ma) throw new ErroLeitura("assembleia não encontrada");
  const assembleia = Number(ma[1]);
  const mesAss = MESES[ma[3].toLowerCase()];
  if (!mesAss) throw new ErroLeitura(`mês da assembleia desconhecido: ${ma[3]}`);
  const dataAssembleia = `${ma[4]}-${dois(mesAss)}-${dois(Number(ma[2]))}`;

  function pega<T>(rx: RegExp, conv: (x: string) => T, obrig: true): T;
  function pega<T>(rx: RegExp, conv: (x: string) => T, obrig: false): T | null;
  function pega<T>(rx: RegExp, conv: (x: string) => T, obrig: boolean): T | null {
    const r = plano.match(rx);
    if (!r) {
      if (obrig) throw new ErroLeitura(`campo não encontrado: ${rx.source}`);
      return null;
    }
    return conv(r[1]);
  }
  const id = <T,>(x: T) => x;

  const taxa = pega(/Taxa de Administração ([\d,]+)%/, num, true);
  const prazoCota = pega(/Prazo da Cota: (\d+) meses/, Number, true);
  const prazoGrupo = pega(/Prazo do Grupo: (\d+) meses/, Number, true);
  const participantes = pega(/Número de Participantes: (\d+)/, Number, true);
  const indice = pega(/Indice de Correção: ([A-Z-]+)/, id, true);
  const mesReaj = pega(new RegExp(`aplicado anualmente no mês de (${L}+)`, "u"), (s) => MESES[s.toLowerCase()] ?? null, false);
  const pc = plano.match(new RegExp(`1ª Correção (${L}+) (\\d{4})`, "u"));
  const primeiraCorrecao = pc && MESES[pc[1].toLowerCase()] ? `${pc[2]}-${dois(MESES[pc[1].toLowerCase()])}-01` : null;
  const vencimento = pega(/Vencimento todo o dia (\d+)/, Number, false);
  if (vencimento === null) avisos.push("dia de vencimento não informado na tabela");
  // fundo de reserva: só vale o que o PDF disser; sem menção, imóveis = 0% (regra do negócio) e as demais famílias ficam sem valor
  let fundoReserva = pega(/Fundo de Reserva:? ([\d,]+)\s*%/, num, false);
  if (fundoReserva === null && familia === "imoveis") fundoReserva = 0;
  const seg = plano.match(/Seguro Prestamista (opcional|obrigatório) até a Contemplação e após (obrigatório|opcional)/);
  const limite = pega(/não pode ultrapassar o limite de (.+?anos, \d+ meses e \d+ dias)/, id, false);

  // ---------------- tabela de créditos ----------------
  const iCod = linhas.findIndex((l) => l.itens[0]?.s.startsWith("Cod."));
  const iRef = linhas.findIndex((l) => l.itens[0]?.s.startsWith("Ref."));
  if (iCod < 0 || iRef < 0 || iRef < iCod) throw new ErroLeitura("cabeçalho da tabela de créditos não encontrado");
  const cab = linhas.slice(iCod, iRef);
  const iTopo = linhas.findIndex((l) => /ANTECIPADO/.test(l.texto));
  const textoTopo = iTopo >= 0 ? linhas[iTopo].texto : "";
  const ant = textoTopo.match(/(\d+)%\s*ANTECIPADO(?:\s+EM\s+(\d+)\s+PARCELAS?)?/i);
  const antecipado = { pct: ant ? Number(ant[1]) : 1, parcelas: ant?.[2] ? Number(ant[2]) : 1 };

  const xAntecip = Math.min(...cab.flatMap((l) => l.itens.filter((i) => /^\d+ Parcelas?$/.test(i.s)).map((i) => i.x))) - 3;
  if (!Number.isFinite(xAntecip)) throw new ErroLeitura("colunas do plano antecipado não encontradas");
  const pcts = cab.flatMap((l) => l.itens.flatMap((i) => (/^\d+%$/.test(i.s) ? [{ x: i.x, p: parseInt(i.s) }] : []))).sort((a, b) => a.x - b.x);
  const dil = pcts.filter((p) => p.x < xAntecip).map((p) => p.p);
  const antPcts = pcts.filter((p) => p.x >= xAntecip).map((p) => p.p);
  if (!dil.length || dil[0] !== 100) throw new ErroLeitura(`colunas de parcela diluída não reconhecidas: ${dil.join(",")}`);

  const creditos: LinhaCredito[] = [];
  for (const l of linhas.slice(iRef + 1)) {
    if (l.texto.includes("Taxa de Administração")) break;
    const toks = l.texto.split(/\s+/);
    if (!/^\d{3,5}$/.test(toks[0])) continue;
    const vals = toks.slice(1).filter((t) => MONEY.test(t));
    const esperado = 1 + dil.length + 2 * antPcts.length + 1;
    if (vals.length !== esperado) throw new ErroLeitura(`linha ${toks[0]}: ${vals.length} valores, esperava ${esperado}`);
    const v = vals.map(num);
    const parcelas: Parcela[] = [];
    let k = 1;
    for (const p of dil) parcelas.push({ plano: "DILUIDA", pct: p, primeira: v[k], demais: v[k++] });
    for (const p of antPcts) {
      parcelas.push({ plano: "ANTECIPADO_1", pct: p, primeira: v[k], demais: v[k + 1] });
      k += 2;
    }
    creditos.push({ cod: toks[0], credito: v[0], seguro: v[v.length - 1], parcelas });
  }
  if (!creditos.length) throw new ErroLeitura("nenhuma linha de crédito encontrada");

  // ---------------- modalidades ----------------
  const lim = plano.match(/Lance Limitado até (\d+) parcelas de lance \((\d+)% da categoria\)/);
  const fix = plano.match(/Lance Fixo (\d+) parcelas de lance \((\d+)% da categoria\)/);
  const fid =
    plano.match(/máximo de (\d+) PARCELAS \((\d+)%\)/) ?? plano.match(/Lance Fidelidade até (\d+) parcelas de lance \((\d+)% da categoria\)/);
  const fidAss = pega(/CONCORREM NA (\d+)ª ASSEMBLEIA DA COTA/, Number, false);
  const fidParc = pega(/efetuarem o pagamento de (\d+) parcelas/, Number, false);
  const naoTransfere = plano.includes("NÃO TRANSFERE O BENEFÍCIO");

  const ml = plano.match(/Modalidades de Contemplações: (.*?)\*Categoria/);
  if (!ml) throw new ErroLeitura("linha 'Modalidades de Contemplações' não encontrada");
  const presentes = new Set(ml[1].trim().split(" - ").filter((p) => p.trim()).map(tipoPorNome));
  const vazio = (): Modalidade => ({
    max: null, pct_cat: null, emb_parc: null, emb_base: null, emb_pct: null, rec_proprio: null, a_partir: 1, req: null, transf: true, emb_texto: null,
  });
  const modal: Record<string, Modalidade> = {};
  for (const t of ["SOR", "CAN", "LIV", "LIM", "FIX", "FID"]) if (presentes.has(t)) modal[t] = vazio();
  if (modal.LIM) {
    if (lim) Object.assign(modal.LIM, { max: Number(lim[1]), pct_cat: Number(lim[2]) });
    else erros.push("regra do lance limitado não encontrada");
  }
  if (modal.FIX) {
    if (fix) Object.assign(modal.FIX, { max: Number(fix[1]), pct_cat: Number(fix[2]) });
    else erros.push("regra do lance fixo não encontrada");
  }
  if (modal.FID) {
    if (fid)
      Object.assign(modal.FID, {
        max: Number(fid[1]),
        pct_cat: Number(fid[2]),
        a_partir: fidAss ?? 1,
        transf: !naoTransfere,
        req: fidParc ? `${fidParc} parcelas pagas (consecutivas ou não) e participação em ${fidParc} assembleias; antecipações não contam` : null,
      });
    else erros.push("regra do lance fidelidade não encontrada");
  }

  const lances = Object.keys(modal).filter((t) => LANCES.has(t));
  const todasProprio = /Em todas as modalidades 100% do lance deve ser pago com recursos próprios/.test(plano);
  const emb = plano.match(new RegExp(`((?:Lances?|Lance) [${L}\\d_ ,]{0,40}: permitido descontar.*?)(?:Entregas condicionadas|$)`, "u"));
  if (todasProprio) {
    for (const t of lances) Object.assign(modal[t], { rec_proprio: true, emb_texto: "100% do lance com recursos próprios (sem embutido)" });
  } else if (!emb) {
    erros.push("regras de embutido não encontradas");
  } else {
    for (const segTxt of emb[1].split("|").map((x) => x.trim())) {
      const i = segTxt.indexOf(":");
      if (i < 0) continue;
      const sujeito = segTxt.slice(0, i);
      const regra = segTxt.slice(i + 1);
      const tipos = ([["Livre", "LIV"], ["Limitado", "LIM"], ["Fixo", "FIX"], ["Fidelidade", "FID"]] as const).filter(([k]) => sujeito.includes(k)).map(([, t]) => t);
      const r1 = regra.match(/embutir\)\s*(aprox\.\s*)?(\d+) parcelas \((\d+)% (do valor ofertado|da categoria)\)/);
      const r2 = regra.match(/embutir\)\s*(\d+)% do valor ofertado/);
      for (const t of tipos) {
        const d = modal[t];
        if (!d) {
          avisos.push(`embutido citado para ${t}, que o grupo não oferece`);
          continue;
        }
        d.emb_texto = regra.trim().replace(/\.$/, "");
        // vale a última regra citada para a modalidade: sem "embutir" nela, não há embutido (zera o que uma regra anterior tenha preenchido)
        Object.assign(d, { emb_parc: null, emb_pct: null, emb_base: null });
        if (r1) Object.assign(d, { emb_parc: Number(r1[2]), emb_pct: Number(r1[3]), emb_base: r1[4].includes("ofertado") ? "ofertado" : "categoria" });
        else if (r2) Object.assign(d, { emb_pct: Number(r2[1]), emb_base: "ofertado" });
        d.rec_proprio = !(d.emb_base === "ofertado" && d.emb_pct === 100);
      }
    }
    for (const t of lances) if (modal[t].emb_texto === null) avisos.push(`regra de embutido de ${t} não encontrada`);
  }

  // ---------------- sequência ----------------
  const faixas: Faixa[] = [];
  const demaisMultiplo: string[] = [];
  const rxSeq = new RegExp(`Da (\\d+)ª a (\\d+)ª Assembleia: (.*?) - Demais contemplações seguem com (a mesma sequencia|Lance ${L}+(?: e Lance ${L}+)?)`, "gu");
  for (const f of plano.matchAll(rxSeq)) {
    const itens = f[3].split(" - ").map((parte) => {
      const r = parte.trim().match(/^(\d+) (.+)$/);
      if (!r) throw new ErroLeitura(`item de sequência não reconhecido: ${parte}`);
      return { qtd: Number(r[1]), tipo: tipoPorNome(r[2]) };
    });
    let demais: string | null = null;
    if (!f[4].startsWith("a mesma")) {
      const tipos = f[4].split(" e ").map(tipoPorNome);
      demais = tipos[0];
      if (tipos.length > 1) demaisMultiplo.push(`Da ${f[1]}ª a ${f[2]}ª assembleia, demais contemplações seguem com ${f[4]}.`);
    }
    faixas.push({ de: Number(f[1]), ate: Number(f[2]), itens, demais });
  }
  if (demaisMultiplo.length) avisos.push("demais contemplações com mais de uma modalidade (gravado o 1º tipo; texto completo em observações)");
  if (!faixas.length) erros.push("sequência de contemplação não encontrada");

  const obs = [...demaisMultiplo];
  if (plano.includes("Entregas condicionadas a efetiva arrecadação")) obs.push("Entregas condicionadas à efetiva arrecadação do grupo.");
  if (plano.includes("Loteria Federal")) obs.push("Sorteio e desempate dos lances pela Loteria Federal.");
  if (plano.includes("sofrer alterações sem aviso prévio")) obs.push("Valores e condições podem mudar sem aviso prévio.");

  // ---------------- validações ----------------
  if (prazoCota !== prazoGrupo - (assembleia - 1)) erros.push(`prazo da cota ${prazoCota} ≠ ${prazoGrupo} - (${assembleia} - 1)`);
  const razoesSeg: number[] = [];
  for (const c of creditos) {
    const d100 = c.parcelas.find((p) => p.plano === "DILUIDA" && p.pct === 100)!;
    const esperado = c.credito * (1 + taxa / 100);
    const dif = Math.abs(d100.primeira * prazoCota - esperado) / esperado;
    if (dif > 0.001) erros.push(`${c.cod}: diluída×prazo difere ${(dif * 100).toFixed(3)}% de crédito×(1+taxa)`);
    for (const p of c.parcelas) {
      const extra = (c.credito * antecipado.pct) / 100 / antecipado.parcelas;
      if (p.plano === "ANTECIPADO_1" && Math.abs(p.primeira - p.demais - extra) > 0.05)
        erros.push(`${c.cod}: parcela antecipada (${p.pct}%) ≠ demais + ${antecipado.pct}% do crédito em ${antecipado.parcelas} parcela(s)`);
    }
    razoesSeg.push(c.seguro / c.credito);
  }
  if (Math.max(...razoesSeg) - Math.min(...razoesSeg) > 0.000002) avisos.push("seguro não é proporcional ao crédito em todas as linhas");

  return {
    leitor: LEITOR,
    arquivo,
    hash,
    numero,
    familia,
    assembleia,
    data_assembleia: dataAssembleia,
    taxa_adm: taxa,
    prazo_cota: prazoCota,
    prazo_grupo: prazoGrupo,
    participantes,
    indice,
    mes_reajuste: mesReaj,
    primeira_correcao: primeiraCorrecao,
    vencimento,
    fundo_reserva: fundoReserva,
    seguro_opcional_pre: !!seg && seg[1] === "opcional",
    seguro_obrigatorio_pos: !!seg && seg[2] === "obrigatório",
    idade_limite: limite,
    observacoes: obs.join(" ") || null,
    planos: { DILUIDA: dil, ANTECIPADO_1: antPcts },
    antecipado,
    seguro_pct_mes: razoesSeg.length ? Math.round((razoesSeg.reduce((a, b) => a + b, 0) / razoesSeg.length) * 100 * 1e4) / 1e4 : null,
    creditos,
    modalidades: modal,
    faixas,
    erros,
    avisos,
  };
}
