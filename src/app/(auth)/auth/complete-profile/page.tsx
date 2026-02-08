'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, MapPin, Navigation, Phone, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GeolocationModal } from '@/components/anonymous-chat/geolocation-modal'
import { useGeolocation } from '@/hooks/use-geolocation'
import { formatPhone } from '@/lib/utils'
import Link from 'next/link'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  const { getCurrentPosition, error: geoError } = useGeolocation()

  const handleGetLocation = async () => {
    setShowGeoModal(false)
    setIsGettingLocation(true)
    
    try {
      const position = await getCurrentPosition()
      
      // Fazer reverse geocoding
      const res = await fetch(
        `/api/geo/reverse-geocode?lat=${position.latitude}&lon=${position.longitude}`
      )
      const result = await res.json()

      if (result.success) {
        setCidade(result.data.cidade)
        setEstado(result.data.estado)
        toast({
          variant: 'success',
          title: 'Localização detectada!',
          description: 'Cidade e estado preenchidos automaticamente.',
        })
      }
    } catch (error: any) {
      // Não mostrar erro, apenas não preencher os campos
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleRequestLocation = () => {
    setShowGeoModal(true)
  }

  const handleDenyLocation = () => {
    setShowGeoModal(false)
    // Usuário pode preencher manualmente
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar campos obrigatórios
    if (!cidade.trim()) {
      setError('Por favor, informe sua cidade.')
      return
    }

    if (!estado.trim() || estado.length !== 2) {
      setError('Por favor, informe seu estado (2 letras, ex: SP).')
      return
    }

    if (!acceptedTerms) {
      setError('Por favor, aceite os Termos de Uso e Política de Privacidade para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/cidadao/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim() || null,
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }

      toast({
        variant: 'success',
        title: 'Perfil completado!',
        description: 'Seus dados foram salvos com sucesso.',
      })

      // Redirecionar para o dashboard
      router.push('/cidadao/dashboard')
    } catch (error: any) {
      console.error('Erro ao completar perfil:', error)
      setError(error.message || 'Erro ao salvar dados. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete seu perfil
          </CardTitle>
          <CardDescription className="text-center">
            Precisamos de algumas informações para melhorar sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Telefone (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
                className="bg-white dark:bg-gray-900"
              />
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cidade"
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={isSubmitting || isGettingLocation}
                  required
                  className="bg-white dark:bg-gray-900 flex-1"
                />
                <Input
                  id="estado"
                  type="text"
                  placeholder="Estado (ex: SP)"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  disabled={isSubmitting || isGettingLocation}
                  required
                  maxLength={2}
                  className="bg-white dark:bg-gray-900 w-24"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRequestLocation}
                  disabled={isSubmitting || isGettingLocation}
                  title="Usar minha localização"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique no ícone de navegação para usar sua localização automaticamente
              </p>
            </div>

            {/* Aceite de Termos */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Eu aceito os{' '}
                <Link href="/termos" className="underline hover:text-primary font-medium" target="_blank">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link href="/privacidade" className="underline hover:text-primary font-medium" target="_blank">
                  Política de Privacidade
                </Link>
              </Label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !cidade.trim() || !estado.trim() || !acceptedTerms}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Continuar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <GeolocationModal
        open={showGeoModal}
        onClose={() => setShowGeoModal(false)}
        onAllow={handleGetLocation}
        onDeny={handleDenyLocation}
      />
    </div>
  )
}
