-- Dinastia · 0021: parâmetros globais do simulador — parcelas do lance livre (150) e fidelidade (130),
-- concorrência de cada lance (fixo 25%, limitado 10%, livre 3%, fidelidade 2%) e textos do rodapé das colunas.
-- O simulador abre com esses valores; parcelas do lance são editáveis na tela (sem alterar o parâmetro), concorrência e textos só aqui.
-- Aplicada no Supabase via MCP em 15/10/2026. Reverter: drop das colunas abaixo em parametros_gerais.
alter table parametros_gerais
  add column if not exists lance_livre_parcelas int not null default 150 check (lance_livre_parcelas between 1 and 999),
  add column if not exists lance_fidelidade_parcelas int not null default 130 check (lance_fidelidade_parcelas between 1 and 999),
  add column if not exists concorrencia_fixo_pct numeric(7,4) not null default 25 check (concorrencia_fixo_pct between 0 and 100),
  add column if not exists concorrencia_limitado_pct numeric(7,4) not null default 10 check (concorrencia_limitado_pct between 0 and 100),
  add column if not exists concorrencia_livre_pct numeric(7,4) not null default 3 check (concorrencia_livre_pct between 0 and 100),
  add column if not exists concorrencia_fidelidade_pct numeric(7,4) not null default 2 check (concorrencia_fidelidade_pct between 0 and 100),
  add column if not exists rodape_textos jsonb not null default '{"SOR":{"titulo":"Sem lance","texto":"Depende só da sorte"},"FIX":{"titulo":"Previsibilidade máxima","texto":"Valor de lance pré-definido"},"LIM":{"titulo":"Equilíbrio e flexibilidade","texto":"Combina crédito + recurso próprio"},"LIV":{"titulo":"Valor à sua escolha","texto":"Você define o lance, sem teto fixo"},"FID":{"titulo":"Maior poder de contemplação","texto":"Funciona como leilão"}}'::jsonb;
comment on column parametros_gerais.lance_livre_parcelas is 'Parcelas do lance livre com que o simulador abre (editável na tela, sem alterar o parâmetro)';
comment on column parametros_gerais.lance_fidelidade_parcelas is 'Parcelas do lance fidelidade com que o simulador abre (editável na tela, sem alterar o parâmetro)';
comment on column parametros_gerais.rodape_textos is 'Textos (titulo, texto) do rodapé de cada coluna do simulador, por tipo: SOR, FIX, LIM, LIV, FID';
