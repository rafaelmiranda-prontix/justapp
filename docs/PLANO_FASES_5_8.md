# 📋 Plano Detalhado - Fases 5 a 8

> Plano de implementação para as fases finais do MVP LegalMatch

**Status:** Planejamento  
**Última atualização:** 2026-01-29

---

## 📊 Visão Geral

| Fase | Duração | Objetivo Principal | Status |
|------|---------|-------------------|--------|
| **Fase 5** | Semana 5-6 | Dashboard e Gestão | ⏳ Pendente |
| **Fase 6** | Semana 6-7 | Monetização | ⏳ Pendente |
| **Fase 7** | Semana 7-8 | Polish e Deploy | ⏳ Pendente |
| **Fase 8** | Semana 8-10 | Validação | ⏳ Pendente |

---

## 🎯 FASE 5: Dashboard e Gestão (Semana 5-6)

### Objetivos
- ✅ Melhorar dashboards existentes com métricas detalhadas
- ✅ Implementar sistema completo de avaliações
- ✅ Criar painel admin básico para moderação

### Tarefas Detalhadas

#### 5.1 Dashboard do Cidadão - Melhorias

**Arquivos a modificar:**
- `src/app/(cidadao)/cidadao/dashboard/page.tsx` ✅ (já existe, melhorar)
- `src/app/api/casos/route.ts` ✅ (já existe, verificar)

**Melhorias necessárias:**

1. **Estatísticas Avançadas**
   - [ ] Adicionar gráfico de evolução de casos (últimos 30 dias)
   - [ ] Taxa de conversão (matches → aceitos)
   - [ ] Tempo médio de resposta dos advogados
   - [ ] Status detalhado por caso

2. **Filtros e Busca**
   - [ ] Filtro por status (ABERTO, EM_ANDAMENTO, FECHADO)
   - [ ] Filtro por especialidade
   - [ ] Busca por texto nos casos
   - [ ] Ordenação (data, urgência, status)

3. **Ações Rápidas**
   - [ ] Botão "Avaliar Advogado" em casos concluídos
   - [ ] Notificações de novos matches
   - [ ] Exportar relatório de casos (PDF)

**Componentes a criar:**
```
src/components/cidadao/
├── caso-card.tsx              # Card melhorado de caso
├── caso-filters.tsx           # Filtros de busca
├── caso-stats-chart.tsx       # Gráfico de estatísticas
└── avaliacao-dialog.tsx       # Modal de avaliação
```

**APIs necessárias:**
```
GET /api/casos/stats           # Estatísticas agregadas
GET /api/casos?status=...      # Filtros (já existe, melhorar)
POST /api/casos/:id/close      # Fechar caso
```

---

#### 5.2 Dashboard do Advogado - Melhorias

**Arquivos a modificar:**
- `src/app/(advogado)/advogado/dashboard/page.tsx` ✅ (já existe, melhorar)
- `src/app/api/matches/route.ts` ✅ (já existe, melhorar)

**Melhorias necessárias:**

1. **Métricas de Performance**
   - [ ] Taxa de conversão (leads → aceitos)
   - [ ] Tempo médio de resposta
   - [ ] Leads recebidos por mês (gráfico)
   - [ ] Receita estimada (se tiver preço)
   - [ ] Avaliação média e total de avaliações

2. **Gestão de Leads**
   - [ ] Filtro por especialidade
   - [ ] Filtro por urgência
   - [ ] Ordenação por score de matching
   - [ ] Busca por nome do cliente
   - [ ] Marcar como "favorito" para revisar depois

3. **Ações Rápidas**
   - [ ] Resposta rápida (template de mensagens)
   - [ ] Histórico de casos aceitos/recusados
   - [ ] Exportar relatório de leads

**Componentes a criar:**
```
src/components/advogado/
├── lead-card-enhanced.tsx     # Card melhorado de lead
├── lead-filters.tsx            # Filtros de leads
├── lead-stats-chart.tsx        # Gráfico de métricas
├── quick-response.tsx          # Templates de resposta
└── performance-metrics.tsx    # Widget de métricas
```

**APIs necessárias:**
```
GET /api/matches/stats         # Estatísticas de leads
GET /api/matches?status=...    # Filtros (já existe, melhorar)
GET /api/advogado/metrics      # Métricas de performance
POST /api/matches/:id/favorite # Favoritar lead
```

