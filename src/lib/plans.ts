export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM'

export interface PlanConfig {
  name: string
  price: number // em centavos (R$)
  priceDisplay: number // para exibição
  leadsPerMonth: number // -1 = ilimitado
  features: string[]
  stripePriceId?: string // ID do preço no Stripe
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: 'Gratuito',
    price: 0,
    priceDisplay: 0,
    leadsPerMonth: 0,
    features: [
      'Perfil básico na plataforma',
      'Visualização de casos compatíveis',
      'Sem leads mensais',
    ],
  },
  BASIC: {
    name: 'Básico',
    price: 9900, // R$ 99,00 em centavos
    priceDisplay: 99,
    leadsPerMonth: 10,
    features: [
      '10 leads qualificados por mês',
      'Perfil completo destacado',
      'Suporte por email',
      'Dashboard de métricas',
      'Avaliações de clientes',
    ],
    // stripePriceId será configurado nas variáveis de ambiente
  },
  PREMIUM: {
    name: 'Premium',
    price: 29900, // R$ 299,00 em centavos
    priceDisplay: 299,
    leadsPerMonth: -1, // Ilimitado
    features: [
      'Leads qualificados ilimitados',
      'Perfil destacado no topo',
      'Suporte prioritário',
      'Dashboard avançado',
      'Avaliações de clientes',
      'Relatórios detalhados',
      'Badge "Premium" no perfil',
    ],
    // stripePriceId será configurado nas variáveis de ambiente
  },
}

export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLANS[plan]
}

export function getPlanLimits(plan: PlanType): {
  leadsPerMonth: number
  isUnlimited: boolean
} {
  const config = PLANS[plan]
  return {
    leadsPerMonth: config.leadsPerMonth,
    isUnlimited: config.leadsPerMonth === -1,
  }
}

export function canReceiveLead(
  plan: PlanType,
  leadsRecebidosMes: number,
  leadsLimiteMes: number
): boolean {
  const limits = getPlanLimits(plan)

  if (limits.isUnlimited) {
    return true
  }

  return leadsRecebidosMes < leadsLimiteMes
}
