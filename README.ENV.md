# Configuração de Variáveis de Ambiente

Este projeto usa arquivos de ambiente separados para desenvolvimento e produção.

## Estrutura

- `.env.dev` - Variáveis para desenvolvimento (local)
- `.env.prd` - Variáveis para produção
- `.env.dev.example` - Template para desenvolvimento
- `.env.prd.example` - Template para produção

## Setup Inicial

### 1. Criar arquivos de ambiente

```bash
# Desenvolvimento
cp .env.dev.example .env.dev
# Edite .env.dev com seus valores de desenvolvimento

# Produção
cp .env.prd.example .env.prd
# Edite .env.prd com seus valores de produção
```

### 2. Carregar ambiente

Os scripts do `package.json` já carregam automaticamente o arquivo correto:

```bash
# Desenvolvimento (carrega .env.dev)
npm run dev

# Produção (carrega .env.prd)
npm run build
npm start
```

### 3. Carregar manualmente

Se precisar carregar manualmente:

```bash
# Carregar ambiente de desenvolvimento
npm run env:dev

# Carregar ambiente de produção
npm run env:prd
```

## Variáveis Importantes

### Obrigatórias

- `DATABASE_URL` - URL de conexão com PostgreSQL
- `NEXTAUTH_URL` - URL da aplicação
- `NEXTAUTH_SECRET` - Secret para NextAuth (gere um valor forte e aleatório)

### Opcionais mas Recomendadas

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Para login com Google
- `RESEND_API_KEY` - Para envio de emails
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - Para storage de arquivos

## Segurança

⚠️ **IMPORTANTE:**

1. **NUNCA** commite os arquivos `.env.dev` ou `.env.prd` no git
2. Eles já estão no `.gitignore`
3. Use os arquivos `.example` como referência
4. Em produção, use variáveis de ambiente do seu provedor (Vercel, Railway, etc.)

## Vercel / Deploy

Para deploy em produção, configure as variáveis de ambiente diretamente na plataforma:

- Vercel: Settings → Environment Variables
- Railway: Variables
- Outros: Consulte a documentação da plataforma

O script `build` automaticamente usa `.env.prd` localmente, mas em plataformas de deploy, as variáveis devem ser configuradas na plataforma.
