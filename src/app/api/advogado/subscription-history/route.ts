import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubscriptionHistory } from '@/lib/subscription-history.service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    const history = await getSubscriptionHistory(advogado.id)

    return NextResponse.json({
      success: true,
      data: history.map((h) => ({
        id: h.id,
        plano: {
          codigo: h.planos.codigo,
          nome: h.planos.nome,
          preco: h.precoPago || h.planos.preco,
          leadsLimite: h.leadsLimite,
        },
        status: h.status,
        inicioEm: h.inicioEm.toISOString(),
        fimEm: h.fimEm?.toISOString() || null,
        motivo: h.motivo,
        canceladoPor: h.canceladoPor,
        duracao: h.fimEm
          ? Math.floor((h.fimEm.getTime() - h.inicioEm.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - h.inicioEm.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar histórico de assinaturas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}
