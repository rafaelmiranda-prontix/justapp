'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdvogadoModerationCard } from '@/components/admin/advogado-moderation-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Advogado {
  id: string
  oab: string
  oabVerificado: boolean
  cidade: string
  estado: string
  createdAt: string
  user: {
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

export default function AdminAdvogadosPage() {
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pendentes')
  const { toast } = useToast()

  const fetchAdvogados = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/advogados?status=${statusFilter}`)
      const result = await res.json()

      if (result.success) {
        setAdvogados(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar advogados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar advogados',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchAdvogados()
  }, [fetchAdvogados])

  const handleApprove = async (advogadoId: string) => {
    try {
      const res = await fetch(`/api/admin/advogados/${advogadoId}/approve`, {
        method: 'POST',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Advogado aprovado com sucesso',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao aprovar advogado',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (advogadoId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este advogado?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/advogados/${advogadoId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Rejeitado pelo administrador' }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Advogado rejeitado',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao rejeitar advogado',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Advogados</h1>
        <p className="text-muted-foreground">
          Aprove, rejeite ou suspenda advogados da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        <div className="flex items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="aprovados">Aprovados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px]" />
            ))}
          </div>
        ) : advogados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum advogado encontrado com os filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {advogados.map((advogado) => (
              <AdvogadoModerationCard
                key={advogado.id}
                advogado={advogado}
                onApprove={() => handleApprove(advogado.id)}
                onReject={() => handleReject(advogado.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
