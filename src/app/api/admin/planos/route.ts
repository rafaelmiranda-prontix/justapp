import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const createPlanoSchema = z.object({
  codigo: z.enum(['FREE', 'BASIC', 'PREMIUM', 'UNLIMITED']),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  preco: z.number().int().min(0), // em centavos
  precoDisplay: z.number().int().min(0), // para exibição
  leadsPerMonth: z.number().int(), // -1 = ilimitado
  leadsPerHour: z.number().int(), // -1 = ilimitado
  features: z.array(z.string()),
  stripePriceId: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'COMING_SOON', 'HIDDEN']).default('ACTIVE'),
  ordem: z.number().int().default(0),
})

const updatePlanoSchema = createPlanoSchema.partial().extend({
  codigo: z.enum(['FREE', 'BASIC', 'PREMIUM', 'UNLIMITED']).optional(),
})

// GET - Listar todos os planos
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.ativo = true
    }

    const planos = await prisma.planos.findMany({
      where,
      orderBy: [
        { ordem: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            historicoAssinaturas: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: planos,
    })
  } catch (error) {
    logger.error('Error fetching planos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano
export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const body = await req.json()
    const data = createPlanoSchema.parse(body)

    // Verificar se já existe plano com este código
    const existingPlano = await prisma.planos.findUnique({
      where: { codigo: data.codigo },
    })

    if (existingPlano) {
      return NextResponse.json(
        { success: false, error: 'Já existe um plano com este código' },
        { status: 400 }
      )
    }

    // Verificar se stripePriceId é único (se fornecido)
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

    const plano = await prisma.planos.create({
      data: {
        id: nanoid(),
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao || null,
        preco: data.preco,
        precoDisplay: data.precoDisplay,
        leadsPerMonth: data.leadsPerMonth,
        leadsPerHour: data.leadsPerHour,
        features: data.features,
        stripePriceId: data.stripePriceId || null,
        ativo: data.ativo,
        status: data.status,
        ordem: data.ordem,
        updatedAt: new Date(),
      },
    })

    logger.info(`[Admin] Plano criado: ${plano.id} (${plano.codigo})`)

    return NextResponse.json({
      success: true,
      message: 'Plano criado com sucesso',
      data: plano,
    })
  } catch (error) {
    logger.error('Error creating plano:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao criar plano' },
      { status: 500 }
    )
  }
}
