'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
  variant?: 'default' | 'blue' | 'indigo'
}

interface DashboardSidebarProps {
  items: NavItem[]
  variant?: 'blue' | 'indigo'
}

export function DashboardSidebar({ items, variant = 'blue' }: DashboardSidebarProps) {
  const pathname = usePathname()

  const gradientClasses = {
    blue: 'from-blue-600 to-blue-500',
    indigo: 'from-indigo-600 to-indigo-500',
  }

  const activeGradient = gradientClasses[variant]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-background/50">
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform group-hover:scale-110',
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
          )
        })}
      </nav>
    </aside>
  )
}
