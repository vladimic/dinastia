import { ErroLeitura } from "./erro";
import { LEITOR, type Faixa, type Leitura, type Linha, type LinhaCredito, type Modalidade, type PlanoReduzidoLido } from "./tipos";

// Interpreta as linhas (com posição) de um PDF de tabela de grupo de VEÍCULOS ou MOTOS da Ademicon.
// Diferenças para os imóveis (ver docs/modelo-de-dados.md):
//  - a parcela linear é (100% + taxa + fundo de reserva) ÷ prazo da cota;
//  - o plano reduzido tem duas fases (ex.: 0,6972% por 24 parcelas e 1,5071% por 66), ou é "reduzido 50% até a contemplação";
//  - os lances são % da categoria (crédito + taxas): Fixo 40% (F40), Fixo 25% (F25), Livre com teto, Fidelidade;
//  - o embutido é "% do valor ofertado" (do lance) ou "% para todas as modalidades" (da categoria);
//  - há parcela mínima depois da contemplação por lance.

const MESES: Record<string, number> = Object.fromEntries(
  ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"].map((m, i) => [m, i + 1]),
);
const ABREV: Record<string, number> = Object.fromEntries(["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"].map((m, i) => [m, i + 1]));
const L = "\\p{L}";
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const dois = (n: number) => String(n).padStart(2, "0");
const MONEY = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
const arred = (n: number, casas: number) => Math.round(n * 10 ** casas) / 10 ** casas;

const CODIGOS_RED = new Set([85, 70, 55, 50]);

/** Modalidades citadas num trecho, na ordem em que aparecem (Sorteio Cota Cancelada/Excluído não é guardado). */
function modalidadesDe(trecho: string): string[] {
  const rx = /Sorteio Cota Cancelada|Sorteio Excluido|Sorteio Exclu[ií]do|Sorteio Cota Ativa|Sorteio Ativo|Sorteio|Lances? Fixos?(?:\s+em|:|,)?\s*(\d+)%(?:\s*e\s*(\d+)%)?|Lances? Livres?|Lance Fidelidade|Lance Embutido/giu;
  const out: string[] = [];
  for (const m of trecho.matchAll(rx)) {
    const t = m[0].toLowerCase();
    if (t.startsWith("lance embutido")) break;
    if (t.includes("cancel") || t.includes("exclu")) continue;
    if (t.startsWith("sorteio")) out.push("SOR");
    else if (t.includes("livre")) out.push("LIV");
    else if (t.includes("fidelidade")) out.push("FID");
    else if (m[1]) {
      for (const p of [m[1], m[2]].filter(Boolean)) out.push(p === "40" ? "F40" : p === "25" ? "F25" : `?${p}`);
    }
  }
  return out;
}

