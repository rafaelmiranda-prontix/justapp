'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CaseDetails } from '@/components/casos/case-details'
import { ArrowLeft, AlertCircle, Send, Headphones } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  const [updatingCaseStatus, setUpdatingCaseStatus] = useState(false)
  const { toast } = useToast()

  const getCloseAction = (status: string) => {
    if (status === 'ABERTO' || status === 'PENDENTE_ATIVACAO') {
      return { action: 'CANCELAR' as const, label: 'Cancelar caso' }
    }
    return { action: 'FECHAR' as const, label: 'Fechar caso' }
  }

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
        toast({
          title: 'Mensagem enviada',
          description: 'Sua mensagem foi enviada à equipe de suporte da plataforma.',
        })
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

  const handleCloseCase = async () => {
    if (!caso) return
    const closeAction = getCloseAction(caso.status)
    const confirmed = window.confirm(`Tem certeza que deseja ${closeAction.label.toLowerCase()}?`)
    if (!confirmed) return

    setUpdatingCaseStatus(true)
    try {
      const response = await fetch(`/api/cidadao/casos/${casoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: closeAction.action }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Não foi possível encerrar o caso.')
      }

      const nextStatus = closeAction.action === 'CANCELAR' ? 'CANCELADO' : 'FECHADO'
      setCaso((prev: any) => (prev ? { ...prev, status: nextStatus } : prev))
      toast({
        title: closeAction.action === 'CANCELAR' ? 'Caso cancelado' : 'Caso fechado',
        description: 'O status do caso foi atualizado.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao encerrar caso',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingCaseStatus(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {caso.status !== 'FECHADO' && caso.status !== 'CANCELADO' && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto shrink-0"
              disabled={updatingCaseStatus}
              onClick={handleCloseCase}
            >
              {updatingCaseStatus ? 'Encerrando...' : getCloseAction(caso.status).label}
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto shrink-0">
                <Headphones className="h-4 w-4 mr-2" />
                Suporte da plataforma
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-6">
                <Headphones className="h-5 w-5" />
                Suporte da plataforma
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-left space-y-2 pt-1">
                  <p>
                    Use este canal para falar com a equipe do JustApp: dúvidas sobre o aplicativo, problemas
                    técnicos, cobrança ou mediação da plataforma.
                  </p>
                  <p className="text-muted-foreground">
                    Para conversar sobre o conteúdo jurídico do seu caso com o advogado, use o{' '}
                    <strong className="font-medium text-foreground">chat com advogados</strong> na seção acima.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-muted/30">
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                ) : adminMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mensagem ainda. Você pode enviar sua dúvida ou pedido de ajuda abaixo.
                  </p>
                ) : (
                  adminMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`text-sm p-2 rounded ${m.senderRole === 'ADMIN' ? 'bg-muted ml-2' : 'bg-primary/10 mr-2'}`}
                    >
                      <div className="font-medium text-xs text-muted-foreground">
                        {m.senderRole === 'ADMIN' ? 'Equipe JustApp' : m.sender.name} ·{' '}
                        {format(new Date(m.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <p className="mt-1">{m.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea
                  placeholder="Descreva sua dúvida ou pedido de suporte..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="resize-none flex-1 min-h-[80px]"
                />
                <Button
                  className="shrink-0 sm:self-end"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingReply ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CaseDetails caso={caso} showCidadaoInfo={false} lawyerChats={caso.lawyerChats ?? []} />
    </div>
  )
}
