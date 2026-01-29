'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import { useRouter } from 'next/navigation'

interface SubscriptionStatusProps {
  plano: string
  planoExpira: string | null
  isActive: boolean
  leadsRecebidosMes: number
  leadsLimiteMes: number
  ultimoResetLeads: string
}

export function SubscriptionStatus({
  plano,
  planoExpira,
  isActive,
  leadsRecebidosMes,
  leadsLimiteMes,
  ultimoResetLeads,
}: SubscriptionStatusProps) {
  const router = useRouter()
  const planConfig = PLANS[plano as keyof typeof PLANS]
  const isUnlimited = leadsLimiteMes === -1
  const progress = isUnlimited ? 0 : (leadsRecebidosMes / leadsLimiteMes) * 100

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal')
      const result = await res.json()

      if (result.success && result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Plano Atual</CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Inativo
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Plano: {planConfig.name}</span>
            {planConfig.priceDisplay > 0 && (
              <span className="text-sm text-muted-foreground">
                {formatCurrency(planConfig.priceDisplay)}/mês
              </span>
            )}
          </div>
          {planoExpira && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Renova em: {formatDate(planoExpira)}
              </span>
            </div>
          )}
        </div>

        {!isUnlimited && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Leads do Mês</span>
              <span className="text-sm text-muted-foreground">
                {leadsRecebidosMes} / {leadsLimiteMes}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress >= 80 && (
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ Você está próximo do limite. Considere fazer upgrade.
              </p>
            )}
            {progress >= 100 && (
              <p className="text-xs text-destructive mt-2">
                ❌ Limite atingido. Faça upgrade para continuar recebendo leads.
              </p>
            )}
          </div>
        )}

        {isUnlimited && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Leads ilimitados - {leadsRecebidosMes} recebidos este mês</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Último reset: {formatDate(ultimoResetLeads)}
        </div>

        {isActive && planConfig.priceDisplay > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManageSubscription}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Gerenciar Assinatura
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
