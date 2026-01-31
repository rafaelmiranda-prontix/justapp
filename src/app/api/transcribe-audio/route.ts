import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple rate limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // 10 requests
const RATE_LIMIT_WINDOW = 60 * 1000 // per 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * POST /api/transcribe-audio
 * Transcreve áudio para texto usando OpenAI Whisper
 * Rota pública (usada no chat anônimo)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
        { status: 429 }
      )
    }
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Arquivo de áudio não fornecido' }, { status: 400 })
    }

    // Validar tamanho (máx 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 25MB.' },
        { status: 400 }
      )
    }

    console.log('[Transcribe] Processing audio:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Transcrever usando Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt', // Português
      response_format: 'json',
    })

    console.log('[Transcribe] Transcription successful:', transcription.text)

    return NextResponse.json({
      success: true,
      text: transcription.text,
    })
  } catch (error: any) {
      logger.error('[Transcribe] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao transcrever áudio',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
