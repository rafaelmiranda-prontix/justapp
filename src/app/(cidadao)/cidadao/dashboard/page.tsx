'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, FileText, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Caso {
  id: string
  titulo: string
  descricao: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  urgencia: 'BAIXA' | 'MEDIA' | 'ALTA'
  criadoEm: string
  especialidade: {
    nome: string
  } | null
  matches: Match[]
}

interface Match {
  id: string
  score: number
  status: 'PENDENTE' | 'VISUALIZADO' | 'ACEITO' | 'RECUSADO'
  criadoEm: string
  advogado: {
    nome: string
    foto: string | null
    user: {
      name: string
    }
  }
}

const statusColors = {
  PENDENTE: 'bg-yellow-500',
  EM_ANDAMENTO: 'bg-blue-500',
  CONCLUIDO: 'bg-green-500',
}

const statusLabels = {
  PENDENTE: 'Aguardando Match',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
}

const urgenciaColors = {
  BAIXA: 'bg-blue-500',
  MEDIA: 'bg-yellow-500',
  ALTA: 'bg-red-500',
}

const matchStatusLabels = {
  PENDENTE: 'Aguardando',
  VISUALIZADO: 'Visualizado',
  ACEITO: 'Aceito',
  RECUSADO: 'Recusado',
}

export default function CidadaoDashboardPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const activeCasos = casos.filter((c) => c.status !== 'CONCLUIDO')
  const completedCasos = casos.filter((c) => c.status === 'CONCLUIDO')
  const totalMatches = casos.reduce((acc, c) => acc + c.matches.length, 0)
  const acceptedMatches = casos.reduce(
    (acc, c) => acc + c.matches.filter((m) => m.status === 'ACEITO').length,
    0
  )

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
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{activeCasos.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Advogados Contatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{totalMatches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Aceitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{acceptedMatches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold">{completedCasos.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {activeCasos.map((caso) => (
                <Card key={caso.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{caso.titulo}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={`${statusColors[caso.status]} text-white`}
                          >
                            {statusLabels[caso.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(new Date(caso.criadoEm), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${urgenciaColors[caso.urgencia]}`} />
                        Urgência: {caso.urgencia}
                      </Badge>
                      {caso.especialidade && (
                        <Badge variant="outline">{caso.especialidade.nome}</Badge>
                      )}
                    </div>

                    {/* Descrição */}
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {caso.descricao}
                      </p>
                    </div>

                    {/* Matches */}
                    {caso.matches.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Advogados Contatados ({caso.matches.length}):
                        </p>
                        <div className="space-y-2">
                          {caso.matches.map((match) => (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={match.advogado.foto || undefined}
                                    alt={match.advogado.nome}
                                  />
                                  <AvatarFallback>
                                    {getInitials(match.advogado.nome)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{match.advogado.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {match.score}% compatibilidade
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={match.status === 'ACEITO' ? 'default' : 'secondary'}
                                >
                                  {matchStatusLabels[match.status]}
                                </Badge>
                                {match.status === 'ACEITO' && (
                                  <Button size="sm" asChild>
                                    <Link href={`/chat/${match.id}`}>
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Chat
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      {caso.matches.length === 0 && (
                        <Button asChild className="flex-1">
                          <Link href={`/buscar-advogados?casoId=${caso.id}`}>
                            Buscar Advogados
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/casos/${caso.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {completedCasos.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Casos Concluídos</h2>
            <div className="space-y-4">
              {completedCasos.map((caso) => (
                <Card key={caso.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{caso.titulo}</CardTitle>
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            Concluído
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild>
                      <Link href={`/casos/${caso.id}`}>Ver Detalhes</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
