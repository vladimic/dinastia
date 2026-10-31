// O que a tela de decisões mostra: só o que ainda pede uma ação (decidir, aplicar ou olhar um PDF com erro).
// O que já foi aplicado, ficou sem mudança, foi ignorado ou descartado fica registrado no banco (serve para não reler PDFs iguais), mas não aparece aqui.
export const FILTROS = ["pendentes", "prontos", "erros"] as const;
export type Filtro = (typeof FILTROS)[number];
export const NOME_FILTRO: Record<Filtro, string> = {
  pendentes: "A decidir",
  prontos: "Prontos para aplicar",
  erros: "Com erro de leitura",
};
