"use client";

// Conversa com o "Dinastia Local" (public/dinastia_local.py, baixado pela tela Importar tabelas), programa que roda no Mac do usuário.
// Só ele consegue abrir o Finder com o caminho completo e, adiante, ler os PDFs das pastas.

const BASE = "http://127.0.0.1:8765";

export type EscolhaPasta = { caminho: string } | { cancelado: true } | { erro: string };

export const AVISO_AJUDANTE =
  "Não encontrei o Dinastia Local neste computador. Na tela Importar tabelas (PDF) há o passo a passo para baixar e abrir o programa (deixe a janela dele aberta). Se o Chrome perguntar sobre acesso a dispositivos da rede local, permita.";

/** Abre o Finder já posicionado em `inicio` (ou na pasta existente mais próxima / padrão) e devolve o caminho completo escolhido. */
export async function escolherPastaNoFinder(inicio: string, titulo: string): Promise<EscolhaPasta> {
  let r: Response;
  try {
    r = await fetch(`${BASE}/escolher-pasta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inicio, titulo }),
    });
  } catch {
    return { erro: AVISO_AJUDANTE };
  }
  if (r.status === 403) return { erro: "O Dinastia Local não autoriza este endereço do site. Rode-o com: --origem " + window.location.origin };
  const j = (await r.json().catch(() => ({}))) as { caminho?: string; cancelado?: boolean; erro?: string };
  if (j.caminho) return { caminho: j.caminho };
  if (j.cancelado) return { cancelado: true };
  return { erro: j.erro ?? "Não foi possível abrir o Finder." };
}
