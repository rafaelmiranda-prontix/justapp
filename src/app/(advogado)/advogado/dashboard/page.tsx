'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Eye, AlertCircle, Clock, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMatchActions } from '@/hooks/use-match-actions'
import Link from 'next/link'

interface Match {
  id: string
  score: number
  status: 'PENDENTE' | 'VISUALIZADO' | 'ACEITO' | 'RECUSADO'
  criadoEm: string
  visualizadoEm: string | null
  respondidoEm: string | null
  caso: {
    id: string
    titulo: string
    descricao: string
    urgencia: 'BAIXA' | 'MEDIA' | 'ALTA'
    especialidade: {
      nome: string
    } | null
    cidadao: {
      user: {
        name: string
      }
      cidade: string | null
      estado: string | null
    }
  }
}

const urgenciaColors = {
  BAIXA: 'bg-blue-500',
  MEDIA: 'bg-yellow-500',
  ALTA: 'bg-red-500',
}

const statusLabels = {
  PENDENTE: 'Novo',
  VISUALIZADO: 'Visualizado',
  ACEITO: 'Aceito',
  RECUSADO: 'Recusado',
}

export default function AdvogadoDashboardPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pendentes')
  const { visualizeMatch, respondMatch, isLoading: isActing } = useMatchActions()

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

  const handleVisualize = async (matchId: string) => {
    const success = await visualizeMatch(matchId)
    if (success) {
      fetchMatches()
    }
  }

  const handleRespond = async (matchId: string, accepted: boolean) => {
    const success = await respondMatch(matchId, accepted)
    if (success) {
      fetchMatches()
    }
  }

  const pendingMatches = matches.filter((m) => m.status === 'PENDENTE')
  const visualizedMatches = matches.filter((m) => m.status === 'VISUALIZADO')
  const acceptedMatches = matches.filter((m) => m.status === 'ACEITO')
  const rejectedMatches = matches.filter((m) => m.status === 'RECUSADO')

  const renderMatchCard = (match: Match) => (
    <Card key={match.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{match.caso.titulo}</CardTitle>
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
                {formatDistanceToNow(new Date(match.criadoEm), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
              {match.caso.cidadao.cidade && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {match.caso.cidadao.cidade}, {match.caso.cidadao.estado}
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
            <div className={`h-2 w-2 rounded-full ${urgenciaColors[match.caso.urgencia]}`} />
            Urgência: {match.caso.urgencia}
          </Badge>
          {match.caso.especialidade && (
            <Badge variant="outline">{match.caso.especialidade.nome}</Badge>
          )}
          <Badge variant="secondary" className="font-semibold">
            {match.score}% compatibilidade
          </Badge>
        </div>

        {/* Descrição do caso */}
        <div>
          <p className="text-sm font-medium mb-1">Descrição do caso:</p>
          <p className="text-sm text-muted-foreground line-clamp-3">{match.caso.descricao}</p>
        </div>

        {/* Cliente */}
        <div>
          <p className="text-sm font-medium">Cliente:</p>
          <p className="text-sm text-muted-foreground">{match.caso.cidadao.user.name}</p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {match.status === 'PENDENTE' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVisualize(match.id)}
                disabled={isActing}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
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
          {match.status === 'VISUALIZADO' && (
            <>
              <Button
                size="sm"
                onClick={() => handleRespond(match.id, true)}
                disabled={isActing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceitar Caso
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRespond(match.id, false)}
                disabled={isActing}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Recusar Caso
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
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{pendingMatches.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visualizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{visualizedMatches.length}</span>
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
              <span className="text-2xl font-bold">{acceptedMatches.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recusados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{rejectedMatches.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Leads */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendentes">
            Pendentes ({pendingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="visualizados">
            Visualizados ({visualizedMatches.length})
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

        <TabsContent value="visualizados" className="mt-6">
          {visualizedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum lead visualizado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {visualizedMatches.map(renderMatchCard)}
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
