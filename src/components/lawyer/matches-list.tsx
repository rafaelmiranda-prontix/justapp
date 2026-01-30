'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Match {
  id: string
  status: string
  score: number
  distanciaKm?: number | null
  enviadoEm: Date | string
  visualizadoEm?: Date | string | null
  respondidoEm?: Date | string | null
  expiresAt?: Date | string | null
  caso: {
    id: string
    descricao: string
    urgencia: string
    especialidade?: {
      nome: string
    } | null
    cidadao: {
      cidade?: string | null
      estado?: string | null
      user: {
        name: string
      }
    }
  }
}

interface MatchesListProps {
  matches: Match[]
  onAccept: (matchId: string) => Promise<void>
  onReject: (matchId: string) => Promise<void>
  onViewDetails: (match: Match) => void
  onOpenChat: (matchId: string) => void
}

export function MatchesList({
  matches,
  onAccept,
  onReject,
  onViewDetails,
  onOpenChat,
}: MatchesListProps) {
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any; icon: any }> = {
      PENDENTE: {
        label: 'Pendente',
        variant: 'secondary',
        icon: Clock,
      },
      VISUALIZADO: {
        label: 'Visualizado',
        variant: 'default',
        icon: Eye,
      },
      ACEITO: {
        label: 'Aceito',
        variant: 'success',
        icon: CheckCircle2,
      },
      RECUSADO: {
        label: 'Recusado',
        variant: 'destructive',
        icon: XCircle,
      },
      EXPIRADO: {
        label: 'Expirado',
        variant: 'outline',
        icon: AlertCircle,
      },
      CONTRATADO: {
        label: 'Contratado',
        variant: 'success',
        icon: CheckCircle2,
      },
    }

    const config = variants[status] || variants.PENDENTE
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getUrgencyColor = (urgencia: string) => {
    const colors: Record<string, string> = {
      BAIXA: 'text-green-600',
      NORMAL: 'text-blue-600',
      ALTA: 'text-orange-600',
      URGENTE: 'text-red-600',
    }
    return colors[urgencia] || 'text-gray-600'
  }

  const isExpiringSoon = (expiresAt?: Date | string | null) => {
    if (!expiresAt) return false
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
    const hoursLeft = (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    return hoursLeft > 0 && hoursLeft <= 6
  }

  const handleAccept = async (matchId: string) => {
    setLoadingMatchId(matchId)
    try {
      await onAccept(matchId)
    } finally {
      setLoadingMatchId(null)
    }
  }

  const handleReject = async (matchId: string) => {
    setLoadingMatchId(matchId)
    try {
      await onReject(matchId)
    } finally {
      setLoadingMatchId(null)
    }
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum caso encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(match.status)}
                  <Badge variant="outline" className="gap-1">
                    🎯 {match.score}% compatível
                  </Badge>
                  {match.distanciaKm && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.distanciaKm} km
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">
                  {match.caso.especialidade?.nome || 'Consulta Jurídica'}
                </CardTitle>
                <CardDescription>
                  <span className={getUrgencyColor(match.caso.urgencia)}>
                    Urgência: {match.caso.urgencia}
                  </span>
                  {' • '}
                  {match.caso.cidadao.cidade && match.caso.cidadao.estado && (
                    <>
                      {match.caso.cidadao.cidade}, {match.caso.cidadao.estado}
                    </>
                  )}
                </CardDescription>
              </div>

              {/* Expiration warning */}
              {isExpiringSoon(match.expiresAt) && match.status === 'PENDENTE' && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Expira em breve
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Case description */}
              <div>
                <p className="text-sm font-medium mb-1">Descrição do caso:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {match.caso.descricao}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Recebido{' '}
                  {formatDistanceToNow(
                    typeof match.enviadoEm === 'string'
                      ? new Date(match.enviadoEm)
                      : match.enviadoEm,
                    { addSuffix: true, locale: ptBR }
                  )}
                </span>
                {match.expiresAt && match.status === 'PENDENTE' && (
                  <span>
                    Expira em{' '}
                    {formatDistanceToNow(
                      typeof match.expiresAt === 'string'
                        ? new Date(match.expiresAt)
                        : match.expiresAt,
                      { locale: ptBR }
                    )}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {match.status === 'PENDENTE' || match.status === 'VISUALIZADO' ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAccept(match.id)}
                      disabled={loadingMatchId === match.id}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aceitar Caso
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(match.id)}
                      disabled={loadingMatchId === match.id}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Recusar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(match)}
                      className="ml-auto"
                    >
                      Ver Detalhes
                    </Button>
                  </>
                ) : match.status === 'ACEITO' || match.status === 'CONTRATADO' ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onOpenChat(match.id)}
                      className="gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Abrir Chat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(match)}
                      className="ml-auto"
                    >
                      Ver Detalhes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(match)}
                    className="ml-auto"
                  >
                    Ver Detalhes
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
