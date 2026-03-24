import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { formatOAB } from '@/lib/utils'

async function notifyAdminsBetaInviteAccepted(advogadoId: string) {
  const advogado = await prisma.advogados.findUnique({
    where: { id: advogadoId },
    select: { oab: true, users: { select: { name: true } } },
  })
  const lawyerName = advogado?.users?.name?.trim() || 'Advogado'
  const oab = advogado?.oab ? formatOAB(advogado.oab) : '—'
  const admins = await prisma.users.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (admins.length === 0) return

  const { inAppNotificationService } = await import('@/lib/in-app-notification.service')
  const message = `${lawyerName} (OAB ${oab}) aceitou o programa Beta (convite por e-mail).`
  await inAppNotificationService.notifyMany(
    admins.map((a) => a.id),
    {
      type: 'ADMIN_ACTION_REQUIRED',
      title: 'Beta: convite aceito',
      message,
      href: '/admin/advogados?status=pre_aprovados',
      metadata: { advogadoId, event: 'beta_invite_accepted' },
      role: 'ADMIN',
    }
  )
}

function redirectResult(
  req: Request,
  query: Record<string, string>
): NextResponse {
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin
  const sp = new URLSearchParams(query)
  return NextResponse.redirect(`${base}/convite-beta/resultado?${sp.toString()}`)
}

/**
 * GET /api/email-actions/beta-invite?t=...
 * Consome token de aceitar/recusar convite beta (e-mail manual do admin).
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tokenStr = url.searchParams.get('t')

  if (!tokenStr) {
    return redirectResult(req, { erro: 'token' })
  }

  try {
    const row = await prisma.emailActionToken.findUnique({
      where: { token: tokenStr },
    })

    if (!row) {
      logger.warn('[EmailAction] Token beta-invite não encontrado')
      return redirectResult(req, { erro: 'invalido' })
    }

    if (row.templateType !== 'convite_beta_pre_aprovado') {
      return redirectResult(req, { erro: 'invalido' })
    }

    if (row.usedAt) {
      return redirectResult(req, { erro: 'ja_usado' })
    }

    if (row.expiresAt < new Date()) {
      return redirectResult(req, { erro: 'expirado' })
    }

    const batchId = row.batchId
    if (!batchId) {
      logger.error('[EmailAction] Token sem batchId', { id: row.id })
      return redirectResult(req, { erro: 'invalido' })
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const marked = await tx.emailActionToken.updateMany({
        where: {
          batchId,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      })

      if (marked.count === 0) {
        return null
      }

      if (row.action === 'accept') {
        await tx.advogados.update({
          where: { id: row.advogadoId },
          data: {
            isBeta: true,
            betaInviteDeclinedAt: null,
          },
        })
      } else {
        await tx.advogados.update({
          where: { id: row.advogadoId },
          data: {
            isBeta: false,
            betaInviteDeclinedAt: new Date(),
          },
        })
      }

      return row.action === 'accept' ? 'aceito' : 'recusado'
    })

    if (!outcome) {
      return redirectResult(req, { erro: 'ja_usado' })
    }

    logger.info('[EmailAction] Beta invite respondido', {
      advogadoId: row.advogadoId,
      action: row.action,
      batchId,
    })

    if (outcome === 'aceito') {
      notifyAdminsBetaInviteAccepted(row.advogadoId).catch((err) =>
        logger.error('[EmailAction] Falha ao notificar admins (Beta aceito):', err)
      )
    }

    return redirectResult(req, { resultado: outcome })
  } catch (e) {
    logger.error('[EmailAction] beta-invite GET error:', e)
    return redirectResult(req, { erro: 'servidor' })
  }
}
