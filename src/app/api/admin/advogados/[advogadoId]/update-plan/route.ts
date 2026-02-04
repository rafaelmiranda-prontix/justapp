import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'
import { updateAdvogadoPlan } from '@/lib/subscription-service'
import { z } from 'zod'

const updatePlanSchema = z.object({
  plano: z.enum(['FREE', 'BASIC', 'PREMIUM', 'UNLIMITED']),
  planoExpira: z.string().optional().nullable(), // ISO date string
  motivo: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { advogadoId } = await params
    const body = await req.json()
    const data = updatePlanSchema.parse(body)

    // Verificar se advogado existe
    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json(
        { success: false, error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    // Converter string de data para Date se fornecida
    const planoExpira = data.planoExpira
      ? new Date(data.planoExpira)
      : undefined

    // Atualizar plano usando o serviço
    await updateAdvogadoPlan(advogadoId, data.plano, planoExpira, {
      precoPago: 0, // Admin pode definir preço manualmente se necessário
    })

    logger.info(
      `[Admin] Plano atualizado para advogado ${advogadoId}: ${advogado.plano} → ${data.plano}`
    )

    return NextResponse.json({
      success: true,
      message: `Plano atualizado para ${data.plano} com sucesso`,
    })
  } catch (error) {
    logger.error('Error updating advogado plan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao atualizar plano',
      },
      { status: 500 }
    )
  }
}
