-- Parâmetros globais: contemplação em X meses e os 7 prazos de atalho, separados por família (imóveis e veículos).
-- Os valores atuais são copiados para veículos.
alter table public.parametros_gerais add column if not exists contemplacao_meses_veic int not null default 1 check (contemplacao_meses_veic between 1 and 999);
alter table public.parametros_gerais add column if not exists contemplacao_prazos_veic int[] not null default '{1,12,24,36,48,60,120}';
update public.parametros_gerais set contemplacao_meses_veic = contemplacao_meses, contemplacao_prazos_veic = contemplacao_prazos where id = 1;
comment on column public.parametros_gerais.contemplacao_meses is 'Imóveis: mês de contemplação com que o simulador abre.';
comment on column public.parametros_gerais.contemplacao_prazos is 'Imóveis: os 7 prazos (em meses) que aparecem como atalhos no campo “Contemplação em” do simulador.';
comment on column public.parametros_gerais.contemplacao_meses_veic is 'Veículos: mês de contemplação com que o simulador abre.';
comment on column public.parametros_gerais.contemplacao_prazos_veic is 'Veículos: os 7 prazos (em meses) que aparecem como atalhos no campo “Contemplação em” do simulador.';