---

#### 5.3 Sistema de Avaliações

**Arquivos a criar:**
```
src/app/api/avaliacoes/
├── route.ts                    # CRUD de avaliações
└── [avaliacaoId]/
    └── route.ts                # GET/PUT/DELETE específico
```

**Componentes a criar:**
```
src/components/avaliacoes/
├── avaliacao-form.tsx          # Formulário de avaliação
├── avaliacao-card.tsx          # Card de avaliação
├── avaliacao-list.tsx          # Lista de avaliações
└── rating-stars.tsx            # Componente de estrelas
```

**Páginas a criar:**
```
src/app/(cidadao)/casos/[casoId]/avaliar/page.tsx
```

**Funcionalidades:**

1. **Criar Avaliação**
   - [ ] Formulário com rating 1-5 estrelas
   - [ ] Campo de comentário (opcional, max 500 chars)
   - [ ] Validação: apenas casos FECHADOS podem ser avaliados
   - [ ] Validação: apenas 1 avaliação por match
   - [ ] Preview antes de enviar

2. **Exibir Avaliações**
   - [ ] Lista de avaliações no perfil do advogado
   - [ ] Média de avaliações calculada
   - [ ] Distribuição de estrelas (ex: 5 estrelas: 80%, 4: 15%, etc)
   - [ ] Ordenação (mais recente, mais útil)
   - [ ] Paginação

3. **Moderação**
   - [ ] Admin pode deletar avaliações inapropriadas
   - [ ] Flag de conteúdo ofensivo
   - [ ] Resposta do advogado (futuro)

**Schema Prisma:**
```prisma
// Já existe no schema, verificar se precisa ajustes
model Avaliacao {
  id          String   @id @default(cuid())
  cidadaoId   String
  advogadoId  String
  nota        Int      // 1-5
  comentario  String?  @db.Text
  createdAt   DateTime @default(now())
  
  @@unique([cidadaoId, advogadoId])
}
```

**APIs necessárias:**
```
POST   /api/avaliacoes           # Criar avaliação
GET    /api/avaliacoes          # Listar avaliações
GET    /api/avaliacoes/:id      # Detalhes de avaliação
PUT    /api/avaliacoes/:id      # Editar avaliação (própria)
DELETE /api/avaliacoes/:id      # Deletar avaliação
GET    /api/advogados/:id/avaliacoes # Avaliações de um advogado
GET    /api/advogados/:id/avaliacoes/stats # Estatísticas de avaliações
```

---

#### 5.4 Perfil Público do Advogado

**Arquivos a criar:**
```
src/app/(public)/advogados/[advogadoId]/
└── page.tsx                    # Perfil público
```

**Componentes a criar:**
```
src/components/advogado/
├── advogado-profile.tsx        # Perfil completo
├── advogado-avaliacoes.tsx    # Seção de avaliações
└── advogado-especialidades.tsx # Badges de especialidades
```

**Funcionalidades:**
- [ ] Exibir foto, nome, OAB, cidade
- [ ] Lista de especialidades
- [ ] Bio do advogado
- [ ] Avaliações e média
- [ ] Estatísticas públicas (casos atendidos, taxa de resposta)
- [ ] Botão "Solicitar Contato" (redireciona para criar caso)

**APIs necessárias:**
```
GET /api/advogados/:id/public  # Dados públicos do advogado
```

---

#### 5.5 Painel Admin Básico

**Arquivos a criar:**
```
src/app/(admin)/
├── layout.tsx                  # Layout admin (proteção de rota)
├── dashboard/
│   └── page.tsx                # Dashboard admin
├── advogados/
│   ├── page.tsx                # Lista de advogados
│   ├── [advogadoId]/
│   │   └── page.tsx            # Detalhes do advogado
│   └── [advogadoId]/
│       └── aprovar/
│           └── route.ts        # Aprovar advogado
└── avaliacoes/
    └── page.tsx                # Moderação de avaliações
```

**Componentes a criar:**
```
src/components/admin/
├── admin-nav.tsx               # Navegação admin
├── advogado-moderation.tsx     # Card de moderação
├── stats-overview.tsx          # Visão geral de métricas
└── user-management.tsx         # Gestão de usuários
```

**Funcionalidades:**

