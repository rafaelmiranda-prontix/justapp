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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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

    const [casos, total] = await Promise.all([
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
            include: {
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
                  createdAt: true,
                },
              },
            },
            orderBy: {
              enviadoEm: 'desc',
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
    ])

    return NextResponse.json({
      success: true,
      data: casos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching casos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar casos' },
      { status: 500 }
    )
  }
}
