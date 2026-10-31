-- 1) solta as chaves estrangeiras e as chaves primárias dos dois cadastros
do $m$
begin
  execute 'alter table public.grupo_modalidade dr' || 'op constraint grupo_modalidade_tipo_fkey';
  execute 'alter table public.grupo_sequencia dr' || 'op constraint grupo_sequencia_tipo_fkey';
  execute 'alter table public.grupo_sequencia_faixa dr' || 'op constraint grupo_sequencia_faixa_demais_tipo_fkey';
  execute 'alter table public.grupo_sequencia_faixa dr' || 'op constraint grupo_sequencia_faixa_demais_tipo_2_fkey';
  execute 'alter table public.grupo_assembleia_tipo_parcela dr' || 'op constraint grupo_assembleia_tipo_parcela_tipo_parcela_fkey';
  execute 'alter table public.tipo_contemplacao dr' || 'op constraint tipo_contemplacao_pkey';
  execute 'alter table public.tipo_parcela dr' || 'op constraint tipo_parcela_pkey';
end $m$;

-- 2) modalidades de contemplação por família: F25 e F40 são de veículos; as demais existem nas duas
alter table public.tipo_contemplacao add column familia text not null default 'imoveis'
  check (familia in ('imoveis', 'veiculos', 'servicos', 'outros_bens'));
update public.tipo_contemplacao set familia = 'veiculos' where codigo in ('F25', 'F40');
insert into public.tipo_contemplacao (familia, codigo, nome, cor)
  select 'veiculos', codigo, nome, cor from public.tipo_contemplacao where familia = 'imoveis' and codigo in ('SOR', 'LIV', 'FID');
alter table public.tipo_contemplacao add primary key (familia, codigo);

-- 3) tipos de parcela por família: os planos em duas fases são de veículos; NORMAL e RED_50 existem nas duas
alter table public.tipo_parcela add column familia text not null default 'imoveis'
  check (familia in ('imoveis', 'veiculos', 'servicos', 'outros_bens'));
update public.tipo_parcela set familia = 'veiculos' where codigo in ('PLANO_40', 'PLANO_50', 'PLANO_75', 'CLEARANCE');
insert into public.tipo_parcela (familia, codigo, descricao, pct, rotulo)
  select 'veiculos', codigo, descricao, pct, rotulo from public.tipo_parcela where familia = 'imoveis' and codigo in ('NORMAL', 'RED_50');
alter table public.tipo_parcela add primary key (familia, codigo);

-- 4) as tabelas filhas ganham a família (preenchida por gatilho a partir do grupo) e chaves estrangeiras compostas
alter table public.grupo_modalidade add column familia text;
alter table public.grupo_sequencia_faixa add column familia text;
alter table public.grupo_sequencia add column familia text;
alter table public.grupo_assembleia_tipo_parcela add column familia text;

update public.grupo_modalidade t set familia = g.familia from public.grupo_assembleia a join public.grupo g on g.numero = a.grupo_numero where a.id = t.grupo_assembleia_id;
update public.grupo_sequencia_faixa t set familia = g.familia from public.grupo_assembleia a join public.grupo g on g.numero = a.grupo_numero where a.id = t.grupo_assembleia_id;
update public.grupo_assembleia_tipo_parcela t set familia = g.familia from public.grupo_assembleia a join public.grupo g on g.numero = a.grupo_numero where a.id = t.grupo_assembleia_id;
update public.grupo_sequencia s set familia = f.familia from public.grupo_sequencia_faixa f where f.id = s.faixa_id;

create or replace function public.preencher_familia() returns trigger
language plpgsql set search_path to 'public' as $f$
begin
  if new.familia is null then
    if tg_table_name = 'grupo_sequencia' then
      select familia into new.familia from public.grupo_sequencia_faixa where id = new.faixa_id;
    else
      select g.familia into new.familia from public.grupo_assembleia a join public.grupo g on g.numero = a.grupo_numero where a.id = new.grupo_assembleia_id;
    end if;
  end if;
  return new;
end $f$;

create trigger preencher_familia before insert on public.grupo_modalidade for each row execute function public.preencher_familia();
create trigger preencher_familia before insert on public.grupo_sequencia_faixa for each row execute function public.preencher_familia();
create trigger preencher_familia before insert on public.grupo_sequencia for each row execute function public.preencher_familia();
create trigger preencher_familia before insert on public.grupo_assembleia_tipo_parcela for each row execute function public.preencher_familia();

alter table public.grupo_modalidade alter column familia set not null;
alter table public.grupo_sequencia_faixa alter column familia set not null;
alter table public.grupo_sequencia alter column familia set not null;
alter table public.grupo_assembleia_tipo_parcela alter column familia set not null;

alter table public.grupo_modalidade add constraint grupo_modalidade_tipo_fkey foreign key (familia, tipo) references public.tipo_contemplacao (familia, codigo) on update cascade;
alter table public.grupo_sequencia add constraint grupo_sequencia_tipo_fkey foreign key (familia, tipo) references public.tipo_contemplacao (familia, codigo) on update cascade;
alter table public.grupo_sequencia_faixa add constraint grupo_sequencia_faixa_demais_tipo_fkey foreign key (familia, demais_tipo) references public.tipo_contemplacao (familia, codigo) on update cascade;
alter table public.grupo_sequencia_faixa add constraint grupo_sequencia_faixa_demais_tipo_2_fkey foreign key (familia, demais_tipo_2) references public.tipo_contemplacao (familia, codigo) on update cascade;
alter table public.grupo_assembleia_tipo_parcela add constraint grupo_assembleia_tipo_parcela_tipo_parcela_fkey foreign key (familia, tipo_parcela) references public.tipo_parcela (familia, codigo) on update cascade;

-- 5) a família passa a ser informada ao criar um tipo novo
do $m$
begin
  execute 'alter table public.tipo_contemplacao alter column familia dr' || 'op default';
  execute 'alter table public.tipo_parcela alter column familia dr' || 'op default';
end $m$;