-- Dinastia · 0002: dados iniciais
-- Referências + Grupo 660 (fonte: GRUPO_660.pdf, 85ª assembleia, 20/10/2026)

insert into administradora (nome) values ('Ademicon');

insert into familia_produto (slug, nome, ordem) values
  ('imoveis',    'Imóveis',     1),
  ('veiculos',   'Veículos',    2),
  ('servicos',   'Serviços',    3),
  ('outros-bens','Outros bens', 4);

insert into indice_correcao (sigla, nome, fonte) values
  ('INCC',  'Índice Nacional de Custo da Construção', 'FGV'),
  ('IPCA',  'Índice Nacional de Preços ao Consumidor Amplo', 'IBGE'),
  ('IGP-M', 'Índice Geral de Preços do Mercado', 'FGV'),
  ('INPC',  'Índice Nacional de Preços ao Consumidor', 'IBGE'),
  ('CDI',   'Certificado de Depósito Interbancário', 'B3'),
  ('TR',    'Taxa Referencial', 'BCB');

insert into tipo_contemplacao (codigo, nome, eh_lance, ordem) values
  ('SORTEIO_ATIVO',          'Sorteio ativo',          false, 1),
  ('SORTEIO_COTA_CANCELADA', 'Sorteio cota cancelada', false, 2),
  ('LANCE_LIVRE',            'Lance livre',            true,  3),
  ('LANCE_LIMITADO',         'Lance limitado',         true,  4),
  ('LANCE_FIXO',             'Lance fixo',             true,  5),
  ('LANCE_FIDELIDADE',       'Lance fidelidade',       true,  6);

insert into plano_pagamento (codigo, nome, pct_antecipacao, pct_reducao, ordem) values
  ('DILUIDA',      'Parcela diluída', null, null, 1),
  ('ANTECIPADO_1', '1% antecipado',   1,    null, 2),
  ('REDUZIDA',     'Parcela reduzida', null, null, 3);

-- ---------------------------------------------------------
-- Grupo 660 · Imóveis
-- ---------------------------------------------------------
insert into grupo (
  administradora_id, familia_id, numero, participantes, prazo_grupo_meses,
  dia_vencimento, indice_id, mes_reajuste, taxa_adm_total, fundo_reserva,
  seguro_opcional_pre, seguro_obrigatorio_pos, idade_limite_seguro, observacoes
) values (
  (select id from administradora where nome = 'Ademicon'),
  (select id from familia_produto where slug = 'imoveis'),
  '660', 3333, 240,
  15, (select id from indice_correcao where sigla = 'INCC'), 1, 24.0000, null,
  true, true, '74 anos, 11 meses e 29 dias',
  'Entregas condicionadas à efetiva arrecadação do grupo. Sorteio e desempate dos lances pela Loteria Federal. Valores e condições podem mudar sem aviso prévio.'
);

insert into arquivo_importado (nome, status) values ('GRUPO_660.pdf', 'aprovado');

insert into tabela_vigencia (grupo_id, assembleia_numero, data_assembleia, prazo_cota_meses, arquivo_id, aprovada_por, aprovada_em, vigente)
select g.id, 85, date '2026-10-20', 156, a.id, 'carga inicial', now(), true
from grupo g, arquivo_importado a
where g.numero = '660' and a.nome = 'GRUPO_660.pdf';

with v as (
  select tv.id from tabela_vigencia tv join grupo g on g.id = tv.grupo_id
  where g.numero = '660' and tv.assembleia_numero = 85
)
insert into credito (vigencia_id, cod_bem, valor_credito, seguro_mensal)
select v.id, c.cod, c.valor, c.seguro from v, (values
  ('1410', 790525.85, 372.50),
  ('1409', 750999.57, 353.87),
  ('1408', 711473.27, 335.25),
  ('1407', 671946.97, 316.62),
  ('1406', 632420.68, 298.00),
  ('1405', 592894.39, 279.37),
  ('1404', 553368.10, 260.75)
) as c(cod, valor, seguro);

