import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/matches/[matchId]/reject
 * Advogado recusa um match
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
    const body = await request.json()
    const { motivo } = body // Motivo opcional da recusa

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
        { success: false, error: 'Você não tem permissão para recusar este match' },
        { status: 403 }
      )
    }

    // Verificar se já foi respondido
    if (match.status !== 'PENDENTE' && match.status !== 'VISUALIZADO') {
      return NextResponse.json(
        { success: false, error: `Match já foi ${match.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Recusar match
    const updatedMatch = await prisma.matches.update({
      where: { id: matchId },
      data: {
        status: 'RECUSADO',
        respondidoEm: new Date(),
      },
    })

    console.log(`[Match] Match ${matchId} rejected by lawyer ${match.advogados.id}`)
    if (motivo) {
      console.log(`[Match] Rejection reason: ${motivo}`)
    }

    // TODO: Se configurado, podemos criar novo match com outro advogado
    // para substituir este que foi recusado

    return NextResponse.json({
      success: true,
      data: {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        respondidoEm: updatedMatch.respondidoEm,
      },
    })
  } catch (error: any) {
    console.error('Error rejecting match:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao recusar match' },
      { status: 500 }
    )
  }
}
