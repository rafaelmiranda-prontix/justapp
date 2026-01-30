import { NextRequest, NextResponse } from 'next/server'
import { CaseDistributionService } from '@/lib/case-distribution.service'

/**
 * GET /api/cron/expire-matches
 * Expira matches pendentes que passaram do prazo
 *
 * Este endpoint deve ser chamado por um cron job externo (Vercel Cron, GitHub Actions, etc)
 * Recomendado: executar a cada 1 hora
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

    console.log('[Cron] Starting match expiration job...')

    const expiredCount = await CaseDistributionService.expireOldMatches()

    console.log(`[Cron] Match expiration completed: ${expiredCount} matches expired`)

    return NextResponse.json({
      success: true,
      data: {
        expiredMatches: expiredCount,
        executedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[Cron] Error expiring matches:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao expirar matches' },
      { status: 500 }
    )
  }
}
