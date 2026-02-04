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
      where.aprovado = false
    } else if (status === 'aprovados') {
      where.aprovado = true
    }

    const [advogados, total] = await Promise.all([
      prisma.advogados.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
          advogado_especialidades: {
            include: {
              especialidades: {
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

    // Calcula média de avaliações para cada advogado e transforma especialidades
    const advogadosComMedia = advogados.map((advogado) => {
      const totalAvaliacoes = advogado.avaliacoes?.length || 0
      const media =
        totalAvaliacoes > 0
          ? advogado.avaliacoes.reduce((acc, av) => acc + av.nota, 0) /
            totalAvaliacoes
          : 0

      // Transforma advogado_especialidades em especialidades no formato esperado
      const especialidades = (advogado.advogado_especialidades || []).map((ae) => ({
        especialidade: {
          nome: ae.especialidades.nome,
        },
      }))

      return {
        ...advogado,
        especialidades, // Adiciona especialidades no formato esperado
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
