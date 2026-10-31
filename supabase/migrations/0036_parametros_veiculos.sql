-- Dinastia · 0036: parâmetros de veículos separados dos de imóveis (aplicada no Supabase em 31/10/2026).
-- INPC projetado (padrão 5%) e a concorrência dos lances de veículos (Fixo 25%, Fixo 40%, Livre e Fidelidade).
alter table public.parametros_gerais
  add column inpc_pct_ano numeric not null default 5 check (inpc_pct_ano >= 0 and inpc_pct_ano <= 100),
  add column concorrencia_veic_fixo25_pct numeric not null default 25 check (concorrencia_veic_fixo25_pct >= 0 and concorrencia_veic_fixo25_pct <= 100),
  add column concorrencia_veic_fixo40_pct numeric not null default 10 check (concorrencia_veic_fixo40_pct >= 0 and concorrencia_veic_fixo40_pct <= 100),
  add column concorrencia_veic_livre_pct numeric not null default 3 check (concorrencia_veic_livre_pct >= 0 and concorrencia_veic_livre_pct <= 100),
  add column concorrencia_veic_fidelidade_pct numeric not null default 2 check (concorrencia_veic_fidelidade_pct >= 0 and concorrencia_veic_fidelidade_pct <= 100);
-- (comentários das colunas: ver src/lib/dicionarioDados.ts / 0027)
