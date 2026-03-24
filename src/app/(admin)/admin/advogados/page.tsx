'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdvogadoModerationCard } from '@/components/admin/advogado-moderation-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, LayoutGrid, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Advogado {
  id: string
  oab: string
  oabVerificado: boolean
  aprovado: boolean
  preAprovado: boolean
  onboardingCompleted: boolean
  plano: string
  planoExpira: string | null
  cidade: string
  estado: string
  createdAt: string
  users: {
    id: string
    name: string
    email: string
    phone?: string | null
    status: string
  }
  especialidades: Array<{
    especialidade: {
      nome: string
    }
  }>
  avaliacaoMedia: number
  totalAvaliacoes: number
}

export default function AdminAdvogadosPage() {
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pendentes')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const { toast } = useToast()

  const VIEW_MODE_STORAGE_KEY = 'admin-advogados-view-mode'

  const fetchAdvogados = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/advogados?status=${statusFilter}`)
      const result = await res.json()

      if (result.success) {
        setAdvogados(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar advogados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar advogados',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchAdvogados()
  }, [fetchAdvogados])

  useEffect(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    if (savedViewMode === 'cards' || savedViewMode === 'list') {
      setViewMode(savedViewMode)
    }
  }, [])

  const handleChangeViewMode = (mode: 'cards' | 'list') => {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }

  const renderStatusBadge = (advogado: Advogado) => {
    if (advogado.aprovado) {
      return <Badge className="bg-green-500">Aprovado</Badge>
    }

    if (advogado.preAprovado) {
      return <Badge className="bg-blue-500 text-white">Pré-aprovado</Badge>
    }

    return <Badge className="bg-yellow-500 text-white">Pendente</Badge>
  }

  const handleApprove = async (advogadoId: string) => {
    try {
      const res = await fetch(`/api/admin/advogados/${advogadoId}/approve`, {
        method: 'POST',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Advogado aprovado com sucesso',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao aprovar advogado',
        variant: 'destructive',
      })
    }
  }

  const handlePreApprove = async (advogadoId: string) => {
    try {
      const res = await fetch(`/api/admin/advogados/${advogadoId}/pre-approve`, {
        method: 'POST',
      })
      const result = await res.json()
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Advogado pré-aprovado. Envie a mensagem e confirme para liberar.',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao pré-aprovar',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (advogadoId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este advogado?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/advogados/${advogadoId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'Rejeitado pelo administrador' }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Advogado rejeitado',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao rejeitar advogado',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteOnboarding = async (advogadoId: string) => {
    try {
      const res = await fetch(
        `/api/admin/advogados/${advogadoId}/complete-onboarding`,
        {
          method: 'POST',
        }
      )

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message || 'Onboarding completado com sucesso',
        })
        fetchAdvogados()
      } else {
        if (result.missingFields && result.missingFields.length > 0) {
          toast({
            title: 'Não é possível completar',
            description: `Campos faltando: ${result.missingFields.join(', ')}`,
            variant: 'destructive',
          })
        } else {
          throw new Error(result.error || 'Erro ao completar onboarding')
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao completar onboarding',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePlan = async (advogadoId: string, plano: string) => {
    try {
      const res = await fetch(
        `/api/admin/advogados/${advogadoId}/update-plan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plano }),
        }
      )

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message || 'Plano atualizado com sucesso',
        })
        fetchAdvogados()
      } else {
        throw new Error(result.error || 'Erro ao atualizar plano')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao atualizar plano',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Advogados</h1>
        <p className="text-muted-foreground">
          Aprove, rejeite ou suspenda advogados da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        <div className="flex items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="pre_aprovados">Pré-aprovados</SelectItem>
              <SelectItem value="aprovados">Aprovados</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center rounded-md border p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleChangeViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleChangeViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px]" />
            ))}
          </div>
        ) : advogados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum advogado encontrado com os filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid md:grid-cols-2 gap-4">
            {advogados.map((advogado) => (
              <AdvogadoModerationCard
                key={advogado.id}
                advogado={advogado}
                onApprove={() => handleApprove(advogado.id)}
                onPreApprove={() => handlePreApprove(advogado.id)}
                onReject={() => handleReject(advogado.id)}
                onCompleteOnboarding={() => handleCompleteOnboarding(advogado.id)}
                onUpdatePlan={(plano) => handleUpdatePlan(advogado.id, plano)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advogados.map((advogado) => (
                    <TableRow key={advogado.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="font-medium">{advogado.users.name}</div>
                          <AdvogadoModerationCard
                            advogado={advogado}
                            onApprove={() => handleApprove(advogado.id)}
                            onPreApprove={() => handlePreApprove(advogado.id)}
                            onReject={() => handleReject(advogado.id)}
                            onCompleteOnboarding={() => handleCompleteOnboarding(advogado.id)}
                            onUpdatePlan={(plano) => handleUpdatePlan(advogado.id, plano)}
                            renderCompactDetailButton
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">OAB {advogado.oab}</div>
                      </TableCell>
                      <TableCell>{advogado.users.email}</TableCell>
                      <TableCell>
                        {advogado.cidade}, {advogado.estado}
                      </TableCell>
                      <TableCell>{renderStatusBadge(advogado)}</TableCell>
                      <TableCell>
                        {advogado.onboardingCompleted ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Completo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            Incompleto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{advogado.plano || 'FREE'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!advogado.aprovado && !advogado.preAprovado && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePreApprove(advogado.id)}
                            >
                              Pré-aprovar
                            </Button>
                          )}
                          {!advogado.aprovado && (
                            <Button size="sm" onClick={() => handleApprove(advogado.id)}>
                              Aprovar
                            </Button>
                          )}
                          {!advogado.onboardingCompleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteOnboarding(advogado.id)}
                            >
                              Completar onboarding
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={advogado.aprovado ? 'outline' : 'destructive'}
                            onClick={() => handleReject(advogado.id)}
                          >
                            {advogado.aprovado ? 'Revogar' : 'Rejeitar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
