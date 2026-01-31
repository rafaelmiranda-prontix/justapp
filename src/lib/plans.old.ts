import { ConfigService } from './config-service'

export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM'

export interface PlanConfig {
  name: string
  price: number // em centavos (R$)
  priceDisplay: number // para exibição
  leadsPerMonth: number // -1 = ilimitado
  features: string[]
  stripePriceId?: string // ID do preço no Stripe
}

// Configuração estática dos planos (exceto leadsPerMonth que vem do banco)
export const PLANS_STATIC: Record<PlanType, Omit<PlanConfig, 'leadsPerMonth'>> = {
  FREE: {
    name: 'Gratuito',
    price: 0,
    priceDisplay: 0,
    features: [
      'Perfil básico na plataforma',
      'Visualização de casos compatíveis',
      'Leads mensais limitados',
    ],
  },
  BASIC: {
    name: 'Básico',
    price: 9900, // R$ 99,00 em centavos
    priceDisplay: 99,
    features: [
      'Leads qualificados por mês',
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
    features: [
      'Máximo de leads qualificados',
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

// Valores padrão caso falhe buscar do banco
const DEFAULT_LEADS = {
  FREE: 3,
  BASIC: 10,
  PREMIUM: 50, // 50 será tratado como ilimitado
}

// Cache dos limites de leads
let leadsCache: Record<PlanType, number> | null = null
let lastCacheUpdate: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Busca limites de leads do banco de dados com cache
 */
async function fetchLeadsLimits(): Promise<Record<PlanType, number>> {
  try {
    const [freeLimits, basicLimits, premiumLimits] = await Promise.all([
      ConfigService.get<number>('free_plan_monthly_leads', DEFAULT_LEADS.FREE),
      ConfigService.get<number>('basic_plan_monthly_leads', DEFAULT_LEADS.BASIC),
      ConfigService.get<number>('premium_plan_monthly_leads', DEFAULT_LEADS.PREMIUM),
    ])

    return {
      FREE: freeLimits,
      BASIC: basicLimits,
      PREMIUM: premiumLimits,
    }
  } catch (error) {
    console.error('[Plans] Error fetching leads limits from config:', error)
    return DEFAULT_LEADS
  }
}

/**
 * Obtém limites de leads com cache
 */
async function getLeadsLimitsWithCache(): Promise<Record<PlanType, number>> {
  const now = Date.now()

  // Verificar se cache é válido
  if (leadsCache && (now - lastCacheUpdate) < CACHE_TTL) {
    return leadsCache
  }

  // Buscar do banco
  leadsCache = await fetchLeadsLimits()
  lastCacheUpdate = now

  return leadsCache
}

/**
 * Obtém configuração completa do plano (async)
 */
export async function getPlanConfig(plan: PlanType): Promise<PlanConfig> {
  const limits = await getLeadsLimitsWithCache()
  const staticConfig = PLANS_STATIC[plan]

  return {
    ...staticConfig,
    leadsPerMonth: limits[plan],
  }
}

/**
 * Obtém limites de leads do plano (async)
 */
export async function getPlanLimits(plan: PlanType): Promise<{
  leadsPerMonth: number
  isUnlimited: boolean
}> {
  const limits = await getLeadsLimitsWithCache()
  const leadsPerMonth = limits[plan]

  return {
    leadsPerMonth,
    isUnlimited: leadsPerMonth === -1 || leadsPerMonth >= 999,
  }
}

/**
 * Versão síncrona com valores padrão (usar apenas quando async não é possível)
 */
export function getPlanLimitsSync(plan: PlanType): {
  leadsPerMonth: number
  isUnlimited: boolean
} {
  // Usa cache se disponível, senão usa defaults
  const limits = leadsCache || DEFAULT_LEADS
  const leadsPerMonth = limits[plan]

  return {
    leadsPerMonth,
    isUnlimited: leadsPerMonth === -1 || leadsPerMonth >= 999,
  }
}

export function canReceiveLead(
  plan: PlanType,
  leadsRecebidosMes: number,
  leadsLimiteMes: number
): boolean {
  // Usa leadsLimiteMes do banco (já armazenado no advogado)
  if (leadsLimiteMes === -1 || leadsLimiteMes >= 999) {
    return true // Ilimitado
  }

  return leadsRecebidosMes < leadsLimiteMes
}
