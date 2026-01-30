'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/lib/anonymous-session.service'

const SESSION_STORAGE_KEY = 'anonymous_session_id'

interface UseAnonymousChatReturn {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  messages: ChatMessage[]
  sendMessage: (message: string) => Promise<void>
  isTyping: boolean
  sessionId: string | null
}

export function useAnonymousChat(): UseAnonymousChatReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Carregar sessionId do localStorage ao montar
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSessionId) {
      setSessionId(storedSessionId)
      // TODO: Carregar mensagens existentes da sessão
    }
  }, [])

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
    setIsOpen(true)

    // Se não tem sessão, criar uma
    if (!sessionId) {
      try {
        await createSession()
      } catch (error) {
        console.error('Failed to create session:', error)
      }
    }
  }, [sessionId, createSession])

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
          // Adicionar resposta da IA
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: data.data.reply,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiMessage])

          // TODO: Verificar se deve mostrar formulário de captura
          if (data.data.shouldCaptureLeadData) {
            console.log('Deve solicitar dados de contato')
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

  return {
    isOpen,
    openChat,
    closeChat,
    messages,
    sendMessage,
    isTyping,
    sessionId,
  }
}
