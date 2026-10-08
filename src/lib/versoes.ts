// Histórico de versões (fonte única: o número exibido no app vem da primeira entrada).
// Regra: a cada mudança entregue, acrescentar uma entrada NO TOPO.
export const VERSOES: { numero: string; data: string; itens: string[] }[] = [
  {
    numero: "0012",
    data: "08/10/2026",
    itens: [
      "Novo cadastro Modalidades de Contemplação (menu Cadastros, abaixo de Grupos e Tabelas): código de até 10 caracteres, nome e cor; incluir, editar nome/cor e excluir (só se não estiver em uso).",
      "Carga inicial: SOR, SOC, LIV, LIM, FIX e FID, com as cores verde, cinza, vermelho, laranja, azul e rosa. As cores ainda não são usadas em outras telas.",
      "Os códigos antigos (SORTEIO_ATIVO, LANCE_LIVRE etc.) foram trocados pelos novos nos grupos, na sequência de contemplação, no importador de PDF e nos arquivos de carga.",
    ],
  },
  {
    numero: "0011",
    data: "08/10/2026",
    itens: [
      "Seguro prestamista passa a ser um parâmetro único para todos os grupos: sai da tela e da tabela de grupos.",
      "Nova tela Cadastros › Parâmetros globais, com o % do seguro e botão Salvar.",
      "\"Dados do grupo\" passa a se chamar \"Informações do grupo\"; Faixa de crédito com a mesma largura.",
    ],
  },
  {
    numero: "0010",
    data: "08/10/2026",
    itens: [
      "Barra de assembleias no cabeçalho do grupo (opção B): realizadas e faltantes acima da barra, total à direita; saem as palavras \"Faltantes\" e \"Total\".",
      "\"Valores de crédito\" passa a se chamar \"Faixa de crédito\", sem a quantidade entre parênteses.",
      "Dados do grupo com os valores alinhados à direita.",
    ],
  },
  {
    numero: "0009",
    data: "08/10/2026",
    itens: [
      "Seletor de família alinhado pela base do título \"Grupos e Tabelas\".",
      "Barra de progresso no cabeçalho do grupo: de 0 ao total de assembleias, em laranja as já realizadas.",
      "Detalhe do grupo em quatro colunas lado a lado, cada uma no menor tamanho possível: dados do grupo (uma coluna), valores de crédito, sequência de contemplação e modalidades de contemplação.",
      "Removidos tipos de parcela, prazo da cota e observações da tabela (voltam depois, no lugar certo).",
    ],
  },
  {
    numero: "0008",
    data: "08/10/2026",
    itens: [
      "Seletor de família no cabeçalho principal, ao lado de \"Grupos e Tabelas\"; os grupos sobem na tela.",
      "Cards de grupo ainda menores; título do pop-up enxuto (Grupo 550 · 122ª · 20/10/2026).",
      "Cabeçalho do grupo numa linha: assembleia atual e data, faltantes, total e data da última atualização (importação ou gravação).",
      "Coluna Assembleia removida; Dados do grupo sem número, família e prazo (já estão no cabeçalho), em duas colunas compactas, com tipos de parcela e prazo da cota no rodapé.",
    ],
  },
  {
    numero: "0007",
    data: "08/10/2026",
    itens: [
      "Histórico de versões abre em janela no centro da tela, com rolagem e botão OK.",
      "Menu ☰ passa para a linha da versão (o e-mail não é mais cortado); \"backup\" passa a se chamar Exportar dados / Importar dados.",
      "Grupos e Tabelas mais compacto: sem os títulos de etapa, famílias com a quantidade entre parênteses, cards de grupo cerca de 30% menores.",
      "Pop-up do grupo com assembleia e data no título; sem a linha de rodapé.",
      "Detalhe do grupo em três colunas: dados do grupo, assembleia (atual, data, realizadas, faltam, prazo da cota, tipos de parcela) e valores de crédito do menor para o maior; origem da versão na linha do título.",
    ],
  },
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
