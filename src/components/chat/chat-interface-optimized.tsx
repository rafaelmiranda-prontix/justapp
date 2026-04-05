'use client'

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/ui/file-upload'
import { Send, Loader2, Pencil } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRealtimeMessages, type ChatMatchMessage } from '@/hooks/use-realtime-messages'

function canEditInWindow(m: ChatMatchMessage, currentUserId: string, windowMinutes: number) {
  if (m.remetente.id !== currentUserId) return false
  if (m.id.startsWith('temp-')) return false
  const deadline = new Date(m.createdAt).getTime() + windowMinutes * 60 * 1000
  return Date.now() <= deadline
}

interface ChatInterfaceProps {
  matchId: string
  currentUserId: string
  currentUserName: string
  currentUserImage: string | null
  otherUserName: string
  otherUserImage: string | null
}

// Componente de mensagem individual memoizado
const ChatMessage = memo(
  ({
    message,
    isCurrentUser,
    getInitials,
    currentUserId,
    editWindowMinutes,
    editingId,
    editDraft,
    onDraftChange,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    savingEdit,
  }: {
    message: ChatMatchMessage
    isCurrentUser: boolean
    getInitials: (name: string) => string
    currentUserId: string
    editWindowMinutes: number
    editingId: string | null
    editDraft: string
    onDraftChange: (v: string) => void
    onStartEdit: (m: ChatMatchMessage) => void
    onCancelEdit: () => void
    onSaveEdit: (messageId: string) => void
    savingEdit: boolean
  }) => {
    const showEdit =
      isCurrentUser && canEditInWindow(message, currentUserId, editWindowMinutes) && editingId !== message.id
    const isEditing = editingId === message.id

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
          {isEditing ? (
            <div
              className="space-y-2 rounded-md border border-border bg-background p-2 text-foreground shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Textarea
                value={editDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                className="min-h-[72px] text-sm bg-background"
                maxLength={2000}
                disabled={savingEdit}
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" disabled={savingEdit} onClick={onCancelEdit}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={savingEdit || !editDraft.trim()}
                  onClick={() => onSaveEdit(message.id)}
                >
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.conteudo}</p>
          )}
          {!isEditing && message.anexoUrl && (
            <a
              href={message.anexoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline mt-1 block"
            >
              Ver anexo
            </a>
          )}
          <div
            className={cn(
              'text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1',
              isEditing ? 'hidden' : '',
              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            <span>
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {message.isEdited && (
              <span className="opacity-90">
                · Editado
                {message.editedAt
                  ? ` ${formatDistanceToNow(new Date(message.editedAt), { addSuffix: true, locale: ptBR })}`
                  : ''}
              </span>
            )}
            {showEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-6 px-1.5 text-xs',
                  isCurrentUser && 'text-primary-foreground hover:bg-primary-foreground/10'
                )}
                onClick={() => onStartEdit(message)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            )}
          </div>
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
  currentUserName,
  currentUserImage,
  otherUserName,
  otherUserImage,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Debug: Log quando selectedFile mudar
  useEffect(() => {
    const canSend = !isSending && !isUploading && (!!newMessage.trim() || !!selectedFile)
    console.log('[Chat] State update:', {
      selectedFile: selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : 'null',
      selectedFileExists: !!selectedFile,
      newMessage: newMessage.trim() || 'empty',
      isSending,
      isUploading,
      canSend,
      buttonDisabled: !canSend,
      buttonShouldBeEnabled: canSend,
    })
  }, [selectedFile, newMessage, isSending, isUploading])

  // Hook de mensagens em tempo real com WebSocket
  const {
    messages,
    editWindowMinutes,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    editMessageContent,
    loadMore,
    markAsRead,
    typingUsers,
    startTyping,
    stopTyping,
  } = useRealtimeMessages(matchId, currentUserId, currentUserName, currentUserImage)

  const handleSaveEdit = useCallback(
    async (messageId: string) => {
      const trimmed = editDraft.trim()
      if (!trimmed) return
      setSavingEdit(true)
      try {
        await editMessageContent(messageId, trimmed)
        setEditingId(null)
        setEditDraft('')
      } catch (e) {
        toast({
          title: 'Não foi possível editar',
          description: e instanceof Error ? e.message : 'Tente novamente',
          variant: 'destructive',
        })
      } finally {
        setSavingEdit(false)
      }
    },
    [editDraft, editMessageContent, toast]
  )

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

      // Permitir enviar se tiver mensagem OU arquivo
      if ((!newMessage.trim() && !selectedFile) || isSending || isUploading) return

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
        let finalAttachmentUrl: string | null = attachmentUrl

        // Se houver arquivo selecionado, fazer upload primeiro
        if (selectedFile) {
          setIsUploading(true)
          try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('matchId', matchId)

            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })

            const uploadResult = await uploadRes.json()

            if (!uploadRes.ok) {
              throw new Error(uploadResult.error || 'Erro ao fazer upload')
            }

            if (!uploadResult.data?.url) {
              throw new Error('URL do anexo não foi retornada pelo servidor')
            }

            finalAttachmentUrl = uploadResult.data.url
            console.log('[Chat] Upload successful, URL:', finalAttachmentUrl)
            setAttachmentUrl(finalAttachmentUrl)
          } catch (error) {
            console.error('[Chat] Error uploading file:', error)
            toast({
              title: 'Erro ao fazer upload',
              description: error instanceof Error ? error.message : 'Tente novamente',
              variant: 'destructive',
            })
            setIsSending(false)
            setIsUploading(false)
            return
          } finally {
            setIsUploading(false)
          }
        }

        // Enviar mensagem (com ou sem anexo)
        const messageContent = newMessage.trim() || (finalAttachmentUrl ? '📎 Arquivo anexado' : '')
        
        console.log('[Chat] Sending message:', {
          content: messageContent,
          attachmentUrl: finalAttachmentUrl,
          hasAttachment: !!finalAttachmentUrl,
        })
        
        await sendMessage(messageContent, finalAttachmentUrl)
        
        // Limpar estados após envio bem-sucedido
        setNewMessage('')
        setAttachmentUrl(null)
        setSelectedFile(null)
        
        // Limpar o input de arquivo também
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
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
    [newMessage, isSending, isUploading, selectedFile, attachmentUrl, matchId, sendMessage, stopTyping, toast]
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
                currentUserId={currentUserId}
                editWindowMinutes={editWindowMinutes}
                editingId={editingId}
                editDraft={editDraft}
                onDraftChange={setEditDraft}
                onStartEdit={(m) => {
                  setEditingId(m.id)
                  setEditDraft(m.conteudo)
                }}
                onCancelEdit={() => {
                  setEditingId(null)
                  setEditDraft('')
                }}
                onSaveEdit={(id) => void handleSaveEdit(id)}
                savingEdit={savingEdit}
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
            matchId={matchId}
            selectedFile={selectedFile}
            controlled={true}
            onFileSelect={(file) => {
              console.log('[Chat] onFileSelect called with file:', file.name, file.size)
              console.log('[Chat] Current selectedFile before update:', selectedFile?.name || 'null')
              setSelectedFile(file)
              console.log('[Chat] setSelectedFile called, should trigger re-render')
              setAttachmentUrl(null) // Limpar URL anterior quando novo arquivo é selecionado
            }}
            onClear={() => {
              console.log('[Chat] File cleared')
              setSelectedFile(null)
              setAttachmentUrl(null)
            }}
            onUploadError={(error) =>
              toast({ title: 'Erro', description: error, variant: 'destructive' })
            }
            disabled={isSending || isUploading}
          />
          
          {/* Debug: Mostrar estado do arquivo selecionado */}
          {process.env.NODE_ENV === 'development' && selectedFile && (
            <div className="text-xs text-muted-foreground">
              Arquivo selecionado: {selectedFile.name} ({selectedFile.size} bytes)
            </div>
          )}

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
              <Button 
                type="submit" 
                size="icon" 
                disabled={(() => {
                  const shouldDisable = isSending || isUploading || (!newMessage.trim() && !selectedFile)
                  console.log('[Chat] Button disabled check:', {
                    isSending,
                    isUploading,
                    hasMessage: !!newMessage.trim(),
                    hasFile: !!selectedFile,
                    shouldDisable,
                  })
                  return shouldDisable
                })()}
                title={
                  isSending || isUploading 
                    ? 'Enviando...' 
                    : selectedFile 
                    ? `Enviar mensagem com anexo: ${selectedFile.name}` 
                    : newMessage.trim() 
                    ? 'Enviar mensagem' 
                    : 'Digite uma mensagem ou anexe um arquivo'
                }
                className={selectedFile && !newMessage.trim() ? 'bg-primary hover:bg-primary/90' : ''}
              >
                {(isSending || isUploading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">{newMessage.length}/2000 caracteres</p>
        </div>
      </CardFooter>
    </Card>
  )
}