1. **Dashboard Admin**
   - [ ] Estatísticas gerais (usuários, casos, matches)
   - [ ] Gráficos de crescimento
   - [ ] Lista de ações recentes
   - [ ] Alertas (advogados pendentes, denúncias)

2. **Moderação de Advogados**
   - [ ] Lista de advogados pendentes (oabVerificado = false)
   - [ ] Visualizar dados do advogado
   - [ ] Aprovar/Rejeitar advogado
   - [ ] Verificar OAB manualmente
   - [ ] Suspender advogado

3. **Moderação de Avaliações**
   - [ ] Lista de avaliações reportadas
   - [ ] Deletar avaliações inapropriadas
   - [ ] Banir usuário (se necessário)

4. **Gestão de Usuários**
   - [ ] Lista de todos os usuários
   - [ ] Busca e filtros
   - [ ] Suspender/banir usuário
   - [ ] Ver histórico de ações

**APIs necessárias:**
```
GET    /api/admin/stats         # Estatísticas gerais
GET    /api/admin/advogados     # Lista de advogados (com filtros)
POST   /api/admin/advogados/:id/approve   # Aprovar advogado
POST   /api/admin/advogados/:id/reject    # Rejeitar advogado
POST   /api/admin/advogados/:id/suspend   # Suspender advogado
GET    /api/admin/avaliacoes    # Lista de avaliações
DELETE /api/admin/avaliacoes/:id          # Deletar avaliação
GET    /api/admin/users         # Lista de usuários
POST   /api/admin/users/:id/suspend       # Suspender usuário
```

**Middleware de proteção:**
```typescript
// src/lib/middleware/admin.ts
export async function requireAdmin(session: Session) {
  if (session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
}
```

---

### Checklist Fase 5

- [ ] Dashboard cidadão melhorado com métricas
- [ ] Dashboard advogado melhorado com métricas
- [ ] Sistema de avaliações completo
- [ ] Perfil público do advogado
- [ ] Painel admin básico
- [ ] Moderação de advogados
- [ ] Moderação de avaliações
- [ ] Testes das funcionalidades

**Tempo estimado:** 2 semanas (80-100 horas)

---

## 💰 FASE 6: Monetização (Semana 6-7)

### Objetivos
- ✅ Implementar sistema de planos (FREE, BASIC, PREMIUM)
- ✅ Integrar gateway de pagamento (Stripe ou Pagar.me)
- ✅ Criar gestão de assinaturas

### Tarefas Detalhadas

#### 6.1 Modelo de Planos

**Schema Prisma (atualizar):**
```prisma
// Já existe no schema, verificar se precisa ajustes
model Advogado {
  plano       Plano     @default(FREE)
  planoExpira DateTime?
  // Adicionar campos:
  stripeCustomerId String? @unique
  stripeSubscriptionId String? @unique
  leadsRecebidosMes Int @default(0)
  leadsLimiteMes    Int @default(0)
  ultimoResetLeads  DateTime @default(now())
}

enum Plano {
  FREE    // 0 leads/mês
  BASIC   // 10 leads/mês - R$ 99/mês
  PREMIUM // Leads ilimitados - R$ 299/mês
}
```

**Arquivos a criar:**
```
src/lib/
├── plans.ts                    # Configuração de planos
└── subscription-service.ts     # Lógica de assinaturas
```

**Configuração de planos:**
```typescript
// src/lib/plans.ts
export const PLANS = {
  FREE: {
    name: 'Gratuito',
    price: 0,
    leadsPerMonth: 0,
    features: ['Perfil básico'],
  },
  BASIC: {
    name: 'Básico',
    price: 99, // R$
    leadsPerMonth: 10,
    features: ['10 leads/mês', 'Perfil completo', 'Suporte por email'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 299, // R$
    leadsPerMonth: -1, // Ilimitado
    features: ['Leads ilimitados', 'Perfil destacado', 'Suporte prioritário'],
  },
}
```

---

#### 6.2 Integração Stripe (Recomendado para MVP)

**Dependências:**
```bash
npm install stripe @stripe/stripe-js
npm install -D @types/stripe
```

**Arquivos a criar:**
```
src/lib/
└── stripe.ts                   # Cliente Stripe

src/app/api/stripe/
├── webhook/
│   └── route.ts                # Webhook do Stripe
├── checkout/
│   └── route.ts                # Criar sessão de checkout
├── subscription/
│   ├── route.ts                # Gerenciar assinatura
│   └── [subscriptionId]/
│       └── route.ts             # Cancelar/atualizar
└── portal/
    └── route.ts                 # Customer portal
```

