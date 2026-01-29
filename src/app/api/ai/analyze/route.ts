import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeCaseWithAI } from '@/lib/ai-service'

const analyzeSchema = z.object({
  description: z.string().min(10, 'Descrição muito curta'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { description } = analyzeSchema.parse(body)

    // Analisa com IA ou fallback
    const analysis = await analyzeCaseWithAI(description)

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
