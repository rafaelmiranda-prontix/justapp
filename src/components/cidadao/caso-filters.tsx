'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CasoFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  especialidadeFilter: string
  onEspecialidadeFilterChange: (value: string) => void
  especialidades: string[]
}

export function CasoFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  especialidadeFilter,
  onEspecialidadeFilterChange,
  especialidades,
}: CasoFiltersProps) {
  const hasFilters = statusFilter !== 'all' || especialidadeFilter !== 'all' || searchQuery

  const clearFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onEspecialidadeFilterChange('all')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar casos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="ABERTO">Aberto</SelectItem>
          <SelectItem value="EM_MEDIACAO">Em atendimento</SelectItem>
          <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
          <SelectItem value="FECHADO">Fechado</SelectItem>
          <SelectItem value="CANCELADO">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      {especialidades.length > 0 && (
        <Select value={especialidadeFilter} onValueChange={onEspecialidadeFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas especialidades</SelectItem>
            {especialidades.map((esp) => (
              <SelectItem key={esp} value={esp}>
                {esp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  )
}
