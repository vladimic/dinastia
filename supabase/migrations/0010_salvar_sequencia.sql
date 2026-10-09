-- Dinastia · 0010: salvar_sequencia — troca, numa transação só, as faixas de sequência de uma versão.
-- Roda com as permissões de quem chama (RLS vale); versão inexistente falha na chave estrangeira.
-- O mês de liberação do fidelidade (grupo_assembleia.fidelidade_meses) é gravado pelo app logo depois.
-- Aplicada no Supabase via MCP (execute_sql) em 09/10/2026: o apply_migration travou com este corpo.
create or replace function public.salvar_sequencia(p jsonb) returns void
language plpgsql
set search_path to 'public'
as $f$
declare
  v_id bigint := (p->>'versao_id')::bigint;
  f    jsonb;
  v_fx bigint;
begin
  delete from grupo_sequencia_faixa where grupo_assembleia_id = v_id;  -- grupo_sequencia sai junto (cascade)
  for f in select * from jsonb_array_elements(p->'faixas') loop
    insert into grupo_sequencia_faixa (grupo_assembleia_id, assembleia_de, assembleia_ate, demais_tipo)
    values (v_id, (f->>'de')::int, (f->>'ate')::int, f->>'demais') returning id into v_fx;
    insert into grupo_sequencia (faixa_id, ordem, tipo, quantidade)
    select v_fx, t.ord, t.e->>'tipo', (t.e->>'qtd')::int
    from jsonb_array_elements(f->'itens') with ordinality as t(e, ord);
  end loop;
end $f$;

revoke execute on function public.salvar_sequencia(jsonb) from public, anon;
grant execute on function public.salvar_sequencia(jsonb) to authenticated;
