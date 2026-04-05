import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestAttachmentKind, ServiceRequestStatus } from '@prisma/client'
import { z } from 'zod'
import {
  canAccessServiceRequest,
  getServiceRequestWithParties,
} from '@/lib/service-requests/access'
import { notifyServiceRequestEvent } from '@/lib/service-requests/notify'
import { assertAudienciasDiligenciasEnabled } from '@/lib/service-requests/feature-guard'

const bodySchema = z.object({
  content: z.string().min(1).max(20000),
  attachmentId: z.string().cuid().optional(),
})

const chatVisibleStatuses: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
  ServiceRequestStatus.CONCLUIDO,
  ServiceRequestStatus.CANCELADO,
]

const chatSendStatuses: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
]

export async function GET(
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
    if (!chatVisibleStatuses.includes(row.status)) {
      return NextResponse.json({ error: 'Chat indisponível neste status.' }, { status: 400 })
    }

    const cursor = req.nextUrl.searchParams.get('cursor')
    const take = Math.min(parseInt(req.nextUrl.searchParams.get('take') || '50', 10) || 50, 100)

    const messages = await prisma.serviceRequestMessage.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, name: true } },
        attachment: {
          select: { id: true, originalName: true, storagePath: true, kind: true },
        },
      },
    })
    const hasMore = messages.length > take
    const list = hasMore ? messages.slice(0, take) : messages
    const nextCursor = hasMore && list.length > 0 ? list[list.length - 1].id : null

    return NextResponse.json({ items: list.reverse(), nextCursor })
  } catch (e) {
    console.error('[messages GET]', e)
    return NextResponse.json({ error: 'Erro ao listar mensagens' }, { status: 500 })
  }
}

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
    const featureBlockedPost = await assertAudienciasDiligenciasEnabled()
    if (featureBlockedPost) return featureBlockedPost
    const { id } = await params
    const row = await getServiceRequestWithParties(id)
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (!canAccessServiceRequest(userId, session.user.role ?? 'CIDADAO', row)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    if (!chatVisibleStatuses.includes(row.status)) {
      return NextResponse.json({ error: 'Chat indisponível neste status.' }, { status: 400 })
    }
    const isAdmin = (session.user.role ?? 'CIDADAO') === 'ADMIN'
    const isSolicitor = row.solicitor.userId === userId
    const isCorrespondent = row.correspondent?.userId === userId
    if (isAdmin) {
      return NextResponse.json(
        { error: 'Admin possui acesso somente leitura ao chat do serviço.' },
        { status: 403 }
      )
    }
    if (!isSolicitor && !isCorrespondent) {
      return NextResponse.json({ error: 'Sem permissão para enviar mensagens.' }, { status: 403 })
    }
    if (!chatSendStatuses.includes(row.status)) {
      return NextResponse.json(
        { error: 'Envio bloqueado neste status. O histórico permanece disponível.' },
        { status: 400 }
      )
    }

    const { content, attachmentId } = bodySchema.parse(await req.json())
    if (attachmentId) {
      const att = await prisma.serviceRequestAttachment.findFirst({
        where: {
          id: attachmentId,
          requestId: id,
          kind: ServiceRequestAttachmentKind.CHAT,
        },
      })
      if (!att) {
        return NextResponse.json({ error: 'Anexo inválido para este chat.' }, { status: 400 })
      }
    }

    const msg = await prisma.serviceRequestMessage.create({
      data: {
        requestId: id,
        authorUserId: userId,
        content: content.trim(),
        attachmentId: attachmentId ?? null,
      },
      include: {
        author: { select: { id: true, name: true } },
        attachment: {
          select: { id: true, originalName: true, storagePath: true, kind: true },
        },
      },
    })

    const recipientUserIds: string[] = []
    if (row.solicitor.userId !== userId) recipientUserIds.push(row.solicitor.userId)
    if (row.correspondent?.userId && row.correspondent.userId !== userId) {
      recipientUserIds.push(row.correspondent.userId)
    }

    await notifyServiceRequestEvent({
      type: 'SERVICE_REQUEST_MESSAGE',
      userIds: recipientUserIds,
      title: 'Nova mensagem no serviço',
      message: `${msg.author.name}: ${content.trim().slice(0, 120)}`,
      requestId: id,
    })

    return NextResponse.json({ message: msg })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 })
    }
    console.error('[messages POST]', e)
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
