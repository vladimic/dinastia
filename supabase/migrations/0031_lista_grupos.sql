-- Dinastia · 0031: lista de grupos de cada família guardada pronta (lista_grupos).
-- A tela Grupos e Tabelas lê esta linha em vez de montar a lista a cada troca de grupo.
-- Refeita pelo aplicativo ao aplicar a importação, ao editar um grupo e ao restaurar um backup. Aplicada no Supabase em 22/10/2026.
create table public.lista_grupos (
  familia       text primary key,
  dados         jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.lista_grupos enable row level security;
revoke all on public.lista_grupos from anon;
create policy "le_autenticado" on public.lista_grupos for select to authenticated using (true);
create policy "admin_escreve" on public.lista_grupos for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));
-- (comentários da tabela e dos campos: ver src/lib/dicionarioDados.ts / 0027)
