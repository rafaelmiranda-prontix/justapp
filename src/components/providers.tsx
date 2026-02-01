'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { CookieBanner } from '@/components/ui/cookie-banner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AnalyticsProvider>
          {children}
          <Toaster />
          <CookieBanner />
        </AnalyticsProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
