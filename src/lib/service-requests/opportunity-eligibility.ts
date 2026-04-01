import type { OperationalServiceKind, Prisma } from '@prisma/client'
import { ServiceRequestStatus } from '@prisma/client'

export type CorrespondentRegionRow = {
  comarca: string | null
  forum: string | null
  cidade: string | null
  estado: string | null
}

/**
 * Filtro de região: se o correspondente não cadastrou regiões, não restringe por região.
 */
export function buildRegionWhereForOpportunities(
  regions: CorrespondentRegionRow[]
): Prisma.ServiceRequestWhereInput | null {
  if (!regions.length) return null
  const orClause: Prisma.ServiceRequestWhereInput[] = []
  for (const reg of regions) {
    const andParts: Prisma.ServiceRequestWhereInput[] = []
    if (reg.comarca?.trim()) {
      andParts.push({
        comarca: { contains: reg.comarca.trim(), mode: 'insensitive' },
      })
    }
    if (reg.forum?.trim()) {
      andParts.push({
        forum: { contains: reg.forum.trim(), mode: 'insensitive' },
      })
    }
    if (reg.cidade?.trim()) {
      andParts.push({
        location: { contains: reg.cidade.trim(), mode: 'insensitive' },
      })
    }
    if (reg.estado?.trim()) {
      andParts.push({
        location: { contains: reg.estado.trim(), mode: 'insensitive' },
      })
    }
    if (andParts.length > 0) {
      orClause.push(andParts.length === 1 ? andParts[0]! : { AND: andParts })
    }
  }
  if (orClause.length === 0) return null
  return { OR: orClause }
}

export function buildBaseOpportunityWhere(
  advogadoId: string,
  acceptedKinds: OperationalServiceKind[]
): Prisma.ServiceRequestWhereInput {
  const where: Prisma.ServiceRequestWhereInput = {
    status: ServiceRequestStatus.PUBLICADO,
    correspondentAdvogadoId: null,
    acceptDeadlineAt: { gte: new Date() },
    solicitorAdvogadoId: { not: advogadoId },
  }
  if (acceptedKinds.length > 0) {
    where.kind = { in: acceptedKinds }
  }
  return where
}
