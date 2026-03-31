'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import type { OperationalServiceKind, ServiceRequest } from '@prisma/client'

type Item = ServiceRequest & {
  solicitor: { users: { name: string } }
  correspondent: { users: { name: string } } | null
}

function HistoricoInner() {
  const sp = useSearchParams()
  const role = sp.get('role') === 'correspondent' ? 'correspondent' : 'solicitor'
  const [items, setItems] = useState<Item[]>([])
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const r = await fetch(`/api/service-requests/mine?role=${role}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setItems(d.items || [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
    }
  }, [role])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="container max-w-3xl py-8 space-y-4">
      <h1 className="text-2xl font-bold">
        {role === 'correspondent' ? 'Serviços aceitos' : 'Minhas publicações'}
      </h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{it.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                {OPERATIONAL_KIND_LABEL[it.kind as OperationalServiceKind]} ·{' '}
                {SERVICE_STATUS_LABEL[it.status]}
              </p>
              {role === 'solicitor' && it.correspondent && (
                <p>Correspondente: {it.correspondent.users.name}</p>
              )}
              {role === 'correspondent' && <p>Solicitante: {it.solicitor.users.name}</p>}
              <Link
                href={`/advogado/audiencias-diligencias/${it.id}`}
                className="text-indigo-600 underline text-sm"
              >
                Abrir
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {items.length === 0 && !err && <p className="text-muted-foreground">Nenhum registro.</p>}
    </div>
  )
}

export default function HistoricoPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-muted-foreground">Carregando…</div>}>
      <HistoricoInner />
    </Suspense>
  )
}
