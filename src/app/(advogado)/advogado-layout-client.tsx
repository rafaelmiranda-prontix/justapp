'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { AdvogadoNav, AdvogadoMobileNav } from '@/components/advogado/advogado-nav'

export function AdvogadoLayoutClient({
  children,
  audienciasDiligenciasEnabled,
}: {
  children: React.ReactNode
  audienciasDiligenciasEnabled: boolean
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <DashboardHeader
        mobileNav={<AdvogadoMobileNav audienciasDiligenciasEnabled={audienciasDiligenciasEnabled} />}
      />
      <div className="flex">
        <AdvogadoNav audienciasDiligenciasEnabled={audienciasDiligenciasEnabled} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
