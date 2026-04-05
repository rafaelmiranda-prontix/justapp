import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestStatus } from '@prisma/client'
import { z } from 'zod'
import {
  canAccessServiceRequest,
  getServiceRequestWithParties,
} from '@/lib/service-requests/access'
import { isStatusTransitionAllowed } from '@/lib/service-requests/status'
import { notifyServiceRequestEvent } from '@/lib/service-requests/notify'
import { assertAudienciasDiligenciasEnabled } from '@/lib/service-requests/feature-guard'

const bodySchema = z.object({
  toStatus: z.nativeEnum(ServiceRequestStatus),
  note: z.string().max(2000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const featureBlocked = await assertAudienciasDiligenciasEnabled()
    if (featureBlocked) return featureBlocked
    const { id } = await params
    const row = await getServiceRequestWithParties(id)
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (!canAccessServiceRequest(userId, session.user.role ?? 'CIDADAO', row)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { toStatus, note } = bodySchema.parse(await req.json())
    const from = row.status

    const isSolicitor = row.solicitor.userId === userId
    const isCorrespondent = row.correspondent?.userId === userId
    const actor =
      session.user.role === 'ADMIN'
        ? 'admin'
        : isSolicitor
          ? 'solicitor'
          : isCorrespondent
            ? 'correspondent'
            : null

    if (!actor) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    if (!isStatusTransitionAllowed(actor, from, toStatus)) {
      return NextResponse.json(
        { error: `Transição de ${from} para ${toStatus} não permitida.` },
        { status: 400 }
      )
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status: toStatus },
      include: {
        solicitor: { include: { users: true } },
        correspondent: { include: { users: true } },
      },
    })

    await prisma.serviceRequestStatusHistory.create({
      data: {
        requestId: id,
        fromStatus: from,
        toStatus,
        actorUserId: userId,
        note: note?.trim() || null,
      },
    })

    const recipients: string[] = []
    if (row.solicitor.userId !== userId) recipients.push(row.solicitor.userId)
    if (row.correspondent?.userId && row.correspondent.userId !== userId) {
      recipients.push(row.correspondent.userId)
    }

    if (recipients.length > 0) {
      await notifyServiceRequestEvent({
        type: 'SERVICE_REQUEST_STATUS',
        userIds: recipients,
        title: 'Status do serviço atualizado',
        message: `${from} → ${toStatus}`.slice(0, 160),
        requestId: id,
        extra: { fromStatus: from, toStatus },
      })
    }

    if (toStatus === ServiceRequestStatus.AGUARDANDO_VALIDACAO && isCorrespondent) {
      await notifyServiceRequestEvent({
        type: 'SERVICE_REQUEST_PENDING_COMPLETION',
        userIds: [row.solicitor.userId],
        title: 'Validar conclusão',
        message: `Confirme a conclusão: ${updated.title}`.slice(0, 160),
        requestId: id,
      })
    }

    return NextResponse.json({ serviceRequest: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 })
    }
    console.error('[status POST]', e)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}