export function interpretarVeiculo(linhas: Linha[], arquivo: string, hash: string): Leitura {
  const erros: string[] = [];
  const avisos: string[] = [];
  const plano = linhas.map((l) => l.texto).join(" ").replace(/\s+/g, " ");

  const mc = plano.match(/Grupo (\d+)\D{0,20}?Cons[óo]rcio de ([\p{L} ]+?)(?= \d+ª Assembleia| PLANO| Cod\.| Grupo |$)/iu);
  if (!mc) throw new ErroLeitura("cabeçalho 'Grupo N - Consórcio de ...' não encontrado");
  const numero = mc[1];

  const ma = plano.match(new RegExp(`(\\d+)ª Assembleia de Contemplação - (\\d+) de (${L}+) de (\\d{4})`, "u"));
  if (!ma) throw new ErroLeitura("assembleia não encontrada");
  const assembleia = Number(ma[1]);
  const mesAss = MESES[ma[3].toLowerCase()];
  if (!mesAss) throw new ErroLeitura(`mês da assembleia desconhecido: ${ma[3]}`);
  const dataAssembleia = `${ma[4]}-${dois(mesAss)}-${dois(Number(ma[2]))}`;

  const pega = <T,>(rx: RegExp, conv: (x: string) => T): T | null => {
    const r = plano.match(rx);
    return r ? conv(r[1]) : null;
  };
  const exige = <T,>(rx: RegExp, conv: (x: string) => T): T => {
    const v = pega(rx, conv);
    if (v === null) throw new ErroLeitura(`campo não encontrado: ${rx.source}`);
    return v;
  };

  const taxa = exige(/Taxa de Administração ([\d,]+)%/, num);
  const prazoCota = exige(/Prazo da Cota: (\d+) meses/, Number);
  const prazoGrupo = exige(/Prazo do Grupo: (\d+) meses/, Number);
  const participantes = exige(/Número de Participantes: (\d+)/, Number);
  const indice = pega(/Indice de Correção ?: ?([A-Z-]+)/, (x) => x);
  if (indice === null) avisos.push("índice de correção não informado na tabela");
  const fundo = pega(/Fundo de Reserva:? ([\d,]+)\s*%/, num);
  if (fundo === null) erros.push("fundo de reserva não encontrado");
  const vencimento = pega(/Vencimento todo (?:o )?dia (\d+)/, Number);
  if (vencimento === null) avisos.push("dia de vencimento não informado na tabela");
  const mesReaj = pega(new RegExp(`aplicado anualmente no m[êe]s de (${L}+)`, "u"), (s) => MESES[s.toLowerCase()] ?? null);
  const pr = plano.match(/Primeiro [Rr]eajuste (\p{L}{3})\p{L}*\/(\d{2,4})/u);
  const mesPr = pr ? ABREV[pr[1].toLowerCase()] : undefined;
  const primeiraCorrecao = pr && mesPr ? `${pr[2].length === 2 ? "20" + pr[2] : pr[2]}-${dois(mesPr)}-01` : null;
  const parcelaMinima = pega(/parcela mensal m[íi]nima de ([\d,]+)%/, num);
  if (parcelaMinima === null) avisos.push("parcela mínima não informada na tabela");
  const seguro = plano.match(/Seguro prestamista ([\d,]+)% (opcional|obrigatório) até a contemplação e após (obrigatório|opcional)/i) ?? plano.match(/Seguro prestamista (opcional|obrigatório) de ([\d,]+)% até a contemplação e após (obrigatório|opcional)/i);
  const seguroPct = seguro ? num((/^\d/.test(seguro[1]) ? seguro[1] : seguro[2])!) : null;
  const seguroOpc = seguro ? (/^\d/.test(seguro[1]) ? seguro[2] : seguro[1]).toLowerCase() === "opcional" : false;
  const fator = 1 + (taxa + (fundo ?? 0)) / 100;

  // ---------------- cabeçalho da tabela e tipo de plano ----------------
  const iRef = linhas.findIndex((l) => l.itens[0]?.s.startsWith("Ref."));
  if (iRef < 0) throw new ErroLeitura("cabeçalho da tabela de créditos não encontrado");
  const cab = linhas.slice(0, iRef).map((l) => l.texto).join(" ");
  const nSeguro = (cab.match(/com seguro/g) ?? []).length;
  let tipoPlano: string | null = null;
  const mPlano = cab.match(/REDUZIDO\s*-\s*PLANO\s*(\d+)/i);
  const mRed = cab.match(/PLANO\s+REDUZIDO\s+(\d+)%/i);
  if (mPlano) tipoPlano = `PLANO_${mPlano[1]}`;
  else if (/REDUZIDO\s*-\s*CLEARANCE/i.test(cab)) tipoPlano = "CLEARANCE";
  else if (mRed) {
    if (!CODIGOS_RED.has(Number(mRed[1]))) erros.push(`plano reduzido ${mRed[1]}% desconhecido`);
    tipoPlano = `RED_${mRed[1]}`;
  } else if (/REDUZID/i.test(cab)) erros.push("plano reduzido não reconhecido no cabeçalho");
  const duasFases = !!tipoPlano && !tipoPlano.startsWith("RED_");
  const colunas = !tipoPlano ? 1 : duasFases ? 3 : 2;
  if (nSeguro !== colunas) erros.push(`colunas de plano: ${nSeguro} "com seguro" no cabeçalho, esperava ${colunas}`);

  let reduzido: PlanoReduzidoLido | null = null;
  if (tipoPlano) {
    reduzido = { tipo: tipoPlano, fase1_pct: null, fase1_parcelas: null, fase2_parcelas: null };
    if (duasFases) {
      const frase = plano.match(/Plano Reduzido: ([\d,]+)% por (\d+) [Pp]arcelas?.*?([\d,]+)% por (\d+) [Pp]arcelas?/);
      if (!frase) erros.push("frase do plano reduzido (“X% por N parcelas … Y% por M parcelas”) não encontrada");
      else {
        const [a, n1, b, n2] = [num(frase[1]), Number(frase[2]), num(frase[3]), Number(frase[4])];
        const f1 = arred(a / fator, 4);
        // o nome do plano vem da % da fase 1 (Plano 40 = 0,5%, Plano 50 = 0,6%, Plano 75 = 0,85%): se o título do PDF discordar, valem os números
        const pelaPct: Record<string, string> = { "0.5": "PLANO_40", "0.6": "PLANO_50", "0.85": "PLANO_75" };
        const esperado = pelaPct[String(f1)];
        let tipo = tipoPlano;
        if (esperado && tipoPlano.startsWith("PLANO_") && esperado !== tipoPlano) {
          avisos.push(`o título do PDF diz “Plano ${tipoPlano.slice(6)}”, mas a fase 1 (${f1}%) é a do Plano ${esperado.slice(6)}: gravado Plano ${esperado.slice(6)}`);
          tipo = esperado;
        }
        reduzido = { tipo, fase1_pct: f1, fase1_parcelas: n1, fase2_parcelas: n2 };
        // a fase 2 fecha os 100%: (100 − f1×N1) ÷ N2, vezes (1 + taxa + fundo)
        const f2 = ((100 - f1 * n1) / n2) * fator;
        if (Math.abs(f2 - b) > 0.0006) erros.push(`plano reduzido: fase 2 ${b}% ≠ ${arred(f2, 4)}% esperado`);
        const antigos = cab.match(/\b\d,\d{4}%/g) ?? [];
        if (antigos.length >= 2 && Math.abs(num(antigos[0]!.replace("%", "")) - f1) > 0.0006) avisos.push(`plano reduzido: % IDEAL (ANTIGO) ${antigos[0]} ≠ ${f1}% calculado`);
        const prazoComl = plano.match(/Plano Reduzido válido apenas para o Prazo de (\d+) meses/);
        if (prazoComl && Number(prazoComl[1]) !== n1 + n2) avisos.push(`plano reduzido válido para ${prazoComl[1]} meses, mas as fases somam ${n1 + n2}`);
        if (Math.abs(100 - (f1 * n1 + ((100 - f1 * n1) / n2) * n2)) > 1e-9) erros.push("plano reduzido: fases não fecham 100%");
      }
    }
  }

  // ---------------- tabela de créditos ----------------
  const creditos: LinhaCredito[] = [];
  const nValores = 1 + 2 * colunas;
  const tipoPct = reduzido ? (reduzido.tipo.startsWith("RED_") ? Number(reduzido.tipo.slice(4)) : Number(reduzido.tipo.slice(6)) || 99) : 100;
  for (const l of linhas.slice(iRef + 1)) {
    if (l.texto.includes("Taxa de Administração")) break;
    const toks = l.texto.split(/\s+/);
    if (!/^(?=.*\d)[A-Za-z0-9]{3,6}$/.test(toks[0]) || MONEY.test(toks[0]) || !toks.slice(1).some((t) => MONEY.test(t))) continue;
    const vals = toks.slice(1).filter((t) => MONEY.test(t));
    if (vals.length !== nValores) throw new ErroLeitura(`linha ${toks[0]}: ${vals.length} valores, esperava ${nValores}`);
    const v = vals.map(num);
    const credito = v[0];
    const parcelas: LinhaCredito["parcelas"] = [{ plano: "DILUIDA", pct: 100, primeira: v[1], demais: v[1] }];
    if (colunas === 2) parcelas.push({ plano: "DILUIDA", pct: tipoPct, primeira: v[3], demais: v[3] });
    if (colunas === 3) parcelas.push({ plano: "DILUIDA", pct: tipoPct, primeira: v[3], demais: v[5] });
    // o seguro fica na coluna "com seguro" do plano linear (parcela + seguro)
    creditos.push({ cod: toks[0], credito, seguro: arred(v[2] - v[1], 2), parcelas });
  }
  if (!creditos.length) throw new ErroLeitura("nenhuma linha de crédito encontrada");

  // ---------------- modalidades ----------------
  const iCont = plano.search(/Contempla[çc][õo]es:?\s*(?=[\p{L}*-])/u);
  if (iCont < 0) throw new ErroLeitura("seção 'Contemplações' não encontrada");
  const fim = plano.slice(iCont).search(/Lance Embutido|Nas contempla[çc][õo]es por lance|Ap[óo]s a contempla[çc][ãa]o o saldo|Sorteio pela Extra/);
  const secao = plano.slice(iCont, iCont + (fim > 0 ? fim : plano.length - iCont));
  const emSecao = plano.slice(iCont);

  const modal: Record<string, Modalidade> = {};
  const vazio = (): Modalidade => ({ max: null, emb_parc: null, emb_pct: null, a_partir: 1, req: null });
  const faixas: Faixa[] = [];
  const mencionadas = new Set<string>();

  // sequência: "Da 1 a 12ª Assembleia: … Demais Lances na mesma ordem * Da 13ª Assembleia em diante: …", a lista única, ou o formato dos imóveis
  const demaisDe = (t: string): string | null => {
    const m = t.match(/Demais contempla[çc][õo]es seguem com Lance (\p{L}+)/iu);
    if (!m) return null;
    const n = m[1].toLowerCase();
    return n.startsWith("livre") ? "LIV" : null;
  };
  const itensDe = (t: string) => {
    const ordem = modalidadesDe(t);
    for (const x of ordem) mencionadas.add(x);
    return ordem.map((tipo) => ({ qtd: 1, tipo }));
  };
  const partes = [...secao.matchAll(/Da (\d+)ª? a (\d+)ª? Assembleia:\s*(.*?)(?=\*?\s*Da \d+ª? (?:a \d+ª? )?Assembleia|\*\*\s*Lance Fidelidade|$)/giu)];
  const emDiante = secao.match(/Da (\d+)ª? Assembleia em diante:\s*(.*?)(?=\*\*\s*Lance Fidelidade|$)/iu);
  if (partes.length) {
    for (const p of partes) faixas.push({ de: Number(p[1]), ate: Number(p[2]), itens: itensDe(p[3]), demais: demaisDe(p[3]), demais2: null });
    if (emDiante) {
      const de = Number(emDiante[1]);
      faixas.push({ de, ate: prazoGrupo, itens: itensDe(emDiante[2]), demais: demaisDe(emDiante[2]), demais2: null });
    }
  } else if (emDiante) {
    // o texto antes de "Da 13ª Assembleia em diante" é a faixa inicial (alguns PDFs omitem o "Da 1 a 12ª Assembleia:")
    const de = Number(emDiante[1]);
    const inicial = secao.slice(0, secao.search(/\*?\s*Da \d+ª? Assembleia em diante/i)).replace(/^Contempla[çc][õo]es:?\s*/i, "");
    if (de > 1 && modalidadesDe(inicial).length) {
      faixas.push({ de: 1, ate: de - 1, itens: itensDe(inicial), demais: demaisDe(inicial), demais2: null });
      faixas.push({ de, ate: prazoGrupo, itens: itensDe(emDiante[2]), demais: demaisDe(emDiante[2]), demais2: null });
      avisos.push(`sequência: faixa inicial sem “Da 1 a ${de - 1}ª Assembleia” no PDF; assumida da 1ª à ${de - 1}ª`);
    } else erros.push("sequência com 'em diante' sem a faixa inicial");
  } else {
    // lista única (layout antigo): vale do começo ao fim do grupo
    const texto = secao.replace(/^Contempla[çc][õo]es:?\s*/i, "").replace(/^G\)\s*/, "");
    faixas.push({ de: 1, ate: prazoGrupo, itens: itensDe(texto), demais: null, demais2: null });
  }
  if (!faixas.length || faixas.every((f) => !f.itens.length)) erros.push("sequência de contemplação não encontrada");
  for (const f of faixas) for (const i of f.itens) if (i.tipo.startsWith("?")) erros.push(`lance fixo desconhecido: ${i.tipo.slice(1)}%`);
  if (faixas.length) {
    const o = [...faixas].sort((a, b) => a.de - b.de);
    const ok = o[0].de === 1 && o[o.length - 1].ate === prazoGrupo && o.every((f, i) => i === 0 || f.de === o[i - 1].ate + 1);
    if (!ok) erros.push(`sequência de contemplação não cobre da 1ª à ${prazoGrupo}ª assembleia sem buracos`);
  }

  for (const t of ["SOR", "LIV", "F40", "F25", "FID"]) if (mencionadas.has(t)) modal[t] = vazio();
  if (modal.F40) modal.F40.lance_pct = 40;
  if (modal.F25) modal.F25.lance_pct = 25;
  // teto do lance livre ("Máx. 55%", "Lim. 55%", "Limitados ao Máximo 50%"); o fidelidade é "mais esta modalidade de Lance Livre": mesmo teto
  const teto = emSecao.slice(0, Math.max(0, emSecao.search(/Lance Embutido|\*\* Lance Fidelidade/) > 0 ? emSecao.search(/Lance Embutido|\*\* Lance Fidelidade/) : emSecao.length)).match(/Lances? Livres?[^-.]{0,40}?(?:M[áa]x(?:imo)?\.?|Lim(?:itados?)?\.?)[^0-9-]{0,12}(\d+)%/iu);
  if (teto && modal.LIV) {
    modal.LIV.max_lance_pct = Number(teto[1]);
    if (modal.FID) modal.FID.max_lance_pct = Number(teto[1]);
  }
  if (modal.FID) {
    const apos = pega(/Ap[óo]s (\d+) MESES/i, Number);
    const inicio = faixas.find((f) => f.itens.some((i) => i.tipo === "FID"))?.de ?? null;
    if (inicio !== null) modal.FID.a_partir = inicio;
    if (apos !== null && inicio !== null && inicio !== apos + 1) avisos.push(`fidelidade: "após ${apos} meses", mas entra na ${inicio}ª assembleia`);
    const parc = pega(/efetuarem o pagamento de (\d+) parcelas/, Number) ?? apos;
    modal.FID.req = parc ? `${parc} parcelas pagas consecutivas e participação em ${parc} assembleias; antecipações não contam` : null;
  }

  // ---------------- embutido ----------------
  const lances = Object.keys(modal).filter((t) => t !== "SOR");
  const aplica = (tipos: string[], pct: number | null, base: "lance" | "categoria") => {
    for (const t of tipos) {
      const d = modal[t];
      if (!d) continue;
      d.emb_pct = pct;
      d.emb_base = base;
    }
  };
  const textoEmb = plano.slice(plano.search(/Lance Embutido|[Ee]mbutido|Permitido Lance Embutido/) >= 0 ? plano.search(/Lance Embutido|[Ee]mbutido|Permitido Lance Embutido/) : 0);
  const lido = new Set<string>();
  if (/mbutido:? ?N[ãa]o ser[áa] permitido/.test(plano)) {
    aplica(lances, null, "lance"); // sem embutido: os dois campos vazios
    lances.forEach((t) => lido.add(t));
  } else if (/Para o Lance Livre permitido at[ée] \*?(\d+)%\*?.*?integral/.test(textoEmb)) {
    const m = textoEmb.match(/Para o Lance Livre permitido at[ée] \*?(\d+)%\*?/)!;
    aplica(["LIV", "FID"], Number(m[1]), "lance"); // o fidelidade segue o livre
    aplica(["F40", "F25"], 100, "lance"); // "permitido embutir o lance integral"
    lances.forEach((t) => lido.add(t));
    avisos.push(`embutido do livre: ${m[1]}% do lance (leitura do texto “Livre permitido até ${m[1]}%”)`);
  } else if (/(\d+)% do valor ofertado fixos, (\d+)% limite m[áa]ximo embutido no livre/.test(textoEmb)) {
    const m = textoEmb.match(/(\d+)% do valor ofertado fixos, (\d+)% limite m[áa]ximo embutido no livre/)!;
    aplica(["F40", "F25"], Number(m[1]), "lance");
    aplica(["LIV", "FID"], Number(m[2]), "categoria");
    lances.forEach((t) => lido.add(t));
    avisos.push(`embutido do livre: ${m[2]}% da categoria (“limite máximo embutido no livre”)`);
  } else if (/(\d+)% do valor ofertado/.test(textoEmb)) {
    const m = textoEmb.match(/(\d+)% do valor ofertado/)!;
    aplica(lances, Number(m[1]), "lance");
    lances.forEach((t) => lido.add(t));
  } else {
    const m = textoEmb.match(/mbutido:? ?(?:permitido )?(\d+)%(?: integral)? para todas as modalidades/i) ?? textoEmb.match(/Permitido Lance Embutido (\d+)%/i) ?? textoEmb.match(/mbutido (\d+)%/i);
    if (m) {
      aplica(lances, Number(m[1]), "categoria"); // % da categoria (crédito + taxas)
      lances.forEach((t) => lido.add(t));
      if (/integral/.test(m[0])) avisos.push("embutido “25% integral para todas as modalidades”: lido como 25% da categoria");
    }
  }
  for (const t of lances) if (!lido.has(t)) erros.push(`regra de embutido de ${t} não encontrada`);

  // ---------------- validações ----------------
  if (prazoCota !== prazoGrupo - (assembleia - 1)) erros.push(`prazo da cota ${prazoCota} ≠ ${prazoGrupo} - (${assembleia} - 1)`);
  let nErrosLinha = 0;
  const confere = (cod: string, rotulo: string, lido: number, esperado: number, tol = 0.0015) => {
    if (Math.abs(lido - esperado) / esperado > tol && nErrosLinha++ < 3) erros.push(`${cod}: ${rotulo} ${lido} ≠ ${arred(esperado, 2)} esperado`);
  };
  for (const c of creditos) {
    const lin = c.parcelas[0].primeira;
    confere(c.cod, "parcela linear", lin, (c.credito * fator) / prazoCota);
    if (reduzido && reduzido.fase1_pct !== null && reduzido.fase1_parcelas !== null && reduzido.fase2_parcelas !== null) {
      const f2 = (100 - reduzido.fase1_pct * reduzido.fase1_parcelas) / reduzido.fase2_parcelas;
      confere(c.cod, "parcela da fase 1", c.parcelas[1].primeira, ((c.credito * reduzido.fase1_pct) / 100) * fator);
      confere(c.cod, "parcela da fase 2", c.parcelas[1].demais, ((c.credito * f2) / 100) * fator);
    } else if (reduzido) {
      const p = Number(reduzido.tipo.slice(4)) / 100;
      confere(c.cod, `parcela reduzida ${reduzido.tipo.slice(4)}%`, c.parcelas[1].primeira, (c.credito * (p + fator - 1)) / prazoCota);
    }
  }

  const obs: string[] = [];
  if (plano.includes("Entregas condicionadas a efetiva arrecadação")) obs.push("Entregas condicionadas à efetiva arrecadação do grupo.");
  if (plano.includes("Loteria Federal") || plano.includes("Extração da Loteria")) obs.push("Sorteio e desempate dos lances pela Loteria Federal.");

  return {
    leitor: LEITOR,
    arquivo,
    hash,
    numero,
    familia: "veiculos",
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
    fundo_reserva: fundo,
    seguro_opcional_pre: seguroOpc,
    seguro_obrigatorio_pos: !!seguro,
    idade_limite: null,
    observacoes: obs.join(" ") || null,
    planos: { DILUIDA: [100], ANTECIPADO_1: [] },
    antecipado: { pct: 0, parcelas: 1 },
    seguro_pct_mes: seguroPct,
    creditos,
    modalidades: modal,
    faixas,
    parcela_minima_pct: parcelaMinima,
    plano_reduzido: reduzido,
    erros,
    avisos,
  };
}

