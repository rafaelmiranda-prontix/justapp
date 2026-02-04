import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'

// POST - Completar onboarding do advogado
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

    // Buscar advogado
    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: {
                nome: true,
              },
            },
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

    // Verificar se pode completar
    const missingFields: string[] = []

    if (!advogado.oab || advogado.oab.trim() === '') {
      missingFields.push('OAB')
    }

    if (!advogado.cidade || advogado.cidade.trim() === '') {
      missingFields.push('Cidade')
    }

    if (!advogado.estado || advogado.estado.trim() === '') {
      missingFields.push('Estado')
    }

    if (advogado.advogado_especialidades.length === 0) {
      missingFields.push('Especialidades')
    }

    if (
      advogado.users.status !== 'ACTIVE' &&
      advogado.users.status !== 'PRE_ACTIVE'
    ) {
      missingFields.push(`Conta não está ativa (status: ${advogado.users.status})`)
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível completar o onboarding',
          missingFields,
        },
        { status: 400 }
      )
    }

    // Verificar se já está completo
    if (advogado.onboardingCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Onboarding já está completo',
        },
        { status: 400 }
      )
    }

    // Completar onboarding e ativar conta se necessário
    const wasPreActive = advogado.users.status === 'PRE_ACTIVE'

    // Ativar conta se estiver em PRE_ACTIVE
    if (wasPreActive) {
      await prisma.users.update({
        where: { id: advogado.users.id },
        data: {
          status: 'ACTIVE',
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
      })
      logger.info(
        `[Admin] Activated account for lawyer ${advogadoId} (PRE_ACTIVE -> ACTIVE)`
      )
    }

    // Completar onboarding
    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
    })

    logger.info(`[Admin] Completed onboarding for lawyer ${advogadoId}`)

    return NextResponse.json({
      success: true,
      message: wasPreActive
        ? 'Onboarding completado e conta ativada com sucesso'
        : 'Onboarding completado com sucesso',
      data: {
        onboardingCompleted: true,
        accountActivated: wasPreActive,
      },
    })
  } catch (error) {
    logger.error('Error completing onboarding:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao completar onboarding',
      },
      { status: 500 }
    )
  }
}
