'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Caso {
  id: string
  descricao: string
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'FECHADO' | 'CANCELADO'
  urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  createdAt: string
  updatedAt: string
  redistribuicoes: number
  especialidades: {
    id: string
    nome: string
  } | null
  cidadaos: {
    id: string
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
}

// Função auxiliar para verificar se caso está alocado
const isCasoAlocated = (caso: Caso): boolean => {
  return caso.matches.some(
    (match) => match.status === 'PENDENTE' || match.status === 'ACEITO'
  )
}

const statusColors = {
  ABERTO: 'bg-yellow-500',
  EM_ANDAMENTO: 'bg-blue-500',
  FECHADO: 'bg-green-500',
  CANCELADO: 'bg-gray-500',
}

const statusLabels = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

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
  const { toast } = useToast()

  const fetchCasos = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/casos?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setCasos(result.data)
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
  }, [searchQuery, statusFilter, toast])

  useEffect(() => {
    fetchCasos()
  }, [fetchCasos])

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

  const handleAllocate = async (casoId: string) => {
    if (!confirm('Tem certeza que deseja alocar este caso para advogados?')) {
      return
    }

    setIsAllocating(true)
    try {
      const res = await fetch(`/api/admin/casos/${casoId}/allocate`, {
        method: 'POST',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message || 'Caso alocado com sucesso',
        })
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

  const filteredCasos = useMemo(() => {
    return casos.filter((caso) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesDescricao = caso.descricao.toLowerCase().includes(query)
        const matchesCliente = caso.cidadaos.users.name.toLowerCase().includes(query)
        const matchesEmail = caso.cidadaos.users.email.toLowerCase().includes(query)
        if (!matchesDescricao && !matchesCliente && !matchesEmail) {
          return false
        }
      }
      return true
    })
  }, [casos, searchQuery])

  const stats = useMemo(() => {
    return {
      total: casos.length,
      abertos: casos.filter((c) => c.status === 'ABERTO').length,
      emAndamento: casos.filter((c) => c.status === 'EM_ANDAMENTO').length,
      fechados: casos.filter((c) => c.status === 'FECHADO').length,
      cancelados: casos.filter((c) => c.status === 'CANCELADO').length,
    }
  }, [casos])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Casos</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os casos da plataforma
        </p>
      </div>

      <AdminNav />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ABERTO">Aberto</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="FECHADO">Fechado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
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
      ) : filteredCasos.length === 0 ? (
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
          {filteredCasos.map((caso) => (
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
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>
                          {caso.matches.reduce((acc, match) => acc + (match.mensagens?.length || 0), 0)} mensagem(s)
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
                      {caso.matches.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{caso.matches.length} match(es)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                        onClick={() => handleAllocate(caso.id)}
                        disabled={isAllocating || caso.status !== 'ABERTO'}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Alocar
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
        </div>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Caso</DialogTitle>
            <DialogDescription>
              Informações completas do caso e histórico
            </DialogDescription>
          </DialogHeader>

          {selectedCaso && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div>
                <h3 className="font-semibold mb-3">Informações do Caso</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status de Alocação:</span>
                    {isCasoAlocated(selectedCaso) ? (
                      <Badge variant="default" className="bg-green-600">
                        Alocado ({selectedCaso.matches.filter(m => m.status === 'PENDENTE' || m.status === 'ACEITO').length} match(es) ativo(s))
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-400 text-gray-600">
                        Não Alocado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge className={`${statusColors[selectedCaso.status]} text-white`}>
                      {statusLabels[selectedCaso.status]}
                    </Badge>
                    <Select
                      value={selectedCaso.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(selectedCaso.id, value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-48 ml-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABERTO">Aberto</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="FECHADO">Fechado</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="font-medium">Urgência:</span>{' '}
                    <Badge
                      variant="outline"
                      className={`${urgenciaColors[selectedCaso.urgencia]} text-white border-0`}
                    >
                      {urgenciaLabels[selectedCaso.urgencia]}
                    </Badge>
                  </div>
                  {selectedCaso.especialidades && (
                    <div>
                      <span className="font-medium">Especialidade:</span>{' '}
                      {selectedCaso.especialidades.nome}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p className="mt-1 text-muted-foreground">{selectedCaso.descricao}</p>
                  </div>
                  <div>
                    <span className="font-medium">Criado em:</span>{' '}
                    {format(new Date(selectedCaso.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Redistribuições:</span>{' '}
                    {selectedCaso.redistribuicoes}
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="font-semibold mb-3">Cliente</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Nome:</span> {selectedCaso.cidadaos.users.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{' '}
                    {selectedCaso.cidadaos.users.email}
                  </div>
                </div>
              </div>

              {/* Ações de Alocação */}
              <div className="flex gap-2 pt-4 border-t">
                {isCasoAlocated(selectedCaso) ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeallocate(selectedCaso.id)}
                    disabled={isDeallocating || selectedCaso.status !== 'ABERTO'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isDeallocating ? 'Dealocando...' : 'Dealocar Caso'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => handleAllocate(selectedCaso.id)}
                    disabled={isAllocating || selectedCaso.status !== 'ABERTO'}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isAllocating ? 'Alocando...' : 'Alocar Caso'}
                  </Button>
                )}
              </div>

              {/* Matches */}
              {selectedCaso.matches && selectedCaso.matches.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Matches ({selectedCaso.matches.length})</h3>
                  <div className="space-y-2">
                    {selectedCaso.matches.map((match) => (
                      <Card key={match.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {match.advogados.users.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.advogados.users.email}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  match.status === 'ACEITO' || match.status === 'CONTRATADO'
                                    ? 'default'
                                    : match.status === 'RECUSADO'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {match.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                Score: {match.score}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
