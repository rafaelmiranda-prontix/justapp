import { NextRequest, NextResponse } from 'next/server'
import { AnonymousSessionService } from '@/lib/anonymous-session.service'
import { logger } from '@/lib/logger'

/**
 * GET /api/anonymous/session?sessionId=xxx
 * Busca sessão anônima existente ou cria uma nova se não encontrada
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

    let session = await AnonymousSessionService.findBySessionId(sessionId)

    // Se sessão não encontrada ou expirada, criar uma nova
    if (!session) {
      logger.info('[API] Session not found, creating new session...')
      
      const userAgent = request.headers.get('user-agent') || undefined
      const ipAddress = process.env.NODE_ENV === 'production'
        ? request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
        : undefined

      session = await AnonymousSessionService.create({
        userAgent,
        ipAddress,
      })

      logger.info('[API] New session created:', session.sessionId)
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
        // Indicar se foi criada uma nova sessão
        isNewSession: !sessionId || session.sessionId !== sessionId,
      },
    })
  } catch (error: any) {
    logger.error('[API] Error fetching session:', error)
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
    logger.info('[API] Creating anonymous session...')

    const userAgent = request.headers.get('user-agent') || undefined
    logger.debug('[API] User agent:', userAgent)

    // Em produção, usar IP real. Em desenvolvimento, usar undefined
    const ipAddress = process.env.NODE_ENV === 'production'
      ? request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      : undefined
    logger.debug('[API] IP address:', ipAddress)

    const session = await AnonymousSessionService.create({
      userAgent,
      ipAddress,
    })

    logger.info('[API] Session created successfully:', session.sessionId)

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        mensagens: session.mensagens,
      },
    })
  } catch (error: any) {
    logger.error('[API] Error creating anonymous session:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar sessão' },
      { status: 500 }
    )
  }
}
