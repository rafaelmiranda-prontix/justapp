import { prisma } from './prisma'
import { nanoid } from 'nanoid'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AnonymousSessionData {
  id: string
  sessionId: string
  mensagens: ChatMessage[]
  userAgent?: string
  ipAddress?: string
  cidade?: string
  estado?: string
  especialidadeDetectada?: string
  urgenciaDetectada?: string
  status: string
  createdAt: Date
  expiresAt: Date
}

export class AnonymousSessionService {
  /**
   * Gera um sessionId único
   */
  static generateSessionId(): string {
    return `anon_${nanoid(32)}`
  }

  /**
   * Cria nova sessão anônima
   */
  static async create(data: {
    userAgent?: string
    ipAddress?: string
  }): Promise<AnonymousSessionData> {
    try {
      console.log('[Service] Generating sessionId...')
      const sessionId = this.generateSessionId()
      console.log('[Service] SessionId generated:', sessionId)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias
      console.log('[Service] Expires at:', expiresAt)

      // Mensagem de boas-vindas
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Olá! Sou o assistente da LegalConnect. 👋\n\nEstou aqui para entender sua situação jurídica e conectá-lo ao advogado ideal para o seu caso.\n\nPode me contar o que aconteceu?',
        timestamp: new Date(),
      }
      console.log('[Service] Welcome message created')

      console.log('[Service] Creating session in database...')
      const session = await prisma.anonymousSession.create({
        data: {
          sessionId,
          mensagens: [welcomeMessage] as any,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          status: 'ACTIVE',
          expiresAt,
        },
      })
      console.log('[Service] Session created in database:', session.id)

      return this.formatSession(session)
    } catch (error: any) {
      console.error('[Service] Error creating session:', error)
      console.error('[Service] Error details:', error.message, error.stack)
      throw error
    }
  }

  /**
   * Busca sessão por sessionId
   */
  static async findBySessionId(sessionId: string): Promise<AnonymousSessionData | null> {
    const session = await prisma.anonymousSession.findUnique({
      where: { sessionId },
    })

    if (!session) return null

    // Verificar se expirou
    if (new Date() > session.expiresAt) {
      await this.markAsExpired(sessionId)
      return null
    }

    return this.formatSession(session)
  }

  /**
   * Adiciona mensagem à sessão
   */
  static async addMessage(
    sessionId: string,
    message: ChatMessage
  ): Promise<AnonymousSessionData> {
    const session = await this.findBySessionId(sessionId)

    if (!session) {
      throw new Error('Sessão não encontrada ou expirada')
    }

    if (session.status !== 'ACTIVE') {
      throw new Error('Sessão não está ativa')
    }

    const mensagens = [...session.mensagens, message]

    const updated = await prisma.anonymousSession.update({
      where: { sessionId },
      data: {
        mensagens: mensagens as any,
        updatedAt: new Date(),
      },
    })

    return this.formatSession(updated)
  }

  /**
   * Atualiza dados detectados pela IA
   */
  static async updateDetectedData(
    sessionId: string,
    data: {
      cidade?: string
      estado?: string
      especialidadeDetectada?: string
      urgenciaDetectada?: string
    }
  ): Promise<void> {
    await prisma.anonymousSession.update({
      where: { sessionId },
      data,
    })
  }

  /**
   * Marca sessão como convertida
   */
  static async markAsConverted(
    sessionId: string,
    userId: string,
    casoId: string
  ): Promise<void> {
    await prisma.anonymousSession.update({
      where: { sessionId },
      data: {
        status: 'CONVERTED',
        convertedToUserId: userId,
        convertedToCasoId: casoId,
      },
    })
  }

  /**
   * Marca sessão como expirada
   */
  static async markAsExpired(sessionId: string): Promise<void> {
    await prisma.anonymousSession.update({
      where: { sessionId },
      data: { status: 'EXPIRED' },
    })
  }

  /**
   * Marca sessão como abandonada
   */
  static async markAsAbandoned(sessionId: string): Promise<void> {
    await prisma.anonymousSession.update({
      where: { sessionId },
      data: { status: 'ABANDONED' },
    })
  }

  /**
   * Verifica se deve solicitar dados de contato
   * Critérios: 3+ mensagens do usuário, especialidade detectada, localização capturada
   */
  static shouldCaptureLeadData(session: AnonymousSessionData): boolean {
    const userMessages = session.mensagens.filter(m => m.role === 'user')

    // Precisa de pelo menos 3 mensagens do usuário
    if (userMessages.length < 3) return false

    // Deve ter especialidade detectada
    if (!session.especialidadeDetectada) return false

    // Deve ter localização (cidade/estado)
    if (!session.cidade || !session.estado) return false

    return true
  }

  /**
   * Limpa sessões expiradas (cron job)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const now = new Date()

    // Marcar como expiradas
    const result = await prisma.anonymousSession.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return result.count
  }

  /**
   * Marca sessões abandonadas (7 dias sem update)
   */
  static async markAbandonedSessions(): Promise<number> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const result = await prisma.anonymousSession.updateMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lte: sevenDaysAgo },
      },
      data: {
        status: 'ABANDONED',
      },
    })

    return result.count
  }

  /**
   * Formata sessão para retorno
   */
  private static formatSession(session: any): AnonymousSessionData {
    return {
      id: session.id,
      sessionId: session.sessionId,
      mensagens: (session.mensagens as ChatMessage[]) || [],
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      cidade: session.cidade || undefined,
      estado: session.estado || undefined,
      especialidadeDetectada: session.especialidadeDetectada || undefined,
      urgenciaDetectada: session.urgenciaDetectada || undefined,
      status: session.status,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }
  }
}
