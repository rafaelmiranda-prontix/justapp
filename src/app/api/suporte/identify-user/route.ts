import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireIntegrationAuth } from '@/lib/integration-auth'
import { collectIdentifiedUserIds, ensureSupportConversationForUser } from '@/lib/support/identify-user'

const identifySchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    crm: z.string().min(2).optional(),
    whatsappWaId: z.string().min(1).max(64).optional(),
  })
  .refine((d) => Boolean(d.email || d.phone || d.crm), {
    message: 'Informe ao menos um: email, phone ou crm',
  })

/**
 * POST /api/suporte/identify-user
 * Identifica usuário existente por email, telefone ou CRM (OAB). Não cria usuário.
 */
export async function POST(req: Request) {
  const authError = await requireIntegrationAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const data = identifySchema.parse(body)

    const userIds = await collectIdentifiedUserIds({
      email: data.email,
      phone: data.phone,
      crm: data.crm,
    })

    if (userIds.length === 0) {
      return NextResponse.json({
        found: false,
        code: 'USER_NOT_FOUND',
      })
    }

    if (userIds.length > 1) {
      return NextResponse.json(
        {
          error: 'Identificadores apontam para mais de um usuário',
          code: 'IDENTITY_CONFLICT',
          userIds,
        },
        { status: 409 }
      )
    }

    const userId = userIds[0]!
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        phone: true,
        status: true,
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({
        found: false,
        code: 'USER_NOT_FOUND',
        reason: user ? 'USER_NOT_ACTIVE' : undefined,
      })
    }

    try {
      const { contactId, conversationId } = await ensureSupportConversationForUser(userId, {
        email: data.email,
        phone: data.phone,
        crm: data.crm,
        whatsappWaId: data.whatsappWaId,
      })

      return NextResponse.json({
        found: true,
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        phone: user.phone,
        contactId,
        conversationId,
      })
    } catch (e) {
      if (e instanceof Error && e.message === 'WA_CONVERSATION_CONFLICT') {
        return NextResponse.json(
          {
            error: 'Conversa WhatsApp já vinculada a outro usuário',
            code: 'WA_CONVERSATION_CONFLICT',
          },
          { status: 409 }
        )
      }
      throw e
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0]
      return NextResponse.json({ error: first?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[SUPORTE identify-user]', error)
    return NextResponse.json({ error: 'Erro ao identificar usuário' }, { status: 500 })
  }
}
