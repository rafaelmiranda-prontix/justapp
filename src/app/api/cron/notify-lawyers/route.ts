import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification.service'
import { logger } from '@/lib/logger'

/**
 * GET /api/cron/notify-lawyers
 * Notifica advogados sobre novos casos alocados que ainda não foram notificados
 *
 * Este endpoint deve ser chamado por um cron job (Vercel Cron)
 * Recomendado: executar a cada 30 minutos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar authorization header (para segurança)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting lawyer notification job...')

    // Buscar matches PENDENTES que ainda não foram notificados
    // e que foram criados há pelo menos 5 minutos (para evitar notificações imediatas)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const pendingMatches = await prisma.matches.findMany({
      where: {
        status: 'PENDENTE',
        notificadoEm: null,
        enviadoEm: {
          lte: fiveMinutesAgo, // Criado há pelo menos 5 minutos
        },
      },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
        casos: {
          include: {
            cidadaos: {
              include: {
                users: true,
              },
            },
            especialidades: true,
          },
        },
      },
      take: 100, // Limitar a 100 por execução para não sobrecarregar
    })

    logger.info(`[Cron] Found ${pendingMatches.length} matches to notify`)

    let notifiedCount = 0
    let errorCount = 0

    // Notificar cada advogado
    for (const match of pendingMatches) {
      try {
        await NotificationService.notifyLawyerNewMatch(match.id)
        notifiedCount++
      } catch (error) {
        logger.error(`[Cron] Failed to notify match ${match.id}:`, error)
        errorCount++
      }
    }

    logger.info(
      `[Cron] Notification job completed: ${notifiedCount} notified, ${errorCount} errors`
    )

    return NextResponse.json({
      success: true,
      data: {
        totalFound: pendingMatches.length,
        notified: notifiedCount,
        errors: errorCount,
        executedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    logger.error('[Cron] Error in notify-lawyers job:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao notificar advogados',
      },
      { status: 500 }
    )
  }
}
