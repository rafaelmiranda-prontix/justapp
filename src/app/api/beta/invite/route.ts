import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'

const inviteSchema = z.object({
  email: z.string().email(),
  inviteCode: z.string().min(6).max(20).optional(),
})

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const body = await req.json()
    const data = inviteSchema.parse(body)

    // Gera código de convite se não fornecido
    const inviteCode =
      data.inviteCode ||
      `BETA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Verifica se o email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
      include: { advogados: true },
    })

    if (existingUser) {
      // Se já tem advogado, marca como beta
      if (existingUser.advogados) {
        await prisma.advogados.update({
          where: { id: existingUser.advogados.id },
          data: {
            isBeta: true,
            betaInviteCode: inviteCode,
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Usuário existe mas não é advogado' },
          { status: 400 }
        )
      }
    } else {
      // TODO: Enviar email com código de convite
      // Por enquanto, apenas retorna o código
      logger.info(`Beta invite code for ${data.email}: [REDACTED]`)
    }

    return NextResponse.json({
      success: true,
      data: {
        inviteCode,
        email: data.email,
      },
    })
  } catch (error) {
    console.error('Error creating beta invite:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar convite beta' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const betaAdvogados = await prisma.advogados.findMany({
      where: { isBeta: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: betaAdvogados,
    })
  } catch (error) {
    console.error('Error fetching beta advogados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar advogados beta' },
      { status: 500 }
    )
  }
}
