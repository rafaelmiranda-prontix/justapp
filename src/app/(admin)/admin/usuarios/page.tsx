'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Search, Users, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: 'CIDADAO' | 'ADVOGADO' | 'ADMIN'
  createdAt: string
  cidadao: {
    id: string
    cidade: string | null
    estado: string | null
  } | null
  advogado: {
    id: string
    oab: string
    oabVerificado: boolean
    cidade: string
    estado: string
  } | null
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 300) // Debounce

    return () => clearTimeout(timeoutId)
  }, [roleFilter, searchQuery])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      CIDADAO: 'bg-blue-500',
      ADVOGADO: 'bg-green-500',
      ADMIN: 'bg-purple-500',
    }
    return (
      <Badge className={variants[role as keyof typeof variants] || 'bg-gray-500'}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="CIDADAO">Cidadãos</SelectItem>
              <SelectItem value="ADVOGADO">Advogados</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Cadastrado em: {formatDate(user.createdAt)}</span>
                        {user.cidadao && (
                          <span>
                            {user.cidadao.cidade || 'N/A'}, {user.cidadao.estado || 'N/A'}
                          </span>
                        )}
                        {user.advogado && (
                          <span>
                            OAB: {user.advogado.oab} - {user.advogado.cidade},{' '}
                            {user.advogado.estado}
                            {user.advogado.oabVerificado && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Verificado
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
