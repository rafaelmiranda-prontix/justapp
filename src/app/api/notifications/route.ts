import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TAKE_DEFAULT = 20
const TAKE_MAX = 50

/**
 * GET /api/notifications?status=all|unread&type=...&take=20&cursor=<id>
 * Lista notificações do usuário com paginação por cursor.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || undefined
    const take = Math.min(
      parseInt(searchParams.get('take') || String(TAKE_DEFAULT), 10) || TAKE_DEFAULT,
      TAKE_MAX
    )
    const cursor = searchParams.get('cursor') || undefined

    const where: { userId: string; readAt?: null; type?: string } = {
      userId: session.user.id,
    }
    if (status === 'unread') {
      where.readAt = null
    }
    if (type) {
      where.type = type
    }

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = items.length > take
    const list = hasMore ? items.slice(0, take) : items
    const nextCursor = hasMore && list.length > 0 ? list[list.length - 1].id : null

    return NextResponse.json({
      items: list,
      nextCursor,
    })
  } catch (e) {
    console.error('GET notifications error:', e)
    return NextResponse.json(
      { error: 'Erro ao listar notificações' },
      { status: 500 }
    )
  }
}
