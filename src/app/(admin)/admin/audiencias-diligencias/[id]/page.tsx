'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import { ServiceRequestStatus } from '@prisma/client'

export default function AdminServiceRequestDetailPage() {
  const { id } = useParams() as { id: string }
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<ServiceRequestStatus>(ServiceRequestStatus.PUBLICADO)
  const [adminReason, setAdminReason] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const r = await fetch(`/api/admin/service-requests/${id}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setData(d)
      const sr = d.serviceRequest as { status: ServiceRequestStatus }
      setNewStatus(sr.status)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
      setData(null)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function applyStatus() {
    setMsg(null)
    const r = await fetch(`/api/admin/service-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStatus: newStatus, adminReason }),
    })
    const d = await r.json()
    if (!r.ok) setMsg(d.error || 'Erro')
    else {
      setAdminReason('')
      load()
    }
  }

  if (err && !data) {
    return (
      <div className="container py-8">
        <p className="text-red-600">{err}</p>
        <Link href="/admin/audiencias-diligencias" className="underline text-sm">
          Voltar
        </Link>
      </div>
    )
  }

  if (!data?.serviceRequest) {
    return <div className="container py-12 text-muted-foreground">Carregando…</div>
  }

  const sr = data.serviceRequest as {
    title: string
    description: string
    kind: keyof typeof OPERATIONAL_KIND_LABEL
    status: ServiceRequestStatus
  }

  const history = (data.statusHistory || []) as Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    note: string | null
    isAdminOverride: boolean
    createdAt: string
    actor: { name: string; role: string }
  }>

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">{sr.title}</h1>
        <Button variant="ghost" asChild>
          <Link href="/admin/audiencias-diligencias">Lista</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {OPERATIONAL_KIND_LABEL[sr.kind]} · {SERVICE_STATUS_LABEL[sr.status]}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descrição</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{sr.description}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar status (admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && <p className="text-sm text-amber-700">{msg}</p>}
          <div className="space-y-2">
            <Label>Novo status</Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as ServiceRequestStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ServiceRequestStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SERVICE_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Justificativa (obrigatória)</Label>
            <Textarea
              id="reason"
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={applyStatus}>Aplicar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trilha de auditoria</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {history.map((h) => (
            <div key={h.id} className="border-b pb-2">
              <p>
                {h.fromStatus ?? '—'} → {h.toStatus}
                {h.isAdminOverride ? ' [admin]' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {h.actor.name} ({h.actor.role}) · {new Date(h.createdAt).toLocaleString('pt-BR')}
              </p>
              {h.note && <p>{h.note}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
