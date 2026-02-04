'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage, type ChatMessageProps } from './chat-message'
import { CaseSubmitForm } from './case-submit-form'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  messages: ChatMessageProps[]
  className?: string
  showSubmitForm?: boolean
  onSubmitCase?: (data: { cidade: string; estado: string }) => Promise<void>
  extractedData?: {
    cidade?: string
    estado?: string
  }
}

export function ChatContainer({
  messages,
  className,
  showSubmitForm = false,
  onSubmitCase,
  extractedData,
}: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para o final quando novas mensagens chegam ou formulário aparece
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showSubmitForm])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 space-y-4',
        className
      )}
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Olá! 👋</p>
            <p className="text-sm">
              Conte-me sobre seu problema jurídico para encontrarmos o advogado ideal
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
          
          {/* Formulário de envio de caso */}
          {showSubmitForm && onSubmitCase && (
            <div className="pt-2">
              <CaseSubmitForm
                onSubmit={onSubmitCase}
                extractedData={extractedData}
              />
            </div>
          )}
          
          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
}
