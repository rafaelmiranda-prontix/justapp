'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Gauge, Infinity as InfinityIcon, Search } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatOAB } from '@/lib/utils'
type Situacao = 'ilimitado' | 'esgotado' | 'proximo' | 'ok' | 'sem_cota'

interface LeadRow {
  id: string
  oab: string
  plano: string
  aprovado: boolean
  nome: string
  email: string
  leadsRecebidosMes: number
  leadsLimiteMes: number
  ultimoResetLeads: string
  casosRecebidosHora: number
  ultimoResetCasosHora: string
  isUnlimited: boolean
  usoPercent: number | null
  situacao: Situacao
}

interface Summary {
  aprovadosTotal: number
  ilimitados: number
  esgotado: number
  proximo: number
  okCota: number
}

const situacaoBadge: Record<
  Situacao,
  { label: string; className: string }
> = {
  ilimitado: {
    label: 'Ilimitado',
    className: 'bg-slate-600 text-white hover:bg-slate-600',
  },
  esgotado: {
    label: 'Cota esgotada',
    className: 'bg-red-600 text-white hover:bg-red-600',
  },
  proximo: {
    label: 'Próximo do limite',
    className: 'bg-amber-600 text-white hover:bg-amber-600',
  },
  ok: {
    label: 'Dentro da cota',
    className: 'bg-emerald-600 text-white hover:bg-emerald-600',
  },
  sem_cota: {
    label: 'Sem cota finita',
    className: 'bg-muted text-muted-foreground',
  },
}

export default function AdminLeadsQuotaPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<LeadRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [cota, setCota] = useState('all')
  const [status, setStatus] = useState('aprovados')
  const [sort, setSort] = useState('uso_desc')

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 350)
    return () => window.clearTimeout(t)
  }, [search])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        cota,
        status,
        sort,
      })
      if (searchDebounced) params.set('search', searchDebounced)

      const res = await fetch(`/api/admin/advogados/leads?${params}`)
      const j = await res.json()

      if (!res.ok || !j.success) {
        toast({
          title: 'Erro',
          description: j.error || 'Não foi possível carregar os dados',
          variant: 'destructive',
        })
        return
      }

      setRows(j.data)
      setSummary(j.summary)
      setTotalPages(j.pagination.totalPages)
      setTotal(j.pagination.total)
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha na requisição',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, cota, status, sort, searchDebounced, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gauge className="h-8 w-8" />
          Cota de leads (advogados)
        </h1>
        <p className="text-muted-foreground">
          Acompanhe o uso mensal da cota de leads, limites por plano e quem está
          próximo ou sem capacidade.
        </p>
      </div>

      <AdminNav />

      {summary && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovados (total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.aprovadosTotal}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ilimitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {summary.ilimitados}
                <InfinityIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Cota esgotada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.esgotado}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">
                ≥ 80% da cota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{summary.proximo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                &lt; 80% (cota finita)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary.okCota}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Os números do resumo são de todos os advogados; a tabela respeita os
              filtros abaixo.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/advogados">Ir para moderação de advogados</Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nome, e-mail ou OAB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={cota}
                onValueChange={(v) => {
                  setPage(1)
                  setCota(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Situação da cota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  <SelectItem value="esgotado">Cota esgotada</SelectItem>
                  <SelectItem value="proximo">≥ 80% (ainda há cota)</SelectItem>
                  <SelectItem value="ok">Dentro da cota (&lt; 80%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={status}
                onValueChange={(v) => {
                  setPage(1)
                  setStatus(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovados">Aprovados</SelectItem>
                  <SelectItem value="pendentes">Não aprovados</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={sort}
                onValueChange={(v) => {
                  setPage(1)
                  setSort(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uso_desc">Uso (maior primeiro)</SelectItem>
                  <SelectItem value="recebidos_desc">Leads recebidos</SelectItem>
                  <SelectItem value="nome">Nome (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setPage(1)
                  setLimit(Number(v))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Advogado</TableHead>
                  <TableHead>OAB</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[200px]">Uso mensal</TableHead>
                  <TableHead
                    title="Casos distribuídos na janela móvel de 1 hora (limite por hora do plano, quando aplicável)."
                    className="cursor-help"
                  >
                    Na hora
                  </TableHead>
                  <TableHead>Reset mensal</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(7)].map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-12"
                      >
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => {
                      const b = situacaoBadge[r.situacao]
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.nome}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {r.email}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatOAB(r.oab)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{r.plano}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              {r.aprovado ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-600 text-emerald-700"
                                >
                                  Aprovado
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                              <Badge className={b.className}>{b.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.isUnlimited ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <InfinityIcon className="h-4 w-4" />
                                Ilimitado · {r.leadsRecebidosMes} recebidos no mês
                              </div>
                            ) : r.situacao === 'sem_cota' ? (
                              <span className="text-sm text-muted-foreground">
                                Limite {r.leadsLimiteMes} · {r.leadsRecebidosMes}{' '}
                                recebidos
                              </span>
                            ) : (
                              <div className="space-y-1.5 max-w-[240px]">
                                <div className="flex justify-between text-xs">
                                  <span>
                                    {r.leadsRecebidosMes} / {r.leadsLimiteMes}
                                  </span>
                                  {r.usoPercent != null && (
                                    <span>{r.usoPercent}%</span>
                                  )}
                                </div>
                                <Progress
                                  value={r.usoPercent ?? 0}
                                  className="h-2"
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.casosRecebidosHora}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(
                              new Date(r.ultimoResetLeads),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR }
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>
              {total} registro(s)
              {totalPages > 1 &&
                ` · página ${page} de ${totalPages}`}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
