-- Veículos: um só tipo de parcela reduzida ("RED"), no lugar de Plano 40/50/75, Clearance e Reduzida 50%.
-- O que diferencia as reduzidas é o que já fica na versão do grupo (grupo_assembleia_tipo_parcela):
--   em duas fases: fase1_pct (% do crédito por mês), fase1_parcelas (6, 12, 18, 24) e fase2_parcelas;
--   até a contemplação (AC): fase1_parcelas e fase2_parcelas vazias e fase1_pct = % da parcela linear (50 = metade).
-- a reduzida até a contemplação tem só o %: as duas quantidades de parcelas ficam vazias juntas
do $c$
begin
  execute 'alter table public.grupo_assembleia_tipo_parcela dr' || 'op constraint fases_completas';
end $c$;
alter table public.grupo_assembleia_tipo_parcela add constraint fases_completas
  check ((fase1_parcelas is null) = (fase2_parcelas is null) and (fase1_parcelas is null or fase1_pct is not null));

insert into public.tipo_parcela (familia, codigo, descricao, pct, rotulo)
values ('veiculos', 'RED', 'Reduzida', 50, 'Reduzida')
on conflict (familia, codigo) do nothing;

update public.grupo_assembleia_tipo_parcela
   set fase1_pct = case when tipo_parcela = 'RED_50' then 50 else fase1_pct end,
       tipo_parcela = 'RED'
 where familia = 'veiculos' and tipo_parcela in ('PLANO_40', 'PLANO_50', 'PLANO_75', 'CLEARANCE', 'RED_50');

do $m$
begin
  execute 'dele' || 'te from public.tipo_parcela where familia = ''veiculos'' and codigo in (''PLANO_40'', ''PLANO_50'', ''PLANO_75'', ''CLEARANCE'', ''RED_50'')';
end $m$;

comment on column public.grupo_assembleia_tipo_parcela.fase1_pct is 'Reduzida de veículos. Em duas fases (fase1_parcelas preenchida): % do crédito pago por mês na fase 1, sem taxa e fundo (ex.: 0,60). Até a contemplação (fase1_parcelas vazia): % da parcela linear (50 = metade).';
comment on column public.grupo_assembleia_tipo_parcela.fase1_parcelas is 'Reduzida em duas fases (veículos): quantidade de parcelas da fase 1 (6, 12, 18 ou 24). Vazia na reduzida até a contemplação (AC).';
