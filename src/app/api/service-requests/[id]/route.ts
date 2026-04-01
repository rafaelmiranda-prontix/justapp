import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAdvogadoForUserId, getServiceRequestWithParties } from '@/lib/service-requests/access'
import { canViewServiceRequestDetail } from '@/lib/service-requests/can-view'
import { updateServiceRequestBySolicitor } from '@/lib/service-requests/update-service-request'
import { z } from 'zod'

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
    const [attachments, messages, history, reviews, fieldChanges] = await prisma.$transaction([
      prisma.serviceRequestAttachment.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.serviceRequestMessage.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
          attachment: {
            select: { id: true, originalName: true, storagePath: true, kind: true },
          },
        },
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
      prisma.serviceRequestFieldChange.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { changedBy: { select: { id: true, name: true } } },
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
      fieldChanges,
      correspondentProfile,
      correspondentRatingSummary: reviewerAvg,
    })
  } catch (e) {
    console.error('[service-requests id GET]', e)
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    const { id } = await params
    const row = await getServiceRequestWithParties(id)
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    if (!(await canViewServiceRequestDetail(session.user.id, session.user.role ?? 'CIDADAO', row))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const result = await updateServiceRequestBySolicitor({
      requestId: id,
      solicitorAdvogadoId: advogado.id,
      userId: session.user.id,
      body,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ serviceRequest: result.serviceRequest })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[service-requests id PATCH]', e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
