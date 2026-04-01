import type { Prisma } from '@prisma/client'

export type FieldChangeInput = {
  fieldName: string
  oldValue: string | null
  newValue: string | null
  reason?: string | null
  changeType?: string
}

export async function appendFieldChanges(
  tx: Prisma.TransactionClient,
  requestId: string,
  changedByUserId: string,
  changes: FieldChangeInput[]
) {
  if (changes.length === 0) return
  await tx.serviceRequestFieldChange.createMany({
    data: changes.map((c) => ({
      requestId,
      changedByUserId,
      fieldName: c.fieldName,
      oldValue: c.oldValue,
      newValue: c.newValue,
      reason: c.reason ?? null,
      changeType: c.changeType ?? 'update',
    })),
  })
}

export function serializeField(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
