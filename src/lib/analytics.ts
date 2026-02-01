'use client'

// Analytics service - suporta PostHog e outros
// Por enquanto, implementação básica que pode ser expandida

declare global {
  interface Window {
    posthog?: any
  }
}

export function initAnalytics() {
  // Inicializa PostHog se disponível
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // PostHog será carregado via script tag ou npm package
    // Por enquanto, apenas estrutura básica
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // Google Analytics (se configurado)
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', eventName, properties)
  }

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Analytics Event:', eventName, properties)
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.identify(userId, traits)
  }

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Analytics Identify:', userId, traits)
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
