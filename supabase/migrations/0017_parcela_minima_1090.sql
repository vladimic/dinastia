-- Dinastia · 0017: menor parcela do grupo 1090 conforme a Tabela Resumo (PDF de 17/09/2026)
-- O 1090 tinha Normal + Reduzida 55%; o resumo diz 50 na coluna Par: a Reduzida 55% vira Reduzida 50%.
-- Vale só para a versão vigente. Aplicada no Supabase via MCP em 15/10/2026.
-- Reverter: trocar RED_50 por RED_55 no grupo_assembleia_id 9.
--
-- PENDENTE (não aplicada): nos grupos 780, 840, 930, 960, 970, 1010, 1020, 1040, 1050, 1060, 1070, 1080 e 1110 o resumo
-- diz 100 (só parcela integral) e o banco tem Normal + Reduzida 50%. Falta tirar a Reduzida 50% desses 13 grupos:
--   delete from grupo_assembleia_tipo_parcela where tipo_parcela = 'RED_50'
--     and grupo_assembleia_id in (3, 41, 7, 50, 51, 55, 56, 58, 59, 60, 8, 61, 63);
-- (ids das versões vigentes; o DELETE não completou pela conexão usada, ver mensagem da entrega)
update grupo_assembleia_tipo_parcela
   set tipo_parcela = 'RED_50'
 where grupo_assembleia_id = 9 and tipo_parcela = 'RED_55';
