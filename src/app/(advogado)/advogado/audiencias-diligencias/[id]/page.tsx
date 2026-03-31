'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import {
  ServiceRequestAttachmentKind,
  ServiceRequestStatus,
} from '@prisma/client'
import { useSession } from 'next-auth/react'

const CHAT_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
])

const EVIDENCE_STATUSES = CHAT_STATUSES

const CANCEL_SOLICITOR_STATUSES = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.PUBLICADO,
  ServiceRequestStatus.ACEITO,
])

export default function ServiceRequestDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [chatText, setChatText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

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
    kind: keyof typeof OPERATIONAL_KIND_LABEL
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
  const isSolicitor = myUserId === sr.solicitor.userId
  const isCorr = sr.correspondent && myUserId === sr.correspondent.userId
  const canAccept =
    sr.status === ServiceRequestStatus.PUBLICADO &&
    !sr.correspondent &&
    !isSolicitor

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
    author: { name: string }
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

  async function postChat() {
    if (!chatText.trim()) return
    const r = await fetch(`/api/service-requests/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: chatText }),
    })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else {
      setChatText('')
      load()
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

  const showChat = CHAT_STATUSES.has(sr.status)

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">{sr.title}</h1>
          <p className="text-muted-foreground text-sm">
            {OPERATIONAL_KIND_LABEL[sr.kind]} · {SERVICE_STATUS_LABEL[sr.status]}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/advogado/audiencias-diligencias">Voltar</Link>
        </Button>
      </div>

      {msg && <p className="text-sm text-amber-700">{msg}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 whitespace-pre-wrap">
          <p>{sr.description}</p>
          <p>
            Agendado: {new Date(sr.scheduledAt).toLocaleString('pt-BR')} · Aceite até{' '}
            {new Date(sr.acceptDeadlineAt).toLocaleString('pt-BR')}
          </p>
          {[sr.location, sr.comarca, sr.forum].filter(Boolean).map((x, i) => (
            <p key={i}>{x}</p>
          ))}
          {sr.offeredAmountCents != null && (
            <p>Valor ofertado: R$ {(sr.offeredAmountCents / 100).toFixed(2)}</p>
          )}
          <p>Solicitante: {sr.solicitor.users.name}</p>
          {sr.correspondent && <p>Correspondente: {sr.correspondent.users.name}</p>}
        </CardContent>
      </Card>

      {canAccept && (
        <Button onClick={accept}>Aceitar este serviço</Button>
      )}

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
        <Button onClick={() => changeStatus(ServiceRequestStatus.CONCLUIDO)}>
          Confirmar conclusão
        </Button>
      )}
      {isSolicitor && CANCEL_SOLICITOR_STATUSES.has(sr.status) && (
          <Button variant="outline" onClick={() => changeStatus(ServiceRequestStatus.CANCELADO)}>
            Cancelar
          </Button>
        )}

      {isCorr && EVIDENCE_STATUSES.has(sr.status) && (
          <div>
            <Label className="mb-1">Evidência (arquivo)</Label>
            <Input
              type="file"
              onChange={(e) => e.target.files?.[0] && uploadEvidence(e.target.files[0])}
            />
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

      {showChat && (isSolicitor || isCorr) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-medium">{m.author.name}</span>{' '}
                  <span className="text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            <Textarea value={chatText} onChange={(e) => setChatText(e.target.value)} rows={2} />
            <Button type="button" onClick={postChat}>
              Enviar
            </Button>
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
