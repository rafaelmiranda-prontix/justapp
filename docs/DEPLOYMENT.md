# 🚀 Guia de Deployment - LegalMatch

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
  name: legalmatch-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: legalmatch
  template:
    metadata:
      labels:
        app: legalmatch
    spec:
      containers:
      - name: app
        image: legalmatch:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: legalmatch-secrets
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
  name: legalmatch-service
spec:
  selector:
    app: legalmatch
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Pré-Deploy Checklist

### Banco de Dados
- [ ] Migration aplicada
- [ ] Seed executado (se necessário)
- [ ] Backup configurado
- [ ] Connection pooling configurado

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
# Desenvolvimento
npm run db:push

# Produção
npm run db:migrate
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
