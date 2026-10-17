-- Dinastia · 0022: prazos de atalho do campo "Contemplação em" do simulador como parâmetro global (7 valores, em meses).
-- Carregado com os 7 valores que o simulador já usava: 1, 12, 24, 36, 48, 60 e 120. O simulador sempre lê daqui.
-- Aplicada no Supabase via MCP em 17/10/2026. Reverter: alter table parametros_gerais drop column contemplacao_prazos;
alter table parametros_gerais
  add column if not exists contemplacao_prazos int[] not null default '{1,12,24,36,48,60,120}'
  check (array_length(contemplacao_prazos, 1) = 7 and 0 < all (contemplacao_prazos) and 1000 > all (contemplacao_prazos));
comment on column parametros_gerais.contemplacao_prazos is 'Os 7 prazos (meses) que aparecem como atalhos em "Contemplação em" no simulador';
