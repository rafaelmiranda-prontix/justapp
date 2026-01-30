import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca o advogado
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado || !advogado.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Cliente Stripe não encontrado' },
        { status: 404 }
      )
    }

    // Cria sessão do customer portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: advogado.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/advogado/assinatura`,
    })

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão do portal' },
      { status: 500 }
    )
  }
}
