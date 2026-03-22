'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquare, RefreshCw, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Label } from '@/components/ui/label'

interface ChatMessageRow {
  id: string
  createdAt: string
  conteudoPreview: string
  conteudoLength: number
  lida: boolean
  remetente: { id: string; name: string; email: string; role: string }
  destinatario: { id: string; name: string; email: string; role: string } | null
  destinatarioResolvido: boolean
  problema: string | null
  match: { id: string; status: string; casoId: string }
}

interface Summary {
  totalMensagens: number
  ultimos7Dias: number
  inconsistenciasUltimos7Dias: number
  naPagina: { total: number; comDestinatarioOk: number; comProblema: number }
}

export default function AdminChatMensagensPage() {
  const [rows, setRows] = useState<ChatMessageRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [onlyProblems, setOnlyProblems] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '25',
        onlyProblems: onlyProblems ? 'true' : 'false',
      })
      const res = await fetch(`/api/admin/chat-messages?${q}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao carregar')
      }
      setRows(json.data || [])
      setSummary(json.summary || null)
      setTotalPages(json.pagination?.totalPages ?? 1)
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Falha ao carregar mensagens',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, onlyProblems, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Mensagens de chat (auditoria)
        </h1>
        <p className="text-muted-foreground">
          Verifique se cada mensagem tem remetente e destinatário coerentes com o match (cidadão ↔ advogado).
        </p>
      </div>

      <AdminNav />

      {summary && (
        <div className="grid gap-4 md:grid-cols-4 mt-8 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total no banco</CardDescription>
              <CardTitle className="text-2xl">{summary.totalMensagens}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Últimos 7 dias</CardDescription>
              <CardTitle className="text-2xl">{summary.ultimos7Dias}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={summary.inconsistenciasUltimos7Dias > 0 ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Inconsistências (7 dias)</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {summary.inconsistenciasUltimos7Dias}
                {summary.inconsistenciasUltimos7Dias > 0 && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground pt-0">
              Remetente não é o cidadão nem o advogado do match
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nesta página</CardDescription>
              <CardTitle className="text-lg">
                {summary.naPagina.comDestinatarioOk} ok / {summary.naPagina.comProblema} problema
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Destinatário é inferido: se o remetente é o cidadão do caso, o destinatário é o advogado (e vice-versa).
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                id="only-problems"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={onlyProblems}
                onChange={(e) => {
                  setOnlyProblems(e.target.checked)
                  setPage(1)
                }}
              />
              <Label htmlFor="only-problems" className="text-sm cursor-pointer">
                Só inconsistências
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              {onlyProblems ? 'Nenhuma inconsistência encontrada.' : 'Nenhuma mensagem registrada.'}
            </p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Integridade</TableHead>
                      <TableHead>Remetente</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Match / Caso</TableHead>
                      <TableHead>Prévia</TableHead>
                      <TableHead>Lida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {r.destinatarioResolvido ? (
                            <Badge variant="outline" className="gap-1 border-green-600/50 text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Problema
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{r.remetente.name}</div>
                          <div className="text-xs text-muted-foreground">{r.remetente.email}</div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {r.remetente.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.destinatario ? (
                            <>
                              <div className="text-sm font-medium">{r.destinatario.name}</div>
                              <div className="text-xs text-muted-foreground">{r.destinatario.email}</div>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {r.destinatario.role}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-sm text-destructive">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <div>M: {r.match.id.slice(0, 8)}…</div>
                          <div className="text-muted-foreground">C: {r.match.casoId.slice(0, 8)}…</div>
                          <Badge variant="outline" className="mt-1">
                            {r.match.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <button
                            type="button"
                            className="text-left text-sm text-primary hover:underline truncate block w-full"
                            onClick={() => setPreviewText(r.conteudoPreview)}
                          >
                            {r.conteudoPreview}
                          </button>
                        </TableCell>
                        <TableCell>{r.lida ? 'Sim' : 'Não'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewText} onOpenChange={() => setPreviewText(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prévia da mensagem</DialogTitle>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap">{previewText}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
