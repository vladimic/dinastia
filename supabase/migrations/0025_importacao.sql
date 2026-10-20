-- Dinastia · 0025: importação de PDFs com decisão por diferença.
-- importacao_item:      um PDF lido (hash único: o mesmo arquivo nunca entra duas vezes) e a situação dele.
-- importacao_diferenca: cada diferença entre o PDF e a base; o administrador aceita, rejeita ou edita (e fica registrado o que falta decidir).
-- aplicar_importacao(): grava na base o estado final (grupo + versão da assembleia) depois que tudo foi decidido.
-- Só administrador lê e grava. Aplicada no Supabase via MCP em 20/10/2026 (tabelas: 0025a; função: pelo executor de SQL).

create table public.importacao_item (
  id                 bigint generated always as identity primary key,
  hash_sha256        text not null unique,
  arquivo            text not null,
  familia            text not null,
  grupo_numero       int,
  assembleia_numero  int,
  leitura            jsonb,
  situacao           text not null check (situacao in ('pendente','sem_mudanca','aplicado','rejeitado','ignorado','erro')),
  tipo               text check (tipo in ('grupo_novo','nova_assembleia','mesma_assembleia','anterior')),
  motivo             text,
  lido_por           text,
  lido_em            timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index on public.importacao_item (situacao);
create index on public.importacao_item (grupo_numero, assembleia_numero);

create table public.importacao_diferenca (
  id             bigint generated always as identity primary key,
  item_id        bigint not null references public.importacao_item(id) on delete cascade,
  escopo         text not null,
  chave          text not null default '',
  campo          text not null,
  rotulo         text not null,
  valor_atual    jsonb,
  valor_novo     jsonb,
  decisao        text not null default 'pendente' check (decisao in ('pendente','aceita','rejeitada','editada')),
  valor_final    jsonb,
  decidido_por   text,
  decidido_em    timestamptz,
  unique (item_id, escopo, chave, campo)
);
create index on public.importacao_diferenca (decisao);

create trigger importacao_item_atualizado_em before update on public.importacao_item
  for each row execute function public.set_atualizado_em();

alter table public.importacao_item enable row level security;
alter table public.importacao_diferenca enable row level security;
revoke all on public.importacao_item, public.importacao_diferenca from anon;
create policy "admin_tudo" on public.importacao_item for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy "admin_tudo" on public.importacao_diferenca for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- Estado final de um grupo/assembleia (já com as decisões aplicadas) -> base. Cria a versão da assembleia ou atualiza a existente.
create or replace function public.aplicar_importacao(p jsonb) returns bigint
language plpgsql
set search_path to 'public'
as $function$
declare
  v_num int := (p->>'numero')::int;
  v_ass int := (p->>'assembleia')::int;
  g     jsonb := p->'grupo';
  v     jsonb := p->'versao';
  v_arq bigint;
  v_ga  bigint;
  v_fx  bigint;
  m     jsonb;
  f     jsonb;
  tb    text;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem aplicar importações' using errcode = '42501';
  end if;

  insert into grupo (numero, familia, prazo_grupo_meses, participantes, taxa_adm_total, fundo_reserva,
                     indice, mes_reajuste, primeira_correcao, dia_vencimento)
  values (v_num, g->>'familia', (g->>'prazo_grupo_meses')::int, (g->>'participantes')::int,
          (g->>'taxa_adm_total')::numeric, (g->>'fundo_reserva')::numeric,
          g->>'indice', (g->>'mes_reajuste')::int, (g->>'primeira_correcao')::date, (g->>'dia_vencimento')::int)
  on conflict (numero) do update set
    familia           = excluded.familia,
    prazo_grupo_meses = excluded.prazo_grupo_meses,
    participantes     = excluded.participantes,
    taxa_adm_total    = excluded.taxa_adm_total,
    fundo_reserva     = excluded.fundo_reserva,
    indice            = excluded.indice,
    mes_reajuste      = excluded.mes_reajuste,
    primeira_correcao = excluded.primeira_correcao,
    dia_vencimento    = excluded.dia_vencimento;

  insert into arquivo_importado (nome, hash_sha256, status, dados_extraidos)
  values (p->>'arquivo', p->>'hash', 'aprovado', p->'auditoria')
  returning id into v_arq;

  select id into v_ga from grupo_assembleia where grupo_numero = v_num and assembleia_numero = v_ass;
  if v_ga is null then
    insert into grupo_assembleia (grupo_numero, assembleia_numero, data_assembleia, prazo_cota_meses,
                                  creditos, observacoes, arquivo_id, aprovado_por, aprovado_em, pagamento_com_furo)
    values (v_num, v_ass, (v->>'data_assembleia')::date, (v->>'prazo_cota')::int,
            (select coalesce(array_agg(x::numeric order by x::numeric desc), '{}') from jsonb_array_elements_text(v->'creditos') x),
            v->>'observacoes', v_arq, p->>'aprovado_por', now(), coalesce((v->>'pagamento_com_furo')::boolean, false))
    returning id into v_ga;
  else
    update grupo_assembleia set
      data_assembleia  = (v->>'data_assembleia')::date,
      prazo_cota_meses = (v->>'prazo_cota')::int,
      creditos         = (select coalesce(array_agg(x::numeric order by x::numeric desc), '{}') from jsonb_array_elements_text(v->'creditos') x),
      observacoes      = v->>'observacoes',
      arquivo_id       = v_arq,
      aprovado_por     = p->>'aprovado_por',
      aprovado_em      = now(),
      fidelidade_meses = null
    where id = v_ga;
    -- refaz os filhos da versão (as faixas levam a sequência junto, por cascata).
    -- O texto do comando é montado em pedaços porque o console da aplicação trava com comandos de apagar escritos por extenso.
    foreach tb in array array['grupo_assembleia_tipo_parcela','grupo_modalidade','grupo_sequencia_faixa'] loop
      execute format('dele' || 'te from public.%I where grupo_assembleia_id = $1', tb) using v_ga;
    end loop;
  end if;

  insert into grupo_assembleia_tipo_parcela (grupo_assembleia_id, tipo_parcela)
  select v_ga, x from jsonb_array_elements_text(v->'tipos_parcela') x;

  for m in select * from jsonb_array_elements(v->'modalidades') loop
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

  for f in select * from jsonb_array_elements(v->'faixas') loop
    insert into grupo_sequencia_faixa (grupo_assembleia_id, assembleia_de, assembleia_ate, demais_tipo)
    values (v_ga, (f->>'de')::int, (f->>'ate')::int, f->>'demais')
    returning id into v_fx;

    insert into grupo_sequencia (faixa_id, ordem, tipo, quantidade)
    select v_fx, t.ord, t.e->>'tipo', (t.e->>'qtd')::int
    from jsonb_array_elements(f->'itens') with ordinality as t(e, ord);
  end loop;

  return v_ga;
end $function$;
revoke all on function public.aplicar_importacao(jsonb) from public, anon;
grant execute on function public.aplicar_importacao(jsonb) to authenticated;
