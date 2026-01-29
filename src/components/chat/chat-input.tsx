'use client'

import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = 2000,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed || isLoading || disabled) return

    setIsLoading(true)
    try {
      await onSend(trimmed)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const remainingChars = maxLength - message.length
  const isNearLimit = remainingChars < 100

  return (
    <div className="space-y-2">
      {isNearLimit && (
        <div className="text-xs text-muted-foreground text-right">
          {remainingChars} caracteres restantes
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[60px] max-h-[200px] resize-none',
            isNearLimit && 'border-yellow-500'
          )}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </p>
    </div>
  )
}
