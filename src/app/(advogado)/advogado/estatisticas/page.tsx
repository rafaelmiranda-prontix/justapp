'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react'

interface Metrics {
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
  leadsPorEspecialidade: Record<string, number>
  aceitacaoPorEspecialidade: Record<string, number>
  avaliacoes: {
    media: number
    total: number
  }
}

export default function EstatisticasPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/advogado/metrics')
      const result = await res.json()

      if (result.success) {
        setMetrics(result.data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Estatísticas</h1>
          <p className="text-muted-foreground">Acompanhe seu desempenho</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="container max-w-7xl py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu desempenho e métricas de leads</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Recebidos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leads.recebidos}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.leadsUltimos30Dias} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversao.taxa}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.conversao.leadsAceitos} de {metrics.conversao.leadsRecebidos} aceitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.tempoMedioResposta > 0
                ? `${metrics.tempoMedioResposta.toFixed(1)}h`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Tempo médio para responder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avaliacoes.media > 0 ? metrics.avaliacoes.media.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.avaliacoes.total} {metrics.avaliacoes.total === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Leads */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <span className="font-semibold">{metrics.leads.pendentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aceitos</span>
              </div>
              <span className="font-semibold">{metrics.leads.aceitos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Recusados</span>
              </div>
              <span className="font-semibold">{metrics.leads.recusados}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Contratados</span>
              </div>
              <span className="font-semibold">{metrics.leads.contratados}</span>
            </div>
          </CardContent>
        </Card>

        {/* Leads por Especialidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.leadsPorEspecialidade).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.leadsPorEspecialidade)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([especialidade, quantidade]) => (
                    <div key={especialidade} className="flex items-center justify-between">
                      <span className="text-sm">{especialidade}</span>
                      <span className="font-semibold">{quantidade}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Taxa de Aceitação por Especialidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aceitação por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.aceitacaoPorEspecialidade).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.aceitacaoPorEspecialidade)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([especialidade, taxa]) => (
                    <div key={especialidade} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{especialidade}</span>
                        <span className="font-semibold">{taxa}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{ width: `${taxa}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
