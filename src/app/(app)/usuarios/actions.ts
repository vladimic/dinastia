"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { cpfValido, emailValido, soDigitos, telefoneValido } from "@/lib/pessoa";
import { ehAdministrador, usuarioAtual } from "@/lib/usuario";

export type Resultado = { ok: true; aviso?: string } | { ok: false; erro: string };

export type Entrada = {
  /** CPF do cadastro que está sendo editado; vazio na inclusão */
  cpfOriginal: string;
  cpf: string;
  email: string;
  nome_completo: string;
  telefone: string;
  administrador: boolean;
  /** opcional: cria o login (ou redefine a senha) com esta senha provisória */
  senha: string;
};

const falha = (erro: string): Resultado => ({ ok: false, erro });
const MSG_SEM_PERMISSAO = "Apenas administradores podem gerenciar usuários.";
const SEM_PERMISSAO = falha(MSG_SEM_PERMISSAO);
const SENHA_MIN = 8;

type Admin = NonNullable<ReturnType<typeof clienteAdmin>>;

async function acharLogin(admin: Admin, email: string) {
  for (let pagina = 1; pagina <= 10; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw error;
    const achado = data.users.find((u) => u.email?.toLowerCase() === email);
    if (achado) return achado;
    if (data.users.length < 200) break;
  }
  return null;
}

function traduzir(error: { code?: string; message: string }): string {
  if (error.message.includes("ultimo_administrador")) return "Precisa existir ao menos um administrador. Marque outro usuário como administrador antes.";
  if (error.code === "23505") return error.message.includes("email") ? "Já existe um usuário com esse e-mail." : "Já existe um usuário com esse CPF.";
  if (error.code === "23514" || error.code === "22P02") return "Dados inválidos. Confira CPF, e-mail, nome e telefone.";
  if (error.code === "42501") return MSG_SEM_PERMISSAO;
  return "Não foi possível salvar. Tente de novo.";
}

export async function salvarUsuario(e: Entrada): Promise<Resultado> {
  if (!(await ehAdministrador())) return SEM_PERMISSAO;

  const cpf = soDigitos(e.cpf ?? "");
  const cpfOriginal = soDigitos(e.cpfOriginal ?? "");
  const email = String(e.email ?? "").trim().toLowerCase();
  const nome = String(e.nome_completo ?? "").trim().replace(/\s+/g, " ");
  const telefone = soDigitos(e.telefone ?? "");
  const senha = String(e.senha ?? "");
  const edicao = cpfOriginal !== "";

  if (edicao && cpf !== cpfOriginal) return falha("O CPF é a chave do cadastro e não pode ser trocado. Exclua e inclua de novo, se for o caso.");
  if (!cpfValido(cpf)) return falha("CPF inválido.");
  if (!emailValido(email)) return falha("E-mail inválido.");
  if (nome.length < 3 || nome.length > 120 || !nome.includes(" ")) return falha("Informe o nome completo (nome e sobrenome).");
  if (!telefoneValido(telefone)) return falha("Telefone inválido. Informe o DDD e o número, ex.: (11) 98765-4321.");
  if (senha && senha.length < SENHA_MIN) return falha(`A senha provisória precisa ter ao menos ${SENHA_MIN} caracteres.`);

  const atual = await usuarioAtual();
  const supabase = await createClient();
  const admin = clienteAdmin();
  if (senha && !admin) return falha("Para criar o login aqui falta configurar SUPABASE_SERVICE_ROLE_KEY. Deixe a senha em branco e crie o login no Supabase.");

  let emailAnterior = email;
  if (edicao) {
    const { data: antes, error } = await supabase.from("usuario").select("email, administrador").eq("cpf", cpf).maybeSingle();
    if (error || !antes) return falha("Usuário não encontrado.");
    emailAnterior = antes.email as string;
    if (cpf === atual?.cadastro?.cpf) {
      if (!e.administrador) return falha("Você não pode remover o seu próprio perfil de administrador. Peça a outro administrador.");
      if (email !== emailAnterior) return falha("Você não pode trocar o seu próprio e-mail por aqui: perderia o acesso.");
    }
    if (email !== emailAnterior && !admin) {
      const { data: logins } = await supabase.rpc("logins_existentes");
      if ((logins as { email: string }[] | null)?.some((l) => l.email === emailAnterior))
        return falha("Este usuário já tem login. Para trocar o e-mail é preciso configurar SUPABASE_SERVICE_ROLE_KEY (ou ajustar no Supabase).");
    }
    const { error: erroUp } = await supabase
      .from("usuario")
      .update({ email, nome_completo: nome, telefone, administrador: e.administrador })
      .eq("cpf", cpf);
    if (erroUp) return falha(traduzir(erroUp));
  } else {
    const { error } = await supabase
      .from("usuario")
      .insert({ cpf, email, nome_completo: nome, telefone, administrador: e.administrador });
    if (error) return falha(traduzir(error));
  }

  let aviso: string | undefined;
  if (admin) {
    try {
      const login = await acharLogin(admin, emailAnterior);
      if (login) {
        const mudancas: { email?: string; password?: string; email_confirm?: boolean } = {};
        if (email !== emailAnterior) Object.assign(mudancas, { email, email_confirm: true });
        if (senha) mudancas.password = senha;
        if (Object.keys(mudancas).length) {
          const { error } = await admin.auth.admin.updateUserById(login.id, mudancas);
          if (error) aviso = "Cadastro salvo, mas não foi possível atualizar o login: " + error.message;
          else if (senha) aviso = "Senha provisória definida. Repasse ao usuário e peça para trocar em “Esqueci minha senha”.";
        }
      } else if (senha) {
        const { error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
        if (error) aviso = "Cadastro salvo, mas o login não foi criado: " + error.message;
        else aviso = "Login criado. Repasse a senha provisória ao usuário.";
      }
    } catch {
      aviso = "Cadastro salvo, mas não foi possível falar com o serviço de login. Tente editar de novo.";
    }
  }

  revalidatePath("/usuarios");
  return { ok: true, aviso };
}

export async function excluirUsuario(cpfBruto: string): Promise<Resultado> {
  if (!(await ehAdministrador())) return SEM_PERMISSAO;
  const cpf = soDigitos(cpfBruto ?? "");
  const atual = await usuarioAtual();
  if (cpf === atual?.cadastro?.cpf) return falha("Você não pode excluir o seu próprio cadastro.");

  const supabase = await createClient();
  const { data: alvo } = await supabase.from("usuario").select("email").eq("cpf", cpf).maybeSingle();
  if (!alvo) return falha("Usuário não encontrado.");
  const { error } = await supabase.from("usuario").delete().eq("cpf", cpf);
  if (error) return falha(traduzir(error));

  // sem cadastro ele já não entra; remove também a conta de login, quando a chave de serviço existe
  let aviso: string | undefined;
  const admin = clienteAdmin();
  if (admin) {
    try {
      const login = await acharLogin(admin, alvo.email as string);
      if (login) await admin.auth.admin.deleteUser(login.id);
    } catch {
      aviso = "Cadastro excluído, mas a conta de login continua no Supabase (sem acesso ao sistema).";
    }
  } else {
    aviso = "Cadastro excluído. A conta de login continua no Supabase, mas sem acesso ao sistema.";
  }
  revalidatePath("/usuarios");
  return { ok: true, aviso };
}
