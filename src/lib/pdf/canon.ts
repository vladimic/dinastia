// Texto canônico de um valor JSON: as chaves dos objetos em ordem alfabética, em qualquer nível.
// O banco (jsonb) devolve as chaves numa ordem própria; comparar com JSON.stringify direto acusa diferença onde não há.
export function canon(v: unknown): string {
  const ordenar = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(ordenar);
    if (x && typeof x === "object") return Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, val]) => [k, ordenar(val)]));
    return x ?? null;
  };
  return JSON.stringify(ordenar(v));
}
