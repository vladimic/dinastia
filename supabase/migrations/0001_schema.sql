-- Dinastia · Estruturação de Patrimônio
-- 0001: estrutura de tabelas (rodar uma vez no SQL Editor do Supabase)

-- =========================================================
-- Referência
-- =========================================================

create table administradora (
  id          bigint generated always as identity primary key,
  nome        text not null unique,
  cnpj        text,
  ativo       boolean not null default true
);

create table familia_produto (
  id          bigint generated always as identity primary key,
  slug        text not null unique,          -- imoveis, veiculos, servicos, outros-bens
  nome        text not null,
  descricao   text,
  ordem       int  not null default 0
);

create table indice_correcao (
  id          bigint generated always as identity primary key,
  sigla       text not null unique,          -- INCC, IPCA, IGP-M, INPC, CDI, TR
  nome        text not null,
  fonte       text
);

create table indice_valor (
  id               bigint generated always as identity primary key,
  indice_id        bigint not null references indice_correcao(id),
  competencia      date   not null,          -- primeiro dia do mês
  variacao_mensal  numeric(9,6),             -- em %, ex.: 0.512300
  acumulado_12m    numeric(9,6),
  unique (indice_id, competencia)
);

create table tipo_contemplacao (
  id          bigint generated always as identity primary key,
  codigo      text not null unique,
  nome        text not null,
  eh_lance    boolean not null default false,
  ordem       int not null default 0
);

create table plano_pagamento (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,     -- DILUIDA, ANTECIPADO_1, REDUZIDA
  nome             text not null,
  pct_antecipacao  numeric(7,4),
  pct_reducao      numeric(7,4),
  ordem            int not null default 0
);

-- =========================================================
-- Grupo e tabela
-- =========================================================

create table grupo (
  id                      bigint generated always as identity primary key,
  -- só Ademicon hoje: fica fixo no banco e fora da tela
  administradora_id       bigint not null references administradora(id),
  familia_id              bigint not null references familia_produto(id),
  numero                  text   not null,
  participantes           int,
  prazo_grupo_meses       int    not null,
  dia_vencimento          int    check (dia_vencimento between 1 and 31),
  indice_id               bigint references indice_correcao(id),
  mes_reajuste            int    check (mes_reajuste between 1 and 12),
  taxa_adm_total          numeric(7,4),      -- em %, ex.: 24.0000
  fundo_reserva           numeric(7,4),      -- em %; null = não informado
  seguro_opcional_pre     boolean not null default true,
  seguro_obrigatorio_pos  boolean not null default true,
  idade_limite_seguro     text,              -- ex.: '74 anos, 11 meses e 29 dias'
  observacoes             text,
  notas_internas          text,
  status                  text not null default 'ativo',
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now(),
  unique (administradora_id, numero)
);

create table arquivo_importado (
  id                    bigint generated always as identity primary key,
  nome                  text not null,
  hash_sha256           text,
  recebido_em           timestamptz not null default now(),
  status                text not null default 'recebido',
  texto_extraido        text,
  dados_extraidos_json  jsonb
);

-- uma vigência por assembleia (cada PDF novo cria uma; nada é sobrescrito)
create table tabela_vigencia (
  id                 bigint generated always as identity primary key,
  grupo_id           bigint not null references grupo(id) on delete cascade,
  assembleia_numero  int    not null,
  data_assembleia    date,
  prazo_cota_meses   int    not null,
  arquivo_id         bigint references arquivo_importado(id),
  aprovada_por       text,
  aprovada_em        timestamptz,
  vigente            boolean not null default false,
  unique (grupo_id, assembleia_numero)
);
-- só uma vigência ativa por grupo
create unique index tabela_vigencia_uma_vigente on tabela_vigencia (grupo_id) where vigente;

create table credito (
  id             bigint generated always as identity primary key,
  vigencia_id    bigint not null references tabela_vigencia(id) on delete cascade,
  cod_bem        text   not null,
  valor_credito  numeric(14,2) not null,
  seguro_mensal  numeric(12,2),
  unique (vigencia_id, cod_bem)
);

create table credito_parcela (
  id              bigint generated always as identity primary key,
  credito_id      bigint not null references credito(id) on delete cascade,
  plano_id        bigint not null references plano_pagamento(id),
  pct_parcela     numeric(7,4) not null default 100,
  valor_primeira  numeric(12,2) not null,
  valor_demais    numeric(12,2) not null,
  unique (credito_id, plano_id, pct_parcela)
);

