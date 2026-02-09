import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  attachmentUrls: z.array(z.string().min(1)).optional().default([]),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).optional().default('PUBLIC'),
})

/**
 * GET /api/admin/casos/[casoId]/messages
 * Lista mensagens do canal admin↔cidadão (e notas internas para o admin).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { casoId } = await params

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      select: { id: true },
    })
    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    const messages = await prisma.case_messages.findMany({
      where: { casoId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (e) {
    console.error('GET admin caso messages error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar mensagens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/casos/[casoId]/messages
 * Admin envia mensagem (pública) ou nota interna.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error, session } = await requireAdmin()
    if (error || !session?.user) {
      return error ?? NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params
    const body = await req.json()
    const { message, attachmentUrls, visibility } = sendMessageSchema.parse(body)

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: { select: { userId: true } },
      },
    })
    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    const created = await prisma.case_messages.create({
      data: {
        id: randomUUID(),
        casoId,
        senderRole: 'ADMIN',
        senderId: session.user.id,
        message,
        attachmentUrls: attachmentUrls ?? [],
        visibility: visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Notificação in-app para o cidadão quando mensagem é pública
    if (created.visibility === 'PUBLIC' && caso.cidadaos?.userId) {
      const { inAppNotificationService } = await import('@/lib/in-app-notification.service')
      const msgPreview = message.slice(0, 80) + (message.length > 80 ? '…' : '')
      inAppNotificationService
        .notifyUser(caso.cidadaos.userId, {
          type: 'CHAT_NEW_MESSAGE',
          title: 'Nova mensagem da equipe',
          message: msgPreview,
          href: `/cidadao/casos/${casoId}`,
          metadata: { caseId: casoId },
          role: 'CIDADAO',
        })
        .catch(() => {})
    }

    return NextResponse.json({ success: true, data: created })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: e.errors },
        { status: 400 }
      )
    }
    console.error('POST admin caso message error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
