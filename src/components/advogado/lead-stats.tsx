'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Star,
  Briefcase,
} from 'lucide-react'

interface LeadStats {
  leads: {
    recebidos: number
    pendentes: number
    visualizados: number
    aceitos: number
    recusados: number
    contratados: number
  }
  conversao: {
    taxa: number
    leadsAceitos: number
    leadsRecebidos: number
  }
  tempoMedioResposta: number
  leadsUltimos30Dias: number
  avaliacoes: {
    media: number
    total: number
  }
}

export function LeadStats() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/advogado/metrics')
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            Novos Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{stats.leads.pendentes}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.leads.recebidos} recebidos no total
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
            <span className="text-2xl font-bold">{stats.conversao.taxa}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.conversao.leadsAceitos} de {stats.conversao.leadsRecebidos} aceitos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tempo Médio de Resposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.tempoMedioResposta}</span>
            <span className="text-sm text-muted-foreground">h</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tempo médio para responder
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avaliação Média
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="text-2xl font-bold">
              {stats.avaliacoes.media > 0 ? stats.avaliacoes.media.toFixed(1) : '-'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.avaliacoes.total}{' '}
            {stats.avaliacoes.total === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Visualizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.leads.visualizados}</span>
          </div>
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
            <span className="text-2xl font-bold">{stats.leads.aceitos}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recusados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">{stats.leads.recusados}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Últimos 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{stats.leadsUltimos30Dias}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Leads recebidos</p>
        </CardContent>
      </Card>
    </div>
  )
}
