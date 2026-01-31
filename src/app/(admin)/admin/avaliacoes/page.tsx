'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { RatingStars } from '@/components/avaliacoes/rating-stars'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  createdAt: string
  cidadao: {
    user: {
      name: string
      email: string
    }
  }
  advogado: {
    user: {
      name: string
    }
  }
}

export default function AdminAvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAvaliacoes()
  }, [])

  const fetchAvaliacoes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/avaliacoes')
      const result = await res.json()

      if (result.success) {
        setAvaliacoes(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar avaliações',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (avaliacaoId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta avaliação?')) {
      return
    }

    try {
      const res = await fetch(`/api/avaliacoes/${avaliacaoId}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Avaliação deletada com sucesso',
        })
        fetchAvaliacoes()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar avaliação',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Moderação de Avaliações</h1>
        <p className="text-muted-foreground">
          Revise e modere avaliações da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[150px]" />
            ))}
          </div>
        ) : avaliacoes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Cliente:</p>
                          <p className="text-sm text-muted-foreground">
                            {avaliacao.cidadao.user.name} ({avaliacao.cidadao.user.email})
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Advogado:</p>
                          <p className="text-sm text-muted-foreground">
                            {avaliacao.advogado.user.name}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Data:</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(avaliacao.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <RatingStars rating={avaliacao.nota} size="sm" />
                        <Badge variant="outline">{avaliacao.nota} estrelas</Badge>
                      </div>

                      {avaliacao.comentario && (
                        <div>
                          <p className="text-sm font-medium mb-1">Comentário:</p>
                          <p className="text-sm text-muted-foreground">
                            {avaliacao.comentario}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(avaliacao.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
