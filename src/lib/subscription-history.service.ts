import { prisma } from './prisma'
import { type PlanType } from './plans'

export type StatusAssinatura = 'ATIVA' | 'CANCELADA' | 'EXPIRADA' | 'SUSPENSA'
export type CanceladoPor = 'USUARIO' | 'ADMIN' | 'SISTEMA' | 'PAGAMENTO_FALHOU'

/**
 * Cria registro no histórico quando advogado assina um plano
 */
export async function createSubscriptionHistory(params: {
  advogadoId: string
  planoId: string
  planoAnteriorId?: string
  precoPago?: number
  leadsLimite: number
  stripeSubscriptionId?: string
  stripePriceId?: string
}) {
  const { nanoid } = await import('nanoid')

  return prisma.historicoAssinaturas.create({
    data: {
      id: nanoid(),
      advogadoId: params.advogadoId,
      planoId: params.planoId,
      planoAnteriorId: params.planoAnteriorId,
      status: 'ATIVA',
      precoPago: params.precoPago,
      leadsLimite: params.leadsLimite,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      inicioEm: new Date(),
      updatedAt: new Date(),
    },
  })
}

/**
 * Finaliza assinatura anterior ao fazer upgrade/downgrade
 */
export async function finalizeCurrentSubscription(
  advogadoId: string,
  motivo?: string,
  canceladoPor?: CanceladoPor
) {
  // Buscar assinatura ativa atual
  const assinaturaAtiva = await prisma.historicoAssinaturas.findFirst({
    where: {
      advogadoId,
      status: 'ATIVA',
    },
    orderBy: {
      inicioEm: 'desc',
    },
  })

  if (!assinaturaAtiva) {
    return null
  }

  // Finalizar assinatura
  return prisma.historicoAssinaturas.update({
    where: { id: assinaturaAtiva.id },
    data: {
      status: 'CANCELADA',
      fimEm: new Date(),
      motivo,
      canceladoPor,
      updatedAt: new Date(),
    },
  })
}

/**
 * Cancela assinatura do advogado
 */
export async function cancelSubscription(
  advogadoId: string,
  motivo: string,
  canceladoPor: CanceladoPor = 'USUARIO'
) {
  return finalizeCurrentSubscription(advogadoId, motivo, canceladoPor)
}

/**
 * Busca histórico completo de assinaturas do advogado
 */
export async function getSubscriptionHistory(advogadoId: string) {
  return prisma.historicoAssinaturas.findMany({
    where: { advogadoId },
    include: {
      planos: true,
    },
    orderBy: {
      inicioEm: 'desc',
    },
  })
}

/**
 * Busca assinatura ativa atual
 */
export async function getCurrentSubscription(advogadoId: string) {
  return prisma.historicoAssinaturas.findFirst({
    where: {
      advogadoId,
      status: 'ATIVA',
    },
    include: {
      planos: true,
    },
    orderBy: {
      inicioEm: 'desc',
    },
  })
}

/**
 * Atualiza status de assinatura (usado por webhooks do Stripe)
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: StatusAssinatura,
  motivo?: string
) {
  return prisma.historicoAssinaturas.updateMany({
    where: {
      stripeSubscriptionId,
      status: 'ATIVA',
    },
    data: {
      status,
      fimEm: status !== 'ATIVA' ? new Date() : undefined,
      motivo,
      updatedAt: new Date(),
    },
  })
}

/**
 * Retorna estatísticas de assinaturas
 */
export async function getSubscriptionStats() {
  const [total, ativas, canceladas, porPlano] = await Promise.all([
    prisma.historicoAssinaturas.count(),
    prisma.historicoAssinaturas.count({
      where: { status: 'ATIVA' },
    }),
    prisma.historicoAssinaturas.count({
      where: { status: 'CANCELADA' },
    }),
    prisma.historicoAssinaturas.groupBy({
      by: ['planoId'],
      where: { status: 'ATIVA' },
      _count: true,
    }),
  ])

  return {
    total,
    ativas,
    canceladas,
    porPlano,
  }
}

/**
 * Busca assinaturas que expiram em breve (para notificação)
 */
export async function getExpiringSubscriptions(daysAhead: number = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return prisma.historicoAssinaturas.findMany({
    where: {
      status: 'ATIVA',
      fimEm: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      advogados: {
        include: {
          users: true,
        },
      },
      planos: true,
    },
  })
}
