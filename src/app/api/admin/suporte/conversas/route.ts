import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma, SupportChannel, SupportConversationStatus } from '@prisma/client'

/**
 * GET /api/admin/suporte/conversas
 * Lista conversas de suporte (admin).
 *
 * Query: page, limit, status, channel, hasUser (true|false), q (busca em contato)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const statusParam = searchParams.get('status')
    const channelParam = searchParams.get('channel')
    const hasUser = searchParams.get('hasUser')
    const q = searchParams.get('q')?.trim()

    const where: Prisma.SupportConversationWhereInput = {}

    if (
      statusParam &&
      ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].includes(statusParam)
    ) {
      where.status = statusParam as SupportConversationStatus
    }
    if (channelParam && ['WHATSAPP', 'OTHER'].includes(channelParam)) {
      where.channel = channelParam as SupportChannel
    }
    if (hasUser === 'true') {
      where.userId = { not: null }
    } else if (hasUser === 'false') {
      where.userId = null
    }

    if (q) {
      const digits = q.replace(/\D/g, '')
      const or: Prisma.SupportConversationWhereInput[] = [
        { contact: { email: { contains: q, mode: 'insensitive' } } },
        { contact: { name: { contains: q, mode: 'insensitive' } } },
        { contact: { crm: { contains: q, mode: 'insensitive' } } },
      ]
      if (digits.length > 0) {
        or.push({ contact: { phone: { contains: digits } } })
      }
      where.OR = or
    }

    const [total, rows] = await Promise.all([
      prisma.supportConversation.count({ where }),
      prisma.supportConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        include: {
          contact: true,
          user: {
            select: { id: true, name: true, email: true, role: true, phone: true },
          },
          _count: { select: { messages: true } },
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('[ADMIN suporte conversas]', error)
    return NextResponse.json({ error: 'Erro ao listar conversas' }, { status: 500 })
  }
}
