import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService } from '@/lib/anonymous-session.service'
import { EmailService } from '@/lib/email.service'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { hash } from 'bcrypt'

/**
 * POST /api/anonymous/convert
 * Converte sessão anônima em usuário PRE_ACTIVE + caso
 * Envia email de ativação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, name, email, phone } = body

    // Validações
    if (!sessionId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'sessionId, name e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato de email
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar nome completo
    if (name.trim().split(' ').length < 2) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu nome completo' },
        { status: 400 }
      )
    }

    // Buscar sessão
    const session = await AnonymousSessionService.findBySessionId(sessionId)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou expirada' },
        { status: 404 }
      )
    }

    // Verificar se já foi convertida
    if (session.status === 'CONVERTED') {
      return NextResponse.json(
        { success: false, error: 'Sessão já foi convertida' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este email já está cadastrado. Faça login para continuar.',
        },
        { status: 409 }
      )
    }

    // Gerar token de ativação
    const activationToken = nanoid(32)
    const activationExpires = new Date()
    activationExpires.setHours(activationExpires.getHours() + 48) // 48h para ativar

    // Criar usuário PRE_ACTIVE e cidadão em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar User
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone?.trim() || null,
          role: 'CIDADAO',
          status: 'PRE_ACTIVE',
          activationToken,
          activationExpires,
          password: await hash(nanoid(32), 10), // Senha temporária (será definida na ativação)
        },
      })

      // Criar Cidadao
      const cidadao = await tx.cidadao.create({
        data: {
          userId: user.id,
          cidade: session.cidade || null,
          estado: session.estado || null,
        },
      })

      // Criar Caso PENDENTE_ATIVACAO
      const caso = await tx.caso.create({
        data: {
          descricao:
            session.mensagens
              .filter((m) => m.role === 'user')
              .map((m) => m.content)
              .join('\n\n') || 'Caso criado via chat anônimo',
          urgencia:
            session.urgenciaDetectada === 'ALTA'
              ? 'ALTA'
              : session.urgenciaDetectada === 'MEDIA'
                ? 'NORMAL'
                : 'BAIXA',
          status: 'PENDENTE_ATIVACAO',
          cidadaoId: cidadao.id,
          sessionId: session.sessionId,
        },
      })

      return { user, cidadao, caso }
    })

    const { user, cidadao, caso } = result

    console.log(`[Convert] User created: ${user.id} (${user.email}) - PRE_ACTIVE`)
    console.log(`[Convert] Cidadao created: ${cidadao.id}`)
    console.log(`[Convert] Case created: ${caso.id} - Status: ${caso.status}`)

    // Atualizar sessão para CONVERTED
    await prisma.anonymousSession.update({
      where: { id: session.id },
      data: {
        status: 'CONVERTED',
        convertedToUserId: user.id,
        convertedToCasoId: caso.id,
      },
    })

    // Enviar email de ativação
    try {
      await EmailService.sendActivationEmail(user.email, user.name, activationToken)
    } catch (emailError) {
      // Log mas não falha a request - usuário foi criado com sucesso
      console.error('[Convert] Email send failed:', emailError)
      console.log(
        `[Convert] Activation link: ${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        caseId: caso.id,
        email: user.email,
        activationRequired: true,
      },
    })
  } catch (error: any) {
    console.error('Error converting anonymous session:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar conversão' },
      { status: 500 }
    )
  }
}
