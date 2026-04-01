import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function yearMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * GET — resumo de regras por plano e consumo no mês corrente (admin).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const ref = yearMonth()
    const plans = await prisma.planos.findMany({
      orderBy: { ordem: 'asc' },
      include: { distributionRule: true },
    })

    const usageRows = await prisma.userDistributionQuotaUsage.findMany({
      where: { referenceMonth: ref },
      orderBy: { opportunitiesDelivered: 'desc' },
      take: 150,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            advogados: { select: { id: true, plano: true } },
          },
        },
      },
    })

    return NextResponse.json({
      referenceMonth: ref,
      plans: plans.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        rule: p.distributionRule,
      })),
      usageSample: usageRows,
    })
  } catch (e) {
    console.error('[admin distribution-quotas]', e)
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 })
  }
}
