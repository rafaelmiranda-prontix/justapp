import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireIntegrationAuth } from '@/lib/integration-auth'

const messageSchema = z.object({
  conversationId: z.string().min(1),
  senderType: z.enum(['BOT', 'USER', 'AGENT']),
  content: z.string().min(1).max(20000),
  externalMessageId: z.string().min(1).max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/suporte/messages
 * Registra mensagem na conversa. Idempotente por externalMessageId.
 */
export async function POST(req: Request) {
  const authError = await requireIntegrationAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const data = messageSchema.parse(body)

    if (data.externalMessageId) {
      const existing = await prisma.supportMessage.findUnique({
        where: { externalMessageId: data.externalMessageId },
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          deduped: true,
          message: existing,
        })
      }
    }

    const conversation = await prisma.supportConversation.findUnique({
      where: { id: data.conversationId },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    const message = await prisma.supportMessage.create({
      data: {
        conversationId: data.conversationId,
        senderType: data.senderType,
        content: data.content,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        externalMessageId: data.externalMessageId ?? null,
      },
    })

    await prisma.supportConversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: message.createdAt },
    })

    return NextResponse.json({
      success: true,
      deduped: false,
      message,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0]
      return NextResponse.json({ error: first?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[SUPORTE messages]', error)
    return NextResponse.json({ error: 'Erro ao registrar mensagem' }, { status: 500 })
  }
}
