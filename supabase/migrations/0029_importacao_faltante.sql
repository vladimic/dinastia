-- Dinastia · 0029: grupos sem PDF na leitura da pasta.
-- Quando um grupo não vem na leitura, o administrador escolhe: esperar o PDF (esta tabela guarda a escolha)
-- ou fazer o salto automático de assembleia (grava uma nova versão igual à anterior, sem tabela própria).
-- Aplicada no Supabase via executor de SQL em 21/10/2026.
create table public.importacao_faltante (
  grupo_numero  int primary key references public.grupo(numero) on delete cascade,
  decisao       text not null check (decisao in ('aguardando_pdf')),
  data_ref      date not null,
  decidido_por  text,
  decidido_em   timestamptz not null default now()
);
alter table public.importacao_faltante enable row level security;
revoke all on public.importacao_faltante from anon;
create policy "admin_tudo" on public.importacao_faltante for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));
-- (comentários da tabela e dos campos: ver 0027 / src/lib/dicionarioDados.ts)
