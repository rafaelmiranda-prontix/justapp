import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email.service'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { NotificationService } from '@/lib/notification.service'
import { hash } from 'bcryptjs'

/**
 * POST /api/auth/activate
 * Ativa conta do usuário com senha definida
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validações
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Buscar usuário com este token
    const user = await prisma.users.findUnique({
      where: { activationToken: token },
      include: {
        cidadaos: {
          include: {
            casos: {
              where: { status: 'PENDENTE_ATIVACAO' },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 404 }
      )
    }

    // Verificar se já foi ativado
    if (user.status === 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Esta conta já foi ativada' },
        { status: 400 }
      )
    }

    // Verificar expiração
    if (user.activationExpires && new Date() > user.activationExpires) {
      return NextResponse.json(
        { success: false, error: 'Token expirado. Solicite um novo email de ativação.' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10)

    // Ativar conta e casos em uma transação
    await prisma.$transaction(async (tx) => {
      // Atualizar usuário para ACTIVE
      await tx.users.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          password: hashedPassword,
          activationToken: null, // Limpar token
          activationExpires: null,
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
      })

      // Ativar todos os casos PENDENTE_ATIVACAO deste cidadão
      if (user.cidadaos) {
        await tx.casos.updateMany({
          where: {
            cidadaoId: user.cidadaos.id,
            status: 'PENDENTE_ATIVACAO',
          },
          data: {
            status: 'ABERTO', // Mudar para ABERTO para iniciar distribuição
          },
        })
      }
    })

    console.log(`[Activate] User activated: ${user.id} (${user.email})`)
    console.log(
      `[Activate] Cases activated: ${user.cidadaos?.casos.length || 0} case(s) moved to ABERTO`
    )

    // Analytics: Ativação completada (server-side log)
    console.log('[Analytics] activation_completed', {
      userId: user.id,
      email: user.email,
      casosCount: user.cidadaos?.casos.length || 0,
    })

    // Distribuir casos para advogados (em background)
    if (user.cidadaos && user.cidadaos.casos.length > 0) {
      // Disparar distribuição para cada caso ativado
      for (const caso of user.cidadaos.casos) {
        console.log(`[Activate] Triggering matching for case ${caso.id}`)

        CaseDistributionService.distributeCase(caso.id)
          .then(async (result) => {
            console.log(
              `[Activate] Case ${caso.id} distributed: ${result.matchesCreated} matches created`
            )

            // Analytics: Matching disparado (server-side log)
            console.log('[Analytics] activation_matching_triggered', {
              userId: user.id,
              casoId: caso.id,
              matchesCreated: result.matchesCreated,
            })

            // Notificar advogados sobre matches criados
            const matches = await prisma.match.findMany({
              where: {
                casoId: caso.id,
                status: 'PENDENTE',
              },
            })

            for (const match of matches) {
              NotificationService.notifyLawyerNewMatch(match.id).catch((err) =>
                console.error('[Activate] Notification failed:', err)
              )
            }
          })
          .catch((err) => {
            console.error(`[Activate] Distribution failed for case ${caso.id}:`, err)
          })
      }
    }

    // Enviar email de boas-vindas (não espera completar)
    EmailService.sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error('[Activate] Welcome email failed:', err)
    )

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error('Error activating account:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao ativar conta' },
      { status: 500 }
    )
  }
}
