import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'
import { detectSuspiciousActivity } from '@/lib/security-alerts'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const alerts = await detectSuspiciousActivity()

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    })
  } catch (error) {
    logger.error('Error fetching security alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar alertas de segurança' },
      { status: 500 }
    )
  }
}
