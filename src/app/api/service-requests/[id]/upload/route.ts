import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServiceRequestAttachmentKind, ServiceRequestStatus } from '@prisma/client'
import {
  canAccessServiceRequest,
  getServiceRequestWithParties,
} from '@/lib/service-requests/access'
import { uploadServiceRequestAttachmentToSupabase } from '@/lib/supabase-storage'
import { assertAudienciasDiligenciasEnabled } from '@/lib/service-requests/feature-guard'

const evidenceStatuses: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
]

const chatUploadStatuses: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACEITO,
  ServiceRequestStatus.EM_ANDAMENTO,
  ServiceRequestStatus.REALIZADO,
  ServiceRequestStatus.AGUARDANDO_VALIDACAO,
]

/**
 * POST multipart: file + kind=PUBLICACAO|EVIDENCIA|CHAT
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const featureBlocked = await assertAudienciasDiligenciasEnabled()
    if (featureBlocked) return featureBlocked
    const { id } = await params
    const row = await getServiceRequestWithParties(id)
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (!canAccessServiceRequest(userId, session.user.role ?? 'CIDADAO', row)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const kindRaw = (form.get('kind') as string) || 'PUBLICACAO'
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    }

    const kind: ServiceRequestAttachmentKind =
      kindRaw === 'EVIDENCIA'
        ? ServiceRequestAttachmentKind.EVIDENCIA
        : kindRaw === 'CHAT'
          ? ServiceRequestAttachmentKind.CHAT
          : ServiceRequestAttachmentKind.PUBLICACAO

    const isSolicitor = row.solicitor.userId === userId
    const isCorrespondent = row.correspondent?.userId === userId

    if (kind === ServiceRequestAttachmentKind.PUBLICACAO) {
      if (!isSolicitor) {
        return NextResponse.json({ error: 'Só o solicitante envia anexos da publicação.' }, { status: 403 })
      }
      if (
        row.status === ServiceRequestStatus.CANCELADO ||
        row.status === ServiceRequestStatus.CONCLUIDO
      ) {
        return NextResponse.json({ error: 'Não é possível anexar neste status.' }, { status: 400 })
      }
    } else if (kind === ServiceRequestAttachmentKind.EVIDENCIA) {
      if (!isCorrespondent) {
        return NextResponse.json({ error: 'Só o correspondente envia evidências.' }, { status: 403 })
      }
      if (!evidenceStatuses.includes(row.status)) {
        return NextResponse.json({ error: 'Evidências só após aceite.' }, { status: 400 })
      }
    } else {
      if (!isSolicitor && !isCorrespondent) {
        return NextResponse.json({ error: 'Sem permissão para anexar no chat.' }, { status: 403 })
      }
      if (!chatUploadStatuses.includes(row.status)) {
        return NextResponse.json({ error: 'Anexos do chat indisponíveis neste status.' }, { status: 400 })
      }
    }

    const up = await uploadServiceRequestAttachmentToSupabase(file, id, userId)
    if (!up.success || !up.path) {
      return NextResponse.json({ error: up.error || 'Falha no upload' }, { status: 400 })
    }

    const att = await prisma.serviceRequestAttachment.create({
      data: {
        requestId: id,
        uploadedByUserId: userId,
        storagePath: up.path,
        originalName: file.name.slice(0, 500),
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        kind,
      },
    })

    await prisma.serviceRequestStatusHistory.create({
      data: {
        requestId: id,
        fromStatus: row.status,
        toStatus: row.status,
        actorUserId: userId,
        note: `Anexo ${kind}: ${file.name}`.slice(0, 2000),
      },
    })

    const downloadUrl = `/api/service-requests/attachments/${att.storagePath
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/')}`

    return NextResponse.json({
      attachment: att,
      downloadUrl,
    })
  } catch (e) {
    console.error('[service-request upload]', e)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
