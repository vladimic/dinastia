"use client";

import { useEffect, useRef } from "react";

// A linha de cards do grupo (Faixa de crédito, Pagamento com furo, Sequência, Modalidades…). Mede até onde ela vai,
// pela direita (borda do box Modalidades de contemplação), e publica em --larg-cards para a grade do simulador ter a mesma largura.
export function LinhaCartoes({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const raiz = el?.closest<HTMLElement>("[data-raiz-grupo]");
    if (!el || !raiz) return;
    const medir = () => {
      let direita = 0;
      for (const f of Array.from(el.children) as HTMLElement[]) direita = Math.max(direita, f.offsetLeft + f.offsetWidth);
      raiz.style.setProperty("--larg-cards", `${Math.round(direita)}px`);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    for (const f of Array.from(el.children)) ro.observe(f);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative flex flex-wrap items-start gap-3">
      {children}
    </div>
  );
}
