'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { OperationalServiceKind } from '@prisma/client'
import { OPERATIONAL_KIND_LABEL } from '@/lib/service-requests/labels'

const ALL_KINDS = Object.values(OperationalServiceKind)

export default function CorrespondentePerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aprovado, setAprovado] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [minFee, setMinFee] = useState('')
  const [regionsText, setRegionsText] = useState('')
  const [selectedKinds, setSelectedKinds] = useState<OperationalServiceKind[]>([])
  const [availabilityNote, setAvailabilityNote] = useState('')
  const [rep, setRep] = useState<{ averageRating: number | null; reviewCount: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const r = await fetch('/api/service-requests/correspondent-profile')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao carregar')
      setAprovado(d.advogadoAprovado)
      setRep(d.reputation)
      const p = d.profile
      setIsActive(p.isActive)
      setMinFee(p.minFeeCents != null ? String(p.minFeeCents / 100) : '')
      setSelectedKinds(p.acceptedKinds?.map((k: { kind: OperationalServiceKind }) => k.kind) || [])
      setRegionsText(
        (p.regions || [])
          .map(
            (r: { cidade?: string; estado?: string; comarca?: string; forum?: string }) =>
              [r.estado, r.cidade, r.comarca, r.forum].filter(Boolean).join(' — ')
          )
          .join('\n')
      )
      const aj = p.availabilityJson
      if (aj && typeof aj === 'object' && 'note' in aj && typeof (aj as { note: string }).note === 'string') {
        setAvailabilityNote((aj as { note: string }).note)
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const minFeeCents =
        minFee.trim() === '' ? null : Math.round(parseFloat(minFee.replace(',', '.')) * 100)
      const regions = regionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('—').map((s) => s.trim())
          return {
            estado: parts[0] || null,
            cidade: parts[1] || null,
            comarca: parts[2] || null,
            forum: parts[3] || null,
          }
        })

      const r = await fetch('/api/service-requests/correspondent-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive,
          minFeeCents: Number.isFinite(minFeeCents as number) ? minFeeCents : null,
          acceptedKinds: selectedKinds,
          regions,
          availabilityJson: availabilityNote.trim() ? { note: availabilityNote.trim() } : null,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao salvar')
      setMsg('Salvo com sucesso.')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  function toggleKind(k: OperationalServiceKind) {
    setSelectedKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))
  }

  if (loading) {
    return <div className="container py-12 text-muted-foreground">Carregando…</div>
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil de correspondente</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {aprovado
            ? 'Conta aprovada — você pode ativar o perfil.'
            : 'Sua conta ainda não foi aprovada — o perfil de correspondente só pode ser ativado após aprovação.'}
        </p>
      </div>

      {rep && rep.reviewCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reputação</CardTitle>
            <CardDescription>Média das avaliações recebidas nesta plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {rep.averageRating != null ? rep.averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-muted-foreground text-sm ml-2">({rep.reviewCount} avaliações)</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade</CardTitle>
          <CardDescription>Ative para aparecer como correspondente e receber oportunidades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <Checkbox
              id="active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(Boolean(v))}
              disabled={!aprovado}
            />
            <Label htmlFor="active">Perfil ativo</Label>
          </div>

          <div className="space-y-2">
            <Label>Tipos de serviço que aceita</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_KINDS.map((k) => (
                <Badge
                  key={k}
                  variant={selectedKinds.includes(k) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleKind(k)}
                >
                  {OPERATIONAL_KIND_LABEL[k]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Valor mínimo desejado (R$) — informativo</Label>
            <Input
              id="fee"
              inputMode="decimal"
              placeholder="ex: 150"
              value={minFee}
              onChange={(e) => setMinFee(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regions">Regiões (uma por linha)</Label>
            <p className="text-xs text-muted-foreground">
              Formato sugerido: UF — Cidade — Comarca — Fórum (separe com traço longo “ — ”)
            </p>
            <Textarea
              id="regions"
              rows={5}
              value={regionsText}
              onChange={(e) => setRegionsText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avail">Disponibilidade / observações</Label>
            <Textarea
              id="avail"
              rows={3}
              value={availabilityNote}
              onChange={(e) => setAvailabilityNote(e.target.value)}
              placeholder="Ex.: segundas e quartas manhã"
            />
          </div>

          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

          <Button onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
