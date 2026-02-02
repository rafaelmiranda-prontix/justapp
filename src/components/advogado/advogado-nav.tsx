'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardSidebar, NavItem } from '@/components/layout/dashboard-sidebar'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SheetClose } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Star,
  CreditCard,
  User,
  BarChart3,
} from 'lucide-react'

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/advogado/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Casos Recebidos',
    href: '/advogado/casos',
    icon: Briefcase,
  },
  {
    title: 'Conversas',
    href: '/advogado/conversas',
    icon: MessageSquare,
  },
  {
    title: 'Avaliações',
    href: '/advogado/avaliacoes',
    icon: Star,
  },
  {
    title: 'Estatísticas',
    href: '/advogado/estatisticas',
    icon: BarChart3,
  },
  {
    title: 'Assinatura',
    href: '/advogado/assinatura',
    icon: CreditCard,
  },
  {
    title: 'Meu Perfil',
    href: '/advogado/perfil',
    icon: User,
  },
]

export function AdvogadoNav() {
  return <DashboardSidebar items={navItems} variant="indigo" />
}

export function AdvogadoMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1 p-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <SheetClose asChild key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'text-white'
                )}
              />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={isActive ? 'secondary' : 'outline'}
                  className={cn(
                    'px-2 py-0.5 text-xs',
                    isActive && 'bg-white/20 text-white border-white/30'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          </SheetClose>
        )
      })}
    </nav>
  )
}
