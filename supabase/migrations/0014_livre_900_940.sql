-- Dinastia · 0014: correção de dados — lance livre dos grupos 900 e 940
-- O Livre dos dois grupos trazia a regra do Fixo ("embutir 44 parcelas (100% do valor ofertado)", embutido 100%),
-- copiada na importação. O lance livre desses grupos não tem embutido (0%), como na Tabela Resumo.
-- Embutido nulo e texto no padrão das demais modalidades sem embutido (o texto é a redação padrão, não a literal do PDF).
-- Aplicada no Supabase via MCP em 15/10/2026. Reverter: embutido_pct = 100, embutido_base = 'ofertado',
-- embutido_max_parcelas = 44, embutido_texto = 'permitido descontar (embutir) 44 parcelas (100% do valor ofertado)'.
update grupo_modalidade m
   set embutido_pct = null,
       embutido_base = null,
       embutido_max_parcelas = null,
       embutido_texto = '100% do lance deve ser pago com recursos próprios'
  from grupo_assembleia ga
 where m.grupo_assembleia_id = ga.id
   and ga.grupo_numero in (900, 940)
   and m.tipo = 'LIV'
   and m.embutido_texto = 'permitido descontar (embutir) 44 parcelas (100% do valor ofertado)';
