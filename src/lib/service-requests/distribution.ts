import { prisma } from '@/lib/prisma'
import type { OperationalServiceKind, Plano, Prisma, ServiceRequest } from '@prisma/client'
import { ServiceRequestStatus } from '@prisma/client'
import { buildBaseOpportunityWhere } from './opportunity-eligibility'

const DEFAULT_RULE = {
  monthlyOpportunityQuota: 100,
  batchSize: 30,
  priorityWeight: 0,
  acceptanceWindowMinutes: 1440,
}

function yearMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getDistributionRuleForPlano(codigo: Plano) {
  const planRow = await prisma.planos.findUnique({ where: { codigo } })
  if (!planRow) return DEFAULT_RULE
  const rule = await prisma.planDistributionRule.findUnique({
    where: { planId: planRow.id },
  })
  if (!rule) return DEFAULT_RULE
  return {
    monthlyOpportunityQuota: rule.monthlyOpportunityQuota,
    batchSize: rule.batchSize,
    priorityWeight: rule.priorityWeight,
    acceptanceWindowMinutes: rule.acceptanceWindowMinutes,
  }
}

async function getGlobalBatchConfig() {
  const agg = await prisma.planDistributionRule.aggregate({
    _max: { batchSize: true, acceptanceWindowMinutes: true },
  })
  return {
    batchSize: agg._max.batchSize ?? DEFAULT_RULE.batchSize,
    acceptanceWindowMinutes: agg._max.acceptanceWindowMinutes ?? DEFAULT_RULE.acceptanceWindowMinutes,
  }
}

export async function canUserReceiveMoreOpportunities(userId: string): Promise<boolean> {
  const adv = await prisma.advogados.findUnique({
    where: { userId },
    select: { plano: true },
  })
  if (!adv) return false
  const rule = await getDistributionRuleForPlano(adv.plano)
  if (rule.monthlyOpportunityQuota < 0) return true
  const ref = yearMonth()
  const usage = await prisma.userDistributionQuotaUsage.findUnique({
    where: { userId_referenceMonth: { userId, referenceMonth: ref } },
  })
  const used = usage?.opportunitiesDelivered ?? 0
  return used < rule.monthlyOpportunityQuota
}

async function incrementOpportunityDelivered(userId: string) {
  const ref = yearMonth()
  await prisma.userDistributionQuotaUsage.upsert({
    where: { userId_referenceMonth: { userId, referenceMonth: ref } },
    create: { userId, referenceMonth: ref, opportunitiesDelivered: 1 },
    update: { opportunitiesDelivered: { increment: 1 } },
  })
}

type ProfileWithRelations = {
  advogadoId: string
  acceptedKinds: { kind: OperationalServiceKind }[]
  regions: { comarca: string | null; forum: string | null; cidade: string | null; estado: string | null }[]
  advogados: { id: string; plano: Plano; userId: string }
}

export function profileMatchesServiceRequest(
  profile: ProfileWithRelations,
  request: Pick<ServiceRequest, 'kind' | 'comarca' | 'forum' | 'location'>
): boolean {
  const kinds = profile.acceptedKinds.map((k) => k.kind)
  if (kinds.length > 0 && !kinds.includes(request.kind)) return false
  if (!profile.regions.length) return true
  return profile.regions.some((reg) => {
    const c = reg.comarca?.trim()
    const f = reg.forum?.trim()
    const city = reg.cidade?.trim()
    const uf = reg.estado?.trim()
    if (!c && !f && !city && !uf) return false
    if (c && request.comarca?.toLowerCase().includes(c.toLowerCase())) return true
    if (f && request.forum?.toLowerCase().includes(f.toLowerCase())) return true
    const loc = request.location?.toLowerCase() ?? ''
    if (city && loc.includes(city.toLowerCase())) return true
    if (uf && loc.includes(uf.toLowerCase())) return true
    return false
  })
}

export async function seedDistributionBatchForRequest(requestId: string) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } })
  if (!request || request.status !== ServiceRequestStatus.PUBLICADO) return

  const existing = await prisma.serviceDistributionBatch.findFirst({
    where: { requestId },
  })
  if (existing) return

  const profiles = await prisma.correspondentProfile.findMany({
    where: {
      isActive: true,
      advogados: {
        aprovado: true,
        id: { not: request.solicitorAdvogadoId },
      },
    },
    include: {
      acceptedKinds: true,
      regions: true,
      advogados: { select: { id: true, plano: true, userId: true } },
    },
  })

  const eligible: { advogadoId: string; userId: string; score: number }[] = []
  for (const p of profiles) {
    if (!profileMatchesServiceRequest(p, request)) continue
    const rule = await getDistributionRuleForPlano(p.advogados.plano)
    eligible.push({
      advogadoId: p.advogadoId,
      userId: p.advogados.userId,
      score: rule.priorityWeight,
    })
  }

  eligible.sort((a, b) => b.score - a.score || a.advogadoId.localeCompare(b.advogadoId))

  const { batchSize, acceptanceWindowMinutes } = await getGlobalBatchConfig()
  const slice = eligible.slice(0, Math.max(1, batchSize))
  const endsAt = new Date(Date.now() + acceptanceWindowMinutes * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    const batch = await tx.serviceDistributionBatch.create({
      data: {
        requestId,
        batchNumber: 1,
        acceptanceWindowEndsAt: endsAt,
        status: 'OPEN',
      },
    })
    if (slice.length === 0) return
    await tx.serviceDistributionCandidate.createMany({
      data: slice.map((e) => ({
        requestId,
        batchId: batch.id,
        advogadoId: e.advogadoId,
        priorityScore: e.score,
      })),
    })
  })
}

