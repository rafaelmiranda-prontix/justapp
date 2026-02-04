import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { NotificationService } from '@/lib/notification.service'
import { logger } from '@/lib/logger'

// POST - Alocar caso (distribuir para advogados)
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

    // Verificar se o caso existe
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

    // Verificar se o caso já está alocado (tem matches ativos)
    if (caso.matches.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Caso já está alocado. Use dealocar primeiro para realocar.',
        },
        { status: 400 }
      )
    }

    // Verificar se o caso está no status correto
    if (caso.status !== 'ABERTO') {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas casos com status ABERTO podem ser alocados',
        },
        { status: 400 }
      )
    }

    // Distribuir o caso
    const result = await CaseDistributionService.distributeCase(casoId)

    // Notificar advogados sobre os novos matches
    const matches = await prisma.matches.findMany({
      where: {
        casoId: caso.id,
        status: 'PENDENTE',
      },
    })

    for (const match of matches) {
      try {
        await NotificationService.notifyLawyerNewMatch(match.id)
      } catch (error) {
        logger.error(`[Admin] Failed to notify match ${match.id}:`, error)
        // Não falha a alocação se a notificação falhar
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
