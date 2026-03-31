import type { ServiceRequestStatus } from '@prisma/client'

type Actor = 'solicitor' | 'correspondent' | 'admin'

const correspondentAllowed: Partial<
  Record<ServiceRequestStatus, ServiceRequestStatus[]>
> = {
  ACEITO: ['EM_ANDAMENTO', 'CANCELADO'],
  EM_ANDAMENTO: ['REALIZADO', 'AGUARDANDO_VALIDACAO', 'CANCELADO'],
  REALIZADO: ['AGUARDANDO_VALIDACAO', 'CANCELADO'],
}

const solicitorAllowed: Partial<Record<ServiceRequestStatus, ServiceRequestStatus[]>> = {
  PUBLICADO: ['CANCELADO'],
  ACEITO: ['CANCELADO'],
  AGUARDANDO_VALIDACAO: ['CONCLUIDO'],
}

/** Admin pode forçar qualquer transição (justificativa obrigatória na API). */
export function isStatusTransitionAllowed(
  actor: Actor,
  from: ServiceRequestStatus,
  to: ServiceRequestStatus
): boolean {
  if (actor === 'admin') return from !== to
  if (actor === 'solicitor') {
    return solicitorAllowed[from]?.includes(to) ?? false
  }
  return correspondentAllowed[from]?.includes(to) ?? false
}
