import { useEffect, useState, useCallback, useRef } from 'react'
import { getPusherClient } from '@/lib/pusher'
import type { Channel } from 'pusher-js'

export interface ChatMatchMessage {
  id: string
  conteudo: string
  anexoUrl: string | null
  lida: boolean
  createdAt: string
  isEdited?: boolean
  editedAt?: string | null
  editCount?: number
  remetente: {
    id: string
    name: string
    image: string | null
  }
}

interface UseRealtimeMessagesReturn {
  messages: ChatMatchMessage[]
  editWindowMinutes: number
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  sendMessage: (content: string, attachmentUrl?: string | null) => Promise<void>
  editMessageContent: (messageId: string, content: string) => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: () => void
  typingUsers: Set<string>
  startTyping: () => void
  stopTyping: () => void
}

export function useRealtimeMessages(
  matchId: string,
  currentUserId: string,
  currentUserName: string = 'Você',
  currentUserImage: string | null = null
): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<ChatMatchMessage[]>([])
  const [editWindowMinutes, setEditWindowMinutes] = useState(15)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  const channelRef = useRef<Channel | null>(null)
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Buscar mensagens iniciais
  const fetchInitialMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/matches/${matchId}/messages?limit=50`)
      const result = await res.json()

      if (result.success) {
        setMessages(result.data)
        setHasMore(result.data.length === 50)
        if (typeof result.editWindowMinutes === 'number') {
          setEditWindowMinutes(result.editWindowMinutes)
        }
      } else {
        setError(result.error || 'Erro ao carregar mensagens')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Erro ao carregar mensagens')
    } finally {
      setIsLoading(false)
    }
  }, [matchId])

  // Carregar mais mensagens (scroll infinito)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    try {
      setIsLoadingMore(true)
      const offset = messages.length
      const res = await fetch(`/api/matches/${matchId}/messages?limit=50&offset=${offset}`)
      const result = await res.json()

      if (result.success) {
        setMessages((prev) => [...result.data, ...prev])
        setHasMore(result.data.length === 50)
        if (typeof result.editWindowMinutes === 'number') {
          setEditWindowMinutes(result.editWindowMinutes)
        }
      }
    } catch (err) {
      console.error('Error loading more messages:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [matchId, messages.length, isLoadingMore, hasMore])

  // Conectar ao Pusher e escutar eventos
  useEffect(() => {
    if (!matchId) return

    // Inicializar Pusher
    pusherRef.current = getPusherClient()
    const channel = pusherRef.current.subscribe(`match-${matchId}`)
    channelRef.current = channel

    // Escutar nova mensagem
    channel.bind('new-message', (data: ChatMatchMessage) => {
      setMessages((prev) => {
        // Evitar duplicatas
        if (prev.some((m) => m.id === data.id)) {
          return prev
        }
        return [...prev, data]
      })
    })

    channel.bind('message-edited', (data: ChatMatchMessage) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? {
                ...m,
                conteudo: data.conteudo,
                isEdited: data.isEdited ?? true,
                editedAt:
                  typeof data.editedAt === 'string'
                    ? data.editedAt
                    : data.editedAt
                      ? new Date(data.editedAt as unknown as string).toISOString()
                      : new Date().toISOString(),
                editCount: data.editCount ?? m.editCount,
              }
            : m
        )
      )
    })

    // Escutar mensagens marcadas como lidas
    channel.bind('messages-read', (data: { userId: string; messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) ? { ...msg, lida: true } : msg
        )
      )
    })

    // Escutar evento de digitação
    channel.bind('user-typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(data.userId))

        // Remover após 3 segundos
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev)
            next.delete(data.userId)
            return next
          })
        }, 3000)
      }
    })

    // Carregar mensagens iniciais
    fetchInitialMessages()

    // Cleanup
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusherRef.current?.disconnect()
    }
  }, [matchId, currentUserId, fetchInitialMessages])

  // Enviar mensagem com Optimistic Update
  const sendMessage = useCallback(
    async (content: string, attachmentUrl: string | null = null) => {
      // OPTIMISTIC UPDATE: Criar mensagem temporária
      const tempId = `temp-${Date.now()}`
      const optimisticMessage: ChatMatchMessage = {
        id: tempId,
        conteudo: content,
        anexoUrl: attachmentUrl,
        lida: false,
        createdAt: new Date().toISOString(),
        remetente: {
          id: currentUserId,
          name: currentUserName,
          image: currentUserImage,
        },
      }

      // Adicionar mensagem temporária IMEDIATAMENTE
      setMessages((prev) => [...prev, optimisticMessage])

      try {
        const payload = {
          conteudo: content,
          anexoUrl: attachmentUrl || null, // Garantir que seja null se undefined
        }
        
        console.log('[Hook] Sending message payload:', payload)
        
        const res = await fetch(`/api/matches/${matchId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await res.json()

        if (!result.success) {
          // Remover mensagem temporária em caso de erro
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
          throw new Error(result.error || 'Erro ao enviar mensagem')
        }

        // Substituir mensagem temporária pela real quando chegar via Pusher
        // (o evento 'new-message' já faz isso automaticamente, mas garantimos aqui)
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? result.data : msg))
        )
      } catch (err) {
        console.error('Error sending message:', err)
        // Remover mensagem temporária em caso de erro
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        throw err
      }
    },
    [matchId, currentUserId, currentUserName, currentUserImage]
  )

  const editMessageContent = useCallback(async (messageId: string, content: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const result = await res.json()
    if (!result.success) {
      throw new Error(result.error || 'Erro ao editar mensagem')
    }
    const data = result.data as ChatMatchMessage
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              conteudo: data.conteudo,
              isEdited: data.isEdited ?? true,
              editedAt: data.editedAt
                ? typeof data.editedAt === 'string'
                  ? data.editedAt
                  : new Date(data.editedAt).toISOString()
                : new Date().toISOString(),
              editCount: data.editCount ?? m.editCount,
            }
          : m
      )
    )
  }, [])

  // Marcar mensagens como lidas
  const markAsRead = useCallback(() => {
    const unreadIds = messages
      .filter((m) => !m.lida && m.remetente.id !== currentUserId)
      .map((m) => m.id)

    if (unreadIds.length === 0) return

    // Atualizar localmente imediatamente
    setMessages((prev) =>
      prev.map((msg) => (unreadIds.includes(msg.id) ? { ...msg, lida: true } : msg))
    )

    // Notificar servidor (fire and forget)
    fetch(`/api/matches/${matchId}/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds: unreadIds }),
    }).catch(console.error)
  }, [messages, currentUserId, matchId])

  // Iniciar digitação
  const startTyping = useCallback(() => {
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Enviar evento de digitação
    fetch(`/api/matches/${matchId}/typing`, {
      method: 'POST',
    }).catch(console.error)

    // Parar automaticamente após 3s
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [matchId])

  // Parar digitação
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [])

  return {
    messages,
    editWindowMinutes,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    editMessageContent,
    loadMore,
    markAsRead,
    typingUsers,
    startTyping,
    stopTyping,
  }
}
