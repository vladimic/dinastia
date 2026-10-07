# Dinastia · Estruturação de Patrimônio

Sistema de simulação de consórcio. Next.js 16 + Supabase, hospedado na Vercel, instalável como app no Chrome.

Versão atual: veja `src/lib/version.ts` e o `CHANGELOG.md`.

## Colocar no ar (uma vez)

### 1. Supabase (banco e login)
1. Em supabase.com, crie um projeto (região **South America (São Paulo)**).
2. **SQL Editor** → cole e rode `supabase/migrations/0001_schema.sql`, depois `0002_seed.sql`.
3. **Authentication › Sign In / Providers** → desligue **Allow new users to sign up** (só entra quem você cadastrar).
4. **Authentication › Users › Add user** → seu e-mail e senha, marcando **Auto Confirm User**.
5. **Project Settings › API** → copie a **Project URL** e a **Publishable key**.

### 2. GitHub
Crie um repositório **privado** chamado `dinastia` e envie esta pasta (sem `node_modules`).

### 3. Vercel
1. **Add New › Project** → importe o repositório `dinastia`.
2. Em **Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key
   - `NEXT_PUBLIC_SITE_URL` = a URL que a Vercel der ao projeto (ex.: `https://dinastia.vercel.app`)
3. **Deploy**.

### 4. Voltar ao Supabase
**Authentication › URL Configuration**:
- **Site URL** = a URL da Vercel
- **Redirect URLs** → adicionar `https://SUA-URL/auth/callback`

Sem isso, o link de "Esqueci minha senha" não funciona.

### 5. Instalar no Chrome
Abra a URL no Chrome, entre com seu e-mail e use o ícone de instalar na barra de endereço (ou o menu ⋮ do Chrome). O Dinastia abre em janela própria, com ícone.

## Desenvolvimento local
```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```

## Versionamento
A cada mudança entregue: incrementar `APP_VERSION` em `src/lib/version.ts` (0001 → 0002…) e registrar no `CHANGELOG.md`.
Mudanças de banco entram como novo arquivo em `supabase/migrations/` (0003_…sql), nunca editando os anteriores.

## Estrutura
- `src/app/login`, `esqueci-senha`, `nova-senha`, `auth/callback` — acesso
- `src/app/(app)/grupos` — cadastro de Grupos e Tabelas
- `src/lib/grupos.ts` — leitura do banco
- `src/proxy.ts` — bloqueia páginas para quem não está logado
- `supabase/migrations` — estrutura e carga inicial do banco
