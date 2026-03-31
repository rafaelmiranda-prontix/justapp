import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestStatus } from '@prisma/client'
import { z } from 'zod'
import {
  getAdvogadoForUserId,
  getServiceRequestWithParties,
} from '@/lib/service-requests/access'
import { notifyServiceRequestEvent } from '@/lib/service-requests/notify'

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export async function POST(
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

    if (row.status !== ServiceRequestStatus.CONCLUIDO) {
      return NextResponse.json(
        { error: 'Só é possível avaliar serviços concluídos.' },
        { status: 400 }
      )
    }

    const { rating, comment } = bodySchema.parse(await req.json())

    let targetAdvogadoId: string | null = null
    if (row.solicitorAdvogadoId === advogado.id) {
      targetAdvogadoId = row.correspondentAdvogadoId
    } else if (row.correspondentAdvogadoId === advogado.id) {
      targetAdvogadoId = row.solicitorAdvogadoId
    } else {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    if (!targetAdvogadoId) {
      return NextResponse.json({ error: 'Sem correspondente para avaliar.' }, { status: 400 })
    }

    const review = await prisma.serviceReview.create({
      data: {
        serviceRequestId: id,
        reviewerAdvogadoId: advogado.id,
        targetAdvogadoId,
        rating,
        comment: comment?.trim() || null,
      },
    })

    const targetUser = await prisma.advogados.findUnique({
      where: { id: targetAdvogadoId },
      select: { userId: true },
    })
    if (targetUser) {
      await notifyServiceRequestEvent({
        type: 'SYSTEM',
        userIds: [targetUser.userId],
        title: 'Nova avaliação',
        message: `Você foi avaliado com nota ${rating} no serviço ${row.title}`.slice(0, 160),
        requestId: id,
      })
    }

    return NextResponse.json({ review })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 })
    }
    if (String(e).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Você já avaliou este serviço.' }, { status: 409 })
    }
    console.error('[reviews POST]', e)
    return NextResponse.json({ error: 'Erro ao avaliar' }, { status: 500 })
  }
}
