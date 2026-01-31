'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  CheckCircle2,
  Save,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Star,
  Loader2,
  Navigation,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useGeolocation } from '@/hooks/use-geolocation'

interface PerfilData {
  id: string
  cidade: string | null
  estado: string | null
  latitude: number | null
  longitude: number | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    image: string | null
    status: string
  }
  localizacaoCompleta: boolean
  estatisticas: {
    totalCasos: number
    casosAbertos: number
    totalAvaliacoes: number
  }
}

export default function CidadaoPerfilPage() {
  const { toast } = useToast()
  const { getCurrentPosition, isLoading: isLoadingGeo, error: geoError } = useGeolocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [perfil, setPerfil] = useState<PerfilData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    phone: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/cidadao/perfil')
      const result = await res.json()

      if (result.success) {
        setPerfil(result.data)
        setFormData({
          phone: result.data.user.phone || '',
          cidade: result.data.cidade || '',
          estado: result.data.estado || '',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetLocation = async () => {
    setIsGettingLocation(true)
    try {
      // Obter coordenadas do navegador
      const position = await getCurrentPosition()

      // Fazer reverse geocoding
      const res = await fetch(
        `/api/geo/reverse-geocode?lat=${position.latitude}&lon=${position.longitude}`
      )
      const result = await res.json()

      if (result.success) {
        setFormData({
          ...formData,
          cidade: result.data.cidade,
          estado: result.data.estado,
        })

        // Salvar automaticamente
        await handleSaveWithLocation(result.data.cidade, result.data.estado, position.latitude, position.longitude)

        toast({
          title: 'Localização obtida!',
          description: `Cidade: ${result.data.cidade}, Estado: ${result.data.estado}`,
        })
      } else {
        throw new Error(result.error || 'Erro ao obter localização')
      }
    } catch (error: any) {
      console.error('Erro ao obter localização:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível obter sua localização',
        variant: 'destructive',
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSaveWithLocation = async (cidade: string, estado: string, latitude: number, longitude: number) => {
    try {
      const res = await fetch('/api/cidadao/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone || null,
          cidade: cidade || null,
          estado: estado || null,
          latitude,
          longitude,
        }),
      })

      const result = await res.json()

      if (result.success) {
        await fetchPerfil()
      }
    } catch (error) {
      console.error('Erro ao salvar localização:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/cidadao/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
        }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Perfil atualizado com sucesso!',
        })
        await fetchPerfil()
      } else {
        throw new Error(result.error || 'Erro ao atualizar perfil')
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o perfil',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Não foi possível carregar o perfil</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      {/* Alerta de localização */}
      {!perfil.localizacaoCompleta && (
        <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <MapPin className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Complete sua localização
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Adicione sua cidade e estado para encontrar advogados próximos a você.
          </AlertDescription>
        </Alert>
      )}

      {/* Status de localização */}
      {perfil.localizacaoCompleta && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Localização completa!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Sua localização está cadastrada e você pode encontrar advogados próximos.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações pessoais */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={perfil.user.name} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input value={perfil.user.email} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div>
            <Label>Status da Conta</Label>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={perfil.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {perfil.user.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
              </Badge>
              {perfil.user.status !== 'ACTIVE' && (
                <span className="text-sm text-muted-foreground">
                  Ative sua conta para usar todos os recursos
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Sua localização ajuda a encontrar advogados próximos a você.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isGettingLocation || isLoadingGeo}
            >
              {isGettingLocation || isLoadingGeo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Obtendo...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Usar minha localização
                </>
              )}
            </Button>
          </div>
          {geoError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{geoError}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{perfil.estatisticas.totalCasos}</p>
                <p className="text-sm text-muted-foreground">Total de Casos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{perfil.estatisticas.casosAbertos}</p>
                <p className="text-sm text-muted-foreground">Casos Abertos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{perfil.estatisticas.totalAvaliacoes}</p>
                <p className="text-sm text-muted-foreground">Avaliações Feitas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão salvar */}
      <div className="flex justify-end gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
