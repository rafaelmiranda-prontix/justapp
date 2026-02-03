import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { EmailService } from '@/lib/email.service'
import { logger } from '@/lib/logger'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { advogadoId } = await params

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json(
        { error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        aprovado: true,
        oabVerificado: true, // Também marca OAB como verificada
      },
    })

    // Enviar email de aprovação
    try {
      await EmailService.sendApprovalEmail(advogado.users.email, advogado.users.name)
      logger.info(`[Admin] Approval email sent to ${advogado.users.email}`)
    } catch (emailError) {
      logger.error('[Admin] Failed to send approval email:', emailError)
      // Não falha a aprovação se o email falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Advogado aprovado com sucesso',
    })
  } catch (error) {
    logger.error('Error approving advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar advogado' },
      { status: 500 }
    )
  }
}
