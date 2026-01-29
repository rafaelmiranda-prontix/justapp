'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { initAnalytics, identifyUser, resetUser } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

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
      })
    } else {
      resetUser()
    }
  }, [session])

  return <>{children}</>
}
