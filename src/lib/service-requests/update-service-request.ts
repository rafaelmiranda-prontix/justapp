import { prisma } from '@/lib/prisma'
import {
  OperationalServiceKind,
  ServiceRequestStatus,
  type ServiceRequest,
} from '@prisma/client'
import { z } from 'zod'
import { appendFieldChanges, serializeField } from './field-changes'
import { notifyServiceRequestEvent } from './notify'

const patchSchema = z
  .object({
    kind: z.nativeEnum(OperationalServiceKind).optional(),
    customKindDescription: z.string().max(500).nullable().optional(),
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(20000).optional(),
    solicitorNotes: z.string().max(20000).nullable().optional(),
    scheduledAt: z.string().datetime().optional(),
    location: z.string().max(500).nullable().optional(),
    comarca: z.string().max(200).nullable().optional(),
    forum: z.string().max(200).nullable().optional(),
    offeredAmountCents: z.number().int().min(0).nullable().optional(),
    acceptDeadlineAt: z.string().datetime().optional(),
    reason: z.string().min(3).max(2000).optional(),
  })
  .strict()

const SENSITIVE_FIELDS = new Set([
  'scheduledAt',
  'location',
  'comarca',
  'forum',
  'offeredAmountCents',
  'kind',
  'acceptDeadlineAt',
])

export type UpdateServiceRequestResult =
  | { ok: true; serviceRequest: Record<string, unknown> }
  | { ok: false; error: string; status: number }

