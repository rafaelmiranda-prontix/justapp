import { useState, useCallback } from 'react'

interface GeolocationPosition {
  latitude: number
  longitude: number
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null
  error: string | null
  isLoading: boolean
  getCurrentPosition: () => Promise<GeolocationPosition>
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocalização não é suportada pelo seu navegador'
        setError(errorMsg)
        reject(new Error(errorMsg))
        return
      }

      setIsLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const pos: GeolocationPosition = {
            latitude: geoPosition.coords.latitude,
            longitude: geoPosition.coords.longitude,
          }
          setPosition(pos)
          setIsLoading(false)
          resolve(pos)
        },
        (geoError) => {
          let errorMsg = 'Erro ao obter localização'
          
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMsg = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.'
              break
            case geoError.POSITION_UNAVAILABLE:
              errorMsg = 'Localização indisponível. Verifique se o GPS está ativado.'
              break
            case geoError.TIMEOUT:
              errorMsg = 'Tempo esgotado ao obter localização. Tente novamente.'
              break
            default:
              errorMsg = 'Erro desconhecido ao obter localização.'
              break
          }

          setError(errorMsg)
          setIsLoading(false)
          reject(new Error(errorMsg))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
  }
}
