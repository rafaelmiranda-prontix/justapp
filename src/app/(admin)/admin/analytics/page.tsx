'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Mail,
  CheckCircle,
  Target,
} from 'lucide-react'

interface ConversionStats {
  totalSessions: number
  converted: number
  abandoned: number
  expired: number
  active: number
  conversionRate: number
  avgMessagesBeforeConversion: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ConversionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics/conversion-funnel')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container max-w-7xl py-8">
        <p>Erro ao carregar estatísticas</p>
      </div>
    )
  }

  const funnelSteps = [
    {
      icon: MessageSquare,
      label: 'Chat Iniciado',
      value: stats.totalSessions,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Users,
      label: 'Leads Capturados',
      value: stats.converted + stats.active,
      percentage:
        stats.totalSessions > 0
          ? (((stats.converted + stats.active) / stats.totalSessions) * 100).toFixed(1)
          : '0',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Mail,
      label: 'Emails Enviados',
      value: stats.converted,
      percentage: stats.totalSessions > 0 ? ((stats.converted / stats.totalSessions) * 100).toFixed(1) : '0',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: CheckCircle,
      label: 'Ativações',
      value: stats.converted,
      percentage: stats.totalSessions > 0 ? ((stats.converted / stats.totalSessions) * 100).toFixed(1) : '0',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  const metrics = [
    {
      icon: Target,
      label: 'Taxa de Conversão',
      value: `${stats.conversionRate.toFixed(1)}%`,
      description: 'Sessões convertidas em usuários',
      color: 'text-primary',
    },
    {
      icon: MessageSquare,
      label: 'Média de Mensagens',
      value: stats.avgMessagesBeforeConversion.toFixed(1),
      description: 'Antes da conversão',
      color: 'text-blue-500',
    },
    {
      icon: Users,
      label: 'Sessões Ativas',
      value: stats.active,
      description: 'Em andamento',
      color: 'text-green-500',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Abandono',
      value: `${stats.totalSessions > 0 ? ((stats.abandoned / stats.totalSessions) * 100).toFixed(1) : '0'}%`,
      description: 'Sessões abandonadas',
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics - Funil de Conversão</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho do chat anônimo e taxas de conversão
        </p>
      </div>

      {/* Funil de Conversão */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Funil de Conversão</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {funnelSteps.map((step, idx) => {
            const Icon = step.icon
            return (
              <Card key={idx} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${step.bgColor}`}>
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    {step.percentage && (
                      <div className="text-sm text-muted-foreground">{step.percentage}%</div>
                    )}
                  </div>
                  <div className="text-2xl font-bold mb-1">{step.value.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{step.label}</div>
                </CardContent>
                {idx < funnelSteps.length - 1 && (
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-muted-foreground/20" />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Métricas Detalhadas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Status das Sessões */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status das Sessões</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-500">Convertidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.converted}</div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-orange-500">Abandonadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.abandoned}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-500/50 bg-gray-500/5">
            <CardHeader>
              <CardTitle className="text-gray-500">Expiradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-500">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>💡 Insights</CardTitle>
            <CardDescription>Análise do funil de conversão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium">
                  Taxa de conversão de {stats.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.conversionRate < 10
                    ? 'Abaixo da média. Considere otimizar o timing da captura de lead.'
                    : stats.conversionRate < 30
                      ? 'Dentro da média. Há espaço para melhorias.'
                      : 'Excelente! Acima da média do mercado.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">
                  Média de {stats.avgMessagesBeforeConversion.toFixed(1)} mensagens antes da
                  conversão
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.avgMessagesBeforeConversion < 3
                    ? 'Conversão muito rápida. Os leads podem não estar qualificados.'
                    : stats.avgMessagesBeforeConversion > 10
                      ? 'Conversão demorada. Considere mostrar o formulário mais cedo.'
                      : 'Timing ideal para captura de leads.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <p className="font-medium">
                  {stats.abandoned} sessões abandonadas (
                  {((stats.abandoned / stats.totalSessions) * 100).toFixed(1)}%)
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.abandoned / stats.totalSessions > 0.5
                    ? 'Taxa de abandono alta. Revise a experiência do usuário e o timing da captura.'
                    : 'Taxa de abandono aceitável.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
