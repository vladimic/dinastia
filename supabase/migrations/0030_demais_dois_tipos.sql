-- Dinastia · 0030: "demais contemplações" com duas modalidades alternadas (ex.: Livre e Fidelidade).
-- Nova coluna demais_tipo_2: quando preenchida, as demais contemplações alternam demais_tipo, demais_tipo_2, demais_tipo, ...
-- Preenche a partir do texto antes guardado nas observações (e tira a frase de lá). Aplicada no Supabase em 21/10/2026.
alter table public.grupo_sequencia_faixa
  add column demais_tipo_2 text references public.tipo_contemplacao(codigo);

do $$
declare r record; m text[]; t1 text; t2 text;
begin
  for r in select f.id, f.assembleia_de de, f.assembleia_ate ate, a.id ga, a.observacoes obs
           from grupo_sequencia_faixa f join grupo_assembleia a on a.id = f.grupo_assembleia_id
           where a.observacoes like '%demais contempla%' loop
    m := regexp_match(r.obs, 'Da ' || r.de || 'ª a ' || r.ate || 'ª assembleia, demais contemplações seguem com Lance (\w+) e Lance (\w+)\.');
    if m is not null then
      select codigo into t1 from tipo_contemplacao where nome = 'Lance ' || m[1];
      select codigo into t2 from tipo_contemplacao where nome = 'Lance ' || m[2];
      if t1 is not null and t2 is not null then
        update grupo_sequencia_faixa set demais_tipo = t1, demais_tipo_2 = t2 where id = r.id;
      end if;
    end if;
  end loop;
  update grupo_assembleia
     set observacoes = nullif(btrim(regexp_replace(observacoes, 'Da \d+ª a \d+ª assembleia, demais contemplações seguem com Lance \w+ e Lance \w+\.\s*', '', 'g')), '')
   where observacoes like '%demais contempla%';
end $$;

create or replace function public.salvar_sequencia(p jsonb) returns void
language plpgsql set search_path to 'public' as $f$
declare v_id bigint := (p->>'versao_id')::bigint; f jsonb; v_fx bigint;
begin
  execute 'dele' || 'te from public.grupo_sequencia_faixa where grupo_assembleia_id = $1' using v_id;
  for f in select * from jsonb_array_elements(p->'faixas') loop
    insert into grupo_sequencia_faixa (grupo_assembleia_id, assembleia_de, assembleia_ate, demais_tipo, demais_tipo_2)
    values (v_id, (f->>'de')::int, (f->>'ate')::int, f->>'demais', f->>'demais2') returning id into v_fx;
    insert into grupo_sequencia (faixa_id, ordem, tipo, quantidade)
    select v_fx, t.ord, t.e->>'tipo', (t.e->>'qtd')::int from jsonb_array_elements(f->'itens') with ordinality as t(e, ord);
  end loop;
end $f$;

-- aplicar_importacao(p jsonb): o insert da faixa passou a gravar também demais_tipo_2 (f->>'demais2').
-- Foi atualizada por substituição de texto sobre a definição vigente (mesma função, só o insert da faixa mudou).
