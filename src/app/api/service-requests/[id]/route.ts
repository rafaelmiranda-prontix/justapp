import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServiceRequestWithParties } from '@/lib/service-requests/access'
import { canViewServiceRequestDetail } from '@/lib/service-requests/can-view'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { id } = await params
    const row = await getServiceRequestWithParties(id)
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    if (!(await canViewServiceRequestDetail(userId, session.user.role ?? 'CIDADAO', row))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Evita burst de conexões com várias queries simultâneas.
    const [attachments, messages, history, reviews] = await prisma.$transaction([
      prisma.serviceRequestAttachment.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.serviceRequestMessage.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true } } },
      }),
      prisma.serviceRequestStatusHistory.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { id: true, name: true, role: true } } },
      }),
      prisma.serviceReview.findMany({
        where: { serviceRequestId: id },
        include: { reviewer: { select: { userId: true } } },
      }),
    ])

    let correspondentProfile: Awaited<ReturnType<typeof prisma.correspondentProfile.findUnique>> | null =
      null
    if (row.correspondentAdvogadoId) {
      try {
        correspondentProfile = await prisma.correspondentProfile.findUnique({
          where: { advogadoId: row.correspondentAdvogadoId },
          include: { acceptedKinds: true, regions: true },
        })
      } catch (profileError) {
        console.warn('[service-requests id GET] correspondentProfile unavailable:', profileError)
      }
    }

    let reviewerAvg: { average: number; count: number } | null = null
    if (row.correspondentAdvogadoId) {
      try {
        const agg = await prisma.serviceReview.aggregate({
          where: { targetAdvogadoId: row.correspondentAdvogadoId },
          _avg: { rating: true },
          _count: { _all: true },
        })
        reviewerAvg = {
          average: agg._avg.rating ?? 0,
          count: agg._count._all,
        }
      } catch (aggError) {
        console.warn('[service-requests id GET] correspondent rating unavailable:', aggError)
      }
    }

    return NextResponse.json({
      serviceRequest: row,
      attachments,
      messages,
      statusHistory: history,
      reviews,
      correspondentProfile,
      correspondentRatingSummary: reviewerAvg,
    })
  } catch (e) {
    console.error('[service-requests id GET]', e)
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 })
  }
}
