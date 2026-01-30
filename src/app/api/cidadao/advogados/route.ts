import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/cidadao/advogados
 * Retorna advogados com quem o cidadão interagiu (matches aceitos)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca o cidadão
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Busca matches aceitos do cidadão
    const matches = await prisma.matches.findMany({
      where: {
        casos: {
          cidadaoId: cidadao.id,
        },
        status: {
          in: ['ACEITO', 'CONTRATADO'],
        },
      },
      include: {
        advogados: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
        },
        casos: {
          select: {
            id: true,
            descricao: true,
            especialidades: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        enviadoEm: 'desc',
      },
    })

    // Remove duplicatas e formata dados
    const advogadosMap = new Map()
    
    matches.forEach((match) => {
      const advogado = match.advogados
      if (!advogadosMap.has(advogado.id)) {
        // Calcula média de avaliações
        const totalAvaliacoes = advogado.avaliacoes.length
        const avaliacaoMedia =
          totalAvaliacoes > 0
            ? advogado.avaliacoes.reduce((acc, av) => acc + av.nota, 0) / totalAvaliacoes
            : 0

        advogadosMap.set(advogado.id, {
          id: advogado.id,
          nome: advogado.users.name,
          foto: advogado.fotoUrl,
          bio: advogado.bio,
          cidade: advogado.cidade,
          estado: advogado.estado,
          especialidades: advogado.advogado_especialidades.map(
            (ae) => ae.especialidades.nome
          ),
          precoConsulta: advogado.precoConsulta,
          aceitaOnline: advogado.aceitaOnline,
          avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
          totalAvaliacoes,
          matchId: match.id,
          casoId: match.casos.id,
          distanciaKm: match.distanciaKm,
          score: match.score,
        })
      }
    })

    const advogados = Array.from(advogadosMap.values())

    return NextResponse.json({
      success: true,
      data: advogados,
    })
  } catch (error) {
    console.error('Error fetching advogados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar advogados' },
      { status: 500 }
    )
  }
}
