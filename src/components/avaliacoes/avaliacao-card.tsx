'use client'

import { Card, CardContent } from '@/components/ui/card'
import { RatingStars } from './rating-stars'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AvaliacaoCardProps {
  avaliacao: {
    id: string
    nota: number
    comentario: string | null
    createdAt: string | Date
    cidadao: {
      user: {
        name: string
      }
    }
  }
}

export function AvaliacaoCard({ avaliacao }: AvaliacaoCardProps) {
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
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(avaliacao.cidadao.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{avaliacao.cidadao.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(avaliacao.createdAt)}
                </p>
              </div>
              <RatingStars rating={avaliacao.nota} size="sm" />
            </div>
            {avaliacao.comentario && (
              <p className="text-sm text-muted-foreground">{avaliacao.comentario}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
