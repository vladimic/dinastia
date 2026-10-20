-- Dinastia · 0023: cadastro de usuários (CPF como chave), perfil Administrador e pastas dos PDFs das tabelas.
--
-- 1) Tabela usuario (cpf, e-mail único, nome completo, telefone com DDD, administrador) passa a ser a ÚNICA lista de acesso:
--    substitui usuario_autorizado. Quem está em usuario pode entrar; quem tem administrador = true também pode editar.
-- 2) Nunca fica sem administrador: trigger no banco (com trava, vale mesmo com dois cliques ao mesmo tempo).
-- 3) Só administrador grava em: parametros_gerais, tipo_contemplacao, tipo_parcela e nas tabelas dos grupos
--    (inclui a importação e a restauração de backup). Todo usuário cadastrado continua lendo tudo.
-- 4) logins_existentes(): para a tela Usuários mostrar quem já tem conta de login (só administrador enxerga).
-- 5) Pastas padrão dos PDFs das tabelas (uma por família), em parametros_gerais.
--
-- O primeiro administrador entra como dados pessoais, que NÃO ficam neste repositório: foi inserido na aplicação da
-- migração (ver a seção 3) e depois sempre pela tela Usuários.
-- Aplicada no Supabase via MCP em 20/10/2026.
-- Reverter (se preciso): recriar usuario_autorizado(email), repor as policies "autorizado_tudo" e dropar usuario.

-- (1) CPF: 11 dígitos com dígitos verificadores corretos
create or replace function public.cpf_valido(c text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare s int; i int; r int;
begin
  if c is null or c !~ '^[0-9]{11}$' or c ~ '^(.)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(c, i, 1)::int * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> substr(c, 10, 1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(c, i, 1)::int * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = substr(c, 11, 1)::int;
end $$;

-- (2) Tabela de usuários
create table public.usuario (
  cpf            text primary key check (public.cpf_valido(cpf)),            -- só dígitos
  email          text not null unique check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  nome_completo  text not null check (length(btrim(nome_completo)) between 3 and 120),
  telefone       text not null check (telefone ~ '^[1-9][0-9][0-9]{8,9}$'),   -- DDD + número, só dígitos
  administrador  boolean not null default false,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
comment on table public.usuario is 'Quem pode entrar no Dinastia (e-mail do login) e se é administrador';
create trigger usuario_atualizado_em before update on public.usuario
  for each row execute function public.set_atualizado_em();

-- (2b) Nunca fica sem administrador: a trava serializa alterações e a conferência roda ao fim de cada comando
create or replace function public.usuario_travar_admin() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(7340023);
  return coalesce(new, old);
end $$;
create or replace function public.usuario_conferir_admin() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.usuario where administrador) then
    raise exception 'ultimo_administrador' using errcode = '23514';
  end if;
  return null;
end $$;
create trigger usuario_travar_admin before update or delete on public.usuario
  for each row execute function public.usuario_travar_admin();
create trigger usuario_conferir_admin after update or delete on public.usuario
  for each statement execute function public.usuario_conferir_admin();

-- (3) PRIMEIRO ADMINISTRADOR (dados pessoais: não ficam no repositório). Rodar uma vez, antes da parte seguinte:
-- insert into public.usuario (cpf, email, nome_completo, telefone, administrador)
-- values ('<CPF, 11 dígitos>', '<e-mail do login>', '<Nome completo>', '<DDD + telefone>', true);

-- ==== PARTE 2: só segue se já existe um administrador (evita trancar todo mundo para fora) ====
do $$ begin
  if not exists (select 1 from public.usuario where administrador) then
    raise exception 'Cadastre o primeiro administrador em public.usuario antes de rodar a parte 2 da migração 0023.';
  end if;
end $$;

-- Quem entra e quem é administrador passam a vir de usuario (mesmas funções que as policies já usam)
create or replace function public.autorizado() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuario u
    where u.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuario u
    where u.email = lower(coalesce(auth.jwt() ->> 'email', '')) and u.administrador
  );
$$;
revoke all on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

