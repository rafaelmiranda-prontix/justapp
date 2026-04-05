import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessServiceRequest, getServiceRequestWithParties } from '@/lib/service-requests/access'
import { z } from 'zod'
import { assertAudienciasDiligenciasEnabled } from '@/lib/service-requests/feature-guard'

const bodySchema = z.object({
  lastReadMessageId: z.string().cuid().optional(),
})

/**
 * POST — registra leitura do chat (participantes).
 */
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

    const body = bodySchema.parse(await req.json().catch(() => ({})))

    await prisma.serviceRequestParticipantRead.upsert({
      where: {
        requestId_userId: { requestId: id, userId },
      },
      create: {
        requestId: id,
        userId,
        lastReadMessageId: body.lastReadMessageId ?? null,
      },
      update: {
        lastReadMessageId: body.lastReadMessageId ?? undefined,
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 })
    }
    console.error('[service-requests read POST]', e)
    return NextResponse.json({ error: 'Erro ao registrar leitura' }, { status: 500 })
  }
}