**Variáveis de ambiente:**
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

**Funcionalidades:**

1. **Checkout**
   - [ ] Criar sessão de checkout do Stripe
   - [ ] Redirecionar para página de pagamento
   - [ ] Sucesso: criar assinatura no banco
   - [ ] Cancelamento: redirecionar de volta

2. **Webhooks**
   - [ ] `checkout.session.completed` - Ativar assinatura
   - [ ] `customer.subscription.updated` - Atualizar plano
   - [ ] `customer.subscription.deleted` - Cancelar assinatura
   - [ ] `invoice.payment_succeeded` - Renovação
   - [ ] `invoice.payment_failed` - Falha no pagamento

3. **Customer Portal**
   - [ ] Link para portal do Stripe
   - [ ] Gerenciar método de pagamento
   - [ ] Ver histórico de faturas
   - [ ] Cancelar assinatura

**APIs necessárias:**
```
POST /api/stripe/checkout       # Criar sessão de checkout
POST /api/stripe/webhook         # Webhook do Stripe
GET  /api/stripe/portal          # Link para customer portal
GET  /api/subscription           # Status da assinatura atual
POST /api/subscription/cancel    # Cancelar assinatura
```

---

#### 6.3 Alternativa: Pagar.me (Brasil)

Se preferir Pagar.me para pagamentos em reais:

**Dependências:**
```bash
npm install pagarme
```

**Arquivos a criar:**
```
src/lib/
└── pagarme.ts                   # Cliente Pagar.me

src/app/api/pagarme/
├── webhook/
│   └── route.ts                 # Webhook do Pagar.me
└── subscription/
    └── route.ts                 # Criar assinatura
```

**Variáveis de ambiente:**
```env
PAGARME_API_KEY=ak_...
PAGARME_ENCRYPTION_KEY=ek_...
PAGARME_WEBHOOK_SECRET=...
```

---

#### 6.4 Limites por Plano

**Arquivos a criar:**
```
src/lib/
└── plan-limits.ts               # Verificação de limites
```

**Lógica de limites:**

1. **Reset Mensal**
   - [ ] Verificar `ultimoResetLeads` no início do mês
   - [ ] Resetar `leadsRecebidosMes` se passou 1 mês
   - [ ] Atualizar `leadsLimiteMes` baseado no plano

2. **Verificação antes de enviar lead**
   - [ ] Verificar se advogado tem plano ativo
   - [ ] Verificar se não excedeu limite do mês
   - [ ] Retornar erro se excedido

3. **Notificações**
   - [ ] Email quando atingir 80% do limite
   - [ ] Email quando atingir 100% do limite
   - [ ] Sugestão de upgrade

**Middleware:**
```typescript
// src/lib/middleware/plan-check.ts
export async function checkPlanLimits(advogadoId: string) {
  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
  })
  
  // Verificar se precisa resetar
  await resetMonthlyLeadsIfNeeded(advogado)
  
  // Verificar limite
  if (advogado.leadsLimiteMes === -1) return true // Ilimitado
  if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
    throw new Error('Limite de leads atingido')
  }
  
  return true
}
```

---

#### 6.5 Tela de Gestão de Assinatura

**Arquivos a criar:**
```
src/app/(advogado)/advogado/assinatura/
└── page.tsx                     # Gestão de assinatura
```

**Componentes a criar:**
```
src/components/assinatura/
├── plan-card.tsx                # Card de plano
├── plan-comparison.tsx          # Comparação de planos
├── subscription-status.tsx      # Status atual
└── upgrade-prompt.tsx           # Prompt de upgrade
```

**Funcionalidades:**

1. **Visualizar Plano Atual**
   - [ ] Exibir plano atual
   - [ ] Leads usados vs limite
   - [ ] Data de renovação/expiração
   - [ ] Status do pagamento

2. **Escolher Plano**
   - [ ] Comparação de planos (tabela)
   - [ ] Botão "Assinar" em cada plano
   - [ ] Redirecionar para checkout

3. **Gerenciar Assinatura**
   - [ ] Atualizar método de pagamento
   - [ ] Ver histórico de faturas
   - [ ] Cancelar assinatura
   - [ ] Reativar assinatura cancelada

