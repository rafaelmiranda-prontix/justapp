import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/analytics/conversion-funnel
 * Retorna estatísticas do funil de conversão do chat anônimo
 * Apenas para admins
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar autenticação e permissão de admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 })
    }

    // Parâmetros de data (opcional)
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Buscar estatísticas
    const [totalSessions, converted, abandoned, expired, active] = await Promise.all([
      prisma.anonymousSession.count({ where }),
      prisma.anonymousSession.count({
        where: { ...where, status: 'CONVERTED' },
      }),
      prisma.anonymousSession.count({
        where: { ...where, status: 'ABANDONED' },
      }),
      prisma.anonymousSession.count({
        where: { ...where, status: 'EXPIRED' },
      }),
      prisma.anonymousSession.count({
        where: { ...where, status: 'ACTIVE' },
      }),
    ])

    // Calcular média de mensagens antes da conversão
    const convertedSessions = await prisma.anonymousSession.findMany({
      where: { ...where, status: 'CONVERTED' },
      select: { mensagens: true },
    })

    const avgMessagesBeforeConversion =
      convertedSessions.length > 0
        ? convertedSessions.reduce((acc, s) => {
            const messages = s.mensagens as any[]
            return acc + messages.length
          }, 0) / convertedSessions.length
        : 0

    // Taxa de conversão
    const conversionRate = totalSessions > 0 ? (converted / totalSessions) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        totalSessions,
        converted,
        abandoned,
        expired,
        active,
        conversionRate,
        avgMessagesBeforeConversion,
      },
    })
  } catch (error: any) {
    console.error('Error fetching conversion funnel stats:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
