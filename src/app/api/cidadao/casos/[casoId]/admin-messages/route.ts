import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  attachmentUrls: z.array(z.string()).optional().default([]),
})

/**
 * GET /api/cidadao/casos/[casoId]/admin-messages
 * Lista mensagens do canal admin↔cidadão (apenas PUBLIC; notas internas não aparecem).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params

    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      select: { id: true, cidadaoId: true },
    })
    if (!caso || caso.cidadaoId !== cidadao.id) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    const messages = await prisma.case_messages.findMany({
      where: { casoId, visibility: 'PUBLIC' },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (e) {
    console.error('GET cidadao admin-messages error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar mensagens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cidadao/casos/[casoId]/admin-messages
 * Cidadão responde no canal admin↔cidadão (sempre PUBLIC).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params
    const body = await req.json()
    const { message, attachmentUrls } = sendMessageSchema.parse(body)

    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: {
          include: {
            users: { select: { name: true } },
          },
        },
      },
    })
    if (!caso || caso.cidadaoId !== cidadao.id) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    const created = await prisma.case_messages.create({
      data: {
        id: randomUUID(),
        casoId,
        senderRole: 'CIDADAO',
        senderId: session.user.id,
        message,
        attachmentUrls: attachmentUrls ?? [],
        visibility: 'PUBLIC',
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Notificação in-app para o(s) admin(s) quando o cidadão envia mensagem na mediação
    const { inAppNotificationService } = await import('@/lib/in-app-notification.service')
    const citizenName = caso.cidadaos?.users?.name ?? 'Cidadão'
    const msgPreview = message.slice(0, 80) + (message.length > 80 ? '…' : '')
    const href = `/admin/casos?open=${casoId}`

    if (caso.mediatedByAdminId) {
      // Notifica o admin que está com a mediação
      await inAppNotificationService.notifyUser(caso.mediatedByAdminId, {
        type: 'CHAT_NEW_MESSAGE',
        title: 'Nova mensagem do cidadão',
        message: `${citizenName}: ${msgPreview}`,
        href,
        metadata: { caseId: casoId },
        role: 'ADMIN',
      })
    } else {
      // Caso ainda sem mediação assumida: notifica todos os admins
      const admins = await prisma.users.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      })
      if (admins.length > 0) {
        await inAppNotificationService.notifyMany(
          admins.map((a) => a.id),
          {
            type: 'ADMIN_ACTION_REQUIRED',
            title: 'Mensagem do cidadão no caso',
            message: `${citizenName}: ${msgPreview}`,
            href,
            metadata: { caseId: casoId },
            role: 'ADMIN',
          }
        )
      }
    }

    return NextResponse.json({ success: true, data: created })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: e.errors },
        { status: 400 }
      )
    }
    console.error('POST cidadao admin-message error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