4. **Upgrade/Downgrade**
   - [ ] Botão de upgrade visível
   - [ ] Downgrade no final do período atual
   - [ ] Confirmação antes de cancelar

**APIs necessárias:**
```
GET  /api/advogado/plano         # Plano atual e status
GET  /api/plans                  # Lista de planos disponíveis
POST /api/plans/:planId/subscribe # Assinar plano
```

---

#### 6.6 Notificações de Pagamento

**Arquivos a criar:**
```
src/lib/
└── payment-notifications.ts     # Emails de pagamento
```

**Emails a implementar:**
- [ ] Assinatura ativada
- [ ] Pagamento bem-sucedido
- [ ] Falha no pagamento
- [ ] Assinatura cancelada
- [ ] Limite de leads próximo (80%)
- [ ] Limite de leads atingido (100%)

**Integração com serviço de email:**
- Resend (recomendado) ou SendGrid

---

### Checklist Fase 6

- [ ] Modelo de planos definido e implementado
- [ ] Integração Stripe ou Pagar.me
- [ ] Webhooks de pagamento funcionando
- [ ] Sistema de limites por plano
- [ ] Tela de gestão de assinatura
- [ ] Customer portal configurado
- [ ] Notificações de pagamento
- [ ] Testes de fluxo completo

**Tempo estimado:** 1-2 semanas (60-80 horas)

---

## 🎨 FASE 7: Polish e Deploy (Semana 7-8)

### Objetivos
- ✅ Melhorar UX/UI com loading states e error handling
- ✅ Otimizar performance
- ✅ Preparar para deploy em produção

### Tarefas Detalhadas

#### 7.1 Loading States e Error Handling

**Componentes a criar:**
```
src/components/ui/
├── loading-spinner.tsx          # Spinner reutilizável
├── error-boundary.tsx            # Error boundary
├── error-message.tsx             # Mensagem de erro
└── skeleton-loader.tsx           # Skeleton loaders (já existe, melhorar)
```

**Hooks a criar:**
```
src/hooks/
├── use-error-handler.ts          # Hook para tratamento de erros
└── use-loading-state.ts          # Hook para estados de loading
```

**Melhorias:**

1. **Loading States**
   - [ ] Skeleton loaders em todas as listas
   - [ ] Spinner em botões durante ações
   - [ ] Progress bar em uploads
   - [ ] Loading overlay em modais

2. **Error Handling**
   - [ ] Error boundary global
   - [ ] Mensagens de erro amigáveis
   - [ ] Retry automático em falhas de rede
   - [ ] Fallback UI para erros

3. **Validações**
   - [ ] Validação em tempo real nos formulários
   - [ ] Mensagens de erro específicas
   - [ ] Feedback visual (verde/vermelho)
   - [ ] Prevenção de submit duplo

**Exemplo de implementação:**
```typescript
// src/components/ui/error-boundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2>Algo deu errado</h2>
          <p className="text-muted-foreground">
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <button onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

#### 7.2 Otimização de Performance

**Tarefas:**

1. **Code Splitting**
   - [ ] Lazy loading de rotas
   - [ ] Dynamic imports de componentes pesados
   - [ ] Separar vendor chunks

2. **Otimização de Imagens**
   - [ ] Usar `next/image` em todas as imagens
   - [ ] Lazy loading de imagens
   - [ ] Otimização de tamanho (WebP quando possível)

3. **Cache e Revalidação**
   - [ ] React Query com cache inteligente
   - [ ] Revalidação em background
   - [ ] Cache de API routes quando possível

4. **Bundle Analysis**
   - [ ] Analisar tamanho do bundle
   - [ ] Remover dependências não usadas
   - [ ] Tree shaking otimizado

**Arquivos a criar:**
```
next.config.js                   # Configurações de otimização
```

**Exemplo de lazy loading:**
```typescript
// src/app/(advogado)/advogado/dashboard/page.tsx
import dynamic from 'next/dynamic'

