import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChatService } from '@/lib/chat.service'

/**
 * GET /api/chat/[matchId]/messages
 * Lista mensagens de um match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { matchId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await ChatService.getMessages({
      matchId,
      userId: session.user.id,
      limit,
      offset,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('permissão') ? 403 : 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        mensagens: result.mensagens,
        total: result.total,
        limit,
        offset,
        hasMore: (result.total || 0) > offset + limit,
      },
    })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chat/[matchId]/messages
 * Envia mensagem em um match
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { matchId } = await params
    const body = await request.json()
    const { conteudo, anexoUrl } = body

    if (!conteudo) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo da mensagem é obrigatório' },
        { status: 400 }
      )
    }

    const result = await ChatService.sendMessage({
      matchId,
      remetenteId: session.user.id,
      conteudo,
      anexoUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('permissão') ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.mensagem,
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
