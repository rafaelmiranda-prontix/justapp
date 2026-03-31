import type { OperationalServiceKind, ServiceRequestStatus } from '@prisma/client'

export const OPERATIONAL_KIND_LABEL: Record<OperationalServiceKind, string> = {
  AUDIENCIA: 'Audiência',
  PROTOCOLO: 'Protocolo',
  COPIA: 'Cópia',
  DILIGENCIA_FORUM: 'Diligência em fórum',
  DESPACHO: 'Despacho',
  PERSONALIZADO: 'Personalizado',
}

export const SERVICE_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  PUBLICADO: 'Publicado',
  ACEITO: 'Aceito',
  EM_ANDAMENTO: 'Em andamento',
  REALIZADO: 'Realizado',
  AGUARDANDO_VALIDACAO: 'Aguardando validação',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}
