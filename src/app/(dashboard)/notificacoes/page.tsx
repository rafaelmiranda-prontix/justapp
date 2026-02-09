'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Bell, CheckCheck, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  href: string
  readAt: string | null
  createdAt: string
}

const TAKE = 20

export default function NotificacoesPage() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchList = useCallback(
    async (cursor?: string | null, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      try {
        const params = new URLSearchParams({
          status: filter,
          take: String(TAKE),
        })
        if (cursor) params.set('cursor', cursor)
        const res = await fetch(`/api/notifications?${params}`)
        if (!res.ok) throw new Error('Erro ao carregar')
        const data = await res.json()
        if (append) {
          setItems((prev) => [...prev, ...(data.items ?? [])])
        } else {
          setItems(data.items ?? [])
        }
        setNextCursor(data.nextCursor ?? null)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [filter]
  )

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      await fetchList()
    } finally {
      setMarkingAll(false)
    }
  }

  const handleItemClick = async (id: string, href: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i))
    )
    router.push(href)
  }

  const loadMore = () => {
    if (nextCursor && !loadingMore) fetchList(nextCursor, true)
  }

  const unreadCount = items.filter((i) => !i.readAt).length
  const hasUnread = items.some((i) => !i.readAt)

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificações
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Não lidas
            </Button>
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas como lidas
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Nenhuma notificação.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.id, item.href)}
                    className={cn(
                      'w-full text-left py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-accent',
                      !item.readAt && 'bg-primary/5'
                    )}
                  >
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {item.message}
                    </p>
                    <p className="text-muted-foreground/80 text-xs mt-1">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Carregar mais'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
