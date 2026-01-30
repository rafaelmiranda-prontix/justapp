import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { PLANS, type PlanType } from '@/lib/plans'
import { z } from 'zod'

const checkoutSchema = z.object({
  plan: z.enum(['BASIC', 'PREMIUM']),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { plan } = checkoutSchema.parse(body)

    // Busca o advogado
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    const planConfig = PLANS[plan as PlanType]
    const priceId = STRIPE_PRICE_IDS[plan as 'BASIC' | 'PREMIUM']

    if (!priceId) {
      return NextResponse.json(
        { error: 'Preço não configurado para este plano' },
        { status: 400 }
      )
    }

    // Cria ou busca customer no Stripe
    let customerId = advogado.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: {
          advogadoId: advogado.id,
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Salva customer ID no banco
      await prisma.advogados.update({
        where: { id: advogado.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Cria sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/advogado/assinatura?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/advogado/assinatura?canceled=true`,
      metadata: {
        advogadoId: advogado.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          advogadoId: advogado.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
