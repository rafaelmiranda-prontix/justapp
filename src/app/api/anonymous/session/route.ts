import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService } from '@/lib/anonymous-session.service'

/**
 * POST /api/anonymous/session
 * Cria nova sessão anônima
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Creating anonymous session...')

    const userAgent = request.headers.get('user-agent') || undefined
    console.log('[API] User agent:', userAgent)

    // Em produção, usar IP real. Em desenvolvimento, usar undefined
    const ipAddress = process.env.NODE_ENV === 'production'
      ? request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      : undefined
    console.log('[API] IP address:', ipAddress)

    const session = await AnonymousSessionService.create({
      userAgent,
      ipAddress,
    })

    console.log('[API] Session created successfully:', session.sessionId)

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        mensagens: session.mensagens,
      },
    })
  } catch (error: any) {
    console.error('[API] Error creating anonymous session:', error)
    console.error('[API] Error stack:', error.stack)
    console.error('[API] Error message:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar sessão' },
      { status: 500 }
    )
  }
}
