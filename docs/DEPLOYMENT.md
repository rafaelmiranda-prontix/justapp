# 🚀 Guia de Deployment - LegalConnect

## Opções de Deployment

### 1. Vercel (Recomendado para MVP)

#### Vantagens
- ✅ Deploy automático via Git
- ✅ SSL automático
- ✅ CDN global
- ✅ Serverless functions
- ✅ Preview deployments

#### Setup

1. **Conectar repositório**
   - Vá em [vercel.com](https://vercel.com)
   - Conecte seu repositório GitHub/GitLab

2. **Configurar variáveis de ambiente**
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://seu-dominio.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_BASIC=price_...
   STRIPE_PRICE_ID_PREMIUM=price_...
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   ```

3. **Deploy**
   - Push para `main` = deploy automático
   - Preview para PRs

#### Configurar Webhook do Stripe
- URL: `https://seu-dominio.vercel.app/api/stripe/webhook`
- Use o Stripe CLI para testar localmente primeiro

---

### 2. VPS com Docker (Produção)

#### Requisitos
- VPS (Ubuntu 22.04+)
- Docker e Docker Compose
- Domínio configurado

#### Setup

1. **Instalar Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Criar docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
         - NEXTAUTH_URL=${NEXTAUTH_URL}
         # ... outras variáveis
       depends_on:
         - db
       restart: unless-stopped
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
         - POSTGRES_DB=${DB_NAME}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped
     
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app
       restart: unless-stopped
   
   volumes:
     postgres_data:
   ```

3. **Criar Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS base
   
   # Dependencies
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   # Builder
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   
   # Runner
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

4. **Deploy**
   ```bash
   docker-compose up -d --build
   ```

---

### 3. Kubernetes (Escalável)

#### Requisitos
- Cluster Kubernetes
- kubectl configurado
- Helm (opcional)

#### Arquivos Kubernetes

**deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legalconnect-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: legalconnect
  template:
    metadata:
      labels:
        app: legalconnect
    spec:
      containers:
      - name: app
        image: legalconnect:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: legalconnect-secrets
              key: database-url
        # ... outras variáveis
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

**service.yaml**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: legalconnect-service
spec:
  selector:
    app: legalconnect
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Atualizar o banco antes do deploy

Para o deploy funcionar com todas as funcionalidades (mediação, auditoria, etc.), o banco deve estar com as migrations aplicadas.

> **Automático:** no build da Vercel o script **`scripts/vercel-migrate-deploy.js`** roda `prisma migrate deploy` antes do `next build`. Basta ter **DATABASE_URL** (e, no Supabase com pooler, **DIRECT_URL**) configuradas no projeto.  
> **Guia rápido:** veja **`docs/DEPLOY_ATUALIZAR_BANCO.md`** para detalhes e para o passo a passo manual (se o migrate automático falhar).

### Opção 1: Prisma Migrate Deploy (recomendado quando possível)

Com `DATABASE_URL` (e, no Supabase, `DIRECT_URL`) apontando para o banco de **produção**:

```bash
# Carregar variáveis de produção (ex.: .env.prd)
npm run env:prd   # ou exporte DATABASE_URL e DIRECT_URL manualmente

# Aplicar todas as migrations pendentes
npm run db:migrate:deploy
```

Se der erro de pool (ex.: Supabase `MaxClientsInSessionMode`), use a **Opção 2**.

### Opção 2: Aplicar SQL manualmente no Supabase

1. **Supabase Dashboard** → **SQL Editor** → New query.

2. **Tabela `security_logs`** (auditoria de ações críticas):
   - Copie e execute o conteúdo de **`scripts/create-security-logs-table.sql`**.
   - Documentação: `docs/APLICAR_MIGRATION_SECURITY_LOGS.md`.

3. **Mediação e fechamento de casos** (colunas em `casos` + tabela `case_messages`):
   - Copie e execute o conteúdo de **`scripts/apply-mediation-migration.sql`**.

4. **Conferir**:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'mediatedByAdminId';
   SELECT 1 FROM security_logs LIMIT 1;
   SELECT 1 FROM case_messages LIMIT 1;
   ```
   (Não precisa retornar linhas; o importante é não dar erro de “tabela/coluna não existe”.)

### Resumo do que o banco precisa ter

| Recurso              | Tabela/colunas |
|----------------------|----------------|
| Auditoria admin      | Tabela `security_logs` |
| Mediação de casos    | Colunas em `casos`: `mediatedByAdminId`, `mediatedAt`, `closedByAdminId`, `closedAt`, `closeReason`, `closeSummary`, `checklist`; enum `CloseReason`; valor `EM_MEDIACAO` em `CasoStatus` |
| Mensagens admin↔cidadão | Tabela `case_messages` e enums `CaseMessageSenderRole`, `CaseMessageVisibility` |

Depois de aplicar as migrations (Opção 1 ou 2), faça o deploy normalmente.

---

## Pré-Deploy Checklist

### Banco de Dados
- [ ] Migrations aplicadas (ver seção **Atualizar o banco antes do deploy** acima)
- [ ] Seed executado (especialidades, planos, etc., se necessário)
- [ ] Backup configurado
- [ ] Connection pooling configurado (Supabase: usar `DATABASE_URL` com pooler)

### Variáveis de Ambiente
- [ ] Todas as variáveis configuradas
- [ ] Secrets seguros (não commitados)
- [ ] URLs de produção corretas

### Stripe
- [ ] Conta de produção ativada
- [ ] Webhook configurado
- [ ] Price IDs de produção
- [ ] Customer portal ativado

### Domínio
- [ ] DNS configurado
- [ ] SSL/TLS configurado
- [ ] Redirects configurados

### Monitoramento
- [ ] Error tracking (Sentry, etc)
- [ ] Analytics (PostHog, etc)
- [ ] Uptime monitoring
- [ ] Logs configurados

---

## Comandos Úteis

### Build Local
```bash
npm run build
npm start
```

### Testar Produção Localmente
```bash
npm run build
NODE_ENV=production npm start
```

### Verificar Build
```bash
npm run build
# Verificar se não há erros
```

### Database Migration
```bash
# Desenvolvimento (cria/altera tabelas sem arquivo de migration)
npm run db:push

# Desenvolvimento (cria migration e aplica)
npm run db:migrate

# Produção (aplica apenas migrations pendentes)
npm run db:migrate:deploy
```

---

## Troubleshooting

### Build Fails
- Verificar variáveis de ambiente
- Verificar Prisma schema
- Limpar `.next` e `node_modules`

### Database Connection
- Verificar DATABASE_URL
- Verificar firewall/VPC
- Verificar SSL mode

### Webhook Stripe
- Verificar URL do webhook
- Verificar signing secret
- Verificar logs do Stripe

---

## Performance

### Otimizações Aplicadas
- ✅ Code splitting
- ✅ Image optimization
- ✅ Lazy loading
- ✅ SWC minification
- ✅ Compression

### Monitoramento
- Use Vercel Analytics ou similar
- Monitor Core Web Vitals
- Acompanhe tempo de resposta da API

---

## Segurança

### Headers Configurados
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Próximos Passos
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] CSP headers
- [ ] Security.txt
