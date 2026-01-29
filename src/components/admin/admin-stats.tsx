'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Scale,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface AdminStatsData {
  usuarios: {
    total: number
    cidadaos: number
    advogados: number
    admins: number
  }
  advogados: {
    total: number
    pendentes: number
    aprovados: number
    suspensos: number
  }
  casos: {
    total: number
    abertos: number
    emAndamento: number
    fechados: number
  }
  matches: {
    total: number
    aceitos: number
    recusados: number
  }
  avaliacoes: {
    total: number
    reportadas: number
  }
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{stats.usuarios.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.usuarios.cidadaos} cidadãos, {stats.usuarios.advogados} advogados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Advogados Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.advogados.pendentes}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.advogados.aprovados} aprovados, {stats.advogados.total} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Casos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.casos.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.casos.abertos} abertos, {stats.casos.fechados} fechados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Matches Realizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.matches.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.matches.aceitos} aceitos, {stats.matches.recusados} recusados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{stats.avaliacoes.total}</span>
          </div>
          {stats.avaliacoes.reportadas > 0 && (
            <p className="text-xs text-destructive mt-1">
              {stats.avaliacoes.reportadas} reportadas
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Advogados Aprovados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.advogados.aprovados}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.advogados.suspensos} suspensos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
