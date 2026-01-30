import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService, ChatMessage } from '@/lib/anonymous-session.service'
import { AIChatService } from '@/lib/ai-chat.service'

/**
 * POST /api/anonymous/message
 * Adiciona mensagem à sessão anônima
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

    const updatedSession = await AnonymousSessionService.addMessage(sessionId, userMessage)

    // Gerar resposta com IA
    const aiChatResponse = await AIChatService.generateResponse(
      message,
      updatedSession.mensagens
    )

    // Criar mensagem da IA
    const aiResponse: ChatMessage = {
      role: 'assistant',
      content: aiChatResponse.reply,
      timestamp: new Date(),
    }

    const finalSession = await AnonymousSessionService.addMessage(sessionId, aiResponse)

    // Atualizar dados extraídos pela IA (se houver)
    if (aiChatResponse.extractedData) {
      const { cidade, estado, especialidadeDetectada, urgenciaDetectada } = aiChatResponse.extractedData

      // Só atualiza se tiver confiança >= 60%
      if (aiChatResponse.extractedData.confidence >= 60) {
        await AnonymousSessionService.updateDetectedData(sessionId, {
          cidade: cidade || undefined,
          estado: estado || undefined,
          especialidadeDetectada: especialidadeDetectada || undefined,
          urgenciaDetectada: urgenciaDetectada || undefined,
        })
      }
    }

    // Verificar se deve solicitar dados de contato
    const shouldCaptureLeadData = AnonymousSessionService.shouldCaptureLeadData(finalSession)

    return NextResponse.json({
      success: true,
      data: {
        reply: aiResponse.content,
        mensagens: finalSession.mensagens,
        shouldCaptureLeadData,
        sessionStatus: finalSession.status,
        extractedData: aiChatResponse.extractedData,
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
