import { prisma } from '@/lib/prisma'
import type { NotificationType, UserRole } from '@prisma/client'
import type { Prisma } from '@prisma/client'

export type InAppNotificationPayload = {
  type: NotificationType
  title: string
  message: string
  href: string
  metadata?: Record<string, unknown>
  role?: UserRole
}

/**
 * Serviço de notificações in-app (sino no header).
 * Centraliza a criação de notificações para o usuário ver na central.
 */
export const inAppNotificationService = {
  /**
   * Cria uma notificação para um usuário.
   */
  async notifyUser(userId: string, payload: InAppNotificationPayload): Promise<string | null> {
    const { type, title, message, href, metadata, role } = payload
    const messageTrimmed = message.slice(0, 160)
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          role: role ?? undefined,
          type,
          title: title.slice(0, 100),
          message: messageTrimmed,
          href,
          metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      })
      return notification.id
    } catch (e) {
      console.error('[inAppNotification] notifyUser error:', e)
      return null
    }
  },

  /**
   * Cria a mesma notificação para vários usuários.
   */
  async notifyMany(userIds: string[], payload: InAppNotificationPayload): Promise<number> {
    if (userIds.length === 0) return 0
    const { type, title, message, href, metadata, role } = payload
    const messageTrimmed = message.slice(0, 160)
    const titleTrimmed = title.slice(0, 100)
    try {
      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          role: role ?? undefined,
          type,
          title: titleTrimmed,
          message: messageTrimmed,
          href,
          metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        })),
      })
      return userIds.length
    } catch (e) {
      console.error('[inAppNotification] notifyMany error:', e)
      return 0
    }
  },
}
