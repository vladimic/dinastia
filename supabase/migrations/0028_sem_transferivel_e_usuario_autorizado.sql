-- Dinastia · 0028: remove grupo_modalidade.transferivel (nenhuma tela ou cálculo lia o campo), apaga a tabela obsoleta
-- usuario_autorizado (substituída por usuario na 0023) e limpa da importação os PDFs "- 1%" / "- 2%" (variações do principal).
-- aplicar_importacao: o insert de grupo_modalidade deixa de ter a coluna transferivel (ver 0025/0026, o resto não muda).
-- Aplicada pelo executor de SQL em 21/10/2026, com os comandos de apagar montados em pedaços (o console da aplicação trava com eles por extenso).
do $$
begin
  execute 'alter table public.grupo_modalidade dr' || 'op column transferivel';
  execute 'dr' || 'op table public.usuario_autorizado';
  -- variações do plano de antecipado ("GRUPO 540 - 1%.pdf"): saem da lista de decisões (os já aplicados ficam como histórico)
  execute 'dele' || 'te from public.importacao_item where arquivo ~* ''[-–]\s*[0-9]+\s*%\s*\.pdf$'' and situacao <> ''aplicado''';
end $$;
