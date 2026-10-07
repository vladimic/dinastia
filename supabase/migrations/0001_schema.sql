-- Dinastia · Estruturação de Patrimônio
-- 0001: estrutura do módulo Grupos e Tabelas (MER aprovado em 07/10/2026)

-- =========================================================
-- Referência e configuração
-- =========================================================

-- uma linha só (id = 1)
create table parametros_gerais (
  id                 int primary key default 1 check (id = 1),
  seguro_padrao_pct  numeric(7,4),          -- % ao mês; usado quando o PDF não traz o seguro
  atualizado_em      timestamptz not null default now()
);

create table indice_correcao (
  sigla  text primary key,                  -- INCC, IPCA, IGP-M, INPC, CDI, TR
  nome   text not null,
  fonte  text
);

create table tipo_contemplacao (
  codigo  text primary key,                 -- SORTEIO_ATIVO, LANCE_FIXO...
  nome    text not null
);

create table tipo_parcela (
  codigo     text primary key,              -- NORMAL, RED_85, RED_70...
  descricao  text not null,
  pct        numeric(7,4) not null check (pct > 0 and pct <= 100)  -- % da parcela
);

-- =========================================================
-- Grupo (dados estáveis)
-- =========================================================

create table grupo (
  numero             int primary key,       -- número do grupo na Ademicon
  familia            text not null check (familia in ('imoveis','veiculos','servicos','outros_bens')),
  prazo_grupo_meses  int  not null,
  participantes      int,
  taxa_adm_total     numeric(7,4),          -- %, ex.: 24.0000
  fundo_reserva      numeric(7,4),          -- %; nulo = não informado
  seguro_pct_mes     numeric(7,4),          -- % do crédito ao mês; sem no PDF = padrão dos parâmetros
  indice             text references indice_correcao(sigla) on update cascade,
  mes_reajuste       int check (mes_reajuste between 1 and 12),
  primeira_correcao  date,
  dia_vencimento     int check (dia_vencimento between 1 and 31),
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

create table arquivo_importado (
  id               bigint generated always as identity primary key,
  nome             text not null,
  hash_sha256      text,
  recebido_em      timestamptz not null default now(),
  status           text not null default 'recebido',
  dados_extraidos  jsonb
);

-- =========================================================
-- Versão do grupo por assembleia (cada PDF = uma versão; a maior assembleia é a vigente)
-- =========================================================

create table grupo_assembleia (
  id                 bigint generated always as identity primary key,
  grupo_numero       int not null references grupo(numero) on delete cascade on update cascade,
  assembleia_numero  int not null,
  data_assembleia    date,
  prazo_cota_meses   int not null,
  creditos           numeric(14,2)[] not null default '{}',   -- do maior para o menor
  observacoes        text,
  arquivo_id         bigint references arquivo_importado(id),
  aprovado_por       text,
  aprovado_em        timestamptz,
  unique (grupo_numero, assembleia_numero)
);

-- tipos de parcela oferecidos na versão (n x n)
create table grupo_assembleia_tipo_parcela (
  grupo_assembleia_id  bigint not null references grupo_assembleia(id) on delete cascade,
  tipo_parcela         text   not null references tipo_parcela(codigo) on update cascade,
  primary key (grupo_assembleia_id, tipo_parcela)
);

-- regras de cada modalidade na versão (embutido é atributo, não modalidade)
create table grupo_modalidade (
  id                        bigint generated always as identity primary key,
  grupo_assembleia_id       bigint not null references grupo_assembleia(id) on delete cascade,
  tipo                      text   not null references tipo_contemplacao(codigo) on update cascade,
  max_parcelas_lance        int,             -- nulo = livre
  pct_categoria             numeric(7,4),
  embutido_max_parcelas     int,
  embutido_base             text check (embutido_base in ('ofertado','categoria')),
  embutido_pct              numeric(7,4),    -- nulo = não permite embutido
  recurso_proprio_obrig     boolean,
  a_partir_assembleia_cota  int not null default 1,
  requisitos                text,
  transferivel              boolean not null default true,
  embutido_texto            text,            -- regra literal do PDF, para conferência
  unique (grupo_assembleia_id, tipo)
);

-- faixas de assembleias e o que vale depois da sequência (demais_tipo nulo = repete a sequência)
create table grupo_sequencia_faixa (
  id                   bigint generated always as identity primary key,
  grupo_assembleia_id  bigint not null references grupo_assembleia(id) on delete cascade,
  assembleia_de        int not null,
  assembleia_ate       int not null,
  demais_tipo          text references tipo_contemplacao(codigo) on update cascade,
  unique (grupo_assembleia_id, assembleia_de)
);

create table grupo_sequencia (
  id          bigint generated always as identity primary key,
  faixa_id    bigint not null references grupo_sequencia_faixa(id) on delete cascade,
  ordem       int    not null,
  tipo        text   not null references tipo_contemplacao(codigo) on update cascade,
  quantidade  int    not null default 1 check (quantidade > 0),
  unique (faixa_id, ordem)
);

create index on grupo_assembleia (grupo_numero, assembleia_numero desc);
create index on grupo_assembleia (arquivo_id);
create index on grupo_assembleia_tipo_parcela (tipo_parcela);
create index on grupo_modalidade (tipo);
create index on grupo_sequencia_faixa (demais_tipo);
create index on grupo_sequencia (tipo);
create index on grupo (indice);

-- =========================================================
-- Grupo com a versão vigente (maior assembleia) — é o que o simulador lê
-- =========================================================
create view grupo_atual with (security_invoker = true) as
select distinct on (g.numero)
  g.*,
  ga.id                 as grupo_assembleia_id,
  ga.assembleia_numero,
  ga.data_assembleia,
  ga.prazo_cota_meses,
  ga.creditos
from grupo g
join grupo_assembleia ga on ga.grupo_numero = g.numero
order by g.numero, ga.assembleia_numero desc;

-- =========================================================
-- atualizado_em automático
-- =========================================================
create or replace function set_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger grupo_atualizado_em before update on grupo
  for each row execute function set_atualizado_em();
create trigger parametros_atualizado_em before update on parametros_gerais
  for each row execute function set_atualizado_em();

-- =========================================================
-- Segurança: só e-mails autorizados acessam os dados
-- =========================================================
create table usuario_autorizado (
  email      text primary key,
  criado_em  timestamptz not null default now()
);
alter table usuario_autorizado enable row level security;  -- sem policy: invisível pela API

create or replace function public.autorizado() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuario_autorizado u
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.autorizado() from public, anon;
grant execute on function public.autorizado() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'parametros_gerais','indice_correcao','tipo_contemplacao','tipo_parcela',
    'grupo','arquivo_importado','grupo_assembleia','grupo_assembleia_tipo_parcela',
    'grupo_modalidade','grupo_sequencia_faixa','grupo_sequencia'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "autorizado_tudo" on %I for all to authenticated using ((select public.autorizado())) with check ((select public.autorizado()))', t);
  end loop;
end $$;
