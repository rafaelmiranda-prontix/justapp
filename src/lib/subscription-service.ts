import { prisma } from './prisma'
import { getPlanLimits, getPlanConfig, type PlanType } from './plans'
import {
  createSubscriptionHistory,
  finalizeCurrentSubscription,
  type CanceladoPor,
} from './subscription-history.service'

/**
 * Reseta o contador de leads mensais se necessário
 */
export async function resetMonthlyLeadsIfNeeded(advogadoId: string): Promise<void> {
  const advogado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogado) {
    return
  }

  const agora = new Date()
  const ultimoReset = advogado.ultimoResetLeads

  // Verifica se passou 1 mês desde o último reset
  const diffMs = agora.getTime() - ultimoReset.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays >= 30) {
    const limits = await getPlanLimits(advogado.plano)
    const novoLimite = limits.isUnlimited ? -1 : limits.leadsPerMonth

    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        leadsRecebidosMes: 0,
        leadsLimiteMes: novoLimite,
        ultimoResetLeads: agora,
      },
    })
  } else if (advogado.leadsLimiteMes === 0) {
    // Se o limite ainda não foi configurado, configura agora
    const limits = await getPlanLimits(advogado.plano)
    const novoLimite = limits.isUnlimited ? -1 : limits.leadsPerMonth

    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        leadsLimiteMes: novoLimite,
      },
    })
  }
}

/**
 * Reseta o contador de casos por hora se necessário
 */
export async function resetHourlyCasesIfNeeded(advogadoId: string): Promise<void> {
  const advogado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogado) {
    return
  }

  const agora = new Date()
  const ultimoReset = advogado.ultimoResetCasosHora

  // Verifica se passou 1 hora desde o último reset
  const diffMs = agora.getTime() - ultimoReset.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours >= 1) {
    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        casosRecebidosHora: 0,
        ultimoResetCasosHora: agora,
      },
    })
  }
}

/**
 * Incrementa o contador de leads recebidos
 */
export async function incrementLeadsReceived(advogadoId: string): Promise<void> {
  // Resetar contador por hora se necessário
  await resetHourlyCasesIfNeeded(advogadoId)

  // Incrementar contador mensal
  await prisma.advogados.update({
    where: { id: advogadoId },
    data: {
      leadsRecebidosMes: {
        increment: 1,
      },
      casosRecebidosHora: {
        increment: 1,
      },
    },
  })
}

/**
 * Verifica se o advogado pode receber um lead
 */
export async function canAdvogadoReceiveLead(advogadoId: string): Promise<{
  canReceive: boolean
  reason?: string
}> {
  const advogado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogado) {
    return { canReceive: false, reason: 'Advogado não encontrado' }
  }

  // Verifica se o advogado foi aprovado pelo admin
  if (!advogado.aprovado) {
    return { canReceive: false, reason: 'Advogado aguardando aprovação do administrador' }
  }

  // Verifica se o plano está ativo
  if (advogado.plano === 'FREE') {
    return { canReceive: false, reason: 'Plano gratuito não permite receber leads' }
  }

  // Verifica se o plano expirou
  if (advogado.planoExpira && advogado.planoExpira < new Date()) {
    return { canReceive: false, reason: 'Plano expirado' }
  }

  // Reseta contadores se necessário
  await resetMonthlyLeadsIfNeeded(advogadoId)
  await resetHourlyCasesIfNeeded(advogadoId)

  // Busca novamente para ter os valores atualizados
  const advogadoAtualizado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogadoAtualizado) {
    return { canReceive: false, reason: 'Erro ao buscar advogado' }
  }

  const limits = await getPlanLimits(advogadoAtualizado.plano)

  // Se é ilimitado, pode receber (sem verificação de hora)
  if (limits.isUnlimited) {
    return { canReceive: true }
  }

  // Verifica limite mensal (trata -1 como ilimitado)
  if (
    advogadoAtualizado.leadsLimiteMes !== -1 &&
    advogadoAtualizado.leadsLimiteMes < 999 &&
    advogadoAtualizado.leadsRecebidosMes >= advogadoAtualizado.leadsLimiteMes
  ) {
    return {
      canReceive: false,
      reason: `Limite de ${advogadoAtualizado.leadsLimiteMes} leads/mês atingido`,
    }
  }

  // Verifica limite por hora (apenas para planos limitados)
  if (limits.leadsPerHour > 0 && advogadoAtualizado.casosRecebidosHora >= limits.leadsPerHour) {
    return {
      canReceive: false,
      reason: `Limite de ${limits.leadsPerHour} casos/hora atingido`,
    }
  }

  return { canReceive: true }
}

