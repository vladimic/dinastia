-- Dinastia · 0020: "Contemplação em (meses)" do simulador como parâmetro global (padrão 1).
-- O simulador abre com este valor e deixa o usuário alterar só na tela. Aplicada no Supabase via MCP em 15/10/2026.
-- Reverter: alter table parametros_gerais drop column contemplacao_meses;
alter table parametros_gerais add column if not exists contemplacao_meses int not null default 1 check (contemplacao_meses between 1 and 999);
comment on column parametros_gerais.contemplacao_meses is 'Mês de contemplação (em meses) com que o simulador abre; o simulador pode alterar na tela';
