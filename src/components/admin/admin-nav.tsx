'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Scale,
  Shield,
  Settings,
  Cog,
  FileText,
  CreditCard,
  ClipboardList,
  MoreHorizontal,
  Gauge,
  CalendarDays,
  PieChart,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Casos',
    href: '/admin/casos',
    icon: FileText,
  },
  {
    title: 'Advogados',
    href: '/admin/advogados',
    icon: Scale,
  },
  {
    title: 'Leads',
    href: '/admin/leads',
    icon: Gauge,
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
  {
    title: 'Mensagens chat',
    href: '/admin/chat-mensagens',
    icon: ClipboardList,
  },
  {
    title: 'Suporte WhatsApp',
    href: '/admin/suporte',
    icon: MessageSquare,
  },
  {
    title: 'Audiências / diligências',
    href: '/admin/audiencias-diligencias',
    icon: CalendarDays,
  },
  {
    title: 'Cotas distribuição',
    href: '/admin/audiencias-diligencias/cotas',
    icon: PieChart,
  },
  {
    title: 'Planos',
    href: '/admin/planos',
    icon: CreditCard,
  },
  {
    title: 'Auditoria',
    href: '/admin/auditoria',
    icon: Shield,
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const primaryItems = navItems.slice(0, 6)
  const secondaryItems = navItems.slice(6)
  const activeSecondaryItem = secondaryItems.find((item) => pathname === item.href)

  return (
    <nav className="flex items-center gap-2 border-b pb-4">
      {primaryItems.map((item) => {
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={activeSecondaryItem ? 'default' : 'ghost'}
            className="gap-2"
          >
            <MoreHorizontal className="h-4 w-4" />
            Mais
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Outras seções</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {secondaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className={cn(isActive && 'bg-accent text-accent-foreground')}
              >
                <Link href={item.href} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
