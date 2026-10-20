import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de serviço, só para criar/remover contas de login na tela Usuários.
 * Devolve null enquanto SUPABASE_SERVICE_ROLE_KEY não estiver configurada (a tela continua salvando o cadastro).
 * Nunca use para ler/gravar dados das tabelas: isso passa por cima das regras de acesso.
 */
export function clienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave, { auth: { autoRefreshToken: false, persistSession: false } });
}
