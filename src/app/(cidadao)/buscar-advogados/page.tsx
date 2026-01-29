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
}

export default function BuscarAdvogadosPage() {
  const searchParams = useSearchParams()
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [casoId, setCasoId] = useState<string | undefined>()
  const [filters, setFilters] = useState({
    especialidade: searchParams.get('especialidade') || 'Direito do Consumidor',
    cidade: searchParams.get('cidade') || 'Rio de Janeiro',
  })

  useEffect(() => {
    fetchAdvogados()
    fetchActiveCaso()
  }, [])

  const fetchActiveCaso = async () => {
    try {
      const res = await fetch('/api/casos/active')
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setCasoId(result.data.id)
        }
      }
    } catch (error) {
      console.error('Error fetching active caso:', error)
    }
  }

  const fetchAdvogados = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/advogados/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especialidade: filters.especialidade,
          cidade: filters.cidade,
          limit: 20,
        }),
      })

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAdvogados()
  }

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
        <h1 className="text-3xl font-bold mb-2">Encontre seu advogado</h1>
        <p className="text-muted-foreground">
          {advogados.length > 0
            ? `Encontramos ${advogados.length} advogados compatíveis com seu caso`
            : 'Buscando advogados compatíveis...'}
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleSearch} className="mb-8 p-6 bg-muted/50 rounded-lg">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              value={filters.especialidade}
              onChange={(e) => setFilters({ ...filters, especialidade: e.target.value })}
              placeholder="Ex: Direito do Consumidor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={filters.cidade}
              onChange={(e) => setFilters({ ...filters, cidade: e.target.value })}
              placeholder="Ex: Rio de Janeiro"
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </form>

      {/* Lista de Advogados */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ))}
        </div>
      ) : advogados.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum advogado encontrado</h3>
          <p className="text-muted-foreground mb-6">
            Tente ajustar os filtros ou expandir a área de busca
          </p>
          <Button onClick={fetchAdvogados}>Tentar novamente</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {advogados.map((advogado) => (
            <AdvogadoCard key={advogado.id} {...advogado} casoId={casoId} />
          ))}
        </div>
      )}
    </div>
  )
}
