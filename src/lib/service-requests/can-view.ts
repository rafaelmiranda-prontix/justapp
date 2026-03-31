import { prisma } from '@/lib/prisma'
import { canAccessServiceRequest, type ServiceRequestWithParties } from './access'

export async function canViewServiceRequestDetail(
  userId: string,
  role: string,
  row: ServiceRequestWithParties
): Promise<boolean> {
  if (canAccessServiceRequest(userId, role, row)) return true
  if (
    role === 'ADVOGADO' &&
    row.status === 'PUBLICADO' &&
    !row.correspondentAdvogadoId
  ) {
    const advogado = await prisma.advogados.findUnique({
      where: { userId },
      include: { correspondentProfile: true },
    })
    if (advogado?.correspondentProfile?.isActive) return true
  }
  return false
}
