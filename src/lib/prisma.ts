import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

/**
 * Em dev, o singleton em globalThis pode ter sido criado antes de `prisma generate`
 * incluir um modelo novo; a instância antiga não expõe delegates (ex.: emailActionToken).
 */
function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  if (cached) {
    const stale =
      process.env.NODE_ENV === 'development' &&
      (typeof (cached as unknown as { emailActionToken?: unknown }).emailActionToken === 'undefined' ||
        typeof (cached as unknown as { supportContact?: unknown }).supportContact === 'undefined' ||
        typeof (cached as unknown as { serviceDistributionBatch?: unknown }).serviceDistributionBatch ===
          'undefined' ||
        typeof (cached as unknown as { messageEditHistory?: unknown }).messageEditHistory === 'undefined')
    if (stale) {
      void cached.$disconnect().catch(() => {})
      const next = createPrismaClient()
      globalForPrisma.prisma = next
      return next
    }
    return cached
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrisma()
