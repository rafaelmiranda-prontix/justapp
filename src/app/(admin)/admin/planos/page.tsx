'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminNav } from '@/components/admin/admin-nav'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Plano {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  preco: number
  precoDisplay: number
  leadsPerMonth: number
  leadsPerHour: number
  features: string[]
  stripePriceId: string | null
  ativo: boolean
  status: string
  ordem: number
  createdAt: string
  updatedAt: string
  _count?: {
    historicoAssinaturas: number
  }
}

export default function AdminPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    codigo: 'FREE' as 'FREE' | 'BASIC' | 'PREMIUM' | 'UNLIMITED',
    nome: '',
    descricao: '',
    preco: 0,
    precoDisplay: 0,
    leadsPerMonth: 0,
    leadsPerHour: 5,
    features: [] as string[],
    stripePriceId: '',
    ativo: true,
    status: 'ACTIVE' as 'ACTIVE' | 'COMING_SOON' | 'HIDDEN',
    ordem: 0,
  })

  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchPlanos()
  }, [])

  const fetchPlanos = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/planos?includeInactive=true')
      const result = await res.json()

      if (result.success) {
        setPlanos(result.data)
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao buscar planos',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar planos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (plano?: Plano) => {
    if (plano) {
      setEditingPlano(plano)
      setFormData({
        codigo: plano.codigo as 'FREE' | 'BASIC' | 'PREMIUM' | 'UNLIMITED',
        nome: plano.nome,
        descricao: plano.descricao || '',
        preco: plano.preco / 100, // Converter de centavos para reais
        precoDisplay: plano.precoDisplay / 100, // Converter de centavos para reais
        leadsPerMonth: plano.leadsPerMonth,
        leadsPerHour: plano.leadsPerHour,
        features: plano.features,
        stripePriceId: plano.stripePriceId || '',
        ativo: plano.ativo,
        status: plano.status as 'ACTIVE' | 'COMING_SOON' | 'HIDDEN',
        ordem: plano.ordem,
      })
    } else {
      setEditingPlano(null)
      setFormData({
        codigo: 'FREE',
        nome: '',
        descricao: '',
        preco: 0,
        precoDisplay: 0,
        leadsPerMonth: 0,
        leadsPerHour: 5,
        features: [],
        stripePriceId: '',
        ativo: true,
        status: 'ACTIVE',
        ordem: 0,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPlano(null)
    setNewFeature('')
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingPlano
        ? `/api/admin/planos/${editingPlano.id}`
        : '/api/admin/planos'

      const method = editingPlano ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        preco: Math.round(formData.preco * 100), // Converter para centavos
        precoDisplay: Math.round(formData.precoDisplay * 100), // Converter para centavos
        stripePriceId: formData.stripePriceId || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: editingPlano
            ? 'Plano atualizado com sucesso'
            : 'Plano criado com sucesso',
        })
        handleCloseDialog()
        fetchPlanos()
      } else {
        throw new Error(result.error || 'Erro ao salvar plano')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar plano',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (plano: Plano) => {
    if (!confirm(`Tem certeza que deseja desativar o plano "${plano.nome}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/planos/${plano.id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Plano desativado com sucesso',
        })
        fetchPlanos()
      } else {
        throw new Error(result.error || 'Erro ao desativar plano')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao desativar plano',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (plano: Plano) => {
    try {
      const res = await fetch(`/api/admin/planos/${plano.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !plano.ativo }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: plano.ativo ? 'Plano desativado' : 'Plano ativado',
        })
        fetchPlanos()
      } else {
        throw new Error(result.error || 'Erro ao alterar status')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alterar status',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura da plataforma
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlano ? 'Editar Plano' : 'Criar Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {editingPlano
                  ? 'Atualize as informações do plano'
                  : 'Preencha os dados para criar um novo plano'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Select
                    value={formData.codigo}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        codigo: value as 'FREE' | 'BASIC' | 'PREMIUM' | 'UNLIMITED',
                      }))
                    }
                    disabled={!!editingPlano}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="BASIC">BASIC</SelectItem>
                      <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                      <SelectItem value="UNLIMITED">UNLIMITED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preco: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precoDisplay">Preço Display (R$) *</Label>
                  <Input
                    id="precoDisplay"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precoDisplay}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        precoDisplay: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadsPerMonth">
                    Leads por Mês * (-1 = ilimitado)
                  </Label>
                  <Input
                    id="leadsPerMonth"
                    type="number"
                    min="-1"
                    value={formData.leadsPerMonth}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || val === '-') {
                        setFormData((prev) => ({
                          ...prev,
                          leadsPerMonth: val === '' ? 0 : -1,
                        }))
                        return
                      }
                      const numValue = parseInt(val, 10)
                      if (!isNaN(numValue)) {
                        setFormData((prev) => ({
                          ...prev,
                          leadsPerMonth: numValue,
                        }))
                      }
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadsPerHour">
                    Leads por Hora * (-1 = ilimitado)
                  </Label>
                  <Input
                    id="leadsPerHour"
                    type="number"
                    min="-1"
                    value={formData.leadsPerHour}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || val === '-') {
                        setFormData((prev) => ({
                          ...prev,
                          leadsPerHour: val === '' ? 5 : -1,
                        }))
                        return
                      }
                      const numValue = parseInt(val, 10)
                      if (!isNaN(numValue)) {
                        setFormData((prev) => ({
                          ...prev,
                          leadsPerHour: numValue,
                        }))
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                    placeholder="Adicionar feature..."
                  />
                  <Button type="button" onClick={handleAddFeature} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                <Input
                  id="stripePriceId"
                  value={formData.stripePriceId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stripePriceId: e.target.value,
                    }))
                  }
                  placeholder="price_xxxxx"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as 'ACTIVE' | 'COMING_SOON' | 'HIDDEN',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="COMING_SOON">Em Breve</SelectItem>
                      <SelectItem value="HIDDEN">Oculto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ordem: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, ativo: !!checked }))
                    }
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Ativo
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingPlano ? (
                    'Atualizar'
                  ) : (
                    'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AdminNav />

      <div className="mt-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        ) : planos.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Nenhum plano encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos.map((plano) => (
              <Card key={plano.id} className={!plano.ativo ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plano.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plano.descricao || 'Sem descrição'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        plano.status === 'ACTIVE'
                          ? 'default'
                          : plano.status === 'COMING_SOON'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {plano.status === 'ACTIVE'
                        ? 'Ativo'
                        : plano.status === 'COMING_SOON'
                          ? 'Em Breve'
                          : 'Oculto'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(plano.precoDisplay / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código: {plano.codigo}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leads/Mês:</span>
                      <span className="font-medium">
                        {plano.leadsPerMonth === -1
                          ? 'Ilimitado'
                          : plano.leadsPerMonth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leads/Hora:</span>
                      <span className="font-medium">
                        {plano.leadsPerHour === -1
                          ? 'Ilimitado'
                          : plano.leadsPerHour}
                      </span>
                    </div>
                    {plano._count && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assinaturas:</span>
                        <span className="font-medium">
                          {plano._count.historicoAssinaturas}
                        </span>
                      </div>
                    )}
                  </div>

                  {plano.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {plano.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {plano.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{plano.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(plano)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(plano)}
                      className="flex-1"
                    >
                      {plano.ativo ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </Button>
                    {plano._count?.historicoAssinaturas === 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(plano)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
