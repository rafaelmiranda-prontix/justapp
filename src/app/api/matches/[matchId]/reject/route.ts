import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { CaseDistributionService } from '@/lib/case-distribution.service'

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
    
    // Parse body opcional (pode estar vazio)
    let motivo: string | undefined
    try {
      const text = await request.text()
      if (text) {
        const body = JSON.parse(text)
        motivo = body.motivo
      }
    } catch (error) {
      // Body vazio ou inválido - não é problema, motivo é opcional
      motivo = undefined
    }

    // Buscar match
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
        casos: {
          select: {
            id: true,
            status: true,
            redistribuicoes: true,
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

    logger.info(`[Match] Match ${matchId} rejected by lawyer ${match.advogados.id}`)
    if (motivo) {
      logger.info(`[Match] Rejection reason: ${motivo}`)
    }

    // Notificação in-app para o cidadão
    const matchWithCidadao = await prisma.matches.findUnique({
      where: { id: matchId },
      include: { casos: { include: { cidadaos: { select: { userId: true } } } } },
    })
    const citizenUserId = matchWithCidadao?.casos?.cidadaos?.userId
    if (citizenUserId) {
      const { inAppNotificationService } = await import('@/lib/in-app-notification.service')
      inAppNotificationService
        .notifyUser(citizenUserId, {
          type: 'MATCH_REJECTED',
          title: 'Advogado não pôde atender',
          message: 'Um advogado recusou o caso. Seu caso pode ser redistribuído a outros.',
          href: `/cidadao/casos/${matchWithCidadao!.casos.id}`,
          metadata: { matchId, caseId: matchWithCidadao!.casos.id },
          role: 'CIDADAO',
        })
        .catch(() => {})
    }

    // Tentar redistribuir o caso se ainda estiver aberto
    let redistributionResult = null
    if (match.casos && match.casos.status === 'ABERTO') {
      try {
        logger.info(
          `[Match] Attempting to redistribute case ${match.casos.id} after rejection by lawyer ${match.advogados.id}`
        )
        redistributionResult = await CaseDistributionService.redistributeCaseAfterRejection(
          match.casos.id,
          match.advogados.id
        )

        if (redistributionResult.redistributed) {
          logger.info(
            `[Match] ✅ Case ${match.casos.id} redistributed successfully. Created ${redistributionResult.matchesCreated} new matches.`
          )
        } else {
          logger.warn(
            `[Match] ⚠️ Case ${match.casos.id} not redistributed: ${redistributionResult.reason || 'Unknown reason'}`
          )
        }
      } catch (error: any) {
        logger.error(`[Match] ❌ Error redistributing case after rejection:`, error)
        // Não falha a request, apenas loga o erro
      }
    } else {
      logger.debug(
        `[Match] Case ${match.casos?.id} not redistributed: status is ${match.casos?.status || 'unknown'} (must be ABERTO)`
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        respondidoEm: updatedMatch.respondidoEm,
        redistributed: redistributionResult?.redistributed || false,
        newMatchesCreated: redistributionResult?.matchesCreated || 0,
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
