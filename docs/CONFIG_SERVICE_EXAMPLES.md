# ConfigService - Exemplos de Uso

## 📚 Como usar o ConfigService

O `ConfigService` fornece uma interface type-safe para acessar configurações do banco de dados com cache automático.

## 🎯 Importação

```typescript
import { ConfigService } from '@/lib/config-service'
// ou helpers individuais:
import { getConfig, setConfig } from '@/lib/config-service'
```

## 📖 Métodos Básicos

### 1. Buscar configuração genérica

```typescript
// Buscar como string
const valor = await ConfigService.get('match_expiration_hours')

// Buscar com tipo específico
const hours = await ConfigService.get<number>('match_expiration_hours')

// Com valor padrão
const maxSize = await ConfigService.get<number>('max_attachment_size_mb', 20)
```

### 2. Buscar por categoria

```typescript
// Todas as configurações de matching
const matchingConfigs = await ConfigService.getByCategory('matching')
// { match_expiration_hours: 48, max_matches_per_caso: 5, ... }

// Todas as configurações de notificação
const notifConfigs = await ConfigService.getByCategory('notificacao')
```

### 3. Atualizar configuração

```typescript
// Atualizar valor
await ConfigService.set('match_expiration_hours', '72')

// Cache é limpo automaticamente
```

### 4. Limpar cache

```typescript
// Limpar todo o cache (forçar reload)
ConfigService.clearCache()
```

## 🚀 Helpers Específicos (Recomendado)

Ao invés de usar strings mágicas, use os helpers type-safe:

### Matching

```typescript
// Tempo de expiração em horas
const hours = await ConfigService.getMatchExpirationHours() // number

// Máximo de matches por caso
const maxMatches = await ConfigService.getMaxMatchesPerCaso() // number

// Score mínimo para criar match
const minScore = await ConfigService.getMinMatchScore() // number

// Se deve expirar automaticamente
const shouldExpire = await ConfigService.shouldAutoExpireMatches() // boolean
```

### Planos e Limites

```typescript
// Limite de leads por plano
const freeLimit = await ConfigService.getPlanLeadsLimit('FREE') // 3
const basicLimit = await ConfigService.getPlanLeadsLimit('BASIC') // 10
const premiumLimit = await ConfigService.getPlanLeadsLimit('PREMIUM') // 50
```

### Chat

```typescript
// Chat só funciona após aceitar?
const chatRestricted = await ConfigService.isChatOnlyAfterAccept() // boolean

// Tamanho máximo de anexo
const maxSize = await ConfigService.getMaxAttachmentSizeMb() // number
```

### Notificações

```typescript
// Enviar email ao criar match?
const notifyCreate = await ConfigService.shouldNotifyMatchCreated() // boolean

// Enviar email ao aceitar match?
const notifyAccept = await ConfigService.shouldNotifyMatchAccepted() // boolean

// Horas antes de lembrete de expiração
const reminderHours = await ConfigService.getMatchExpiringReminderHours() // number
```

### Avaliações

```typescript
// Dias necessários após aceitar para avaliar
const daysToReview = await ConfigService.getAllowReviewsAfterDays() // number

// Comentário obrigatório?
const requireComment = await ConfigService.isReviewCommentRequired() // boolean
```

### Sistema

```typescript
// Modo manutenção ativo?
const maintenance = await ConfigService.isMaintenanceMode() // boolean

// Modo beta ativo?
const beta = await ConfigService.isBetaMode() // boolean
```

## 💡 Exemplos Práticos

### Exemplo 1: Criar Match com Expiração

```typescript
import { ConfigService } from '@/lib/config-service'
import { prisma } from '@/lib/prisma'

async function createMatch(casoId: string, advogadoId: string, score: number) {
  // Buscar configurações
  const expirationHours = await ConfigService.getMatchExpirationHours()
  const minScore = await ConfigService.getMinMatchScore()

  // Validar score
  if (score < minScore) {
    throw new Error(`Score ${score} abaixo do mínimo ${minScore}`)
  }

  // Calcular data de expiração
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expirationHours)

  // Criar match
  const match = await prisma.match.create({
    data: {
      casoId,
      advogadoId,
      score,
      status: 'PENDENTE',
      expiresAt,
    },
  })

  // Enviar notificação se configurado
  const shouldNotify = await ConfigService.shouldNotifyMatchCreated()
  if (shouldNotify) {
    await sendMatchCreatedEmail(match)
  }

  return match
}
```

### Exemplo 2: Verificar Permissão de Chat

```typescript
import { ConfigService } from '@/lib/config-service'
import { prisma } from '@/lib/prisma'

async function canSendMessage(
  userId: string,
  matchId: string,
  userRole: 'CIDADAO' | 'ADVOGADO'
): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      caso: { include: { cidadao: true } },
      advogado: { include: { user: true } },
    },
  })

  if (!match) return false

  // Advogado sempre pode enviar
  if (userRole === 'ADVOGADO' && match.advogado.user.id === userId) {
    return true
  }

  // Cidadão: verificar regra de chat
  if (userRole === 'CIDADAO' && match.caso.cidadao.userId === userId) {
    const chatOnlyAfterAccept = await ConfigService.isChatOnlyAfterAccept()

    if (chatOnlyAfterAccept) {
      // Só pode enviar se match foi aceito
      return match.status === 'ACEITO' || match.status === 'CONTRATADO'
    }

    // Se desabilitado, pode sempre
    return true
  }

  return false
}
```

