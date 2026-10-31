import type { Metadata } from "next";
import { Suspense } from "react";
import { AcessoRestrito } from "@/components/AcessoRestrito";
import { createClient } from "@/lib/supabase/server";
import { PASTAS_PDF } from "@/lib/pastasPdf";
import { ehAdministrador } from "@/lib/usuario";
import { pct } from "@/lib/formato";
import { padroesDeLinha, type TipoColuna } from "@/lib/simulacao";
import { CampoPasta } from "./CampoPasta";
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
  if (!(await ehAdministrador())) return <AcessoRestrito />;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parametros_gerais")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  const pad = padroesDeLinha(data);

  const erro = String(sp.erro ?? "");
  const MENSAGENS: Record<string, string> = {
    "1": "Valor inválido. Informe um percentual entre 0 e 1, ex.: 0,0472.",
    "2": "INCC ou INPC inválido. Informe um percentual entre 0 e 100, ex.: 6,00.",
    "3": "Contemplação inválida. Informe os meses como número inteiro, de 1 a 999.",
    "4": "Valor do lance inválido: parcelas (imóveis) são números inteiros de 1 a 999; percentuais e parcela mínima (veículos), de 0 a 100.",
    "5": "Concorrência inválida. Informe um percentual entre 0 e 100.",
    "6": "Os textos do simulador não podem ficar vazios (título até 60 e texto até 80 caracteres).",
    "7": "Prazos de contemplação inválidos. Informe 7 prazos diferentes, números inteiros de 1 a 999.",
    "8": "Pasta dos PDFs muito longa (até 500 caracteres).",
  };

  return (
    <form action={salvarParametros} className="flex flex-col gap-4">
      {sp.salvo === "1" && (
        <p role="status" className="max-w-[60rem] rounded-lg bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok">
          Parâmetros salvos.
        </p>
      )}
      {MENSAGENS[erro] && (
        <p role="alert" className="max-w-[60rem] rounded-lg bg-[#fbe4e4] px-3 py-2 text-sm font-semibold text-[#9b1c1c]">
          {MENSAGENS[erro]}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {/* 1ª coluna: o que vale para todos os grupos */}
        <div className="flex w-[26rem] max-w-full flex-col gap-4">
          <Cartao titulo="Seguro prestamista" atualizado={data?.atualizado_em}>
            <label className="grid grid-cols-[1fr_7rem] items-center gap-3 text-xs font-semibold text-tinta">
              % do crédito ao mês (todos os grupos)
              <input className="campo-sm" name="seguro_padrao_pct" inputMode="decimal" defaultValue={pct(data?.seguro_padrao_pct, 4)} required />
            </label>
            <p className="text-[11px] leading-snug text-tinta">
              Usado no cálculo do seguro de todos os grupos, imóveis e veículos. Ex.: 0,0472% de R$ 300.000,00 = R$ 141,60 por mês.
            </p>
          </Cartao>

          <Cartao titulo="Simulador (imóveis e veículos)">
            <Campo rotulo="INCC projetado, imóveis (% ao ano)" nome="incc_pct_ano" valor={pct(pad.incc)} />
            <Campo rotulo="INPC projetado, veículos (% ao ano)" nome="inpc_pct_ano" valor={pct(pad.inpc)} />
            <Campo rotulo="Contemplação em (meses)" nome="contemplacao_meses" valor={String(pad.contemplacaoMeses)} />
            <div className="flex flex-col gap-1.5">
              <span id="rotulo-prazos" className="text-xs font-semibold text-tinta">
                Prazos de contemplação (meses)
              </span>
              <div role="group" aria-labelledby="rotulo-prazos" className="flex flex-wrap gap-1.5">
                {pad.contemplacaoPrazos.map((m, i) => (
                  <input key={i} className="campo-sm !w-[3.3rem]" name={`contemplacao_prazo_${i + 1}`} inputMode="numeric" defaultValue={String(m)} required aria-label={`Prazo ${i + 1} de 7`} />
                ))}
              </div>
              <p className="text-[11px] leading-snug text-tinta">
                Os 7 atalhos do campo Contemplação em do simulador. Informe 7 prazos diferentes, de 1 a 999; eles são gravados em ordem crescente.
              </p>
            </div>
            <p className="text-[11px] leading-snug text-tinta">
              Valores com que o simulador de cada grupo abre. Na tela do simulador, o índice (INCC ou INPC), o seguro, a contemplação e os lances livre e fidelidade podem ser alterados para aquela simulação, sem mudar estes parâmetros.
            </p>
          </Cartao>

          <Cartao titulo="Textos sob o prazo restante (simulador)">
            {(Object.keys(NOMES_COLUNA) as TipoColuna[]).map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{NOMES_COLUNA[k]}</span>
                <input className="campo-sm !text-left" name={`rodape_${k}_titulo`} defaultValue={pad.rodape[k].titulo} maxLength={60} required aria-label={`${NOMES_COLUNA[k]}: título`} />
                <input className="campo-sm !text-left" name={`rodape_${k}_texto`} defaultValue={pad.rodape[k].texto} maxLength={80} required aria-label={`${NOMES_COLUNA[k]}: texto`} />
              </div>
            ))}
            <p className="text-[11px] leading-snug text-tinta">
              Aparecem sob o prazo restante de cada coluna do simulador (em veículos, o Fixo 25% usa o texto do Lance fixo e o Fixo 40% o do Lance limitado).
            </p>
          </Cartao>
        </div>

        {/* 2ª coluna: imóveis */}
        <div className="flex w-[26rem] max-w-full flex-col gap-4">
          <Cartao titulo="Imóveis">
            <Campo rotulo="Parcelas do lance livre" nome="lance_livre_parcelas" valor={String(pad.lanceLivreParcelas)} />
            <Campo rotulo="Parcelas do lance fidelidade" nome="lance_fidelidade_parcelas" valor={String(pad.lanceFidelidadeParcelas)} />
            <p className="text-[11px] leading-snug text-tinta">Parcelas com que o simulador de um grupo de imóveis abre os lances livre e fidelidade.</p>

            <h3 className="border-t border-linha pt-3 text-xs font-bold">Concorrência dos lances (%)</h3>
            <Campo rotulo="Lance fixo" nome="concorrencia_fixo_pct" valor={pct(pad.concorrencia.FIX)} />
            <Campo rotulo="Lance limitado" nome="concorrencia_limitado_pct" valor={pct(pad.concorrencia.LIM)} />
            <Campo rotulo="Lance livre" nome="concorrencia_livre_pct" valor={pct(pad.concorrencia.LIV)} />
            <Campo rotulo="Lance fidelidade" nome="concorrencia_fidelidade_pct" valor={pct(pad.concorrencia.FID)} />
            <p className="text-[11px] leading-snug text-tinta">Aparece no cabeçalho de cada coluna do simulador de imóveis; só pode ser alterada aqui.</p>
          </Cartao>
        </div>

        {/* 3ª coluna: veículos */}
        <div className="flex w-[26rem] max-w-full flex-col gap-4">
          <Cartao titulo="Veículos">
            <Campo rotulo="% do lance livre (da categoria)" nome="lance_livre_pct" valor={pct(pad.lanceLivrePct)} />
            <Campo rotulo="% do lance fidelidade (da categoria)" nome="lance_fidelidade_pct" valor={pct(pad.lanceFidelidadePct)} />
            <Campo rotulo="Parcela mínima padrão (% da categoria)" nome="parcela_minima_padrao_pct" valor={pct(pad.parcelaMinimaPadraoPct)} />
            <p className="text-[11px] leading-snug text-tinta">
              Percentuais com que o simulador de um grupo de veículos abre os lances livre e fidelidade. A parcela mínima padrão vale para os grupos cujo PDF não informa a sua.
            </p>

            <h3 className="border-t border-linha pt-3 text-xs font-bold">Concorrência dos lances (%)</h3>
            <Campo rotulo="Lance fixo 25%" nome="concorrencia_veic_fixo25_pct" valor={pct(pad.concorrenciaVeic.F25)} />
            <Campo rotulo="Lance fixo 40%" nome="concorrencia_veic_fixo40_pct" valor={pct(pad.concorrenciaVeic.F40)} />
            <Campo rotulo="Lance livre" nome="concorrencia_veic_livre_pct" valor={pct(pad.concorrenciaVeic.LIV)} />
            <Campo rotulo="Lance fidelidade" nome="concorrencia_veic_fidelidade_pct" valor={pct(pad.concorrenciaVeic.FID)} />
            <p className="text-[11px] leading-snug text-tinta">Aparece no cabeçalho de cada coluna do simulador de veículos; só pode ser alterada aqui.</p>
          </Cartao>
        </div>
      </div>

      <div className="flex w-full max-w-[60rem] flex-col gap-3 rounded-2xl border border-borda bg-white p-5">
        <h2 className="text-sm font-bold">Pastas dos PDFs das tabelas</h2>
        {PASTAS_PDF.map(({ campo, rotulo }) => (
          <CampoPasta key={campo} nome={campo} rotulo={rotulo} inicial={(data as Record<string, string | null> | null)?.[campo] ?? ""} />
        ))}
        <p className="text-[11px] leading-snug text-tinta">
          Diretório padrão onde ficam os PDFs de cada família de tabelas; será usado pelo programa de importação.
        </p>
        <div className="flex justify-end border-t border-linha pt-3">
          <button type="submit" className="min-h-9 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95">
            Salvar
          </button>
        </div>
      </div>
    </form>
  );
}

/** Bloco de parâmetros com o botão Salvar (todos os blocos salvam o formulário inteiro). */
function Cartao({ titulo, children, atualizado }: { titulo: string; children: React.ReactNode; atualizado?: string | null }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-borda bg-white p-5">
      <h2 className="text-sm font-bold">{titulo}</h2>
      {children}
      <div className="flex items-center justify-between gap-3 border-t border-linha pt-3">
        <span className="text-xs text-tinta">
          {atualizado ? `Atualizado em ${new Date(atualizado).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}
        </span>
        <button type="submit" className="min-h-9 rounded-[10px] bg-laranja px-5 text-sm font-bold text-navy hover:brightness-95">
          Salvar
        </button>
      </div>
    </div>
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
