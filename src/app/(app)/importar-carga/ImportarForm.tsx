"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importarCarga, type Resultado } from "./actions";

export function ImportarForm({ total }: { total: number }) {
  const [res, acao, enviando] = useActionState<Resultado>(importarCarga, undefined);

  return (
    <div className="flex flex-col gap-4">
      <form action={acao}>
        <button
          type="submit"
          disabled={enviando || !!res}
          className="min-h-11 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy disabled:opacity-60"
        >
          {enviando ? `Importando ${total} grupos… (até 1 minuto)` : res ? "Importação concluída" : `Importar ${total} grupos`}
        </button>
      </form>

      {res && (
        <div className="cartao">
          <p className="text-sm">
            <strong>{res.ok.length}</strong> grupos importados ·{" "}
            <strong>{res.jaExistia.length}</strong> já existiam ·{" "}
            <strong className={res.erros.length ? "text-[#9b1c1c]" : ""}>{res.erros.length}</strong> com erro
          </p>
          {res.erros.length > 0 && (
            <ul className="text-[13px] text-[#9b1c1c]">
              {res.erros.map((e) => (
                <li key={e.numero}>
                  Grupo {e.numero}: {e.msg}
                </li>
              ))}
            </ul>
          )}
          <Link href="/grupos?familia=imoveis" className="text-sm font-semibold underline">
            Ver em Grupos e Tabelas
          </Link>
        </div>
      )}
    </div>
  );
}
