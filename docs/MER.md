# Dinastia · MER (modelo entidade-relacionamento)

Atualizado em 15/10/2026 · versão 0036 · conferido tabela a tabela, coluna a coluna, com o banco em produção (Supabase, schema `public`).

Desenho para baixar: `docs/MER.png` (imagem) e `docs/MER.svg` (vetorial).

Mudanças desde o MER de 09/10/2026:
- **Esquema: nenhuma.** As 12 tabelas, colunas, chaves, unicidades e índices continuam como no MER anterior (última migração de esquema: 0010).
- Correções de **dados** (sem mudar o esquema): 0011 (ordem do fidelidade nos grupos 800, 820 e 830) e 0012 (grupo 770: lance livre limitado a 72 parcelas).
- Volumes atualizados (abaixo); `arquivo_importado` e `usuario_autorizado` agora constam na lista de volumes.

Mudanças do MER de 09/10/2026 (para referência):
- Sorteio Cancelada passou de `SOC` para `CAN` (0009); função `salvar_sequencia` refaz as faixas de uma versão (0010).
- `grupo_assembleia` ganhou `pagamento_com_furo` (0006/0007) e `fidelidade_meses` (0008).
- `tipo_contemplacao` ganhou `cor` (`#RRGGBB`) e o `codigo` passou a ter no máximo 10 caracteres (`SOR`, `CAN`, `LIV`, `LIM`, `FIX`, `FID`) — migração 0005.
- `grupo.seguro_pct_mes` saiu; o seguro prestamista é só `parametros_gerais.seguro_padrao_pct` — migração 0004.

```mermaid
erDiagram
    parametros_gerais {
        int id PK "sempre 1"
        numeric seguro_padrao_pct "% do crédito ao mês, todos os grupos"
        timestamptz atualizado_em
    }

    indice_correcao {
        text sigla PK "INCC, IPCA, IGP-M, INPC, CDI, TR"
        text nome
        text fonte
    }

    tipo_contemplacao {
        text codigo PK "até 10 caracteres: SOR, CAN, LIV, LIM, FIX, FID"
        text nome
        text cor "#RRGGBB"
    }

    tipo_parcela {
        text codigo PK "NORMAL, RED_85, RED_70, RED_55, RED_50"
        text descricao
        numeric pct "1 a 100"
    }

    grupo {
        int numero PK
        text familia "imoveis, veiculos, servicos, outros_bens"
        int prazo_grupo_meses
        int participantes
        numeric taxa_adm_total
        numeric fundo_reserva
        text indice FK
        int mes_reajuste "1 a 12"
        date primeira_correcao
        int dia_vencimento "1 a 31"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    arquivo_importado {
        bigint id PK
        text nome
        text hash_sha256
        timestamptz recebido_em
        text status
        jsonb dados_extraidos "auditoria do PDF"
    }

    grupo_assembleia {
        bigint id PK
        int grupo_numero FK
        int assembleia_numero "UK com grupo_numero"
        date data_assembleia
        int prazo_cota_meses
        numeric_array creditos "do maior para o menor"
        text observacoes
        bigint arquivo_id FK
        text aprovado_por
        timestamptz aprovado_em
        boolean pagamento_com_furo "sim ou nao, padrao nao"
        int fidelidade_meses "mes em que o fidelidade libera"
    }

    grupo_assembleia_tipo_parcela {
        bigint grupo_assembleia_id PK, FK
        text tipo_parcela PK, FK
    }

    grupo_modalidade {
        bigint id PK
        bigint grupo_assembleia_id FK
        text tipo FK "UK com grupo_assembleia_id"
        int max_parcelas_lance "nulo = livre"
        numeric pct_categoria
        int embutido_max_parcelas
        text embutido_base "ofertado ou categoria"
        numeric embutido_pct "nulo = sem embutido"
        boolean recurso_proprio_obrig
        int a_partir_assembleia_cota
        text requisitos
        boolean transferivel
        text embutido_texto "regra literal do PDF"
    }

    grupo_sequencia_faixa {
        bigint id PK
        bigint grupo_assembleia_id FK
        int assembleia_de "UK com grupo_assembleia_id"
        int assembleia_ate
        text demais_tipo FK "nulo = repete a sequência"
    }

    grupo_sequencia {
        bigint id PK
        bigint faixa_id FK
        int ordem "UK com faixa_id"
        text tipo FK
        int quantidade "maior que 0"
    }

    usuario_autorizado {
        text email PK
        timestamptz criado_em
    }

    indice_correcao ||--o{ grupo : "corrige"
    grupo ||--|{ grupo_assembleia : "tem versões"
    arquivo_importado |o--o{ grupo_assembleia : "origem"
    grupo_assembleia ||--o{ grupo_assembleia_tipo_parcela : "oferece"
    tipo_parcela ||--o{ grupo_assembleia_tipo_parcela : "usada em"
    grupo_assembleia ||--o{ grupo_modalidade : "regras"
    tipo_contemplacao ||--o{ grupo_modalidade : "tipo"
    grupo_assembleia ||--o{ grupo_sequencia_faixa : "faixas"
    tipo_contemplacao |o--o{ grupo_sequencia_faixa : "demais"
    grupo_sequencia_faixa ||--|{ grupo_sequencia : "ordem"
    tipo_contemplacao ||--o{ grupo_sequencia : "tipo"
```