const LeadStatsChart = dynamic(
  () => import('@/components/advogado/lead-stats-chart'),
  { loading: () => <Skeleton className="h-[300px]" /> }
)
```

---

#### 7.3 SEO e Meta Tags

**Arquivos a criar:**
```
src/app/
├── sitemap.ts                   # Sitemap dinâmico
└── robots.ts                    # Robots.txt
```

**Melhorias:**

1. **Meta Tags**
   - [ ] Meta tags dinâmicas por página
   - [ ] Open Graph tags
   - [ ] Twitter Cards
   - [ ] Canonical URLs

2. **Structured Data**
   - [ ] Schema.org para advogados
   - [ ] Breadcrumbs
   - [ ] Reviews/Ratings schema

3. **Sitemap**
   - [ ] Sitemap dinâmico
   - [ ] Prioridades e frequências

**Exemplo:**
```typescript
// src/app/(public)/advogados/[advogadoId]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const advogado = await getAdvogadoPublic(params.advogadoId)
  
  return {
    title: `${advogado.nome} - Advogado em ${advogado.cidade}`,
    description: advogado.bio || `Advogado especializado em ${advogado.especialidades.join(', ')}`,
    openGraph: {
      title: advogado.nome,
      description: advogado.bio,
      images: [advogado.fotoUrl],
    },
  }
}
```

---

#### 7.4 Documentação de Deployment

**Arquivos a criar:**
```
docs/
├── DEPLOYMENT.md                # Guia de deployment
├── KUBERNETES.md                # Configuração Kubernetes
└── ENVIRONMENT.md               # Variáveis de ambiente
```

**Conteúdo:**

1. **Pré-requisitos**
   - [ ] Node.js 20+
   - [ ] PostgreSQL 14+
   - [ ] Kubernetes cluster
   - [ ] Domínio configurado

2. **Build**
   - [ ] Comandos de build
   - [ ] Variáveis de ambiente necessárias
   - [ ] Testes antes do deploy

3. **Kubernetes**
   - [ ] Dockerfile
   - [ ] Deployment YAML
   - [ ] Service YAML
   - [ ] Ingress YAML
   - [ ] ConfigMap e Secrets

4. **Database**
   - [ ] Migrations do Prisma
   - [ ] Seed de dados iniciais
   - [ ] Backup strategy

5. **SSL/TLS**
   - [ ] Certbot ou Let's Encrypt
   - [ ] Renovação automática

**Exemplo Dockerfile:**
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

---

#### 7.5 CI/CD Pipeline

**Arquivos a criar:**
```
.github/
└── workflows/
    ├── ci.yml                   # Continuous Integration
    └── deploy.yml               # Deployment
```

**Funcionalidades:**

1. **CI Pipeline**
   - [ ] Lint check
   - [ ] Type check
   - [ ] Build test
   - [ ] Testes unitários (quando implementados)

2. **CD Pipeline**
   - [ ] Build da aplicação
   - [ ] Build da imagem Docker
   - [ ] Push para registry
   - [ ] Deploy no Kubernetes
   - [ ] Health check

**Exemplo GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Kubernetes
        run: |
          # Comandos de deploy
```

---

#### 7.6 Monitoramento e Logs

**Ferramentas sugeridas:**
- [ ] Sentry para error tracking
- [ ] LogRocket para session replay (opcional)
- [ ] Prometheus + Grafana para métricas
- [ ] ELK Stack para logs (opcional)

**Implementações:**

1. **Error Tracking**
   - [ ] Integração com Sentry
   - [ ] Captura de erros do frontend
   - [ ] Captura de erros do backend
   - [ ] Alertas por email/Slack

2. **Logs Estruturados**
   - [ ] Winston ou Pino para logs
   - [ ] Níveis de log (info, warn, error)
   - [ ] Contexto em cada log

3. **Métricas**
   - [ ] Tempo de resposta das APIs
   - [ ] Taxa de erro
   - [ ] Uso de recursos
   - [ ] Métricas de negócio (leads, conversões)

**Arquivos a criar:**
```
src/lib/
└── logger.ts                    # Logger configurado
```

---

#### 7.7 Testes End-to-End

**Ferramentas:**
- Playwright (recomendado) ou Cypress

**Arquivos a criar:**
```
tests/
├── e2e/
│   ├── auth.spec.ts             # Testes de autenticação
│   ├── caso.spec.ts             # Testes de criação de caso
│   ├── matching.spec.ts        # Testes de matching
│   └── chat.spec.ts             # Testes de chat
└── setup.ts                     # Configuração dos testes
```

