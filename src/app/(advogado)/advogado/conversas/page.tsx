'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { MessageSquare, Search, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Conversation {
  id: string
  status: string
  casos: {
    id: string
    descricao: string
    cidadaos: {
      users: {
        name: string
        image: string | null
      }
    }
  }
  mensagens: Array<{
    id: string
    conteudo: string
    createdAt: string
    remetenteId: string
  }>
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/matches')
      const result = await res.json()

      if (result.success) {
        // Filtrar apenas matches aceitos (que têm conversas ativas)
        const activeMatches = result.data.filter(
          (m: any) => m.status === 'ACEITO' || m.status === 'CONTRATADO'
        )
        setConversations(activeMatches)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesDescricao = conv.casos.descricao.toLowerCase().includes(query)
      const matchesCliente = conv.casos.cidadaos.users.name.toLowerCase().includes(query)
      return matchesDescricao || matchesCliente
    }
    return true
  })

  const getLastMessage = (conv: Conversation) => {
    if (conv.mensagens && conv.mensagens.length > 0) {
      const lastMsg = conv.mensagens[conv.mensagens.length - 1]
      return {
        content: lastMsg.conteudo,
        time: lastMsg.createdAt,
      }
    }
    return null
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conversas</h1>
        <p className="text-muted-foreground">
          Gerencie suas conversas com clientes
        </p>
      </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de conversas */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conv) => {
            const lastMessage = getLastMessage(conv)
            return (
              <Card key={conv.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {conv.casos.cidadaos.users.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {conv.casos.cidadaos.users.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {conv.casos.descricao}
                          </p>
                        </div>
                        <Badge variant="secondary">Ativa</Badge>
                      </div>
                      {lastMessage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <p className="line-clamp-1 flex-1">{lastMessage.content}</p>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lastMessage.time), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button asChild>
                      <Link href={`/advogado/chat/${conv.id}`}>Abrir</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
