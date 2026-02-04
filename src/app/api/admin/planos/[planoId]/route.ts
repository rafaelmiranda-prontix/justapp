import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updatePlanoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  preco: z.number().int().min(0).optional(),
  precoDisplay: z.number().int().min(0).optional(),
  leadsPerMonth: z.number().int().optional(),
  leadsPerHour: z.number().int().optional(),
  features: z.array(z.string()).optional(),
  stripePriceId: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'COMING_SOON', 'HIDDEN']).optional(),
  ordem: z.number().int().optional(),
})

// GET - Buscar um plano específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { planoId } = await params

    const plano = await prisma.planos.findUnique({
      where: { id: planoId },
      include: {
        _count: {
          select: {
            historicoAssinaturas: true,
          },
        },
      },
    })

    if (!plano) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: plano,
    })
  } catch (error) {
    logger.error('Error fetching plano:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar plano' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar plano
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { planoId } = await params
    const body = await req.json()
    const data = updatePlanoSchema.parse(body)

    // Verificar se plano existe
    const planoExistente = await prisma.planos.findUnique({
      where: { id: planoId },
    })

    if (!planoExistente) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se stripePriceId é único (se fornecido e diferente do atual)
    if (data.stripePriceId !== undefined && data.stripePriceId !== planoExistente.stripePriceId) {
      if (data.stripePriceId) {
        const existingStripePrice = await prisma.planos.findUnique({
          where: { stripePriceId: data.stripePriceId },
        })

        if (existingStripePrice) {
          return NextResponse.json(
            { success: false, error: 'Já existe um plano com este Stripe Price ID' },
            { status: 400 }
          )
        }
      }
    }

    const plano = await prisma.planos.update({
      where: { id: planoId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    logger.info(`[Admin] Plano atualizado: ${plano.id} (${plano.codigo})`)

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      data: plano,
    })
  } catch (error) {
    logger.error('Error updating plano:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar plano' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar plano (soft delete - apenas desativa)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { planoId } = await params

    // Verificar se plano existe
    const plano = await prisma.planos.findUnique({
      where: { id: planoId },
      include: {
        _count: {
          select: {
            historicoAssinaturas: true,
          },
        },
      },
    })

    if (!plano) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir deletar planos com assinaturas ativas
    if (plano._count.historicoAssinaturas > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível deletar plano com histórico de assinaturas. Desative o plano ao invés de deletar.',
        },
        { status: 400 }
      )
    }

    // Soft delete - apenas desativa
    await prisma.planos.update({
      where: { id: planoId },
      data: {
        ativo: false,
        status: 'HIDDEN',
        updatedAt: new Date(),
      },
    })

    logger.info(`[Admin] Plano desativado: ${plano.id} (${plano.codigo})`)

    return NextResponse.json({
      success: true,
      message: 'Plano desativado com sucesso',
    })
  } catch (error) {
    logger.error('Error deleting plano:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar plano' },
      { status: 500 }
    )
  }
}
