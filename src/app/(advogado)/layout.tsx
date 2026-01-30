'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { AdvogadoNav } from '@/components/advogado/advogado-nav'

export default function AdvogadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <DashboardHeader mobileNav={<AdvogadoNav />} />
      <div className="flex">
        <AdvogadoNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
