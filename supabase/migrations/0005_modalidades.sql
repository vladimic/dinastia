-- Dinastia · 0005: cadastro de Modalidades de contemplação
-- Código curto (até 10 caracteres), nome e cor (#RRGGBB). Os códigos antigos são trocados pelos novos;
-- as chaves estrangeiras (on update cascade) levam a troca a grupo_modalidade, grupo_sequencia e grupo_sequencia_faixa.
-- Publicar junto com o app 0012 (o código do app e o importador já usam os códigos novos).

alter table tipo_contemplacao add column cor text not null default '#8A8A94';

update tipo_contemplacao set
  codigo = case codigo
    when 'SORTEIO_ATIVO'          then 'SOR'
    when 'SORTEIO_COTA_CANCELADA' then 'SOC'
    when 'LANCE_LIVRE'            then 'LIV'
    when 'LANCE_LIMITADO'         then 'LIM'
    when 'LANCE_FIXO'             then 'FIX'
    when 'LANCE_FIDELIDADE'       then 'FID'
  end,
  nome = case codigo
    when 'SORTEIO_ATIVO'          then 'Sorteio ativo'
    when 'SORTEIO_COTA_CANCELADA' then 'Sorteio Cancelada'
    when 'LANCE_LIVRE'            then 'Lance Livre'
    when 'LANCE_LIMITADO'         then 'Lance Limitado'
    when 'LANCE_FIXO'             then 'Lance Fixo'
    when 'LANCE_FIDELIDADE'       then 'Lance Fidelidade'
  end,
  cor = case codigo
    when 'SORTEIO_ATIVO'          then '#2E9E5B'  -- verde
    when 'SORTEIO_COTA_CANCELADA' then '#8A8A94'  -- cinza
    when 'LANCE_LIVRE'            then '#D64545'  -- vermelho
    when 'LANCE_LIMITADO'         then '#F28C28'  -- laranja
    when 'LANCE_FIXO'             then '#2F6FDE'  -- azul
    when 'LANCE_FIDELIDADE'       then '#E86AA6'  -- rosa
  end
where codigo in ('SORTEIO_ATIVO','SORTEIO_COTA_CANCELADA','LANCE_LIVRE','LANCE_LIMITADO','LANCE_FIXO','LANCE_FIDELIDADE');

alter table tipo_contemplacao
  add constraint tipo_contemplacao_codigo_ck check (codigo ~ '^[A-Z0-9_-]{1,10}$'),
  add constraint tipo_contemplacao_cor_ck    check (cor ~ '^#[0-9A-Fa-f]{6}$');
