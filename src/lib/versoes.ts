// Histórico de versões (fonte única: o número exibido no app vem da primeira entrada).
// Regra: a cada mudança entregue, acrescentar uma entrada NO TOPO.
export const VERSOES: { numero: string; data: string; itens: string[] }[] = [
  {
    numero: "0006",
    data: "07/10/2026",
    itens: [
      "Menu ☰ junto ao e-mail: exportar backup, importar backup, histórico de versões e sair.",
      "Backup em arquivo JSON com tudo do banco (grupos, versões por assembleia, modalidades, sequências, cadastros de apoio); você escolhe a pasta quando o arquivo fica pronto.",
      "Importar backup repõe o que estiver faltando e devolve os dados dos grupos como estavam no arquivo; nunca apaga nada.",
      "Grupos e Tabelas: cards dos grupos compactos (só o número); ao passar o mouse, faixa de crédito e assembleias totais, realizadas e faltantes.",
    ],
  },
  {
    numero: "0005",
    data: "07/10/2026",
    itens: [
      "Carga de 131 grupos de imóveis (assembleia de 20/10/2026), lidos de 198 PDFs: fica a tabela mais recente de cada grupo; planos 1%/2% e versões de agosto descartados.",
      "Leitor de PDF aceita grupos sem Lance Limitado/Fidelidade, novas regras de embutido, sem dia de vencimento e \"demais seguem com\" duas modalidades.",
      "Tela de importação da carga com o login do usuário.",
    ],
  },
  {
    numero: "0004",
    data: "07/10/2026",
    itens: ["Correção: imagens PNG do ícone (192 px e iPhone) que faltaram na 0003."],
  },
  {
    numero: "0003",
    data: "07/10/2026",
    itens: ["Ícone oficial do app: \"Elos\" (dois anéis entrelaçados, ouro e laranja sobre navy)."],
  },
  {
    numero: "0002",
    data: "07/10/2026",
    itens: [
      "Banco reestruturado pelo modelo aprovado: grupo (chave = número), versão por assembleia, tipos de parcela, modalidades, sequência e parâmetros gerais.",
      "Cálculos sempre pela maior assembleia do grupo.",
      "Primeira importação: 13 grupos de imóveis, assembleia de 20/10/2026.",
      "Leitor de PDF com validação de prazo, parcela e seguro.",
      "Tela Grupos e Tabelas: família, grupos lado a lado, versão vigente, créditos, tipos de parcela, modalidades e sequência.",
      "Acesso restrito por lista de e-mails autorizados.",
    ],
  },
  {
    numero: "0001",
    data: "07/10/2026",
    itens: [
      "Estrutura inicial: Next.js + Supabase na Vercel, instalável como app no Chrome.",
      "Login por e-mail e senha, \"esqueci minha senha\" e nova senha.",
      "Menu lateral com e-mail do usuário e versão.",
    ],
  },
];
