import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cidadao/casos/[casoId]
 * Busca detalhes de um caso específico do cidadão
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params

    // Buscar cidadão
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Buscar caso (matches ativos para resumo do chat com advogados)
    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        matches: {
          where: { status: { in: ['ACEITO', 'CONTRATADO'] } },
          select: {
            id: true,
            status: true,
            advogados: {
              select: {
                users: { select: { name: true } },
              },
            },
            _count: { select: { mensagens: true } },
          },
        },
      },
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Verificar se o caso pertence ao cidadão
    if (caso.cidadaoId !== cidadao.id) {
      return NextResponse.json(
        { error: 'Você não tem acesso a este caso' },
        { status: 403 }
      )
    }

    const lawyerChats = caso.matches.map((m) => ({
      matchId: m.id,
      advogadoNome: m.advogados.users.name,
      status: m.status,
      messageCount: m._count.mensagens,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: caso.id,
        descricao: caso.descricao,
        descricaoIA: caso.descricaoIA,
        conversaHistorico: caso.conversaHistorico,
        urgencia: caso.urgencia,
        status: caso.status,
        createdAt: caso.createdAt.toISOString(),
        especialidades: caso.especialidades,
        cidadaos: caso.cidadaos,
        lawyerChats,
      },
    })
  } catch (error) {
    console.error('[Cidadao] Error fetching case details:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do caso' },
      { status: 500 }
    )
  }
}