**Cenários principais:**
- [ ] Cadastro de cidadão
- [ ] Cadastro de advogado
- [ ] Criação de caso
- [ ] Matching de advogados
- [ ] Aceitar/recusar lead
- [ ] Chat entre usuários
- [ ] Avaliação de advogado
- [ ] Assinatura de plano

**Scripts:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### Checklist Fase 7

- [ ] Loading states em todas as páginas
- [ ] Error handling robusto
- [ ] Validações de formulários melhoradas
- [ ] Performance otimizada
- [ ] SEO implementado
- [ ] Documentação de deployment
- [ ] CI/CD pipeline configurado
- [ ] Monitoramento básico
- [ ] Testes E2E dos fluxos principais
- [ ] Deploy inicial no VPS

**Tempo estimado:** 1-2 semanas (60-80 horas)

---

## 🚀 FASE 8: Validação (Semana 8-10)

### Objetivos
- ✅ Criar landing page de marketing
- ✅ Onboarding de advogados beta
- ✅ Soft launch com grupo fechado
- ✅ Coletar feedback e iterar

### Tarefas Detalhadas

#### 8.1 Landing Page de Marketing

**Arquivos a criar:**
```
src/app/
├── marketing/
│   ├── page.tsx                 # Landing page principal
│   ├── sobre/
│   │   └── page.tsx            # Sobre nós
│   ├── como-funciona/
│   │   └── page.tsx            # Como funciona
│   └── precos/
│       └── page.tsx            # Página de preços
```

**Componentes a criar:**
```
src/components/marketing/
├── hero-section.tsx            # Hero da landing
├── features-section.tsx         # Seção de features
├── testimonials.tsx             # Depoimentos
├── cta-section.tsx              # Call to action
└── pricing-table.tsx            # Tabela de preços
```

**Conteúdo:**

1. **Hero Section**
   - [ ] Título impactante
   - [ ] Subtítulo claro
   - [ ] CTAs (Cadastrar como cidadão / Advogado)
   - [ ] Imagem/vídeo de destaque

2. **Features**
   - [ ] Matching inteligente
   - [ ] Facilidade de uso
   - [ ] Segurança e confiança
   - [ ] Suporte especializado

3. **Como Funciona**
   - [ ] Passo a passo visual
   - [ ] Para cidadãos
   - [ ] Para advogados

4. **Depoimentos**
   - [ ] Testimonials de beta users
   - [ ] Avaliações reais
   - [ ] Casos de sucesso

5. **Pricing**
   - [ ] Comparação de planos
   - [ ] Destaque para plano recomendado
   - [ ] FAQ sobre preços

6. **FAQ**
   - [ ] Perguntas frequentes
   - [ ] Respostas claras

7. **Footer**
   - [ ] Links úteis
   - [ ] Redes sociais
   - [ ] Contato
   - [ ] Termos e privacidade

---

#### 8.2 Onboarding de Advogados Beta

**Arquivos a criar:**
```
src/app/(advogado)/advogado/onboarding/
└── page.tsx                     # Fluxo de onboarding
```

**Componentes a criar:**
```
src/components/onboarding/
├── welcome-step.tsx             # Boas-vindas
├── profile-setup.tsx            # Configuração de perfil
├── specialties-selection.tsx    # Seleção de especialidades
└── plan-selection.tsx           # Escolha de plano
```

**Fluxo de onboarding:**

1. **Boas-vindas**
   - [ ] Mensagem personalizada
   - [ ] Explicação do processo

2. **Completar Perfil**
   - [ ] Foto profissional
   - [ ] Bio detalhada
   - [ ] Preço de consulta (opcional)
   - [ ] Áreas de atuação

3. **Escolher Plano**
   - [ ] Explicação dos planos
   - [ ] Recomendação baseada em perfil
   - [ ] Opção de teste gratuito (se aplicável)

4. **Verificação OAB**
   - [ ] Upload de comprovante
   - [ ] Status pendente
   - [ ] Notificação quando aprovado

5. **Tutorial**
   - [ ] Como receber leads
   - [ ] Como responder
   - [ ] Dicas de sucesso

**APIs necessárias:**
```
POST /api/advogado/onboarding/complete # Finalizar onboarding
GET  /api/advogado/onboarding/status   # Status do onboarding
```

---

#### 8.3 Analytics Básico

**Ferramentas:**
- PostHog (self-hosted) ou Plausible
- Google Analytics (alternativa)

**Implementações:**

