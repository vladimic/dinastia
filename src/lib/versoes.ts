// Histórico de versões (fonte única: o número exibido no app vem da primeira entrada).
// Regra: a cada mudança entregue, acrescentar uma entrada NO TOPO.
export const VERSOES: { numero: string; data: string; itens: string[] }[] = [
  {
    numero: "0127",
    data: "31/10/2026",
    itens: [
      "Edição em lote de veículos: novas colunas 6, 12, 18 e 24 mostram (bolinha verde) se o grupo tem plano reduzido com essa quantidade de parcelas reduzidas. Só consulta: o valor vem do PDF.",
    ],
  },
  {
    numero: "0126",
    data: "31/10/2026",
    itens: [
      "Veículos, modalidades: no Lance Livre e no Fidelidade sem teto (*), o Próprio deixa de ser traço e passa a mostrar \"Lance − 25%\" (o lance menos o embutido).",
    ],
  },
  {
    numero: "0125",
    data: "31/10/2026",
    itens: [
      "Seleção de grupos de veículos: ao lado da bolinha verde de parcela reduzida aparece a quantidade de parcelas reduzidas do grupo (6, 12, 18 ou 24).",
      "Veículos, modalidades: quando o PDF dá o embutido em % do valor ofertado (ex.: grupo 1615), voltou a aparecer como veio: embutido 50% do lance e próprio 50% do lance, sem conversão (nos fixos e no livre). Revertida a conversão da 0124 no banco e na leitura dos PDFs.",
    ],
  },
  {
    numero: "0124",
    data: "31/10/2026",
    itens: [
      "Veículos, modalidades de contemplação: tudo em % da categoria. Embutido (ex.: 25%) e Próprio (= lance − embutido: Fixo 25 = 0%, Fixo 40 = 15%, Livre e Fidelidade até 55% = 30%). O rótulo \"Lance (% categ.)\" virou \"Percentual Categoria\". O embutido dos fixos que vinha em % do lance foi convertido para % da categoria no banco e na leitura dos PDFs.",
      "Seleção de grupos de veículos: o filtro Parcelas reduzidas ficou ao lado de Parcela reduzida, antes do crédito.",
    ],
  },
  {
    numero: "0123",
    data: "31/10/2026",
    itens: [
      "Tipos de Parcela e Modalidades de Contemplação agora têm Família (imóveis, veículos...). O que já existia ficou em imóveis; o que foi criado para veículos (F25, F40, planos em duas fases) ficou em veículos; Sorteio, Lance Livre e Fidelidade existem nas duas. Dentro de um grupo só aparecem os tipos da família dele. Para repetir um tipo em outra família, crie de novo com o mesmo código.",
      "Seleção de grupos: a barra de participantes de veículos enche com 5 mil (imóveis seguem com 9.999).",
      "Seleção de grupos de veículos: sai o filtro de Furo e Parcela 70; as parcelas 50/55 viram só Parcela reduzida; novo filtro Parcelas reduzidas (12, 18, 24) logo ao lado.",
      "Informações do grupo: \"Taxa adm. total\" agora é \"Taxa de administração\".",
    ],
  },
  {
    numero: "0122",
    data: "31/10/2026",
    itens: [
      "Parâmetros globais reorganizados em blocos, sem misturar famílias. 1ª coluna (vale para todos): Seguro prestamista, Simulador (INCC projetado dos imóveis, novo INPC projetado dos veículos com 5%, contemplação em meses e os 7 prazos) e os textos sob o prazo restante. 2ª coluna: Imóveis (parcelas dos lances livre e fidelidade e a concorrência dos imóveis). 3ª coluna: Veículos (% do lance livre e fidelidade, parcela mínima padrão e a nova concorrência dos lances de veículos: Fixo 25%, Fixo 40%, Livre e Fidelidade).",
      "Simulador de veículos: o campo de índice passa a ser o INPC (abre com o INPC projetado) e o cabeçalho de cada coluna mostra a concorrência de veículos.",
    ],
  },
  {
    numero: "0121",
    data: "31/10/2026",
    itens: [
      "Importar tabelas, Com erro de leitura: cada PDF ganhou o botão Remover (tira da lista e o PDF não é lido de novo) e a lista ganhou Remover todos os erros. O Ler de novo continua: ele tira da lista e o PDF é lido na próxima leitura da pasta.",
    ],
  },
  {
    numero: "0120",
    data: "31/10/2026",
    itens: [
      "Importar tabelas: some a mensagem de resumo depois da leitura (“N PDFs na pasta: … lidos agora …”) e o aviso da Estratégia Comercial. Continuam os avisos que pedem atenção: PDFs desconsiderados (com o motivo) e arquivos que o navegador não conseguiu abrir.",
      "Importar tabelas: o histórico sai da tela. Ficam só “A decidir”, “Prontos para aplicar” e “Com erro de leitura”; Aplicados, Sem mudança e Ignorados não aparecem mais. Os registros continuam no banco por trás: é com eles que a próxima leitura pula os PDFs iguais e que a lista de grupos sem PDF sabe a data de referência.",
    ],
  },
  {
    numero: "0119",
    data: "31/10/2026",
    itens: [
      "Importar tabelas: a família Veículos ganhou o botão de ler os PDFs (antes só Imóveis tinha). Vale também para Motos, que estão em Veículos.",
      "Veículos, etapa 5 (Tabela Resumo): o botão Exportar Tabela Resumo exporta a família que está aberta (Imóveis ou Veículos), em Excel e PDF, no mesmo modelo. Em Veículos: título “Grupos e cotas veículos”, colunas FIXO 25% e FIXO 40% (Qtd em % da categoria e Emb em % do lance, calculado no lance máximo), Fidelidade e Livre com o teto em % (ou * sem teto), ordem de contemplação com f25 e f40 nas cores do Fixo e do Limitado, e a coluna Par com a quantidade de parcelas reduzidas do plano em duas fases (sem plano, o % da menor parcela, como em Imóveis).",
      "Tabela Resumo: com mais de 11 créditos no grupo (o 1504 tem 22), a coluna Créditos (mil) mostra 11 valores igualmente espaçados, sempre com o menor e o maior.",
    ],
  },
  {
    numero: "0118",
    data: "31/10/2026",
    itens: [
      "Veículos, etapa 4 (importação): a importação de tabelas passa a gravar Veículos e Motos, com o mesmo fluxo dos Imóveis: leitura da pasta, comparação com a base, decisão por campo (aceitar, rejeitar, editar) e aplicação. Entram os campos novos: parcela mínima do grupo, plano reduzido em duas fases, Fixo 40% e 25%, teto do Livre e base do embutido. Grupo novo de Veículos entra sem furo.",
      "Importação: cada família tem a sua assembleia de referência para a lista de grupos sem PDF (Imóveis e Veículos têm datas diferentes) e o salto automático também vale para Veículos.",
      "Importação: a Estratégia Comercial de Veículos é reconhecida e deixada de lado (não é tabela de grupo nem fonte de valores), com um aviso na leitura.",
      "Veículos: a leitura passou a entender a quantidade de sorteios da faixa (ex.: “03 Sorteios Cotas Ativas” nos grupos 1690 e 1691) e confere que a sequência não repete modalidade. O backup leva e restaura os campos novos.",
      "Parcela mínima de Veículos passa a ser % da categoria (crédito + taxas), no PDF e no padrão de Parâmetros globais.",
    ],
  },
  {
    numero: "0117",
    data: "31/10/2026",
    itens: [
      "Veículos, regras da importação anotadas (docs/regras-de-importacao.md): só vale o PDF individual de cada grupo, inclusive para o tipo do plano (o título do PDF); a Estratégia só serve para a quantidade de parcelas reduzidas, e apenas se o PDF individual não a trouxer.",
      "Veículos, embutido do Livre: “permitido até 60%” passa a ser lido como até 60% da categoria (lance de 70% = 60% embutido + 10% próprio), e não 60% do lance. O “20% limite máximo no livre” continua sendo 20% da categoria.",
      "Parâmetros globais: nova “parcela mínima padrão” de Veículos (0,7%), usada no simulador dos grupos cujo PDF não informa a parcela mínima.",
    ],
  },
  {
    numero: "0116",
    data: "31/10/2026",
    itens: [
      "Veículos, etapa 3 (leitor de PDF): leitor próprio para as tabelas de Veículos e Motos (plano linear; reduzido em duas fases: Plano 40, 50, 75 e Clearance; reduzido 50% até a contemplação; Fixo 40% e 25%; teto do Livre; embutido do lance ou da categoria; parcela mínima; sequência nos três formatos de texto). Lê os 130 PDFs sem nenhum erro, e a parcela de cada crédito (linear, fase 1 e fase 2) bate com o valor impresso em todos eles.",
      "Veículos: leitor da “Estratégia Comercial” (um PDF com todos os grupos). Ele não é fonte de dados: serve para conferir a leitura (créditos, taxa, prazos e plano reduzido de cada grupo). Valem sempre os PDFs individuais. Quando o título do plano no PDF discorda dos números (grupo 1667: título “Plano 50”, mas 0,5% é o Plano 40), valem os números.",
      "Simulador de Veículos: o plano reduzido que dura mais que a cota (parcelas de furo) passa a ratear o saldo no prazo que resta da cota, como diz o PDF (“diluídas no momento da contemplação”).",
      "A importação de Veículos ainda não grava na base (etapa 4): por ora esses PDFs são lidos, mas ficam como erro, sem alterar nada.",
    ],
  },
  {
    numero: "0115",
    data: "31/10/2026",
    itens: [
      "Veículos, etapa 2 (simulador): colunas Sorteio, Fixo 25%, Fixo 40%, Livre e Fidelidade, com os lances em % da categoria (crédito + taxa + fundo de reserva). Os botões − e + mudam o % de 1 em 1, dentro do teto do grupo (o Fidelidade segue o teto do Livre). Livre abre em 55% e Fidelidade em 45% (Parâmetros globais).",
      "Veículos, simulador: o plano linear usa o prazo da cota e o plano reduzido (Plano 40, 50, 75 e Clearance) usa as duas fases; a parcela mínima do grupo vale depois da contemplação (se o rateio ficar abaixo dela, paga-se o mínimo e o saldo quita antes do prazo). O embutido pode ser % do lance ou % da categoria. Sem furo, sem a opção de furo na tela.",
      "Veículos, telas do grupo: Modalidades mostra o lance em %, os planos reduzidos aparecem com o nome (Plano 50…) e o furo não aparece. Conferido contra as parcelas dos PDFs (grupos 1719 e 1621): linear, fase 1 e fase 2 batem ao centavo.",
    ],
  },
  {
    numero: "0114",
    data: "31/10/2026",
    itens: [
      "Veículos, etapa 1 (modelo de dados, sem mudança nas telas): novas modalidades de lance Fixo 40% (cor do Limitado) e Fixo 25% (cor do Fixo), todas as modalidades de lance em % da categoria, teto do Livre, base do embutido (do lance ou da categoria), parcela mínima no grupo e plano reduzido em duas fases (Plano 40, 50, 75 e Clearance). Imóveis não mudam.",
    ],
  },
  {
    numero: "0113",
    data: "31/10/2026",
    itens: [
      "Simulador: nos lances Livre e Fidelidade, o texto ao lado do − e do + volta a ser “parcelas” por extenso quando a coluna tem espaço; “parc.” só aparece em colunas estreitas.",
    ],
  },
  {
    numero: "0112",
    data: "31/10/2026",
    itens: [
      "Simulador: nova paleta de cores por lance, em pastel e com as cores da Tabela Resumo: Sorteio verde, Fixo azul, Limitado laranja, Livre vermelho e Fidelidade rosa (cabeçalho, barra de concorrência, linha Lance Total e rodapé de cada coluna).",
      "Simulador: o − e o + do Livre e do Fidelidade ficam na mesma linha do campo de parcelas (o texto passou para “parc.” nesses dois lances).",
    ],
  },
  {
    numero: "0111",
    data: "31/10/2026",
    itens: [
      "Simulador: os lances Livre e Fidelidade ganharam botões − e + ao lado do campo de parcelas, para não precisar digitar. Os limites continuam os mesmos: no Livre, o máximo do grupo e os meses que faltam; no Fidelidade, o máximo do grupo; mínimo de 1 parcela. O botão trava ao chegar no limite.",
    ],
  },
  {
    numero: "0110",
    data: "31/10/2026",
    itens: [
      "Next.js atualizado da 16.4.0 para a 16.4.3, que corrige falhas de segurança (execução remota de código em otimização de imagem e em funções com cache, e negação de serviço em ações de servidor). Nenhuma mudança na tela.",
    ],
  },
  {
    numero: "0109",
    data: "31/10/2026",
    itens: [
      "Edição em lote: o filtro de família (Imóveis, Veículos, Serviços, Outros Bens) agora está na própria tela. Abre na família que estava selecionada e permite navegar entre as famílias sem fechar; ao trocar, a lista guardada da família anterior é refeita.",
      "Edição em lote: corrigido o cabeçalho da tabela, que deixava as linhas aparecerem acima dele ao rolar.",
    ],
  },
  {
    numero: "0108",
    data: "31/10/2026",
    itens: [
      "Grupos e Tabelas: novo botão “Edição em lote” (só para administradores), à esquerda de Exportar Tabela Resumo. Abre uma tabela com todos os grupos da família: uma coluna por tipo de parcela e uma para o furo, cada uma com uma chave de ligar/desligar. Cada clique já grava na base (se falhar, a chave volta ao que era).",
      "Edição em lote: os mesmos filtros da lista de grupos (Furo, Parcela 70, Parcela 50/55, faixa de crédito e participantes). Eles valem para o que foi lido ao abrir: a linha não some no meio da edição. O botão “Fechar edição em lote” refaz a lista guardada da família uma vez só.",
    ],
  },
  {
    numero: "0107",
    data: "22/10/2026",
    itens: [
      "Grupos e Tabelas: a lista de grupos de cada família passa a ficar guardada pronta (tabela lista_grupos) e a tela só a lê, em vez de montá-la a cada troca de grupo. A lista é refeita quando a importação é aplicada (e também quando um grupo é editado na tela ou um backup é restaurado, para não ficar com dado velho). Na primeira abertura ela é montada e guardada.",
      "Importação: PDFs que o leitor não reconheceu (por exemplo, o formato antigo do grupo 6102) agora aparecem em destaque, com o nome do arquivo e o motivo, ao final da leitura, e um aviso fixo na tela de decisões enquanto houver PDFs com erro.",
    ],
  },
  {
    numero: "0106",
    data: "22/10/2026",
    itens: [
      "Exportar Tabela Resumo: a coluna da parcela (reduzida) ganha a mesma cor do número do grupo: verde em negrito para 50 e 55, laranja para 70.",
      "Grupos e Tabelas: ao trocar de grupo (setas, lista ou número digitado) aparece um indicador de espera (“Abrindo grupo…” e círculo girando nas setas) e novos cliques ficam bloqueados até a tela abrir, para não clicar duas vezes sem saber se funcionou.",
      "Grupos e Tabelas: a busca do grupo, da lista e dos parâmetros agora acontece em paralelo, e não mais em três etapas em fila, o que encurta o tempo de troca de grupo.",
    ],
  },
  {
    numero: "0105",
    data: "21/10/2026",
    itens: [
      "Simulador: os tipos de parcela da lateral ficam numa linha só, sem o rótulo “Tipo de parcela”; o título é a frase logo acima (“Parcela Reduzida 50% · com furo”).",
    ],
  },
  {
    numero: "0104",
    data: "21/10/2026",
    itens: [
      "Simulador: o tipo de parcela passa a ser escolhido na coluna lateral, acima do Pagamento com furo. Verde = o grupo oferece; laranja = o escolhido na simulação. O Pagamento com furo também usa laranja no escolhido.",
      "Cabeçalho do grupo: os tipos de parcela ficam só indicativos (verde = oferecido) e o Furo mostra sempre o valor real do grupo, sem mudar com a simulação.",
    ],
  },
  {
    numero: "0103",
    data: "21/10/2026",
    itens: [
      "Simulador: novo seletor “Pagamento com furo: Sim / Não” na coluna de parâmetros. Com furo = sim no grupo, dá para simular também sem furo (sem alterar o grupo); com furo = não, só o Não fica disponível. Verde = possível; o escolhido fica em verde forte.",
      "Simulador: com o Lance Total recolhido, a linha fica alinhada com as colunas de cima e a palavra LANCE não é mais cortada.",
    ],
  },
  {
    numero: "0102",
    data: "21/10/2026",
    itens: [
      "Simulador: o cadeado passa a aparecer em todo lance em que o grupo limita as parcelas (Fixo, Limitado e também o Fidelidade quando tem máximo, como 99 parcelas); o martelo fica nos lances de leilão sem limite do grupo, como o Livre.",
      "Simulador: sai a informação “máx.” embaixo do lance livre (a validação dos meses que faltam continua). A explicação do ícone fica só no tooltip.",
      "Simulador: botão de recolher/expandir na linha Lance Total, que esconde ou mostra o recurso da carta (embutido) e o recurso próprio (dinheiro).",
    ],
  },
  {
    numero: "0101",
    data: "21/10/2026",
    itens: [
      "Simulador: valores com centavos (crédito, parcelas, recursos, saldo devedor e demais linhas da grade). Os créditos disponíveis do cabeçalho do grupo continuam sem casas decimais.",
      "Simulador: nova linha “Lance Total” e bloco LANCE (recurso da carta, recurso próprio e total) antes do Crédito Disponível após a Contemplação. A linha “Dinheiro Novo” passou a se chamar “Crédito - Lance com Recurso Próprio”.",
      "Simulador: o cadeado (lance pré-definido: campo travado, borda tracejada) e o martelo (leilão: campo editável) ficam junto do campo de parcelas do lance. O lance livre não passa dos meses que faltam para o grupo terminar e mostra “máx.” abaixo do campo.",
      "Simulador: Custo Mensal e Custo Anual voltaram a ser calculados: ficaram sem valor na 0100 porque passaram a usar o novo crédito (sem descontar as parcelas já pagas). O custo continua usando o crédito líquido de parcelas pagas.",
    ],
  },
  {
    numero: "0100",
    data: "21/10/2026",
    itens: [
      "Simulador: o “% próprio” do cabeçalho de cada lance (bolinha amarela) passa a ser calculado: lance com recurso próprio ÷ crédito contratado. Fixo, Limitado, Livre e Fidelidade mostram o seu percentual; fora do que o grupo oferece, aparece “—”.",
      "Simulador: o Dinheiro Novo passa a ser o crédito disponível após a contemplação menos o lance com recurso próprio. Antes também descontava as parcelas já pagas até a contemplação; o Custo Mensal e o Custo Anual mudam junto, porque são calculados sobre o dinheiro novo.",
    ],
  },
  {
    numero: "0099",
    data: "21/10/2026",
    itens: [
      "“Demais contemplações seguem com Livre e Fidelidade” (e “Livre e Limitado”) agora são guardadas de verdade: a faixa da sequência ganhou uma segunda modalidade (demais_tipo_2) e as demais alternam as duas, como no manual. Antes só a primeira era gravada e a frase ia para as observações.",
      "Tabela Resumo e telas de Grupos: grupos 530, 540, 550, 560, 640 e 690 passam a mostrar a ordem “… fid liv fid liv …” e o grupo 900, “… liv lim liv lim …”. Os dados atuais foram convertidos a partir do texto das observações (a frase saiu de lá).",
      "Editor da sequência (Grupos): ao escolher o tipo das demais, aparece o campo “alternar com”. Leitor de PDF passou para a versão 6, então os PDFs são lidos de novo na próxima importação. Dicionário de dados e diagrama ER atualizados (migração 0030).",
    ],
  },
  {
    numero: "0098",
    data: "21/10/2026",
    itens: [
      "Exportar Tabela Resumo: a coluna Emb (embutido) deixa de mostrar parcelas (“50P”) e passa a mostrar sempre o percentual, calculado como no quadro Modalidades de contemplação de Grupos e Tabelas (o menor entre o % do lance e o limite em parcelas sobre o lance máximo, arredondado para baixo).",
      "Exportar Tabela Resumo: com 3 sorteios ou mais, a ordem de contemplação começa com uma célula só (“sor3”, “sor4”, “sor5”); antes isso valia só a partir de 4. Com 1 ou 2 sorteios, continuam um a um.",
      "Importação de PDFs: grupo NOVO passa a entrar com pagamento com furo = sim. Os últimos grupos novos importados (12208, 12210 e 12211) foram atualizados para furo = sim; o 12208 estava como não.",
    ],
  },
  {
    numero: "0097",
    data: "21/10/2026",
    itens: [
      "Importar tabelas (PDF): grupos que não vieram na leitura. A assembleia de referência é a mais recente entre os PDFs lidos; os grupos de Imóveis que ainda estão numa assembleia mais antiga e não têm PDF dessa data aparecem num quadro “Grupos sem PDF”, e para cada um você escolhe: “Vou reimportar o PDF” (fica em “Aguardando PDF”) ou “Salto automático” (não existe PDF específico).",
      "Salto automático: o grupo ganha a próxima assembleia (número = anterior + meses entre as datas) com a data de referência e o prazo da cota recalculado (prazo do grupo − (assembleia − 1)); créditos, tipos de parcela, modalidades, sequência, pagamento com furo e dados do grupo ficam iguais aos da anterior. Fica registrado em importacao_item como “(sem PDF) salto automático”. Para vários grupos de uma vez, o sistema pede confirmação. Migração 0029 (tabela importacao_faltante).",
    ],
  },
  {
    numero: "0096",
    data: "21/10/2026",
    itens: [
      "Grupos e Tabelas: o box Ordenar saiu da lista de grupos; a lista fica sempre em ordem de número. Os filtros (parcela, crédito, participantes) seguem iguais.",
    ],
  },
  {
    numero: "0095",
    data: "21/10/2026",
    itens: [
      "Importação de PDFs: PDFs descartados, ignorados ou com erro ganham o botão “Ler de novo”: ele tira o PDF da lista e, na próxima leitura da pasta, ele volta a ser lido. Antes, um PDF descartado nunca mais era lido (caso do grupo 12208, descartado sem querer): o item do 12208 foi reativado.",
    ],
  },
  {
    numero: "0094",
    data: "21/10/2026",
    itens: [
      "Importação de PDFs: corrigido o erro “a base mudou desde a leitura; leia o PDF de novo” ao aplicar grupos novos (12210 e 12211) e, em geral, ao aplicar qualquer item. A conferência feita antes de gravar comparava textos JSON, e o banco (jsonb) devolve as chaves e a lista de modalidades numa ordem diferente da original. Agora a comparação ignora a ordem das chaves e o resumo do grupo novo usa uma ordem fixa. Testado com um banco de teste que reproduz essa reordenação.",
      "A mesma ordem de chaves também podia fazer dois PDFs iguais parecerem “com dados diferentes” na detecção de duplicados; corrigido junto.",
    ],
  },
  {
    numero: "0093",
    data: "21/10/2026",
    itens: [
      "Importação de PDFs: o filtro das variações “- 1%” / “- 2%” passa a valer com o sufixo em qualquer parte do nome (ex.: “GRUPO 12210 - 1% - vigente a partir de 17.10.2026.pdf”); antes só valia no fim do nome, e as variações disputavam com o PDF principal, que acabava ignorado como “duplicado” (casos dos grupos 12210 e 12211).",
      "Corrigido: itens relidos guardavam o motivo da leitura anterior (ex.: “Duplicado de …”) mesmo já estando sem diferenças. As leituras das variações e dos PDFs principais que tinham sido ignorados por causa delas foram apagadas; na próxima leitura da pasta os principais entram normalmente.",
    ],
  },
  {
    numero: "0092",
    data: "21/10/2026",
    itens: [
      "grupo_modalidade perde o campo transferível (nenhuma tela ou cálculo usava) e a tabela obsoleta usuario_autorizado foi apagada. Migração 0028.",
      "Importação de PDFs: arquivos com sufixo “- 1%” ou “- 2%” (variações do PDF principal do grupo) deixam de ser lidos; a tela informa quantos foram desprezados. As leituras já feitas desses arquivos saíram da lista de decisões (as já aplicadas ficam como histórico).",
      "Todos os PDFs voltam a ser lidos na próxima leitura da pasta (o leitor mudou).",
    ],
  },
  {
    numero: "0091",
    data: "21/10/2026",
    itens: [
      "Dicionário de dados e modelo entidade-relacionamento: novo documento docs/modelo-de-dados.md (diagrama e dicionário de todas as tabelas e campos), desenho docs/modelo-er.svg e comentários de cada tabela e campo gravados no próprio banco (migração 0027). Fonte única: src/lib/dicionarioDados.ts.",
      "Exportar Excel (menu ☰): agora inclui as abas Dicionário e Relacionamentos, as tabelas da importação (importacao_item e importacao_diferenca) e a tabela usuario (administrador); o cabeçalho de cada aba segue o dicionário, mesmo com a tabela vazia.",
    ],
  },
  {
    numero: "0090",
    data: "21/10/2026",
    itens: [
      "Modelo de dados das modalidades (grupo_modalidade) enxuto: saem % da categoria (é máx. de parcelas ÷ prazo do grupo), base do embutido, texto do embutido e recurso próprio obrigatório (é o lance menos o embutido). O embutido passa a ter dois campos: limite em parcelas e % do lance (os dois vazios = sem embutido). O simulador, o quadro Modalidades de contemplação, a Tabela Resumo, o backup e a importação de PDFs foram ajustados; o simulador continua calculando o mesmo embutido (o menor entre o % do lance e o limite em parcelas). Migração 0026.",
      "Sorteio Cota Cancelada (CAN) removido de todo o sistema (cadastro, modalidades, sequências, editor de sequência, leitor de PDF, backup); fica só o Sorteio ativo (SOR).",
      "Importação de PDFs: o leitor passa a guardar só os campos novos. Todos os PDFs, inclusive os já aplicados, são lidos de novo na próxima leitura da pasta (só os que você descartou não voltam). A carga antiga de imóveis (tela Importar carga) foi removida.",
    ],
  },
  {
    numero: "0089",
    data: "20/10/2026",
    itens: [
      "Importar tabelas (PDF): Aceitar, Rejeitar, Editar e Desfazer agora aparecem na hora (cerca de 60 ms, antes cada clique esperava o servidor e recarregava a página inteira). As marcações são gravadas em segundo plano, em lote, e o contador “Falta decidir” e o botão “Aplicar os N prontos” se atualizam na hora. Ao aplicar, o que ainda não foi gravado é enviado antes; o mesmo ao trocar de lista ou de página.",
    ],
  },
  {
    numero: "0088",
    data: "20/10/2026",
    itens: [
      "Leitor de PDFs: encontrada a causa raiz do embutido errado no Lance livre (grupo 940, e provavelmente 540 e outros): a frase das regras de embutido era procurada a partir de qualquer “Lance …” solto antes dela (como o “…seguem com Lance Livre” do fim da sequência), e a primeira regra ia para a modalidade errada. Agora a frase começa na primeira parte que realmente é uma regra (“Lance(s) … :” ou “Lance … deve ser pago …”).",
      "Reconhece também a forma sem dois-pontos: “Lance Livre deve ser pago 100% do lance com recursos próprios” = sem embutido, recurso próprio obrigatório (a mesma frase que a base já guarda).",
      "Conferências novas: toda frase “embutir)” e “deve ser pago” do PDF precisa ter sido lida; toda modalidade de lance precisa ter ficado com sua regra; a sequência precisa cobrir da 1ª assembleia ao prazo do grupo sem buracos e só citar modalidades do grupo. Se algo falhar, o PDF vai para “Com erro de leitura” com o motivo, em vez de gerar uma diferença enganosa.",
      "Todos os PDFs lidos antes são lidos de novo na próxima leitura da pasta (decisões ainda válidas são mantidas).",
    ],
  },
  {
    numero: "0087",
    data: "20/10/2026",
    itens: [
      "Leitor de PDFs: corrigido o embutido dos lances quando o PDF cita uma regra mais de uma vez para a mesma modalidade (ex.: grupo 540, Lance livre e Fidelidade). Valia só o texto da última regra, mas os números (parcelas, base, %) ficavam da primeira; agora ficam coerentes e a modalidade sem “embutir” na regra final fica sem embutido.",
      "PDFs lidos por um leitor mais antigo são lidos de novo automaticamente na próxima leitura da pasta (os já aplicados ou descartados nunca). As decisões já tomadas que continuam valendo são mantidas.",
      "Vários PDFs do mesmo grupo e assembleia que só diferem no que a base não guarda (plano de antecipado 1% ou 2%, valores das parcelas) passam a contar como duplicados: fica o primeiro, em ordem de nome, e os demais aparecem em Ignorados como “Duplicado de …”.",
    ],
  },
  {
    numero: "0086",
    data: "20/10/2026",
    itens: [
      "Importar tabelas (PDF): a leitura agora usa o seletor de pastas do Chrome. O navegador não consegue abrir o seletor num caminho digitado, então na primeira vez você escolhe a pasta; depois ela fica lembrada neste navegador e o botão passa a “Ler os PDFs de Imóveis”, que reabre a mesma pasta direto (só pede a permissão de leitura). Há o link “Trocar pasta”. A raiz da pasta é lida pelo próprio navegador, sem a janela de “enviar arquivos” de antes. Em navegadores sem esse recurso, continua o seletor comum.",
    ],
  },
  {
    numero: "0085",
    data: "20/10/2026",
    itens: [
      "Importar tabelas (PDF), família Imóveis: o botão “Escolher a pasta e ler os PDFs” abre o seletor de pastas do navegador; só os PDFs da raiz são lidos, no próprio navegador (nenhum PDF é enviado), arquivos duplicados são desprezados e os já lidos antes não são lidos de novo. O leitor foi reescrito em JavaScript e conferido contra os PDFs de exemplo; passou a ler também as tabelas com antecipado em várias parcelas e com parcelas reduzidas (grupos 560 e 12000).",
      "Cada PDF é comparado com a versão atual da base e cada diferença vira uma decisão: Aceitar, Rejeitar ou Editar (grupo, créditos, tipos de parcela, modalidades e sequência). Dá para decidir em bloco (ex.: aceitar todos os “Número de participantes”) e a tela mostra sempre quanto falta decidir. Nada entra na base antes de tudo estar decidido.",
      "Ao aplicar: grupo novo é criado; assembleia nova cria a versão em Grupo × Assembleia a partir da versão atual, já com as decisões; a mesma assembleia é atualizada. Antes de gravar, o sistema confere se a base mudou desde a leitura. Migração 0025 (tabelas importacao_item e importacao_diferenca e função aplicar_importacao).",
    ],
  },
  {
    numero: "0084",
    data: "20/10/2026",
    itens: [
      "Pastas dos PDFs (Parâmetros globais e Importar tabelas): o caminho agora ocupa um campo de duas linhas, quebrando o texto, para aparecer inteiro (antes ficava cortado numa linha só).",
    ],
  },
  {
    numero: "0083",
    data: "20/10/2026",
    itens: [
      "Pastas dos PDFs (Parâmetros globais e Importar tabelas): voltam a ser texto livre, sem o ícone do Finder, e o campo passa para uma segunda linha, com a largura toda, para o caminho caber. O Dinastia Local foi retirado.",
      "Importar tabelas (PDF): o caminho e o liga/desliga de cada família valem só para a sessão do navegador (não alteram os Parâmetros globais; ao fechar a aba voltam ao padrão).",
    ],
  },
  {
    numero: "0082",
    data: "20/10/2026",
    itens: [
      "Importar tabelas (PDF): passo a passo na própria tela para baixar o Dinastia Local (já configurado para o endereço do site) e abri-lo pelo Terminal do Mac, sem precisar de pasta de projeto nem de git.",
    ],
  },
  {
    numero: "0081",
    data: "20/10/2026",
    itens: [
      "Ícone de pasta (Parâmetros globais e Importar tabelas): agora abre o Finder já posicionado na pasta cadastrada (se ela não existir, na pasta existente mais próxima ou na pasta do usuário) e grava o caminho COMPLETO escolhido. Isso é feito pelo novo programa local scripts/dinastia_local.py (“Dinastia Local”), que roda no Mac; o navegador sozinho não consegue informar o caminho completo.",
      "Importar tabelas (PDF): mudar o caminho ou o liga/desliga de uma família não altera mais os Parâmetros globais; fica guardado só neste navegador, com o link “Voltar ao padrão dos Parâmetros”.",
    ],
  },
  {
    numero: "0080",
    data: "20/10/2026",
    itens: [
      "Parâmetros globais › Pastas dos PDFs: cada caminho ganhou o ícone de pasta, que abre o Finder para escolher a pasta. O navegador só informa o nome da pasta (não o caminho completo); o sistema troca o último trecho do caminho e pede para conferir o início.",
      "Nova tela Cadastros › Importar tabelas (PDF), só para administradores: as 4 famílias (Imóveis, Veículos, Serviços e Outros Bens) com chave liga/desliga (padrão ligada), o caminho da pasta vindo dos Parâmetros globais, editável e com o ícone do Finder. Ainda não lê os PDFs: a leitura e a comparação com a base são a próxima etapa.",
      "Grupos e Tabelas: o botão Importar PDFs saiu do cabeçalho (a importação fica só no menu principal).",
      "Índices de correção passam a seguir a mesma regra de acesso (todos leem, só administrador grava). Migração 0024.",
    ],
  },
  {
    numero: "0079",
    data: "20/10/2026",
    itens: [
      "Nova tela Cadastros › Usuários: inclusão, edição e exclusão de usuários, com CPF (chave única, validado), nome completo, e-mail, telefone com DDD e a marca de Administrador. A tela mostra quem já tem login e quem está com “Login pendente”. O sistema nunca fica sem administrador (o banco recusa remover ou rebaixar o último), e ninguém exclui, rebaixa ou troca o e-mail de si mesmo. Migração 0023 (a lista antiga usuario_autorizado foi substituída pela tabela de usuários).",
      "Apenas administradores gravam: Parâmetros globais, Modalidades de Contemplação, Tipos de Parcela, Usuários, dados dos grupos, importação e restauração de backup. Os demais usuários continuam vendo tudo e simulando. Esses itens somem do menu para quem não é administrador.",
      "Grupos e Tabelas: “Edição ligada/desligada” passa a se chamar Modo Edição, e só administradores conseguem ligá-lo.",
      "Parâmetros globais › Textos sob o prazo restante (simulador): ganhou o botão Salvar. Novo bloco Pastas dos PDFs das tabelas, com 4 parâmetros (Imóveis, Veículos, Serviços e Outros Bens) para o futuro programa de importação, já preenchidos.",
    ],
  },
  {
    numero: "0078",
    data: "17/10/2026",
    itens: [
      "Parâmetros globais › Simulador: novo parâmetro Prazos de contemplação, com 7 campos (meses), carregado com os 7 valores que o simulador já usava: 1, 12, 24, 36, 48, 60 e 120. Os prazos são gravados em ordem crescente e não podem se repetir (de 1 a 999). Migração 0022, já aplicada no banco.",
      "Simulador · Contemplação em: os 7 atalhos de prazo agora vêm sempre desse parâmetro (a lista fixa no código saiu). Atalhos maiores que os meses que faltam ao grupo continuam escondidos.",
      "Simulador · Seguro: ao ligar, o percentual aparece ao lado, vindo do parâmetro global Seguro prestamista (% do crédito ao mês), como o INCC; pode ser alterado só naquela simulação. Desligado, mostra 0,0000%.",
    ],
  },
  {
    numero: "0077",
    data: "17/10/2026",
    itens: [
      "Lista de grupos: o pop-up de detalhes volta ao passar o mouse (ou focar com o teclado) sobre um grupo, igual ao da tela antiga: crédito, participantes, reduzidas, assembleias, realizadas/faltam e a sequência de contemplação em quadradinhos coloridos. Ele tinha saído por engano na troca de telas (0071). Os boxes deixam de mostrar o balão simples do navegador, para não aparecerem dois ao mesmo tempo.",
      "O pop-up passa a abrir acima do grupo quando não cabe embaixo (a folga antiga de 160 px era menor que a altura do pop-up, de cerca de 195 px, e ele podia sair da tela).",
    ],
  },
  {
    numero: "0076",
    data: "16/10/2026",
    itens: [
      "Lista de grupos: os filtros de Crédito e Participantes saem do box e passam ao estilo leve das pílulas de Parcela (botões de participantes em pílula; campos de valor do crédito arredondados).",
      "Filtro de crédito: os valores dos campos mínimo e máximo ficam alinhados à direita.",
    ],
  },
  {
    numero: "0075",
    data: "16/10/2026",
    itens: [
      "Grupos e Tabelas: ao abrir a lista de grupos (clicando no grupo, no cabeçalho), as telas Dados do grupo e Simulador (com o resumo) ficam ocultas até escolher o grupo; o que já foi digitado no simulador é mantido.",
      "Filtro de crédito: sai o \"R$\" do rótulo e o × de limpar volta para o lado direito, dentro do box, com os dois valores um pouco mais para a esquerda.",
    ],
  },
  {
    numero: "0074",
    data: "16/10/2026",
    itens: [
      "Lista de grupos: o \"Limpa tudo\" sai do box de Participantes e vira um botão só com ícone (funil com ×), ao lado do box; dentro de Participantes fica apenas o × que limpa os participantes.",
      "Lista de grupos: os filtros ficam mais estreitos (o R$ do crédito passa para o rótulo; campos e botões menores). Com a lista a partir de ~1510px de largura tudo cabe numa linha; abaixo disso o Ordenar continua na linha de cima e Crédito, Participantes e Limpar descem juntos para a linha de baixo.",
      "Lista de grupos: o slider de crédito usa melhor a altura do box (bolinhas maiores) e o × do crédito fica junto do rótulo.",
    ],
  },
  {
    numero: "0073",
    data: "16/10/2026",
    itens: [
      "Lista de grupos: o filtro de crédito (slider) e o de participantes ficam cada um dentro de um box; o slider continua em duas linhas e o cabeçalho da lista não cresce.",
      "Lista de grupos: o filtro de participantes ganha o × para limpar, e ao lado do último valor entra o \"Limpa tudo\", que limpa Parcela, Crédito e Participantes de uma vez (Ordenar não muda).",
      "Lista de grupos: o que está selecionado nos novos filtros (participantes e faixa do slider) passa a ser laranja, como no resto do sistema.",
    ],
  },
  {
    numero: "0072",
    data: "16/10/2026",
    itens: [
      "Lista de grupos: novo filtro de valor do crédito (slider duplo, do menor ao maior crédito da família), com os valores mínimo e máximo também digitáveis. O grupo aparece quando algum crédito dele cai dentro da faixa.",
      "Lista de grupos: novo filtro de participantes (um botão para cada valor existente na família; dá para marcar mais de um).",
      "Lista de grupos: sai o campo \"Nº do grupo\" (o número continua digitável no botão do grupo, no cabeçalho). Os dois filtros novos ficam entre Parcela 50 / 55 e Ordenar, sem aumentar a altura do cabeçalho da lista.",
    ],
  },
  {
    numero: "0071",
    data: "16/10/2026",
    itens: [
      "Grupos e Tabelas: a tela nova passa a ser a oficial e única. A tela antiga (com a lista de grupos retrátil) e o item de menu \"Grupo e Tabelas ver2\" foram removidos; o endereço /grupos (login, atalho do app, link da importação) continua o mesmo.",
      "O seletor de grupo (número, setas anterior/próximo e \"Atualizado em\") foi para o cabeçalho principal, ao lado do título; o cabeçalho continua numa linha só e a página ganha altura. Sem grupo escolhido, a lista de grupos aparece aberta no corpo da página.",
      "A lista de grupos passa a abrir alinhada à margem esquerda do conteúdo da página.",
      "Simulador · Validade da proposta: não pode ser anterior a hoje (o seletor de datas bloqueia os dias passados e uma data passada digitada volta para hoje); acima de 15 dias aparece o aviso, mas a data é mantida.",
      "Dados do grupo · Modalidades de contemplação: os valores ficam centralizados na horizontal e na vertical (os rótulos da 1ª coluna ficam à esquerda, centralizados na vertical).",
    ],
  },
  {
    numero: "0070",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · Dados do grupo: os quatro boxes da linha têm a mesma altura (a do box Tipos de parcela). Sai o campo Versões da tabela de Informações do grupo; Faixa de crédito e Modalidades de contemplação se expandem por toda a altura (valores maiores e linhas iguais).",
      "Simulador · Contemplação em: o \"fim: x meses\" e os atalhos de meses ficam colados à barra, e o bloco ocupa menos espaço. O bloco Grupo passa a se chamar Informações complementares.",
      "Simulador · Proposta: mesmo desenho de Informações complementares (rótulo à esquerda, valor à direita); Vagas e Validade sem box, só com o risco embaixo, como o Contemplação em; o interruptor do INCC fica logo ao lado da palavra e o valor no final da linha; novo parâmetro Seguro (só liga/desliga). INCC e Seguro começam sempre desligados.",
    ],
  },
  {
    numero: "0069",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · Dados do grupo: Informações, Faixa de crédito, Tipos de parcela e Modalidades de contemplação ficam numa linha só (Tipos de parcela logo depois da Faixa de crédito); a Sequência de contemplação ocupa a linha de baixo. Faixa de crédito mais estreita (valores sem o R$ repetido; o título indica R$) e o aviso \"não oferecido\" saiu da lista de tipos (a linha já aparece apagada).",
      "Simulador: sai a linha entre Crédito contratado e Parcela antes da contemplação, e os dois valores ficam alinhados à direita; em Contemplação em saem o 1 e o valor do meio da régua e fica só o fim (\"fim: 156 meses\") acima da barra, à direita; saem Meses para terminar e Meses decorridos.",
    ],
  },
  {
    numero: "0068",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · cabeçalho: créditos sem centavos e com fonte maior; novo campo Qtd de cotas (− número +) ao lado dos créditos; o tipo de parcela escolhido fica em laranja, igual ao crédito.",
      "O número do grupo no botão do seletor virou campo: digite outro número e tecle Enter para abrir esse grupo.",
      "Simulador: saem a escolha de crédito, o contador de cotas e o tipo de parcela (tudo fica no cabeçalho); Crédito contratado e Parcela antes da contemplação ganham destaque no mesmo formato.",
      "Números grandes (grupo, crédito contratado, parcela, meses de contemplação) passam para a fonte do sistema, com algarismos de mesma altura.",
    ],
  },
  {
    numero: "0067",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · cabeçalho do grupo: Faixa de crédito passa a se chamar Créditos disponíveis, com o título na vertical e os valores ao lado, mais próximos, em ordem horizontal e com fonte maior (sem rolagem).",
      "Clicar num crédito ou num tipo de parcela do cabeçalho escolhe o valor usado no simulador (o escolhido fica destacado; os tipos não oferecidos ficam apagados e não podem ser escolhidos).",
    ],
  },
  {
    numero: "0066",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · seletor de grupo: a lista abre com a borda esquerda alinhada ao box do grupo selecionado e vai até a margem direita da tela; Ordenar (número, tamanho, faltam menos) fica na mesma linha de família, busca e filtros.",
      "Cabeçalho do grupo: Próxima assembleia e Tipos de parcela ficam só do tamanho do conteúdo; Faixa de crédito ganha o espaço que sobra e mostra todos os créditos do grupo, em até três linhas.",
    ],
  },
  {
    numero: "0065",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · seletor de grupo: cada box tem o número com os sinalizadores (furo, parcela 70, parcela 50 / 55) à direita, na 2ª linha realizadas/faltam::prazo e na 3ª os participantes; nada mais estoura o box.",
      "A lista de grupos ocupa a largura da tela (por cima do menu) e cabem 3 colunas a mais; Ordenar por fica na mesma linha de família, busca e filtros.",
      "O botão do grupo selecionado mostra só a família (sai \"trocar de grupo\").",
    ],
  },
  {
    numero: "0064",
    data: "16/10/2026",
    itens: [
      "Grupo e Tabelas ver2 · seletor de grupo: cada grupo mostra realizadas/faltam::prazo (ex.: 80/160::240) na linha do número; a palavra \"assembleias\" e o rodapé de legendas saíram, e o box ficou uma linha mais baixo.",
      "Cabeçalho do grupo (mesmo tamanho): Próxima assembleia com a data ao lado do número; Faixa de crédito com o menor e o maior valor do grupo; Tipos de parcela com os percentuais do cadastro, em verde os oferecidos; Furo (Sim/Não). Saíram Crédito escolhido, Parcela e Taxa · Índice.",
      "Dados do grupo: saíram Prazo do grupo, Prazo da cota, Aprovada, Arquivo da tabela e Observações. Informações do grupo ocupam 1/3 da largura, com Faixa de crédito e Modalidades de contemplação nas outras duas colunas; embaixo, Tipos de parcela e Sequência de contemplação.",
    ],
  },
  {
    numero: "0063",
    data: "16/10/2026",
    itens: [
      "Novo item de menu Grupo e Tabelas ver2 (/grupos-v2), para comparar com a tela atual, que continua igual. Usa os mesmos dados e as mesmas gravações.",
      "Seletor de grupo: botão com o grupo atual e setas de anterior/próximo; a lista abre larga, com busca pelo número, filtros (Furo, Parcela 70, Parcela 50 / 55), ordenação por número, tamanho ou assembleias que faltam, e o tamanho de cada grupo (participantes, com barra até 9.999).",
      "Resumo fixo no topo (assembleia atual, andamento, crédito escolhido, parcela, taxa e índice) e duas abas: Dados do grupo e Simulador.",
      "Dados do grupo: todas as informações do grupo em leitura; o botão Edição ligada/desligada transforma os blocos em campos (informações, faixa de crédito, tipos de parcela, furo e sequência), gravando a cada alteração.",
      "Simulador: parâmetros numa coluna à esquerda e grade à direita; Contemplação em com número grande, régua deslizante e atalhos. Corpo da tela em tons claros, para não se confundir com o menu azul.",
    ],
  },
  {
    numero: "0062",
    data: "15/10/2026",
    itens: [
      "Grupos e Tabelas: o box Sequência de contemplação ficou mais largo (16 rem) e o título deixa de quebrar linha; o box Modalidades de contemplação ficou mais largo (16,5 rem) e as palavras não se sobrepõem mais (coluna de rótulos maior e células com menos folga lateral). Os quatro cards continuam numa só linha em telas de 1440 px.",
    ],
  },
  {
    numero: "0061",
    data: "15/10/2026",
    itens: [
      "Grupos e Tabelas: Tipos de parcela, Sequência de contemplação e Modalidades de contemplação ficam com a mesma largura (15 rem) e a mesma altura da Faixa de crédito (os cards da linha esticam até a altura da linha; o Furo fica no fundo do box Tipos de parcela).",
      "Simulador: o atalho de meses selecionado em Contemplação em passa a um azul suave (fundo lavanda com borda), menos destacado que o azul escuro anterior.",
    ],
  },
  {
    numero: "0060",
    data: "15/10/2026",
    itens: [
      "Simulador: os boxes Contemplação em e Meses (para terminar e decorridos) deixam de reservar a 2ª linha do título; o conteúdo sobe e eles não ficam mais altos que os demais.",
      "Sequência de contemplação: o box fica estreito, com 5 contemplações por linha (as 25 posições em 5 linhas), e a largura se ajusta a isso. Modalidades de contemplação ficou menor e passou para o lado da Sequência. A grade do simulador continua acompanhando a borda direita do último box.",
    ],
  },
  {
    numero: "0059",
    data: "15/10/2026",
    itens: [
      "Cabeçalho do grupo: Participantes, Taxa adm. total e Índice vêm logo depois do botão +, seguidos de Assembleia atual e do gráfico. Novo botão ⋯ ao lado do + mostra/oculta esses 3 boxes. A 1ª correção passou para a janela do botão +.",
      "Tipos de parcela: o box ficou maior e ganhou, no fundo, o rótulo Furo com o sinalizador (liga/desliga e grava como antes). O box avulso Pagamento com furo foi removido.",
      "Simulador: sai o aviso \"Valor ainda de exemplo\". No rótulo das linhas, Recurso da Carta (embutido) e Recurso Próprio (dinheiro); as células mostram só os valores (sem o % embutido/dinheiro). Saldo Devedor, Valor Investido, Custo Mensal, Custo Anual e Dinheiro Novo usam o mesmo padrão de fonte e de caixa dos valores de cima, sem o fundo azul (o azul fica só nos rótulos).",
      "Boxes de parâmetros do simulador: título com 2 linhas reservadas e linha do valor de altura fixa, então os valores ficam alinhados entre todos os boxes (fonte de valor única, 14 px). O − do contador de cotas deixa de encostar no rótulo.",
    ],
  },
  {
    numero: "0058",
    data: "15/10/2026",
    itens: [
      "Crédito Contratado: o contador de cotas perde o \"x\", passa a aceitar digitação (1 a 99; vazio vale 1) e o botão + volta para dentro do box.",
      "Fidelidade em, Taxa de adm. mensal e Parcela para lance ficam com boxes mais estreitos; o INCC também.",
      "A grade do simulador passa a ter exatamente a largura da linha de cards do grupo: o lado direito das cinco colunas acompanha a borda direita do box Modalidades de contemplação (medida na tela, também ao redimensionar ou editar os cards).",
    ],
  },
  {
    numero: "0057",
    data: "15/10/2026",
    itens: [
      "Simulador: o box Crédito Contratado ganha o indicador de cotas (começa em 1x, com botões − e +, de 1 a 99). O crédito contratado é o crédito escolhido na Faixa de crédito multiplicado pelas cotas, e todos os cálculos passam a usar esse valor. O box não aumentou.",
      "Linha de boxes: \"Simulador Grupo\" vira só \"Simulador\" e fica menor; Meses para terminar e Meses decorridos ficam num único box; Fidelidade vem logo depois dos meses; Taxa de adm. mensal vem antes de Parcela para lance; Vagas, Validade e INCC ficam mais estreitos.",
      "As 5 colunas de valores da grade ficam com 1/3 a menos de largura (cabeçalho das colunas reorganizado em pilha: título, parcelas do lance, concorrência e % próprio).",
    ],
  },
  {
    numero: "0056",
    data: "15/10/2026",
    itens: [
      "Simulador: o cartão da esquerda (Crédito Imobiliário) foi removido e seus dados subiram para a linha de boxes, na ordem: Simulador Grupo · Crédito Contratado · Parcela antes da contemplação (agora o valor calculado) · Meses para terminar o plano · Meses decorridos · Taxa de adm. mensal · Contemplação em · Parcela para lance · Fidelidade em · Vagas · Validade · INCC.",
      "Grade do simulador: os nomes das linhas (Recurso da Carta, Recurso Próprio, Crédito Disponível, Valor da Parcela após, Prazo Restante, Saldo Devedor, Valor Investido, Custo Mensal, Custo Anual e Dinheiro Novo) passaram para a primeira coluna e deixam de se repetir em cada contemplação; as colunas mostram só os valores. O conteúdo sobe com o espaço liberado.",
    ],
  },
  {
    numero: "0054",
    data: "15/10/2026",
    itens: [
      "Simulador: Contemplação em ganha os atalhos 01 e 120 (agora 01 · 12 · 24 · 36 · 48 · 60 · 120); só esse box ficou mais largo para caber os sete. O atalho cujo valor está em uso fica marcado (também quando o número é digitado à mão).",
    ],
  },
  {
    numero: "0053",
    data: "15/10/2026",
    itens: [
      "Grupos e Tabelas: botão + ao lado de \"Grupo xxx · Imóveis\" abre uma janela com Fundo de reserva, Reajuste anual em e Dia de vencimento (editáveis, gravam ao sair do campo). Esses 3 campos saíram do cabeçalho, que fica com Participantes, Taxa adm. total, Índice e 1ª correção.",
      "Faixa de crédito: o box já reserva as duas colunas desde o início, mesmo com poucos valores (até 8 valores usam só a 1ª coluna), e mantém sempre a mesma largura.",
    ],
  },
  {
    numero: "0052",
    data: "15/10/2026",
    itens: [
      "Grupos e Tabelas: as Informações do grupo (participantes, taxa de administração, fundo de reserva, índice, reajuste, vencimento e 1ª correção) saíram do card e foram para o cabeçalho do grupo, à direita do gráfico de assembleias realizadas, editáveis como antes. A data de atualização foi para junto de \"Assembleia atual\", em fonte menor.",
      "Faixa de crédito: com mais de 8 valores (ex.: grupo 690, com 11) a lista passa para duas colunas e o box deixa de ficar tão alto.",
      "Simulador: volta a linha separando-o do restante do grupo e ganha, à esquerda de \"Contemplação em\", o box \"Simulador Grupo\" com o número do grupo selecionado.",
    ],
  },
  {
    numero: "0051",
    data: "15/10/2026",
    itens: [
      "Parâmetros globais: os textos sob o prazo restante do simulador passam para um box próprio, numa segunda coluna (o botão Salvar continua um só, no primeiro box).",
      "Grupos e Tabelas: removida a linha acima de \"Grupo xxx · Imóveis\" e o título \"Simulador · Grupo xxx\"; o conteúdo sobe. O aviso de valores de exemplo foi para o fim da linha de parâmetros do simulador.",
    ],
  },
  {
    numero: "0050",
    data: "15/10/2026",
    itens: [
      "Simulador: todo valor em R$ é arredondado para cima, sem casas decimais.",
      "Parâmetros globais (migração 0021, já aplicada): parcelas do lance livre (150) e do lance fidelidade (130), que o simulador usa como ponto de partida e podem ser alteradas na tela sem mudar o parâmetro; concorrência de cada lance (fixo 25%, limitado 10%, livre 3%, fidelidade 2%), só alterável nesta tela de parâmetros; e os textos do rodapé de cada coluna (sob o prazo restante). Lance limitado passa a ser fixo como o fixo (parcelas do grupo). O teto de parcelas informado pelo grupo para cada modalidade continua valendo.",
      "Parcela após a contemplação nos lances desconta o lance inteiro (recurso da carta + recurso próprio) do saldo. Lance fidelidade fica bloqueado enquanto a contemplação for antes da parcela de liberação do grupo (ex.: 36 meses).",
      "Novos cálculos: Saldo devedor = parcela após × prazo restante; Valor investido = parcelas pagas até a contemplação; Dinheiro novo = crédito disponível − recurso próprio − parcelas pagas; Custo mensal = taxa que iguala o dinheiro novo às parcelas após a contemplação (função TAXA); Custo anual = (1 + custo mensal)^12 − 1.",
    ],
  },
  {
    numero: "0049",
    data: "15/10/2026",
    itens: [
      "Simulador: primeiros cálculos reais (src/lib/simulacao.ts). Parcela para lance = (crédito + taxa de administração) ÷ prazo original do grupo (novo box no cabeçalho). Parcela antes da contemplação = ((crédito × % da parcela) + (crédito × taxa de administração)) ÷ prazo, sendo prazo = prazo total do grupo com furo e prazo que falta sem furo (o card Pagamento com furo agora também alimenta o simulador).",
      "Coluna Sorteio: crédito disponível = crédito contratado; parcela após = ((crédito + taxa) − total pago até a contemplação) ÷ prazo restante; prazo restante = prazo que falta − meses até a contemplação. Colunas de lance: recurso da carta = parcelas do lance × parcela para lance × % embutido; recurso próprio idem com o % próprio; crédito disponível = crédito − recurso da carta; parcela após e prazo iguais aos do Sorteio.",
      "Cada coluna de lance mostra as parcelas do lance (editável; o teto vem do grupo, no Fixo é fixo e no Livre, sem teto, começa igual ao Fixo). Modalidade que o grupo não oferece aparece como \"Grupo não oferece\".",
      "Valores ainda não calculados (concorrência, % próprio, saldo devedor, valor investido, custo mensal, custo anual e dinheiro novo) ganham uma bolinha amarela.",
    ],
  },
  {
    numero: "0048",
    data: "15/10/2026",
    itens: [
      "\"Contemplação em (meses)\" virou parâmetro global (Parâmetros globais › Simulador, padrão 1; migração 0020, já aplicada). O simulador abre com esse valor e ele pode ser alterado na tela, só para aquela simulação.",
      "Simulador: todos os boxes de parâmetros passam a ter a largura do box Contemplação em.",
    ],
  },
  {
    numero: "0047",
    data: "15/10/2026",
    itens: [
      "Faixa de crédito: o valor selecionado para o simulador ficava com o destaque cortado nas bordas; corrigido (contorno por dentro da linha).",
      "Simulador: \"Parcela antes da contemplação\" em duas linhas; \"Fidelidade disponível em\" vira \"Fidelidade em\"; \"Disponíveis\" volta a ser \"Vagas\"; Validade com o botão de calendário ao lado da palavra (caixa menor) e data em dd/mm/aaaa; INCC com o símbolo %.",
    ],
  },
  {
    numero: "0046",
    data: "15/10/2026",
    itens: [
      "Simulador: atalhos 12 · 24 · 36 · 48 · 60 agora ficam abaixo do campo de meses (caixa mais estreita). \"Vagas disponíveis\" vira \"Disponíveis\" e \"Validade da proposta (7 dias)\" vira \"Validade\".",
      "INCC sem \"ao ano\" e com chave ligado/desligado: desligado, a simulação assume 0%.",
      "Fidelidade disponível em passa a mostrar a parcela de liberação em \"Meses\" (36, e não 37).",
      "Meses para terminar o plano = meses que faltam do grupo; Meses decorridos = assembleias realizadas; Taxa de administração mensal = taxa de administração do grupo ÷ meses para terminar (dados reais do grupo).",
      "Seleção de crédito e de tipo de parcela fica só no modelo da bolinha (modelos 1 e 3 removidos). O tipo de parcela já vem selecionado na menor reduzida oferecida (ou Normal, se o grupo não tem reduzida).",
    ],
  },
  {
    numero: "0045",
    data: "15/10/2026",
    itens: [
      "Simulador do grupo (ainda com números fictícios, só o layout) na parte inferior da tela. Parâmetros no topo: Contemplação em (meses) editável, com atalhos 12 · 24 · 36 · 48 · 60; Vagas editável; Validade da proposta com 7 dias a partir de hoje e editável; INCC editável. O ID do plano saiu.",
      "INCC passa a ser parâmetro global (Parâmetros globais › Simulador, carregado com 6,00% a.a.; migração 0019, já aplicada). O simulador parte desse valor e a alteração feita na tela vale só para aquela simulação.",
      "Escolha do crédito (caixa Faixa de crédito) e do tipo de parcela (caixa Tipos de parcela): o item escolhido fica em destaque e vai para o simulador (Valor Contratado e Parcela antes da contemplação). Três modelos para comparar, escolhidos no topo do simulador: 1 clicar na linha (fundo escuro), 2 bolinha de seleção, 3 setas ‹ › no topo da caixa.",
      "Novo Lance Livre entre o Lance Limitado e o Fidelidade.",
    ],
  },
  {
    numero: "0044",
    data: "15/10/2026",
    itens: [
      "Grupos e Tabelas: a barra Imóveis · Veículos · Serviços · Outros Bens volta para o cabeçalho, ao lado do título (na 0043 tinha descido para o corpo da página). A lista de grupos continua retrátil logo abaixo do cabeçalho: passar o mouse na barra a abre, escolher um grupo a recolhe.",
    ],
  },
  {
    numero: "0043",
    data: "15/10/2026",
    itens: [
      "Fundo de reserva dos imóveis = 0%: os grupos de imóveis sem fundo informado passaram a 0% (migração 0018, já aplicada). A importação (importar_grupo) agora aceita \"fundo_reserva\" vindo do PDF do grupo; sem ele, imóveis gravam 0% e edição manual anterior não é sobrescrita.",
      "Grupos e Tabelas: a lista de grupos ficou retrátil. Ao escolher um grupo ela recolhe e o conteúdo sobe; passar o mouse em \"Imóveis\" reabre a lista e empurra o conteúdo para baixo (no celular, toque na família ativa).",
      "Leitor de PDF (scripts/importar_tabelas.py) passa a ler o fundo de reserva do PDF do grupo; sem menção no PDF, imóveis ficam com 0%.",
    ],
  },
  {
    numero: "0042",
    data: "15/10/2026",
    itens: [
      "Menor parcela conforme a Tabela Resumo concluída: nos 13 grupos em que o resumo diz 100 (780, 840, 930, 960, 970, 1010, 1020, 1040, 1050, 1060, 1070, 1080 e 1110) a Reduzida 50% foi retirada e eles passam a ter só a parcela Normal. O 1090 já estava ajustado (Reduzida 50%).",
    ],
  },
  {
    numero: "0041",
    data: "15/10/2026",
    itens: [
      "PDF da Tabela Resumo agora tem uma quantidade fixa de grupos por página, repetindo o cabeçalho a cada página: a 1ª termina no grupo 12172 (113 grupos) e o restante segue na página seguinte. As letras ficam maiores que na página única.",
      "\"Grupos por página\" é um campo da janela de exportação (padrão 113) e o navegador lembra a última quantidade usada, para as próximas exportações.",
    ],
  },
  {
    numero: "0040",
    data: "15/10/2026",
    itens: [
      "Menor parcela conforme a Tabela Resumo: o grupo 1090 passa de Reduzida 55% para Reduzida 50% (migração 0017). Nos 13 grupos em que o resumo diz 100 (780, 840, 930, 960, 970, 1010, 1020, 1040, 1050, 1060, 1070, 1080 e 1110) a Reduzida 50% ainda precisa ser retirada.",
    ],
  },
  {
    numero: "0039",
    data: "15/10/2026",
    itens: [
      "Exportar Tabela Resumo agora pergunta o mês de referência na hora de exportar (campo de mês, que lembra o último escolhido); ele vai no título e é a base do mês final. Sai a referência fixa em set/2026.",
      "Grupos 370 e 420 criados a partir da Tabela Resumo (taxa, participantes, prazos, créditos, ordem de contemplação, Fixo e Livre). Sem o PDF da assembleia, índice, mês de reajuste e vencimento ficam vazios, para preencher na tela do grupo (migração 0015).",
      "Pagamento com furo dos grupos atualizado conforme a Tabela Resumo: 49 grupos passaram a S e os grupos 760 e 820 passaram a N (migração 0016).",
    ],
  },
  {
    numero: "0038",
    data: "15/10/2026",
    itens: [
      "Tabela Resumo: o mês de referência (título e base do mês final) fica fixo em set/2026, como na planilha modelo, em vez de acompanhar o mês de hoje.",
      "Correção de dados: o lance livre dos grupos 900 e 940 tinha a regra do lance fixo copiada na importação (embutir 44 parcelas, 100%); passa a 0%, sem embutido (migração 0014).",
    ],
  },
  {
    numero: "0037",
    data: "15/10/2026",
    itens: [
      "Novo botão \"Exportar Tabela Resumo\" em Grupos e Tabelas: gera a Tabela Resumo dos imóveis em Excel (só a aba Imóvel, com os valores prontos) e em PDF igual ao modelo (A4, tabela inteira numa página; se crescer demais, divide em páginas com o cabeçalho repetido).",
      "Colunas: grupo, taxa, participantes, prazos (original, atual e rodado), furo, menor parcela, mês final, ordem de contemplação (15 posições, com as mesmas cores), Fixo, Limitado, Fidelidade, Livre (quantidade e embutido) e créditos em mil. Fidelidade em \"Meses\" mostra a parcela de liberação (36), e não o mês em que entra na sequência (37).",
      "Correção de dados: Fidelidade e Livre dos grupos 540 e 690 tinham embutido de 100% embora o PDF diga que o lance é 100% com recursos próprios; passaram a 0% (migração 0013). Também no pop-up de Modalidades, o embutido \"aprox. 50 parcelas\" de um lance de 99 agora aparece como 50%, e não 51%.",
    ],
  },
  {
    numero: "0036",
    data: "15/10/2026",
    itens: [
      "Sequência de contemplação: a legenda aparece sempre que houver o que dizer (só fidelidade, só mais de um sorteio, ou os dois). Passar o mouse nas linhas da legenda e nos boxes FID e SOR explica o que cada um significa.",
      "Fidelidade passa a ser escrito como \"liberado na parcela 36\" (a parcela anterior ao mês em que ele entra na sequência, 37). Na edição, o campo agora se chama \"Fidelidade entra na sequência no mês\".",
      "MER agora também como desenho para baixar (docs/MER.png e docs/MER.svg).",
    ],
  },
  {
    numero: "0035",
    data: "15/10/2026",
    itens: [
      "Sequência de contemplação: nos grupos com mais de um sorteio, volta a legenda no rodapé (\"Sorteios: …\" e \"Fidelidade libera no mês …\"); os números embaixo dos boxes foram removidos (o pontilhado e o passar do mouse continuam).",
      "Grupo 770: o Lance Livre passa a ser limitado a 72 parcelas (ajuste pontual no banco, migração 0012).",
      "Novo \"Exportar Excel\" no menu: uma planilha .xlsx com todas as tabelas do banco, uma aba por tabela (a tabela de usuários autorizados não entra: o app não consegue lê-la, por segurança).",
      "\"Exportar dados\" e \"Importar dados\" renomeados para \"Exportar Backup\" e \"Importar Backup\" (o arquivo exportado agora se chama dinastia-backup-AAAA-MM-DD.json).",
      "MER atualizado (docs/MER.md), conferido com o banco: sem mudanças de esquema desde 09/10.",
    ],
  },
  {
    numero: "0034",
    data: "15/10/2026",
    itens: [
      "Pagamento com furo: removido também o \"Sim\" ao lado da chave (verde = ligado, cinza = desligado). Pagamento com furo e Tipos de parcela ficam mais estreitos (13rem).",
    ],
  },
  {
    numero: "0033",
    data: "15/10/2026",
    itens: [
      "Pagamento com furo e Tipos de parcela voltam à largura anterior (não são mais reduzidos); continua sem o texto \"Não\" ao lado da chave.",
    ],
  },
  {
    numero: "0032",
    data: "15/10/2026",
    itens: [
      "Faixa de crédito mais estreita em modo leitura, sem o vazio entre o R$ e o valor (a edição mantém a largura anterior).",
      "Pagamento com furo: removido o texto \"Não\" ao lado da chave (o \"Sim\" continua quando ligado); o box e o de Tipos de parcela ficam mais estreitos.",
    ],
  },
  {
    numero: "0031",
    data: "15/10/2026",
    itens: [
      "Box de Modalidades de contemplação com exatamente a largura do box de Sequência de contemplação, para caber na 4ª coluna (antes tinha largura mínima própria e alargava a coluna).",
    ],
  },
  {
    numero: "0030",
    data: "15/10/2026",
    itens: [
      "Modalidades de contemplação do grupo reorganizado em matriz: colunas Fixo, Limitado, Fidelidade e Livre (mesmo tamanho) e linhas Qtd Parcelas, Embutido e Próprio; o box fica abaixo da Sequência de contemplação, na mesma largura.",
      "Qtd Parcelas mostra só a quantidade; \"*\" = qualquer quantidade até o limite do plano (passe o mouse). Embutido e Próprio em % do lance (Próprio = 100% − Embutido), calculados no lance máximo; modalidade que o grupo não oferece aparece com \"—\".",
    ],
  },
  {
    numero: "0029",
    data: "09/10/2026",
    itens: [
      "Faixa lateral dos números dos grupos com 3 compartimentos fixos, de baixo para cima: parcela 50 / 55 (verde-água), parcela 70 (magenta) e furo (dourado); só o compartimento ligado é colorido.",
      "Legenda enxuta, na ordem: Furo, Parcela 70, Parcela 50 / 55 e Participantes.",
      "Pop-up dos grupos: nova linha \"Reduzidas\" com os percentuais de parcela reduzida do grupo, do menor para o maior e sem o sinal de % (ex.: 50 · 70 · 85).",
    ],
  },
  {
    numero: "0028",
    data: "09/10/2026",
    itens: [
      "Números dos grupos com uma barrinha na base proporcional ao nº de participantes (1.000 = 10% … 9.999 = 100%; 5.000 = meia barra); a legenda ganhou a entrada \"barra = participantes\".",
      "Pop-up dos grupos: nova linha \"Participantes\" logo abaixo do Crédito (o box cresceu o equivalente a uma linha).",
    ],
  },
  {
    numero: "0027",
    data: "09/10/2026",
    itens: [
      "Números dos grupos: o grupo selecionado agora é só o fundo marinho, sem a barra laranja embaixo, que repetia o sinal e competia com o dourado do furo.",
    ],
  },
  {
    numero: "0026",
    data: "09/10/2026",
    itens: [
      "Números dos grupos (topo) com marcação por faixa colorida na lateral esquerda: dourada = pagamento com furo ligado; verde-água = oferece parcela reduzida de 55% ou menos; as duas = faixa dividida ao meio.",
      "Legenda das cores ao lado do último grupo, na mesma linha (só aparece o que existe na família).",
    ],
  },
  {
    numero: "0025",
    data: "09/10/2026",
    itens: [
      "Pop-up dos grupos: os quadradinhos da sequência de contemplação sempre usam a cor da modalidade (sai o controle de vazado).",
    ],
  },
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
