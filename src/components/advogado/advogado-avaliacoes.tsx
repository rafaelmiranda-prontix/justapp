'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RatingStars } from '@/components/avaliacoes/rating-stars'
import { AvaliacaoList } from '@/components/avaliacoes/avaliacao-list'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AvaliacaoStats {
  media: number
  total: number
  distribuicao: Array<{
    nota: number
    quantidade: number
    percentual: number
  }>
}

interface AdvogadoAvaliacoesProps {
  advogadoId: string
}

export function AdvogadoAvaliacoes({ advogadoId }: AdvogadoAvaliacoesProps) {
  const [stats, setStats] = useState<AvaliacaoStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [advogadoId])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/advogados/${advogadoId}/avaliacoes?limit=1`)
      const result = await res.json()

      if (result.success && result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Skeleton className="h-[400px]" />
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.media.toFixed(1)}</div>
              <RatingStars rating={stats.media} size="lg" className="justify-center mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {stats.distribuicao
                .slice()
                .reverse()
                .map((item) => (
                  <div key={item.nota} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm">{item.nota}</span>
                      <RatingStars rating={1} maxRating={1} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.quantidade}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <AvaliacaoList advogadoId={advogadoId} />
        </CardContent>
      </Card>
    </div>
  )
}
