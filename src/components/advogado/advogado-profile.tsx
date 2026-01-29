'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RatingStars } from '@/components/avaliacoes/rating-stars'
import { AdvogadoAvaliacoes } from './advogado-avaliacoes'
import { formatOAB, formatCurrency } from '@/lib/utils'
import {
  MapPin,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Scale,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ContactAdvogadoDialog } from './contact-advogado-dialog'

interface AdvogadoProfileProps {
  advogado: {
    id: string
    nome: string
    foto: string | null
    bio: string | null
    oab: string
    oabVerificado: boolean
    cidade: string
    estado: string
    especialidades: Array<{
      id: string
      nome: string
      slug: string
    }>
    precoConsulta: number | null
    aceitaOnline: boolean
    avaliacaoMedia: number
    totalAvaliacoes: number
    createdAt: string
  }
}

export function AdvogadoProfile({ advogado }: AdvogadoProfileProps) {
  const { data: session } = useSession()
  const isCidadao = session?.user?.role === 'CIDADAO'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={advogado.foto || undefined} alt={advogado.nome} />
              <AvatarFallback className="text-2xl">
                {getInitials(advogado.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{advogado.nome}</h1>
                  {advogado.oabVerificado && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      OAB Verificada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
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

              {/* Rating */}
              {advogado.totalAvaliacoes > 0 && (
                <div className="flex items-center gap-4">
                  <RatingStars rating={advogado.avaliacaoMedia} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    {advogado.avaliacaoMedia.toFixed(1)} ({advogado.totalAvaliacoes}{' '}
                    {advogado.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </div>
              )}

              {/* Especialidades */}
              <div className="flex flex-wrap gap-2">
                {advogado.especialidades.map((especialidade) => (
                  <Badge key={especialidade.id} variant="outline">
                    {especialidade.nome}
                  </Badge>
                ))}
              </div>

              {/* Info adicional */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {advogado.precoConsulta && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(advogado.precoConsulta)}/consulta
                  </span>
                )}
                {advogado.aceitaOnline && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Atende online
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Membro desde {new Date(advogado.createdAt).getFullYear()}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            {isCidadao && (
              <div className="flex items-start">
                <ContactAdvogadoDialog
                  advogadoId={advogado.id}
                  advogadoNome={advogado.nome}
                  trigger={
                    <Button size="lg">
                      Solicitar Contato
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {advogado.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">{advogado.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Avaliações */}
      <AdvogadoAvaliacoes advogadoId={advogado.id} />
    </div>
  )
}
