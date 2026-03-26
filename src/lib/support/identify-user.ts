import { prisma } from '@/lib/prisma'
import { normalizeCrm, normalizeEmail, normalizePhone, phonesMatch } from './normalize'
import type { SupportChannel } from '@prisma/client'

export type IdentifyInput = {
  email?: string
  phone?: string
  crm?: string
  whatsappWaId?: string
}

/**
 * Coleta userIds distintos que batem com email, telefone ou OAB (CRM).
 */
export async function collectIdentifiedUserIds(input: IdentifyInput): Promise<string[]> {
  const ids = new Set<string>()

  if (input.email) {
    const email = normalizeEmail(input.email)
    const u = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    })
    if (u) ids.add(u.id)
  }

  if (input.phone) {
    const digits = normalizePhone(input.phone)
    if (digits.length > 0) {
      const candidates = await prisma.users.findMany({
        where: { phone: { not: null } },
        select: { id: true, phone: true },
      })
      for (const c of candidates) {
        if (phonesMatch(c.phone, digits)) ids.add(c.id)
      }
    }
  }

  if (input.crm) {
    const oab = normalizeCrm(input.crm)
    const adv = await prisma.advogados.findFirst({
      where: { oab },
      select: { userId: true },
    })
    if (adv) ids.add(adv.userId)
  }

  return [...ids]
}

export async function ensureSupportConversationForUser(
  userId: string,
  input: IdentifyInput
): Promise<{ contactId: string; conversationId: string }> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { advogados: true },
  })
  if (!user) {
    throw new Error('USER_NOT_FOUND_INTERNAL')
  }

  const emailNorm = normalizeEmail(user.email)
  const phoneNorm = user.phone ? normalizePhone(user.phone) : null
  const crmNorm = user.advogados ? normalizeCrm(user.advogados.oab) : null

  let contact = await prisma.supportContact.findFirst({
    where: { userId },
  })

  const mergedEmail = input.email ? normalizeEmail(input.email) : undefined
  const mergedPhone = input.phone ? normalizePhone(input.phone) : undefined
  const mergedCrm = input.crm ? normalizeCrm(input.crm) : undefined

  if (!contact) {
    contact = await prisma.supportContact.create({
      data: {
        userId,
        name: user.name,
        email: mergedEmail ?? emailNorm,
        phone: mergedPhone ?? phoneNorm,
        crm: mergedCrm ?? crmNorm,
        source: 'WHATSAPP',
      },
    })
  } else {
    contact = await prisma.supportContact.update({
      where: { id: contact.id },
      data: {
        name: contact.name ?? user.name,
        email: contact.email ?? mergedEmail ?? emailNorm,
        phone: contact.phone ?? mergedPhone ?? phoneNorm,
        crm: contact.crm ?? mergedCrm ?? crmNorm,
      },
    })
  }

  const channel: SupportChannel = 'WHATSAPP'

  if (input.whatsappWaId) {
    const byWa = await prisma.supportConversation.findFirst({
      where: {
        whatsappWaId: input.whatsappWaId,
        channel,
        status: 'OPEN',
      },
      include: { contact: true },
    })
    if (byWa) {
      if (byWa.contact.userId && byWa.contact.userId !== userId) {
        const err = new Error('WA_CONVERSATION_CONFLICT')
        ;(err as Error & { code?: string }).code = 'WA_CONVERSATION_CONFLICT'
        throw err
      }
      if (byWa.contactId !== contact.id) {
        await prisma.supportConversation.update({
          where: { id: byWa.id },
          data: { contactId: contact.id, userId },
        })
      } else if (byWa.userId !== userId) {
        await prisma.supportConversation.update({
          where: { id: byWa.id },
          data: { userId },
        })
      }
      return { contactId: contact.id, conversationId: byWa.id }
    }
  }

  let conv = await prisma.supportConversation.findFirst({
    where: {
      contactId: contact.id,
      channel,
      status: 'OPEN',
    },
  })

  if (!conv) {
    conv = await prisma.supportConversation.create({
      data: {
        contactId: contact.id,
        userId,
        channel,
        status: 'OPEN',
        whatsappWaId: input.whatsappWaId ?? null,
      },
    })
  } else {
    const wa = input.whatsappWaId
    if (wa && conv.whatsappWaId !== wa) {
      conv = await prisma.supportConversation.update({
        where: { id: conv.id },
        data: { whatsappWaId: wa, userId },
      })
    } else if (conv.userId !== userId) {
      conv = await prisma.supportConversation.update({
        where: { id: conv.id },
        data: { userId },
      })
    }
  }

  return { contactId: contact.id, conversationId: conv.id }
}
