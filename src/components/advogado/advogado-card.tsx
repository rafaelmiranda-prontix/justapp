import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Star, Award, Video } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ContactAdvogadoDialog } from '@/components/advogado/contact-advogado-dialog'

interface AdvogadoCardProps {
  id: string
  nome: string
  foto: string | null
  bio: string | null
  cidade: string
  estado: string
  especialidades: string[]
  precoConsulta: number | null
  aceitaOnline: boolean
  avaliacaoMedia: number
  totalAvaliacoes: number
  distanciaKm: number | null
  score: number
  casoId?: string
}

export function AdvogadoCard({
  id,
  nome,
  foto,
  bio,
  cidade,
  estado,
  especialidades,
  precoConsulta,
  aceitaOnline,
  avaliacaoMedia,
  totalAvaliacoes,
  distanciaKm,
  score,
  casoId,
}: AdvogadoCardProps) {
  // Pega as iniciais do nome para o avatar fallback
  const initials = nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={foto || undefined} alt={nome} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg truncate">{nome}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {cidade}, {estado}
                  </span>
                  {distanciaKm && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {distanciaKm} km
                    </span>
                  )}
                </div>
              </div>

              {/* Score Badge */}
              <Badge variant="secondary" className="shrink-0">
                <Award className="h-3 w-3 mr-1" />
                {score}% match
              </Badge>
            </div>

            {/* Avaliação */}
            {totalAvaliacoes > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{avaliacaoMedia.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Bio */}
        {bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
        )}

        {/* Especialidades */}
        <div className="flex flex-wrap gap-2">
          {especialidades.slice(0, 3).map((esp) => (
            <Badge key={esp} variant="outline" className="text-xs">
              {esp}
            </Badge>
          ))}
          {especialidades.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{especialidades.length - 3}
            </Badge>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm">
          {aceitaOnline && (
            <div className="flex items-center gap-1 text-green-600">
              <Video className="h-4 w-4" />
              <span>Online</span>
            </div>
          )}
          {precoConsulta && (
            <div className="text-muted-foreground">
              Consulta: {formatCurrency(precoConsulta)}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href={`/advogados/${id}`}>Ver Perfil</Link>
        </Button>
        <ContactAdvogadoDialog
          advogadoId={id}
          advogadoNome={nome}
          casoId={casoId}
        />
      </CardFooter>
    </Card>
  )
}
