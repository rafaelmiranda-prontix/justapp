import { inAppNotificationService } from '@/lib/in-app-notification.service'
import type { NotificationType } from '@prisma/client'

function hrefFor(requestId: string) {
  return `/advogado/audiencias-diligencias/${requestId}`
}

export async function notifyServiceRequestEvent(params: {
  type: NotificationType
  userIds: string[]
  title: string
  message: string
  requestId: string
  extra?: Record<string, unknown>
}) {
  const { type, userIds, title, message, requestId, extra } = params
  if (userIds.length === 0) return
  await inAppNotificationService.notifyMany(userIds, {
    type,
    title,
    message,
    href: hrefFor(requestId),
    metadata: { serviceRequestId: requestId, ...extra },
  })
}
