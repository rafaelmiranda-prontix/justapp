'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle,
  CheckCircle2,
  Save,
  MapPin,
  DollarSign,
  Globe,
  Scale,
  FileText,
  User,
  Loader2,
  Navigation,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useGeolocation } from '@/hooks/use-geolocation'
import { PLANS_STATIC } from '@/lib/plans'

interface Especialidade {
  id: string
  nome: string
  slug: string
}

interface PerfilData {
  id: string
  oab: string
  oabVerificado: boolean
  bio: string | null
  fotoUrl: string | null
  cidade: string
  estado: string
  latitude: number | null
  longitude: number | null
  raioAtuacao: number
  precoConsulta: number | null
  aceitaOnline: boolean
  plano: string
  planoExpira: string | null
  leadsRecebidosMes: number
  leadsLimiteMes: number
  onboardingCompleted: boolean
  user: {
    id: string
    name: string
    email: string
    image: string | null
    status: string
  }
  especialidades: Array<{
    id: string
    nome: string
    slug: string
  }>
  missingFields: string[]
  canReceiveCases: boolean
}

export default function AdvogadoPerfilPage() {
  const { toast } = useToast()
  const { getCurrentPosition, isLoading: isLoadingGeo, error: geoError } = useGeolocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    oab: '',
    bio: '',
    cidade: '',
    estado: '',
    raioAtuacao: 50,
    precoConsulta: '',
    aceitaOnline: true,
  })

  useEffect(() => {
    fetchPerfil()
    fetchEspecialidades()
  }, [])

  const fetchPerfil = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/advogado/perfil')
      const result = await res.json()

      if (result.success) {
        setPerfil(result.data)
        setFormData({
          oab: result.data.oab || '',
          bio: result.data.bio || '',
          cidade: result.data.cidade || '',
          estado: result.data.estado || '',
          raioAtuacao: result.data.raioAtuacao || 50,
          precoConsulta: result.data.precoConsulta?.toString() || '',
          aceitaOnline: result.data.aceitaOnline ?? true,
        })
        setSelectedEspecialidades(result.data.especialidades.map((e: any) => e.id))
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

  const fetchEspecialidades = async () => {
    try {
      const res = await fetch('/api/especialidades')
      const result = await res.json()

      if (result.success) {
        setEspecialidades(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error)
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
      const res = await fetch('/api/advogado/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precoConsulta: formData.precoConsulta ? parseFloat(formData.precoConsulta) : null,
          especialidades: selectedEspecialidades,
          cidade,
          estado,
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
      const res = await fetch('/api/advogado/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precoConsulta: formData.precoConsulta ? parseFloat(formData.precoConsulta) : null,
          especialidades: selectedEspecialidades,
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

  const toggleEspecialidade = (espId: string) => {
    setSelectedEspecialidades((prev) =>
      prev.includes(espId) ? prev.filter((id) => id !== espId) : [...prev, espId]
    )
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
        <p className="text-muted-foreground">Gerencie suas informações profissionais</p>
      </div>

      {/* Alerta de campos faltando */}
      {!perfil.canReceiveCases && perfil.missingFields.length > 0 && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Complete seu perfil para receber casos
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-2">
            <p className="font-medium mb-2">Você precisa preencher os seguintes campos:</p>
            <ul className="list-disc list-inside space-y-1">
              {perfil.missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Status de recebimento de casos */}
      {perfil.canReceiveCases && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Perfil completo!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Seu perfil está completo e você está pronto para receber casos.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações do usuário */}
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
            <Input value={perfil.user.email} disabled />
          </div>
          <div>
            <Label>Status da Conta</Label>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={perfil.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {perfil.user.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
              </Badge>
              {perfil.user.status !== 'ACTIVE' && (
                <span className="text-sm text-muted-foreground">
                  Ative sua conta para receber casos
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações profissionais */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Informações Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="oab">
              Número OAB <span className="text-red-500">*</span>
            </Label>
            <Input
              id="oab"
              value={formData.oab}
              onChange={(e) => setFormData({ ...formData, oab: e.target.value })}
              placeholder="Ex: 123456/SP"
            />
            {perfil.oabVerificado && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                OAB verificada
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bio">
              Biografia <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Descreva sua experiência e especialidades..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.bio.length}/500 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="especialidades">
              Especialidades <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {especialidades.map((esp) => (
                <Badge
                  key={esp.id}
                  variant={selectedEspecialidades.includes(esp.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleEspecialidade(esp.id)}
                >
                  {esp.nome}
                </Badge>
              ))}
            </div>
            {selectedEspecialidades.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                Selecione pelo menos uma especialidade
              </p>
            )}
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
          <div className="flex items-center justify-end mb-2">
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
              <Label htmlFor="cidade">
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="estado">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="raioAtuacao">Raio de Atuação (km)</Label>
            <Input
              id="raioAtuacao"
              type="number"
              value={formData.raioAtuacao}
              onChange={(e) =>
                setFormData({ ...formData, raioAtuacao: parseInt(e.target.value) || 50 })
              }
              min={1}
              max={1000}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preços e serviços */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preços e Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="precoConsulta">Preço da Consulta (R$)</Label>
            <Input
              id="precoConsulta"
              type="number"
              value={formData.precoConsulta}
              onChange={(e) => setFormData({ ...formData, precoConsulta: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aceitaOnline"
              checked={formData.aceitaOnline}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, aceitaOnline: checked as boolean })
              }
            />
            <Label htmlFor="aceitaOnline" className="cursor-pointer">
              Aceito consultas online
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Plano e limites */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plano e Limites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Plano Atual</Label>
            <div className="mt-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {PLANS_STATIC[perfil.plano as keyof typeof PLANS_STATIC]?.name || perfil.plano}
              </Badge>
            </div>
          </div>
          <div>
            <Label>Leads Recebidos este Mês</Label>
            <div className="mt-2">
              {perfil.leadsLimiteMes === 0 ? (
                <div>
                  <p className="text-2xl font-bold">0 / Sem leads</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O plano gratuito não inclui leads. Faça upgrade para receber casos.
                  </p>
                </div>
              ) : perfil.leadsLimiteMes === -1 ? (
                <div>
                  <p className="text-2xl font-bold">{perfil.leadsRecebidosMes} / Ilimitado</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold">
                    {perfil.leadsRecebidosMes} / {perfil.leadsLimiteMes}
                  </p>
                  {perfil.leadsRecebidosMes >= perfil.leadsLimiteMes && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Limite atingido. Considere fazer upgrade do plano.
                    </p>
                  )}
                </div>
              )}
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
