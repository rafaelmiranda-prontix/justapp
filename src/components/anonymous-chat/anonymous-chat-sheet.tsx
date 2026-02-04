'use client'

import { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bot, User as UserIcon, MoreVertical, RotateCcw } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/lib/anonymous-session.service'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'
import { TypingIndicator } from './typing-indicator'
import { LeadCaptureForm } from './lead-capture-form'

interface AnonymousChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: ChatMessageType[]
  onSendMessage: (message: string, audioUrl?: string) => Promise<void>
  isTyping: boolean
  sessionId?: string | null
  shouldCaptureLeadData?: boolean
  extractedData?: {
    especialidade?: string
    cidade?: string
    estado?: string
    score?: number
  }
  onSubmitLeadData?: (data: { name: string; email: string; phone?: string }) => Promise<void>
  onResetChat?: () => Promise<void>
}

export function AnonymousChatSheet({
  open,
  onOpenChange,
  messages,
  onSendMessage,
  isTyping,
  sessionId,
  shouldCaptureLeadData = false,
  extractedData,
  onSubmitLeadData,
  onResetChat,
}: AnonymousChatSheetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isResetting, setIsResetting] = useState(false)

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleReset = async () => {
    if (!onResetChat) return
    
    if (!confirm('Tem certeza que deseja reiniciar o chat? Todas as mensagens serão perdidas.')) {
      return
    }

    setIsResetting(true)
    try {
      await onResetChat()
    } catch (error) {
      console.error('Error resetting chat:', error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col"
        aria-describedby="chat-description"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500">
                <Bot className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-left">Assistente Legal</SheetTitle>
              <p id="chat-description" className="sr-only">
                Chat para conversar com o assistente JustApp e obter ajuda com questões legais
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Online agora</span>
                </div>
                {onResetChat && messages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        disabled={isResetting || isTyping}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Reiniciar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleReset}
                        disabled={isResetting || isTyping}
                        className="text-destructive focus:text-destructive"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {isResetting ? 'Reiniciando...' : 'Reiniciar chat'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Olá! Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Conte-me sobre sua situação jurídica e vou conectar você com advogados
                especializados.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isTyping && <TypingIndicator />}

              {/* Lead Capture Form */}
              {shouldCaptureLeadData && onSubmitLeadData && (
                <div className="pt-2">
                  <LeadCaptureForm
                    onSubmit={onSubmitLeadData}
                    extractedData={extractedData}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <ChatInput onSend={onSendMessage} disabled={isTyping} sessionId={sessionId || undefined} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
