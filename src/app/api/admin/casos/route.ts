import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limitRaw = parseInt(searchParams.get('limit') || '20', 10) || 20
    const limit = Math.min(100, Math.max(1, limitRaw))
    const search = searchParams.get('search')
    const status = searchParams.get('status') // 'all', 'ABERTO', 'EM_ANDAMENTO', 'FECHADO', 'CANCELADO'
    const especialidadeId = searchParams.get('especialidadeId')
    const cidadaoId = searchParams.get('cidadaoId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (especialidadeId) {
      where.especialidadeId = especialidadeId
    }

    if (cidadaoId) {
      where.cidadaoId = cidadaoId
    }

    if (search) {
      where.OR = [
        { descricao: { contains: search, mode: 'insensitive' } },
        {
          cidadaos: {
            users: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          cidadaos: {
            users: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ]
    }

    const [casos, total, statusGroups] = await Promise.all([
      prisma.casos.findMany({
        where,
        include: {
          especialidades: {
            select: {
              id: true,
              nome: true,
            },
          },
          cidadaos: {
            select: {
              id: true,
              cidade: true,
              estado: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          matches: {
            include: {
              advogados: {
                include: {
                  users: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              mensagens: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              enviadoEm: 'desc',
            },
          },
          _count: {
            select: {
              case_messages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.casos.count({ where }),
      prisma.casos.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])

    const statusBreakdown: Record<string, number> = {
      PENDENTE_ATIVACAO: 0,
      ABERTO: 0,
      EM_MEDIACAO: 0,
      EM_ANDAMENTO: 0,
      FECHADO: 0,
      CANCELADO: 0,
    }
    for (const row of statusGroups) {
      statusBreakdown[row.status] = row._count._all
    }

    return NextResponse.json({
      success: true,
      data: casos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      statusBreakdown,
    })
  } catch (error) {
    console.error('Error fetching casos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar casos' },
      { status: 500 }
    )
  }
}
