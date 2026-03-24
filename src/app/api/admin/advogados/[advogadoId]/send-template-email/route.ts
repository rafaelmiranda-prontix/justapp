import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { EmailService } from '@/lib/email.service'
import { logger } from '@/lib/logger'
import {
  isLawyerEmailTemplateType,
  type LawyerEmailTemplateType,
} from '@/lib/admin-lawyer-email-templates'
import { createOpaqueToken, EMAIL_ACTION_BETA_INVITE_DAYS } from '@/lib/email-action-tokens'
import { isReasonableEmail } from '@/lib/email-utils'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const { advogadoId } = await params
    const body = await req.json().catch(() => ({}))
    const templateType = body?.templateType as string | undefined
    const testEmailRaw = body?.testEmail
    const testEmail =
      typeof testEmailRaw === 'string' && testEmailRaw.trim()
        ? testEmailRaw.trim()
        : null

    if (testEmail && !isReasonableEmail(testEmail)) {
      return NextResponse.json(
        { success: false, error: 'E-mail de teste inválido.' },
        { status: 400 }
      )
    }

    const isTestSend = Boolean(testEmail)

    if (!templateType || !isLawyerEmailTemplateType(templateType)) {
      return NextResponse.json(
        { success: false, error: 'templateType inválido' },
        { status: 400 }
      )
    }

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: { select: { email: true, name: true } },
      },
    })

    if (!advogado) {
      return NextResponse.json(
        { success: false, error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    const recipientEmail = isTestSend ? testEmail! : advogado.users.email
    const name = advogado.users.name
    const adminId = session!.user.id

    if (templateType === 'convite_beta_pre_aprovado') {
      if (advogado.aprovado || !advogado.preAprovado) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Convite beta só pode ser enviado a advogados pré-aprovados e ainda não aprovados.',
          },
          { status: 400 }
        )
      }

      const base = process.env.NEXTAUTH_URL || new URL(req.url).origin

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + EMAIL_ACTION_BETA_INVITE_DAYS)

      const batchId = randomUUID()
      const acceptToken = createOpaqueToken()
      const declineToken = createOpaqueToken()

      await prisma.$transaction([
        prisma.emailActionToken.create({
          data: {
            token: acceptToken,
            batchId,
            advogadoId,
            templateType: 'convite_beta_pre_aprovado',
            action: 'accept',
            expiresAt,
            createdByAdminId: adminId,
          },
        }),
        prisma.emailActionToken.create({
          data: {
            token: declineToken,
            batchId,
            advogadoId,
            templateType: 'convite_beta_pre_aprovado',
            action: 'decline',
            expiresAt,
            createdByAdminId: adminId,
          },
        }),
      ])

      const acceptUrl = `${base}/api/email-actions/beta-invite?t=${encodeURIComponent(acceptToken)}`
      const declineUrl = `${base}/api/email-actions/beta-invite?t=${encodeURIComponent(declineToken)}`

      const send = await EmailService.sendLawyerConviteBetaPreAprovadoEmail({
        to: recipientEmail,
        name,
        acceptUrl,
        declineUrl,
        isTestSend,
      })

      if (!send.success) {
        logger.error('[Admin] Falha ao enviar convite beta', {
          advogadoId,
          adminId,
          message: send.message,
        })
        return NextResponse.json(
          { success: false, error: send.message || 'Falha ao enviar e-mail' },
          { status: 502 }
        )
      }

      logger.info('[Admin] E-mail convite beta enviado', {
        advogadoId,
        adminId,
        batchId,
        templateType,
        isTestSend,
      })

      return NextResponse.json({ success: true, message: 'E-mail enviado.' })
    }

    const result = await sendSimpleTemplate(templateType, recipientEmail, name, {
      isTestSend,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || 'Falha ao enviar e-mail' },
        { status: 502 }
      )
    }

    logger.info('[Admin] E-mail template manual enviado', {
      advogadoId,
      adminId,
      templateType,
      isTestSend,
    })

    return NextResponse.json({ success: true, message: 'E-mail enviado.' })
  } catch (e) {
    logger.error('[Admin] send-template-email error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar e-mail' },
      { status: 500 }
    )
  }
}

async function sendSimpleTemplate(
  templateType: LawyerEmailTemplateType,
  email: string,
  name: string,
  opts?: { isTestSend?: boolean }
): Promise<{ success: boolean; message?: string }> {
  switch (templateType) {
    case 'validacao_dados':
      return EmailService.sendLawyerValidacaoDadosEmail(email, name, opts)
    case 'desculpas_demora':
      return EmailService.sendLawyerDesculpasDemoraEmail(email, name, opts)
    case 'convite_beta_pre_aprovado':
      // tratado no handler principal
      return { success: false, message: 'Fluxo interno incorreto' }
    default:
      return { success: false, message: 'Template não suportado' }
  }
}
