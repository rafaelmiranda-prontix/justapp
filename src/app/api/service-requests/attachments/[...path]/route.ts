import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChatAttachmentFile } from '@/lib/supabase-storage'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getServiceRequestWithParties } from '@/lib/service-requests/access'
import { canViewServiceRequestDetail } from '@/lib/service-requests/can-view'
import { assertAudienciasDiligenciasEnabled } from '@/lib/service-requests/feature-guard'

/** Path no storage: service-requests/{requestId}/... */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const featureBlocked = await assertAudienciasDiligenciasEnabled()
    if (featureBlocked) return featureBlocked

    const { path: segments } = await params
    if (!segments?.length) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 })
    }
    const storagePath = segments.join('/')

    if (!storagePath.startsWith('service-requests/')) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 })
    }

    const requestId = segments[1]
    if (!requestId) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 })
    }

    const row = await getServiceRequestWithParties(requestId)
    if (!row) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    if (!(await canViewServiceRequestDetail(userId, session.user.role ?? 'CIDADAO', row))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const att = await prisma.serviceRequestAttachment.findFirst({
      where: { requestId, storagePath },
    })
    if (!att) {
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })
    }

    const fileResult = await getChatAttachmentFile(storagePath)

    if (!fileResult.success || !fileResult.data) {
      return NextResponse.json(
        { error: fileResult.error || 'Arquivo não encontrado' },
        { status: fileResult.error?.includes('não encontrado') ? 404 : 500 }
      )
    }

    const { data, contentType, filename } = fileResult

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename || 'anexo')}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    logger.error('Error serving service-request attachment:', error)
    return NextResponse.json({ error: 'Erro ao servir anexo' }, { status: 500 })
  }
}
