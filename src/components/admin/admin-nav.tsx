'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Scale,
  Shield,
  Settings,
  Cog,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Advogados',
    href: '/admin/advogados',
    icon: Scale,
  },
  {
    title: 'Avaliações',
    href: '/admin/avaliacoes',
    icon: MessageSquare,
  },
  {
    title: 'Usuários',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    title: 'Configurações',
    href: '/admin/configuracoes',
    icon: Cog,
  },
  {
    title: 'Config. Chat',
    href: '/admin/chat-config',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-2 border-b pb-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