/**
 * Atualiza o plano do advogado
 */
export async function updateAdvogadoPlan(
  advogadoId: string,
  plano: PlanType,
  planoExpira?: Date,
  options?: {
    stripeSubscriptionId?: string
    stripePriceId?: string
    precoPago?: number
  }
): Promise<void> {
  const limits = await getPlanLimits(plano)
  const novoLimite = limits.isUnlimited ? -1 : limits.leadsPerMonth

  // Buscar advogado atual para saber o plano anterior
  const advogado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogado) {
    throw new Error('Advogado não encontrado')
  }

  const planoAnterior = advogado.plano

  // Buscar IDs dos planos no catálogo
  const [planoCatalogo, planoAnteriorCatalogo] = await Promise.all([
    prisma.planos.findUnique({ where: { codigo: plano } }),
    planoAnterior !== plano
      ? prisma.planos.findUnique({ where: { codigo: planoAnterior } })
      : Promise.resolve(null),
  ])

  if (!planoCatalogo) {
    throw new Error(`Plano ${plano} não encontrado no catálogo`)
  }

  // Atualizar plano do advogado
  await prisma.advogados.update({
    where: { id: advogadoId },
    data: {
      plano,
      planoExpira: planoExpira || null,
      leadsLimiteMes: novoLimite,
      stripeSubscriptionId: options?.stripeSubscriptionId || advogado.stripeSubscriptionId,
      // Não reseta leadsRecebidosMes ao mudar de plano
    },
  })

  // Se mudou de plano, registrar no histórico
  if (planoAnterior !== plano) {
    // Finalizar assinatura anterior
    if (planoAnteriorCatalogo) {
      await finalizeCurrentSubscription(
        advogadoId,
        planoAnterior === 'FREE'
          ? 'Upgrade de plano gratuito'
          : `Mudança de plano ${planoAnterior} → ${plano}`,
        'USUARIO'
      )
    }

    // Criar nova assinatura
    await createSubscriptionHistory({
      advogadoId,
      planoId: planoCatalogo.id,
      planoAnteriorId: planoAnteriorCatalogo?.id,
      precoPago: options?.precoPago || planoCatalogo.preco,
      leadsLimite: novoLimite,
      stripeSubscriptionId: options?.stripeSubscriptionId,
      stripePriceId: options?.stripePriceId || planoCatalogo.stripePriceId || undefined,
    })
  }
}

/**
 * Cancela assinatura do advogado (volta para FREE)
 */
export async function cancelAdvogadoSubscription(
  advogadoId: string,
  motivo: string,
  canceladoPor: CanceladoPor = 'USUARIO'
): Promise<void> {
  // Finalizar assinatura atual
  await finalizeCurrentSubscription(advogadoId, motivo, canceladoPor)

  // Voltar para plano FREE
  const limits = await getPlanLimits('FREE')
  const novoLimite = limits.isUnlimited ? -1 : limits.leadsPerMonth

  await prisma.advogados.update({
    where: { id: advogadoId },
    data: {
      plano: 'FREE',
      planoExpira: null,
      leadsLimiteMes: novoLimite,
      stripeSubscriptionId: null,
    },
  })

  // Criar entrada no histórico para o plano FREE
  const planoFree = await prisma.planos.findUnique({
    where: { codigo: 'FREE' },
  })

  if (planoFree) {
    await createSubscriptionHistory({
      advogadoId,
      planoId: planoFree.id,
      precoPago: 0,
      leadsLimite: novoLimite,
    })
  }
}
