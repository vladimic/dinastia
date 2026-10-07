-- Dinastia · 0002: dados de referência
-- Os grupos entram pela importação de PDFs (scripts/importar_tabelas.py).

insert into parametros_gerais (id, seguro_padrao_pct) values (1, 0.0472);

insert into indice_correcao (sigla, nome, fonte) values
  ('INCC',  'Índice Nacional de Custo da Construção', 'FGV'),
  ('IPCA',  'Índice Nacional de Preços ao Consumidor Amplo', 'IBGE'),
  ('IGP-M', 'Índice Geral de Preços do Mercado', 'FGV'),
  ('INPC',  'Índice Nacional de Preços ao Consumidor', 'IBGE'),
  ('CDI',   'Certificado de Depósito Interbancário', 'B3'),
  ('TR',    'Taxa Referencial', 'BCB');

insert into tipo_contemplacao (codigo, nome) values
  ('SORTEIO_ATIVO',          'Sorteio ativo'),
  ('SORTEIO_COTA_CANCELADA', 'Sorteio cota cancelada'),
  ('LANCE_LIVRE',            'Lance livre'),
  ('LANCE_LIMITADO',         'Lance limitado'),
  ('LANCE_FIXO',             'Lance fixo'),
  ('LANCE_FIDELIDADE',       'Lance fidelidade');

insert into tipo_parcela (codigo, descricao, pct) values
  ('NORMAL', 'Normal 100%',   100),
  ('RED_85', 'Reduzida 85%',  85),
  ('RED_70', 'Reduzida 70%',  70),
  ('RED_55', 'Reduzida 55%',  55),
  ('RED_50', 'Reduzida 50%',  50);

-- quem pode acessar o sistema
insert into usuario_autorizado (email) values ('vladimir.michels@gmail.com');
