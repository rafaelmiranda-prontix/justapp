import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { OperationalServiceKind, ServiceRequestStatus } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'

const createSchema = z.object({
  kind: z.nativeEnum(OperationalServiceKind),
  customKindDescription: z.string().max(500).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(20000),
  scheduledAt: z.string().datetime(),
  location: z.string().max(500).optional(),
  comarca: z.string().max(200).optional(),
  forum: z.string().max(200).optional(),
  offeredAmountCents: z.number().int().min(0).nullable().optional(),
  acceptDeadlineAt: z.string().datetime(),
})

/**
 * POST /api/service-requests — publicar serviço (solicitante)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    if (!advogado.aprovado) {
      return NextResponse.json(
        { error: 'Apenas advogados aprovados podem publicar serviços.' },
        { status: 403 }
      )
    }

    const raw = await req.json()
    const data = createSchema.parse(raw)

    if (data.kind === OperationalServiceKind.PERSONALIZADO && !data.customKindDescription?.trim()) {
      return NextResponse.json(
        { error: 'Descreva o tipo personalizado.' },
        { status: 400 }
      )
    }

    const scheduledAt = new Date(data.scheduledAt)
    const acceptDeadlineAt = new Date(data.acceptDeadlineAt)
    if (acceptDeadlineAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Prazo de aceite deve ser no futuro.' }, { status: 400 })
    }

    const reqRow = await prisma.serviceRequest.create({
      data: {
        solicitorAdvogadoId: advogado.id,
        createdByUserId: session.user.id,
        kind: data.kind,
        customKindDescription: data.customKindDescription?.trim() || null,
        title: data.title.trim(),
        description: data.description.trim(),
        scheduledAt,
        location: data.location?.trim() || null,
        comarca: data.comarca?.trim() || null,
        forum: data.forum?.trim() || null,
        offeredAmountCents: data.offeredAmountCents ?? null,
        acceptDeadlineAt,
        status: ServiceRequestStatus.PUBLICADO,
      },
    })

    await prisma.serviceRequestStatusHistory.create({
      data: {
        requestId: reqRow.id,
        fromStatus: null,
        toStatus: ServiceRequestStatus.PUBLICADO,
        actorUserId: session.user.id,
        note: 'Publicação criada',
      },
    })

    return NextResponse.json({ serviceRequest: reqRow })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[service-requests POST]', e)
    return NextResponse.json({ error: 'Erro ao publicar' }, { status: 500 })
  }
}
