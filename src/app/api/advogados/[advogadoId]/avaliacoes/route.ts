import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { advogadoId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verifica se o advogado existe
    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Busca avaliações
    const [avaliacoes, total] = await Promise.all([
      prisma.avaliacoes.findMany({
        where: {
          advogadoId: advogadoId,
        },
        include: {
          cidadaos: {
            include: {
              users: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.avaliacoes.count({
        where: {
          advogadoId: advogadoId,
        },
      }),
    ])

    // Calcula estatísticas
    const todasAvaliacoes = await prisma.avaliacoes.findMany({
      where: {
        advogadoId: advogadoId,
      },
      select: {
        nota: true,
      },
    })

    const totalAvaliacoes = todasAvaliacoes.length
    const media =
      totalAvaliacoes > 0
        ? todasAvaliacoes.reduce((acc, av) => acc + av.nota, 0) / totalAvaliacoes
        : 0

    // Distribuição de estrelas
    const distribuicao = [1, 2, 3, 4, 5].map((nota) => ({
      nota,
      quantidade: todasAvaliacoes.filter((av) => av.nota === nota).length,
      percentual:
        totalAvaliacoes > 0
          ? (todasAvaliacoes.filter((av) => av.nota === nota).length / totalAvaliacoes) * 100
          : 0,
    }))

    return NextResponse.json({
      success: true,
      data: avaliacoes,
      stats: {
        media: Math.round(media * 10) / 10,
        total: totalAvaliacoes,
        distribuicao,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar avaliações do advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    )
  }
}
