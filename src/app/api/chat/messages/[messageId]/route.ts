import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { editMatchMessage } from '@/lib/chat-message-edit'
import { securityLog } from '@/lib/security-logger'

const patchBodySchema = z.object({
  content: z.string().min(1).max(2000),
})

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

/**
 * PATCH /api/chat/messages/[messageId]
 * Autor edita própria mensagem no chat match (regras em chat-message-edit).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { messageId } = await params
    const body = await req.json()
    const { content } = patchBodySchema.parse(body)

    const result = await editMatchMessage({
      messageId,
      userId: session.user.id,
      newContent: content,
    })

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      )
    }

    const actor = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (actor) {
      await securityLog({
        action: 'CHAT_MESSAGE_EDITED',
        actor: {
          id: actor.id,
          email: actor.email,
          name: actor.name,
          role: actor.role,
        },
        target: { type: 'CHAT_MESSAGE', id: messageId },
        changes: [
          {
            field: 'conteudo',
            from: truncate(result.previousContent, 120),
            to: truncate(content, 120),
          },
        ],
        metadata: {
          matchId: result.mensagem.matchId,
          editCount: result.mensagem.editCount,
        },
        timestamp: new Date(),
      }).catch(() => {})
    }

    try {
      await pusherServer.trigger(
        `match-${result.mensagem.matchId}`,
        'message-edited',
        result.mensagem
      )
    } catch (e) {
      console.error('[PATCH chat message] Pusher:', e)
    }

    return NextResponse.json({ success: true, data: result.mensagem })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: e.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }
    console.error('[PATCH chat/messages]', e)
    return NextResponse.json({ success: false, error: 'Erro ao editar mensagem' }, { status: 500 })
  }
}
