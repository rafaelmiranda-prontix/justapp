'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Plus, FileText, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { CasoStats } from '@/components/cidadao/caso-stats'
import { CasoFilters } from '@/components/cidadao/caso-filters'

interface Caso {
  id: string
  descricao: string
  descricaoIA?: string | null
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'FECHADO' | 'CANCELADO'
  urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  createdAt: string
  especialidades: {
    nome: string
  } | null
  matches: Match[]
}

interface Match {
  id: string
  score: number
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CONTRATADO' | 'EXPIRADO'
  advogados: {
    users: {
      name: string
    }
  }
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

export default function MeusCasosPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [especialidadeFilter, setEspecialidadeFilter] = useState('all')

  useEffect(() => {
    fetchCasos()
  }, [])

  const fetchCasos = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/casos')
      const result = await res.json()

      if (result.success) {
        setCasos(result.data)
      }
    } catch (error) {
      console.error('Error fetching casos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtros e busca
  const especialidades = useMemo(() => {
    const unique = new Set<string>()
    casos.forEach((c) => {
      if (c.especialidades?.nome) {
        unique.add(c.especialidades.nome)
      }
    })
    return Array.from(unique)
  }, [casos])

  const filteredCasos = useMemo(() => {
    return casos.filter((caso) => {
      // Busca por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesDescricao = caso.descricao.toLowerCase().includes(query)
        if (!matchesDescricao) {
          return false
        }
      }

      // Filtro por status
      if (statusFilter !== 'all' && caso.status !== statusFilter) {
        return false
      }

      // Filtro por especialidade
      if (
        especialidadeFilter !== 'all' &&
        caso.especialidades?.nome !== especialidadeFilter
      ) {
        return false
      }

      return true
    })
  }, [casos, searchQuery, statusFilter, especialidadeFilter])

  const activeCasos = filteredCasos.filter((c) => c.status !== 'FECHADO' && c.status !== 'CANCELADO')
  const completedCasos = filteredCasos.filter((c) => c.status === 'FECHADO')

  const getAcceptedMatch = (caso: Caso) => {
    return caso.matches.find((m) => m.status === 'ACEITO' || m.status === 'CONTRATADO')
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Casos</h1>
          <p className="text-muted-foreground">Acompanhe o andamento dos seus casos jurídicos</p>
        </div>
        <Button asChild>
          <Link href="/novo-caso">
            <Plus className="h-4 w-4 mr-2" />
            Novo Caso
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <CasoStats />

      {/* Filtros */}
      <CasoFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        especialidadeFilter={especialidadeFilter}
        onEspecialidadeFilterChange={setEspecialidadeFilter}
        especialidades={especialidades}
      />

      {/* Lista de Casos */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Casos Ativos</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          ) : activeCasos.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Você ainda não tem casos ativos</p>
                <Button asChild>
                  <Link href="/novo-caso">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Caso
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeCasos.map((caso) => {
                const acceptedMatch = getAcceptedMatch(caso)
                return (
                  <Card key={caso.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{caso.descricao.substring(0, 80)}...</CardTitle>
                            <Badge
                              className={`${statusColors[caso.status]} text-white`}
                            >
                              {statusLabels[caso.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDistanceToNow(new Date(caso.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {caso.especialidades && (
                              <Badge variant="outline">{caso.especialidades.nome}</Badge>
                            )}
                            <Badge variant="outline" className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${urgenciaColors[caso.urgencia]}`} />
                              {caso.urgencia}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {caso.descricao}
                      </p>
                      {acceptedMatch && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              Advogado: {acceptedMatch.advogados.users.name}
                            </span>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/chat/${acceptedMatch.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Abrir Chat
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {completedCasos.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Casos Concluídos</h2>
            <div className="space-y-4">
              {completedCasos.map((caso) => {
                const acceptedMatch = getAcceptedMatch(caso)
                return (
                  <Card key={caso.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{caso.descricao.substring(0, 80)}...</CardTitle>
                            <Badge
                              className={`${statusColors[caso.status]} text-white`}
                            >
                              {statusLabels[caso.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDistanceToNow(new Date(caso.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {caso.especialidades && (
                              <Badge variant="outline">{caso.especialidades.nome}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {acceptedMatch && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              Advogado: {acceptedMatch.advogados.users.name}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/casos/${caso.id}/avaliar?matchId=${acceptedMatch.id}`}>
                              Avaliar
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
