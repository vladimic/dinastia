-- Dinastia · 0007: pagamento com furo "não informado" passa a valer Não (padrão false, obrigatório)
-- Aplicada no Supabase via MCP em 08/10/2026 (apply_migration).
update grupo_assembleia set pagamento_com_furo = false where pagamento_com_furo is null;
alter table grupo_assembleia alter column pagamento_com_furo set default false;
alter table grupo_assembleia alter column pagamento_com_furo set not null;
comment on column grupo_assembleia.pagamento_com_furo is 'O grupo permite pagamento com furo nesta versão? true = sim, false = não (padrão)';
