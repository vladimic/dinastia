import type { Metadata } from "next";
import { PrototipoGrupo } from "./PrototipoGrupo";

export const metadata: Metadata = { title: "Protótipo · Grupos e Tabelas · Dinastia" };

// Protótipo de layout (dados fictícios, nada é gravado): barra de cenário, regras sob demanda e simulador compacto.
export default function PrototipoPage() {
  return <PrototipoGrupo />;
}
