-- Dinastia · 0018: fundo de reserva dos imóveis = 0% (regra: sempre 0%, salvo se o PDF do grupo disser outro valor)
-- 1) grupos de imóveis sem fundo informado passam a 0% (o que já tinha valor é preservado);
-- 2) importar_grupo passa a aceitar "fundo_reserva" no JSON e, sem ele, grava 0 para imóveis (nulo nas outras famílias).
--    Num grupo que já existe, edição manual anterior não é sobrescrita quando o PDF não traz o campo.
update grupo set fundo_reserva = 0 where familia = 'imoveis' and fundo_reserva is null;

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
  v_fr   numeric := coalesce((p->>'fundo_reserva')::numeric, case when p->>'familia' = 'imoveis' then 0 end);
begin
  if exists (select 1 from grupo_assembleia where grupo_numero = v_num and assembleia_numero = v_ass) then
    raise exception 'Grupo % já tem a %ª assembleia importada', v_num, v_ass using errcode = 'unique_violation';
  end if;

  insert into grupo (numero, familia, prazo_grupo_meses, participantes, taxa_adm_total, fundo_reserva,
                     indice, mes_reajuste, primeira_correcao, dia_vencimento)
  values (v_num, p->>'familia', (p->>'prazo_grupo')::int, (p->>'participantes')::int,
          (p->>'taxa_adm')::numeric, v_fr,
          p->>'indice', (p->>'mes_reajuste')::int, (p->>'primeira_correcao')::date,
          (p->>'vencimento')::int)
  on conflict (numero) do update set
    familia           = excluded.familia,
    prazo_grupo_meses = excluded.prazo_grupo_meses,
    participantes     = excluded.participantes,
    taxa_adm_total    = excluded.taxa_adm_total,
    fundo_reserva     = case when p ? 'fundo_reserva' then excluded.fundo_reserva
                             else coalesce(grupo.fundo_reserva, excluded.fundo_reserva) end,
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
