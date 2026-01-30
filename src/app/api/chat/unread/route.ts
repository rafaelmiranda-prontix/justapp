import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChatService } from '@/lib/chat.service'

/**
 * GET /api/chat/unread
 * Retorna contagem de mensagens não lidas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const unreadCount = await ChatService.getUnreadCount(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
      },
    })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mensagens não lidas' },
      { status: 500 }
    )
  }
}
