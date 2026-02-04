'use client'

import { ChatContainer } from '@/components/chat/chat-container'
import { ChatInput } from '@/components/chat/chat-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaseChat } from '@/hooks/use-case-chat'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoCasoPage() {
  const {
    messages,
    isAnalyzing,
    handleUserResponse,
    currentStep,
    triageData,
    handleSubmitCase,
  } = useCaseChat()

  return (
    <div className="container max-w-4xl py-8">
      <Link
        href="/cidadao/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <CardTitle>Descreva seu caso</CardTitle>
          <p className="text-sm text-muted-foreground">
            Responda algumas perguntas para encontrarmos o advogado ideal
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          <ChatContainer
            messages={messages}
            className="flex-1 min-h-0"
            showSubmitForm={currentStep === 'confirmation'}
            onSubmitCase={handleSubmitCase}
            extractedData={{
              cidade: undefined, // Pode ser extraído do perfil do usuário
              estado: undefined,
            }}
          />

          {currentStep !== 'confirmation' && currentStep !== 'completed' && (
            <div className="flex-shrink-0 p-4 border-t bg-muted/50">
              <ChatInput
                onSend={handleUserResponse}
                disabled={isAnalyzing}
                placeholder={
                  isAnalyzing
                    ? 'Analisando sua resposta...'
                    : 'Digite sua resposta...'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicador de progresso */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>💬 Suas informações estão seguras e serão compartilhadas apenas com advogados selecionados</p>
      </div>
    </div>
  )
}