-- RLS da própria tabela: cada um enxerga a própria linha; o administrador enxerga e altera todas
alter table public.usuario enable row level security;
revoke all on public.usuario from anon;
create policy "usuario_ler" on public.usuario for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')) or (select public.eh_admin()));
create policy "usuario_incluir" on public.usuario for insert to authenticated
  with check ((select public.eh_admin()));
create policy "usuario_alterar" on public.usuario for update to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy "usuario_excluir" on public.usuario for delete to authenticated
  using ((select public.eh_admin()));

-- (3) Só administrador grava nos parâmetros, nos cadastros de modalidade/parcela e nos dados dos grupos; todos leem
do $$
declare t text;
begin
  foreach t in array array[
    'parametros_gerais','tipo_contemplacao','tipo_parcela',
    'grupo','arquivo_importado','grupo_assembleia','grupo_assembleia_tipo_parcela',
    'grupo_modalidade','grupo_sequencia_faixa','grupo_sequencia'
  ] loop
    execute format('drop policy if exists "autorizado_tudo" on public.%I', t);
    execute format('create policy "autorizado_ler" on public.%I for select to authenticated using ((select public.autorizado()))', t);
    execute format('create policy "admin_incluir" on public.%I for insert to authenticated with check ((select public.eh_admin()))', t);
    execute format('create policy "admin_alterar" on public.%I for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()))', t);
    execute format('create policy "admin_excluir" on public.%I for delete to authenticated using ((select public.eh_admin()))', t);
  end loop;
end $$;

-- A lista antiga de acesso deixa de existir (o único e-mail dela já está em usuario)
drop table public.usuario_autorizado;

-- (4) E-mails que já têm conta de login (só para administrador; usado pela tela Usuários)
create or replace function public.logins_existentes() returns table (email text)
language sql stable security definer set search_path = '' as $$
  select lower(u.email)::text from auth.users u
  where u.email is not null and (select public.eh_admin());
$$;
revoke all on function public.logins_existentes() from public, anon;
grant execute on function public.logins_existentes() to authenticated;

-- (5) Pastas padrão dos PDFs das tabelas, por família (usadas pelo futuro programa de importação)
alter table public.parametros_gerais
  add column if not exists pasta_pdf_imoveis text check (length(pasta_pdf_imoveis) <= 500),
  add column if not exists pasta_pdf_veiculos text check (length(pasta_pdf_veiculos) <= 500),
  add column if not exists pasta_pdf_servicos text check (length(pasta_pdf_servicos) <= 500),
  add column if not exists pasta_pdf_outros_bens text check (length(pasta_pdf_outros_bens) <= 500);
comment on column public.parametros_gerais.pasta_pdf_imoveis is 'Pasta padrão dos PDFs das tabelas de Imóveis (programa de importação)';
comment on column public.parametros_gerais.pasta_pdf_veiculos is 'Pasta padrão dos PDFs das tabelas de Veículos (programa de importação)';
comment on column public.parametros_gerais.pasta_pdf_servicos is 'Pasta padrão dos PDFs das tabelas de Serviços (programa de importação)';
comment on column public.parametros_gerais.pasta_pdf_outros_bens is 'Pasta padrão dos PDFs das tabelas de Outros Bens (programa de importação)';
update public.parametros_gerais set
  pasta_pdf_imoveis = '/Users/vladimic/Library/Mobile Documents/com~apple~CloudDocs/PROFIT/Ademicon/Vendas/Tabelas/Imóveis/Tabelas Imóveis',
  pasta_pdf_veiculos = '/Users/vladimic/Library/Mobile Documents/com~apple~CloudDocs/PROFIT/Ademicon/Vendas/Tabelas/Veículos/Tabelas Veículos',
  pasta_pdf_servicos = '/Users/vladimic/Library/Mobile Documents/com~apple~CloudDocs/PROFIT/Ademicon/Vendas/Tabelas/Serviços/Tabelas Serviços',
  pasta_pdf_outros_bens = '/Users/vladimic/Library/Mobile Documents/com~apple~CloudDocs/PROFIT/Ademicon/Vendas/Tabelas/Outros Bens Móveis/Tabelas Outros Bens'
where id = 1;
