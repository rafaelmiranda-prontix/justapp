import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { securityLog, getClientIp, getUserAgent } from '@/lib/security-logger'
import { sendEmail } from '@/lib/email-service'
import { z } from 'zod'

const closeReasonEnum = z.enum([
  'RESOLVIDO',
  'SEM_RETORNO_DO_CLIENTE',
  'INCOMPLETO_SEM_DOCUMENTOS',
  'DUPLICADO',
  'FORA_DO_ESCOPO',
  'ENCERRADO_COM_ENCAMINHAMENTO',
])

const closeCasoSchema = z.object({
  closeReason: closeReasonEnum,
  closeSummary: z.string().min(1).max(2000),
  notifyCitizen: z.boolean().optional().default(true),
})

/**
 * POST /api/admin/casos/[casoId]/close
 * Fecha o caso com motivo e resumo; opcionalmente notifica o cidadão por e-mail.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error, session } = await requireAdmin()
    if (error || !session?.user) {
      return error ?? NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params
    const body = await req.json()
    const { closeReason, closeSummary, notifyCitizen } = closeCasoSchema.parse(body)

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: {
          include: {
            users: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    if (caso.status === 'FECHADO') {
      return NextResponse.json(
        { success: false, error: 'Caso já está fechado' },
        { status: 400 }
      )
    }

    const updated = await prisma.casos.update({
      where: { id: casoId },
      data: {
        status: 'FECHADO',
        closedByAdminId: session.user.id,
        closedAt: new Date(),
        closeReason,
        closeSummary,
      },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: { select: { name: true, email: true } },
          },
        },
      },
    })

    await securityLog({
      action: 'CASO_FECHADO',
      actor: {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.name ?? '',
        role: session.user.role ?? 'ADMIN',
      },
      target: { type: 'CASO', id: casoId, identifier: caso.descricao?.slice(0, 50) },
      changes: [
        { field: 'status', from: caso.status, to: 'FECHADO' },
        { field: 'closeReason', from: null, to: closeReason },
      ],
      metadata: {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        closeSummary: closeSummary.slice(0, 200),
        notifyCitizen,
      },
      timestamp: new Date(),
    })

    if (notifyCitizen && caso.cidadaos?.users?.email) {
      try {
        await sendEmail({
          to: caso.cidadaos.users.email,
          subject: 'Seu caso foi encerrado - JustApp',
          html: `
            <p>Olá, ${caso.cidadaos.users.name ?? 'Cidadão'}.</p>
            <p>O caso que você abriu em nossa plataforma foi encerrado pela nossa equipe.</p>
            <p><strong>Motivo:</strong> ${closeReason.replace(/_/g, ' ')}</p>
            <p><strong>Resumo:</strong></p>
            <p>${closeSummary}</p>
            <p>Se tiver dúvidas, entre em contato conosco.</p>
            <p>Equipe JustApp</p>
          `,
        })
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail de fechamento ao cidadão:', emailErr)
      }
    }

    // Notificação in-app para o cidadão (status alterado)
    const citizenUserId = caso.cidadaos?.users?.id
    if (citizenUserId) {
      const { inAppNotificationService } = await import('@/lib/in-app-notification.service')
      inAppNotificationService
        .notifyUser(citizenUserId, {
          type: 'CASE_STATUS_CHANGED',
          title: 'Caso encerrado',
          message: `Seu caso foi encerrado. Motivo: ${closeReason.replace(/_/g, ' ')}`,
          href: `/cidadao/casos/${casoId}`,
          metadata: { caseId: casoId },
          role: 'CIDADAO',
        })
        .catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Caso fechado com sucesso',
      data: updated,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: e.errors },
        { status: 400 }
      )
    }
    console.error('close caso error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao fechar caso' },
      { status: 500 }
    )
  }
}
