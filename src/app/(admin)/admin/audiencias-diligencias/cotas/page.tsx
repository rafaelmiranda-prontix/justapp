'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PlanRow = {
  id: string
  codigo: string
  nome: string
  distributionRule: {
    monthlyOpportunityQuota: number
    batchSize: number
    priorityWeight: number
    acceptanceWindowMinutes: number
  } | null
}

type UsageRow = {
  userId: string
  opportunitiesDelivered: number
  user: {
    name: string
    email: string
    advogados: { plano: string } | null
  } | null
}

export default function AdminDistributionQuotasPage() {
  const [data, setData] = useState<{
    referenceMonth: string
    plans: PlanRow[]
    usageSample: UsageRow[]
  } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [expanding, setExpanding] = useState(false)

  useEffect(() => {
    let ok = true
    fetch('/api/admin/distribution-quotas')
      .then((r) => r.json())
      .then((d) => {
        if (!ok) return
        if (d.error) setErr(d.error)
        else setData(d)
      })
      .catch(() => setErr('Erro ao carregar'))
    return () => {
      ok = false
    }
  }, [])

  async function expandBatches() {
    setExpanding(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/service-requests/distribution/expand', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro')
    } finally {
      setExpanding(false)
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Cotas de distribuição</h1>
        <Button type="button" variant="secondary" disabled={expanding} onClick={() => void expandBatches()}>
          {expanding ? 'Processando…' : 'Reprocessar lotes expirados'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Mês de referência do consumo: {data?.referenceMonth ?? '—'}. Configure regras por plano na tabela{' '}
        <code className="text-xs">plan_distribution_rules</code> (seed ou SQL).
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras por plano</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {!data && <p className="text-muted-foreground">Carregando…</p>}
          {data?.plans.map((p) => (
            <div key={p.id} className="border-b pb-2">
              <p className="font-medium">
                {p.nome} ({p.codigo})
              </p>
              {p.distributionRule ? (
                <ul className="text-muted-foreground mt-1 space-y-0.5">
                  <li>Cota mensal de oportunidades (exposição): {p.distributionRule.monthlyOpportunityQuota}</li>
                  <li>Tamanho do lote: {p.distributionRule.batchSize}</li>
                  <li>Peso de prioridade: {p.distributionRule.priorityWeight}</li>
                  <li>Janela de aceite (minutos): {p.distributionRule.acceptanceWindowMinutes}</li>
                </ul>
              ) : (
                <p className="text-muted-foreground">Sem regra cadastrada — usam-se valores padrão do sistema.</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumo no mês (amostra)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {!data?.usageSample.length && <p className="text-muted-foreground">Nenhum consumo registrado ainda.</p>}
          <ul className="space-y-1">
            {data?.usageSample.map((u) => (
              <li key={u.userId}>
                {u.user?.name ?? u.userId} — {u.opportunitiesDelivered} entregas
                {u.user?.advogados && ` · plano ${u.user.advogados.plano}`}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
