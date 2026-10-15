-- Dinastia · 0019: INCC projetado (% ao ano) como parâmetro global, carregado com 6%.
-- O simulador lê este valor e deixa o usuário alterar só na tela (não grava de volta). Aplicada no Supabase via MCP em 15/10/2026.
-- Reverter: alter table parametros_gerais drop column incc_pct_ano;
alter table parametros_gerais add column if not exists incc_pct_ano numeric(7,4) not null default 6 check (incc_pct_ano >= 0 and incc_pct_ano <= 100);
comment on column parametros_gerais.incc_pct_ano is 'INCC projetado (% ao ano) usado no simulador; o simulador pode sobrescrever na tela';
