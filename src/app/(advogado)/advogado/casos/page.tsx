'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Eye, Clock, MapPin, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMatchActions } from '@/hooks/use-match-actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Match {
  id: string
  score: number
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CONTRATADO' | 'EXPIRADO'
  enviadoEm: string
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

export default function CasosRecebidosPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { respondMatch, isLoading: isActing } = useMatchActions()
  const router = useRouter()

  useEffect(() => {
    fetchMatches()
  }, [])

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

  const handleRespond = async (matchId: string, accepted: boolean) => {
    const success = await respondMatch(matchId, accepted)
    if (success) {
      fetchMatches()
    }
  }

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

      return true
    })
  }, [matches, searchQuery, statusFilter])

  const renderMatchCard = (match: Match) => {
    // Se o match foi recusado, mostrar apenas ID e data
    if (match.status === 'RECUSADO') {
      return (
        <Card key={match.id} className="hover:shadow-lg transition-shadow opacity-75">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">Caso #{match.casos.id}</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {statusLabels[match.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Recusado {match.respondidoEm 
                      ? formatDistanceToNow(new Date(match.respondidoEm), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : 'recentemente'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              Informações do caso não estão mais disponíveis após a recusa.
            </p>
          </CardContent>
        </Card>
      )
    }

    // Renderização normal para outros status
    return (
      <Card key={match.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg line-clamp-1">
                  {match.casos.descricao?.substring(0, 60) + '...' || 'Caso sem descrição'}
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
                {match.casos.cidadaos?.cidade && (
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
            {match.casos.urgencia && (
              <Badge variant="outline" className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${urgenciaColors[match.casos.urgencia]}`} />
                Urgência: {match.casos.urgencia}
              </Badge>
            )}
            {match.casos.especialidades && (
              <Badge variant="outline">{match.casos.especialidades.nome}</Badge>
            )}
            <Badge variant="secondary" className="font-semibold">
              {match.score}% compatibilidade
            </Badge>
          </div>

          {/* Descrição do caso */}
          {match.casos.descricao && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição do caso:</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{match.casos.descricao}</p>
            </div>
          )}

          {/* Cliente */}
          {match.casos.cidadaos?.users?.name && (
            <div>
              <p className="text-sm font-medium">Cliente:</p>
              <p className="text-sm text-muted-foreground">{match.casos.cidadaos.users.name}</p>
            </div>
          )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {match.status === 'PENDENTE' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/advogado/casos/${match.casos.id}`)}
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
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Casos Recebidos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os casos que você recebeu
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'PENDENTE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDENTE')}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'ACEITO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ACEITO')}
              >
                Aceitos
              </Button>
              <Button
                variant={statusFilter === 'RECUSADO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('RECUSADO')}
              >
                Recusados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de casos */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum caso encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredMatches.map(renderMatchCard)}
        </div>
      )}
    </div>
  )
}
