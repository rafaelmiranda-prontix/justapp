import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService, ChatMessage } from '@/lib/anonymous-session.service'
import { HybridChatService } from '@/lib/hybrid-chat.service'

/**
 * POST /api/anonymous/message
 * Adiciona mensagem à sessão anônima
 * Usa sistema híbrido: pré-qualificação (grátis) primeiro, IA (pago) só quando necessário
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: 'sessionId e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar sessão
    const session = await AnonymousSessionService.findBySessionId(sessionId)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou expirada' },
        { status: 404 }
      )
    }

    // Rate limiting simples: máximo 10 mensagens por minuto
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const recentMessages = session.mensagens.filter(
      m => m.role === 'user' && new Date(m.timestamp) > oneMinuteAgo
    )

    if (recentMessages.length >= 10) {
      return NextResponse.json(
        { success: false, error: 'Limite de mensagens excedido. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: now,
    }

    await AnonymousSessionService.addMessage(sessionId, userMessage)

    // Processar com sistema híbrido (decide automaticamente se usa IA ou não)
    const response = await HybridChatService.processMessage(sessionId, message)

    console.log(
      `[API] ${session.useAI ? 'IA' : 'Pré-qualificação'} | Score: ${session.preQualificationScore || 'N/A'} | Completed: ${response.preQualificationCompleted}`
    )

    // Criar mensagem da resposta
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response.reply,
      timestamp: new Date(),
    }

    const finalSession = await AnonymousSessionService.addMessage(sessionId, aiMessage)

    return NextResponse.json({
      success: true,
      data: {
        reply: response.reply,
        mensagens: finalSession.mensagens,
        shouldCaptureLeadData: response.shouldCaptureLeadData,
        preQualificationCompleted: response.preQualificationCompleted,
        sessionStatus: finalSession.status,
        extractedData: response.extractedData,
        useAI: finalSession.useAI,
        score: finalSession.preQualificationScore,
      },
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
