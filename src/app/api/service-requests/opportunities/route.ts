import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OperationalServiceKind, Prisma, ServiceRequestStatus } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'

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
      include: { acceptedKinds: true },
    })
    if (!profile?.isActive) {
      return NextResponse.json(
        { error: 'Ative seu perfil de correspondente para ver oportunidades.', items: [] },
        { status: 403 }
      )
    }

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

    const where: Prisma.ServiceRequestWhereInput = {
      status: ServiceRequestStatus.PUBLICADO,
      correspondentAdvogadoId: null,
      acceptDeadlineAt: { gte: new Date() },
      solicitorAdvogadoId: { not: advogado.id },
    }

    if (acceptedKinds.length > 0) {
      where.kind = { in: acceptedKinds }
    }

    if (kindParam && Object.values(OperationalServiceKind).includes(kindParam)) {
      where.kind = kindParam
    }

    if (comarca) {
      where.comarca = { contains: comarca, mode: 'insensitive' }
    }
    if (forum) {
      where.forum = { contains: forum, mode: 'insensitive' }
    }
    if (cidade || estado) {
      where.OR = [
        ...(cidade
          ? [{ location: { contains: cidade, mode: 'insensitive' as const } }]
          : []),
        ...(estado
          ? [{ location: { contains: estado, mode: 'insensitive' as const } }]
          : []),
      ]
    }

    if (scheduledFrom || scheduledTo) {
      where.scheduledAt = {}
      if (scheduledFrom) where.scheduledAt.gte = new Date(scheduledFrom)
      if (scheduledTo) where.scheduledAt.lte = new Date(scheduledTo)
    }

    if (minAmount || maxAmount) {
      where.offeredAmountCents = {}
      if (minAmount) where.offeredAmountCents.gte = parseInt(minAmount, 10)
      if (maxAmount) where.offeredAmountCents.lte = parseInt(maxAmount, 10)
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

    return NextResponse.json({ items: list, nextCursor })
  } catch (e) {
    console.error('[opportunities GET]', e)
    return NextResponse.json({ error: 'Erro ao listar oportunidades' }, { status: 500 })
  }
}
