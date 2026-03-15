'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CheckCircle2, XCircle, MapPin, Scale, Star, UserCheck, CreditCard, Eye, Loader2 } from 'lucide-react'
import { formatOAB } from '@/lib/utils'

interface AdvogadoModerationCardProps {
  advogado: {
    id: string
    oab: string
    oabVerificado: boolean
    aprovado: boolean
    preAprovado?: boolean
    onboardingCompleted?: boolean
    plano?: string
    planoExpira?: string | null
    cidade: string
    estado: string
    createdAt: string
    users: {
      id: string
      name: string
      email: string
      status?: string
    }
    especialidades?: Array<{
      especialidade: {
        nome: string
      }
    }>
    avaliacaoMedia: number
    totalAvaliacoes: number
  }
  onApprove: () => void
  onPreApprove?: () => void
  onReject: () => void
  onCompleteOnboarding?: () => void
  onUpdatePlan?: (plano: string) => void
}

type AdvogadoDetail = {
  id: string
  oab: string
  oabVerificado: boolean
  aprovado: boolean
  preAprovado?: boolean
  bio: string | null
  fotoUrl: string | null
  cidade: string
  estado: string
  latitude: number | null
  longitude: number | null
  raioAtuacao: number
  precoConsulta: number | null
  aceitaOnline: boolean
  aceitaOutrosEstados: boolean
  plano: string
  planoExpira: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  leadsRecebidosMes: number
  leadsLimiteMes: number
  ultimoResetLeads: string
  casosRecebidosHora: number
  ultimoResetCasosHora: string
  isBeta: boolean
  betaInviteCode: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
  users: {
    id: string
    name: string
    email: string
    phone: string | null
    image: string | null
    status: string
    emailVerified: string | null
    createdAt: string
    updatedAt: string
  }
  especialidades: Array<{ id: string; nome: string; slug: string }>
  avaliacaoMedia: number
  totalAvaliacoes: number
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 py-1 text-sm">
      <span className="font-medium text-muted-foreground min-w-[140px]">{label}:</span>
      <span className="text-foreground">{value ?? '—'}</span>
    </div>
  )
}

