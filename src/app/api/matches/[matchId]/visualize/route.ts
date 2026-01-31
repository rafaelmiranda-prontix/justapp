import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/matches/[matchId]/visualize
 * Marca match como visualizado quando advogado abre os detalhes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADVOGADO') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { matchId } = await params

    // Buscar match
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o advogado logado é o dono do match
    if (match.advogados.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para visualizar este match' },
        { status: 403 }
      )
    }

    // Se já foi visualizado ou respondido, não atualizar
    if (match.status !== 'PENDENTE') {
      return NextResponse.json({
        success: true,
        data: {
          matchId: match.id,
          status: match.status,
          visualizadoEm: match.visualizadoEm,
        },
      })
    }

    // Atualizar para VISUALIZADO
    const updatedMatch = await prisma.matches.update({
      where: { id: matchId },
      data: {
        status: 'VISUALIZADO',
        visualizadoEm: new Date(),
      },
    })

    console.log(`[Match] Match ${matchId} visualized by lawyer ${match.advogados.id}`)

    return NextResponse.json({
      success: true,
      data: {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        visualizadoEm: updatedMatch.visualizadoEm,
      },
    })
  } catch (error: any) {
    console.error('Error marking match as visualized:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao marcar match como visualizado' },
      { status: 500 }
    )
  }
}
