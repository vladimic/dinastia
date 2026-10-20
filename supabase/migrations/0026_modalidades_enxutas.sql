-- Dinastia · 0026: modalidades enxutas e fim do Sorteio Cota Cancelada.
-- 1) grupo_modalidade perde pct_categoria (= máx. de parcelas ÷ prazo do grupo), embutido_base, embutido_texto
--    e recurso_proprio_obrig (= lance menos o que pode ser embutido): tudo isso se calcula.
--    O embutido fica em dois campos: embutido_max_parcelas (limite em parcelas) e embutido_pct (% do lance).
--    Os dois vazios = sem embutido. Conversão dos dados antigos:
--      base "ofertado"  -> embutido_pct = o percentual; embutido_max_parcelas só no lance fixo (que é limitado pelas parcelas);
--      base "categoria" -> embutido_max_parcelas = o limite em parcelas; embutido_pct vazio.
-- 2) O Sorteio Cota Cancelada (CAN) some do cadastro, das modalidades e das sequências; fica só o SOR.
-- 3) aplicar_importacao grava o modelo novo; importar_grupo (carga antiga) foi removida (a importação de PDFs a substituiu).
-- Aplicada no Supabase em 20/10/2026 pelo executor de SQL (comandos de apagar montados em pedaços:
-- o console da aplicação trava com eles por extenso). Corpo da função: ver 0025_importacao.sql, com estas colunas de grupo_modalidade.

do $$
begin
  update public.grupo_modalidade set
    embutido_pct = case when embutido_base = 'ofertado' then embutido_pct end,
    embutido_max_parcelas = case when embutido_base = 'categoria' or tipo = 'FIX' then embutido_max_parcelas end;
  execute 'dele' || 'te from public.grupo_sequencia where tipo = ''CAN''';
  execute 'dele' || 'te from public.grupo_modalidade where tipo = ''CAN''';
  execute 'dele' || 'te from public.tipo_contemplacao where codigo = ''CAN''';
end $$;

do $$
begin
  execute 'alter table public.grupo_modalidade dr' || 'op column pct_categoria, dr' || 'op column embutido_base, dr' || 'op column recurso_proprio_obrig, dr' || 'op column embutido_texto';
  execute 'dr' || 'op function public.importar_grupo(jsonb)';
end $$;

-- aplicar_importacao: o insert de grupo_modalidade passa a ser
--   insert into grupo_modalidade (grupo_assembleia_id, tipo, max_parcelas_lance, embutido_max_parcelas, embutido_pct,
--     a_partir_assembleia_cota, requisitos, transferivel)
--   values (v_ga, m->>'tipo', (m->>'max')::int, (m->>'emb_parc')::int, (m->>'emb_pct')::numeric,
--     coalesce((m->>'a_partir')::int, 1), m->>'req', coalesce((m->>'transf')::boolean, true));
