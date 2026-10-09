-- Dinastia · 0009: Sorteio Cancelada passa de SOC para CAN
-- on update cascade leva a troca a grupo_modalidade, grupo_sequencia e grupo_sequencia_faixa.
-- Aplicada no Supabase via MCP em 09/10/2026. Publicar junto com o app 0019.
update tipo_contemplacao set codigo = 'CAN' where codigo = 'SOC';
