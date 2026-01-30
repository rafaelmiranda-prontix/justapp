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
  shouldCaptureLeadData: boolean
  extractedData?: {
    especialidade?: string
    cidade?: string
    estado?: string
    score?: number
  }
  submitLeadData: (data: { name: string; email: string; phone?: string }) => Promise<void>
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

          // Verificar se deve mostrar formulário de captura
          if (data.data.shouldCaptureLeadData) {
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
    async (data: { name: string; email: string; phone?: string }) => {
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
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`)
        }

        const result = await response.json()

        if (result.success) {
          // Sucesso! Mostrar mensagem de confirmação
          const confirmationMessage: ChatMessage = {
            role: 'assistant',
            content: `🎉 Perfeito, ${data.name.split(' ')[0]}!\n\nSeu caso foi registrado com sucesso. Enviamos um email de ativação para **${data.email}**.\n\n📧 Verifique sua caixa de entrada (e spam) e clique no link para ativar sua conta.\n\nDepois da ativação, você poderá acompanhar seu caso e receber propostas dos advogados.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, confirmationMessage])
          setShouldCaptureLeadData(false)
        } else {
          throw new Error(result.error || 'Erro ao registrar lead')
        }
      } catch (error) {
        console.error('Error submitting lead:', error)
        throw error
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
    shouldCaptureLeadData,
    extractedData,
    submitLeadData,
  }
}
