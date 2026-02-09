import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/notifications/:id/read
 * Marca uma notificação como lida (se ainda não estiver).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    if (notification.readAt) {
      return NextResponse.json({ ok: true })
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH notification read error:', e)
    return NextResponse.json(
      { error: 'Erro ao marcar como lida' },
      { status: 500 }
    )
  }
}
