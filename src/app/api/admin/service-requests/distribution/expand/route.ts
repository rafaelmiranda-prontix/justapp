import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { expandDistributionForExpiredBatches } from '@/lib/service-requests/distribution'

/**
 * POST — admin: reprocessa lotes expirados (mesma lógica do cron).
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    await expandDistributionForExpiredBatches()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin distribution expand]', e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
