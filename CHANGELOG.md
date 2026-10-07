# Histórico de versões · Dinastia

A versão aparece abaixo do e-mail no menu lateral e na tela de login.
Cada mudança entregue incrementa o número em `src/lib/version.ts` e ganha uma linha aqui.

## 0002 · 07/10/2026
- Banco reestruturado pelo MER aprovado: grupo (chave = número), versão por assembleia (grupo_assembleia), tipos de parcela, modalidades, sequência, parâmetros gerais.
- Cálculos sempre pela maior assembleia do grupo (consulta grupo_atual).
- Primeira importação: 13 grupos de imóveis (660, 760, 780, 790, 910, 921, 930, 1070, 1090, 12162, 12163, 12164, 12165), assembleia de 20/10/2026.
- Função importar_grupo no banco e leitor de PDF (`scripts/importar_tabelas.py`) com validação de prazo, parcela e seguro.
- Tela Grupos e Tabelas: família fixa (Imóveis, Veículos, Serviços, Outros Bens), grupos lado a lado, versão vigente, créditos, tipos de parcela, modalidades e sequência.
- Acesso restrito por lista de e-mails autorizados no banco.

## 0001 · 07/10/2026
- Estrutura inicial: Next.js + Supabase, pronto para Vercel e instalação como app no Chrome.
- Login por e-mail e senha, "esqueci minha senha" e definição de nova senha.
- Menu lateral com e-mail do usuário logado e versão.
- Cadastro de Grupos e Tabelas: seletor de família de produto, grupos lado a lado, detalhe do grupo com tabela de créditos, planos, seguro, modalidades e sequência de contemplação.
- Banco: 20 tabelas do modelo de dados e carga inicial do Grupo 660 (85ª assembleia).
