import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { logger } from '@/lib/logger'

const updateMatchSchema = z.object({
  status: z.enum(['ACEITO', 'RECUSADO']),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { matchId } = await params
    const body = await req.json()
    const { status } = updateMatchSchema.parse(body)

    // Busca o match
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
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    // Verifica se o advogado é o dono do match
    if (match.advogados.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Atualiza o match
    const updatedMatch = await prisma.matches.update({
      where: { id: matchId },
      data: {
        status,
        respondidoEm: status === 'ACEITO' || status === 'RECUSADO' ? new Date() : match.respondidoEm,
      },
    })

    // Se aceito, atualiza o status do caso
    if (status === 'ACEITO') {
      await prisma.casos.update({
        where: { id: match.casos.id },
        data: { status: 'EM_ANDAMENTO' },
      })
    }

    // Se recusado, tentar redistribuir o caso
    if (status === 'RECUSADO' && match.casos.status === 'ABERTO') {
      try {
        const redistributionResult = await CaseDistributionService.redistributeCaseAfterRejection(
          match.casos.id,
          match.advogados.id
        )

        if (redistributionResult.redistributed) {
          logger.info(
            `[Match] Case ${match.casos.id} redistributed after rejection via PATCH. Created ${redistributionResult.matchesCreated} new matches.`
          )
        } else {
          logger.debug(
            `[Match] Case ${match.casos.id} not redistributed via PATCH: ${redistributionResult.reason}`
          )
        }
      } catch (error: any) {
        logger.error(`[Match] Error redistributing case after rejection via PATCH:`, error)
        // Não falha a request, apenas loga o erro
      }
    }

    // TODO: Enviar notificação para o cidadão

    return NextResponse.json({
      success: true,
      data: updatedMatch,
    })
  } catch (error) {
    console.error('Error updating match:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar match' }, { status: 500 })
  }
}
