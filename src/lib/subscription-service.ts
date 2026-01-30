import { prisma } from './prisma'
import { PLANS, getPlanLimits, type PlanType } from './plans'

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
    const limits = getPlanLimits(advogado.plano)
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
    const limits = getPlanLimits(advogado.plano)
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
 * Incrementa o contador de leads recebidos
 */
export async function incrementLeadsReceived(advogadoId: string): Promise<void> {
  await prisma.advogados.update({
    where: { id: advogadoId },
    data: {
      leadsRecebidosMes: {
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

  // Verifica se o plano está ativo
  if (advogado.plano === 'FREE') {
    return { canReceive: false, reason: 'Plano gratuito não permite receber leads' }
  }

  // Verifica se o plano expirou
  if (advogado.planoExpira && advogado.planoExpira < new Date()) {
    return { canReceive: false, reason: 'Plano expirado' }
  }

  // Reseta contador se necessário
  await resetMonthlyLeadsIfNeeded(advogadoId)

  // Busca novamente para ter os valores atualizados
  const advogadoAtualizado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
  })

  if (!advogadoAtualizado) {
    return { canReceive: false, reason: 'Erro ao buscar advogado' }
  }

  const limits = getPlanLimits(advogadoAtualizado.plano)

  // Se é ilimitado, pode receber
  if (limits.isUnlimited) {
    return { canReceive: true }
  }

  // Verifica se não excedeu o limite
  if (
    advogadoAtualizado.leadsRecebidosMes >= advogadoAtualizado.leadsLimiteMes
  ) {
    return {
      canReceive: false,
      reason: `Limite de ${advogadoAtualizado.leadsLimiteMes} leads/mês atingido`,
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
  planoExpira?: Date
): Promise<void> {
  const limits = getPlanLimits(plano)
  const novoLimite = limits.isUnlimited ? -1 : limits.leadsPerMonth

  await prisma.advogados.update({
    where: { id: advogadoId },
    data: {
      plano,
      planoExpira: planoExpira || null,
      leadsLimiteMes: novoLimite,
      // Não reseta leadsRecebidosMes ao mudar de plano
    },
  })
}
