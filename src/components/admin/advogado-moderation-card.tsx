'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, XCircle, MapPin, Scale, Star } from 'lucide-react'
import { formatOAB } from '@/lib/utils'

interface AdvogadoModerationCardProps {
  advogado: {
    id: string
    oab: string
    oabVerificado: boolean
    cidade: string
    estado: string
    createdAt: string
    users: {
      id: string
      name: string
      email: string
    }
    especialidades: Array<{
      especialidade: {
        nome: string
      }
    }>
    avaliacaoMedia: number
    totalAvaliacoes: number
  }
  onApprove: () => void
  onReject: () => void
}

export function AdvogadoModerationCard({
  advogado,
  onApprove,
  onReject,
}: AdvogadoModerationCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(advogado.users.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{advogado.users.name}</CardTitle>
              {advogado.oabVerificado ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  Pendente
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                {formatOAB(advogado.oab)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {advogado.cidade}, {advogado.estado}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Email:</p>
          <p className="text-sm text-muted-foreground">{advogado.users.email}</p>
        </div>

        {advogado.especialidades.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-2">
              {advogado.especialidades.map((esp, idx) => (
                <Badge key={idx} variant="outline">
                  {esp.especialidade.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {advogado.totalAvaliacoes > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {advogado.avaliacaoMedia.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({advogado.totalAvaliacoes}{' '}
              {advogado.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}

        {!advogado.oabVerificado && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onApprove}
              className="flex-1"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
            <Button
              onClick={onReject}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
