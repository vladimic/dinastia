-- Veículos: o embutido dos lances fixos (F25/F40) passa a ser sempre % da categoria
-- (ex.: 50% de um lance de 25% = 12,5% da categoria).
update public.grupo_modalidade m
   set embutido_pct = round(m.embutido_pct * m.lance_pct / 100, 4), embutido_base = 'categoria'
  from public.grupo_assembleia a
  join public.grupo g on g.numero = a.grupo_numero
 where a.id = m.grupo_assembleia_id and g.familia = 'veiculos'
   and m.tipo in ('F25', 'F40') and m.embutido_base = 'lance'
   and m.embutido_pct is not null and m.lance_pct is not null;