export async function updateServiceRequestBySolicitor(params: {
  requestId: string
  solicitorAdvogadoId: string
  userId: string
  body: unknown
}): Promise<UpdateServiceRequestResult> {
  const { requestId, solicitorAdvogadoId, userId, body } = params
  const data = patchSchema.parse(body)

  const row = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
  })
  if (!row) return { ok: false, error: 'Não encontrado', status: 404 }
  if (row.solicitorAdvogadoId !== solicitorAdvogadoId) {
    return { ok: false, error: 'Apenas o solicitante pode editar.', status: 403 }
  }

  if (
    row.status === ServiceRequestStatus.CONCLUIDO ||
    row.status === ServiceRequestStatus.CANCELADO
  ) {
    return { ok: false, error: 'Serviço encerrado não pode ser editado.', status: 400 }
  }

  const isPreAccept = row.status === ServiceRequestStatus.PUBLICADO
  const isPostAccept =
    row.status === ServiceRequestStatus.ACEITO ||
    row.status === ServiceRequestStatus.EM_ANDAMENTO ||
    row.status === ServiceRequestStatus.REALIZADO ||
    row.status === ServiceRequestStatus.AGUARDANDO_VALIDACAO

  const updates: Partial<ServiceRequest> = {}
  const changes: {
    fieldName: string
    oldValue: string | null
    newValue: string | null
    reason?: string | null
  }[] = []

    const touch = (
    field: keyof ServiceRequest,
    next: unknown,
    opts?: { forceReason?: boolean }
  ) => {
    const oldVal = row[field]
    if (next === undefined) return
    if (serializeField(oldVal) === serializeField(next)) return

    if (isPostAccept) {
      const sensitive = SENSITIVE_FIELDS.has(field as string)
      if (sensitive || opts?.forceReason) {
        if (!data.reason?.trim()) {
          throw new Error(`REASON_REQUIRED:${field}`)
        }
      }
    }

    changes.push({
      fieldName: field as string,
      oldValue: serializeField(oldVal),
      newValue: serializeField(next),
      reason: data.reason?.trim() || null,
    })
    ;(updates as Record<string, unknown>)[field] = next
  }

  try {
    if (isPreAccept) {
      if (data.title !== undefined) touch('title', data.title.trim())
      if (data.description !== undefined) touch('description', data.description.trim())
      if (data.kind !== undefined) touch('kind', data.kind)
      if (data.customKindDescription !== undefined)
        touch('customKindDescription', data.customKindDescription?.trim() || null)
      if (data.scheduledAt !== undefined) touch('scheduledAt', new Date(data.scheduledAt))
      if (data.acceptDeadlineAt !== undefined)
        touch('acceptDeadlineAt', new Date(data.acceptDeadlineAt))
      if (data.location !== undefined) touch('location', data.location?.trim() || null)
      if (data.comarca !== undefined) touch('comarca', data.comarca?.trim() || null)
      if (data.forum !== undefined) touch('forum', data.forum?.trim() || null)
      if (data.offeredAmountCents !== undefined) touch('offeredAmountCents', data.offeredAmountCents)
      if (data.solicitorNotes !== undefined)
        touch('solicitorNotes', data.solicitorNotes?.trim() || null)
    } else if (isPostAccept) {
      if (data.description !== undefined) touch('description', data.description.trim())
      if (data.solicitorNotes !== undefined)
        touch('solicitorNotes', data.solicitorNotes?.trim() || null)
      if (data.scheduledAt !== undefined) touch('scheduledAt', new Date(data.scheduledAt))
      if (data.acceptDeadlineAt !== undefined)
        touch('acceptDeadlineAt', new Date(data.acceptDeadlineAt))
      if (data.location !== undefined) touch('location', data.location?.trim() || null)
      if (data.comarca !== undefined) touch('comarca', data.comarca?.trim() || null)
      if (data.forum !== undefined) touch('forum', data.forum?.trim() || null)
      if (data.offeredAmountCents !== undefined) touch('offeredAmountCents', data.offeredAmountCents)
      if (data.kind !== undefined) touch('kind', data.kind)
      if (data.customKindDescription !== undefined)
        touch('customKindDescription', data.customKindDescription?.trim() || null)
    }

    if (Object.keys(updates).length === 0 && changes.length === 0) {
      return { ok: false, error: 'Nada para atualizar', status: 400 }
    }

    const nextKind = (updates.kind as OperationalServiceKind | undefined) ?? row.kind
    if (
      nextKind === OperationalServiceKind.PERSONALIZADO &&
      !(updates.customKindDescription ?? row.customKindDescription)?.trim()
    ) {
      return { ok: false, error: 'Descreva o tipo personalizado.', status: 400 }
    }

    const acceptDeadline =
      (updates.acceptDeadlineAt as Date | undefined) ?? row.acceptDeadlineAt
    if (acceptDeadline.getTime() <= Date.now()) {
      return { ok: false, error: 'Prazo de aceite deve ser no futuro.', status: 400 }
    }

    const updated = await prisma.$transaction(async (tx) => {
      let u
      if (Object.keys(updates).length > 0) {
        u = await tx.serviceRequest.update({
          where: { id: requestId },
          data: updates,
          include: {
            solicitor: { include: { users: true } },
            correspondent: { include: { users: true } },
          },
        })
      } else {
        u = await tx.serviceRequest.findUniqueOrThrow({
          where: { id: requestId },
          include: {
            solicitor: { include: { users: true } },
            correspondent: { include: { users: true } },
          },
        })
      }
      if (changes.length > 0) {
        await appendFieldChanges(tx, requestId, userId, changes)
      }
      return u
    })

    const notifyCorrespondent =
      isPostAccept &&
      row.correspondentAdvogadoId &&
      changes.some((c) => SENSITIVE_FIELDS.has(c.fieldName) || c.fieldName === 'description')
    if (notifyCorrespondent) {
      const corr = await prisma.advogados.findUnique({
        where: { id: row.correspondentAdvogadoId! },
        select: { userId: true },
      })
      if (corr) {
        await notifyServiceRequestEvent({
          type: 'SERVICE_REQUEST_UPDATED',
          userIds: [corr.userId],
          title: 'Serviço atualizado',
          message: `O solicitante alterou dados do serviço: ${row.title}`.slice(0, 160),
          requestId,
        })
      }
    }

    return { ok: true, serviceRequest: updated }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('REASON_REQUIRED:')) {
      return {
        ok: false,
        error: 'Informe a justificativa para alterar este campo após o aceite.',
        status: 400,
      }
    }
    throw e
  }
}
