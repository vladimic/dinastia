"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ExportarArquivo";
import { cpfValido, formatarCpf, formatarTelefone, soDigitos } from "@/lib/pessoa";
import { excluirUsuario, salvarUsuario, type Resultado } from "./actions";

export type Linha = {
  cpf: string;
  email: string;
  nome_completo: string;
  telefone: string;
  administrador: boolean;
  login: boolean;
};

type Form = { cpf: string; email: string; nome_completo: string; telefone: string; administrador: boolean; senha: string };
const VAZIO: Form = { cpf: "", email: "", nome_completo: "", telefone: "", administrador: false, senha: "" };

const BTN = "min-h-8 rounded-[10px] px-3 text-xs font-bold";

export function UsuariosTela({ linhas, meuCpf, podeCriarLogin }: { linhas: Linha[]; meuCpf: string; podeCriarLogin: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<{ original: string; form: Form } | null>(null);
  const [excluindo, setExcluindo] = useState<Linha | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();

  const abrir = (u?: Linha) => {
    setErro("");
    setEditando(
      u
        ? { original: u.cpf, form: { cpf: formatarCpf(u.cpf), email: u.email, nome_completo: u.nome_completo, telefone: formatarTelefone(u.telefone), administrador: u.administrador, senha: "" } }
        : { original: "", form: VAZIO },
    );
  };

  function resposta(r: Resultado, fechar: () => void) {
    if (r.ok) {
      fechar();
      setAviso(r.aviso ?? "Salvo.");
      router.refresh();
    } else setErro(r.erro);
  }

  function salvar() {
    if (!editando) return;
    const f = editando.form;
    setErro("");
    if (!cpfValido(soDigitos(f.cpf))) return setErro("CPF inválido.");
    iniciar(async () => resposta(await salvarUsuario({ cpfOriginal: editando.original, ...f }), () => setEditando(null)));
  }

  function excluir() {
    if (!excluindo) return;
    setErro("");
    iniciar(async () => resposta(await excluirUsuario(excluindo.cpf), () => setExcluindo(null)));
  }

  const mudar = (p: Partial<Form>) => setEditando((x) => (x ? { ...x, form: { ...x.form, ...p } } : x));
  const eu = editando?.original !== "" && editando?.original === meuCpf;

  return (
    <div className="flex max-w-[72rem] flex-col gap-4">
      {aviso && (
        <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          {aviso}
        </p>
      )}
      {!podeCriarLogin && (
        <p className="rounded-xl border border-alerta-borda bg-alerta-fundo px-4 py-2 text-xs text-alerta">
          Criar o login por esta tela ainda não está ligado (falta <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel). Por enquanto o cadastro é salvo aqui e o login é criado no Supabase (Authentication › Users); quem aparecer como “Login pendente” ainda não consegue entrar.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-tinta">
          {linhas.length} {linhas.length === 1 ? "usuário" : "usuários"}
        </span>
        <button type="button" onClick={() => abrir()} className={BTN + " min-h-9 bg-laranja px-5 text-sm text-navy hover:brightness-95"}>
          Incluir usuário
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-borda bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead>
            <tr className="border-b border-linha text-[11px] font-semibold uppercase tracking-wide text-tinta">
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-2 py-2.5">CPF</th>
              <th className="px-2 py-2.5">E-mail</th>
              <th className="px-2 py-2.5">Telefone</th>
              <th className="px-2 py-2.5">Perfil</th>
              <th className="px-2 py-2.5">Login</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((u) => (
              <tr key={u.cpf} className="border-b border-linha last:border-0">
                <td className="px-4 py-2.5 font-semibold">
                  {u.nome_completo}
                  {u.cpf === meuCpf && <span className="ml-2 text-[11px] font-normal text-tinta">(você)</span>}
                </td>
                <td className="px-2 py-2.5 tabular-nums">{formatarCpf(u.cpf)}</td>
                <td className="px-2 py-2.5 break-all">{u.email}</td>
                <td className="px-2 py-2.5 tabular-nums whitespace-nowrap">{formatarTelefone(u.telefone)}</td>
                <td className="px-2 py-2.5">
                  {u.administrador ? (
                    <span className="rounded-full bg-laranja-claro px-2 py-0.5 text-[11px] font-bold text-alerta">Administrador</span>
                  ) : (
                    <span className="text-xs text-tinta">Usuário</span>
                  )}
                </td>
                <td className="px-2 py-2.5">
                  {u.login ? <span className="text-xs font-semibold text-ok">Ativo</span> : <span className="text-xs font-semibold text-alerta">Login pendente</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => abrir(u)} className={BTN + " bg-navy text-white hover:brightness-110"}>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErro("");
                        setExcluindo(u);
                      }}
                      disabled={u.cpf === meuCpf}
                      title={u.cpf === meuCpf ? "Você não pode excluir o seu próprio cadastro" : undefined}
                      className={BTN + " border border-borda-campo font-semibold text-tinta hover:bg-linha disabled:cursor-not-allowed disabled:opacity-50"}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <Modal titulo={editando.original ? "Editar usuário" : "Incluir usuário"} onFechar={() => setEditando(null)}>
          <form
            className="flex flex-col gap-3 overflow-y-auto"
            onSubmit={(ev) => {
              ev.preventDefault();
              salvar();
            }}
          >
            <label className="rotulo">
              CPF
              <input
                className="campo"
                value={editando.form.cpf}
                onChange={(ev) => mudar({ cpf: formatarCpf(ev.target.value) })}
                inputMode="numeric"
                readOnly={editando.original !== ""}
                title={editando.original ? "O CPF é a chave do cadastro e não muda" : undefined}
                required
                autoFocus={editando.original === ""}
              />
            </label>
            <label className="rotulo">
              Nome completo
              <input className="campo" value={editando.form.nome_completo} onChange={(ev) => mudar({ nome_completo: ev.target.value })} maxLength={120} required />
            </label>
            <label className="rotulo">
              E-mail (é o login)
              <input
                className="campo"
                type="email"
                value={editando.form.email}
                onChange={(ev) => mudar({ email: ev.target.value })}
                readOnly={eu}
                title={eu ? "Você não pode trocar o seu próprio e-mail" : undefined}
                required
              />
            </label>
            <label className="rotulo">
              Telefone com DDD
              <input className="campo" value={editando.form.telefone} onChange={(ev) => mudar({ telefone: formatarTelefone(ev.target.value) })} inputMode="tel" placeholder="(11) 98765-4321" required />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={editando.form.administrador}
                disabled={eu}
                onChange={(ev) => mudar({ administrador: ev.target.checked })}
                className="h-4 w-4 accent-[var(--color-laranja)]"
              />
              Administrador
              <span className="text-xs font-normal text-tinta">
                {eu ? "(não dá para remover de si mesmo)" : "edita grupos e tabelas, parâmetros e usuários"}
              </span>
            </label>
            {podeCriarLogin && (
              <label className="rotulo">
                {editando.original ? "Nova senha provisória (opcional)" : "Senha provisória (cria o login)"}
                <input
                  className="campo"
                  type="text"
                  value={editando.form.senha}
                  onChange={(ev) => mudar({ senha: ev.target.value })}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="mínimo 8 caracteres"
                />
              </label>
            )}
            {erro && (
              <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
                {erro}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditando(null)} className="min-h-11 rounded-[10px] border border-borda-campo px-4 text-sm font-semibold text-tinta hover:bg-linha">
                Cancelar
              </button>
              <button type="submit" disabled={pendente} className="min-h-11 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95 disabled:opacity-60">
                {pendente ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {excluindo && (
        <Modal titulo="Excluir usuário" onFechar={() => setExcluindo(null)}>
          <p className="text-sm">
            Excluir <strong>{excluindo.nome_completo}</strong> ({excluindo.email})? Essa pessoa perde o acesso ao Dinastia.
          </p>
          {erro && (
            <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setExcluindo(null)} className="min-h-11 rounded-[10px] border border-borda-campo px-4 text-sm font-semibold text-tinta hover:bg-linha">
              Cancelar
            </button>
            <button type="button" onClick={excluir} disabled={pendente} className="min-h-11 rounded-[10px] bg-[#9b1c1c] px-5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
              {pendente ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
