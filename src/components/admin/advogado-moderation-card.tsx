'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, MapPin, Scale, Star, UserCheck, CreditCard } from 'lucide-react'
import { formatOAB } from '@/lib/utils'

interface AdvogadoModerationCardProps {
  advogado: {
    id: string
    oab: string
    oabVerificado: boolean
    aprovado: boolean
    onboardingCompleted?: boolean
    plano?: string
    planoExpira?: string | null
    cidade: string
    estado: string
    createdAt: string
    users: {
      id: string
      name: string
      email: string
      status?: string
    }
    especialidades?: Array<{
      especialidade: {
        nome: string
      }
    }>
    avaliacaoMedia: number
    totalAvaliacoes: number
  }
  onApprove: () => void
  onReject: () => void
  onCompleteOnboarding?: () => void
  onUpdatePlan?: (plano: string) => void
}

export function AdvogadoModerationCard({
  advogado,
  onApprove,
  onReject,
  onCompleteOnboarding,
  onUpdatePlan,
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
              {advogado.aprovado ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  Pendente
                </Badge>
              )}
              {advogado.onboardingCompleted ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Onboarding Completo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  Onboarding Incompleto
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

        {advogado.especialidades && advogado.especialidades.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-2">
              {advogado.especialidades.map((esp, idx) => (
                <Badge key={idx} variant="outline">
                  {esp.especialidade?.nome || 'N/A'}
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

        {onUpdatePlan && (
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Plano Atual:</p>
                <Badge variant="outline" className="ml-auto">
                  {advogado.plano || 'FREE'}
                </Badge>
              </div>
              {advogado.planoExpira && (
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(advogado.planoExpira).toLocaleDateString('pt-BR')}
                </p>
              )}
              <Select
                value={advogado.plano || 'FREE'}
                onValueChange={(value) => {
                  if (value !== advogado.plano) {
                    if (confirm(`Alterar plano de ${advogado.plano || 'FREE'} para ${value}?`)) {
                      onUpdatePlan(value)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE - Gratuito</SelectItem>
                  <SelectItem value="BASIC">BASIC - Básico</SelectItem>
                  <SelectItem value="PREMIUM">PREMIUM - Premium</SelectItem>
                  <SelectItem value="UNLIMITED">UNLIMITED - Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!advogado.onboardingCompleted && onCompleteOnboarding && (
          <div className="pt-2 border-t">
            <Button
              onClick={onCompleteOnboarding}
              variant="default"
              className="w-full"
              size="sm"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Completar Onboarding
            </Button>
          </div>
        )}
        {!advogado.aprovado && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onApprove}
              className="flex-1"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar e Liberar
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
        {advogado.aprovado && (
          <div className="pt-2">
            <Button
              onClick={onReject}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Revogar Aprovação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
