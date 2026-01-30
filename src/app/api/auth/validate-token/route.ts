import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/validate-token
 * Valida se um token de ativação é válido
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 400 })
    }

    // Buscar usuário com este token
    const user = await prisma.users.findUnique({
      where: { activationToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        activationExpires: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Token inválido' },
        { status: 404 }
      )
    }

    // Verificar se já foi ativado
    if (user.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Esta conta já foi ativada. Faça login para continuar.',
        },
        { status: 400 }
      )
    }

    // Verificar expiração
    if (user.activationExpires && new Date() > user.activationExpires) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Token expirado. Solicite um novo email de ativação.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      userName: user.name.split(' ')[0],
    })
  } catch (error: any) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao validar token' },
      { status: 500 }
    )
  }
}
