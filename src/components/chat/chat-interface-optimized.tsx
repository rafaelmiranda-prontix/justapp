'use client'

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/ui/file-upload'
import { Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'

interface Message {
  id: string
  conteudo: string
  anexoUrl: string | null
  lido: boolean
  criadoEm: string
  remetente: {
    id: string
    name: string
    image: string | null
  }
}

interface ChatInterfaceProps {
  matchId: string
  currentUserId: string
  otherUserName: string
  otherUserImage: string | null
}

// Componente de mensagem individual memoizado
const ChatMessage = memo(
  ({
    message,
    isCurrentUser,
    getInitials,
  }: {
    message: Message
    isCurrentUser: boolean
    getInitials: (name: string) => string
  }) => {
    return (
      <div className={cn('flex gap-2', isCurrentUser ? 'justify-end' : '')}>
        {!isCurrentUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.remetente.image || undefined} alt={message.remetente.name} />
            <AvatarFallback className="text-xs">{getInitials(message.remetente.name)}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            'max-w-[70%] rounded-lg px-4 py-2',
            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.conteudo}</p>
          {message.anexoUrl && (
            <a
              href={message.anexoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline mt-1 block"
            >
              Ver anexo
            </a>
          )}
          <p
            className={cn(
              'text-xs mt-1',
              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatDistanceToNow(new Date(message.criadoEm), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        {isCurrentUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.remetente.image || undefined} alt={message.remetente.name} />
            <AvatarFallback className="text-xs">{getInitials(message.remetente.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }
)

ChatMessage.displayName = 'ChatMessage'

export function ChatInterfaceOptimized({
  matchId,
  currentUserId,
  otherUserName,
  otherUserImage,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Hook de mensagens em tempo real com WebSocket
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    loadMore,
    markAsRead,
    typingUsers,
    startTyping,
    stopTyping,
  } = useRealtimeMessages(matchId, currentUserId)

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Marcar mensagens como lidas quando o chat é aberto/atualizado
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      markAsRead()
    }
  }, [messages.length, isLoading, markAsRead])

  // Função memoizada para obter iniciais
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }, [])

  // Handler de envio de mensagem
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!newMessage.trim() || isSending) return

      // Validação de tamanho
      if (newMessage.length > 2000) {
        toast({
          title: 'Mensagem muito longa',
          description: 'A mensagem deve ter no máximo 2000 caracteres',
          variant: 'destructive',
        })
        return
      }

      setIsSending(true)
      stopTyping()

      try {
        await sendMessage(newMessage, attachmentUrl)
        setNewMessage('')
        setAttachmentUrl(null)
      } catch (error) {
        console.error('Error sending message:', error)
        toast({
          title: 'Erro ao enviar mensagem',
          description: 'Tente novamente',
          variant: 'destructive',
        })
      } finally {
        setIsSending(false)
      }
    },
    [newMessage, isSending, attachmentUrl, sendMessage, stopTyping, toast]
  )

  // Handler de tecla pressionada
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(e)
      }
    },
    [handleSendMessage]
  )

  // Handler de mudança no input (para indicador de digitação)
  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value)

      // Iniciar indicador de digitação
      if (e.target.value.trim()) {
        startTyping()
      } else {
        stopTyping()
      }
    },
    [startTyping, stopTyping]
  )

  // Indicador de digitação memoizado
  const typingIndicator = useMemo(() => {
    if (typingUsers.size > 0) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
          <span className="flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
              •
            </span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
              •
            </span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
              •
            </span>
          </span>
          <span>{otherUserName} está digitando...</span>
        </div>
      )
    }
    return null
  }, [typingUsers.size, otherUserName])

  if (error) {
    return (
      <Card className="flex flex-col h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-destructive mb-2">Erro ao carregar chat</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUserImage || undefined} alt={otherUserName} />
            <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{otherUserName}</CardTitle>
            <Badge variant="secondary" className="text-xs mt-1">
              Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : '')}>
                <Skeleton className="h-16 w-64" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-muted-foreground mb-2">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground">
                Envie a primeira mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Botão carregar mais */}
            {hasMore && messages.length > 0 && (
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="text-xs"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mensagens anteriores'
                  )}
                </Button>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.remetente.id === currentUserId}
                getInitials={getInitials}
              />
            ))}
            {typingIndicator}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter className="border-t p-4">
        <div className="w-full space-y-2">
          {attachmentUrl && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
              <span className="flex-1 truncate">Anexo adicionado</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAttachmentUrl(null)}>
                Remover
              </Button>
            </div>
          )}

          <FileUpload
            onUploadComplete={(url) => setAttachmentUrl(url)}
            onUploadError={(error) =>
              toast({ title: 'Erro', description: error, variant: 'destructive' })
            }
            disabled={isSending}
          />

          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Textarea
              value={newMessage}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="min-h-[60px] max-h-[120px] resize-none"
              maxLength={2000}
              disabled={isSending}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">{newMessage.length}/2000 caracteres</p>
        </div>
      </CardFooter>
    </Card>
  )
}
