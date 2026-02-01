'use client'

import { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
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

interface Message {
  id: string
  conteudo: string
  anexoUrl: string | null
  lida: boolean
  createdAt: string
  remetente: {
    id: string
    name: string
    image: string | null
  }
}

interface ChatInterfaceProps {
  matchId: string
  currentUserId: string
  currentUserName: string
  currentUserImage: string | null
  otherUserName: string
  otherUserImage: string | null
}

// Componente de mensagem memoizado para evitar re-renders
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
            {formatDistanceToNow(new Date(message.createdAt), {
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

export function ChatInterfaceMVP({
  matchId,
  currentUserId,
  currentUserName,
  currentUserImage,
  otherUserName,
  otherUserImage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout>()
  const lastMessageIdRef = useRef<string | null>(null)
  const { toast } = useToast()

  // Função otimizada para buscar apenas mensagens novas
  const fetchNewMessages = useCallback(async () => {
    try {
      // Se temos mensagens, buscar apenas as novas
      const url = lastMessageIdRef.current
        ? `/api/matches/${matchId}/messages?after=${lastMessageIdRef.current}`
        : `/api/matches/${matchId}/messages?limit=50`

      const res = await fetch(url)
      const result = await res.json()

      if (result.success && result.data.length > 0) {
        setMessages((prev) => {
          // Evitar duplicatas
          const newMsgs = result.data.filter(
            (newMsg: Message) => !prev.some((msg) => msg.id === newMsg.id)
          )
          if (newMsgs.length === 0) return prev

          const updated = [...prev, ...newMsgs]
          // Atualizar last message ID
          if (updated.length > 0) {
            lastMessageIdRef.current = updated[updated.length - 1].id
          }
          return updated
        })
      }
    } catch (error) {
      console.error('Error fetching new messages:', error)
    }
  }, [matchId])

  // Buscar mensagens iniciais
  const fetchInitialMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/matches/${matchId}/messages?limit=50`)
      const result = await res.json()

      if (result.success) {
        setMessages(result.data)
        setHasMore(result.data.length === 50)

        if (result.data.length > 0) {
          lastMessageIdRef.current = result.data[result.data.length - 1].id
        }
      }
    } catch (error) {
      console.error('Error fetching initial messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [matchId])

  // Carregar mensagens mais antigas
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    try {
      setIsLoadingMore(true)
      const offset = messages.length
      const res = await fetch(`/api/matches/${matchId}/messages?limit=50&offset=${offset}`)
      const result = await res.json()

      if (result.success) {
        setMessages((prev) => [...result.data, ...prev])
        setHasMore(result.data.length === 50)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [matchId, messages.length, isLoadingMore, hasMore])

  // Configurar polling otimizado
  useEffect(() => {
    fetchInitialMessages()

    // OTIMIZAÇÃO: Polling a cada 5s (era 3s) e apenas busca mensagens novas
    pollingInterval.current = setInterval(fetchNewMessages, 5000)

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [fetchInitialMessages, fetchNewMessages])

  // Auto-scroll otimizado (apenas quando novas mensagens)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Memoizar função de iniciais
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }, [])

  // Handler de envio otimizado com Optimistic Update
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!newMessage.trim() || isSending) return

      if (newMessage.length > 2000) {
        toast({
          title: 'Mensagem muito longa',
          description: 'A mensagem deve ter no máximo 2000 caracteres',
          variant: 'destructive',
        })
        return
      }

      const messageContent = newMessage
      const messageAttachment = attachmentUrl

      // OPTIMISTIC UPDATE: Criar mensagem temporária
      const tempId = `temp-${Date.now()}`
      const optimisticMessage: Message = {
        id: tempId,
        conteudo: messageContent,
        anexoUrl: messageAttachment,
        lida: false,
        createdAt: new Date().toISOString(),
        remetente: {
          id: currentUserId,
          name: currentUserName,
          image: currentUserImage,
        },
      }

      // Limpar input e adicionar mensagem temporária IMEDIATAMENTE
      setNewMessage('')
      setAttachmentUrl(null)
      setMessages((prev) => [...prev, optimisticMessage])
      setIsSending(true)

      try {
        const res = await fetch(`/api/matches/${matchId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conteudo: messageContent,
            anexoUrl: messageAttachment,
          }),
        })

        const result = await res.json()

        if (result.success) {
          // Substituir mensagem temporária pela mensagem real do servidor
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempId ? result.data : msg))
          )
          lastMessageIdRef.current = result.data.id
        } else {
          // Remover mensagem temporária em caso de erro
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

          // Restaurar conteúdo no input
          setNewMessage(messageContent)
          setAttachmentUrl(messageAttachment)

          toast({
            title: 'Erro ao enviar',
            description: result.error || 'Tente novamente',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Error sending message:', error)

        // Remover mensagem temporária em caso de erro
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

        // Restaurar conteúdo no input
        setNewMessage(messageContent)
        setAttachmentUrl(messageAttachment)

        toast({
          title: 'Erro ao enviar',
          description: 'Verifique sua conexão',
          variant: 'destructive',
        })
      } finally {
        setIsSending(false)
      }
    },
    [newMessage, isSending, attachmentUrl, matchId, currentUserId, currentUserName, currentUserImage, toast]
  )

  // Handler de tecla otimizado
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(e)
      }
    },
    [handleSendMessage]
  )

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
            matchId={matchId}
            onUploadError={(error) =>
              toast({ title: 'Erro', description: error, variant: 'destructive' })
            }
            disabled={isSending}
          />

          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
