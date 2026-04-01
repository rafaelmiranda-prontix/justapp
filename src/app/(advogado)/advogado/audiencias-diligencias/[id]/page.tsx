'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import {
  ServiceRequestAttachmentKind,
  ServiceRequestStatus,
  OperationalServiceKind,
} from '@prisma/client'
import { useSession } from 'next-auth/react'
import { ServiceRequestChat } from '@/components/service-requests/service-request-chat'

const CHAT_VISIBLE_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
  ServiceRequestStatus.CONCLUIDO,
  ServiceRequestStatus.CANCELADO,
])

const CHAT_SEND_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
])

const EVIDENCE_STATUSES = CHAT_SEND_STATUSES

const CANCEL_SOLICITOR_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.PUBLICADO,
  ServiceRequestStatus.ACEITO,
])

const POST_ACCEPT_EDIT_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
])

const SENSITIVE_PATCH_KEYS = new Set([
  'scheduledAt',
  'location',
  'comarca',
  'forum',
  'offeredAmountCents',
  'kind',
  'acceptDeadlineAt',
  'customKindDescription',
])

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const BRL_NUMBER_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const amount = Number(digits) / 100
  return BRL_NUMBER_FORMATTER.format(amount)
}

function parseCurrencyInputToCents(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  if (!digits) return null
  return Number(digits)
}

