import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestStatus } from '@prisma/client'
import { z } from 'zod'
import { notifyServiceRequestEvent } from '@/lib/service-requests/notify'

const bodySchema = z.object({
  toStatus: z.nativeEnum(ServiceRequestStatus),
  adminReason: z.string().min(3).max(2000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const row = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        solicitor: { include: { users: true } },
        correspondent: { include: { users: true } },
      },
    })
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const { toStatus, adminReason } = bodySchema.parse(await req.json())
    const from = row.status
    if (from === toStatus) {
      return NextResponse.json({ error: 'Status já é este.' }, { status: 400 })
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status: toStatus },
      include: {
        solicitor: { include: { users: true } },
        correspondent: { include: { users: true } },
      },
    })

    await prisma.serviceRequestStatusHistory.create({
      data: {
        requestId: id,
        fromStatus: from,
        toStatus,
        actorUserId: session.user.id,
        note: adminReason.trim(),
        isAdminOverride: true,
        adminReason: adminReason.trim(),
      },
    })

    const targets: string[] = []
    targets.push(row.solicitor.userId)
    if (row.correspondent?.userId) targets.push(row.correspondent.userId)
    const unique = [...new Set(targets)]

    await notifyServiceRequestEvent({
      type: 'SERVICE_REQUEST_STATUS',
      userIds: unique,
      title: 'Status atualizado (admin)',
      message: `Administrador alterou o status para ${toStatus}.`.slice(0, 160),
      requestId: id,
      extra: { fromStatus: from, toStatus, admin: true },
    })

    return NextResponse.json({ serviceRequest: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 })
    }
    console.error('[admin service-request status]', e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
