// Grava o dicionário de dados em JSON (entrada de scripts/gerar_er.py). Uso: npx tsx scripts/exportar_dicionario.mts saida.json
import fs from "node:fs";
import { DICIONARIO, OBJETOS_APOIO, RELACIONAMENTOS } from "../src/lib/dicionarioDados";

fs.writeFileSync(process.argv[2], JSON.stringify({ DICIONARIO, RELACIONAMENTOS, OBJETOS_APOIO }));
