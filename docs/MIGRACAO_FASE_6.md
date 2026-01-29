# 🔄 Migração do Banco - Fase 6

## Campos Adicionados ao Schema

O schema do Prisma foi atualizado com os seguintes campos no modelo `Advogado`:

```prisma
stripeCustomerId    String?   @unique
stripeSubscriptionId String?  @unique
leadsRecebidosMes   Int       @default(0)
leadsLimiteMes      Int       @default(0)
ultimoResetLeads    DateTime  @default(now())
```

## Como Aplicar

### Opção 1: Prisma Migrate (Recomendado)

```bash
# Criar migration
npm run db:migrate

# Nome da migration: add_subscription_fields
```

### Opção 2: Prisma DB Push (Desenvolvimento)

```bash
# Aplica mudanças diretamente (sem criar migration)
npm run db:push
```

### Opção 3: SQL Manual

Se preferir aplicar manualmente:

```sql
ALTER TABLE "advogados" 
ADD COLUMN "stripeCustomerId" TEXT UNIQUE,
ADD COLUMN "stripeSubscriptionId" TEXT UNIQUE,
ADD COLUMN "leadsRecebidosMes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "leadsLimiteMes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ultimoResetLeads" TIMESTAMP NOT NULL DEFAULT NOW();

-- Criar índices se necessário
CREATE INDEX IF NOT EXISTS "advogados_stripeCustomerId_idx" ON "advogados"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "advogados_stripeSubscriptionId_idx" ON "advogados"("stripeSubscriptionId");
```

## Inicialização de Dados

Após aplicar a migration, você pode querer inicializar os limites para advogados existentes:

```typescript
// Script de inicialização (opcional)
// Pode ser adicionado ao seed.ts ou executado manualmente

const advogados = await prisma.advogado.findMany({
  where: {
    leadsLimiteMes: 0,
  },
})

for (const advogado of advogados) {
  const limits = getPlanLimits(advogado.plano)
  await prisma.advogado.update({
    where: { id: advogado.id },
    data: {
      leadsLimiteMes: limits.isUnlimited ? -1 : limits.leadsPerMonth,
      ultimoResetLeads: advogado.createdAt,
    },
  })
}
```

## Verificação

Após aplicar a migration:

```bash
# Verificar schema
npx prisma format

# Verificar banco
npm run db:studio
```

## Rollback

Se precisar reverter:

```bash
# Se usou migrate
npx prisma migrate reset

# Ou manualmente via SQL
ALTER TABLE "advogados" 
DROP COLUMN IF EXISTS "stripeCustomerId",
DROP COLUMN IF EXISTS "stripeSubscriptionId",
DROP COLUMN IF EXISTS "leadsRecebidosMes",
DROP COLUMN IF EXISTS "leadsLimiteMes",
DROP COLUMN IF EXISTS "ultimoResetLeads";
```
