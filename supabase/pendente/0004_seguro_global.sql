-- PENDENTE: NÃO aplicada no banco (aguardando decisão: apagar a coluna ou só deixar de usar).
-- Dinastia · 0004: seguro prestamista passa a ser só parâmetro global (parametros_gerais.seguro_padrao_pct)
-- O % lido de cada PDF continua guardado na auditoria da importação (arquivo_importado.dados_extraidos).

drop view if exists grupo_atual;

alter table grupo drop column seguro_pct_mes;

create view grupo_atual with (security_invoker = true) as
select distinct on (g.numero)
  g.*,
  ga.id                 as grupo_assembleia_id,
  ga.assembleia_numero,
  ga.data_assembleia,
  ga.prazo_cota_meses,
  ga.creditos
from grupo g
join grupo_assembleia ga on ga.grupo_numero = g.numero
order by g.numero, ga.assembleia_numero desc;

comment on column parametros_gerais.seguro_padrao_pct is 'Seguro prestamista (% do crédito ao mês) usado em todos os grupos';

create or replace function public.importar_grupo(p jsonb) returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_num  int := (p->>'numero')::int;
  v_ass  int := (p->>'assembleia')::int;
  v_arq  bigint;
  v_ga   bigint;
  v_fx   bigint;
  m      jsonb;
  f      jsonb;
begin
  if exists (select 1 from grupo_assembleia where grupo_numero = v_num and assembleia_numero = v_ass) then
    raise exception 'Grupo % já tem a %ª assembleia importada', v_num, v_ass using errcode = 'unique_violation';
  end if;

  insert into grupo (numero, familia, prazo_grupo_meses, participantes, taxa_adm_total,
                     indice, mes_reajuste, primeira_correcao, dia_vencimento)
  values (v_num, p->>'familia', (p->>'prazo_grupo')::int, (p->>'participantes')::int,
          (p->>'taxa_adm')::numeric,
          p->>'indice', (p->>'mes_reajuste')::int, (p->>'primeira_correcao')::date,
          (p->>'vencimento')::int)
  on conflict (numero) do update set
    familia           = excluded.familia,
    prazo_grupo_meses = excluded.prazo_grupo_meses,
    participantes     = excluded.participantes,
    taxa_adm_total    = excluded.taxa_adm_total,
    indice            = excluded.indice,
    mes_reajuste      = excluded.mes_reajuste,
    primeira_correcao = excluded.primeira_correcao,
    dia_vencimento    = excluded.dia_vencimento;

  insert into arquivo_importado (nome, hash_sha256, status, dados_extraidos)
  values (p->>'arquivo', p->>'hash', 'aprovado', p->'auditoria')
  returning id into v_arq;

  insert into grupo_assembleia (grupo_numero, assembleia_numero, data_assembleia, prazo_cota_meses,
                                creditos, observacoes, arquivo_id, aprovado_por, aprovado_em)
  values (v_num, v_ass, (p->>'data_assembleia')::date, (p->>'prazo_cota')::int,
          (select coalesce(array_agg(x::numeric order by x::numeric desc), '{}')
             from jsonb_array_elements_text(p->'creditos') x),
          p->>'observacoes', v_arq, coalesce(p->>'aprovado_por', 'importação'), now())
  returning id into v_ga;

  insert into grupo_assembleia_tipo_parcela (grupo_assembleia_id, tipo_parcela)
  select v_ga, x from jsonb_array_elements_text(p->'tipos_parcela') x;

  for m in select * from jsonb_array_elements(p->'modalidades') loop
    insert into grupo_modalidade (grupo_assembleia_id, tipo, max_parcelas_lance, pct_categoria,
      embutido_max_parcelas, embutido_base, embutido_pct, recurso_proprio_obrig,
      a_partir_assembleia_cota, requisitos, transferivel, embutido_texto)
    values (v_ga, m->>'tipo', (m->>'max')::int, (m->>'pct_cat')::numeric,
      (m->>'emb_parc')::int, m->>'emb_base', (m->>'emb_pct')::numeric, (m->>'rec_proprio')::boolean,
      coalesce((m->>'a_partir')::int, 1), m->>'req', coalesce((m->>'transf')::boolean, true), m->>'emb_texto');
  end loop;

  for f in select * from jsonb_array_elements(p->'faixas') loop
    insert into grupo_sequencia_faixa (grupo_assembleia_id, assembleia_de, assembleia_ate, demais_tipo)
    values (v_ga, (f->>'de')::int, (f->>'ate')::int, f->>'demais')
    returning id into v_fx;

    insert into grupo_sequencia (faixa_id, ordem, tipo, quantidade)
    select v_fx, t.ord, t.e->>'tipo', (t.e->>'qtd')::int
    from jsonb_array_elements(f->'itens') with ordinality as t(e, ord);
  end loop;

  return v_ga;
end $$;

-- roda com as permissões de quem chama (RLS vale); anônimo não executa
revoke all on function public.importar_grupo(jsonb) from public, anon;
grant execute on function public.importar_grupo(jsonb) to authenticated;
