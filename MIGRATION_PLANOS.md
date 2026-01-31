# Migração para Catálogo de Planos

## 📋 Visão Geral

Esta migração move a configuração de planos de **configurações estáticas no código** para uma **tabela de catálogo no banco de dados**.

### Vantagens

✅ **Gerenciamento centralizado** - Todos os dados do plano em um único lugar
✅ **Histórico de mudanças** - Rastrear alterações de preços e limites via banco
✅ **Flexibilidade** - Adicionar novos planos sem alterar código
✅ **Versionamento** - Manter planos antigos para assinaturas existentes
✅ **Parametrização completa** - Preços, limites e features no banco

---

## 🗂️ Nova Estrutura

### Tabela `planos`

```prisma
model planos {
  id              String   @id
  codigo          Plano    @unique // FREE, BASIC, PREMIUM
  nome            String
  descricao       String?
  preco           Int      @default(0) // em centavos (R$)
  precoDisplay    Int      @default(0) // para exibição (R$)
  leadsPerMonth   Int      @default(0) // -1 = ilimitado
  features        String[] // array de features
  stripePriceId   String?  @unique
  ativo           Boolean  @default(true)
  ordem           Int      @default(0) // ordem de exibição
  createdAt       DateTime @default(now())
  updatedAt       DateTime
}
```

### Nova API `/src/lib/plans-new.ts`

```typescript
// Buscar plano específico
const plan = await getPlanConfig('PREMIUM')

// Buscar todos os planos
const allPlans = await getAllPlans()

// Buscar limites de leads
const limits = await getPlanLimits('FREE')

// Invalidar cache após atualizar planos
invalidatePlansCache()
```

---

## 🚀 Passo a Passo da Migração

### 1. Atualizar Schema Prisma

O novo model `planos` já foi adicionado ao `prisma/schema.prisma`.

```bash
# Gerar Prisma Client
npm run db:generate

# Push para o banco (desenvolvimento)
npm run db:push

# OU criar migration (produção)
npm run db:migrate
```

### 2. Popular Catálogo de Planos

```bash
# Popular apenas planos
npm run seed:planos

# OU popular tudo (inclui planos)
npm run seed
```

**O que o seed faz**:
- Cria 3 planos: FREE (R$ 0), BASIC (R$ 99), PREMIUM (R$ 299)
- Define limites de leads: FREE (3), BASIC (10), PREMIUM (50)
- Configura features de cada plano
- Se plano já existe, atualiza nome, descrição e features (preserva preço/leads)

### 3. Substituir Código Atual

**Arquivos que precisam ser atualizados**:

#### A. API Route: `/src/app/api/plans/route.ts`

```typescript
// ANTES
import { getPlanConfig } from '@/lib/plans'

// DEPOIS
import { getAllPlans } from '@/lib/plans-new'

export async function GET() {
  try {
    const plans = await getAllPlans()
    return NextResponse.json({
      success: true,
      data: plans
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
```

#### B. Signup Route: `/src/app/api/users/advogado/route.ts`

```typescript
// ANTES
import { getPlanLimits } from '@/lib/plans'

// DEPOIS
import { getPlanLimits } from '@/lib/plans-new'

// O resto do código permanece igual
const limits = await getPlanLimits('FREE')
```

#### C. Subscription Service: `/src/lib/subscription-service.ts`

```typescript
// ANTES
import { getPlanLimits } from '@/lib/plans'

// DEPOIS
import { getPlanLimits } from '@/lib/plans-new'
```

#### D. Components

```typescript
// ANTES
import { PLANS_STATIC, type PlanConfig } from '@/lib/plans'

// DEPOIS
import { type PlanConfig } from '@/lib/plans-new'
```

### 4. Remover Configurações Antigas

Após migração completa, você pode:

1. **Deletar** `/src/lib/plans.ts` (arquivo antigo)
2. **Renomear** `/src/lib/plans-new.ts` → `/src/lib/plans.ts`
3. **Remover** configs de leads de `configuracoes` table (opcional)

```sql
DELETE FROM configuracoes
WHERE chave IN (
  'free_plan_monthly_leads',
  'basic_plan_monthly_leads',
  'premium_plan_monthly_leads'
);
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Código Estático)

```typescript
// plans.ts
export const PLANS_STATIC = {
  FREE: {
    name: 'Gratuito',
    price: 0,          // ❌ Hardcoded
    leadsPerMonth: 0,  // ❌ Hardcoded
  }
}

// Para mudar preço: editar código + deploy
```

### Depois (Banco de Dados)

```typescript
// Buscar do banco
const plan = await getPlanConfig('FREE')

