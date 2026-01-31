import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resetMonthlyLeadsIfNeeded } from '@/lib/subscription-service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca o advogado
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Reseta leads se necessário
    await resetMonthlyLeadsIfNeeded(advogado.id)

    // Busca novamente para ter dados atualizados
    const advogadoAtualizado = await prisma.advogados.findUnique({
      where: { id: advogado.id },
    })

    if (!advogadoAtualizado) {
      return NextResponse.json({ error: 'Erro ao buscar advogado' }, { status: 500 })
    }

    // Verifica se o plano está ativo
    // FREE sempre está ativo
    // Planos pagos: ativo se não expirou
    const isActive =
      advogadoAtualizado.plano === 'FREE' ||
      (!advogadoAtualizado.planoExpira || advogadoAtualizado.planoExpira > new Date())

    return NextResponse.json({
      success: true,
      data: {
        plano: advogadoAtualizado.plano,
        planoExpira: advogadoAtualizado.planoExpira,
        isActive,
        leadsRecebidosMes: advogadoAtualizado.leadsRecebidosMes,
        leadsLimiteMes: advogadoAtualizado.leadsLimiteMes,
        ultimoResetLeads: advogadoAtualizado.ultimoResetLeads,
        hasStripeSubscription: !!advogadoAtualizado.stripeSubscriptionId,
      },
    })
  } catch (error) {
    console.error('Error fetching plano:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    )
  }
}
