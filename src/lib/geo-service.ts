/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Arredonda para 1 casa decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Coordenadas aproximadas de cidades brasileiras (Rio de Janeiro como padrão)
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
  'Brasília': { lat: -15.7939, lng: -47.8828 },
  'Salvador': { lat: -12.9714, lng: -38.5014 },
  'Fortaleza': { lat: -3.7172, lng: -38.5433 },
  'Curitiba': { lat: -25.4284, lng: -49.2733 },
  'Recife': { lat: -8.0476, lng: -34.877 },
  'Porto Alegre': { lat: -30.0346, lng: -51.2177 },
  'Manaus': { lat: -3.119, lng: -60.0217 },
}

/**
 * Obtém coordenadas de uma cidade (versão simplificada)
 * Em produção, usar API de geocoding como Nominatim/Google Maps
 */
export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  // Normaliza o nome da cidade
  const normalizedCity = city.trim()

  // Busca nas coordenadas conhecidas
  if (CITY_COORDINATES[normalizedCity]) {
    return CITY_COORDINATES[normalizedCity]
  }

  // Busca case-insensitive
  const cityKey = Object.keys(CITY_COORDINATES).find(
    (key) => key.toLowerCase() === normalizedCity.toLowerCase()
  )

  if (cityKey) {
    return CITY_COORDINATES[cityKey]
  }

  // Retorna Rio de Janeiro como fallback (conforme PRD - foco inicial)
  return CITY_COORDINATES['Rio de Janeiro']
}
