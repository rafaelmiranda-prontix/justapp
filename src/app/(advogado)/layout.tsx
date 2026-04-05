import { ConfigService } from '@/lib/config-service'
import { AdvogadoLayoutClient } from './advogado-layout-client'

export const dynamic = 'force-dynamic'

export default async function AdvogadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const audienciasDiligenciasEnabled = await ConfigService.isAudienciasDiligenciasEnabled()
  return (
    <AdvogadoLayoutClient audienciasDiligenciasEnabled={audienciasDiligenciasEnabled}>
      {children}
    </AdvogadoLayoutClient>
  )
}
