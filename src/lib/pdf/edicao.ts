// Edição manual de uma diferença: converte o texto digitado no valor certo (número, texto, sim/não, data ou lista).

export type TipoValor = "numero" | "texto" | "booleano" | "data" | "lista_numeros" | "lista_codigos" | "nenhum";

const CAMPOS_NUMERO = new Set(["prazo_grupo_meses", "participantes", "taxa_adm_total", "fundo_reserva", "mes_reajuste", "dia_vencimento", "prazo_cota", "max", "emb_parc", "emb_pct", "a_partir"]);
const CAMPOS_BOOL = new Set(["transf"]);
const CAMPOS_DATA = new Set(["data_assembleia", "primeira_correcao"]);

export function tipoDoCampo(escopo: string, campo: string): TipoValor {
  if (campo === "*") return "nenhum"; // grupo novo, modalidade que aparece/some e sequência: só aceitar ou rejeitar
  if (escopo === "creditos") return "lista_numeros";
  if (escopo === "tipos_parcela") return "lista_codigos";
  if (CAMPOS_NUMERO.has(campo)) return "numero";
  if (CAMPOS_BOOL.has(campo)) return "booleano";
  if (CAMPOS_DATA.has(campo)) return "data";
  return "texto";
}

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Como o valor aparece na tela e no campo de edição. */
export function mostrar(v: unknown, tipo?: TipoValor): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (Array.isArray(v)) return tipo === "lista_codigos" ? v.join(", ") : v.map((x) => (typeof x === "number" ? brl(x) : String(x))).join("; ");
  if (typeof v === "number") return String(v).replace(".", ",");
  return String(v);
}

export function paraEdicao(v: unknown, tipo: TipoValor): string {
  const s = mostrar(v, tipo);
  return s === "—" ? "" : s;
}

const num = (s: string) => {
  const t = s.trim().replace(/%/g, "").replace(/\./g, "").replace(",", ".");
  return t === "" ? null : Number(t);
};

export function converterEdicao(escopo: string, campo: string, texto: string): { ok: true; valor: unknown } | { ok: false; erro: string } {
  const t = texto.trim();
  switch (tipoDoCampo(escopo, campo)) {
    case "numero": {
      if (t === "") return { ok: true, valor: null };
      const n = num(t);
      if (n === null || !Number.isFinite(n) || n < 0) return { ok: false, erro: "Informe um número válido." };
      return { ok: true, valor: n };
    }
    case "booleano":
      if (/^(sim|s|true|1)$/i.test(t)) return { ok: true, valor: true };
      if (/^(n[aã]o|n|false|0)$/i.test(t)) return { ok: true, valor: false };
      return { ok: false, erro: "Informe sim ou não." };
    case "data":
      if (t === "") return { ok: true, valor: null };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(t))) return { ok: false, erro: "Informe a data como AAAA-MM-DD." };
      return { ok: true, valor: t };
    case "lista_numeros": {
      const itens = t.split(/[;\n]+/).map((x) => num(x));
      if (!itens.length || itens.some((n) => n === null || !Number.isFinite(n) || n <= 0)) return { ok: false, erro: "Informe os valores maiores que zero, separados por ponto e vírgula." };
      const lista = (itens as number[]).map((n) => Math.round(n * 100) / 100).sort((a, b) => b - a);
      if (new Set(lista).size !== lista.length) return { ok: false, erro: "Há valores repetidos." };
      return { ok: true, valor: lista };
    }
    case "lista_codigos": {
      const itens = t.split(/[,;\s]+/).filter(Boolean).map((x) => x.toUpperCase());
      if (!itens.length || itens.some((x) => !/^[A-Z0-9_-]{1,20}$/.test(x))) return { ok: false, erro: "Informe os códigos separados por vírgula, ex.: NORMAL, RED_50." };
      return { ok: true, valor: [...new Set(itens)].sort() };
    }
    case "texto":
      return { ok: true, valor: t === "" ? null : t };
    default:
      return { ok: false, erro: "Esta diferença só pode ser aceita ou rejeitada." };
  }
}
