-- Dinastia · 0008: mês em que o lance fidelidade libera (grupo_assembleia.fidelidade_meses)
-- Valor = "CONCORREM NA {n}ª ASSEMBLEIA DA COTA" do PDF, já gravado em grupo_modalidade.a_partir_assembleia_cota (tipo FID).
-- Nulo = o grupo não oferece fidelidade (ou o PDF não informa). Aplicada no Supabase via MCP em 09/10/2026.

alter table grupo_assembleia add column fidelidade_meses int check (fidelidade_meses > 1);
comment on column grupo_assembleia.fidelidade_meses is 'Mês (assembleia da cota) a partir do qual o lance fidelidade libera; nulo = sem fidelidade ou não informado';

-- carga inicial a partir do que já foi lido dos PDFs
update grupo_assembleia ga
   set fidelidade_meses = m.a_partir_assembleia_cota
  from grupo_modalidade m
 where m.grupo_assembleia_id = ga.id and m.tipo = 'FID' and m.a_partir_assembleia_cota > 1;

-- importar_grupo passa a gravar o campo nas próximas cargas
create or replace function public.importar_grupo(p jsonb) returns bigint
language plpgsql
set search_path to 'public'
as $function$
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

    if m->>'tipo' = 'FID' and coalesce((m->>'a_partir')::int, 1) > 1 then
      update grupo_assembleia set fidelidade_meses = (m->>'a_partir')::int where id = v_ga;
    end if;
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
end $function$;
