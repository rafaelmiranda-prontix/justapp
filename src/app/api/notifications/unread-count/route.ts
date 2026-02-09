import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications/unread-count
 * Retorna a contagem de notificações não lidas do usuário.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (e) {
    console.error('GET notifications unread-count error:', e)
    return NextResponse.json(
      { error: 'Erro ao buscar contagem' },
      { status: 500 }
    )
  }
}
