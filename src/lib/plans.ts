import { prisma } from './prisma'

export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM' | 'UNLIMITED'

export type PlanStatus = 'ACTIVE' | 'COMING_SOON' | 'HIDDEN'

export interface PlanConfig {
  id: string
  codigo: PlanType
  name: string
  description?: string
  price: number // em centavos (R$)
  priceDisplay: number // para exibição
  leadsPerMonth: number // -1 = ilimitado
  leadsPerHour?: number // -1 = ilimitado (apenas para planos ilimitados), padrão 5
  features: string[]
  stripePriceId?: string
  ativo: boolean
  status: PlanStatus
  ordem: number
}

// Cache dos planos
let plansCache: Record<PlanType, PlanConfig> | null = null
let lastCacheUpdate: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Valores padrão caso falhe buscar do banco
// Exportado como PLANS_STATIC para compatibilidade com client components
export const PLANS_STATIC: Record<PlanType, Omit<PlanConfig, 'id'>> = {
  FREE: {
    codigo: 'FREE',
    name: 'Gratuito',
    description: 'Plano gratuito com recursos básicos',
    price: 0,
    priceDisplay: 0,
    leadsPerMonth: 3,
    leadsPerHour: 5,
    features: [
      'Perfil básico na plataforma',
      'Visualização de casos compatíveis',
      'Leads mensais limitados',
    ],
    ativo: true,
    status: 'ACTIVE',
    ordem: 1,
  },
  BASIC: {
    codigo: 'BASIC',
    name: 'Básico',
    description: 'Plano ideal para advogados iniciantes',
    price: 9900,
    priceDisplay: 99,
    leadsPerMonth: 10,
    leadsPerHour: 5,
    features: [
      'Leads qualificados por mês',
      'Perfil completo destacado',
      'Suporte por email',
      'Dashboard de métricas',
      'Avaliações de clientes',
    ],
    ativo: true,
    status: 'COMING_SOON',
    ordem: 2,
  },
  PREMIUM: {
    codigo: 'PREMIUM',
    name: 'Premium',
    description: 'Plano completo para profissionais estabelecidos',
    price: 29900,
    priceDisplay: 299,
    leadsPerMonth: 50,
    leadsPerHour: 5,
    features: [
      'Máximo de leads qualificados',
      'Perfil destacado no topo',
      'Suporte prioritário',
      'Dashboard avançado',
      'Avaliações de clientes',
      'Relatórios detalhados',
      'Badge "Premium" no perfil',
    ],
    ativo: true,
    status: 'COMING_SOON',
    ordem: 3,
  },
  UNLIMITED: {
    codigo: 'UNLIMITED',
    name: 'Ilimitado',
    description: 'Plano personalizado para grandes volumes',
    price: 0,
    priceDisplay: 0,
    leadsPerMonth: -1,
    leadsPerHour: -1,
    features: [
      'Leads ilimitados',
      'Perfil destacado premium',
      'Suporte prioritário dedicado',
      'Dashboard avançado com BI',
      'Relatórios personalizados',
      'Gerente de conta exclusivo',
      'Integração API',
    ],
    ativo: true,
    status: 'HIDDEN',
    ordem: 4,
  },
}

/**
 * Busca planos do banco de dados
 */
async function fetchPlansFromDB(): Promise<Record<PlanType, PlanConfig>> {
  try {
    const planos = await prisma.planos.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    })

    const plansMap: Record<string, PlanConfig> = {}

    for (const plano of planos) {
      plansMap[plano.codigo] = {
        id: plano.id,
        codigo: plano.codigo as PlanType,
        name: plano.nome,
        description: plano.descricao || undefined,
        price: plano.preco,
        priceDisplay: plano.precoDisplay,
        leadsPerMonth: plano.leadsPerMonth,
        leadsPerHour: plano.leadsPerHour ?? 5, // Default 5 se não definido
        features: plano.features,
        stripePriceId: plano.stripePriceId || undefined,
        ativo: plano.ativo,
        status: (plano.status || 'ACTIVE') as PlanStatus,
        ordem: plano.ordem,
      }
    }

    // Garantir que todos os planos existam
    return {
      FREE: plansMap.FREE || { ...PLANS_STATIC.FREE, id: 'default-free' },
      BASIC: plansMap.BASIC || { ...PLANS_STATIC.BASIC, id: 'default-basic' },
      PREMIUM: plansMap.PREMIUM || { ...PLANS_STATIC.PREMIUM, id: 'default-premium' },
      UNLIMITED: plansMap.UNLIMITED || { ...PLANS_STATIC.UNLIMITED, id: 'default-unlimited' },
    }
  } catch (error) {
    console.error('[Plans] Error fetching plans from database:', error)
    // Retornar defaults com IDs temporários
    return {
      FREE: { ...PLANS_STATIC.FREE, id: 'default-free' },
      BASIC: { ...PLANS_STATIC.BASIC, id: 'default-basic' },
      PREMIUM: { ...PLANS_STATIC.PREMIUM, id: 'default-premium' },
      UNLIMITED: { ...PLANS_STATIC.UNLIMITED, id: 'default-unlimited' },
    }
  }
}

/**
 * Obtém planos com cache
 */
async function getPlansWithCache(): Promise<Record<PlanType, PlanConfig>> {
  const now = Date.now()

  // Verificar se cache é válido
  if (plansCache && now - lastCacheUpdate < CACHE_TTL) {
    return plansCache
  }

  // Buscar do banco
  plansCache = await fetchPlansFromDB()
  lastCacheUpdate = now

  return plansCache
}

/**
 * Obtém configuração completa do plano (async)
 */
export async function getPlanConfig(plan: PlanType): Promise<PlanConfig> {
  const plans = await getPlansWithCache()
  return plans[plan]
}

/**
 * Obtém todos os planos ativos
 */
export async function getAllPlans(): Promise<Record<PlanType, PlanConfig>> {
  return getPlansWithCache()
}

/**
 * Obtém limites de leads do plano (async)
 */
export async function getPlanLimits(
  plan: PlanType
): Promise<{
  leadsPerMonth: number
  leadsPerHour: number
  isUnlimited: boolean
}> {
  const planConfig = await getPlanConfig(plan)
  const leadsPerMonth = planConfig.leadsPerMonth
  const leadsPerHour = planConfig.leadsPerHour ?? 5 // Default 5 se não definido

  return {
    leadsPerMonth,
    leadsPerHour,
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
  const plans = plansCache || PLANS_STATIC
  const leadsPerMonth = (plans[plan] as PlanConfig).leadsPerMonth

  return {
    leadsPerMonth,
    isUnlimited: leadsPerMonth === -1 || leadsPerMonth >= 999,
  }
}

/**
 * Verifica se advogado pode receber mais leads
 */
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

/**
 * Invalida o cache (útil após atualizar planos no banco)
 */
export function invalidatePlansCache(): void {
  plansCache = null
  lastCacheUpdate = 0
}
