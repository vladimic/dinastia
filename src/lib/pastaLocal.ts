"use client";

// Pasta de PDFs escolhida no navegador (Chrome/Edge). O navegador não deixa abrir o seletor num caminho digitado,
// mas guarda a pasta escolhida (IndexedDB): nas próximas vezes ela é reaberta direto, só com a permissão de leitura.

type Permissao = "granted" | "denied" | "prompt";
export type PastaHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: "read" }) => Promise<Permissao>;
  requestPermission?: (o: { mode: "read" }) => Promise<Permissao>;
  entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

export const suportaSeletorDePasta = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

/** Abre o seletor de pastas (começa na pasta indicada, se houver). null = cancelou. */
export async function escolherPasta(id: string, inicio?: PastaHandle | null): Promise<PastaHandle | null> {
  const abrir = (window as unknown as { showDirectoryPicker: (o: object) => Promise<PastaHandle> }).showDirectoryPicker;
  try {
    return await abrir.call(window, { id, mode: "read", startIn: inicio ?? "documents" });
  } catch (e) {
    if ((e as DOMException).name === "AbortError") return null;
    throw e;
  }
}

/** Confirma a permissão de leitura de uma pasta já escolhida (precisa de um clique do usuário). */
export async function liberarLeitura(h: PastaHandle): Promise<boolean> {
  if ((await h.queryPermission?.({ mode: "read" })) === "granted") return true;
  return (await h.requestPermission?.({ mode: "read" })) === "granted";
}

/** Os arquivos .pdf da raiz da pasta (sem entrar nas subpastas). */
export async function pdfsDaRaiz(h: PastaHandle): Promise<File[]> {
  const arquivos: File[] = [];
  for await (const [nome, item] of h.entries()) {
    if (item.kind === "file" && /\.pdf$/i.test(nome)) arquivos.push(await (item as FileSystemFileHandle).getFile());
  }
  return arquivos;
}

const BANCO = "dinastia-pastas";
const LOJA = "pastas";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(BANCO, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
}

export async function guardarPasta(chave: string, h: PastaHandle): Promise<void> {
  try {
    const db = await abrirBanco();
    await new Promise<void>((ok, erro) => {
      const t = db.transaction(LOJA, "readwrite");
      t.objectStore(LOJA).put(h, chave);
      t.oncomplete = () => ok();
      t.onerror = () => erro(t.error);
    });
  } catch {
    // janela privada: a pasta vale só até recarregar a página
  }
}

export async function lerPastaGuardada(chave: string): Promise<PastaHandle | null> {
  try {
    const db = await abrirBanco();
    return await new Promise((ok) => {
      const r = db.transaction(LOJA).objectStore(LOJA).get(chave);
      r.onsuccess = () => ok((r.result as PastaHandle | undefined) ?? null);
      r.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}
