import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'

// POST - Dealocar caso (remover matches pendentes)
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
              in: ['PENDENTE', 'EXPIRADO'],
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

    // Verificar se há matches para dealocar
    if (caso.matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Caso não está alocado (não há matches pendentes)',
        },
        { status: 400 }
      )
    }

    // Decrementar contadores de leads dos advogados
    const advogadoIds = caso.matches.map((m) => m.advogadoId)
    const uniqueAdvogadoIds = [...new Set(advogadoIds)]

    for (const advogadoId of uniqueAdvogadoIds) {
      const matchesCount = caso.matches.filter((m) => m.advogadoId === advogadoId).length
      
      await prisma.advogados.update({
        where: { id: advogadoId },
        data: {
          leadsRecebidosMes: {
            decrement: matchesCount,
          },
          updatedAt: new Date(),
        },
      })
    }

    // Remover matches pendentes/expirados
    const deletedMatches = await prisma.matches.deleteMany({
      where: {
        casoId: caso.id,
        status: {
          in: ['PENDENTE', 'EXPIRADO'],
        },
      },
    })

    logger.info(
      `[Admin] Deallocated case ${casoId}: ${deletedMatches.count} matches deleted`
    )

    return NextResponse.json({
      success: true,
      message: `Caso dealocado com sucesso. ${deletedMatches.count} match(es) removido(s).`,
      data: {
        matchesDeleted: deletedMatches.count,
      },
    })
  } catch (error) {
    logger.error('Error deallocating caso:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao dealocar caso',
      },
      { status: 500 }
    )
  }
}
