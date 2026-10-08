-- Dinastia · 0006: "Pagamento com furo" por versão do grupo (sim / não / não informado)
-- Nulo = ainda não informado. Coluna no final de grupo_assembleia.
-- Aplicada no Supabase via MCP em 08/10/2026 (apply_migration).
alter table grupo_assembleia add column pagamento_com_furo boolean;
comment on column grupo_assembleia.pagamento_com_furo is 'O grupo permite pagamento com furo nesta versão? true = sim, false = não, null = não informado';
