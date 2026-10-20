import { Suspense } from "react";
import { ehAdministrador } from "@/lib/usuario";
import { Sidebar } from "./Sidebar";
import { RodapeConteudo, UsuarioRodape } from "./UsuarioRodape";

const rodape = (
  <Suspense fallback={<RodapeConteudo email="" />}>
    <UsuarioRodape />
  </Suspense>
);

async function ComPerfil() {
  return <Sidebar rodape={rodape} admin={await ehAdministrador()} />;
}

// Os itens só de administrador aparecem assim que o perfil é conhecido.
export function MenuLateral() {
  return (
    <Suspense fallback={<Sidebar rodape={rodape} />}>
      <ComPerfil />
    </Suspense>
  );
}
