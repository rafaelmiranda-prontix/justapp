import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestStatus } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'
import { notifyServiceRequestEvent } from '@/lib/service-requests/notify'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    const profile = await prisma.correspondentProfile.findUnique({
      where: { advogadoId: advogado.id },
      include: { acceptedKinds: true },
    })
    if (!profile?.isActive) {
      return NextResponse.json({ error: 'Ative o perfil de correspondente.' }, { status: 403 })
    }
    if (!advogado.aprovado) {
      return NextResponse.json({ error: 'Advogado não aprovado.' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.serviceRequest.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (before.solicitorAdvogadoId === advogado.id) {
      return NextResponse.json({ error: 'Você não pode aceitar sua própria publicação.' }, { status: 400 })
    }

    const acceptedKinds = profile.acceptedKinds.map((k) => k.kind)
    if (acceptedKinds.length > 0 && !acceptedKinds.includes(before.kind)) {
      return NextResponse.json(
        { error: 'Este tipo de serviço não está nas suas especialidades de correspondente.' },
        { status: 403 }
      )
    }

    if (before.acceptDeadlineAt < new Date()) {
      return NextResponse.json({ error: 'Prazo de aceite expirado.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.updateMany({
        where: {
          id,
          status: ServiceRequestStatus.PUBLICADO,
          correspondentAdvogadoId: null,
        },
        data: {
          status: ServiceRequestStatus.ACEITO,
          correspondentAdvogadoId: advogado.id,
        },
      })
      if (updated.count !== 1) {
        return null
      }
      const row = await tx.serviceRequest.findUnique({
        where: { id },
        include: {
          solicitor: { include: { users: true } },
          correspondent: { include: { users: true } },
        },
      })
      await tx.serviceRequestStatusHistory.create({
        data: {
          requestId: id,
          fromStatus: ServiceRequestStatus.PUBLICADO,
          toStatus: ServiceRequestStatus.ACEITO,
          actorUserId: session.user.id,
          note: 'Aceito pelo correspondente',
        },
      })
      return row
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Este serviço não está mais disponível ou já foi aceito.' },
        { status: 409 }
      )
    }

    const solicitorUserId = result.solicitor.userId
    const correspondentName = result.correspondent?.users.name ?? 'Correspondente'
    await notifyServiceRequestEvent({
      type: 'SERVICE_REQUEST_ACCEPTED',
      userIds: [solicitorUserId],
      title: 'Serviço aceito',
      message: `${correspondentName} aceitou: ${result.title}`.slice(0, 160),
      requestId: result.id,
    })

    return NextResponse.json({ serviceRequest: result })
  } catch (e) {
    console.error('[accept POST]', e)
    return NextResponse.json({ error: 'Erro ao aceitar' }, { status: 500 })
  }
}
