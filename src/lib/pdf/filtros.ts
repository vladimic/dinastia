export const FILTROS = ["pendentes", "prontos", "aplicados", "sem_mudanca", "erros", "ignorados"] as const;
export type Filtro = (typeof FILTROS)[number];
export const NOME_FILTRO: Record<Filtro, string> = {
  pendentes: "A decidir",
  prontos: "Prontos para aplicar",
  aplicados: "Aplicados",
  sem_mudanca: "Sem mudança",
  erros: "Com erro de leitura",
  ignorados: "Ignorados",
};
