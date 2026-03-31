import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
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

    const [attachments, messages, history, reviews] = await Promise.all([
      prisma.serviceRequestAttachment.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.serviceRequestMessage.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      prisma.serviceRequestStatusHistory.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.serviceReview.findMany({ where: { serviceRequestId: id } }),
    ])

    return NextResponse.json({
      serviceRequest: row,
      attachments,
      messages,
      statusHistory: history,
      reviews,
    })
  } catch (e) {
    console.error('[admin service-request GET]', e)
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 })
  }
}
