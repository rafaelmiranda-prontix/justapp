import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'

/**
 * POST - Limpar matches expirados do caso.
 * Remove apenas matches com status EXPIRADO (já foram decrementados no cron).
 * Permite ao admin realocar o caso (inclusive para os mesmos advogados).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { casoId } = await params

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      select: { id: true },
    })
    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    const result = await prisma.matches.deleteMany({
      where: {
        casoId,
        status: 'EXPIRADO',
      },
    })

    if (result.count > 0) {
      logger.info(`[Admin] Cleared ${result.count} expired matches for case ${casoId}`)
    }

    return NextResponse.json({
      success: true,
      message:
        result.count > 0
          ? `${result.count} match(es) expirado(s) removido(s). Você pode alocar o caso novamente.`
          : 'Nenhum match expirado para remover.',
      data: { deleted: result.count },
    })
  } catch (err) {
    logger.error('Error clearing expired matches:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao limpar matches expirados' },
      { status: 500 }
    )
  }
}
