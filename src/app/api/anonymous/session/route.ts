import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService } from '@/lib/anonymous-session.service'

/**
 * GET /api/anonymous/session?sessionId=xxx
 * Busca sessão anônima existente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId é obrigatório' },
        { status: 400 }
      )
    }

    const session = await AnonymousSessionService.findBySessionId(sessionId)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou expirada' },
        { status: 404 }
      )
    }

    // Verificar se deve mostrar formulário de captura
    const shouldCaptureLeadData = AnonymousSessionService.shouldCaptureLeadData(session)

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        mensagens: session.mensagens,
        shouldCaptureLeadData,
        especialidadeDetectada: session.especialidadeDetectada,
        cidade: session.cidade,
        estado: session.estado,
        preQualificationScore: session.preQualificationScore,
        status: session.status,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('[API] Error fetching session:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar sessão' },
      { status: 500 }
    )
  }
}

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
