import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { NotificationService } from '@/lib/notification.service'
import { incrementLeadsReceived, canAdvogadoReceiveLead } from '@/lib/subscription-service'
import { ConfigService } from '@/lib/config-service'
import { logger } from '@/lib/logger'
import { inAppNotificationService } from '@/lib/in-app-notification.service'

// POST - Alocar caso (automático ou manual: body.advogadoIds = ids para alocação manual)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { casoId } = await params
    let advogadoIds: string[] | undefined
    try {
      const body = await req.json().catch(() => ({}))
      if (Array.isArray(body.advogadoIds) && body.advogadoIds.length > 0) {
        advogadoIds = body.advogadoIds.filter((id: unknown) => typeof id === 'string')
      }
    } catch {
      // body vazio ou inválido
    }

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        matches: {
          where: {
            status: {
              in: ['PENDENTE', 'ACEITO'],
            },
          },
        },
      },
    })

    if (!caso) {
      return NextResponse.json(
        { success: false, error: 'Caso não encontrado' },
        { status: 404 }
      )
    }

    if (caso.matches.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Caso já está alocado. Use dealocar primeiro para realocar.',
        },
        { status: 400 }
      )
    }

    if (caso.status !== 'ABERTO') {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas casos com status ABERTO podem ser alocados',
        },
        { status: 400 }
      )
    }

    // Alocação manual: criar matches apenas para os advogados informados
    if (advogadoIds && advogadoIds.length > 0) {
      const expirationHours = await ConfigService.get<number>('match_expiration_hours', 48)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expirationHours)

      const created: string[] = []
      const errors: string[] = []

      for (const advogadoId of advogadoIds) {
        const { canReceive, reason } = await canAdvogadoReceiveLead(advogadoId)
        if (!canReceive) {
          const adv = await prisma.advogados.findUnique({
            where: { id: advogadoId },
            include: { users: { select: { name: true } } },
          })
          errors.push(adv?.users?.name ?? advogadoId + ': ' + (reason ?? 'não pode receber'))
          continue
        }

        const existing = await prisma.matches.findUnique({
          where: {
            casoId_advogadoId: { casoId, advogadoId },
          },
        })
        if (existing) {
          errors.push(`Já existe match para este advogado`)
          continue
        }

        const match = await prisma.matches.create({
          data: {
            id: nanoid(),
            casoId,
            advogadoId,
            score: 100,
            status: 'PENDENTE',
            expiresAt,
          },
        })
        await incrementLeadsReceived(advogadoId)
        created.push(match.id)

        try {
          await NotificationService.notifyLawyerNewMatch(match.id)
        } catch (e) {
          logger.error('[Admin] Failed to notify match', e)
        }

        const adv = await prisma.advogados.findUnique({
          where: { id: advogadoId },
          select: { userId: true },
        })
        if (adv?.userId) {
          inAppNotificationService
            .notifyUser(adv.userId, {
              type: 'MATCH_CREATED',
              title: 'Novo caso disponível',
              message: `Um caso foi alocado para você manualmente.`,
              href: '/advogado/casos',
              metadata: { matchId: match.id, casoId },
              role: 'ADVOGADO',
            })
            .catch(() => {})
        }
      }

      return NextResponse.json({
        success: true,
        message:
          created.length > 0
            ? `${created.length} match(es) criado(s).${errors.length > 0 ? ' Avisos: ' + errors.join('; ') : ''}`
            : 'Nenhum match criado. ' + (errors.join('; ') || 'Advogados inválidos.'),
        data: {
          matchesCreated: created.length,
          advogadosNotificados: created.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
    }

    // Alocação automática
    const result = await CaseDistributionService.distributeCase(casoId)
    const matches = await prisma.matches.findMany({
      where: { casoId: caso.id, status: 'PENDENTE' },
    })
    for (const match of matches) {
      try {
        await NotificationService.notifyLawyerNewMatch(match.id)
      } catch (error) {
        logger.error(`[Admin] Failed to notify match ${match.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Caso alocado com sucesso. ${result.matchesCreated} match(es) criado(s).`,
      data: {
        matchesCreated: result.matchesCreated,
        advogadosNotificados: result.advogadosNotificados.length,
      },
    })
  } catch (error) {
    logger.error('Error allocating caso:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao alocar caso',
      },
      { status: 500 }
    )
  }
}
