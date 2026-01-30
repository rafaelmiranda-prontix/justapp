'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RatingStars } from '@/components/avaliacoes/rating-stars'
import { AvaliacaoCard } from '@/components/avaliacoes/avaliacao-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  createdAt: string | Date
  cidadaos: {
    users: {
      name: string
    }
  }
}

interface AvaliacaoStats {
  media: number
  total: number
  distribuicao: Array<{
    nota: number
    quantidade: number
    percentual: number
  }>
}

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [stats, setStats] = useState<AvaliacaoStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAvaliacoes()
  }, [page])

  const fetchAvaliacoes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/advogado/avaliacoes?page=${page}&limit=10`)
      const result = await res.json()

      if (result.success) {
        setAvaliacoes(result.data)
        setStats(result.stats)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
        <p className="text-muted-foreground">
          Veja todas as avaliações que você recebeu dos clientes
        </p>
      </div>

      {/* Estatísticas */}
      {isLoading ? (
        <Skeleton className="h-[200px] mb-6" />
      ) : stats && stats.total > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estatísticas de Avaliações</CardTitle>
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
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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
      ) : null}

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="text-center py-16">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {avaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{avaliacao.cidadaos.users.name}</p>
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
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