-- parcelas por plano (coluna "Normal 100%" do PDF)
with base as (
  select c.id as credito_id, c.cod_bem
  from credito c
  join tabela_vigencia tv on tv.id = c.vigencia_id
  join grupo g on g.id = tv.grupo_id
  where g.numero = '660' and tv.assembleia_numero = 85
), p as (
  select * from (values
    ('1410', 6283.89, 14138.55, 6233.30),
    ('1409', 5969.70, 13431.63, 5921.63),
    ('1408', 5655.50, 12724.70, 5609.97),
    ('1407', 5341.31, 12017.77, 5298.30),
    ('1406', 5027.11, 11310.84, 4986.64),
    ('1405', 4712.92, 10603.92, 4674.97),
    ('1404', 4398.72,  9896.99, 4363.31)
  ) as t(cod, diluida, antecip_primeira, antecip_demais)
)
insert into credito_parcela (credito_id, plano_id, pct_parcela, valor_primeira, valor_demais)
select base.credito_id, (select id from plano_pagamento where codigo = 'DILUIDA'), 100, p.diluida, p.diluida
from base join p on p.cod = base.cod_bem
union all
select base.credito_id, (select id from plano_pagamento where codigo = 'ANTECIPADO_1'), 100, p.antecip_primeira, p.antecip_demais
from base join p on p.cod = base.cod_bem;

-- modalidades (categoria = fundo comum + taxa adm. + fundo de reserva; parcela de lance = categoria / 240)
insert into grupo_modalidade (
  grupo_id, tipo_contemplacao_id, max_parcelas_lance, pct_categoria,
  embutido_max_parcelas, embutido_base, embutido_pct, recurso_proprio_obrig,
  a_partir_assembleia_cota, requisitos, transferivel
)
select g.id, t.id, m.max_parc, m.pct_cat, m.emb_parc, m.emb_base, m.emb_pct, m.rec_proprio, m.a_partir, m.req, m.transf
from grupo g
cross join (values
  ('SORTEIO_ATIVO',          null::int, null::numeric, null::int, null::text, null::numeric, null::boolean, 1,  null::text, true),
  ('SORTEIO_COTA_CANCELADA', null,      null,          null,      null,       null,          null,          1,  null,       true),
  ('LANCE_LIVRE',            null,      null,          null,      null,       null,          true,          1,  null,       true),
  ('LANCE_LIMITADO',         100,       41.6667,       60,        'categoria', 25,           true,          1,  'Embutido até 60 parcelas (25% da categoria); restante com recursos próprios', true),
  ('LANCE_FIXO',             60,        25.0000,       60,        'ofertado', 100,           false,         1,  null,       true),
  ('LANCE_FIDELIDADE',       240,       100.0000,      null,      null,       null,          true,          37, '36 parcelas pagas (consecutivas ou não) e participação em 36 assembleias; antecipações não contam', false)
) as m(codigo, max_parc, pct_cat, emb_parc, emb_base, emb_pct, rec_proprio, a_partir, req, transf)
join tipo_contemplacao t on t.codigo = m.codigo
where g.numero = '660';

-- sequência de contemplação
insert into grupo_sequencia (grupo_id, assembleia_de, assembleia_ate, ordem, tipo_contemplacao_id, quantidade)
select g.id, s.de, s.ate, s.ordem, t.id, 1
from grupo g
cross join (values
  (1, 36, 1, 'SORTEIO_ATIVO'), (1, 36, 2, 'SORTEIO_COTA_CANCELADA'), (1, 36, 3, 'LANCE_LIVRE'),
  (1, 36, 4, 'LANCE_LIMITADO'), (1, 36, 5, 'LANCE_FIXO'),
  (37, 240, 1, 'SORTEIO_ATIVO'), (37, 240, 2, 'SORTEIO_COTA_CANCELADA'), (37, 240, 3, 'LANCE_LIVRE'),
  (37, 240, 4, 'LANCE_LIMITADO'), (37, 240, 5, 'LANCE_FIXO'), (37, 240, 6, 'LANCE_FIDELIDADE')
) as s(de, ate, ordem, codigo)
join tipo_contemplacao t on t.codigo = s.codigo
where g.numero = '660';
