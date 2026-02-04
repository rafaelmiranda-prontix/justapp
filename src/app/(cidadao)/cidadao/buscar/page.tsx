'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdvogadoCard } from '@/components/advogado/advogado-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Advogado {
  id: string
  nome: string
  foto: string | null
  bio: string | null
  cidade: string
  estado: string
  especialidades: string[]
  precoConsulta: number | null
  aceitaOnline: boolean
  avaliacaoMedia: number
  totalAvaliacoes: number
  distanciaKm: number | null
  score: number
  matchId?: string
  casoId?: string
}

export default function BuscarAdvogadosPage() {
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAdvogados()
  }, [])

  const fetchAdvogados = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/cidadao/advogados')
      const result = await res.json()

      if (result.success) {
        setAdvogados(result.data)
      }
    } catch (error) {
      console.error('Error fetching advogados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAdvogados = advogados.filter((advogado) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesNome = advogado.nome.toLowerCase().includes(query)
      const matchesEspecialidade = advogado.especialidades.some((esp) =>
        esp.toLowerCase().includes(query)
      )
      return matchesNome || matchesEspecialidade
    }
    return true
  })

  return (
    <div className="container max-w-6xl py-8">
      <Link
        href="/cidadao/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advogados que Atendi</h1>
        <p className="text-muted-foreground">
          Advogados com quem você já interagiu e pode entrar em contato novamente
        </p>
      </div>

      {/* Busca */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Advogados */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredAdvogados.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {advogados.length === 0
              ? 'Nenhum advogado encontrado'
              : 'Nenhum advogado corresponde à busca'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {advogados.length === 0
              ? 'Você ainda não interagiu com nenhum advogado. Crie um caso para começar!'
              : 'Tente ajustar os termos de busca'}
          </p>
          {advogados.length === 0 && (
            <Button asChild>
              <Link href="/novo-caso">Criar Caso</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredAdvogados.map((advogado) => (
            <AdvogadoCard
              key={advogado.id}
              {...advogado}
              casoId={advogado.casoId}
              matchId={advogado.matchId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
