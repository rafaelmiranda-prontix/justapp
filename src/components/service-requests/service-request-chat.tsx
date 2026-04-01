'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { OPERATIONAL_KIND_LABEL, SERVICE_STATUS_LABEL } from '@/lib/service-requests/labels'
import { cn } from '@/lib/utils'
import { Loader2, Paperclip, Send } from 'lucide-react'
import type { OperationalServiceKind, ServiceRequestStatus } from '@prisma/client'

const SECURITY_POLICY_URL =
  process.env.NEXT_PUBLIC_SECURITY_POLICY_URL || 'https://SEU-LINK-DE-POLITICA-AQUI'

export type ServiceChatMessage = {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string }
  attachment?: {
    id: string
    originalName: string
    storagePath: string
    kind: string
  } | null
}

type Props = {
  requestId: string
  currentUserId: string | undefined
  isAdmin: boolean
  kind: keyof typeof OPERATIONAL_KIND_LABEL
  status: ServiceRequestStatus
  scheduledAt: string
  locationLine: string
  offeredAmountLabel: string | null
  messages: ServiceChatMessage[]
  chatReadOnly: boolean
  canSendChat: boolean
  onSend: (text: string, attachmentId?: string) => Promise<void>
  onAfterSend?: () => void
}

function lastSeenStorageKey(requestId: string, userId: string) {
  return `serviceChat:lastSeen:${requestId}:${userId}`
}

function attachmentHref(path: string) {
  return `/api/service-requests/attachments/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function ServiceRequestChat({
  requestId,
  currentUserId,
  isAdmin,
  kind,
  status,
  scheduledAt,
  locationLine,
  offeredAmountLabel,
  messages,
  chatReadOnly,
  canSendChat,
  onSend,
  onAfterSend,
}: Props) {
  const [chatText, setChatText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

  const hasUnreadFromOthers = useMemo(() => {
    if (!currentUserId || !lastMessage) return false
    if (lastMessage.author.id === currentUserId) return false
    try {
      const raw = localStorage.getItem(lastSeenStorageKey(requestId, currentUserId))
      if (!raw) return true
      const parsed = JSON.parse(raw) as { messageId?: string; at?: string }
      if (parsed.messageId === lastMessage.id) return false
      const seenAt = parsed.at ? new Date(parsed.at).getTime() : 0
      const msgAt = new Date(lastMessage.createdAt).getTime()
      return msgAt > seenAt
    } catch {
      return true
    }
  }, [currentUserId, lastMessage, messages, requestId])

  const syncServerRead = useCallback(
    (messageId: string) => {
      if (!currentUserId) return
      void fetch(`/api/service-requests/${requestId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReadMessageId: messageId }),
      }).catch(() => {})
    },
    [currentUserId, requestId]
  )

  const markSeen = useCallback(() => {
    if (!currentUserId || !lastMessage) return
    localStorage.setItem(
      lastSeenStorageKey(requestId, currentUserId),
      JSON.stringify({ messageId: lastMessage.id, at: new Date().toISOString() })
    )
    syncServerRead(lastMessage.id)
  }, [currentUserId, lastMessage, requestId, syncServerRead])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const onScroll = () => markSeen()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [markSeen])

  useEffect(() => {
    markSeen()
  }, [markSeen, messages.length])

  async function handleSend() {
    const t = chatText.trim()
    if (!t || !canSendChat || sending || uploading) return
    setSending(true)
    try {
      await onSend(t)
      setChatText('')
      markSeen()
      onAfterSend?.()
    } finally {
      setSending(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !canSendChat || sending || uploading) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('kind', 'CHAT')
      const up = await fetch(`/api/service-requests/${requestId}/upload`, { method: 'POST', body: fd })
      const data = await up.json()
      if (!up.ok) throw new Error(data.error || 'Falha no upload')
      const att = data.attachment as { id: string; originalName: string }
      await onSend(`📎 ${att.originalName}`, att.id)
      markSeen()
      onAfterSend?.()
    } catch {
      // erro tratado pelo pai se necessário
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Chat do serviço</CardTitle>
        {hasUnreadFromOthers && (
          <Badge variant="secondary" className="text-xs">
            Novas mensagens
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Resumo do serviço</p>
          <p className="text-muted-foreground">
            {OPERATIONAL_KIND_LABEL[kind]} · {locationLine} ·{' '}
            {new Date(scheduledAt).toLocaleString('pt-BR')} · {SERVICE_STATUS_LABEL[status]}
          </p>
          {offeredAmountLabel && (
            <p className="text-muted-foreground">Valor ofertado: {offeredAmountLabel}</p>
          )}
        </div>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Boas práticas de segurança</p>
          <p>
            Use este chat apenas para informações relacionadas ao serviço. Evite compartilhar senhas,
            dados bancários sensíveis ou informações pessoais além do necessário.
          </p>
          <a href={SECURITY_POLICY_URL} target="_blank" rel="noreferrer" className="underline">
            Política de Segurança
          </a>
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(ev) => void handleFile(ev)}
        />
        {canSendChat && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || sending}
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando anexo…' : 'Anexar arquivo'}
          </Button>
        )}

        <div
          ref={listRef}
          className="space-y-2 max-h-64 overflow-y-auto border rounded p-2"
          tabIndex={0}
          role="log"
          aria-label="Mensagens do chat"
        >
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Use este espaço para alinhar instruções do serviço.
            </p>
          )}
          {messages.map((m) => {
            const isCurrentUser = currentUserId === m.author.id
            return (
              <div key={m.id} className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[78%] rounded-lg px-3 py-2 text-sm',
                    isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  )}
                >
                  <p className="text-xs opacity-80">
                    <span className="font-medium">{m.author.name}</span> ·{' '}
                    {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.attachment && (
                    <a
                      href={attachmentHref(m.attachment.storagePath)}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        'text-xs underline mt-1 inline-block',
                        isCurrentUser ? 'text-primary-foreground/90' : 'text-primary'
                      )}
                    >
                      Baixar: {m.attachment.originalName}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {chatReadOnly && (
          <p className="text-xs text-muted-foreground">
            Chat em modo histórico: novas mensagens estão bloqueadas após conclusão/cancelamento.
          </p>
        )}
        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            Modo auditoria: administradores possuem acesso somente leitura neste chat.
          </p>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            rows={2}
            className="min-h-[60px] flex-1"
            disabled={!canSendChat || sending || uploading}
            placeholder={
              canSendChat ? 'Digite uma mensagem…' : 'Envio desabilitado para este perfil/status'
            }
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0 h-[60px] w-11"
            onClick={() => void handleSend()}
            disabled={!canSendChat || sending || uploading || !chatText.trim()}
            title="Enviar"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{chatText.length}/2000 caracteres</p>
      </CardContent>
    </Card>
  )
}
