'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Clock, MapPin, AlertCircle, MessageSquare, User, Bot, Play, Pause } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  audioUrl?: string
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
              "{message.content}"
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

export function CaseDetails({ caso, showCidadaoInfo = false }: CaseDetailsProps) {
  const conversaHistorico = caso.conversaHistorico as Message[] | null

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
      {conversaHistorico && conversaHistorico.length > 0 && (
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
                                : msg.timestamp instanceof Date 
                                  ? msg.timestamp 
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
