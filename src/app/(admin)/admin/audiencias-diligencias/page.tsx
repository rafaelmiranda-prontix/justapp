'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import type { OperationalServiceKind, ServiceRequest } from '@prisma/client'

type Item = ServiceRequest & {
  solicitor: { users: { name: string; email: string } }
  correspondent: { users: { name: string } } | null
}

export default function AdminServiceRequestsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const q = new URLSearchParams({ page: String(page), limit: '20' })
      const r = await fetch(`/api/admin/service-requests?${q}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
      setItems(d.items || [])
      setTotal(d.total || 0)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="container py-8 space-y-4">
      <h1 className="text-2xl font-bold">Audiências e diligências</h1>
      <p className="text-muted-foreground text-sm">Total: {total}</p>
      {err && <p className="text-red-600 text-sm">{err}</p>}

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
            <CardContent className="text-sm space-y-1">
              <p>
                {OPERATIONAL_KIND_LABEL[it.kind as OperationalServiceKind]} · Solicitante:{' '}
                {it.solicitor.users.name}
              </p>
              {it.correspondent && <p>Correspondente: {it.correspondent.users.name}</p>}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/audiencias-diligencias/${it.id}`}>Detalhe / auditoria</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  )
}
