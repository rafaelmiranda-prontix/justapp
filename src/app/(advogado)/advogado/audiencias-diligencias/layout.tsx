import { redirect } from 'next/navigation'
import { ConfigService } from '@/lib/config-service'

export const dynamic = 'force-dynamic'

export default async function AudienciasDiligenciasSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const enabled = await ConfigService.isAudienciasDiligenciasEnabled()
  if (!enabled) {
    redirect('/advogado/dashboard')
  }
  return <>{children}</>
}