1. **Eventos a rastrear**
   - [ ] Cadastro de usuário
   - [ ] Criação de caso
   - [ ] Match criado
   - [ ] Lead aceito/recusado
   - [ ] Mensagem enviada
   - [ ] Avaliação criada
   - [ ] Assinatura de plano

2. **Métricas de negócio**
   - [ ] Taxa de conversão (cadastro → primeiro caso)
   - [ ] Taxa de conversão (match → aceito)
   - [ ] Tempo médio de resposta
   - [ ] Churn rate de advogados
   - [ ] MRR (Monthly Recurring Revenue)

**Arquivos a criar:**
```
src/lib/
└── analytics.ts                  # Cliente de analytics
```

**Exemplo:**
```typescript
// src/lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties)
  }
}

// Uso:
trackEvent('caso_criado', {
  especialidade: 'Direito do Consumidor',
  urgencia: 'ALTA',
})
```

---

#### 8.4 Soft Launch

**Estratégia:**

1. **Grupo Fechado**
   - [ ] 10-20 advogados beta (Rio de Janeiro)
   - [ ] 50-100 cidadãos beta
   - [ ] Convites por email
   - [ ] Código de acesso (opcional)

2. **Comunicação**
   - [ ] Email de boas-vindas
   - [ ] Guia rápido
   - [ ] Canal de suporte (WhatsApp/Telegram)
   - [ ] Feedback semanal

3. **Incentivos**
   - [ ] Plano gratuito por 3 meses para beta users
   - [ ] Suporte prioritário
   - [ ] Badge de "Beta Tester"

4. **Coleta de Feedback**
   - [ ] Formulário de feedback
   - [ ] Entrevistas com usuários
   - [ ] NPS surveys
   - [ ] Bug reports

**Arquivos a criar:**
```
src/app/(public)/beta/
└── page.tsx                     # Página de acesso beta
```

---

#### 8.5 Iteração e Melhorias

**Processo:**

1. **Priorização**
   - [ ] Bugs críticos (P0)
   - [ ] Melhorias de UX (P1)
   - [ ] Features solicitadas (P2)

2. **Sprints de 1 semana**
   - [ ] Segunda: Planejamento
   - [ ] Terça-Quinta: Desenvolvimento
   - [ ] Sexta: Deploy e feedback

3. **Métricas de sucesso**
   - [ ] Taxa de ativação > 60%
   - [ ] Taxa de retenção > 40%
   - [ ] NPS > 40
   - [ ] Tempo de resposta < 24h

---

### Checklist Fase 8

- [ ] Landing page de marketing completa
- [ ] Onboarding de advogados implementado
- [ ] Analytics configurado
- [ ] Soft launch com grupo fechado
- [ ] Sistema de feedback implementado
- [ ] Canal de suporte ativo
- [ ] Documentação para usuários
- [ ] Iteração baseada em feedback

**Tempo estimado:** 2 semanas (60-80 horas)

---

## 📊 Resumo Geral

### Timeline Total

| Fase | Duração | Horas Estimadas |
|------|---------|----------------|
| Fase 5 | 2 semanas | 80-100h |
| Fase 6 | 1-2 semanas | 60-80h |
| Fase 7 | 1-2 semanas | 60-80h |
| Fase 8 | 2 semanas | 60-80h |
| **Total** | **6-8 semanas** | **260-340h** |

### Dependências entre Fases

```
Fase 5 → Fase 6 (Avaliações necessárias antes de monetização)
Fase 6 → Fase 7 (Monetização deve estar estável antes do deploy)
Fase 7 → Fase 8 (Deploy deve estar funcionando antes do soft launch)
```

### Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Integração de pagamento complexa | Começar com Stripe (mais simples) |
| Performance em produção | Testes de carga antes do deploy |
| Feedback negativo dos beta users | Iteração rápida e comunicação clara |
| Problemas de escalabilidade | Monitoramento e ajustes contínuos |

---

## 🎯 Próximos Passos Imediatos

1. **Revisar este plano** e ajustar conforme necessário
2. **Priorizar tarefas** da Fase 5
3. **Criar issues no GitHub** (se usar) para cada tarefa
4. **Começar pela Fase 5.3** (Sistema de Avaliações) - mais crítico

---

**Documento criado em:** 2026-01-29  
**Autor:** Planejamento LegalMatch MVP
