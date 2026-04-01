import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OperationalServiceKind, Prisma } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'
import {
  buildOpportunityAccessWhere,
  canUserReceiveMoreOpportunities,
  expandDistributionForExpiredBatches,
  recordOpportunityExposureIfNeeded,
} from '@/lib/service-requests/distribution'
import {
  buildBaseOpportunityWhere,
  buildRegionWhereForOpportunities,
} from '@/lib/service-requests/opportunity-eligibility'

/**
 * GET /api/service-requests/opportunities
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    const profile = await prisma.correspondentProfile.findUnique({
      where: { advogadoId: advogado.id },
      include: { acceptedKinds: true, regions: true },
    })
    if (!profile?.isActive) {
      return NextResponse.json(
        { error: 'Ative seu perfil de correspondente para ver oportunidades.', items: [] },
        { status: 403 }
      )
    }

    await expandDistributionForExpiredBatches()

    const { searchParams } = req.nextUrl
    const kindParam = searchParams.get('kind') as OperationalServiceKind | null
    const comarca = searchParams.get('comarca')
    const forum = searchParams.get('forum')
    const cidade = searchParams.get('cidade')
    const estado = searchParams.get('estado')
    const scheduledFrom = searchParams.get('scheduledFrom')
    const scheduledTo = searchParams.get('scheduledTo')
    const minAmount = searchParams.get('minAmountCents')
    const maxAmount = searchParams.get('maxAmountCents')
    const take = Math.min(parseInt(searchParams.get('take') || '30', 10) || 30, 100)
    const cursor = searchParams.get('cursor')

    const acceptedKinds = profile.acceptedKinds.map((k) => k.kind)

    let base = buildBaseOpportunityWhere(advogado.id, acceptedKinds)

    const regionFilter = buildRegionWhereForOpportunities(profile.regions)
    if (regionFilter) {
      base = { AND: [base, regionFilter] }
    }

    if (kindParam && Object.values(OperationalServiceKind).includes(kindParam)) {
      base = { AND: [base, { kind: kindParam }] }
    }

    if (comarca) {
      base = { AND: [base, { comarca: { contains: comarca, mode: 'insensitive' } }] }
    }
    if (forum) {
      base = { AND: [base, { forum: { contains: forum, mode: 'insensitive' } }] }
    }
    if (cidade || estado) {
      const ors: Prisma.ServiceRequestWhereInput[] = [
        ...(cidade
          ? [{ location: { contains: cidade, mode: 'insensitive' as const } }]
          : []),
        ...(estado
          ? [{ location: { contains: estado, mode: 'insensitive' as const } }]
          : []),
      ]
      if (ors.length) base = { AND: [base, { OR: ors }] }
    }

    if (scheduledFrom || scheduledTo) {
      const sched: Prisma.DateTimeFilter = {}
      if (scheduledFrom) sched.gte = new Date(scheduledFrom)
      if (scheduledTo) sched.lte = new Date(scheduledTo)
      base = { AND: [base, { scheduledAt: sched }] }
    }

    if (minAmount || maxAmount) {
      const amt: Prisma.IntNullableFilter = {}
      if (minAmount) amt.gte = parseInt(minAmount, 10)
      if (maxAmount) amt.lte = parseInt(maxAmount, 10)
      base = { AND: [base, { offeredAmountCents: amt }] }
    }

    let where = buildOpportunityAccessWhere(advogado.id, base)

    const quotaOk = await canUserReceiveMoreOpportunities(session.user.id)
    if (!quotaOk) {
      where = {
        AND: [where, { distributionBatches: { none: {} } }],
      }
    }

    const items = await prisma.serviceRequest.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        solicitor: {
          include: {
            users: { select: { id: true, name: true } },
          },
        },
      },
    })

    const hasMore = items.length > take
    const list = hasMore ? items.slice(0, take) : items
    const nextCursor = hasMore && list.length > 0 ? list[list.length - 1].id : null

    for (const it of list) {
      await recordOpportunityExposureIfNeeded(it.id, advogado.id, session.user.id)
    }

    return NextResponse.json({ items: list, nextCursor })
  } catch (e) {
    console.error('[opportunities GET]', e)
    return NextResponse.json({ error: 'Erro ao listar oportunidades' }, { status: 500 })
  }
}