export function AdvogadoModerationCard({
  advogado,
  onApprove,
  onPreApprove,
  onReject,
  onCompleteOnboarding,
  onUpdatePlan,
}: AdvogadoModerationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<AdvogadoDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/advogados/${advogado.id}`)
      const result = await res.json()
      if (result.success && result.data) setDetailData(result.data)
    } finally {
      setLoadingDetail(false)
    }
  }, [advogado.id])

  const openDetail = () => {
    setDetailOpen(true)
    setDetailData(null)
    fetchDetail()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(advogado.users.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-lg">{advogado.users.name}</CardTitle>
              {advogado.aprovado ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovado
                </Badge>
              ) : advogado.preAprovado ? (
                <Badge variant="secondary" className="bg-blue-500 text-white">
                  Pré-aprovado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  Pendente
                </Badge>
              )}
              {advogado.onboardingCompleted ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Onboarding Completo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  Onboarding Incompleto
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                {formatOAB(advogado.oab)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {advogado.cidade}, {advogado.estado}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Email:</p>
          <p className="text-sm text-muted-foreground">{advogado.users.email}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={openDetail}
          disabled={loadingDetail}
        >
          <Eye className="h-4 w-4 mr-2" />
          {loadingDetail ? 'Carregando...' : 'Ver detalhes'}
        </Button>

        {advogado.especialidades && advogado.especialidades.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-2">
              {advogado.especialidades.map((esp, idx) => (
                <Badge key={idx} variant="outline">
                  {esp.especialidade?.nome || 'N/A'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {advogado.totalAvaliacoes > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {advogado.avaliacaoMedia.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({advogado.totalAvaliacoes}{' '}
              {advogado.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}

        {onUpdatePlan && (
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Plano Atual:</p>
                <Badge variant="outline" className="ml-auto">
                  {advogado.plano || 'FREE'}
                </Badge>
              </div>
              {advogado.planoExpira && (
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(advogado.planoExpira).toLocaleDateString('pt-BR')}
                </p>
              )}
              <Select
                value={advogado.plano || 'FREE'}
                onValueChange={(value) => {
                  if (value !== advogado.plano) {
                    if (confirm(`Alterar plano de ${advogado.plano || 'FREE'} para ${value}?`)) {
                      onUpdatePlan(value)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE - Gratuito</SelectItem>
                  <SelectItem value="BASIC">BASIC - Básico</SelectItem>
                  <SelectItem value="PREMIUM">PREMIUM - Premium</SelectItem>
                  <SelectItem value="UNLIMITED">UNLIMITED - Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!advogado.onboardingCompleted && onCompleteOnboarding && (
          <div className="pt-2 border-t">
            <Button
              onClick={onCompleteOnboarding}
              variant="default"
              className="w-full"
              size="sm"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Completar Onboarding
            </Button>
          </div>
        )}
        {!advogado.aprovado && (
          <div className="flex flex-wrap gap-2 pt-2">
            {advogado.preAprovado ? (
              <>
                <Button onClick={onApprove} className="flex-1" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar e Liberar
                </Button>
                <Button onClick={onReject} variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            ) : (
              <>
                {onPreApprove && (
                  <Button onClick={onPreApprove} variant="secondary" className="flex-1" size="sm">
                    Pré-aprovar
                  </Button>
                )}
                <Button onClick={onApprove} className="flex-1" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar e Liberar
                </Button>
                <Button onClick={onReject} variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        )}
        {advogado.aprovado && (
          <div className="pt-2">
            <Button
              onClick={onReject}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Revogar Aprovação
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados cadastrais do advogado</DialogTitle>
            <DialogDescription>
              Informações completas do cadastro e do usuário
            </DialogDescription>
          </DialogHeader>
          {loadingDetail && !detailData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailData ? (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base border-b pb-2 mb-2">Dados do usuário</h3>
                <DetailRow label="Nome" value={detailData.users.name} />
                <DetailRow label="Email" value={detailData.users.email} />
                <DetailRow label="Telefone" value={detailData.users.phone} />
                <DetailRow label="Status da conta" value={detailData.users.status} />
                <DetailRow
                  label="Email verificado"
                  value={detailData.users.emailVerified ? new Date(detailData.users.emailVerified).toLocaleString('pt-BR') : 'Não'}
                />
                <DetailRow label="Cadastro em" value={new Date(detailData.users.createdAt).toLocaleString('pt-BR')} />
                <DetailRow label="Atualizado em" value={new Date(detailData.users.updatedAt).toLocaleString('pt-BR')} />
              </section>

              <section>
                <h3 className="font-semibold text-base border-b pb-2 mb-2">Dados profissionais</h3>
                <DetailRow label="OAB" value={formatOAB(detailData.oab)} />
                <DetailRow label="OAB verificado" value={detailData.oabVerificado ? 'Sim' : 'Não'} />
                <DetailRow label="Aprovado" value={detailData.aprovado ? 'Sim' : 'Não'} />
                <DetailRow label="Pré-aprovado" value={detailData.preAprovado ? 'Sim' : 'Não'} />
                <DetailRow label="Onboarding completo" value={detailData.onboardingCompleted ? 'Sim' : 'Não'} />
                <DetailRow label="Cidade" value={detailData.cidade} />
                <DetailRow label="Estado" value={detailData.estado} />
                <DetailRow label="Raio de atuação (km)" value={detailData.raioAtuacao} />
                <DetailRow
                  label="Preço consulta (R$)"
                  value={detailData.precoConsulta != null ? Number(detailData.precoConsulta).toFixed(2) : null}
                />
                <DetailRow label="Aceita online" value={detailData.aceitaOnline ? 'Sim' : 'Não'} />
                <DetailRow label="Aceita outros estados" value={detailData.aceitaOutrosEstados ? 'Sim' : 'Não'} />
                {detailData.bio && (
                  <DetailRow label="Bio" value={<span className="whitespace-pre-wrap">{detailData.bio}</span>} />
                )}
                <DetailRow label="Foto URL" value={detailData.fotoUrl ? 'Sim' : 'Não'} />
              </section>

              <section>
                <h3 className="font-semibold text-base border-b pb-2 mb-2">Plano e limites</h3>
                <DetailRow label="Plano" value={detailData.plano} />
                <DetailRow
                  label="Plano expira"
                  value={detailData.planoExpira ? new Date(detailData.planoExpira).toLocaleDateString('pt-BR') : null}
                />
                <DetailRow label="Leads recebidos (mês)" value={detailData.leadsRecebidosMes} />
                <DetailRow label="Limite leads (mês)" value={detailData.leadsLimiteMes === -1 ? 'Ilimitado' : detailData.leadsLimiteMes} />
                <DetailRow label="Último reset leads" value={new Date(detailData.ultimoResetLeads).toLocaleString('pt-BR')} />
                <DetailRow label="Casos recebidos (hora)" value={detailData.casosRecebidosHora} />
                <DetailRow label="Beta" value={detailData.isBeta ? 'Sim' : 'Não'} />
                {detailData.betaInviteCode && (
                  <DetailRow label="Código convite beta" value={detailData.betaInviteCode} />
                )}
              </section>

              {detailData.especialidades && detailData.especialidades.length > 0 && (
                <section>
                  <h3 className="font-semibold text-base border-b pb-2 mb-2">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailData.especialidades.map((e) => (
                      <Badge key={e.id} variant="outline">{e.nome}</Badge>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="font-semibold text-base border-b pb-2 mb-2">Avaliações</h3>
                <DetailRow label="Média" value={detailData.avaliacaoMedia.toFixed(1)} />
                <DetailRow label="Total de avaliações" value={detailData.totalAvaliacoes} />
              </section>

              <section>
                <h3 className="font-semibold text-base border-b pb-2 mb-2">Datas do perfil</h3>
                <DetailRow label="Criado em" value={new Date(detailData.createdAt).toLocaleString('pt-BR')} />
                <DetailRow label="Atualizado em" value={new Date(detailData.updatedAt).toLocaleString('pt-BR')} />
              </section>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Não foi possível carregar os detalhes.</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
