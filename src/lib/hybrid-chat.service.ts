import { AnonymousSessionService, ChatMessage, AnonymousSessionData } from './anonymous-session.service'
import { PreQualificationService } from './pre-qualification/pre-qualification.service'
import { AIChatService } from './ai-chat.service'
import { PreQualificationState } from './pre-qualification/types'
import { PRE_QUALIFICATION_FLOW } from './pre-qualification/questions'

/**
 * Serviço híbrido de chat
 * Usa pré-qualificação (grátis) primeiro, IA (pago) só quando necessário
 */
export class HybridChatService {
  /**
   * Processa mensagem do usuário
   * Decide automaticamente entre pré-qualificação e IA
   */
  static async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<{
    reply: string
    shouldCaptureLeadData: boolean
    preQualificationCompleted: boolean
    extractedData?: any
  }> {
    const session = await AnonymousSessionService.findBySessionId(sessionId)

    if (!session) {
      throw new Error('Sessão não encontrada')
    }

    // Se já está usando IA, continuar com IA
    if (session.useAI) {
      return this.processWithAI(session, userMessage)
    }

    // Se ainda está em pré-qualificação, processar com regras
    if (session.preQualificationState && !session.preQualificationState.completed) {
      return this.processWithPreQualification(session, userMessage)
    }

    // Se pré-qualificação completou mas ainda não ativou IA
    // Verificar se usuário quer prosseguir
    if (session.preQualificationState?.completed) {
      return this.handlePostQualification(session, userMessage)
    }

    // Fallback: usar IA
    return this.processWithAI(session, userMessage)
  }

  /**
   * Processa com pré-qualificação (SEM IA - GRÁTIS)
   */
  private static async processWithPreQualification(
    session: AnonymousSessionData,
    userMessage: string
  ): Promise<{
    reply: string
    shouldCaptureLeadData: boolean
    preQualificationCompleted: boolean
    extractedData?: any
  }> {
    const state = session.preQualificationState!
    const currentQuestion = PRE_QUALIFICATION_FLOW[state.currentQuestionId]

    // Normalizar resposta se for escolha múltipla
    const normalizedAnswer = PreQualificationService.normalizeChoiceAnswer(
      userMessage,
      currentQuestion
    )

    // Processar resposta
    const result = PreQualificationService.processAnswer(state, normalizedAnswer)

    // Atualizar sessão no banco
    await this.updateSessionWithPreQualification(
      session.sessionId,
      result.updatedState,
      normalizedAnswer
    )

    return {
      reply: result.nextMessage,
      shouldCaptureLeadData: result.isComplete,
      preQualificationCompleted: result.isComplete,
      extractedData: result.updatedState.extractedData,
    }
  }

  /**
   * Processa com IA (PAGO - só após confirmar)
   */
  private static async processWithAI(
    session: AnonymousSessionData,
    userMessage: string
  ): Promise<{
    reply: string
    shouldCaptureLeadData: boolean
    preQualificationCompleted: boolean
    extractedData?: any
  }> {
    // Gerar resposta com IA
    const aiResponse = await AIChatService.generateResponse(
      userMessage,
      session.mensagens
    )

    // Atualizar dados extraídos se houver
    if (aiResponse.extractedData && aiResponse.extractedData.confidence >= 60) {
      await AnonymousSessionService.updateDetectedData(session.sessionId, {
        cidade: aiResponse.extractedData.cidade,
        estado: aiResponse.extractedData.estado,
        especialidadeDetectada: aiResponse.extractedData.especialidadeDetectada,
        urgenciaDetectada: aiResponse.extractedData.urgenciaDetectada,
      })
    }

    // Verificar se deve capturar lead
    const updatedSession = await AnonymousSessionService.findBySessionId(session.sessionId)
    const shouldCapture = updatedSession
      ? AnonymousSessionService.shouldCaptureLeadData(updatedSession)
      : false

    return {
      reply: aiResponse.reply,
      shouldCaptureLeadData: shouldCapture,
      preQualificationCompleted: true,
      extractedData: aiResponse.extractedData,
    }
  }

