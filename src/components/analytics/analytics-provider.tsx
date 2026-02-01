'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { initAnalytics, identifyUser, resetUser, trackEvent, AnalyticsEvents } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    // Inicializa analytics
    initAnalytics()
  }, [])

  useEffect(() => {
    // Identifica usuário quando logado
    if (session?.user) {
      identifyUser(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        cidadaoId: session.user.cidadaoId,
        advogadoId: session.user.advogadoId,
      })
    } else {
      resetUser()
    }
  }, [session])

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackEvent(AnalyticsEvents.PAGE_VIEWED, {
        path: pathname,
      })

      // Google Analytics pageview
      if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
          page_path: pathname,
        })
      }
    }
  }, [pathname])

  return <>{children}</>
}
