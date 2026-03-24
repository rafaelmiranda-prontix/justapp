'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  FileText,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Lock,
  Send,
  StickyNote,
  ListChecks,
  RefreshCw,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type CasoStatusType = 'ABERTO' | 'EM_MEDIACAO' | 'EM_ANDAMENTO' | 'FECHADO' | 'CANCELADO'

interface CaseMessage {
  id: string
  senderRole: string
  message: string
  attachmentUrls: string[]
  visibility: 'PUBLIC' | 'INTERNAL'
  createdAt: string
  sender: { id: string; name: string; email: string }
}

interface Caso {
  id: string
  descricao: string
  status: CasoStatusType
  urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  createdAt: string
  updatedAt: string
  redistribuicoes: number
  mediatedByAdminId?: string | null
  mediatedAt?: string | null
  mediatedByAdmin?: { id: string; name: string; email: string } | null
  closedByAdminId?: string | null
  closedAt?: string | null
  closeReason?: string | null
  closeSummary?: string | null
  checklist?: {
    documentosRecebidos?: boolean
    informacoesMinimas?: boolean
    orientacaoEnviada?: boolean
    encaminhadoAdvogado?: boolean
  } | null
  especialidades: {
    id: string
    nome: string
  } | null
  cidadaos: {
    id: string
    cidade: string | null
    estado: string | null
    users: {
      id: string
      name: string
      email: string
    }
  }
  matches: Array<{
    id: string
    status: string
    score: number
    advogados: {
      users: {
        name: string
        email: string
      }
    }
    mensagens?: Array<{
      id: string
      createdAt: string
    }>
  }>
  case_messages?: CaseMessage[]
  _count?: {
    case_messages: number
  }
}

// Função auxiliar para verificar se caso está alocado
const isCasoAlocated = (caso: Caso): boolean => {
  return (caso.matches ?? []).some(
    (match) => match.status === 'PENDENTE' || match.status === 'ACEITO'
  )
}

const statusColors: Record<CasoStatusType, string> = {
  ABERTO: 'bg-yellow-500',
  EM_MEDIACAO: 'bg-purple-500',
  EM_ANDAMENTO: 'bg-blue-500',
  FECHADO: 'bg-green-500',
  CANCELADO: 'bg-gray-500',
}