  /**
   * Processa mensagens após completar pré-qualificação
   * Usuário decide se quer prosseguir (ativar IA) ou não
   */
  private static async handlePostQualification(
    session: AnonymousSessionData,
    userMessage: string
  ): Promise<{
    reply: string
    shouldCaptureLeadData: boolean
    preQualificationCompleted: boolean
    extractedData?: any
  }> {
    const lowerMessage = userMessage.toLowerCase()

    // Detectar confirmação
    const isConfirming =
      lowerMessage.includes('sim') ||
      lowerMessage.includes('quero') ||
      lowerMessage.includes('enviar') ||
      lowerMessage.includes('prosseguir') ||
      lowerMessage.includes('continuar')

    if (isConfirming) {
      // Ativar IA
      await this.activateAI(session.sessionId)

      return {
        reply: `Perfeito! 🎯

Agora vou coletar algumas informações para criar seu perfil e distribuir seu caso para os advogados mais adequados.

**Precisarei de:**
1. Seu nome completo
2. Seu melhor email
3. (Opcional) Telefone para contato

Vamos começar: qual é seu nome completo?`,
        shouldCaptureLeadData: true,
        preQualificationCompleted: true,
        extractedData: session.preQualificationState?.extractedData,
      }
    }

    // Detectar recusa
    const isDeclining =
      lowerMessage.includes('não') ||
      lowerMessage.includes('nao') ||
      lowerMessage.includes('depois') ||
      lowerMessage.includes('pensar')

    if (isDeclining) {
      return {
        reply: `Sem problemas! 😊

Você pode voltar quando quiser. Sua conversa ficará salva por 7 dias.

Se mudar de ideia, é só voltar aqui e clicar em "Enviar meu caso" para conectar com advogados.

Posso ajudar com mais alguma dúvida?`,
        shouldCaptureLeadData: false,
        preQualificationCompleted: true,
        extractedData: session.preQualificationState?.extractedData,
      }
    }

    // Resposta ambígua - perguntar novamente
    return {
      reply: `Desculpe, não entendi.

Você gostaria de **enviar seu caso** para advogados especializados agora?

Responda:
- "Sim" para prosseguir
- "Não" se preferir pensar mais`,
      shouldCaptureLeadData: false,
      preQualificationCompleted: true,
      extractedData: session.preQualificationState?.extractedData,
    }
  }

  /**
   * Atualiza sessão com dados da pré-qualificação
   */
  private static async updateSessionWithPreQualification(
    sessionId: string,
    state: PreQualificationState,
    lastAnswer: string
  ): Promise<void> {
    const updateData: any = {
      preQualificationState: state as any,
    }

    // Se completou, salvar score e dados extraídos
    if (state.completed) {
      updateData.preQualificationScore = state.score

      if (state.extractedData.cidade) updateData.cidade = state.extractedData.cidade
      if (state.extractedData.estado) updateData.estado = state.extractedData.estado
      if (state.extractedData.especialidade)
        updateData.especialidadeDetectada = state.extractedData.especialidade
      if (state.extractedData.urgencia)
        updateData.urgenciaDetectada = state.extractedData.urgencia
    }

    await AnonymousSessionService.updateDetectedData(sessionId, updateData)
  }

  /**
   * Ativa IA para a sessão (após confirmar envio)
   */
  private static async activateAI(sessionId: string): Promise<void> {
    const session = await AnonymousSessionService.findBySessionId(sessionId)
    if (!session) return

    // Marca como usando IA
    await AnonymousSessionService.updateDetectedData(sessionId, {
      useAI: true as any, // TypeScript hack - updateDetectedData precisa ser expandido
    })

    console.log(`[Hybrid] IA ativada para sessão ${sessionId}`)
  }
}
