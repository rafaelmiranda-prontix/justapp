import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { EmailService } from '@/lib/email.service'

/**
 * POST — e-mail de amostra (sem mensagem do banco), para validar Resend.
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: { email?: string } = {}
  try {
    body = (await req.json()) as { email?: string }
  } catch {
    body = {}
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 })
  }

  const result = await EmailService.sendChatNotifySampleTest(email)
  if (!result.success) {
    return NextResponse.json(
      { error: result.message || 'Falha ao enviar e-mail' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, sentTo: email })
}
