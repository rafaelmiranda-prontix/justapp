'use client'

import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeechRecorder } from '@/components/chat/speech-recorder'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTranscriptReady = async (transcript: string) => {
    if (transcript.trim()) {
      await onSend(transcript.trim())
    }
  }

  return (
    <div className="space-y-2">
      {/* Gravador de voz (aparece quando não há texto) */}
      {!message.trim() && (
        <SpeechRecorder
          onTranscriptReady={handleTranscriptReady}
          disabled={disabled || isSending}
        />
      )}

      {/* Input de texto */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite ou grave uma mensagem..."
          disabled={disabled || isSending}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        {/* Botão de enviar (só aparece quando há texto) */}
        {message.trim() && (
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isSending}
            size="icon"
            className="h-11 w-11 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
