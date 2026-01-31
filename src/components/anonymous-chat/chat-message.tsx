'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Bot, User, Play, Pause } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/lib/anonymous-session.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant'
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (message.audioUrl && audioRef.current) {
      audioRef.current.src = message.audioUrl
    }
  }, [message.audioUrl])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
          {message.audioUrl ? (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlay}
                className={cn(
                  'h-10 w-10 rounded-full shrink-0',
                  isAssistant
                    ? 'bg-white/10 hover:bg-white/20 text-foreground'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                )}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        isAssistant ? 'bg-foreground/30' : 'bg-white/50'
                      )}
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-mono min-w-[40px]', isAssistant ? 'text-muted-foreground' : 'text-white/80')}>
                    {formatTime(currentTime)}
                  </span>
                </div>
                {message.content && message.content !== '🎤 Mensagem de áudio' && (
                  <p className={cn('text-xs italic line-clamp-1', isAssistant ? 'text-muted-foreground' : 'text-white/80')}>
                    "{message.content}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-2">
          {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
        </span>
      </div>

      {/* Audio element (hidden) */}
      {message.audioUrl && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}
