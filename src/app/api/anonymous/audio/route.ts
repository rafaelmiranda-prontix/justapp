import { NextRequest, NextResponse } from 'next/server'
import { uploadAudioToSupabase } from '@/lib/supabase-storage'

/**
 * POST /api/anonymous/audio
 * Faz upload de áudio para Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const sessionId = formData.get('sessionId') as string

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de áudio não fornecido' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Arquivo deve ser um áudio' },
        { status: 400 }
      )
    }

    // Validar tamanho (máx 10MB para áudio)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Converter File para Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    })

    // Fazer upload para Supabase
    const result = await uploadAudioToSupabase(audioBlob, sessionId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        path: result.path,
      },
    })
  } catch (error: any) {
    console.error('[API] Error uploading audio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload do áudio' },
      { status: 500 }
    )
  }
}
