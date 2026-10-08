-- Dinastia · 0004: seguro prestamista passa a ser só parâmetro global (parametros_gerais.seguro_padrao_pct).
-- O % lido de cada PDF continua na auditoria da importação (arquivo_importado.dados_extraidos).
-- Aplicada em duas partes: (a) função importar_grupo sem seguro, via MCP;
-- (b) parte destrutiva abaixo, rodada pelo Vladi no editor SQL do Supabase.

drop view if exists grupo_atual;
alter table grupo drop column seguro_pct_mes;
create view grupo_atual with (security_invoker = true) as
select distinct on (g.numero) g.*, ga.id as grupo_assembleia_id, ga.assembleia_numero,
       ga.data_assembleia, ga.prazo_cota_meses, ga.creditos
from grupo g
join grupo_assembleia ga on ga.grupo_numero = g.numero
order by g.numero, ga.assembleia_numero desc;

comment on column parametros_gerais.seguro_padrao_pct is 'Seguro prestamista (% do crédito ao mês) usado em todos os grupos';
-- função importar_grupo: ver migração 0004a (mesmo corpo da 0003 sem seguro_pct_mes)
