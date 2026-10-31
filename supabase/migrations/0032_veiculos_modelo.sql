-- Dinastia · 0032: modelo para os grupos de veículos (aplicada no Supabase em 31/10/2026).
-- Dois lances fixos em % da categoria (F40 e F25, com as cores do Limitado e do Fixo), teto do livre,
-- base do embutido, parcela mínima do grupo e plano reduzido em duas fases.
insert into public.tipo_contemplacao (codigo, nome, cor) values
  ('F25', 'Lance Fixo 25%', '#2F6FDE'),
  ('F40', 'Lance Fixo 40%', '#F28C28');

alter table public.grupo_modalidade
  add column lance_pct numeric check (lance_pct > 0 and lance_pct <= 100),
  add column max_lance_pct numeric check (max_lance_pct > 0 and max_lance_pct <= 100),
  add column embutido_base text not null default 'lance' check (embutido_base in ('lance', 'categoria'));

alter table public.grupo
  add column parcela_minima_pct numeric check (parcela_minima_pct > 0 and parcela_minima_pct <= 100);

alter table public.tipo_parcela add column rotulo text;
insert into public.tipo_parcela (codigo, descricao, pct, rotulo) values
  ('PLANO_40', 'Plano reduzido 40 (duas fases)', 40, 'Plano 40'),
  ('PLANO_50', 'Plano reduzido 50 (duas fases)', 50, 'Plano 50'),
  ('PLANO_75', 'Plano reduzido 75 (duas fases)', 75, 'Plano 75'),
  ('CLEARANCE', 'Plano reduzido Clearance (duas fases)', 99, 'Clearance');

alter table public.grupo_assembleia_tipo_parcela
  add column fase1_pct numeric check (fase1_pct > 0 and fase1_pct < 100),
  add column fase1_parcelas integer check (fase1_parcelas > 0),
  add column fase2_parcelas integer check (fase2_parcelas > 0),
  add constraint fases_completas check ((fase1_pct is null) = (fase1_parcelas is null) and (fase1_pct is null) = (fase2_parcelas is null));
-- (comentários das colunas: ver src/lib/dicionarioDados.ts / 0027)