## Leitura rápida

- **Grupo** guarda o que é estável (prazo, taxa, índice, vencimento). Cada PDF de assembleia vira uma linha em **grupo_assembleia**; a de maior `assembleia_numero` é a vigente (view `grupo_atual`).
- Dentro de cada versão: créditos (lista), tipos de parcela oferecidos, regras por modalidade e a sequência de contemplação por faixas de assembleias.
- `tipo_contemplacao`, `tipo_parcela` e `indice_correcao` são cadastros de apoio; `parametros_gerais` tem uma linha só.
- `usuario_autorizado` controla o acesso: as outras 11 tabelas têm RLS com a policy `autorizado_tudo` (via `autorizado()`); ela própria não tem policy, ou seja, é invisível pela API (por isso a exportação para Excel do app não a inclui); não se relaciona com as demais.
- As chaves para `tipo_contemplacao`, `tipo_parcela` e `indice_correcao` têm `on update cascade`: trocar um código atualiza os grupos.

## Objetos do banco além das tabelas

- **View** `grupo_atual`: uma linha por grupo com os dados da versão vigente (maior `assembleia_numero`).
- **Funções**: `importar_grupo(p jsonb)` grava uma versão completa (usada na importação de PDF e na restauração de backup); `salvar_sequencia(p jsonb)` refaz as faixas e a sequência de uma versão; `autorizado()` diz se o usuário logado está em `usuario_autorizado` (base das policies de RLS); `set_atualizado_em()` é a função dos gatilhos que atualizam `atualizado_em` em `grupo` e `parametros_gerais`.
- **Unicidades**: `grupo_assembleia (grupo_numero, assembleia_numero)`, `grupo_modalidade (grupo_assembleia_id, tipo)`, `grupo_sequencia_faixa (grupo_assembleia_id, assembleia_de)`, `grupo_sequencia (faixa_id, ordem)`.
- **Índices** extras: em todas as chaves estrangeiras e `grupo_assembleia (grupo_numero, assembleia_numero desc)` para achar a versão vigente.
- `arquivo_importado.status`: hoje as 144 linhas estão `aprovado`.

## Volumes em 15/10/2026

grupo 144 · arquivo_importado 144 · grupo_assembleia 144 · grupo_modalidade 842 · grupo_sequencia_faixa 306 · grupo_sequencia 1.853 · grupo_assembleia_tipo_parcela 381 · tipo_contemplacao 6 · tipo_parcela 5 · indice_correcao 6 · parametros_gerais 1 · usuario_autorizado 1
