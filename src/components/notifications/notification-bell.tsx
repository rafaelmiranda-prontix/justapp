'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NotificationPanel, type NotificationItem } from '@/components/notifications/notification-panel'
import { cn } from '@/lib/utils'

const POLL_INTERVAL_MS = 45_000
const NOTIFICATIONS_TAKE = 20

function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { unreadCount, refresh: fetchCount }
}

function useNotificationList(open: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/notifications?status=all&take=${NOTIFICATIONS_TAKE}`
      )
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchList()
  }, [open, fetchList])

  return { items, loading, refresh: fetchList }
}

function markOneAsRead(id: string) {
  return fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

function markAllAsRead() {
  return fetch('/api/notifications/read-all', { method: 'POST' })
}

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { unreadCount, refresh: refreshCount } = useUnreadCount()
  const open = dropdownOpen || sheetOpen
  const { items, loading, refresh: refreshList } = useNotificationList(open)

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAll(true)
    try {
      await markAllAsRead()
      await refreshList()
      await refreshCount()
    } finally {
      setIsMarkingAll(false)
    }
  }, [refreshList, refreshCount])

  const handleItemClick = useCallback(
    async (id: string, _href: string) => {
      await markOneAsRead(id)
      refreshCount()
      refreshList()
      setDropdownOpen(false)
      setSheetOpen(false)
    },
    [refreshCount, refreshList]
  )

  const badge = unreadCount > 0 ? (
    <span
      className={cn(
        'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white',
        unreadCount >= 100 && 'text-[9px]'
      )}
    >
      {unreadCount >= 100 ? '99+' : unreadCount}
    </span>
  ) : null

  const trigger = (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {badge}
    </Button>
  )

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="w-full max-w-sm p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificações</SheetTitle>
          </SheetHeader>
          <NotificationPanel
            variant="sheet"
            items={items}
            isLoading={loading}
            onMarkAllRead={handleMarkAllRead}
            isMarkingAll={isMarkingAll}
            onItemClick={handleItemClick}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <NotificationPanel
          variant="dropdown"
          items={items}
          isLoading={loading}
          onMarkAllRead={handleMarkAllRead}
          isMarkingAll={isMarkingAll}
          onItemClick={handleItemClick}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
