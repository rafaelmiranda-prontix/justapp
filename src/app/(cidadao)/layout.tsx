'use client'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { CidadaoNav, CidadaoMobileNav } from '@/components/cidadao/cidadao-nav'

export default function CidadaoLayout({ children }: { children: React.ReactNode }) {
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
