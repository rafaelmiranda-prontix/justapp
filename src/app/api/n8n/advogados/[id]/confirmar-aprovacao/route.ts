import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireN8nApiKey } from '@/lib/n8n-auth'
import { EmailService } from '@/lib/email.service'
import { logger } from '@/lib/logger'

/**
 * POST /api/n8n/advogados/[id]/confirmar-aprovacao
 * Confirma a aprovação do advogado (após OK do usuário no fluxo N8N).
 * Só altera advogados que estão preAprovado=true e aprovado=false.
 * Segurança: X-API-Key ou Authorization: Bearer com N8N_API_KEY.
 * Idempotente: se já aprovado, retorna 200.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireN8nApiKey(req)
  if (authError) return authError

  try {
    const { id: advogadoId } = await params

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

    if (advogado.aprovado) {
      return NextResponse.json({
        success: true,
        message: 'Advogado já estava aprovado',
        alreadyApproved: true,
      })
    }

    if (!advogado.preAprovado) {
      return NextResponse.json(
        { error: 'Advogado não está pré-aprovado. Use o painel admin para pré-aprovar.' },
        { status: 400 }
      )
    }

    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        aprovado: true,
      },
    })

    try {
      await EmailService.sendApprovalEmail(advogado.users!.email, advogado.users!.name)
      logger.info(`[N8N] Approval email sent to ${advogado.users!.email} after confirm`)
    } catch (emailError) {
      logger.error('[N8N] Failed to send approval email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Advogado aprovado com sucesso',
    })
  } catch (error) {
    console.error('[N8N] Erro ao confirmar aprovação:', error)
    return NextResponse.json(
      { error: 'Erro ao confirmar aprovação' },
      { status: 500 }
    )
  }
}