-- embutido é atributo da modalidade, não um tipo de contemplação
create table grupo_modalidade (
  id                        bigint generated always as identity primary key,
  grupo_id                  bigint not null references grupo(id) on delete cascade,
  tipo_contemplacao_id      bigint not null references tipo_contemplacao(id),
  max_parcelas_lance        int,             -- null = livre
  pct_categoria             numeric(7,4),
  embutido_max_parcelas     int,             -- null = não permite embutido
  embutido_base             text check (embutido_base in ('ofertado','categoria')),
  embutido_pct              numeric(7,4),
  recurso_proprio_obrig     boolean,
  a_partir_assembleia_cota  int not null default 1,
  requisitos                text,
  transferivel              boolean not null default true,
  unique (grupo_id, tipo_contemplacao_id)
);

create table grupo_sequencia (
  id                    bigint generated always as identity primary key,
  grupo_id              bigint not null references grupo(id) on delete cascade,
  assembleia_de         int not null,
  assembleia_ate        int not null,
  ordem                 int not null,
  tipo_contemplacao_id  bigint not null references tipo_contemplacao(id),
  quantidade            int not null default 1,
  unique (grupo_id, assembleia_de, ordem)
);

create table assembleia_resultado (
  id                    bigint generated always as identity primary key,
  grupo_id              bigint not null references grupo(id) on delete cascade,
  assembleia_numero     int not null,
  data                  date,
  tipo_contemplacao_id  bigint references tipo_contemplacao(id),
  qtd_contemplados      int,
  pct_lance_vencedor    numeric(7,4),
  pct_lance_menor       numeric(7,4),
  fonte                 text
);

create table importacao_item (
  id            bigint generated always as identity primary key,
  arquivo_id    bigint not null references arquivo_importado(id) on delete cascade,
  grupo_id      bigint references grupo(id),
  campo         text not null,
  valor_atual   text,
  valor_lido    text,
  decisao       text check (decisao in ('aceitar','manter')),
  validacao_ok  boolean
);

-- =========================================================
-- Clientes e simulação (estrutura pronta; telas virão depois)
-- =========================================================

create table cliente (
  id               bigint generated always as identity primary key,
  usuario_id       uuid not null default auth.uid() references auth.users(id),
  nome             text not null,
  data_nascimento  date,
  telefone         text,
  email            text,
  objetivo         text,
  origem           text,
  criado_em        timestamptz not null default now()
);

create table simulacao (
  id               bigint generated always as identity primary key,
  cliente_id       bigint references cliente(id) on delete set null,
  credito_id       bigint references credito(id),
  plano_id         bigint references plano_pagamento(id),
  mes_contemplacao int,
  tipo_lance_id    bigint references tipo_contemplacao(id),
  pct_lance        numeric(7,4),
  pct_embutido     numeric(7,4),
  premissa_indice  numeric(7,4),
  parametros_json  jsonb not null default '{}'::jsonb,
  resultado_json   jsonb,
  versao_motor     text,
  origem           text not null default 'manual' check (origem in ('manual','ia')),
  criado_em        timestamptz not null default now()
);

create table proposta (
  id            bigint generated always as identity primary key,
  simulacao_id  bigint not null references simulacao(id) on delete cascade,
  versao        int not null default 1,
  pdf_url       text,
  gerada_em     timestamptz not null default now(),
  status        text not null default 'rascunho'
);

create table prompt_ia (
  id      bigint generated always as identity primary key,
  nome    text not null,
  texto   text not null,
  versao  int  not null default 1,
  ativo   boolean not null default true
);

-- =========================================================
-- atualizado_em automático
-- =========================================================
create or replace function set_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger grupo_atualizado_em before update on grupo
for each row execute function set_atualizado_em();

-- =========================================================
-- Segurança (RLS): só usuários logados acessam
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'administradora','familia_produto','indice_correcao','indice_valor',
    'tipo_contemplacao','plano_pagamento','grupo','arquivo_importado',
    'tabela_vigencia','credito','credito_parcela','grupo_modalidade',
    'grupo_sequencia','assembleia_resultado','importacao_item',
    'simulacao','proposta','prompt_ia'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "logado_tudo" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- clientes: cada usuário vê só os seus
alter table cliente enable row level security;
create policy "cliente_do_usuario" on cliente for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
