import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { securityLog } from '@/lib/security-logger'

const bodySchema = z.object({
  leads: z.number().int().min(1).max(100),
  motivo: z.string().trim().min(3).max(280).optional(),
})

function currentYearMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * POST /api/admin/advogados/[advogadoId]/grant-free-bonus
 * Concede bônus temporário de leads para advogado FREE no mês corrente.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { error, session } = await requireAdmin()
    if (error) return error

    const { advogadoId } = await params
    const body = bodySchema.parse(await req.json())
    const monthRef = currentYearMonth()

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    if (advogado.plano !== 'FREE') {
      return NextResponse.json(
        { error: 'Ação permitida apenas para advogados no plano FREE' },
        { status: 400 }
      )
    }

    const bonusAtual =
      advogado.freeLeadsBonusRef === monthRef ? advogado.freeLeadsBonusMes : 0
    const limiteEfetivoAtual = advogado.leadsLimiteMes + bonusAtual

    if (advogado.leadsRecebidosMes < limiteEfetivoAtual) {
      return NextResponse.json(
        {
          error:
            'Bônus temporário só pode ser aplicado quando a cota do mês já estiver esgotada',
        },
        { status: 400 }
      )
    }

    const freeLeadsBonusMes = bonusAtual + body.leads

    const updated = await prisma.advogados.update({
      where: { id: advogado.id },
      data: {
        freeLeadsBonusMes,
        freeLeadsBonusRef: monthRef,
      },
      select: {
        id: true,
        leadsLimiteMes: true,
        leadsRecebidosMes: true,
        freeLeadsBonusMes: true,
        freeLeadsBonusRef: true,
      },
    })

    await securityLog({
      action: 'FREE_LEADS_BONUS_CONCEDIDO',
      actor: {
        id: session!.user.id,
        email: session!.user.email || 'admin@unknown',
        name: session!.user.name || 'Admin',
        role: session!.user.role || 'ADMIN',
      },
      target: {
        type: 'ADVOGADO',
        id: advogado.id,
        identifier: advogado.oab,
      },
      changes: [
        {
          field: 'freeLeadsBonusMes',
          from: bonusAtual,
          to: updated.freeLeadsBonusMes,
        },
      ],
      metadata: {
        motivo: body.motivo || 'Concessão manual de bônus FREE',
        monthRef,
        leadsAdded: body.leads,
        advogadoEmail: advogado.users?.email,
      },
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Bônus de ${body.leads} lead(s) concedido para ${monthRef}.`,
      data: {
        advogadoId: updated.id,
        leadsRecebidosMes: updated.leadsRecebidosMes,
        leadsLimiteMesBase: updated.leadsLimiteMes,
        freeLeadsBonusMes: updated.freeLeadsBonusMes,
        leadsLimiteMesEfetivo: updated.leadsLimiteMes + updated.freeLeadsBonusMes,
        freeLeadsBonusRef: updated.freeLeadsBonusRef,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }
    console.error('[admin/grant-free-bonus]', error)
    return NextResponse.json({ error: 'Erro ao conceder bônus FREE' }, { status: 500 })
  }
}