function centsToCurrencyMask(cents: number): string {
  return BRL_NUMBER_FORMATTER.format(cents / 100)
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type EditSnapshot = {
  title: string
  description: string
  solicitorNotes: string
  kind: OperationalServiceKind
  customKind: string
  scheduledAt: string
  acceptDeadlineAt: string
  location: string
  comarca: string
  forum: string
  offeredReais: string
}

export default function ServiceRequestDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const editSnap = useRef<EditSnapshot | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSolicitorNotes, setEditSolicitorNotes] = useState('')
  const [editKind, setEditKind] = useState<OperationalServiceKind>(OperationalServiceKind.AUDIENCIA)
  const [editCustomKind, setEditCustomKind] = useState('')
  const [editScheduledAt, setEditScheduledAt] = useState('')
  const [editAcceptDeadlineAt, setEditAcceptDeadlineAt] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editComarca, setEditComarca] = useState('')
  const [editForum, setEditForum] = useState('')
  const [editOfferedReais, setEditOfferedReais] = useState('')
  const [editReason, setEditReason] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setErr(null)
    try {
      const r = await fetch(`/api/service-requests/${id}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setData(d)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
      setData(null)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const openEditDialog = useCallback(() => {
    if (!data?.serviceRequest) return
    const row = data.serviceRequest as {
      title: string
      description: string
      solicitorNotes: string | null
      kind: OperationalServiceKind
      customKindDescription: string | null
      scheduledAt: string
      acceptDeadlineAt: string
      location: string | null
      comarca: string | null
      forum: string | null
      offeredAmountCents: number | null
    }
    const offeredReais =
      row.offeredAmountCents != null ? centsToCurrencyMask(row.offeredAmountCents) : ''
    editSnap.current = {
      title: row.title,
      description: row.description,
      solicitorNotes: row.solicitorNotes ?? '',
      kind: row.kind,
      customKind: row.customKindDescription ?? '',
      scheduledAt: toDatetimeLocal(row.scheduledAt),
      acceptDeadlineAt: toDatetimeLocal(row.acceptDeadlineAt),
      location: row.location ?? '',
      comarca: row.comarca ?? '',
      forum: row.forum ?? '',
      offeredReais,
    }
    setEditTitle(row.title)
    setEditDescription(row.description)
    setEditSolicitorNotes(row.solicitorNotes ?? '')
    setEditKind(row.kind)
    setEditCustomKind(row.customKindDescription ?? '')
    setEditScheduledAt(toDatetimeLocal(row.scheduledAt))
    setEditAcceptDeadlineAt(toDatetimeLocal(row.acceptDeadlineAt))
    setEditLocation(row.location ?? '')
    setEditComarca(row.comarca ?? '')
    setEditForum(row.forum ?? '')
    setEditOfferedReais(offeredReais)
    setEditReason('')
    setEditOpen(true)
  }, [data])

  if (err && !data) {
    return (
      <div className="container py-8">
        <p className="text-red-600">{err}</p>
        <Link href="/advogado/audiencias-diligencias" className="underline text-sm">
          Voltar
        </Link>
      </div>
    )
  }

  if (!data?.serviceRequest) {
    return <div className="container py-12 text-muted-foreground">Carregando…</div>
  }

  const sr = data.serviceRequest as {
    id: string
    title: string
    description: string
    solicitorNotes: string | null
    kind: keyof typeof OPERATIONAL_KIND_LABEL
    customKindDescription: string | null
    status: ServiceRequestStatus
    scheduledAt: string
    acceptDeadlineAt: string
    location: string | null
    comarca: string | null
    forum: string | null
    offeredAmountCents: number | null
    solicitor: { userId: string; users: { name: string; email: string } }
    correspondent: { userId: string; users: { name: string } } | null
  }

  const myUserId = session?.user?.id
  const myRole = session?.user?.role
  const isAdmin = myRole === 'ADMIN'
  const isSolicitor = myUserId === sr.solicitor.userId
  const isCorr = sr.correspondent && myUserId === sr.correspondent.userId
  const canAccept =
    sr.status === ServiceRequestStatus.PUBLICADO &&
    !sr.correspondent &&
    !isSolicitor

  const preAcceptEdit = sr.status === ServiceRequestStatus.PUBLICADO
  const postAcceptEdit = POST_ACCEPT_EDIT_STATUSES.has(sr.status)
  const canEditAsSolicitor = isSolicitor && (preAcceptEdit || postAcceptEdit)

  const attachments = (data.attachments || []) as Array<{
    id: string
    originalName: string
    storagePath: string
    kind: ServiceRequestAttachmentKind
  }>

  const messages = (data.messages || []) as Array<{
    id: string
    content: string
    createdAt: string
    author: { id: string; name: string }
    attachment?: {
      id: string
      originalName: string
      storagePath: string
      kind: string
    } | null
  }>

  const fieldChanges = (data.fieldChanges || []) as Array<{
    id: string
    fieldName: string
    oldValue: string | null
    newValue: string | null
    reason: string | null
    createdAt: string
    changedBy: { id: string; name: string }
  }>

  const history = (data.statusHistory || []) as Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    note: string | null
    createdAt: string
    actor: { name: string; role: string }
    isAdminOverride?: boolean
  }>

  const reviews = (data.reviews || []) as Array<{ reviewer: { userId: string } }>
  const sessionUserId = session?.user?.id
  const alreadyReviewed = sessionUserId
    ? reviews.some((r) => r.reviewer.userId === sessionUserId)
    : false

  async function accept() {
    setMsg(null)
    const r = await fetch(`/api/service-requests/${id}/accept`, { method: 'POST' })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else load()
  }

  const showChat = CHAT_VISIBLE_STATUSES.has(sr.status)
  const chatReadOnly = sr.status === ServiceRequestStatus.CONCLUIDO || sr.status === ServiceRequestStatus.CANCELADO
  const canSendChat =
    CHAT_SEND_STATUSES.has(sr.status) && !isAdmin && (Boolean(isSolicitor) || Boolean(isCorr))

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const snap = editSnap.current
    if (!snap) return

    const offeredCents = parseCurrencyInputToCents(editOfferedReais)
    const patch: Record<string, unknown> = {}

    if (preAcceptEdit) {
      if (editTitle.trim() !== snap.title) patch.title = editTitle.trim()
      if (editDescription.trim() !== snap.description) patch.description = editDescription.trim()
      if (editSolicitorNotes.trim() !== snap.solicitorNotes)
        patch.solicitorNotes = editSolicitorNotes.trim() || null
      if (editKind !== snap.kind) patch.kind = editKind
      const nextCustom =
        editKind === OperationalServiceKind.PERSONALIZADO ? editCustomKind.trim() : null
      const prevCustom = snap.customKind.trim() || null
      if (nextCustom !== prevCustom) patch.customKindDescription = nextCustom
      if (editScheduledAt !== snap.scheduledAt)
        patch.scheduledAt = new Date(editScheduledAt).toISOString()
      if (editAcceptDeadlineAt !== snap.acceptDeadlineAt)
        patch.acceptDeadlineAt = new Date(editAcceptDeadlineAt).toISOString()
      if (editLocation.trim() !== snap.location) patch.location = editLocation.trim() || null
      if (editComarca.trim() !== snap.comarca) patch.comarca = editComarca.trim() || null
      if (editForum.trim() !== snap.forum) patch.forum = editForum.trim() || null
      const prevCents = parseCurrencyInputToCents(snap.offeredReais)
      if (offeredCents !== prevCents) patch.offeredAmountCents = offeredCents
    } else if (postAcceptEdit) {
      if (editDescription.trim() !== snap.description) patch.description = editDescription.trim()
      if (editSolicitorNotes.trim() !== snap.solicitorNotes)
        patch.solicitorNotes = editSolicitorNotes.trim() || null
      if (editKind !== snap.kind) patch.kind = editKind
      const nextCustom =
        editKind === OperationalServiceKind.PERSONALIZADO ? editCustomKind.trim() : null
      const prevCustom = snap.customKind.trim() || null
      if (nextCustom !== prevCustom) patch.customKindDescription = nextCustom
      if (editScheduledAt !== snap.scheduledAt)
        patch.scheduledAt = new Date(editScheduledAt).toISOString()
      if (editAcceptDeadlineAt !== snap.acceptDeadlineAt)
        patch.acceptDeadlineAt = new Date(editAcceptDeadlineAt).toISOString()
      if (editLocation.trim() !== snap.location) patch.location = editLocation.trim() || null
      if (editComarca.trim() !== snap.comarca) patch.comarca = editComarca.trim() || null
      if (editForum.trim() !== snap.forum) patch.forum = editForum.trim() || null
      const prevCents = parseCurrencyInputToCents(snap.offeredReais)
      if (offeredCents !== prevCents) patch.offeredAmountCents = offeredCents
    }

    const needsReason =
      postAcceptEdit &&
      Object.keys(patch).some((k) => SENSITIVE_PATCH_KEYS.has(k))

    if (needsReason && !editReason.trim()) {
      setMsg('Informe a justificativa para alterar data, local, valor, tipo ou prazo após o aceite.')
      return
    }
    if (needsReason) patch.reason = editReason.trim()

    if (Object.keys(patch).length === 0) {
      setMsg('Nenhuma alteração.')
      return
    }

    setEditSaving(true)
    try {
      const r = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setEditOpen(false)
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro')
    } finally {
      setEditSaving(false)
    }
  }

  async function changeStatus(to: ServiceRequestStatus) {
    setMsg(null)
    const r = await fetch(`/api/service-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStatus: to }),
    })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else load()
  }

  async function uploadEvidence(f: File) {
    setMsg(null)
    const fd = new FormData()
    fd.set('file', f)
    fd.set('kind', 'EVIDENCIA')
    const r = await fetch(`/api/service-requests/${id}/upload`, { method: 'POST', body: fd })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else load()
  }

  async function submitReview() {
    setMsg(null)
    const r = await fetch(`/api/service-requests/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
    })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else load()
  }

  const downloadPath = (path: string) =>
    `/api/service-requests/attachments/${path.split('/').map(encodeURIComponent).join('/')}`

  const offeredAmountLabel =
    sr.offeredAmountCents != null ? BRL_FORMATTER.format(sr.offeredAmountCents / 100) : null

  const locationLine = [sr.location, sr.comarca, sr.forum].filter(Boolean).join(' · ') || 'Local não informado'

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">{sr.title}</h1>
          <p className="text-muted-foreground text-sm">
            {OPERATIONAL_KIND_LABEL[sr.kind]} · {SERVICE_STATUS_LABEL[sr.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {canEditAsSolicitor && (
            <>
              <Button type="button" variant="secondary" onClick={openEditDialog}>
                Editar serviço
              </Button>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                <form onSubmit={submitEdit}>
                  <DialogHeader>
                    <DialogTitle>Editar serviço</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-4">
                    {preAcceptEdit && (
                      <div>
                        <Label htmlFor="edit-title">Título</Label>
                        <Input
                          id="edit-title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="edit-desc">Descrição</Label>
                      <Textarea
                        id="edit-desc"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        required={preAcceptEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-notes">Observações (solicitante)</Label>
                      <Textarea
                        id="edit-notes"
                        value={editSolicitorNotes}
                        onChange={(e) => setEditSolicitorNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={editKind}
                        onValueChange={(v) => setEditKind(v as OperationalServiceKind)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(OperationalServiceKind).map((k) => (
                            <SelectItem key={k} value={k}>
                              {OPERATIONAL_KIND_LABEL[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editKind === OperationalServiceKind.PERSONALIZADO && (
                      <div>
                        <Label htmlFor="edit-custom">Descrição do tipo personalizado</Label>
                        <Input
                          id="edit-custom"
                          value={editCustomKind}
                          onChange={(e) => setEditCustomKind(e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="edit-sched">Data/hora agendada</Label>
                      <Input
                        id="edit-sched"
                        type="datetime-local"
                        value={editScheduledAt}
                        onChange={(e) => setEditScheduledAt(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-deadline">Prazo para aceite</Label>
                      <Input
                        id="edit-deadline"
                        type="datetime-local"
                        value={editAcceptDeadlineAt}
                        onChange={(e) => setEditAcceptDeadlineAt(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-loc">Local</Label>
                      <Input
                        id="edit-loc"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-comarca">Comarca</Label>
                      <Input
                        id="edit-comarca"
                        value={editComarca}
                        onChange={(e) => setEditComarca(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-forum">Fórum</Label>
                      <Input id="edit-forum" value={editForum} onChange={(e) => setEditForum(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="edit-valor">Valor ofertado (opcional)</Label>
                      <Input
                        id="edit-valor"
                        inputMode="numeric"
                        value={editOfferedReais}
                        onChange={(e) => setEditOfferedReais(formatCurrencyInput(e.target.value))}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    {postAcceptEdit && (
                      <div>
                        <Label htmlFor="edit-reason">Justificativa (obrigatória para alterações sensíveis)</Label>
                        <Textarea
                          id="edit-reason"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          rows={2}
                          placeholder="Ex.: remarcação acordada com o correspondente"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={editSaving}>
                      {editSaving ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
              </Dialog>
            </>
          )}
          <Button variant="outline" asChild>
            <Link href="/advogado/audiencias-diligencias">Voltar</Link>
          </Button>
        </div>
      </div>

      {msg && <p className="text-sm text-amber-700">{msg}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 whitespace-pre-wrap">
          <p>{sr.description}</p>
          {sr.solicitorNotes?.trim() && (
            <div className="rounded border bg-muted/30 p-2">
              <p className="text-xs font-medium text-muted-foreground">Observações do solicitante</p>
              <p>{sr.solicitorNotes}</p>
            </div>
          )}
          <p>
            Agendado: {new Date(sr.scheduledAt).toLocaleString('pt-BR')} · Aceite até{' '}
            {new Date(sr.acceptDeadlineAt).toLocaleString('pt-BR')}
          </p>
          {[sr.location, sr.comarca, sr.forum].filter(Boolean).map((x, i) => (
            <p key={i}>{x}</p>
          ))}
          {offeredAmountLabel && <p>Valor ofertado: {offeredAmountLabel}</p>}
          <p>Solicitante: {sr.solicitor.users.name}</p>
          {sr.correspondent && <p>Correspondente: {sr.correspondent.users.name}</p>}
        </CardContent>
      </Card>

      {canAccept && <Button onClick={accept}>Aceitar este serviço</Button>}

      {isCorr && sr.status === ServiceRequestStatus.ACEITO && (
        <Button variant="secondary" onClick={() => changeStatus(ServiceRequestStatus.EM_ANDAMENTO)}>
          Iniciar execução
        </Button>
      )}
      {isCorr && sr.status === ServiceRequestStatus.EM_ANDAMENTO && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => changeStatus(ServiceRequestStatus.REALIZADO)}>
            Marcar como realizado
          </Button>
          <Button onClick={() => changeStatus(ServiceRequestStatus.AGUARDANDO_VALIDACAO)}>
            Enviar para validação do solicitante
          </Button>
        </div>
      )}
      {isCorr && sr.status === ServiceRequestStatus.REALIZADO && (
        <Button onClick={() => changeStatus(ServiceRequestStatus.AGUARDANDO_VALIDACAO)}>
          Enviar para validação
        </Button>
      )}
      {isSolicitor && sr.status === ServiceRequestStatus.AGUARDANDO_VALIDACAO && (
        <Button onClick={() => changeStatus(ServiceRequestStatus.CONCLUIDO)}>Confirmar conclusão</Button>
      )}
      {isSolicitor && CANCEL_SOLICITOR_STATUSES.has(sr.status) && (
        <Button variant="outline" onClick={() => changeStatus(ServiceRequestStatus.CANCELADO)}>
          Cancelar
        </Button>
      )}

      {isCorr && EVIDENCE_STATUSES.has(sr.status) && (
        <div>
          <Label className="mb-1">Evidência (arquivo)</Label>
          <Input type="file" onChange={(e) => e.target.files?.[0] && uploadEvidence(e.target.files[0])} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anexos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {attachments.length === 0 && <p className="text-muted-foreground">Nenhum anexo.</p>}
          {attachments.map((a) => (
            <div key={a.id} className="flex justify-between gap-2">
              <span>
                {a.kind}: {a.originalName}
              </span>
              <a
                href={downloadPath(a.storagePath)}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                Baixar
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {showChat && (isSolicitor || isCorr || isAdmin) && (
        <ServiceRequestChat
          requestId={id}
          currentUserId={myUserId}
          isAdmin={isAdmin}
          kind={sr.kind}
          status={sr.status}
          scheduledAt={sr.scheduledAt}
          locationLine={locationLine}
          offeredAmountLabel={offeredAmountLabel}
          messages={messages}
          chatReadOnly={chatReadOnly}
          canSendChat={canSendChat}
          onSend={async (text, attachmentId) => {
            const r = await fetch(`/api/service-requests/${id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: text,
                ...(attachmentId ? { attachmentId } : {}),
              }),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error || 'Erro ao enviar')
          }}
          onAfterSend={() => load()}
        />
      )}

      {isSolicitor && fieldChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterações registradas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {fieldChanges.map((c) => (
              <div key={c.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">
                  {c.fieldName}
                  {c.reason ? ` — ${c.reason}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.changedBy.name} · {new Date(c.createdAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-muted-foreground break-all">
                  <span className="line-through">{c.oldValue ?? '—'}</span>
                  {' → '}
                  <span>{c.newValue ?? '—'}</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {history.map((h) => (
            <div key={h.id} className="border-b pb-2">
              <p>
                {h.fromStatus ?? '—'} → {h.toStatus}
                {h.isAdminOverride ? ' (admin)' : ''}
              </p>
              <p className="text-muted-foreground text-xs">
                {h.actor.name} · {new Date(h.createdAt).toLocaleString('pt-BR')}
              </p>
              {h.note && <p>{h.note}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {sr.status === ServiceRequestStatus.CONCLUIDO &&
        (isSolicitor || isCorr) &&
        sessionUserId &&
        !alreadyReviewed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avaliar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Nota de 1 a 5 (após conclusão)</p>
              <Input
                type="number"
                min={1}
                max={5}
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              />
              <Textarea
                placeholder="Comentário opcional"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button type="button" onClick={submitReview}>
                Enviar avaliação
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
