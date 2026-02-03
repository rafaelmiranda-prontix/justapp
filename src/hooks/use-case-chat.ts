'use client'

import { useState, useCallback } from 'react'
import type { ChatMessageProps } from '@/components/chat/chat-message'

export type TriageStep =
  | 'greeting'
  | 'description'
  | 'date'
  | 'evidence'
  | 'attempted_resolution'
  | 'contact_info'
  | 'confirmation'
  | 'completed'

interface TriageData {
  description: string
  date?: string
  hasEvidence?: boolean
  attemptedResolution?: boolean
  name?: string
  contact?: string
  especialidadeId?: string
  urgencia?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
}

export function useCaseChat() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou seu assistente jurídico. Vou te ajudar a encontrar o advogado ideal para o seu caso.\n\nPara começar, conte com suas palavras o que aconteceu.',
      timestamp: new Date(),
    },
  ])

  const [currentStep, setCurrentStep] = useState<TriageStep>('description')
  const [triageData, setTriageData] = useState<TriageData>({
    description: '',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const addMessage = useCallback((message: ChatMessageProps) => {
    setMessages((prev) => [...prev, { ...message, timestamp: new Date() }])
  }, [])

  const handleUserResponse = useCallback(
    async (content: string, audioUrl?: string) => {
      // Adiciona mensagem do usuário
      addMessage({ 
        role: 'user', 
        content,
        audioUrl,
      })

      // Processa baseado na etapa atual
      switch (currentStep) {
        case 'description':
          setTriageData((prev) => ({ ...prev, description: content }))
          setIsAnalyzing(true)

          try {
            // Analisa com IA (pode incluir áudio)
            const res = await fetch('/api/ai/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                description: content,
                audioUrl: audioUrl,
              }),
            })

            const result = await res.json()

            if (result.success) {
              const { especialidade, urgencia } = result.analysis

              setTriageData((prev) => ({
                ...prev,
                especialidadeId: especialidade,
                urgencia,
              }))

              addMessage({
                role: 'system',
                content: `Isso parece um caso de ${especialidade}`,
              })
            }
          } catch (error) {
            console.error('Error analyzing:', error)
          }

          addMessage({
            role: 'assistant',
            content:
              'Entendi. Quando isso aconteceu aproximadamente? Pode me dar uma data ou período (ex: "semana passada", "há 2 meses")?',
          })
          setCurrentStep('date')
          setIsAnalyzing(false)
          break

        case 'date':
          setTriageData((prev) => ({ ...prev, date: content }))
          addMessage({
            role: 'assistant',
            content:
              'Você tem algum comprovante relacionado a isso? (nota fiscal, protocolo, prints, emails, etc.)',
          })
          setCurrentStep('evidence')
          break

        case 'evidence':
          const hasEvidence = content.toLowerCase().includes('sim')
          setTriageData((prev) => ({ ...prev, hasEvidence }))
          addMessage({
            role: 'assistant',
            content: 'Você já tentou resolver isso diretamente com a empresa/outra parte?',
          })
          setCurrentStep('attempted_resolution')
          break

        case 'attempted_resolution':
          const attempted = content.toLowerCase().includes('sim')
          setTriageData((prev) => ({ ...prev, attemptedResolution: attempted }))
          addMessage({
            role: 'assistant',
            content:
              'Ótimo! Para finalizar, como posso te chamar? E qual o melhor contato (email ou telefone)?',
          })
          setCurrentStep('contact_info')
          break

        case 'contact_info':
          // Extrai nome e contato (simplificado)
          const lines = content.split('\n')
          setTriageData((prev) => ({
            ...prev,
            name: lines[0],
            contact: lines[1] || lines[0],
          }))

          addMessage({
            role: 'assistant',
            content: `Perfeito, ${lines[0]}! Baseado no que você me contou, vou buscar advogados especializados na sua região que podem ajudar com seu caso.\n\nPosso enviar seu caso para eles?`,
          })
          setCurrentStep('confirmation')
          break

        case 'confirmation':
          if (content.toLowerCase().includes('sim')) {
            addMessage({
              role: 'assistant',
              content:
                '✅ Caso registrado com sucesso!\n\nEstou buscando os melhores advogados para você...',
            })
            setCurrentStep('completed')

            // Redireciona para busca de advogados
            setTimeout(() => {
              const especialidade = triageData.especialidadeId || ''
              window.location.href = `/buscar-advogados?especialidade=${encodeURIComponent(especialidade)}`
            }, 2000)
          } else {
            addMessage({
              role: 'assistant',
              content:
                'Sem problemas! Se mudar de ideia, estou aqui para ajudar. Quer modificar alguma informação?',
            })
          }
          break
      }
    },
    [currentStep, addMessage]
  )

  return {
    messages,
    currentStep,
    triageData,
    isAnalyzing,
    handleUserResponse,
    addMessage,
  }
}
