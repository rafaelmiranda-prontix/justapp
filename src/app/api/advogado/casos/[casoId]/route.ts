import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/advogado/casos/[casoId]
 * Busca detalhes de um caso específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params

    // Buscar advogado
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Buscar caso
    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: {
              select: {
                name: true,
                // Email e outros dados sensíveis não são compartilhados com o advogado
              },
            },
          },
        },
        matches: {
          where: {
            advogadoId: advogado.id,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Verificar se o advogado tem acesso a este caso
    // (deve ter um match com este caso)
    if (caso.matches.length === 0) {
      return NextResponse.json(
        { error: 'Você não tem acesso a este caso' },
        { status: 403 }
      )
    }

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
        cidadaos: {
          id: caso.cidadaos.id,
          cidade: caso.cidadaos.cidade,
          estado: caso.cidadaos.estado,
          users: {
            name: caso.cidadaos.users.name,
            // Email e outros dados sensíveis não são compartilhados com o advogado
          },
        },
      },
    })
  } catch (error) {
    console.error('[Advogado] Error fetching case details:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do caso' },
      { status: 500 }
    )
  }
}
