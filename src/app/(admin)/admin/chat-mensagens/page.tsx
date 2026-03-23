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
import {
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  FlaskConical,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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
  const [sendingEmailForId, setSendingEmailForId] = useState<string | null>(null)
  const [testRow, setTestRow] = useState<ChatMessageRow | null>(null)
  const [testEmailInput, setTestEmailInput] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [sampleTestEmail, setSampleTestEmail] = useState('')
  const [sendingSample, setSendingSample] = useState(false)
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

  async function notifyRecipient(messageId: string) {
    setSendingEmailForId(messageId)
    try {
      const res = await fetch(`/api/admin/chat-messages/${messageId}/notify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao enviar')
      }
      toast({
        title: 'E-mail enviado',
        description: `Aviso enviado para ${json.sentTo}.`,
      })
    } catch (e) {
      toast({
        title: 'Erro ao enviar',
        description: e instanceof Error ? e.message : 'Falha',
        variant: 'destructive',
      })
    } finally {
      setSendingEmailForId(null)
    }
  }

  async function sendTestForMessage() {
    if (!testRow) return
    const em = testEmailInput.trim().toLowerCase()
    if (!em) {
      toast({ title: 'Informe o e-mail', variant: 'destructive' })
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch(`/api/admin/chat-messages/${testRow.id}/notify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: em }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao enviar')
      }
      toast({
        title: 'E-mail de teste enviado',
        description: `Conteúdo da mensagem (prévia + remetente) enviado para ${json.sentTo}.`,
      })
      setTestRow(null)
      setTestEmailInput('')
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Falha',
        variant: 'destructive',
      })
    } finally {
      setSendingTest(false)
    }
  }

  async function sendSampleTest() {
    const em = sampleTestEmail.trim().toLowerCase()
    if (!em) {
      toast({ title: 'Digite um e-mail', variant: 'destructive' })
      return
    }
    setSendingSample(true)
    try {
      const res = await fetch('/api/admin/chat-messages/notify-email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao enviar')
      }
      toast({
        title: 'Amostra enviada',
        description: `Verifique a caixa de ${json.sentTo}.`,
      })
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Falha',
        variant: 'destructive',
      })
    } finally {
      setSendingSample(false)
    }
  }

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

      <Card className="mt-8 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Teste de envio (amostra)
          </CardTitle>
          <CardDescription>
            Envia um e-mail genérico de teste (sem vínculo com uma mensagem da lista) para validar Resend / caixa de entrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="sample-email">E-mail para receber o teste</Label>
            <Input
              id="sample-email"
              type="email"
              placeholder="seu@email.com"
              value={sampleTestEmail}
              onChange={(e) => setSampleTestEmail(e.target.value)}
            />
          </div>
          <Button type="button" onClick={sendSampleTest} disabled={sendingSample}>
            {sendingSample ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar amostra
          </Button>
        </CardContent>
      </Card>

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
              Destinatário é inferido: se o remetente é o cidadão do caso, o destinatário é o advogado (e vice-versa). Use os botões de e-mail para avisar manualmente ou testar com outro endereço.
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
                      <TableHead className="text-right">E-mail</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row gap-1 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={!r.destinatarioResolvido || sendingEmailForId === r.id}
                              onClick={() => notifyRecipient(r.id)}
                              title="Envia para o e-mail do destinatário inferido"
                            >
                              {sendingEmailForId === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Mail className="h-3.5 w-3.5 sm:mr-1" />
                              )}
                              <span className="hidden sm:inline">Avisar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setTestRow(r)
                                setTestEmailInput('')
                              }}
                              title="Enviar a mesma prévia para um e-mail que você digitar"
                            >
                              <FlaskConical className="h-3.5 w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Testar</span>
                            </Button>
                          </div>
                        </TableCell>
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

      <Dialog
        open={!!testRow}
        onOpenChange={(open) => {
          if (!open) {
            setTestRow(null)
            setTestEmailInput('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testar envio com esta mensagem</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O e-mail incluirá a prévia do texto e os dados de quem enviou (
            {testRow?.remetente.name}). Será marcado como <strong>envio de teste</strong>.
          </p>
          <div className="space-y-2 py-2">
            <Label htmlFor="test-email-row">Enviar para</Label>
            <Input
              id="test-email-row"
              type="email"
              placeholder="email@exemplo.com"
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTestRow(null)
                setTestEmailInput('')
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={sendTestForMessage} disabled={sendingTest}>
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
