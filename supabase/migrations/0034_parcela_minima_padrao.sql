-- Dinastia · 0034: parcela mínima padrão de veículos em Parâmetros globais (aplicada no Supabase em 31/10/2026).
alter table public.parametros_gerais
  add column parcela_minima_padrao_pct numeric not null default 0.7 check (parcela_minima_padrao_pct > 0 and parcela_minima_padrao_pct <= 100);
comment on column public.parametros_gerais.parcela_minima_padrao_pct is 'Veículos: parcela mínima após a contemplação por lance (% do crédito) usada quando o PDF do grupo não informa a sua (padrão 0,7).';
