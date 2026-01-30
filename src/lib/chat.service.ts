import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'

/**
 * Serviço de Chat
 * Gerencia mensagens entre cidadãos e advogados
 */
export class ChatService {
  /**
   * Envia mensagem em um match
   * Valida permissões e regras de negócio
   */
  static async sendMessage(data: {
    matchId: string
    remetenteId: string // userId
    conteudo: string
    anexoUrl?: string
  }): Promise<{
    success: boolean
    mensagem?: any
    error?: string
  }> {
    const { matchId, remetenteId, conteudo, anexoUrl } = data

    // Validações básicas
    if (!conteudo || conteudo.trim().length === 0) {
      return { success: false, error: 'Mensagem não pode estar vazia' }
    }

    if (conteudo.length > 5000) {
      return { success: false, error: 'Mensagem muito longa (máximo 5000 caracteres)' }
    }

    // Buscar match com detalhes
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        advogado: {
          include: {
            user: true,
          },
        },
        caso: {
          include: {
            cidadao: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!match) {
      return { success: false, error: 'Match não encontrado' }
    }

    // Verificar se remetente faz parte do match
    const isCidadao = match.caso.cidadao.userId === remetenteId
    const isAdvogado = match.advogado.userId === remetenteId

    if (!isCidadao && !isAdvogado) {
      return { success: false, error: 'Você não tem permissão para enviar mensagens neste chat' }
    }

    // REGRA: Chat só liberado após match ser ACEITO
    const chatOnlyAfterAccept = await ConfigService.getBoolean('chat_only_after_accept', true)

    if (chatOnlyAfterAccept && match.status !== 'ACEITO' && match.status !== 'CONTRATADO') {
      // Advogado pode enviar mensagem inicial antes de aceitar (opcional)
      if (isAdvogado && match.status === 'VISUALIZADO') {
        // Permitir
      } else if (isCidadao) {
        return {
          success: false,
          error: 'Chat será liberado quando o advogado aceitar o caso',
        }
      } else {
        return {
          success: false,
          error: 'Match precisa estar aceito para enviar mensagens',
        }
      }
    }

    // Verificar se match não expirou
    if (match.status === 'EXPIRADO') {
      return { success: false, error: 'Este match expirou' }
    }

    // Verificar se match não foi recusado
    if (match.status === 'RECUSADO') {
      return { success: false, error: 'Este match foi recusado' }
    }

    // Criar mensagem
    const mensagem = await prisma.mensagem.create({
      data: {
        matchId,
        remetenteId,
        conteudo: conteudo.trim(),
        anexoUrl,
        lida: false,
      },
      include: {
        match: {
          include: {
            advogado: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            caso: {
              include: {
                cidadao: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    console.log(
      `[Chat] Message sent in match ${matchId} by ${isCidadao ? 'citizen' : 'lawyer'} ${remetenteId}`
    )

    // TODO: Enviar notificação em tempo real via WebSocket/Pusher
    // TODO: Enviar notificação por email se destinatário offline

    return { success: true, mensagem }
  }

  /**
   * Lista mensagens de um match
   */
  static async getMessages(data: {
    matchId: string
    userId: string
    limit?: number
    offset?: number
  }): Promise<{
    success: boolean
    mensagens?: any[]
    total?: number
    error?: string
  }> {
    const { matchId, userId, limit = 50, offset = 0 } = data

    // Buscar match para validar permissões
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        advogado: {
          include: {
            user: true,
          },
        },
        caso: {
          include: {
            cidadao: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!match) {
      return { success: false, error: 'Match não encontrado' }
    }

    // Verificar se usuário faz parte do match
    const isCidadao = match.caso.cidadao.userId === userId
    const isAdvogado = match.advogado.userId === userId

    if (!isCidadao && !isAdvogado) {
      return { success: false, error: 'Você não tem permissão para ver este chat' }
    }

    // Buscar mensagens
    const mensagens = await prisma.mensagem.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.mensagem.count({ where: { matchId } })

    // Marcar mensagens como lidas (que não são do remetente)
    await prisma.mensagem.updateMany({
      where: {
        matchId,
        remetenteId: { not: userId },
        lida: false,
      },
      data: { lida: true },
    })

    return { success: true, mensagens, total }
  }

  /**
   * Conta mensagens não lidas do usuário
   */
  static async getUnreadCount(userId: string): Promise<number> {
    // Buscar matches do usuário (como cidadão ou advogado)
    const cidadao = await prisma.cidadao.findUnique({
      where: { userId },
    })

    const advogado = await prisma.advogados.findUnique({
      where: { userId },
    })

    let matchIds: string[] = []

    if (cidadao) {
      const casos = await prisma.caso.findMany({
        where: { cidadaoId: cidadao.id },
        include: { matches: true },
      })
      matchIds = casos.flatMap((c) => c.matches.map((m) => m.id))
    }

    if (advogado) {
      const matches = await prisma.match.findMany({
        where: { advogadoId: advogado.id },
      })
      matchIds.push(...matches.map((m) => m.id))
    }

    // Contar mensagens não lidas que não são do próprio usuário
    const unreadCount = await prisma.mensagem.count({
      where: {
        matchId: { in: matchIds },
        remetenteId: { not: userId },
        lida: false,
      },
    })

    return unreadCount
  }

  /**
   * Valida se usuário pode enviar anexo
   */
  static async canSendAttachment(userId: string, fileSize: number): Promise<{
    canSend: boolean
    error?: string
  }> {
    const maxSizeMB = await ConfigService.getNumber('max_attachment_size_mb', 20)
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (fileSize > maxSizeBytes) {
      return {
        canSend: false,
        error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
      }
    }

    return { canSend: true }
  }

  /**
   * Busca último match ativo entre cidadão e advogado
   */
  static async findActiveMatch(
    cidadaoUserId: string,
    advogadoUserId: string
  ): Promise<string | null> {
    const cidadao = await prisma.cidadao.findUnique({
      where: { userId: cidadaoUserId },
    })

    const advogado = await prisma.advogados.findUnique({
      where: { userId: advogadoUserId },
    })

    if (!cidadao || !advogado) return null

    const match = await prisma.match.findFirst({
      where: {
        advogadoId: advogado.id,
        caso: {
          cidadaoId: cidadao.id,
        },
        status: {
          in: ['ACEITO', 'CONTRATADO'],
        },
      },
      orderBy: { enviadoEm: 'desc' },
    })

    return match?.id || null
  }
}
