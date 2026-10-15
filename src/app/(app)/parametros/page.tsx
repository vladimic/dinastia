import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { pct } from "@/lib/formato";
import { padroesDeLinha, type TipoColuna } from "@/lib/simulacao";
import { salvarParametros } from "./actions";

export const metadata: Metadata = { title: "Parâmetros globais · Dinastia" };

export default function ParametrosPage({ searchParams }: PageProps<"/parametros">) {
  return (
    <>
      <header className="border-b border-borda bg-white px-8 py-3">
        <div className="text-[11px] text-tinta">Cadastros</div>
        <h1 className="text-xl font-bold leading-tight">Parâmetros globais</h1>
      </header>
      <div className="px-8 pt-5 pb-10">
        <Suspense fallback={<p className="text-sm text-tinta">Carregando…</p>}>
          <Formulario searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Formulario({ searchParams }: { searchParams: PageProps<"/parametros">["searchParams"] }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parametros_gerais")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  const pad = padroesDeLinha(data);

  return (
    <form action={salvarParametros} className="flex w-[30rem] max-w-full flex-col gap-4 rounded-2xl border border-borda bg-white p-5">
      <h2 className="text-sm font-bold">Seguro prestamista</h2>
      <label className="grid grid-cols-[1fr_7rem] items-center gap-3 text-xs font-semibold text-tinta">
        % do crédito ao mês (todos os grupos)
        <input
          className="campo-sm"
          name="seguro_padrao_pct"
          inputMode="decimal"
          defaultValue={pct(data?.seguro_padrao_pct, 4)}
          required
        />
      </label>
      <p className="text-[11px] leading-snug text-tinta">
        Usado no cálculo do seguro de todos os grupos. Ex.: 0,0472% de R$ 300.000,00 = R$ 141,60 por mês.
      </p>

      <h2 className="border-t border-linha pt-3 text-sm font-bold">Simulador</h2>
      <Campo rotulo="INCC projetado (% ao ano)" nome="incc_pct_ano" valor={pct(pad.incc)} />
      <Campo rotulo="Contemplação em (meses)" nome="contemplacao_meses" valor={String(pad.contemplacaoMeses)} />
      <Campo rotulo="Parcelas do lance livre" nome="lance_livre_parcelas" valor={String(pad.lanceLivreParcelas)} />
      <Campo rotulo="Parcelas do lance fidelidade" nome="lance_fidelidade_parcelas" valor={String(pad.lanceFidelidadeParcelas)} />
      <p className="text-[11px] leading-snug text-tinta">
        Valores com que o simulador de cada grupo abre. Na tela do simulador, INCC, contemplação e parcelas dos lances livre e fidelidade podem ser alterados para aquela simulação, sem mudar estes parâmetros.
      </p>

      <h2 className="border-t border-linha pt-3 text-sm font-bold">Concorrência dos lances (%)</h2>
      <Campo rotulo="Lance fixo" nome="concorrencia_fixo_pct" valor={pct(pad.concorrencia.FIX)} />
      <Campo rotulo="Lance limitado" nome="concorrencia_limitado_pct" valor={pct(pad.concorrencia.LIM)} />
      <Campo rotulo="Lance livre" nome="concorrencia_livre_pct" valor={pct(pad.concorrencia.LIV)} />
      <Campo rotulo="Lance fidelidade" nome="concorrencia_fidelidade_pct" valor={pct(pad.concorrencia.FID)} />
      <p className="text-[11px] leading-snug text-tinta">Aparece no cabeçalho de cada coluna do simulador; só pode ser alterada aqui.</p>

      <h2 className="border-t border-linha pt-3 text-sm font-bold">Textos sob o prazo restante (simulador)</h2>
      {(Object.keys(NOMES_COLUNA) as TipoColuna[]).map((k) => (
        <div key={k} className="flex flex-col gap-1.5">
          <span className="text-xs font-bold">{NOMES_COLUNA[k]}</span>
          <input className="campo-sm !text-left" name={`rodape_${k}_titulo`} defaultValue={pad.rodape[k].titulo} maxLength={60} required aria-label={`${NOMES_COLUNA[k]}: título`} />
          <input className="campo-sm !text-left" name={`rodape_${k}_texto`} defaultValue={pad.rodape[k].texto} maxLength={80} required aria-label={`${NOMES_COLUNA[k]}: texto`} />
        </div>
      ))}

      {sp.salvo === "1" && (
        <p role="status" className="rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          Parâmetros salvos.
        </p>
      )}
      {["4", "5", "6"].includes(String(sp.erro)) && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          {sp.erro === "4"
            ? "Parcelas do lance inválidas. Informe números inteiros de 1 a 999."
            : sp.erro === "5"
              ? "Concorrência inválida. Informe um percentual entre 0 e 100."
              : "Os textos do simulador não podem ficar vazios (título até 60 e texto até 80 caracteres)."}
        </p>
      )}
      {sp.erro === "3" && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          Contemplação inválida. Informe os meses como número inteiro, de 1 a 999.
        </p>
      )}
      {sp.erro === "2" && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          INCC inválido. Informe um percentual entre 0 e 100, ex.: 6,00.
        </p>
      )}
      {sp.erro === "1" && (
        <p role="alert" className="rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          Valor inválido. Informe um percentual entre 0 e 1, ex.: 0,0472.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-linha pt-3">
        <span className="text-xs text-tinta">
          {data?.atualizado_em
            ? `Atualizado em ${new Date(data.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            : ""}
        </span>
        <button type="submit" className="min-h-9 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95">
          Salvar
        </button>
      </div>
    </form>
  );
}

const NOMES_COLUNA: Record<TipoColuna, string> = {
  SOR: "Sorteio",
  FIX: "Lance fixo",
  LIM: "Lance limitado",
  LIV: "Lance livre",
  FID: "Lance fidelidade",
};

function Campo({ rotulo, nome, valor }: { rotulo: string; nome: string; valor: string }) {
  return (
    <label className="grid grid-cols-[1fr_7rem] items-center gap-3 text-xs font-semibold text-tinta">
      {rotulo}
      <input className="campo-sm" name={nome} inputMode="decimal" defaultValue={valor} required />
    </label>
  );
}
