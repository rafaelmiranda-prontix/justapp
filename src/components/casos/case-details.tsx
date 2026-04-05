'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Clock, MapPin, AlertCircle, MessageSquare, User, Bot, Play, Pause, Scale } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  audioUrl?: string
}

export type CaseLawyerChatInfo = {
  matchId: string
  advogadoNome: string
  status: string
  messageCount: number
}

interface CaseDetailsProps {
  caso: {
    id: string
    descricao: string
    descricaoIA?: string | null
    conversaHistorico?: Message[] | null
    urgencia: string
    status: string
    createdAt: string
    especialidades?: {
      nome: string
    } | null
    cidadaos: {
      users: {
        name: string
        // Email e outros dados sensíveis não são compartilhados
      }
      cidade?: string | null
      estado?: string | null
    }
  }
  showCidadaoInfo?: boolean // Se deve mostrar info do cidadão (apenas para advogado)
  /** Quando definido (ex.: tela do cidadão), mostra resumo do chat com advogados no topo */
  lawyerChats?: CaseLawyerChatInfo[]
}

const urgenciaColors = {
  BAIXA: 'bg-blue-500',
  NORMAL: 'bg-yellow-500',
  ALTA: 'bg-orange-500',
  URGENTE: 'bg-red-500',
}

const statusLabels: Record<string, string> = {
  PENDENTE_ATIVACAO: 'Pendente de Ativação',
  ABERTO: 'Aberto',
  EM_MEDIACAO: 'Em mediação',
  EM_ANDAMENTO: 'Em Andamento',
  EM_NEGOCIACAO: 'Em Negociação',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

// Componente para exibir mensagem com áudio
function MessageWithAudio({ message, isUser }: { message: Message; isUser: boolean }) {
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

  if (message.audioUrl) {
    return (
      <div className="flex items-center gap-3 min-w-[200px]">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlay}
          className={`h-10 w-10 rounded-full shrink-0 ${
            isUser
              ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
              : 'bg-primary/10 hover:bg-primary/20 text-primary'
          }`}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`flex-1 h-1 rounded-full overflow-hidden ${
                isUser ? 'bg-primary-foreground/20' : 'bg-primary/20'
              }`}
            >
              <div
                className={`h-full transition-all ${
                  isUser ? 'bg-primary-foreground/50' : 'bg-primary/50'
                }`}
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span
              className={`text-xs font-mono min-w-[40px] ${
                isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}
            >
              {formatTime(currentTime)}
            </span>
          </div>
          {message.content && message.content !== '🎤 Mensagem de áudio' && (
            <p
              className={`text-xs italic line-clamp-1 ${
                isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}
            >
              &quot;{message.content}&quot;
            </p>
          )}
        </div>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
}

function normalizeConversaHistorico(
  value: Message[] | { messages?: Message[] } | string | null | undefined
): Message[] {
  if (value == null) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as { messages?: Message[] } | Message[]
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { messages?: Message[] }).messages)) {
        return (parsed as { messages: Message[] }).messages
      }
    } catch {
      return []
    }
    return []
  }
  if (typeof value === 'object' && Array.isArray((value as { messages?: Message[] }).messages)) {
    return (value as { messages: Message[] }).messages
  }
  return []
}

export function CaseDetails({ caso, showCidadaoInfo = false, lawyerChats }: CaseDetailsProps) {
  const conversaHistorico = normalizeConversaHistorico(caso.conversaHistorico)

  return (
    <div className="space-y-6">
      {/* Header com informações principais */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Detalhes do Caso</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${urgenciaColors[caso.urgencia as keyof typeof urgenciaColors]}`} />
                  Urgência: {caso.urgencia}
                </Badge>
                <Badge variant="secondary">{statusLabels[caso.status]}</Badge>
                {caso.especialidades && (
                  <Badge variant="outline">{caso.especialidades.nome}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações básicas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Criado em {formatDate(new Date(caso.createdAt))}
            </div>
            {caso.cidadaos.cidade && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {caso.cidadaos.cidade}, {caso.cidadaos.estado}
              </div>
            )}
          </div>

          {/* Informações do cidadão (apenas para advogado) */}
          {showCidadaoInfo && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Nome:</span> {caso.cidadaos.users.name}
                  </p>
                  {/* Email e outros dados de contato não são compartilhados com o advogado */}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {lawyerChats !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Chat com advogados do caso
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversa direta com o advogado após ele aceitar o caso. É diferente do suporte da plataforma.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {lawyerChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há chat com advogado neste caso. Quando um advogado aceitar sua proposta, o chat será
                liberado e você poderá enviar e receber mensagens.
              </p>
            ) : (
              <ul className="space-y-3">
                {lawyerChats.map((chat) => (
                  <li
                    key={chat.matchId}
                    className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Scale className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{chat.advogadoNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {chat.messageCount > 0
                            ? `Já há ${chat.messageCount} mensagem${chat.messageCount === 1 ? '' : 'es'} nesta conversa.`
                            : 'Nenhuma mensagem ainda nesta conversa.'}
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="shrink-0 w-full sm:w-auto">
                      <Link href={`/chat/${chat.matchId}`}>
                        {chat.messageCount > 0 ? 'Abrir conversa' : 'Ir ao chat'}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Descrição do problema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Descrição do Problema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{caso.descricao}</p>
        </CardContent>
      </Card>

      {/* Análise da IA (se existir) */}
      {caso.descricaoIA && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Análise Inicial (IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {caso.descricaoIA}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Histórico da conversa */}
      {conversaHistorico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Histórico da Conversa Inicial
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversa entre o cliente e o assistente virtual antes do cadastro
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {conversaHistorico.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'assistant'
                            ? 'bg-muted'
                            : 'bg-muted/50 text-muted-foreground text-xs italic'
                      }`}
                    >
                      <MessageWithAudio message={msg} isUser={msg.role === 'user'} />
                      {msg.timestamp && (
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'opacity-70' : 'opacity-70'}`}>
                          {(() => {
                            try {
                              const date = typeof msg.timestamp === 'string' 
                                ? new Date(msg.timestamp) 
                                : msg.timestamp && typeof msg.timestamp === 'object' && 'getTime' in msg.timestamp
                                  ? new Date(msg.timestamp as any)
                                  : new Date()
                              return date.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            } catch {
                              return ''
                            }
                          })()}
                        </p>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
