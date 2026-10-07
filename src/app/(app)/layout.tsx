import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { RodapeConteudo, UsuarioRodape } from "@/components/UsuarioRodape";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <Sidebar
        rodape={
          <Suspense fallback={<RodapeConteudo email="" />}>
            <UsuarioRodape />
          </Suspense>
        }
      />
      <div className="flex min-w-0 flex-[999_1_560px] flex-col">{children}</div>
    </div>
  );
}