### Exemplo 3: Verificar Limite de Leads

```typescript
import { ConfigService } from '@/lib/config-service'
import { prisma } from '@/lib/prisma'

async function canReceiveNewLead(advogadoId: string): Promise<boolean> {
  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
  })

  if (!advogado) return false

  // Buscar limite do plano
  const limit = await ConfigService.getPlanLeadsLimit(advogado.plano)

  // Verificar se excedeu
  return advogado.leadsRecebidosMes < limit
}
```

### Exemplo 4: Cron Job para Expirar Matches

```typescript
import { ConfigService } from '@/lib/config-service'
import { prisma } from '@/lib/prisma'

async function expireOldMatches() {
  // Verificar se deve expirar automaticamente
  const shouldExpire = await ConfigService.shouldAutoExpireMatches()

  if (!shouldExpire) {
    console.log('Auto-expire desabilitado')
    return
  }

  const now = new Date()

  // Buscar matches expirados
  const expiredMatches = await prisma.match.findMany({
    where: {
      status: { in: ['PENDENTE', 'VISUALIZADO'] },
      expiresAt: { lte: now },
    },
  })

  // Atualizar status
  await prisma.match.updateMany({
    where: {
      id: { in: expiredMatches.map(m => m.id) },
    },
    data: {
      status: 'EXPIRADO',
    },
  })

  console.log(`${expiredMatches.length} matches expirados`)
}
```

### Exemplo 5: Middleware de Manutenção

```typescript
import { NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config-service'

export async function maintenanceMiddleware(request: Request) {
  const isMaintenanceMode = await ConfigService.isMaintenanceMode()

  if (isMaintenanceMode) {
    return NextResponse.json(
      { error: 'Sistema em manutenção. Tente novamente em breve.' },
      { status: 503 }
    )
  }

  return NextResponse.next()
}
```

### Exemplo 6: Validar Upload de Anexo

```typescript
import { ConfigService } from '@/lib/config-service'

async function validateAttachment(file: File): Promise<{ valid: boolean; error?: string }> {
  const maxSizeMb = await ConfigService.getMaxAttachmentSizeMb()
  const maxSizeBytes = maxSizeMb * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMb}MB`,
    }
  }

  return { valid: true }
}
```

## 🎨 Interface de Admin (Futuro)

Criar uma página admin para gerenciar configurações:

```typescript
// src/app/admin/configuracoes/page.tsx
import { ConfigService } from '@/lib/config-service'

export default async function ConfiguracoesPage() {
  const matchingConfigs = await ConfigService.getByCategory('matching')
  const notifConfigs = await ConfigService.getByCategory('notificacao')

  return (
    <div>
      <h1>Configurações do Sistema</h1>

      <section>
        <h2>Matching</h2>
        {Object.entries(matchingConfigs).map(([key, value]) => (
          <ConfigInput key={key} chave={key} valor={value} />
        ))}
      </section>

      <section>
        <h2>Notificações</h2>
        {Object.entries(notifConfigs).map(([key, value]) => (
          <ConfigInput key={key} chave={key} valor={value} />
        ))}
      </section>
    </div>
  )
}
```

## 🔒 Segurança

### Permissões

Apenas admins devem poder alterar configurações:

```typescript
// API Route: /api/admin/configuracoes
import { getServerSession } from 'next-auth'
import { ConfigService } from '@/lib/config-service'

export async function PUT(request: Request) {
  const session = await getServerSession()

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { chave, valor } = await request.json()
  await ConfigService.set(chave, valor)

  return NextResponse.json({ success: true })
}
```

## ⚡ Performance

### Cache Automático
- Configurações são cacheadas por 5 minutos
- Cache é limpo automaticamente ao atualizar
- Reduz consultas ao banco em 99%

### Exemplo de Performance

```typescript
// Primeira chamada: consulta o banco
const hours1 = await ConfigService.getMatchExpirationHours() // ~10ms

// Segunda chamada (dentro de 5min): usa cache
const hours2 = await ConfigService.getMatchExpirationHours() // <1ms

// Após 5 minutos: consulta novamente
const hours3 = await ConfigService.getMatchExpirationHours() // ~10ms
```

## 📊 Monitoramento

Log de alterações de configurações importantes:

```typescript
import { ConfigService } from '@/lib/config-service'

async function updateConfig(chave: string, valor: string, userId: string) {
  // Buscar valor antigo
  const oldValue = await ConfigService.get(chave)

  // Atualizar
  await ConfigService.set(chave, valor)

  // Log de auditoria
  console.log({
    action: 'CONFIG_UPDATED',
    chave,
    oldValue,
    newValue: valor,
    userId,
    timestamp: new Date(),
  })

  // Notificar admins se configuração crítica
  if (['maintenance_mode', 'beta_mode'].includes(chave)) {
    await notifyAdmins(`Configuração ${chave} alterada: ${oldValue} → ${valor}`)
  }
}
```

---

**Dica:** Sempre use os helpers type-safe ao invés de strings mágicas!

✅ `await ConfigService.getMatchExpirationHours()`
❌ `await ConfigService.get('match_expiration_hours')`
