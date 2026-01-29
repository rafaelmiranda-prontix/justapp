import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// IDs dos preços no Stripe (configurar no .env ou Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  BASIC: process.env.STRIPE_PRICE_ID_BASIC || '',
  PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM || '',
}
