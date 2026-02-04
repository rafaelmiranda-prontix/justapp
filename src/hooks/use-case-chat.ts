'use client'

import { useState, useCallback } from 'react'
import type { ChatMessageProps } from '@/components/chat/chat-message'

export type TriageStep =
  | 'greeting'
  | 'description'
  | 'date'
  | 'evidence'
  | 'attempted_resolution'
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
        'Olá! Sou seu assistente JustApp. Vou te ajudar a encontrar o advogado ideal para o seu caso.\n\nPara começar, conte com suas palavras o que aconteceu.',
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
              'Ótimo! Baseado no que você me contou, vou buscar advogados especializados na sua região que podem ajudar com seu caso.\n\nPosso enviar seu caso para eles?',
          })
          setCurrentStep('confirmation')
          break

        case 'confirmation':
          // Não processa resposta de texto na etapa de confirmação
          // O formulário aparece e o usuário preenche cidade/estado
          break
      }
    },
    [currentStep, addMessage]
  )

  const handleSubmitCase = useCallback(
    async (data: { cidade: string; estado: string }) => {
      try {
        // Coletar URLs de áudio das mensagens
        const audioUrls = messages
          .filter((m) => m.role === 'user' && m.audioUrl)
          .map((m) => m.audioUrl!)
          .slice(0, 4) // Limitar a 4 URLs

        const response = await fetch('/api/casos/create-and-distribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: triageData.description,
            date: triageData.date,
            hasEvidence: triageData.hasEvidence,
            attemptedResolution: triageData.attemptedResolution,
            especialidadeId: triageData.especialidadeId,
            urgencia: triageData.urgencia,
            cidade: data.cidade,
            estado: data.estado,
            audioUrls,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar caso')
        }

        // Adicionar mensagem de sucesso
        addMessage({
          role: 'assistant',
          content: `✅ Caso registrado com sucesso!\n\nEncontramos ${result.data.matchesCreated} advogado(s) compatível(is) com seu caso. Eles serão notificados e entrarão em contato em breve.`,
        })

        setCurrentStep('completed')

        // Redirecionar para dashboard após 3 segundos
        setTimeout(() => {
          window.location.href = '/cidadao/dashboard'
        }, 3000)
      } catch (error: any) {
        addMessage({
          role: 'assistant',
          content: `❌ Erro ao criar caso: ${error.message || 'Tente novamente mais tarde.'}`,
        })
        throw error
      }
    },
    [triageData, messages, addMessage]
  )

  return {
    messages,
    currentStep,
    triageData,
    isAnalyzing,
    handleUserResponse,
    handleSubmitCase,
    addMessage,
  }
}
