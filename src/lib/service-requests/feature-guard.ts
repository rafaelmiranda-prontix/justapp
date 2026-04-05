import { NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config-service'

export function audienciasDiligenciasDisabledResponse() {
  return NextResponse.json(
    { error: 'O módulo Audiências e diligências está desativado.' },
    { status: 403 }
  )
}

/** Use em rotas /api/service-requests/* (exceto admin). */
export async function assertAudienciasDiligenciasEnabled(): Promise<NextResponse | null> {
  const enabled = await ConfigService.isAudienciasDiligenciasEnabled()
  if (!enabled) return audienciasDiligenciasDisabledResponse()
  return null
}
