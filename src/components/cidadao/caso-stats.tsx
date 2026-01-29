'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react'

interface CasoStats {
  casos: {
    abertos: number
    emAndamento: number
    fechados: number
    cancelados: number
    total: number
  }
  matches: {
    total: number
    aceitos: number
    pendentes: number
    taxaConversao: number
  }
  tempoMedioResposta: number
  casosUltimos30Dias: number
}

export function CasoStats() {
  const [stats, setStats] = useState<CasoStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/casos/stats')
      const result = await res.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Casos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">
              {stats.casos.abertos + stats.casos.emAndamento}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.casos.abertos} abertos, {stats.casos.emAndamento} em andamento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Advogados Contatados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.matches.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.matches.pendentes} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.matches.taxaConversao}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.matches.aceitos} de {stats.matches.total} aceitos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tempo Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.tempoMedioResposta}</span>
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tempo médio de resposta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Casos Aceitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.matches.aceitos}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Casos Concluídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            <span className="text-2xl font-bold">{stats.casos.fechados}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
