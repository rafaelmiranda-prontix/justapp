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
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SupportUserBrief = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
}

type SupportContactRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  crm: string | null
  userId: string | null
}

type ConversationRow = {
  id: string
  contactId: string
  userId: string | null
  channel: string
  status: string
  whatsappWaId: string | null
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  contact: SupportContactRow
  user: SupportUserBrief | null
  _count: { messages: number }
}

type SupportMessageRow = {
  id: string
  conversationId: string
  senderType: string
  content: string
  metadata: unknown
  externalMessageId: string | null
  createdAt: string
}

export default function AdminSuportePage() {
  const [rows, setRows] = useState<ConversationRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [hasUserFilter, setHasUserFilter] = useState<string>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<ConversationRow | null>(null)
  const [messages, setMessages] = useState<SupportMessageRow[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const { toast } = useToast()

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (q.trim()) params.set('q', q.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (channelFilter !== 'all') params.set('channel', channelFilter)
      if (hasUserFilter === 'true') params.set('hasUser', 'true')
      if (hasUserFilter === 'false') params.set('hasUser', 'false')

      const res = await fetch(`/api/admin/suporte/conversas?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar')
      setRows(json.data || [])
      setTotalPages(json.pagination?.totalPages ?? 1)
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Falha ao carregar conversas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, q, statusFilter, channelFilter, hasUserFilter, toast])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  async function openDetail(row: ConversationRow) {
    setSelected(row)
    setDetailOpen(true)
    setLoadingMessages(true)
    setMessages([])
    try {
      const res = await fetch(
        `/api/admin/suporte/conversas/${row.id}/messages?limit=500&page=1`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar mensagens')
      setMessages(json.data || [])
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Falha',
        variant: 'destructive',
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  function applySearch() {
    setQ(qInput)
    setPage(1)
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Suporte WhatsApp
        </h1>
        <p className="text-muted-foreground">
          Conversas ingeridas pela API de integração (bot / n8n). Usuário vinculado quando a
          identificação por e-mail, telefone ou OAB encontra cadastro ativo.
        </p>
      </div>

      <AdminNav />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque por nome, e-mail, telefone ou CRM do contato.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Label htmlFor="suporte-q">Busca</Label>
            <Input
              id="suporte-q"
              placeholder="E-mail, nome, telefone..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <div className="space-y-2 w-[180px]">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="OPEN">Aberta</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="RESOLVED">Resolvida</SelectItem>
                <SelectItem value="CLOSED">Fechada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-[180px]">
            <Label>Canal</Label>
            <Select
              value={channelFilter}
              onValueChange={(v) => {
                setChannelFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-[200px]">
            <Label>Usuário no app</Label>
            <Select
              value={hasUserFilter}
              onValueChange={(v) => {
                setHasUserFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Vinculado</SelectItem>
                <SelectItem value="false">Só contato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={applySearch}>
              Aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchList()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
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
              Nenhuma conversa encontrada.
            </p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Última msg</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Usuário app</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Msgs</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {r.lastMessageAt
                            ? format(new Date(r.lastMessageAt), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {r.contact.name || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.contact.email || r.contact.phone || r.contact.crm || r.id.slice(0, 8)}
                          </div>
                          {r.whatsappWaId && (
                            <div className="text-xs font-mono text-muted-foreground mt-0.5">
                              WA: {r.whatsappWaId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.user ? (
                            <>
                              <div className="text-sm font-medium">{r.user.name}</div>
                              <div className="text-xs text-muted-foreground">{r.user.email}</div>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {r.user.role}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Não vinculado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.status}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">{r.channel}</div>
                        </TableCell>
                        <TableCell>{r._count.messages}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="outline" onClick={() => openDetail(r)}>
                            Ver mensagens
                          </Button>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico da conversa</DialogTitle>
            {selected && (
              <p className="text-sm text-muted-foreground text-left font-normal">
                {selected.contact.name || 'Sem nome'} ·{' '}
                {[selected.contact.email, selected.contact.phone].filter(Boolean).join(' · ') ||
                  selected.id}
              </p>
            )}
          </DialogHeader>
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-[240px] max-h-[60vh] pr-3">
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border bg-muted/40 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="secondary">{m.senderType}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(m.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    {m.externalMessageId && (
                      <p className="text-xs font-mono text-muted-foreground mt-2">
                        ext: {m.externalMessageId}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
