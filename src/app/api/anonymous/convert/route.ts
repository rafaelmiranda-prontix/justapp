import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService } from '@/lib/anonymous-session.service'
import { EmailService } from '@/lib/email.service'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { hash } from 'bcryptjs'

/**
 * POST /api/anonymous/convert
 * Converte sessão anônima em usuário PRE_ACTIVE + caso
 * Envia email de ativação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, name, email, phone, cidade, estado } = body

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
    const existingUser = await prisma.users.findUnique({
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
      const now = new Date()
      const user = await tx.users.create({
        data: {
          id: nanoid(),
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone?.trim() || null,
          role: 'CIDADAO',
          status: 'PRE_ACTIVE',
          activationToken,
          activationExpires,
          password: await hash(nanoid(32), 10), // Senha temporária (será definida na ativação)
          updatedAt: now,
        },
      })

      // Criar Cidadao (priorizar cidade/estado do formulário, depois da sessão)
      const cidadao = await tx.cidadaos.create({
        data: {
          id: nanoid(),
          userId: user.id,
          cidade: cidade || session.cidade || null,
          estado: estado || session.estado || null,
          updatedAt: now,
        },
      })

      // Preparar histórico da conversa e extrair descrição do problema
      const mensagensUsuario = session.mensagens.filter((m) => m.role === 'user')

      // Buscar a resposta do usuário após a pergunta sobre o problema
      // A pergunta é: "Por favor, descreva brevemente seu problema em poucas palavras. Você pode escrever ou enviar um áudio."
      let descricaoProblema = 'Caso criado via chat anônimo'

      for (let i = 0; i < session.mensagens.length; i++) {
        const msg = session.mensagens[i]
        // Encontrar a pergunta sobre descrição do problema
        if (
          msg.role === 'assistant' &&
          (msg.content.toLowerCase().includes('descreva brevemente seu problema') ||
           msg.content.toLowerCase().includes('descreva seu problema'))
        ) {
          // A próxima mensagem do usuário é a descrição do problema
          const proximaUsuario = session.mensagens
            .slice(i + 1)
            .find((m) => m.role === 'user')
          if (proximaUsuario) {
            descricaoProblema = proximaUsuario.content
            break
          }
        }
      }

      // Se não encontrou, usar a primeira mensagem não-trivial do usuário
      if (descricaoProblema === 'Caso criado via chat anônimo') {
        // Filtrar saudações comuns
        const saudacoes = ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'sim', 'não']
        const mensagemValida = mensagensUsuario.find(
          (m) => !saudacoes.includes(m.content.toLowerCase().trim())
        )
        if (mensagemValida) {
          descricaoProblema = mensagemValida.content
        }
      }

      // Criar Caso PENDENTE_ATIVACAO
      // Garantir que o histórico inclui audioUrl de todas as mensagens
      const historicoCompleto = session.mensagens.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        audioUrl: msg.audioUrl || undefined, // Incluir audioUrl se existir
      }))

      console.log('[Convert] Histórico completo:', {
        totalMensagens: historicoCompleto.length,
        mensagensComAudio: historicoCompleto.filter((m) => m.audioUrl).length,
      })

      const caso = await tx.casos.create({
        data: {
          id: nanoid(),
          descricao: descricaoProblema, // Descrição do problema (não saudação)
          conversaHistorico: historicoCompleto, // Histórico completo do chat com audioUrl
          urgencia:
            session.urgenciaDetectada === 'ALTA'
              ? 'ALTA'
              : session.urgenciaDetectada === 'MEDIA'
                ? 'NORMAL'
                : 'BAIXA',
          status: 'PENDENTE_ATIVACAO',
          cidadaoId: cidadao.id,
          sessionId: session.sessionId,
          updatedAt: now,
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
