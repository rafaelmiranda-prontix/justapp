'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  Info,
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Bell,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SecurityLog {
  id: string
  action: string
  actorId: string
  actorEmail: string
  actorName: string
  actorRole: string
  targetType: string
  targetId: string
  targetIdentifier: string | null
  changes: any
  metadata: any
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  createdAt: string
}

interface SecurityStats {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  totals: {
    total: number
    critical: number
    warning: number
    info: number
  }
  byAction: Array<{ action: string; count: number }>
  byActor: Array<{ actorId: string; actorEmail: string; count: number }>
  recentCritical: SecurityLog[]
}

interface SecurityAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  details: any
  createdAt: string
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    page: 1,
    limit: 50,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
    fetchStats()
    fetchAlerts()
  }, [filters])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/security-logs/alerts')
      const result = await res.json()

      if (result.success) {
        setAlerts(result.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.severity) params.append('severity', filters.severity)
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const res = await fetch(`/api/admin/security-logs?${params}`)
      const result = await res.json()

      if (result.success) {
        setLogs(result.data)
      } else {
        throw new Error(result.error || 'Erro ao buscar logs')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao buscar logs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/security-logs/stats?days=30')
      const result = await res.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.severity) params.append('severity', filters.severity)
      params.append('format', format)

      const res = await fetch(`/api/admin/security-logs/export?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso',
        description: 'Logs exportados com sucesso',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar logs',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Crítico</Badge>
      case 'WARNING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Aviso</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auditoria de Segurança</h1>
          <p className="text-muted-foreground">
            Visualize e analise logs de ações administrativas críticas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <AdminNav />

      {/* Alertas de Segurança */}
      {alerts.length > 0 && (
        <Card className="mt-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Bell className="h-5 w-5" />
              Alertas de Segurança ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {alert.severity === 'CRITICAL' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : alert.severity === 'HIGH' ? (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Info className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{alert.message}</span>
                      <Badge
                        variant={
                          alert.severity === 'CRITICAL'
                            ? 'destructive'
                            : alert.severity === 'HIGH'
                              ? 'outline'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Ator: {alert.details.actorEmail}</div>
                      {alert.details.count && (
                        <div>Quantidade: {alert.details.count} em {alert.details.timeWindow}</div>
                      )}
                      {alert.details.targetIdentifier && (
                        <div>Alvo: {alert.details.targetIdentifier}</div>
                      )}
                      <div>
                        {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.total}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.totals.critical}</div>
              <p className="text-xs text-muted-foreground">Ações críticas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Avisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totals.warning}</div>
              <p className="text-xs text-muted-foreground">Ações de aviso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.totals.info}</div>
              <p className="text-xs text-muted-foreground">Ações informativas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Ação</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value === 'all' ? '' : value, page: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="PLANO_ADVOGADO_ALTERADO">
                    Alteração de Plano
                  </SelectItem>
                  <SelectItem value="ADVOGADO_APROVADO">Aprovação de Advogado</SelectItem>
                  <SelectItem value="ADVOGADO_REJEITADO">Rejeição de Advogado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severidade</Label>
              <Select
                value={filters.severity || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, severity: value === 'all' ? '' : value, page: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICAL">Crítico</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Itens por página</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, limit: parseInt(value), page: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Logs de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Mudanças</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.targetType} - {log.targetIdentifier || log.targetId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          {getSeverityBadge(log.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.actorName}</div>
                        <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                        <div className="text-xs text-muted-foreground">{log.actorRole}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.targetType}</div>
                        {log.targetIdentifier && (
                          <div className="text-xs text-muted-foreground">
                            {log.targetIdentifier}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.changes && Array.isArray(log.changes) && log.changes.length > 0 ? (
                          <div className="text-xs space-y-1">
                            {log.changes.map((change: any, idx: number) => (
                              <div key={idx} className="font-mono">
                                {change.field}: {String(change.from)} → {String(change.to)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
