import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { FAMILIAS, listarGrupos, type GrupoResumo } from "@/lib/grupos";

// A lista de grupos de cada família (a do seletor de Grupos e Tabelas) é guardada pronta na tabela lista_grupos:
// montá-la a cada troca de grupo era a parte mais lenta da tela. Ela é refeita quando a importação é aplicada
// (e quando um grupo é editado na tela, para a lista não ficar com dado velho).

/** Lê a lista da família; se ainda não existe, monta e guarda (só administrador grava). */
export async function listaDaFamilia(familia: string): Promise<GrupoResumo[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("lista_grupos").select("dados").eq("familia", familia).maybeSingle();
  if (data?.dados) return data.dados as GrupoResumo[];
  return refazerLista(supabase, familia);
}

/** Monta a lista da família e a guarda. Uma falha ao guardar não impede de mostrar a lista. */
export async function refazerLista(supabase: SupabaseClient, familia: string): Promise<GrupoResumo[]> {
  const grupos = await listarGrupos(familia);
  await supabase.from("lista_grupos").upsert({ familia, dados: grupos, atualizado_em: new Date().toISOString() }, { onConflict: "familia" });
  return grupos;
}

export async function refazerTodasAsListas(supabase: SupabaseClient) {
  await Promise.all(FAMILIAS.map((f) => refazerLista(supabase, f.slug)));
}

/** Refaz a lista da família do grupo (usado nas edições feitas na tela do grupo). */
export async function refazerListaDoGrupo(supabase: SupabaseClient, numero: number) {
  const { data } = await supabase.from("grupo").select("familia").eq("numero", numero).maybeSingle();
  if (data?.familia) await refazerLista(supabase, data.familia as string);
}

export async function refazerListaDaVersao(supabase: SupabaseClient, versaoId: number) {
  const { data } = await supabase.from("grupo_assembleia").select("grupo_numero").eq("id", versaoId).maybeSingle();
  if (data?.grupo_numero) await refazerListaDoGrupo(supabase, data.grupo_numero as number);
}
