import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireIntegrationAuth } from '@/lib/integration-auth'
import { normalizeCrm, normalizeEmail, normalizePhone } from '@/lib/support/normalize'

/** JSON frequentemente manda "" — tratar como campo ausente (email não é obrigatório). */
function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (v === '' || v === null ? undefined : v), schema)
}

const contactSchema = z
  .object({
    name: emptyToUndefined(z.string().max(200).optional()),
    email: emptyToUndefined(z.string().email().optional()),
    phone: emptyToUndefined(z.string().max(32).optional()),
    crm: emptyToUndefined(z.string().max(32).optional()),
    source: z.enum(['WHATSAPP', 'FORM', 'OTHER']).optional(),
    whatsappWaId: emptyToUndefined(z.string().min(1).max(64).optional()),
    channel: z.enum(['WHATSAPP', 'OTHER']).optional(),
  })
  .refine(
    (d) =>
      Boolean(d.name?.trim() || d.email || d.phone?.trim() || d.crm?.trim() || d.whatsappWaId),
    { message: 'Informe ao menos: nome, email, phone, crm ou whatsappWaId' }
  )

/**
 * POST /api/suporte/contacts
 * Cria contato de suporte sem usuário do sistema e conversa aberta (ex.: lead WhatsApp).
 */
export async function POST(req: Request) {
  const authError = await requireIntegrationAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const data = contactSchema.parse(body)

    const channel = data.channel ?? 'WHATSAPP'
    const source = data.source ?? 'WHATSAPP'

    if (data.whatsappWaId) {
      const existing = await prisma.supportConversation.findFirst({
        where: {
          whatsappWaId: data.whatsappWaId,
          channel,
          status: 'OPEN',
        },
        include: { contact: true },
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          existing: true,
          contactId: existing.contactId,
          conversationId: existing.id,
        })
      }
    }

    const contact = await prisma.supportContact.create({
      data: {
        name: data.name ?? null,
        email: data.email ? normalizeEmail(data.email) : null,
        phone: data.phone ? normalizePhone(data.phone) : null,
        crm: data.crm ? normalizeCrm(data.crm) : null,
        source,
        userId: null,
      },
    })

    const conversation = await prisma.supportConversation.create({
      data: {
        contactId: contact.id,
        channel,
        status: 'OPEN',
        whatsappWaId: data.whatsappWaId ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      existing: false,
      contactId: contact.id,
      conversationId: conversation.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0]
      return NextResponse.json({ error: first?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[SUPORTE contacts]', error)
    return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
  }
}
