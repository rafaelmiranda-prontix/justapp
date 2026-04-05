import { NextResponse } from 'next/server'
import { ConfigService } from '@/lib/config-service'

/** Sinaliza recursos da landing/app sem autenticação (apenas flags não sensíveis). */
export const dynamic = 'force-dynamic'

export async function GET() {
  const audienciasDiligenciasEnabled = await ConfigService.isAudienciasDiligenciasEnabled()
  return NextResponse.json({ audienciasDiligenciasEnabled })
}
