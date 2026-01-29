'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PlanConfig } from '@/lib/plans'

interface PlanCardProps {
  plan: PlanConfig
  planId: string
  currentPlan?: string
  onSelect: (planId: string) => void
  isLoading?: boolean
}

const planIcons = {
  FREE: Zap,
  BASIC: Zap,
  PREMIUM: Crown,
}

export function PlanCard({ plan, planId, currentPlan, onSelect, isLoading }: PlanCardProps) {
  const Icon = planIcons[planId as keyof typeof planIcons] || Zap
  const isCurrentPlan = currentPlan === planId
  const isFree = planId === 'FREE'

  return (
    <Card
      className={`relative ${
        planId === 'PREMIUM' ? 'border-primary border-2' : ''
      } ${isCurrentPlan ? 'bg-muted' : ''}`}
    >
      {planId === 'PREMIUM' && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Mais Popular
        </Badge>
      )}

      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {plan.priceDisplay === 0 ? 'Grátis' : formatCurrency(plan.priceDisplay)}
          </span>
          {plan.priceDisplay > 0 && (
            <span className="text-muted-foreground">/mês</span>
          )}
        </div>
        <CardDescription>
          {plan.leadsPerMonth === -1
            ? 'Leads ilimitados'
            : `${plan.leadsPerMonth} leads por mês`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={planId === 'PREMIUM' ? 'default' : 'outline'}
          onClick={() => onSelect(planId)}
          disabled={isCurrentPlan || isLoading || isFree}
        >
          {isCurrentPlan
            ? 'Plano Atual'
            : isFree
              ? 'Plano Gratuito'
              : 'Assinar Agora'}
        </Button>
      </CardContent>
    </Card>
  )
}
