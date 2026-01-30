import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const createAvaliacaoSchema = z.object({
  advogadoId: z.string(),
  matchId: z.string().optional(), // Opcional, mas recomendado para validação
  nota: z.number().min(1).max(5),
  comentario: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const data = createAvaliacaoSchema.parse(body)

    // Busca o cidadão
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Verifica se o advogado existe
    const advogado = await prisma.advogados.findUnique({
      where: { id: data.advogadoId },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Validação: verifica se já existe avaliação deste cidadão para este advogado
    const existingAvaliacao = await prisma.avaliacoes.findUnique({
      where: {
        cidadaoId_advogadoId: {
          cidadaoId: cidadao.id,
          advogadoId: data.advogadoId,
        },
      },
    })

    if (existingAvaliacao) {
      return NextResponse.json(
        { error: 'Você já avaliou este advogado' },
        { status: 400 }
      )
    }

    // Validação opcional: verifica se existe match aceito entre eles
    if (data.matchId) {
      const match = await prisma.matches.findFirst({
        where: {
          id: data.matchId,
          caso: {
            cidadaoId: cidadao.id,
          },
          advogadoId: data.advogadoId,
          status: 'ACEITO',
        },
      })

      if (!match) {
        return NextResponse.json(
          { error: 'Match não encontrado ou não aceito' },
          { status: 400 }
        )
      }
    }

    // Cria a avaliação
    const avaliacao = await prisma.avaliacoes.create({
      data: {
        cidadaoId: cidadao.id,
        advogadoId: data.advogadoId,
        nota: data.nota,
        comentario: data.comentario || null,
      },
      include: {
        cidadao: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: avaliacao,
    })
  } catch (error) {
    console.error('Erro ao criar avaliação:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const advogadoId = searchParams.get('advogadoId')
    const cidadaoId = searchParams.get('cidadaoId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (advogadoId) {
      where.advogadoId = advogadoId
    }

    if (cidadaoId) {
      where.cidadaoId = cidadaoId
    }

    const [avaliacoes, total] = await Promise.all([
      prisma.avaliacoes.findMany({
        where,
        include: {
          cidadao: {
            include: {
              user: {
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
      prisma.avaliacoes.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: avaliacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }
}
