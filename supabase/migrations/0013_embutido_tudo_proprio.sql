-- Dinastia · 0013: correção de dados — embutido nas regras "100% com recursos próprios"
-- Quatro modalidades (FID e LIV dos grupos 540 e 690) tinham embutido_pct = 100 (base ofertado, 60 parcelas)
-- embora a regra literal do PDF diga "100% do lance deve ser pago com recursos próprios", ou seja, sem embutido.
-- Passam ao padrão das demais linhas sem embutido (pct, base e parcelas nulos), como no grupo 770.
-- Aplicada no Supabase via MCP em 15/10/2026. Reverter: embutido_pct = 100, embutido_base = 'ofertado', embutido_max_parcelas = 60.
update grupo_modalidade
   set embutido_pct = null, embutido_base = null, embutido_max_parcelas = null
 where embutido_texto ~* 'recursos próprios'
   and embutido_texto !~* 'permitido descontar'
   and embutido_pct is not null;
