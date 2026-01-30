import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'all', 'pendentes', 'aprovados'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (status === 'pendentes') {
      where.oabVerificado = false
    } else if (status === 'aprovados') {
      where.oabVerificado = true
    }

    const [advogados, total] = await Promise.all([
      prisma.advogados.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
          especialidades: {
            include: {
              especialidade: {
                select: {
                  nome: true,
                },
              },
            },
          },
          avaliacoes: {
            select: {
              nota: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.advogados.count({ where }),
    ])

    // Calcula média de avaliações para cada advogado
    const advogadosComMedia = advogados.map((advogado) => {
      const totalAvaliacoes = advogado.avaliacoes.length
      const media =
        totalAvaliacoes > 0
          ? advogado.avaliacoes.reduce((acc, av) => acc + av.nota, 0) /
            totalAvaliacoes
          : 0

      return {
        ...advogado,
        avaliacaoMedia: Math.round(media * 10) / 10,
        totalAvaliacoes,
      }
    })

    return NextResponse.json({
      success: true,
      data: advogadosComMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching advogados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar advogados' },
      { status: 500 }
    )
  }
}
