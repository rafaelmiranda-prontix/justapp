import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OperationalServiceKind, Prisma, ServiceRequestStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const statusParam = searchParams.get('status') as ServiceRequestStatus | null
    const kind = searchParams.get('kind')
    const solicitorUserId = searchParams.get('solicitorUserId')
    const correspondentUserId = searchParams.get('correspondentUserId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const where: Prisma.ServiceRequestWhereInput = {}

    if (statusParam && Object.values(ServiceRequestStatus).includes(statusParam)) {
      where.status = statusParam
    }
    if (kind && Object.values(OperationalServiceKind).includes(kind as OperationalServiceKind)) {
      where.kind = kind as OperationalServiceKind
    }
    if (solicitorUserId) {
      where.solicitor = { userId: solicitorUserId }
    }
    if (correspondentUserId) {
      where.correspondent = { userId: correspondentUserId }
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [total, items] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          solicitor: { include: { users: { select: { id: true, name: true, email: true } } } },
          correspondent: { include: { users: { select: { id: true, name: true, email: true } } } },
        },
      }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e) {
    console.error('[admin service-requests GET]', e)
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  }
}
