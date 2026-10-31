-- Dinastia · 0033: simulador de veículos (aplicada no Supabase em 31/10/2026).
-- A visão grupo_atual passa a trazer parcela_minima_pct; parâmetros globais ganham os % padrão dos lances livre e fidelidade (veículos).
create or replace view public.grupo_atual as
 SELECT DISTINCT ON (g.numero) g.numero,
    g.familia,
    g.prazo_grupo_meses,
    g.participantes,
    g.taxa_adm_total,
    g.fundo_reserva,
    g.indice,
    g.mes_reajuste,
    g.primeira_correcao,
    g.dia_vencimento,
    g.criado_em,
    g.atualizado_em,
    ga.id AS grupo_assembleia_id,
    ga.assembleia_numero,
    ga.data_assembleia,
    ga.prazo_cota_meses,
    ga.creditos,
    g.parcela_minima_pct
   FROM grupo g
     JOIN grupo_assembleia ga ON ga.grupo_numero = g.numero
  ORDER BY g.numero, ga.assembleia_numero DESC;

alter table public.parametros_gerais
  add column lance_livre_pct numeric not null default 55 check (lance_livre_pct > 0 and lance_livre_pct <= 100),
  add column lance_fidelidade_pct numeric not null default 45 check (lance_fidelidade_pct > 0 and lance_fidelidade_pct <= 100);
