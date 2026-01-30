'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, User } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/lib/anonymous-session.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn('flex gap-3', !isAssistant && 'flex-row-reverse')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isAssistant && 'bg-gradient-to-br from-blue-500 to-indigo-500')}>
        <AvatarFallback className={cn(isAssistant && 'bg-transparent')}>
          {isAssistant ? (
            <Bot className="h-4 w-4 text-white" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-1 max-w-[80%]', !isAssistant && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isAssistant
              ? 'bg-muted'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground px-2">
          {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
        </span>
      </div>
    </div>
  )
}
