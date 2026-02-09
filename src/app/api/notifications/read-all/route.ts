import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/notifications/read-all
 * Marca todas as notificações não lidas do usuário como lidas.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    return NextResponse.json({ updated: result.count })
  } catch (e) {
    console.error('POST notifications read-all error:', e)
    return NextResponse.json(
      { error: 'Erro ao marcar notificações como lidas' },
      { status: 500 }
    )
  }
}
