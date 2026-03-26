import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/suporte/conversas/[conversationId]/messages
 * Mensagens da conversa (ordenado por data asc).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const conversation = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        user: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    const [total, messages] = await Promise.all([
      prisma.supportMessage.count({ where: { conversationId } }),
      prisma.supportMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      success: true,
      conversation,
      data: messages,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('[ADMIN suporte messages]', error)
    return NextResponse.json({ error: 'Erro ao carregar mensagens' }, { status: 500 })
  }
}