const statusLabels: Record<CasoStatusType, string> = {
  ABERTO: 'Aberto',
  EM_MEDIACAO: 'Em mediação',
  EM_ANDAMENTO: 'Em Andamento',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

const closeReasonLabels: Record<string, string> = {
  RESOLVIDO: 'Resolvido',
  SEM_RETORNO_DO_CLIENTE: 'Sem retorno do cliente',
  INCOMPLETO_SEM_DOCUMENTOS: 'Incompleto / Sem documentos',
  DUPLICADO: 'Duplicado',
  FORA_DO_ESCOPO: 'Fora do escopo',
  ENCERRADO_COM_ENCAMINHAMENTO: 'Encerrado com encaminhamento',
}

const MESSAGE_TEMPLATES = [
  'Pode detalhar melhor o ocorrido?',
  'Envie prints/contrato/comprovantes',
  'Qual data e local do fato?',
  'Podemos encerrar como resolvido?',
]

const urgenciaColors = {
  BAIXA: 'bg-blue-500',
  NORMAL: 'bg-yellow-500',
  ALTA: 'bg-orange-500',
  URGENTE: 'bg-red-500',
}

const urgenciaLabels = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

export default function AdminCasosPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)
  const [isDeallocating, setIsDeallocating] = useState(false)
  const [isAssumingMediation, setIsAssumingMediation] = useState(false)
  const [isClosingCase, setIsClosingCase] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closeReason, setCloseReason] = useState<string>('RESOLVIDO')
  const [closeSummary, setCloseSummary] = useState('')
  const [notifyCitizen, setNotifyCitizen] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [noteText, setNoteText] = useState('')
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; actorName: string; createdAt: string; severity: string }>>([])
  const [activeTab, setActiveTab] = useState('resumo')
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [allocateCasoId, setAllocateCasoId] = useState<string | null>(null)
  const [allocateMode, setAllocateMode] = useState<'auto' | 'manual'>('auto')
  const [advogadosOptions, setAdvogadosOptions] = useState<Array<{ id: string; users: { name: string; email: string }; oab: string }>>([])
  const [selectedAdvogadoIds, setSelectedAdvogadoIds] = useState<string[]>([])
  const [loadingAdvogados, setLoadingAdvogados] = useState(false)
  const [isClearingExpired, setIsClearingExpired] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const hasExpiredMatches = (caso: Caso) =>
    (caso.matches ?? []).some((m) => m.status === 'EXPIRADO')

  const fetchCasos = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/casos?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setCasos(result.data)
        setPagination(result.pagination ?? null)
        setStatusBreakdown(result.statusBreakdown ?? {})
      } else {
        throw new Error(result.error || 'Erro ao buscar casos')
      }
    } catch (error) {
      console.error('Erro ao buscar casos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar casos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, toast, page, pageSize])

  useEffect(() => {
    fetchCasos()
  }, [fetchCasos])

  // Abrir caso quando vier da notificação (open=casoId)
  const openCasoId = searchParams.get('open')
  useEffect(() => {
    if (!openCasoId || isLoading) return
    const open = async () => {
      try {
        const res = await fetch(`/api/admin/casos/${openCasoId}`)
        const result = await res.json()
        if (result.success) {
          setSelectedCaso(result.data)
          setIsDialogOpen(true)
        }
      } catch {
        // ignore
      }
    }
    open()
  }, [openCasoId, isLoading])

  const handleViewDetails = async (casoId: string) => {
    try {
      const res = await fetch(`/api/admin/casos/${casoId}`)
      const result = await res.json()

      if (result.success) {
        setSelectedCaso(result.data)
        setIsDialogOpen(true)
      } else {
        throw new Error(result.error || 'Erro ao buscar detalhes')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao buscar detalhes',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateStatus = async (casoId: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Status do caso atualizado com sucesso',
        })
        setIsDialogOpen(false)
        fetchCasos()
      } else {
        throw new Error(result.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openAllocateDialog = (casoId: string) => {
    setAllocateCasoId(casoId)
    setAllocateMode('auto')
    setSelectedAdvogadoIds([])
    setAdvogadosOptions([])
    setAllocateDialogOpen(true)
  }

  const fetchAdvogadosForAllocate = async () => {
    setLoadingAdvogados(true)
    try {
      const res = await fetch('/api/admin/advogados?status=aprovados&limit=100')
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        setAdvogadosOptions(result.data)
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar advogados', variant: 'destructive' })
    } finally {
      setLoadingAdvogados(false)
    }
  }

  const handleAllocateAuto = async () => {
    if (!allocateCasoId) return
    setIsAllocating(true)
    try {
      const res = await fetch(`/api/admin/casos/${allocateCasoId}/allocate`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message || 'Caso alocado com sucesso' })
        setAllocateDialogOpen(false)
        setIsDialogOpen(false)
        fetchCasos()
      } else {
        throw new Error(result.error || 'Erro ao alocar caso')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alocar caso',
        variant: 'destructive',
      })
    } finally {
      setIsAllocating(false)
    }
  }

  const handleAllocateManual = async () => {
    if (!allocateCasoId || selectedAdvogadoIds.length === 0) {
      toast({ title: 'Selecione ao menos um advogado', variant: 'destructive' })
      return
    }
    setIsAllocating(true)
    try {
      const res = await fetch(`/api/admin/casos/${allocateCasoId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advogadoIds: selectedAdvogadoIds }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message || 'Caso alocado com sucesso' })
        setAllocateDialogOpen(false)
        setIsDialogOpen(false)
        fetchCasos()
      } else {
        throw new Error(result.error || 'Erro ao alocar caso')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alocar caso',
        variant: 'destructive',
      })
    } finally {
      setIsAllocating(false)
    }
  }

  const toggleAdvogadoSelection = (id: string) => {
    setSelectedAdvogadoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleClearExpired = async (casoId: string) => {
    setIsClearingExpired(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/clear-expired`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message })
        if (selectedCaso?.id === casoId) {
          const refetch = await fetch(`/api/admin/casos/${casoId}`)
          const refetchResult = await refetch.json()
          if (refetchResult.success && refetchResult.data) setSelectedCaso(refetchResult.data)
        }
        fetchCasos()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao limpar expirados',
        variant: 'destructive',
      })
    } finally {
      setIsClearingExpired(false)
    }
  }

  const handleDeallocate = async (casoId: string) => {
    if (
      !confirm(
        'Tem certeza que deseja dealocar este caso? Todos os matches pendentes serão removidos.'
      )
    ) {
      return
    }

    setIsDeallocating(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/deallocate`, {
        method: 'POST',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message || 'Caso dealocado com sucesso',
        })
        setIsDialogOpen(false)
        fetchCasos()
      } else {
        throw new Error(result.error || 'Erro ao dealocar caso')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao dealocar caso',
        variant: 'destructive',
      })
    } finally {
      setIsDeallocating(false)
    }
  }

  const handleAssumeMediation = async (casoId: string) => {
    setIsAssumingMediation(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/assume-mediation`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message ?? 'Mediação assumida' })
        const refetch = await fetch(`/api/admin/casos/${casoId}`)
        const refetchResult = await refetch.json()
        if (refetchResult.success && refetchResult.data) setSelectedCaso(refetchResult.data)
        fetchCasos()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao assumir mediação',
        variant: 'destructive',
      })
    } finally {
      setIsAssumingMediation(false)
    }
  }

  const handleCloseCase = async (casoId: string) => {
    if (!closeSummary.trim()) {
      toast({ title: 'Resumo obrigatório', variant: 'destructive' })
      return
    }
    setIsClosingCase(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closeReason,
          closeSummary: closeSummary.trim(),
          notifyCitizen,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Sucesso', description: 'Caso fechado com sucesso' })
        setCloseModalOpen(false)
        setCloseSummary('')
        if (result.data) setSelectedCaso(result.data)
        setIsDialogOpen(false)
        fetchCasos()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fechar caso',
        variant: 'destructive',
      })
    } finally {
      setIsClosingCase(false)
    }
  }

  const handleSendMessage = async (casoId: string, isInternal = false) => {
    const text = isInternal ? noteText : messageText
    if (!text.trim()) return
    setIsSendingMessage(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          attachmentUrls: [],
          visibility: isInternal ? 'INTERNAL' : 'PUBLIC',
        }),
      })
      const result = await res.json()
      if (result.success) {
        if (result.data) {
          setSelectedCaso((prev) =>
            prev
              ? {
                  ...prev,
                  case_messages: [...(prev.case_messages ?? []), result.data],
                }
              : null
          )
        }
        if (isInternal) setNoteText('')
        else setMessageText('')
        toast({ title: 'Mensagem enviada' })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar',
        variant: 'destructive',
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleChecklistChange = async (
    casoId: string,
    key: keyof NonNullable<Caso['checklist']>,
    value: boolean
  ) => {
    const prev = selectedCaso?.checklist ?? {}
    const next = { ...prev, [key]: value }
    try {
      const res = await fetch(`/api/admin/casos/${casoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: next }),
      })
      const result = await res.json()
      if (result.success && result.data) {
        setSelectedCaso(result.data)
        toast({ title: 'Checklist atualizado' })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar checklist',
        variant: 'destructive',
      })
    }
  }

  const fetchAuditLogs = useCallback(async (casoId: string) => {
    try {
      const res = await fetch(
        `/api/admin/security-logs?targetType=CASO&targetId=${casoId}&limit=20`
      )
      const result = await res.json()
      if (result.success && result.data) {
        setAuditLogs(
          result.data.map((l: { id: string; action: string; actorName: string; createdAt: string; severity: string }) => ({
            id: l.id,
            action: l.action,
            actorName: l.actorName,
            createdAt: l.createdAt,
            severity: l.severity,
          }))
        )
      }
    } catch {
      setAuditLogs([])
    }
  }, [])

  const stats = useMemo(() => {
    const total = pagination?.total ?? 0
    return {
      total,
      pendenteAtivacao: statusBreakdown['PENDENTE_ATIVACAO'] ?? 0,
      abertos: statusBreakdown['ABERTO'] ?? 0,
      emMediacao: statusBreakdown['EM_MEDIACAO'] ?? 0,
      emAndamento: statusBreakdown['EM_ANDAMENTO'] ?? 0,
      fechados: statusBreakdown['FECHADO'] ?? 0,
      cancelados: statusBreakdown['CANCELADO'] ?? 0,
    }
  }, [pagination?.total, statusBreakdown])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Casos</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os casos da plataforma
        </p>
      </div>

      <AdminNav />

      {/* Estatísticas (totais do filtro atual, não só da página) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mt-8 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
            {stats.pendenteAtivacao > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {stats.pendenteAtivacao} pendente ativação
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.abertos}</div>
            <p className="text-xs text-muted-foreground">Abertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.emMediacao}</div>
            <p className="text-xs text-muted-foreground">Em mediação</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.fechados}</div>
            <p className="text-xs text-muted-foreground">Fechados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelados}</div>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, cliente ou email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setPage(1)
                    setSearchQuery(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setPage(1)
                  setStatusFilter(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ABERTO">Aberto</SelectItem>
                  <SelectItem value="EM_MEDIACAO">Em mediação</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="FECHADO">Fechado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de casos */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : casos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum caso encontrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {casos.map((caso) => (
            <Card key={caso.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${statusColors[caso.status]} text-white`}
                          >
                            {statusLabels[caso.status]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${urgenciaColors[caso.urgencia]} text-white border-0`}
                          >
                            {urgenciaLabels[caso.urgencia]}
                          </Badge>
                          {isCasoAlocated(caso) ? (
                            <Badge variant="default" className="bg-green-600">
                              Alocado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-400 text-gray-600">
                              Não Alocado
                            </Badge>
                          )}
                          {caso.especialidades && (
                            <Badge variant="secondary">
                              {caso.especialidades.nome}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {caso.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{caso.cidadaos.users.name}</span>
                      </div>
                      {(caso.cidadaos.cidade || caso.cidadaos.estado) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {[caso.cidadaos.cidade, caso.cidadaos.estado].filter(Boolean).join(' - ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>
                          {(caso._count?.case_messages ?? (caso.matches ?? []).reduce((acc, match) => acc + (match.mensagens?.length || 0), 0))} mensagem(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(caso.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {(caso.matches?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{(caso.matches ?? []).length} match(es)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isCasoAlocated(caso) ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeallocate(caso.id)}
                        disabled={isDeallocating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dealocar
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openAllocateDialog(caso.id)}
                        disabled={isAllocating || caso.status !== 'ABERTO'}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Alocar
                      </Button>
                    )}
                    {!isCasoAlocated(caso) && hasExpiredMatches(caso) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearExpired(caso.id)}
                        disabled={isClearingExpired}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isClearingExpired ? 'animate-spin' : ''}`} />
                        Limpar expirados
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(caso.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, pagination.total)} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2 tabular-nums">
                  Página {page} de {pagination.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCloseModalOpen(false); setActiveTab('resumo'); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Caso</DialogTitle>
            <DialogDescription>
              Informações completas, conversas e mediação
            </DialogDescription>
          </DialogHeader>

          {selectedCaso && (
            <>
              {/* Header: Status + Assumir / Em mediação + Fechar */}
              <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                <Badge className={`${statusColors[selectedCaso.status]} text-white`}>
                  {statusLabels[selectedCaso.status]}
                </Badge>
                {selectedCaso.mediatedByAdminId ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Em mediação por {selectedCaso.mediatedByAdmin?.name ?? 'admin'}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssumeMediation(selectedCaso.id)}
                    disabled={isAssumingMediation || selectedCaso.status === 'FECHADO'}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isAssumingMediation ? 'Assumindo...' : 'Assumir mediação'}
                  </Button>
                )}
                {selectedCaso.status !== 'FECHADO' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCloseModalOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Fechar caso
                  </Button>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'auditoria') fetchAuditLogs(selectedCaso.id); }}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="conversas">Conversas</TabsTrigger>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="notas">Notas internas</TabsTrigger>
                  <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="space-y-4 mt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">Status:</span>
                      <Badge className={`${statusColors[selectedCaso.status]} text-white`}>
                        {statusLabels[selectedCaso.status]}
                      </Badge>
                      <Select
                        value={selectedCaso.status}
                        onValueChange={(value) => handleUpdateStatus(selectedCaso.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ABERTO">Aberto</SelectItem>
                          <SelectItem value="EM_MEDIACAO">Em mediação</SelectItem>
                          <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                          <SelectItem value="FECHADO">Fechado</SelectItem>
                          <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span className="font-medium">Alocação:</span>{' '}
                      {isCasoAlocated(selectedCaso) ? (
                        <Badge variant="default" className="bg-green-600">
                          Alocado ({(selectedCaso.matches ?? []).filter((m) => m.status === 'PENDENTE' || m.status === 'ACEITO').length} match(es))
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não alocado</Badge>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Urgência:</span>{' '}
                      <Badge variant="outline" className={urgenciaColors[selectedCaso.urgencia]}>{urgenciaLabels[selectedCaso.urgencia]}</Badge>
                    </div>
                    {selectedCaso.especialidades && (
                      <div><span className="font-medium">Especialidade:</span> {selectedCaso.especialidades.nome}</div>
                    )}
                    <div>
                      <span className="font-medium">Descrição:</span>
                      <p className="mt-1 text-muted-foreground">{selectedCaso.descricao}</p>
                    </div>
                    <div><span className="font-medium">Cliente:</span> {selectedCaso.cidadaos.users.name} ({selectedCaso.cidadaos.users.email})</div>
                    {(selectedCaso.cidadaos.cidade || selectedCaso.cidadaos.estado) && (
                      <div><span className="font-medium">Cidade:</span> {[selectedCaso.cidadaos.cidade, selectedCaso.cidadaos.estado].filter(Boolean).join(' - ')}</div>
                    )}
                    <div><span className="font-medium">Criado em:</span> {format(new Date(selectedCaso.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                    {selectedCaso.closeReason && (
                      <div>
                        <span className="font-medium">Fechamento:</span> {closeReasonLabels[selectedCaso.closeReason] ?? selectedCaso.closeReason}
                        {selectedCaso.closeSummary && <p className="text-muted-foreground mt-1">{selectedCaso.closeSummary}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {isCasoAlocated(selectedCaso) ? (
                      <Button variant="destructive" size="sm" onClick={() => handleDeallocate(selectedCaso.id)} disabled={isDeallocating || selectedCaso.status !== 'ABERTO'}>
                        <XCircle className="h-4 w-4 mr-2" /> Dealocar
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => openAllocateDialog(selectedCaso.id)} disabled={isAllocating || selectedCaso.status !== 'ABERTO'}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Alocar
                      </Button>
                    )}
                    {!isCasoAlocated(selectedCaso) && hasExpiredMatches(selectedCaso) && (
                      <Button variant="outline" size="sm" onClick={() => handleClearExpired(selectedCaso.id)} disabled={isClearingExpired}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isClearingExpired ? 'animate-spin' : ''}`} />
                        Limpar expirados
                      </Button>
                    )}
                  </div>
                  {(selectedCaso.matches?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Matches ({(selectedCaso.matches ?? []).length})</h3>
                      <div className="space-y-2">
                        {(selectedCaso.matches ?? []).map((match) => (
                          <Card key={match.id}><CardContent className="pt-3">
                            <div className="flex justify-between">
                              <div><div className="font-medium">{match.advogados.users.name}</div>
                                <div className="text-sm text-muted-foreground">{match.advogados.users.email}</div></div>
                              <Badge variant={match.status === 'ACEITO' || match.status === 'CONTRATADO' ? 'default' : match.status === 'RECUSADO' ? 'destructive' : 'secondary'}>{match.status}</Badge>
                            </div>
                          </CardContent></Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conversas" className="mt-4">
                  <div className="border rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 mb-3">
                    {(selectedCaso.case_messages ?? []).filter((m) => m.visibility === 'PUBLIC').map((m) => (
                      <div key={m.id} className={`text-sm p-2 rounded ${m.senderRole === 'ADMIN' ? 'bg-muted ml-4' : 'bg-primary/10 mr-4'}`}>
                        <div className="font-medium text-xs text-muted-foreground">{m.sender.name} · {format(new Date(m.createdAt), "dd/MM HH:mm", { locale: ptBR })}</div>
                        <p className="mt-1">{m.message}</p>
                      </div>
                    ))}
                    {(!selectedCaso.case_messages || selectedCaso.case_messages.filter((m) => m.visibility === 'PUBLIC').length === 0) && (
                      <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Atalhos:</p>
                    <div className="flex flex-wrap gap-1">
                      {MESSAGE_TEMPLATES.map((t) => (
                        <Button key={t} variant="outline" size="sm" onClick={() => setMessageText(t)}>{t.length > 35 ? t.slice(0, 35) + '…' : t}</Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea placeholder="Mensagem ao cidadão..." value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={2} className="resize-none flex-1" />
                      <Button onClick={() => handleSendMessage(selectedCaso.id, false)} disabled={!messageText.trim() || isSendingMessage}><Send className="h-4 w-4 mr-2" /> Enviar</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="checklist" className="mt-4 space-y-3">
                  <div className="space-y-2">
                    {(['documentosRecebidos', 'informacoesMinimas', 'orientacaoEnviada', 'encaminhadoAdvogado'] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          checked={!!selectedCaso.checklist?.[key]}
                          onCheckedChange={(checked) => handleChecklistChange(selectedCaso.id, key, !!checked)}
                        />
                        <Label>
                          {key === 'documentosRecebidos' && 'Documentos recebidos'}
                          {key === 'informacoesMinimas' && 'Informações mínimas (cidade/estado, datas, valor)'}
                          {key === 'orientacaoEnviada' && 'Orientação enviada'}
                          {key === 'encaminhadoAdvogado' && 'Encaminhado para advogado'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="notas" className="mt-4">
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 mb-3">
                    {(selectedCaso.case_messages ?? []).filter((m) => m.visibility === 'INTERNAL').map((m) => (
                      <div key={m.id} className="text-sm p-2 rounded bg-amber-500/10">
                        <div className="font-medium text-xs text-muted-foreground">{m.sender.name} · {format(new Date(m.createdAt), "dd/MM HH:mm", { locale: ptBR })}</div>
                        <p className="mt-1">{m.message}</p>
                      </div>
                    ))}
                    {(!selectedCaso.case_messages || selectedCaso.case_messages.filter((m) => m.visibility === 'INTERNAL').length === 0) && (
                      <p className="text-muted-foreground text-sm">Nenhuma nota interna.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea placeholder="Nota interna (só admin)..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} className="resize-none flex-1" />
                    <Button onClick={() => handleSendMessage(selectedCaso.id, true)} disabled={!noteText.trim() || isSendingMessage}><StickyNote className="h-4 w-4 mr-2" /> Adicionar</Button>
                  </div>
                </TabsContent>

                <TabsContent value="auditoria" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50"><th className="text-left p-2">Data</th><th className="text-left p-2">Ação</th><th className="text-left p-2">Quem</th><th className="text-left p-2">Severidade</th></tr></thead>
                      <tbody>
                        {auditLogs.map((l) => (
                          <tr key={l.id} className="border-b">
                            <td className="p-2">{format(new Date(l.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                            <td className="p-2">{l.action}</td>
                            <td className="p-2">{l.actorName}</td>
                            <td className="p-2"><Badge variant={l.severity === 'CRITICAL' ? 'destructive' : l.severity === 'WARNING' ? 'default' : 'secondary'}>{l.severity}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {auditLogs.length === 0 && <p className="p-4 text-muted-foreground text-sm">Nenhum log para este caso.</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Alocar caso (automático ou manual) */}
      <Dialog open={allocateDialogOpen} onOpenChange={(open) => { setAllocateDialogOpen(open); if (!open) setAllocateCasoId(null); setSelectedAdvogadoIds([]); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alocar caso</DialogTitle>
            <DialogDescription>
              Escolha alocação automática (sistema escolhe advogados) ou manual (você escolhe os advogados).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button
                variant={allocateMode === 'auto' ? 'default' : 'outline'}
                onClick={() => setAllocateMode('auto')}
              >
                Alocação automática
              </Button>
              <Button
                variant={allocateMode === 'manual' ? 'default' : 'outline'}
                onClick={() => {
                  setAllocateMode('manual')
                  if (advogadosOptions.length === 0) fetchAdvogadosForAllocate()
                }}
              >
                Alocação manual (escolher advogados)
              </Button>
            </div>

            {allocateMode === 'manual' && (
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {loadingAdvogados ? (
                  <p className="text-sm text-muted-foreground">Carregando advogados...</p>
                ) : advogadosOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum advogado aprovado encontrado.</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">Selecione um ou mais advogados:</p>
                    {advogadosOptions.map((adv) => (
                      <label key={adv.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedAdvogadoIds.includes(adv.id)}
                          onCheckedChange={() => toggleAdvogadoSelection(adv.id)}
                        />
                        <span className="text-sm font-medium">{adv.users.name}</span>
                        <span className="text-xs text-muted-foreground">OAB {adv.oab}</span>
                        <span className="text-xs text-muted-foreground truncate">{adv.users.email}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {allocateMode === 'auto' && (
                <Button onClick={handleAllocateAuto} disabled={isAllocating}>
                  {isAllocating ? 'Alocando...' : 'Alocar automaticamente'}
                </Button>
              )}
              {allocateMode === 'manual' && (
                <Button
                  onClick={handleAllocateManual}
                  disabled={isAllocating || selectedAdvogadoIds.length === 0}
                >
                  {isAllocating ? 'Alocando...' : `Alocar para ${selectedAdvogadoIds.length} advogado(s)`}
                </Button>
              )}
              <Button variant="outline" onClick={() => setAllocateDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Fechar caso */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caso</DialogTitle>
            <DialogDescription>Informe o motivo e o resumo. O cidadão pode ser notificado por e-mail.</DialogDescription>
          </DialogHeader>
          {selectedCaso && (
            <div className="space-y-4">
              <div>
                <Label>Motivo do fechamento</Label>
                <Select value={closeReason} onValueChange={setCloseReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(closeReasonLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resumo do fechamento</Label>
                <Textarea value={closeSummary} onChange={(e) => setCloseSummary(e.target.value)} placeholder="Resumo..." rows={3} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="notify" checked={notifyCitizen} onCheckedChange={(c) => setNotifyCitizen(!!c)} />
                <Label htmlFor="notify">Notificar cidadão por e-mail</Label>
              </div>
              <Button onClick={() => handleCloseCase(selectedCaso.id)} disabled={isClosingCase || !closeSummary.trim()}>
                {isClosingCase ? 'Fechando...' : 'Fechar caso'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
