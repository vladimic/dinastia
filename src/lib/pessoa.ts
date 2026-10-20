// CPF, telefone e e-mail: validação e máscaras (sem dependências de servidor; vale no navegador e no servidor).

export const soDigitos = (s: string) => s.replace(/\D/g, "");

export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    const dv = (soma * 10) % 11 % 10;
    if (dv !== Number(cpf[n])) return false;
  }
  return true;
}

/** "52998224725" → "529.982.247-25" (aceita digitação parcial) */
export function formatarCpf(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** DDD + número, só dígitos: 10 (fixo) ou 11 (celular) dígitos, DDD de 11 a 99 */
export const telefoneValido = (t: string) => /^[1-9][0-9][0-9]{8,9}$/.test(t);

/** "11987654321" → "(11) 98765-4321" (aceita digitação parcial) */
export function formatarTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const resto = d.slice(2);
  const corte = d.length > 10 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${resto.slice(0, corte)}${resto.length > corte ? "-" + resto.slice(corte) : ""}`;
}

export const emailValido = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length <= 254;
