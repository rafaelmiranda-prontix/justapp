'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { CidadaoNav, CidadaoMobileNav } from '@/components/cidadao/cidadao-nav'
import { useCheckProfileComplete } from '@/hooks/use-check-profile-complete'

export default function CidadaoLayout({ children }: { children: React.ReactNode }) {
  // Verificar se o perfil está completo
  const { isChecking } = useCheckProfileComplete()

  // Mostrar loading enquanto verifica o perfil
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardHeader mobileNav={<CidadaoMobileNav />} />
      <div className="flex">
        <CidadaoNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
