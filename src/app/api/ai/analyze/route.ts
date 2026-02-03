import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeCaseWithAI } from '@/lib/ai-service'
import { transcribeAudio } from '@/lib/transcription-service'

const analyzeSchema = z.object({
  description: z.string().optional(),
  audioUrl: z.string().url().optional(),
}).refine(
  (data) => data.description || data.audioUrl,
  {
    message: 'É necessário fornecer description ou audioUrl',
  }
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { description, audioUrl } = analyzeSchema.parse(body)

    let finalDescription = description || ''

    // Se houver áudio, transcrever (pode complementar ou substituir a descrição)
    if (audioUrl) {
      try {
        const transcription = await transcribeAudio(audioUrl)
        if (transcription) {
          // Se já tem descrição, combinar; senão usar apenas transcrição
          if (finalDescription) {
            finalDescription = `${finalDescription}\n\n[Transcrição de áudio]: ${transcription}`
          } else {
            finalDescription = transcription
          }
        }
      } catch (error) {
        console.error('Error transcribing audio:', error)
        // Continua mesmo se a transcrição falhar, usando apenas a descrição
      }
    }

    if (!finalDescription || finalDescription.trim().length < 10) {
      return NextResponse.json(
        { error: 'Descrição muito curta ou não fornecida. Por favor, forneça mais detalhes.' },
        { status: 400 }
      )
    }

    // Analisa com IA ou fallback
    const analysis = await analyzeCaseWithAI(finalDescription)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Error analyzing case:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao analisar caso' }, { status: 500 })
  }
}
