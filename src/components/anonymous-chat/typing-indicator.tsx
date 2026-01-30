'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-blue-500 to-indigo-500">
        <AvatarFallback className="bg-transparent">
          <Bot className="h-4 w-4 text-white" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-muted">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground px-2">Digitando...</span>
      </div>
    </div>
  )
}
