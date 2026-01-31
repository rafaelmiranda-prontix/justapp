'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface HistoryItem {
  id: string
  plano: {
    codigo: string
    nome: string
    preco: number
    leadsLimite: number
  }
  status: string
  inicioEm: string
  fimEm: string | null
  motivo: string | null
  canceladoPor: string | null
  duracao: number
}

interface SubscriptionHistoryProps {
  history: HistoryItem[]
}

const statusConfig = {
  ATIVA: {
    label: 'Ativa',
    icon: CheckCircle2,
    variant: 'default' as const,
    color: 'text-green-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-red-500',
  },
  EXPIRADA: {
    label: 'Expirada',
    icon: AlertCircle,
    variant: 'secondary' as const,
    color: 'text-yellow-500',
  },
  SUSPENSA: {
    label: 'Suspensa',
    icon: AlertCircle,
    variant: 'outline' as const,
    color: 'text-orange-500',
  },
}

export function SubscriptionHistory({ history }: SubscriptionHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma assinatura registrada ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Assinaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig]
            const Icon = config?.icon || Clock

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`mt-1 ${config?.color || 'text-gray-500'}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{item.plano.nome}</h4>
                    <Badge variant={config?.variant || 'default'}>
                      {config?.label || item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {item.plano.preco === 0
                        ? 'Gratuito'
                        : `${formatCurrency(item.plano.preco / 100)}/mês`}
                    </span>
                    <span>•</span>
                    <span>
                      {item.plano.leadsLimite === -1
                        ? 'Leads ilimitados'
                        : `${item.plano.leadsLimite} leads/mês`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Iniciou em {formatDate(new Date(item.inicioEm))}
                    </span>
                    {item.fimEm && (
                      <>
                        <span>•</span>
                        <span>Finalizou em {formatDate(new Date(item.fimEm))}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {item.duracao} dia{item.duracao !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {item.motivo && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Motivo:</span> {item.motivo}
                    </div>
                  )}

                  {item.canceladoPor && item.canceladoPor !== 'USUARIO' && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Cancelado por:</span>{' '}
                      {item.canceladoPor === 'ADMIN'
                        ? 'Administrador'
                        : item.canceladoPor === 'SISTEMA'
                          ? 'Sistema'
                          : 'Falha no pagamento'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
