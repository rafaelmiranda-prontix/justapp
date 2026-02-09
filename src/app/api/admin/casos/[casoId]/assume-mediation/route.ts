import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { securityLog, getClientIp, getUserAgent } from '@/lib/security-logger'
import { sendEmail } from '@/lib/email-service'

/**
 * POST /api/admin/casos/[casoId]/assume-mediation
 * Admin assume a mediação do caso (lock: só 1 admin por vez).
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
    const adminId = session.user.id

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: { include: { users: { select: { name: true, email: true } } } },
      },
    })

    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    if (caso.mediatedByAdminId && caso.mediatedByAdminId !== adminId) {
      const otherAdmin = await prisma.users.findUnique({
        where: { id: caso.mediatedByAdminId },
        select: { name: true },
      })
      return NextResponse.json(
        {
          success: false,
          error: `Caso já está em mediação por ${otherAdmin?.name ?? 'outro administrador'}.`,
        },
        { status: 409 }
      )
    }

    if (caso.mediatedByAdminId === adminId) {
      return NextResponse.json({
        success: true,
        message: 'Você já está com a mediação deste caso',
        data: { alreadyAssumed: true },
      })
    }

    const updated = await prisma.casos.update({
      where: { id: casoId },
      data: {
        mediatedByAdminId: adminId,
        mediatedAt: new Date(),
        status: 'EM_MEDIACAO',
      },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    await securityLog({
      action: 'CASO_MEDIACAO_ASSUMIDA',
      actor: {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.name ?? '',
        role: session.user.role ?? 'ADMIN',
      },
      target: { type: 'CASO', id: casoId, identifier: caso.descricao?.slice(0, 50) },
      changes: [
        { field: 'mediatedByAdminId', from: null, to: adminId },
        { field: 'status', from: caso.status, to: 'EM_MEDIACAO' },
      ],
      metadata: {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
      timestamp: new Date(),
    })

    // Notificar o cidadão por e-mail que o caso está sendo atendido pela equipe
    const citizenEmail = caso.cidadaos?.users?.email
    const citizenName = caso.cidadaos?.users?.name ?? 'Cidadão'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://justapp.com.br'
    const casoUrl = `${appUrl.replace(/\/$/, '')}/cidadao/casos/${casoId}`

    if (citizenEmail) {
      try {
        await sendEmail({
          to: citizenEmail,
          subject: 'Seu caso está sendo atendido pela nossa equipe - JustApp',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Olá, ${citizenName}!</h2>
              <p>Queremos informar que <strong>sua solicitação está sendo atendida pela nossa equipe</strong>.</p>
              <p>Estamos analisando o seu caso e podemos entrar em contato pelo próprio sistema. Acompanhe as mensagens na página de detalhes do caso.</p>
              <p>
                <a href="${casoUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver detalhes do caso
                </a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Equipe JustApp
              </p>
            </div>
          `,
          text: `Olá, ${citizenName}! Sua solicitação está sendo atendida pela nossa equipe. Acompanhe em: ${casoUrl}. Equipe JustApp`,
        })
      } catch (emailErr) {
        console.error('[assume-mediation] Erro ao enviar e-mail ao cidadão:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mediação assumida com sucesso',
      data: updated,
    })
  } catch (e) {
    console.error('assume-mediation error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao assumir mediação' },
      { status: 500 }
    )
  }
}