// Para mudar preço: UPDATE no banco
UPDATE planos SET preco = 4900, precoDisplay = 49
WHERE codigo = 'BASIC';
```

---

## 🛠️ Gerenciamento de Planos

### Atualizar Preço de um Plano

```typescript
// Via Prisma
await prisma.planos.update({
  where: { codigo: 'BASIC' },
  data: {
    preco: 14900,        // R$ 149,00
    precoDisplay: 149,
    updatedAt: new Date()
  }
})

// Invalidar cache
import { invalidatePlansCache } from '@/lib/plans-new'
invalidatePlansCache()
```

### Atualizar Limite de Leads

```typescript
await prisma.planos.update({
  where: { codigo: 'PREMIUM' },
  data: {
    leadsPerMonth: -1,  // Ilimitado
    updatedAt: new Date()
  }
})

invalidatePlansCache()
```

### Adicionar Nova Feature

```typescript
const plan = await prisma.planos.findUnique({
  where: { codigo: 'PREMIUM' }
})

await prisma.planos.update({
  where: { codigo: 'PREMIUM' },
  data: {
    features: [
      ...plan.features,
      'Nova feature exclusiva!'
    ],
    updatedAt: new Date()
  }
})

invalidatePlansCache()
```

### Criar Novo Plano

```typescript
await prisma.planos.create({
  data: {
    id: nanoid(),
    codigo: 'ENTERPRISE', // ⚠️ Precisa adicionar ao enum Plano no schema
    nome: 'Enterprise',
    descricao: 'Para escritórios',
    preco: 99900,
    precoDisplay: 999,
    leadsPerMonth: -1,
    features: ['Leads ilimitados', 'API access', 'Suporte dedicado'],
    ativo: true,
    ordem: 4
  }
})
```

---

## ⚠️ Considerações Importantes

### Cache de 5 Minutos

Os planos são cacheados por **5 minutos** em memória. Mudanças no banco podem demorar até 5 min para refletir.

**Forçar atualização imediata**:
```typescript
import { invalidatePlansCache } from '@/lib/plans-new'
invalidatePlansCache()
```

### Backward Compatibility

O arquivo `plans-new.ts` tem **fallbacks** para DEFAULT_PLANS caso:
- Banco de dados esteja offline
- Tabela `planos` esteja vazia
- Erro ao buscar planos

### Migration em Produção

1. **Criar migration**:
   ```bash
   npx prisma migrate dev --name add_planos_table
   ```

2. **Deploy**:
   ```bash
   # Aplicar migration
   npx prisma migrate deploy

   # Popular planos
   npm run seed:planos
   ```

3. **Verificar**:
   ```bash
   npx prisma studio
   # Verificar tabela planos
   ```

---

## 📝 Checklist de Migração

- [ ] Atualizar `prisma/schema.prisma`
- [ ] Gerar Prisma Client (`npm run db:generate`)
- [ ] Push schema (`npm run db:push` ou `db:migrate`)
- [ ] Popular planos (`npm run seed:planos`)
- [ ] Atualizar imports em `/src/app/api/plans/route.ts`
- [ ] Atualizar imports em `/src/app/api/users/advogado/route.ts`
- [ ] Atualizar imports em `/src/lib/subscription-service.ts`
- [ ] Atualizar imports em components
- [ ] Testar página de assinatura
- [ ] Testar signup de advogado
- [ ] Testar distribuição de leads
- [ ] Deletar `/src/lib/plans.ts` (antigo)
- [ ] Renomear `/src/lib/plans-new.ts` → `plans.ts`
- [ ] Remover configs antigas de leads (opcional)

---

## 🎯 Próximos Passos

Após migração, você pode:

1. **Criar painel admin** para gerenciar planos via interface
2. **Implementar histórico** de mudanças de preços
3. **Adicionar planos promocionais** temporários
4. **Versionamento** de planos (manter antigos para assinaturas existentes)
5. **A/B testing** de preços e features

---

## 🆘 Troubleshooting

### Erro: "Table planos does not exist"

```bash
npm run db:push
npm run seed:planos
```

### Planos não aparecem na página

```typescript
// Verificar cache
import { invalidatePlansCache } from '@/lib/plans-new'
invalidatePlansCache()

// Verificar banco
const plans = await prisma.planos.findMany()
console.log(plans)
```

### Leads limit ainda mostra valor antigo

```bash
# Executar script de correção
npm run fix:leads

# Ou atualizar manualmente
npx prisma studio
# Editar leadsLimiteMes dos advogados
```

---

## 📚 Referências

- Arquivo novo: `/src/lib/plans-new.ts`
- Seed: `/scripts/seed-planos.ts`
- Schema: `prisma/schema.prisma` (model `planos`)
- Package.json: `npm run seed:planos`
