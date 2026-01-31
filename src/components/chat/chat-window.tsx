'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Message {
  id: string
  remetenteId: string
  conteudo: string
  anexoUrl?: string | null
  createdAt: Date | string
  lida: boolean
}

interface ChatWindowProps {
  matchId: string
  currentUserId: string
  otherUser: {
    name: string
    image?: string | null
  }
  onClose?: () => void
}

export function ChatWindow({ matchId, currentUserId, otherUser, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar mensagens
  useEffect(() => {
    loadMessages()
    // TODO: Setup polling ou WebSocket para atualização em tempo real
    const interval = setInterval(loadMessages, 5000) // Poll a cada 5 segundos
    return () => clearInterval(interval)
  }, [matchId])

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${matchId}/messages`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data.mensagens)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 20MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && !selectedFile) || isSending) return

    setIsSending(true)

    try {
      let anexoUrl: string | undefined

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('matchId', matchId) // Passar matchId para upload em bucket privado

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadResponse.json()
        setIsUploading(false)

        if (!uploadData.success) {
          alert(uploadData.error || 'Erro ao fazer upload do arquivo')
          setIsSending(false)
          return
        }

        anexoUrl = uploadData.data.url
      }

      // Send message
      const response = await fetch(`/api/chat/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: newMessage.trim() || '📎 Arquivo anexado',
          anexoUrl,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [...prev, data.data])
        setNewMessage('')
        handleRemoveFile()
      } else {
        alert(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherUser.image || undefined} />
          <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Envie a primeira mensagem para iniciar a conversa!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.remetenteId === currentUserId
              const messageDate =
                typeof message.createdAt === 'string'
                  ? new Date(message.createdAt)
                  : message.createdAt

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8">
                    {!isOwn && <AvatarImage src={otherUser.image || undefined} />}
                    <AvatarFallback className={isOwn ? 'bg-primary text-primary-foreground' : ''}>
                      {isOwn ? 'Você' : getInitials(otherUser.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1`}>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.conteudo}</p>
                      {message.anexoUrl && (
                        <a
                          href={message.anexoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline mt-2 block"
                        >
                          Ver anexo
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(messageDate, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isSending || isUploading}
            maxLength={5000}
          />
          <Button
            type="submit"
            disabled={isSending || isUploading || (!newMessage.trim() && !selectedFile)}
          >
            {isSending || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
