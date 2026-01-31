import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CaseDistributionService } from '@/lib/case-distribution.service'

/**
 * POST /api/advogado/redistribute-cases
 * Redistribui casos órfãos (sem matches) quando advogado faz login
 *
 * Regras:
 * - Advogado não pode ter mais de 2 matches PENDENTES
 * - Advogado deve ter cota de leads disponível
 * - Apenas casos ABERTOS sem nenhum match no mesmo estado
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar advogado
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Disparar redistribuição
    const result = await CaseDistributionService.redistributeCasesForLawyer(advogado.id)

    return NextResponse.json({
      success: true,
      data: {
        casosDistribuidos: result.casosDistribuidos,
        matchesCriados: result.matchesCriados,
      },
    })
  } catch (error) {
    console.error('[Redistribute API] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao redistribuir casos' },
      { status: 500 }
    )
  }
}
