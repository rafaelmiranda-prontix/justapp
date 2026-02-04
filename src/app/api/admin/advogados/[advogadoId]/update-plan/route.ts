import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'
import { updateAdvogadoPlan } from '@/lib/subscription-service'
import { securityLog, getClientIp, getUserAgent } from '@/lib/security-logger'
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
    const { error, session } = await requireAdmin()

    if (error || !session?.user) {
      return error || NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
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
            id: true,
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

    // Guardar plano anterior para log
    const planoAnterior = advogado.plano

    // Converter string de data para Date se fornecida
    const planoExpira = data.planoExpira
      ? new Date(data.planoExpira)
      : undefined

    // Atualizar plano usando o serviço
    await updateAdvogadoPlan(advogadoId, data.plano, planoExpira, {
      precoPago: 0, // Admin pode definir preço manualmente se necessário
    })

    // Log de segurança - sempre registra, mesmo em produção
    await securityLog({
      action: 'PLANO_ADVOGADO_ALTERADO',
      actor: {
        id: session.user.id,
        email: session.user.email || '[REDACTED]',
        name: session.user.name || '[REDACTED]',
        role: session.user.role || 'ADMIN',
      },
      target: {
        type: 'ADVOGADO',
        id: advogadoId,
        identifier: advogado.oab,
      },
      changes: [
        {
          field: 'plano',
          from: planoAnterior,
          to: data.plano,
        },
        ...(planoExpira
          ? [
              {
                field: 'planoExpira',
                from: advogado.planoExpira?.toISOString() || null,
                to: planoExpira.toISOString(),
              },
            ]
          : []),
      ],
      metadata: {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        motivo: data.motivo || 'Alteração administrativa',
        advogadoEmail: advogado.users.email,
        advogadoName: advogado.users.name,
      },
      timestamp: new Date(),
    })

    logger.info(
      `[Admin] Plano atualizado para advogado ${advogadoId}: ${planoAnterior} → ${data.plano}`
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
