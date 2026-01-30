import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification.service'

/**
 * POST /api/matches/[matchId]/accept
 * Advogado aceita um match
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADVOGADO') {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { matchId } = params

    // Buscar match
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: {
            user: true,
          },
        },
        casos: true,
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
        { success: false, error: 'Você não tem permissão para aceitar este match' },
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

    // Verificar se expirou
    if (match.expiresAt && new Date() > match.expiresAt) {
      // Atualizar para EXPIRADO
      await prisma.matches.update({
        where: { id: matchId },
        data: { status: 'EXPIRADO' },
      })

      return NextResponse.json(
        { success: false, error: 'Este match expirou' },
        { status: 400 }
      )
    }

    // Aceitar match
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Atualizar match para ACEITO
      const updated = await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'ACEITO',
          respondidoEm: new Date(),
        },
      })

      // Atualizar caso para EM_ANDAMENTO (se for o primeiro aceite)
      const caso = await tx.caso.findUnique({
        where: { id: match.casoId },
        include: {
          matches: {
            where: { status: 'ACEITO' },
          },
        },
      })

      if (caso && caso.status === 'ABERTO' && caso.matches.length === 0) {
        await tx.caso.update({
          where: { id: match.casoId },
          data: { status: 'EM_ANDAMENTO' },
        })
      }

      return updated
    })

    console.log(`[Match] Match ${matchId} accepted by lawyer ${match.advogados.id}`)

    // Notificar cidadão (em background)
    NotificationService.notifyCitizenMatchAccepted(matchId).catch((err) =>
      console.error('[Match] Notification failed:', err)
    )

    return NextResponse.json({
      success: true,
      data: {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        respondidoEm: updatedMatch.respondidoEm,
      },
    })
  } catch (error: any) {
    console.error('Error accepting match:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao aceitar match' },
      { status: 500 }
    )
  }
}
