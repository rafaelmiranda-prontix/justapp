import { prisma } from '@/lib/prisma'
import type { ServiceRequest } from '@prisma/client'

export type ServiceRequestWithParties = ServiceRequest & {
  solicitor: { id: string; userId: string; users: { id: string; name: string; email: string } }
  correspondent: {
    id: string
    userId: string
    users: { id: string; name: string; email: string }
  } | null
}

export async function getServiceRequestWithParties(id: string) {
  return prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      solicitor: { include: { users: { select: { id: true, name: true, email: true } } } },
      correspondent: {
        include: { users: { select: { id: true, name: true, email: true } } },
      },
    },
  })
}

export function canAccessServiceRequest(
  userId: string,
  role: string,
  req: ServiceRequestWithParties
): boolean {
  if (role === 'ADMIN') return true
  if (req.solicitor.userId === userId) return true
  if (req.correspondent?.userId === userId) return true
  return false
}

export async function getAdvogadoForUserId(userId: string) {
  return prisma.advogados.findUnique({
    where: { userId },
    include: { users: { select: { id: true, name: true, email: true, status: true, role: true } } },
  })
}
