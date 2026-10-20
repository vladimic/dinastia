"use client";

// Escolha de pasta pelo navegador (Chrome/Edge): o Finder abre, o usuário escolhe e o navegador devolve só o NOME da pasta
// e uma permissão de leitura (nunca o caminho completo). A permissão fica guardada neste navegador (IndexedDB).

type Picker = (opcoes?: { mode?: "read"; id?: string }) => Promise<FileSystemDirectoryHandle>;

export const suportaEscolherPasta = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

/** Abre o seletor de pastas. Devolve null se o usuário cancelar. */
export async function escolherPasta(): Promise<FileSystemDirectoryHandle | null> {
  const abrir = (window as unknown as { showDirectoryPicker: Picker }).showDirectoryPicker;
  try {
    return await abrir.call(window, { mode: "read" });
  } catch (e) {
    if ((e as DOMException).name === "AbortError") return null;
    throw e;
  }
}

/** Troca o último trecho do caminho pelo nome da pasta escolhida (o navegador não informa o caminho completo). */
export function ajustarCaminho(atual: string, nome: string): { caminho: string; confere: boolean } {
  const limpo = atual.trim().replace(/\/+$/, "");
  const ultimo = limpo.split("/").pop() ?? "";
  if (limpo && ultimo === nome) return { caminho: limpo, confere: true };
  const pai = limpo.includes("/") ? limpo.slice(0, limpo.lastIndexOf("/")) : "";
  return { caminho: pai ? `${pai}/${nome}` : nome, confere: false };
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

export async function guardarPasta(chave: string, handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await abrirBanco();
    await new Promise<void>((ok, erro) => {
      const t = db.transaction(LOJA, "readwrite");
      t.objectStore(LOJA).put(handle, chave);
      t.oncomplete = () => ok();
      t.onerror = () => erro(t.error);
    });
  } catch {
    // sem IndexedDB (janela privada): a permissão vale só até recarregar a página
  }
}

export async function lerPastaGuardada(chave: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await abrirBanco();
    return await new Promise((ok) => {
      const r = db.transaction(LOJA).objectStore(LOJA).get(chave);
      r.onsuccess = () => ok((r.result as FileSystemDirectoryHandle | undefined) ?? null);
      r.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}
