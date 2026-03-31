'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import type { OperationalServiceKind, ServiceRequest } from '@prisma/client'

type Item = ServiceRequest & {
  solicitor: { users: { name: string } }
}

export default function OportunidadesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [comarca, setComarca] = useState('')
  const [kind, setKind] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const q = new URLSearchParams()
      if (comarca) q.set('comarca', comarca)
      if (kind) q.set('kind', kind)
      const r = await fetch(`/api/service-requests/opportunities?${q}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setItems(d.items || [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [comarca, kind])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <h1 className="text-2xl font-bold">Oportunidades abertas</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Input
            placeholder="Filtrar comarca"
            value={comarca}
            onChange={(e) => setComarca(e.target.value)}
            className="w-48"
          />
        </div>
        <div>
          <Input
            placeholder="Tipo (enum, ex: AUDIENCIA)"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-56"
          />
        </div>
        <Button type="button" variant="secondary" onClick={load}>
          Aplicar
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between gap-2">
                <span>{it.title}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {SERVICE_STATUS_LABEL[it.status]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                {OPERATIONAL_KIND_LABEL[it.kind as OperationalServiceKind]}
                {it.comarca ? ` · ${it.comarca}` : ''}
                {it.forum ? ` · ${it.forum}` : ''}
              </p>
              <p>
                Data: {new Date(it.scheduledAt).toLocaleString('pt-BR')} · Aceite até{' '}
                {new Date(it.acceptDeadlineAt).toLocaleString('pt-BR')}
              </p>
              <p>Solicitante: {it.solicitor.users.name}</p>
              <Button asChild size="sm">
                <Link href={`/advogado/audiencias-diligencias/${it.id}`}>Ver detalhes</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && items.length === 0 && !err && (
        <p className="text-muted-foreground">Nenhuma oportunidade no momento.</p>
      )}
    </div>
  )
}
