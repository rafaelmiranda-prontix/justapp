'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OperationalServiceKind } from '@prisma/client'
import { OPERATIONAL_KIND_LABEL } from '@/lib/service-requests/labels'

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

export default function PublicarServicoPage() {
  const router = useRouter()
  const [kind, setKind] = useState<OperationalServiceKind>(OperationalServiceKind.AUDIENCIA)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customKind, setCustomKind] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [acceptDeadlineAt, setAcceptDeadlineAt] = useState('')
  const [location, setLocation] = useState('')
  const [comarca, setComarca] = useState('')
  const [forum, setForum] = useState('')
  const [offeredReais, setOfferedReais] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSending(true)
    try {
      const offeredAmountCents = parseCurrencyInputToCents(offeredReais)
      const body = {
        kind,
        customKindDescription: kind === OperationalServiceKind.PERSONALIZADO ? customKind : undefined,
        title,
        description,
        scheduledAt: new Date(scheduledAt).toISOString(),
        acceptDeadlineAt: new Date(acceptDeadlineAt).toISOString(),
        location: location || undefined,
        comarca: comarca || undefined,
        forum: forum || undefined,
        offeredAmountCents: Number.isFinite(offeredAmountCents as number) ? offeredAmountCents : null,
      }
      const r = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao publicar')

      const id = d.serviceRequest?.id as string
      if (file && id) {
        const fd = new FormData()
        fd.set('file', file)
        fd.set('kind', 'PUBLICACAO')
        const up = await fetch(`/api/service-requests/${id}/upload`, { method: 'POST', body: fd })
        if (!up.ok) {
          const u = await up.json()
          throw new Error(u.error || 'Publicado, mas falha no anexo')
        }
      }
      router.push(`/advogado/audiencias-diligencias/${id}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container max-w-xl py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Nova publicação</h1>
        <Button variant="ghost" asChild>
          <Link href="/advogado/audiencias-diligencias">Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do serviço</CardTitle>
          <CardDescription>Preencha os dados para encontrar um correspondente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as OperationalServiceKind)}
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

            {kind === OperationalServiceKind.PERSONALIZADO && (
              <div className="space-y-2">
                <Label htmlFor="custom">Descrição do tipo personalizado</Label>
                <Input
                  id="custom"
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sched">Data/hora do serviço</Label>
                <Input
                  id="sched"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dead">Aceite até</Label>
                <Input
                  id="dead"
                  type="datetime-local"
                  value={acceptDeadlineAt}
                  onChange={(e) => setAcceptDeadlineAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc">Local / endereço (opcional)</Label>
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="com">Comarca</Label>
                <Input id="com" value={comarca} onChange={(e) => setComarca(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fo">Fórum</Label>
                <Input id="fo" value={forum} onChange={(e) => setForum(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="val">Valor ofertado (R$) — informativo</Label>
              <Input
                id="val"
                inputMode="decimal"
                value={offeredReais}
                onChange={(e) => setOfferedReais(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Anexo (opcional)</Label>
              <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <Button type="submit" disabled={sending}>
              {sending ? 'Publicando…' : 'Publicar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
