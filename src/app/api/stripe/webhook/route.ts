import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { updateAdvogadoPlan } from '@/lib/subscription-service'
import type { PlanType } from '@/lib/plans'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurada')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Processa eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const advogadoId = session.metadata?.advogadoId
          const plan = session.metadata?.plan as PlanType

          if (advogadoId && plan) {
            // Busca a subscription para pegar a data de expiração
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

            // Atualiza o advogado
            await prisma.advogado.update({
              where: { id: advogadoId },
              data: {
                stripeSubscriptionId: subscriptionId,
                plano: plan,
                planoExpira: currentPeriodEnd,
              },
            })

            await updateAdvogadoPlan(advogadoId, plan, currentPeriodEnd)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const advogadoId = subscription.metadata?.advogadoId
        const plan = subscription.metadata?.plan as PlanType

        if (advogadoId && plan) {
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

          await prisma.advogado.update({
            where: { id: advogadoId },
            data: {
              plano: plan,
              planoExpira: currentPeriodEnd,
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const advogadoId = subscription.metadata?.advogadoId

        if (advogadoId) {
          // Volta para plano FREE
          await prisma.advogado.update({
            where: { id: advogadoId },
            data: {
              plano: 'FREE',
              planoExpira: null,
              stripeSubscriptionId: null,
              leadsLimiteMes: 0,
            },
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const advogadoId = subscription.metadata?.advogadoId
          const plan = subscription.metadata?.plan as PlanType

          if (advogadoId && plan) {
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

            await prisma.advogado.update({
              where: { id: advogadoId },
              data: {
                plano: plan,
                planoExpira: currentPeriodEnd,
              },
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // TODO: Enviar email ao advogado sobre falha no pagamento
          console.log('Payment failed for subscription:', subscriptionId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    )
  }
}