export function buildOpportunityAccessWhere(
  advogadoId: string,
  base: Prisma.ServiceRequestWhereInput
): Prisma.ServiceRequestWhereInput {
  const now = new Date()
  return {
    AND: [
      base,
      {
        OR: [
          { distributionBatches: { none: {} } },
          {
            distributionCandidates: {
              some: {
                advogadoId,
                batch: {
                  status: 'OPEN',
                  acceptanceWindowEndsAt: { gte: now },
                },
              },
            },
          },
        ],
      },
    ],
  }
}

/**
 * Primeira listagem da oportunidade para este correspondente: consome cota de exposição (idempotente).
 */
export async function recordOpportunityExposureIfNeeded(
  requestId: string,
  advogadoId: string,
  advogadoUserId: string
) {
  const candidate = await prisma.serviceDistributionCandidate.findFirst({
    where: { requestId, advogadoId, exposureCountedAt: null },
  })
  if (!candidate) return
  if (!(await canUserReceiveMoreOpportunities(advogadoUserId))) return
  await prisma.$transaction(async (tx) => {
    const c = await tx.serviceDistributionCandidate.findFirst({
      where: { id: candidate.id, exposureCountedAt: null },
    })
    if (!c) return
    if (!(await canUserReceiveMoreOpportunities(advogadoUserId))) return
    await tx.serviceDistributionCandidate.update({
      where: { id: candidate.id },
      data: { exposureCountedAt: new Date() },
    })
    const ref = yearMonth()
    await tx.userDistributionQuotaUsage.upsert({
      where: { userId_referenceMonth: { userId: advogadoUserId, referenceMonth: ref } },
      create: { userId: advogadoUserId, referenceMonth: ref, opportunitiesDelivered: 1 },
      update: { opportunitiesDelivered: { increment: 1 } },
    })
  })
}

/**
 * Fecha lotes expirados e abre próximo lote com novos correspondentes elegíveis.
 */
export async function expandDistributionForExpiredBatches() {
  const now = new Date()
  const expired = await prisma.serviceDistributionBatch.findMany({
    where: {
      status: 'OPEN',
      acceptanceWindowEndsAt: { lt: now },
      request: {
        status: ServiceRequestStatus.PUBLICADO,
        correspondentAdvogadoId: null,
      },
    },
    include: { request: true },
  })

  for (const batch of expired) {
    await prisma.$transaction(async (tx) => {
      const req = batch.request
      await tx.serviceDistributionBatch.update({
        where: { id: batch.id },
        data: { status: 'CLOSED' },
      })

      const already = await tx.serviceDistributionCandidate.findMany({
        where: { requestId: req.id },
        select: { advogadoId: true },
      })
      const excludeIds = new Set(already.map((a) => a.advogadoId))

      const profiles = await tx.correspondentProfile.findMany({
        where: {
          isActive: true,
          advogados: {
            aprovado: true,
            id: { not: req.solicitorAdvogadoId },
          },
        },
        include: {
          acceptedKinds: true,
          regions: true,
          advogados: { select: { id: true, plano: true, userId: true } },
        },
      })

      const eligible: { advogadoId: string; score: number }[] = []
      for (const p of profiles) {
        if (excludeIds.has(p.advogadoId)) continue
        if (!profileMatchesServiceRequest(p, req)) continue
        const rule = await getDistributionRuleForPlano(p.advogados.plano)
        eligible.push({ advogadoId: p.advogadoId, score: rule.priorityWeight })
      }
      eligible.sort((a, b) => b.score - a.score || a.advogadoId.localeCompare(b.advogadoId))

      const { batchSize, acceptanceWindowMinutes } = await getGlobalBatchConfig()
      const lastBatch = await tx.serviceDistributionBatch.findFirst({
        where: { requestId: req.id },
        orderBy: { batchNumber: 'desc' },
      })
      const nextNum = lastBatch?.batchNumber ?? 0
      const slice = eligible.slice(0, Math.max(1, batchSize))
      if (slice.length === 0) return

      const endsAt = new Date(Date.now() + acceptanceWindowMinutes * 60 * 1000)
      const nb = await tx.serviceDistributionBatch.create({
        data: {
          requestId: req.id,
          batchNumber: nextNum + 1,
          acceptanceWindowEndsAt: endsAt,
          status: 'OPEN',
        },
      })
      await tx.serviceDistributionCandidate.createMany({
        data: slice.map((e) => ({
          requestId: req.id,
          batchId: nb.id,
          advogadoId: e.advogadoId,
          priorityScore: e.score,
        })),
      })
    })
  }
}
