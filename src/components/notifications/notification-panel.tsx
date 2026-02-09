'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  href: string
  readAt: string | null
  createdAt: string
  metadata?: Record<string, unknown> | null
}

type NotificationPanelProps = {
  items: NotificationItem[]
  isLoading?: boolean
  onMarkAllRead?: () => void
  isMarkingAll?: boolean
  onItemClick?: (id: string, href: string) => void
  variant?: 'dropdown' | 'sheet'
}

export function NotificationPanel({
  items,
  isLoading,
  onMarkAllRead,
  isMarkingAll,
  onItemClick,
  variant = 'dropdown',
}: NotificationPanelProps) {
  const router = useRouter()

  const handleItemClick = (id: string, href: string) => {
    onItemClick?.(id, href)
    router.push(href)
  }

  return (
    <div className={cn('flex flex-col', variant === 'sheet' && 'h-[70vh]')}>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
        </h3>
        <div className="flex items-center gap-1">
          {onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={onMarkAllRead}
              disabled={isMarkingAll || items.filter((i) => !i.readAt).length === 0}
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/notificacoes">Ver todas</Link>
          </Button>
        </div>
      </div>
      <ScrollArea className={cn('flex-1', variant === 'dropdown' ? 'h-[320px]' : 'min-h-0')}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 px-4">
            Nenhuma notificação.
          </p>
        ) : (
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-accent border-b border-border/50 last:border-0',
                    !item.readAt && 'bg-primary/5 font-medium')
                  }
                >
                  <p className="font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-muted-foreground truncate text-xs mt-0.5">{item.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
