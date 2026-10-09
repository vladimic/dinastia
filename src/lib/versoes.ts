// Histórico de versões (fonte única: o número exibido no app vem da primeira entrada).
// Regra: a cada mudança entregue, acrescentar uma entrada NO TOPO.
export const VERSOES: { numero: string; data: string; itens: string[] }[] = [
  {
    numero: "0024",
    data: "09/10/2026",
    itens: [
      "Faixa de crédito mais compacta: box mais estreito (cerca de 25% menor), com \"R$\" à esquerda e o valor à direita, separados por linhas finas; a edição segue cabendo no box.",
      "Pop-up dos grupos (ao passar o mouse nos números, no topo): agora mostra também a sequência de contemplação, 20 quadradinhos na cor de cada modalidade; vazado = só entra a partir de certo mês. O pop-up não cresceu: \"Realizadas\" e \"Faltam\" passam para a mesma linha.",
    ],
  },
  {
    numero: "0023",
    data: "09/10/2026",
    itens: [
      "Sequência de contemplação em boxes coloridos, uma contemplação por box, sempre numa linha só e repetindo as demais como antes.",
      "Boxes pontilhados = só entram a partir de certo mês, que aparece embaixo (só o número): 2º e 3º sorteio quando a quantidade de sorteios sobe, e o fidelidade no mês em que libera.",
      "Saem as notas do rodapé (Sorteios… e Fidelidade libera no mês…), já que o gráfico mostra a mesma informação. Passar o mouse ou tocar num box mostra o nome e o mês.",
    ],
  },
  {
    numero: "0022",
    data: "09/10/2026",
    itens: [
      "Faixa de crédito e Sequência de contemplação abrem em modo leitura, com um lápis no cabeçalho para editar. Na edição, só um botão: \"Finalizar edição\".",
      "Sequência de contemplação agora salva automaticamente a cada alteração (mostra \"Salvando…\" e \"Salvo ✓\"); se a alteração for inválida, avisa e não grava, e o botão passa a \"Descartar e finalizar\".",
    ],
  },
  {
    numero: "0021",
    data: "09/10/2026",
    itens: [
      "Faixa de crédito com edição direta (opção A): cada valor é um campo e grava no banco ao sair dele (ou Enter); campo vazio ou \"×\" remove o valor; \"+ valor\" adiciona. Avisa valor inválido ou repetido. Sai o botão Editar/Salvar/Cancelar.",
      "Correção na raiz do visual dos botões: um estilo global anulava tamanho e negrito dos botões; agora todos seguem o tamanho pensado (pequeno e em negrito).",
    ],
  },
  {
    numero: "0020",
    data: "09/10/2026",
    itens: [
      "Informações do grupo passam a salvar automaticamente: cada campo grava no banco ao sair dele (ou ao escolher numa lista), com aviso \"Salvo ✓\". Sai o botão \"Salvar grupo\".",
      "Correção: ao trocar de grupo, os campos mostravam o valor digitado no grupo anterior (era só a tela; o banco não tinha sido alterado). Cada grupo agora carrega os próprios valores.",
      "Fidelidade passa a entrar na ordem de contemplação desde o mês em que libera. Corrigidos os grupos 800, 820 e 830 (a tabela do PDF só o incluía no mês 48); some a frase de divergência do rodapé.",
    ],
  },
  {
    numero: "0019",
    data: "09/10/2026",
    itens: [
      "Sequência de contemplação: uma linha por grupo, sem o rótulo de assembleias e com até 25 códigos. Grupos com mais de um sorteio (ex.: 800, com 1, 2 e 3 sorteios) mostram o máximo de sorteios na linha e descrevem no rodapé em que mês a quantidade muda.",
      "Sorteio Cancelada passa de SOC para CAN (cadastro, grupos, sequências, importador e arquivos de carga).",
      "Sequência editável (botão Editar): sorteios por mês, ordem das contemplações, tipo das demais e mês de liberação do fidelidade. As faixas são refeitas numa transação só.",
      "Faixa de crédito editável (botão Editar): um valor por linha.",
      "Mês de liberação do fidelidade editável no editor da sequência.",
    ],
  },
  {
    numero: "0018",
    data: "09/10/2026",
    itens: [
      "Sequência de contemplação: as faixas que só diferem pelo lance fidelidade viram uma única linha, já com o fidelidade; no rodapé, \"Fidelidade libera no mês XX\".",
      "Novo campo fidelidade_meses em grupo_assembleia (mês em que o fidelidade libera), carregado a partir dos PDFs já lidos e gravado nas próximas importações.",
      "Tooltip das modalidades refeito: aparece ao passar o mouse ou tocar/focar no código. Removida a mensagem do rodapé sobre as 20 contemplações.",
    ],
  },
  {
    numero: "0017",
    data: "08/10/2026",
    itens: [
      "Sequência de contemplação na horizontal, só com os códigos (sor, liv, lim, fix, fid) na cor de cada modalidade, até 20 por faixa de assembleias.",
      "Sorteio Cancelada deixa de aparecer na sequência.",
      "Completando as 20 posições: se a faixa indica um tipo para as demais contemplações, repete esse tipo; se segue a mesma ordem, repete a ordem sem o sorteio.",
      "Mantida a separação por faixa de assembleias (ex.: 1ª a 36ª e 37ª em diante, quando entra o lance fidelidade).",
    ],
  },
  {
    numero: "0016",
    data: "08/10/2026",
    itens: [
      "Pagamento com furo agora é um interruptor compacto (Sim / Não) numa linha só; o box de Tipos de parcela ficou com a mesma largura da Faixa de crédito.",
      "\"Ainda não informado\" deixa de existir: os grupos sem resposta passam a valer Não, no banco e na tela.",
    ],
  },
  {
    numero: "0015",
    data: "08/10/2026",
    itens: [
      "Tipos de parcela do grupo agora são editáveis: clicar na caixa marca ou desmarca o tipo e grava na hora no banco (na assembleia vigente do grupo).",
      "Novo campo \"Pagamento com furo\" (Sim / Não), em box próprio acima de Tipos de parcela. Fica gravado na versão do grupo (grupo_assembleia, coluna nova no final da tabela); grupos existentes ficam como \"ainda não informado\" até você escolher.",
      "Exportar/Importar dados passam a incluir o pagamento com furo.",
    ],
  },
  {
    numero: "0014",
    data: "08/10/2026",
    itens: [
      "Grupos e Tabelas: nova coluna \"Tipos de parcela\", ao lado da Faixa de crédito. Lista todos os tipos do cadastro e marca (✓, em verde) os que o grupo oferece na assembleia vigente.",
    ],
  },
  {
    numero: "0013",
    data: "08/10/2026",
    itens: [
      "Novo cadastro Tipos de Parcela (menu Cadastros, abaixo de Modalidades de Contemplação): mostra os dados atuais (código, descrição, % da parcela e em quantas versões de grupos o tipo é usado) e permite incluir, editar descrição/percentual e excluir (só se não estiver em uso).",
    ],
  },
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
