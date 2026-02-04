'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin, Navigation, CheckCircle2 } from 'lucide-react'
import { GeolocationModal } from '@/components/anonymous-chat/geolocation-modal'
import { useGeolocation } from '@/hooks/use-geolocation'

interface CaseSubmitFormProps {
  onSubmit: (data: { cidade: string; estado: string }) => Promise<void>
  extractedData?: {
    cidade?: string
    estado?: string
  }
}

export function CaseSubmitForm({ onSubmit, extractedData }: CaseSubmitFormProps) {
  const [cidade, setCidade] = useState(extractedData?.cidade || '')
  const [estado, setEstado] = useState(extractedData?.estado || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  const { getCurrentPosition, error: geoError } = useGeolocation()

  // Preencher cidade e estado se vierem do extractedData
  useEffect(() => {
    if (extractedData?.cidade && !cidade) {
      setCidade(extractedData.cidade)
    }
    if (extractedData?.estado && !estado) {
      setEstado(extractedData.estado)
    }
  }, [extractedData, cidade, estado])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!cidade.trim() || !estado.trim()) {
      setError('Por favor, informe sua cidade e estado')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao enviar caso. Tente novamente.'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Enviar caso para advogados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Informe sua localização para encontrarmos os melhores advogados na sua região
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Cidade e Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: São Paulo"
                  disabled={isSubmitting || isGettingLocation}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  placeholder="Ex: SP"
                  maxLength={2}
                  disabled={isSubmitting || isGettingLocation}
                  required
                />
              </div>
            </div>

            {/* Botão de localização */}
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestLocation}
              disabled={isSubmitting || isGettingLocation}
              className="w-full"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Obtendo localização...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Usar minha localização
                </>
              )}
            </Button>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !cidade.trim() || !estado.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando caso...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Enviar caso para advogados
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Modal de geolocalização */}
      <GeolocationModal
        open={showGeoModal}
        onClose={() => setShowGeoModal(false)}
        onAllow={handleGetLocation}
        onDeny={handleDenyLocation}
      />
    </div>
  )
}
