-- Dinastia · 0012: correção pontual de dados — grupo 770
-- O lance livre do grupo 770 é limitado a 72 parcelas (a tabela do PDF não traz o limite).
-- Aplica só na versão vigente (maior assembleia_numero) do grupo. Uma nova importação de PDF do 770
-- recria a modalidade a partir do PDF e perde este ajuste; reaplicar depois dela.
update grupo_modalidade m
   set max_parcelas_lance = 72
  from grupo_assembleia ga
 where m.grupo_assembleia_id = ga.id
   and ga.grupo_numero = 770
   and m.tipo = 'LIV'
   and ga.assembleia_numero = (select max(assembleia_numero) from grupo_assembleia where grupo_numero = 770);
