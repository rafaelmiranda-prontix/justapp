import { NextRequest, NextResponse } from 'next/server'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { logger } from '@/lib/logger'

/**
 * GET /api/cron/reset-lead-counters
 * Reseta contadores mensais de leads dos advogados
 *
 * Este endpoint deve ser chamado por um cron job externo
 * Recomendado: executar no dia 1 de cada mês às 00:00
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

    logger.info('[Cron] Starting monthly lead counter reset...')

    const resetCount = await CaseDistributionService.resetMonthlyLeadCounters()

    logger.info(`[Cron] Lead counter reset completed: ${resetCount} lawyers reset`)

    return NextResponse.json({
      success: true,
      data: {
        lawyersReset: resetCount,
        executedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[Cron] Error resetting lead counters:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao resetar contadores' },
      { status: 500 }
    )
  }
}
