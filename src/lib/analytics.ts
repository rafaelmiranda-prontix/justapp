'use client'

// Analytics service - suporta PostHog e outros
import posthog from 'posthog-js'

declare global {
  interface Window {
    posthog?: typeof posthog
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}

let posthogInitialized = false
let googleAnalyticsInitialized = false

export function initAnalytics() {
  if (typeof window === 'undefined') return

  // Inicializa PostHog se disponível
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && !posthogInitialized) {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    try {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('✅ PostHog initialized')
          }
        },
        // Desabilitar autocapture em desenvolvimento para reduzir ruído
        autocapture: process.env.NODE_ENV === 'production',
        // Capturar pageviews automaticamente
        capture_pageview: true,
        // Capturar pageleaves automaticamente
        capture_pageleave: true,
      })

      // Expor no window para compatibilidade
      window.posthog = posthog
      posthogInitialized = true
    } catch (error) {
      console.error('Error initializing PostHog:', error)
    }
  }

  // Inicializa Google Analytics se disponível
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !googleAnalyticsInitialized) {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    try {
      // Carregar script do Google Analytics
      const script1 = document.createElement('script')
      script1.async = true
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      document.head.appendChild(script1)

      // Inicializar gtag
      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        if (window.dataLayer) {
          window.dataLayer.push(args)
        }
      }
      window.gtag = gtag

      gtag('js', new Date())
      gtag('config', gaId, {
        page_path: window.location.pathname,
      })

      googleAnalyticsInitialized = true

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('✅ Google Analytics initialized')
      }
    } catch (error) {
      console.error('Error initializing Google Analytics:', error)
    }
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // Google Tag Manager - dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...properties,
    })
  }

  // Google Analytics (se configurado diretamente, sem GTM)
  if (window.gtag) {
    // Converter propriedades para formato do GA4
    const gaProperties: Record<string, any> = {
      event_category: properties?.category || 'general',
      ...properties,
    }
    window.gtag('event', eventName, gaProperties)
  }

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('📊 Analytics Event:', eventName, {
      posthog: !!window.posthog,
      gtm: !!window.dataLayer,
      ga: !!window.gtag,
      properties,
    })
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.identify(userId, traits)
  }

  // Google Analytics - User ID
  if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      user_id: userId,
      ...traits,
    })
  }

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('👤 Analytics Identify:', userId, {
      posthog: !!window.posthog,
      ga: !!window.gtag,
      traits,
    })
  }
}

export function resetUser() {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.reset()
  }
}

// Eventos pré-definidos
export const AnalyticsEvents = {
  // Autenticação
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Chat Anônimo - Funil de Conversão
  ANONYMOUS_CHAT_OPENED: 'anonymous_chat_opened',
  ANONYMOUS_MESSAGE_SENT: 'anonymous_message_sent',
  LEAD_CAPTURE_SHOWN: 'lead_capture_shown',
  LEAD_CAPTURED: 'lead_captured',
  ACTIVATION_EMAIL_SENT: 'activation_email_sent',
  ACTIVATION_EMAIL_OPENED: 'activation_email_opened',
  ACTIVATION_COMPLETED: 'activation_completed',
  ACTIVATION_MATCHING_TRIGGERED: 'activation_matching_triggered',

  // Casos
  CASO_CREATED: 'caso_created',
  CASO_VIEWED: 'caso_viewed',
  CASO_CLOSED: 'caso_closed',

  // Matches
  MATCH_CREATED: 'match_created',
  MATCH_ACCEPTED: 'match_accepted',
  MATCH_REJECTED: 'match_rejected',

  // Avaliações
  AVALIACAO_CREATED: 'avaliacao_created',

  // Assinatura
  PLAN_VIEWED: 'plan_viewed',
  PLAN_SELECTED: 'plan_selected',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_CREATED: 'subscription_created',

  // Navegação
  PAGE_VIEWED: 'page_viewed',
  BUTTON_CLICKED: 'button_clicked',
} as const
