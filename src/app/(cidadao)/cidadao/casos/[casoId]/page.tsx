'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CaseDetails } from '@/components/casos/case-details'
import { ArrowLeft, AlertCircle, MessageSquare, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { JustAppLoading } from '@/components/ui/justapp-loading'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CidadaoCasoDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminMessages, setAdminMessages] = useState<Array<{ id: string; senderRole: string; message: string; createdAt: string; sender: { name: string } }>>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const { toast } = useToast()

  const fetchAdminMessages = useCallback(async () => {
    if (!casoId) return
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/cidadao/casos/${casoId}/admin-messages`)
      const result = await res.json()
      if (result.success && result.data) setAdminMessages(result.data)
    } catch {
      setAdminMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [casoId])

  useEffect(() => {
    fetchCasoDetails()
  }, [casoId])

  useEffect(() => {
    if (caso?.id) fetchAdminMessages()
  }, [caso?.id, fetchAdminMessages])

  const fetchCasoDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cidadao/casos/${casoId}`)
      const result = await res.json()

      if (result.success) {
        setCaso(result.data)
      } else {
        setError(result.error || 'Erro ao buscar caso')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      setError('Erro ao carregar detalhes do caso')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <JustAppLoading size="lg" text="Carregando detalhes do caso..." fullScreen={false} />
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || 'Caso não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/cidadao/casos/${casoId}/admin-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim(), attachmentUrls: [] }),
      })
      const result = await res.json()
      if (result.success && result.data) {
        setAdminMessages((prev) => [...prev, result.data])
        setReplyText('')
        toast({ title: 'Mensagem enviada', description: 'Sua resposta foi enviada ao suporte.' })
      } else {
        throw new Error(result.error || 'Erro ao enviar')
      }
    } catch (e) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro ao enviar mensagem',
        variant: 'destructive',
      })
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <CaseDetails caso={caso} showCidadaoInfo={false} />

      {/* Atendimento JustApp (mediação admin) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Atendimento JustApp
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Mensagens com nossa equipe sobre este caso. Você pode responder aqui.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-3 max-h-72 overflow-y-auto space-y-2 bg-muted/30">
            {loadingMessages ? (
              <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
            ) : adminMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Nossa equipe pode entrar em contato por aqui.</p>
            ) : (
              adminMessages.map((m) => (
                <div
                  key={m.id}
                  className={`text-sm p-2 rounded ${m.senderRole === 'ADMIN' ? 'bg-muted ml-4' : 'bg-primary/10 mr-4'}`}
                >
                  <div className="font-medium text-xs text-muted-foreground">
                    {m.senderRole === 'ADMIN' ? 'Atendimento JustApp' : m.sender.name} · {format(new Date(m.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <p className="mt-1">{m.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="resize-none flex-1"
            />
            <Button onClick={handleSendReply} disabled={!replyText.trim() || sendingReply}>
              <Send className="h-4 w-4 mr-2" />
              {sendingReply ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
