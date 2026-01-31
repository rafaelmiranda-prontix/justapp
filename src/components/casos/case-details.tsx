'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/utils'
import { Clock, MapPin, AlertCircle, MessageSquare, User, Bot } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
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
        email?: string
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
                  {caso.cidadaos.users.email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {caso.cidadaos.users.email}
                    </p>
                  )}
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
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
