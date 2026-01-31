# Docker Compose Setup

Este projeto inclui configuração Docker Compose para desenvolvimento e produção.

## Estrutura

- `docker-compose.yml` - Configuração para produção/staging
- `docker-compose.dev.yml` - Configuração para desenvolvimento (apenas infraestrutura)

## Serviços

### 1. App (Next.js)
- Porta: `3000`
- Build: Usa o `Dockerfile` do projeto
- Healthcheck: `/api/health`

### 2. PostgreSQL
- Porta: `5432` (configurável via `POSTGRES_PORT`)
- Usuário: `legalconnect`
- Senha: Configurável via `POSTGRES_PASSWORD` (padrão: `password`)
- Database: `legalconnect`
- Volume persistente: `postgres_data`

### 3. Redis
- Porta: `6379` (configurável via `REDIS_PORT`)
- Senha: Configurável via `REDIS_PASSWORD` (padrão: `redispassword`)
- Volume persistente: `redis_data`
- Configurações:
  - AOF (Append Only File) habilitado
  - Max memory: 256MB
  - Policy: `allkeys-lru`

## Uso

### Desenvolvimento

Para desenvolvimento, use apenas os serviços de infraestrutura:

```bash
# Iniciar apenas PostgreSQL e Redis
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar serviços
docker-compose -f docker-compose.dev.yml down

# Parar e remover volumes (⚠️ apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```

A aplicação roda localmente com:
```bash
npm run dev
```

### Produção/Staging

```bash
# Build e iniciar todos os serviços
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Parar serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados)
docker-compose down -v
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

```env
# Database
POSTGRES_PASSWORD=your-secure-password
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=LegalConnect <noreply@legalconnect.com>

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Providers (opcional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Pusher (opcional)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=us2
```

## Migrações do Banco de Dados

### Desenvolvimento

```bash
# Com serviços rodando
docker-compose -f docker-compose.dev.yml exec db psql -U legalconnect -d legalconnect

# Rodar migrações
npm run db:migrate

# Seed do banco
npm run db:seed
```

### Produção

```bash
# Executar migrações dentro do container
docker-compose exec app npx prisma migrate deploy

# Ou fazer build com migrações
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy
```

## Health Checks

Todos os serviços incluem health checks:

- **App**: `http://localhost:3000/api/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

Verificar status:
```bash
docker-compose ps
```

## Volumes

Os dados são persistidos em volumes Docker:

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis (AOF)
- `uploads_data`: Uploads locais (se não usar Supabase)

## Troubleshooting

### Porta já em uso

Se as portas estiverem em uso, altere no `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # App na porta 3001
  - "5433:5432"  # PostgreSQL na porta 5433
  - "6380:6379"  # Redis na porta 6380
```

### Resetar banco de dados

```bash
# Parar serviços
docker-compose down

# Remover volume do PostgreSQL
docker volume rm lawerinyourhand_postgres_data

# Reiniciar
docker-compose up -d
```

### Ver logs de um serviço específico

```bash
docker-compose logs -f db
docker-compose logs -f redis
docker-compose logs -f app
```

### Acessar PostgreSQL

```bash
docker-compose exec db psql -U legalconnect -d legalconnect
```

### Acessar Redis CLI

```bash
docker-compose exec redis redis-cli
# Se tiver senha:
docker-compose exec redis redis-cli -a redispassword
```

## Segurança

⚠️ **IMPORTANTE**: Antes de fazer deploy em produção:

1. Altere todas as senhas padrão
2. Use variáveis de ambiente seguras
3. Configure SSL/TLS para PostgreSQL e Redis
4. Use secrets management (Docker Secrets, AWS Secrets Manager, etc.)
5. Configure firewall adequadamente
6. Use `.env` com permissões restritas (`chmod 600 .env`)

## Performance

O PostgreSQL está configurado com otimizações para desenvolvimento. Para produção, ajuste os parâmetros conforme o hardware disponível.
