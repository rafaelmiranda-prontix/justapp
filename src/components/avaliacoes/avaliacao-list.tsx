'use client'

import { useEffect, useState } from 'react'
import { AvaliacaoCard } from './avaliacao-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  createdAt: string | Date
  cidadao: {
    users: {
      name: string
    }
  }
}

interface AvaliacaoListProps {
  advogadoId: string
  limit?: number
  showPagination?: boolean
}

export function AvaliacaoList({
  advogadoId,
  limit = 10,
  showPagination = true,
}: AvaliacaoListProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAvaliacoes()
  }, [advogadoId, page])

  const fetchAvaliacoes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/advogados/${advogadoId}/avaliacoes?page=${page}&limit=${limit}`
      )
      const result = await res.json()

      if (result.success) {
        setAvaliacoes(result.data)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    )
  }

  if (avaliacoes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {avaliacoes.map((avaliacao) => (
          <AvaliacaoCard key={avaliacao.id} avaliacao={avaliacao} />
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
  )
}
