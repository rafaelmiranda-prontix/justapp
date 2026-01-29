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

interface LeadFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  especialidadeFilter: string
  onEspecialidadeFilterChange: (value: string) => void
  urgenciaFilter: string
  onUrgenciaFilterChange: (value: string) => void
  especialidades: string[]
}

export function LeadFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  especialidadeFilter,
  onEspecialidadeFilterChange,
  urgenciaFilter,
  onUrgenciaFilterChange,
  especialidades,
}: LeadFiltersProps) {
  const hasFilters =
    statusFilter !== 'all' ||
    especialidadeFilter !== 'all' ||
    urgenciaFilter !== 'all' ||
    searchQuery

  const clearFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onEspecialidadeFilterChange('all')
    onUrgenciaFilterChange('all')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar leads por cliente ou descrição..."
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
          <SelectItem value="PENDENTE">Pendente</SelectItem>
          <SelectItem value="VISUALIZADO">Visualizado</SelectItem>
          <SelectItem value="ACEITO">Aceito</SelectItem>
          <SelectItem value="RECUSADO">Recusado</SelectItem>
          <SelectItem value="CONTRATADO">Contratado</SelectItem>
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

      <Select value={urgenciaFilter} onValueChange={onUrgenciaFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Urgência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas urgências</SelectItem>
          <SelectItem value="BAIXA">Baixa</SelectItem>
          <SelectItem value="NORMAL">Normal</SelectItem>
          <SelectItem value="ALTA">Alta</SelectItem>
          <SelectItem value="URGENTE">Urgente</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  )
}
