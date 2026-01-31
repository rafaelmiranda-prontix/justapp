'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X } from 'lucide-react'
import { PLANS_STATIC as PLANS, type PlanConfig } from '@/lib/plans'
import { formatCurrency } from '@/lib/utils'

interface PlanComparisonProps {
  plans?: Record<string, PlanConfig>
}

export function PlanComparison({ plans }: PlanComparisonProps) {
  const planKeys = Object.keys(PLANS) as Array<keyof typeof PLANS>

  // Gerar valores de leads dinamicamente dos planos
  const leadsValues = plans
    ? {
        FREE: plans.FREE?.leadsPerMonth?.toString() || '0',
        BASIC: plans.BASIC?.leadsPerMonth?.toString() || '10',
        PREMIUM:
          plans.PREMIUM?.leadsPerMonth === -1 || (plans.PREMIUM?.leadsPerMonth ?? 0) >= 999
            ? 'Ilimitado'
            : plans.PREMIUM?.leadsPerMonth?.toString() || '50',
      }
    : {
        FREE: '3',
        BASIC: '10',
        PREMIUM: '50',
      }

  const features = [
    {
      name: 'Leads por mês',
      values: leadsValues,
    },
    {
      name: 'Perfil básico',
      values: { FREE: true, BASIC: true, PREMIUM: true },
    },
    {
      name: 'Perfil completo',
      values: { FREE: false, BASIC: true, PREMIUM: true },
    },
    {
      name: 'Perfil destacado',
      values: { FREE: false, BASIC: false, PREMIUM: true },
    },
    {
      name: 'Dashboard de métricas',
      values: { FREE: false, BASIC: true, PREMIUM: true },
    },
    {
      name: 'Dashboard avançado',
      values: { FREE: false, BASIC: false, PREMIUM: true },
    },
    {
      name: 'Suporte por email',
      values: { FREE: false, BASIC: true, PREMIUM: true },
    },
    {
      name: 'Suporte prioritário',
      values: { FREE: false, BASIC: false, PREMIUM: true },
    },
    {
      name: 'Relatórios detalhados',
      values: { FREE: false, BASIC: false, PREMIUM: true },
    },
    {
      name: 'Badge Premium',
      values: { FREE: false, BASIC: false, PREMIUM: true },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Planos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 font-semibold">Recurso</th>
                {planKeys.map((planKey) => (
                  <th key={planKey} className="text-center p-2 font-semibold">
                    {PLANS[planKey].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Preço</td>
                {planKeys.map((planKey) => (
                  <td key={planKey} className="text-center p-2">
                    {PLANS[planKey].priceDisplay === 0
                      ? 'Grátis'
                      : formatCurrency(PLANS[planKey].priceDisplay) + '/mês'}
                  </td>
                ))}
              </tr>
              {features.map((feature, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{feature.name}</td>
                  {planKeys.map((planKey) => {
                    const value = feature.values[planKey]
                    return (
                      <td key={planKey} className="text-center p-2">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{value}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
