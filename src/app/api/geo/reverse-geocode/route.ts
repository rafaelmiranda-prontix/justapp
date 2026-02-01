import { NextRequest, NextResponse } from 'next/server'

/**
 * Reverse Geocoding usando Nominatim (OpenStreetMap)
 * Gratuito e não requer API key
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude e longitude são obrigatórios' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Coordenadas inválidas' },
        { status: 400 }
      )
    }

    // Usar Nominatim para reverse geocoding
    // Limite de 1 requisição por segundo (respeitar rate limit)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR`,
      {
        headers: {
          'User-Agent': 'JustApp/1.0', // Nominatim requer User-Agent
        },
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar localização')
    }

    const data = await response.json()

    // Extrair cidade e estado do endereço
    const address = data.address || {}
    
    // Tentar diferentes campos possíveis para cidade
    const cidade =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state_district ||
      ''

    // Estado pode vir como state ou region
    const estado = address.state || address.region || ''
    
    // Normalizar estado para sigla (2 letras)
    const estadoSigla = normalizeEstado(estado)

    return NextResponse.json({
      success: true,
      data: {
        cidade: cidade.trim(),
        estado: estadoSigla,
        enderecoCompleto: data.display_name || '',
        latitude,
        longitude,
      },
    })
  } catch (error: any) {
    console.error('Erro no reverse geocoding:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao obter localização' },
      { status: 500 }
    )
  }
}

/**
 * Normaliza o nome do estado para sigla (2 letras)
 */
function normalizeEstado(estado: string): string {
  if (!estado) return ''
  
  // Se já é sigla (2 letras), retorna em maiúsculas
  if (estado.length === 2) {
    return estado.toUpperCase()
  }

  // Mapeamento de estados brasileiros
  const estadosMap: Record<string, string> = {
    'acre': 'AC',
    'alagoas': 'AL',
    'amapá': 'AP',
    'amapa': 'AP',
    'amazonas': 'AM',
    'bahia': 'BA',
    'ceará': 'CE',
    'ceara': 'CE',
    'distrito federal': 'DF',
    'espírito santo': 'ES',
    'espirito santo': 'ES',
    'goiás': 'GO',
    'goias': 'GO',
    'maranhão': 'MA',
    'maranhao': 'MA',
    'mato grosso': 'MT',
    'mato grosso do sul': 'MS',
    'minas gerais': 'MG',
    'pará': 'PA',
    'para': 'PA',
    'paraíba': 'PB',
    'paraiba': 'PB',
    'paraná': 'PR',
    'parana': 'PR',
    'pernambuco': 'PE',
    'piauí': 'PI',
    'piaui': 'PI',
    'rio de janeiro': 'RJ',
    'rio grande do norte': 'RN',
    'rio grande do sul': 'RS',
    'rondônia': 'RO',
    'rondonia': 'RO',
    'roraima': 'RR',
    'santa catarina': 'SC',
    'são paulo': 'SP',
    'sao paulo': 'SP',
    'sergipe': 'SE',
    'tocantins': 'TO',
  }

  const estadoLower = estado.toLowerCase().trim()
  
  // Verifica se está no mapa
  if (estadosMap[estadoLower]) {
    return estadosMap[estadoLower]
  }

  // Se não encontrou, retorna os primeiros 2 caracteres em maiúsculas
  return estado.substring(0, 2).toUpperCase()
}
