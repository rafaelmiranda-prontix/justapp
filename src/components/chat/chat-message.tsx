import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessageProps {
  role: MessageRole
  content: string
  timestamp?: Date
  audioUrl?: string
}

export function ChatMessage({ role, content, timestamp, audioUrl }: ChatMessageProps) {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('flex gap-3 mb-4 min-w-0', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary' : 'bg-secondary'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1 min-w-0 flex-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[80%] rounded-2xl px-4 py-2 min-w-0',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {audioUrl && (
            <div className="mb-2">
              <audio controls className="w-full max-w-xs" src={audioUrl}>
                Seu navegador não suporta áudio.
              </audio>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{content}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">
            {timestamp.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}
