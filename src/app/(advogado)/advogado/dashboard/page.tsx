'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Eye, AlertCircle, Clock, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMatchActions } from '@/hooks/use-match-actions'
import { LeadStats } from '@/components/advogado/lead-stats'
import { LeadFilters } from '@/components/advogado/lead-filters'
import Link from 'next/link'

interface Match {
  id: string
  score: number
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CONTRATADO' | 'EXPIRADO'
  enviadoEm: string
  visualizadoEm: string | null
  respondidoEm: string | null
  casos: {
    id: string
    descricao: string
    urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
    especialidades: {
      nome: string
    } | null
    cidadaos: {
      users: {
        name: string
      }
      cidade: string | null
      estado: string | null
    }
  }
}

const urgenciaColors = {
  BAIXA: 'bg-blue-500',
  NORMAL: 'bg-yellow-500',
  ALTA: 'bg-orange-500',
  URGENTE: 'bg-red-500',
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Novo',
  ACEITO: 'Aceito',
  RECUSADO: 'Recusado',
  CONTRATADO: 'Contratado',
  EXPIRADO: 'Expirado',
}

export default function AdvogadoDashboardPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pendentes')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [especialidadeFilter, setEspecialidadeFilter] = useState('all')
  const [urgenciaFilter, setUrgenciaFilter] = useState('all')
  const { respondMatch, isLoading: isActing } = useMatchActions()

  useEffect(() => {
    fetchMatches()
    redistributeCases()
  }, [])

  const redistributeCases = async () => {
    try {
      // Tentar redistribuir casos órfãos em background
      await fetch('/api/advogado/redistribute-cases', {
        method: 'POST',
      })
    } catch (error) {
      // Erro silencioso - não afetar a experiência do usuário
      console.log('Background redistribution failed:', error)
    }
  }

  const fetchMatches = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/matches')
      const result = await res.json()

      if (result.success) {
        setMatches(result.data)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (matchId: string) => {
    // TODO: Implementar modal ou página de detalhes do caso
    // Por enquanto, apenas log para evoluções futuras
    console.log('Ver detalhes do match:', matchId)
  }

  const handleRespond = async (matchId: string, accepted: boolean) => {
    const success = await respondMatch(matchId, accepted)
    if (success) {
      fetchMatches()
    }
  }

  // Filtros e busca
  const especialidades = useMemo(() => {
    const unique = new Set<string>()
    matches.forEach((m) => {
      if (m.casos.especialidades?.nome) {
        unique.add(m.casos.especialidades.nome)
      }
    })
    return Array.from(unique)
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Busca por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesDescricao = match.casos.descricao.toLowerCase().includes(query)
        const matchesCliente = match.casos.cidadaos.users.name.toLowerCase().includes(query)
        if (!matchesDescricao && !matchesCliente) {
          return false
        }
      }

      // Filtro por status
      if (statusFilter !== 'all' && match.status !== statusFilter) {
        return false
      }

      // Filtro por especialidade
      if (
        especialidadeFilter !== 'all' &&
        match.casos.especialidades?.nome !== especialidadeFilter
      ) {
        return false
      }

      // Filtro por urgência
      if (urgenciaFilter !== 'all' && match.casos.urgencia !== urgenciaFilter) {
        return false
      }

      return true
    })
  }, [matches, searchQuery, statusFilter, especialidadeFilter, urgenciaFilter])

  const pendingMatches = filteredMatches.filter((m) => m.status === 'PENDENTE')
  const acceptedMatches = filteredMatches.filter((m) => m.status === 'ACEITO')
  const rejectedMatches = filteredMatches.filter((m) => m.status === 'RECUSADO')

  const renderMatchCard = (match: Match) => (
    <Card key={match.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg line-clamp-1">
                {match.casos.descricao.substring(0, 60) + '...'}
              </CardTitle>
              <Badge
                variant={match.status === 'ACEITO' ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {statusLabels[match.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(match.enviadoEm), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
              {match.casos.cidadaos.cidade && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {match.casos.cidadaos.cidade}, {match.casos.cidadaos.estado}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges de informação */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${urgenciaColors[match.casos.urgencia]}`} />
            Urgência: {match.casos.urgencia}
          </Badge>
          {match.casos.especialidades && (
            <Badge variant="outline">{match.casos.especialidades.nome}</Badge>
          )}
          <Badge variant="secondary" className="font-semibold">
            {match.score}% compatibilidade
          </Badge>
        </div>

        {/* Descrição do caso */}
        <div>
          <p className="text-sm font-medium mb-1">Descrição do caso:</p>
          <p className="text-sm text-muted-foreground line-clamp-3">{match.casos.descricao}</p>
        </div>

        {/* Cliente */}
        <div>
          <p className="text-sm font-medium">Cliente:</p>
          <p className="text-sm text-muted-foreground">{match.casos.cidadaos.users.name}</p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {match.status === 'PENDENTE' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(match.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(match.id, true)}
                disabled={isActing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRespond(match.id, false)}
                disabled={isActing}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Recusar
              </Button>
            </>
          )}
          {match.status === 'ACEITO' && (
            <Button size="sm" asChild className="w-full">
              <Link href={`/advogado/chat/${match.id}`}>Abrir Chat</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Leads</h1>
        <p className="text-muted-foreground">
          Gerencie suas oportunidades de atendimento e casos em andamento
        </p>
      </div>

      {/* Estatísticas */}
      <LeadStats />

      {/* Filtros */}
      <LeadFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        especialidadeFilter={especialidadeFilter}
        onEspecialidadeFilterChange={setEspecialidadeFilter}
        urgenciaFilter={urgenciaFilter}
        onUrgenciaFilterChange={setUrgenciaFilter}
        especialidades={especialidades}
      />

      {/* Tabs de Leads */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendentes">
            Pendentes ({pendingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="aceitos">
            Aceitos ({acceptedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="recusados">
            Recusados ({rejectedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          ) : pendingMatches.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum lead pendente no momento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pendingMatches.map(renderMatchCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aceitos" className="mt-6">
          {acceptedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum caso aceito ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {acceptedMatches.map(renderMatchCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recusados" className="mt-6">
          {rejectedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum caso recusado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {rejectedMatches.map(renderMatchCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
