import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findMatchingAdvogados } from '@/lib/matching-service'
import { getCityCoordinates } from '@/lib/geo-service'

const searchSchema = z.object({
  especialidade: z.string(),
  cidade: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  urgencia: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  limit: z.number().min(1).max(50).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = searchSchema.parse(body)

    // Se não tem coordenadas mas tem cidade, busca coordenadas
    let latitude = data.latitude
    let longitude = data.longitude

    if (!latitude && !longitude && data.cidade) {
      const coords = getCityCoordinates(data.cidade)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
      }
    }

    // Busca advogados compatíveis
    const advogados = await findMatchingAdvogados(
      {
        especialidade: data.especialidade,
        cidadeUsuario: data.cidade,
        latitudeUsuario: latitude,
        longitudeUsuario: longitude,
        urgencia: data.urgencia,
      },
      data.limit || 10
    )

    return NextResponse.json({
      success: true,
      data: advogados,
      total: advogados.length,
    })
  } catch (error) {
    console.error('Error searching advogados:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao buscar advogados' }, { status: 500 })
  }
}
