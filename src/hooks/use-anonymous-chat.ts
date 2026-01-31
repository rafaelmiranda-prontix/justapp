'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/lib/anonymous-session.service'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

const SESSION_STORAGE_KEY = 'anonymous_session_id'

interface UseAnonymousChatReturn {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  messages: ChatMessage[]
  sendMessage: (message: string) => Promise<void>
  isTyping: boolean
  sessionId: string | null
  shouldCaptureLeadData: boolean
  extractedData?: {
    especialidade?: string
    cidade?: string
    estado?: string
    score?: number
  }
  submitLeadData: (data: { name: string; email: string; phone?: string; cidade?: string; estado?: string }) => Promise<void>
  resetChat: () => Promise<void>
}

export function useAnonymousChat(): UseAnonymousChatReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [shouldCaptureLeadData, setShouldCaptureLeadData] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    especialidade?: string
    cidade?: string
    estado?: string
    score?: number
  }>()

  // Função para carregar estado completo da sessão
  const loadSessionState = useCallback(async (sessionIdToLoad: string) => {
    try {
      console.log('[Hook] Loading session state for:', sessionIdToLoad)
      // Buscar sessão via API para obter estado completo
      const response = await fetch(`/api/anonymous/session?sessionId=${sessionIdToLoad}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Se uma nova sessão foi criada (sessão antiga não encontrada)
          if (data.data.isNewSession && data.data.sessionId !== sessionIdToLoad) {
            console.log('[Hook] New session created, updating sessionId:', data.data.sessionId)
            setSessionId(data.data.sessionId)
            localStorage.setItem(SESSION_STORAGE_KEY, data.data.sessionId)
          }

          console.log('[Hook] Session data loaded:', {
            mensagens: data.data.mensagens?.length || 0,
            shouldCaptureLeadData: data.data.shouldCaptureLeadData,
            especialidade: data.data.especialidadeDetectada,
            cidade: data.data.cidade,
            estado: data.data.estado,
            isNewSession: data.data.isNewSession,
          })
          
          // Carregar mensagens
          if (data.data.mensagens && data.data.mensagens.length > 0) {
            setMessages(data.data.mensagens)
          }
          
          // Verificar se deve mostrar formulário de captura
          if (data.data.shouldCaptureLeadData) {
            console.log('[Hook] Setting shouldCaptureLeadData to true')
            setShouldCaptureLeadData(true)
            setExtractedData({
              especialidade: data.data.especialidadeDetectada,
              cidade: data.data.cidade,
              estado: data.data.estado,
              score: data.data.preQualificationScore,
            })
          } else {
            // Garantir que está false se não deve mostrar
            setShouldCaptureLeadData(false)
          }
        }
      } else {
        console.warn('[Hook] Failed to load session state:', response.status)
      }
    } catch (error) {
      console.error('[Hook] Error loading session state:', error)
      // Não falhar silenciosamente - apenas logar o erro
    }
  }, [])

  // Carregar sessionId do localStorage ao montar
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSessionId) {
      console.log('[Hook] Found stored sessionId on mount:', storedSessionId)
      setSessionId(storedSessionId)
      // Carregar estado completo da sessão imediatamente
      // Isso garante que o formulário apareça após reload da página
      loadSessionState(storedSessionId).catch((error) => {
        console.error('[Hook] Error loading session state on mount:', error)
      })
    }
  }, [loadSessionState])

  // Criar nova sessão
  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/anonymous/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Session creation failed:', text)
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`)
      }

      const data = await response.json()

      if (data.success) {
        setSessionId(data.data.sessionId)
        localStorage.setItem(SESSION_STORAGE_KEY, data.data.sessionId)

        // Carregar mensagens iniciais (boas-vindas)
        if (data.data.mensagens && data.data.mensagens.length > 0) {
          setMessages(data.data.mensagens)
        }

        return data.data.sessionId
      } else {
        throw new Error(data.error || 'Erro ao criar sessão')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }, [])

  // Abrir chat
  const openChat = useCallback(async () => {
    // Analytics: Chat aberto
    trackEvent(AnalyticsEvents.ANONYMOUS_CHAT_OPENED)

    // Se não tem sessão, criar uma ANTES de abrir
    if (!sessionId) {
      try {
        await createSession()
      } catch (error) {
        console.error('Failed to create session:', error)
        alert('Erro ao iniciar conversa. Tente novamente.')
        return
      }
    } else {
      // Se já tem sessão, SEMPRE recarregar estado completo
      // Isso garante que o formulário apareça após reload da página
      console.log('[Hook] Reloading session state before opening chat')
      await loadSessionState(sessionId)
    }

    // Só abre depois da sessão estar criada/recarregada
    setIsOpen(true)
  }, [sessionId, createSession, loadSessionState])

  // Fechar chat
  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Enviar mensagem
  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) {
        console.error('No session ID')
        return
      }

      // Adicionar mensagem do usuário imediatamente (optimistic update)
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Mostrar typing indicator
      setIsTyping(true)

      try {
        const response = await fetch('/api/anonymous/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message,
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          console.error('Message send failed:', text)
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`)
        }

        const data = await response.json()

        if (data.success) {
          // Analytics: Mensagem enviada
          trackEvent(AnalyticsEvents.ANONYMOUS_MESSAGE_SENT, {
            messageLength: message.length,
            messageNumber: messages.filter(m => m.role === 'user').length + 1,
          })

          // Adicionar resposta da IA
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: data.data.reply,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiMessage])

          // Verificar se deve mostrar formulário de captura
          if (data.data.shouldCaptureLeadData) {
            // Analytics: Lead capture mostrado
            trackEvent(AnalyticsEvents.LEAD_CAPTURE_SHOWN, {
              messageCount: messages.filter(m => m.role === 'user').length + 1,
              especialidade: data.data.extractedData?.especialidade,
              score: data.data.score,
            })

            setShouldCaptureLeadData(true)
            setExtractedData({
              especialidade: data.data.extractedData?.especialidade,
              cidade: data.data.extractedData?.cidade,
              estado: data.data.extractedData?.estado,
              score: data.data.score,
            })
          }
        } else {
          throw new Error(data.error || 'Erro ao enviar mensagem')
        }
      } catch (error) {
        console.error('Error sending message:', error)
        // Remover mensagem do usuário em caso de erro
        setMessages((prev) => prev.filter((m) => m !== userMessage))
        alert('Erro ao enviar mensagem. Tente novamente.')
      } finally {
        setIsTyping(false)
      }
    },
    [sessionId]
  )

  // Submeter dados do lead
  const submitLeadData = useCallback(
    async (data: { name: string; email: string; phone?: string; cidade?: string; estado?: string }) => {
      if (!sessionId) {
        console.error('No session ID')
        throw new Error('Sessão não encontrada')
      }

      try {
        const response = await fetch('/api/anonymous/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            ...data,
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          console.error('Lead submission failed:', text)
          
          // Tentar parsear JSON para obter mensagem de erro mais específica
          let errorMessage = `Erro ao enviar dados (${response.status})`
          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          } catch {
            // Se não for JSON, usar texto truncado
            errorMessage = text.substring(0, 200) || errorMessage
          }
          
          throw new Error(errorMessage)
        }

        const result = await response.json()

        if (result.success) {
          // Analytics: Lead capturado com sucesso
          trackEvent(AnalyticsEvents.LEAD_CAPTURED, {
            email: data.email,
            hasPhone: !!data.phone,
            messageCount: messages.filter(m => m.role === 'user').length,
            especialidade: extractedData?.especialidade,
            cidade: extractedData?.cidade,
            estado: extractedData?.estado,
            score: extractedData?.score,
          })

          // Analytics: Email de ativação enviado
          trackEvent(AnalyticsEvents.ACTIVATION_EMAIL_SENT, {
            email: data.email,
          })

          // Sucesso! Mostrar mensagem de confirmação
          const confirmationMessage: ChatMessage = {
            role: 'assistant',
            content: `🎉 Perfeito, ${data.name.split(' ')[0]}!\n\nSeu caso foi registrado com sucesso. Enviamos um email de ativação para **${data.email}**.\n\n📧 Verifique sua caixa de entrada (e spam) e clique no link para ativar sua conta.\n\nDepois da ativação, você poderá acompanhar seu caso e receber propostas dos advogados.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, confirmationMessage])
          
          // Limpar estado e localStorage apenas em caso de sucesso
          setShouldCaptureLeadData(false)
          localStorage.removeItem(SESSION_STORAGE_KEY)
          setSessionId(null)
        } else {
          throw new Error(result.error || 'Erro ao registrar lead')
        }
      } catch (error) {
        console.error('Error submitting lead:', error)
        // NÃO limpar shouldCaptureLeadData em caso de erro
        // O formulário deve permanecer visível para permitir reenvio
        throw error
      }
    },
    [sessionId, messages, extractedData]
  )

  // Reiniciar chat (limpar tudo e criar nova sessão)
  const resetChat = useCallback(async () => {
    // Limpar estado local
    setMessages([])
    setShouldCaptureLeadData(false)
    setExtractedData(undefined)
    setIsTyping(false)
    
    // Limpar localStorage
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSessionId(null)
    
    // Criar nova sessão
    try {
      await createSession()
    } catch (error) {
      console.error('Failed to create new session after reset:', error)
      // Não mostrar erro ao usuário, apenas logar
    }
  }, [createSession])

  return {
    isOpen,
    openChat,
    closeChat,
    messages,
    sendMessage,
    isTyping,
    sessionId,
    shouldCaptureLeadData,
    extractedData,
    submitLeadData,
    resetChat,
  }
}
