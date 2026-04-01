import { NextRequest, NextResponse } from 'next/server'
import { expandDistributionForExpiredBatches } from '@/lib/service-requests/distribution'

/**
 * GET/POST — expande lotes de distribuição expirados (cron externo).
 * Header: Authorization: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  await expandDistributionForExpiredBatches()
  return NextResponse.json({ ok: true })
}
