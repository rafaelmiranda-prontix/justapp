import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, ServiceRequestStatus } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'

/**
 * GET /api/service-requests/mine?role=solicitor|correspondent&status=&from=&to=
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    const { searchParams } = req.nextUrl
    const role = searchParams.get('role') || 'solicitor'
    const statusParam = searchParams.get('status') as ServiceRequestStatus | null
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const take = Math.min(parseInt(searchParams.get('take') || '40', 10) || 40, 100)
    const cursor = searchParams.get('cursor')

    const where: Prisma.ServiceRequestWhereInput =
      role === 'correspondent'
        ? { correspondentAdvogadoId: advogado.id }
        : { solicitorAdvogadoId: advogado.id }

    if (statusParam && Object.values(ServiceRequestStatus).includes(statusParam)) {
      where.status = statusParam
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const items = await prisma.serviceRequest.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        solicitor: { include: { users: { select: { id: true, name: true } } } },
        correspondent: { include: { users: { select: { id: true, name: true } } } },
      },
    })

    const hasMore = items.length > take
    const list = hasMore ? items.slice(0, take) : items
    const nextCursor = hasMore && list.length > 0 ? list[list.length - 1].id : null

    return NextResponse.json({ items: list, nextCursor })
  } catch (e) {
    console.error('[service-requests mine GET]', e)
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  }
}
