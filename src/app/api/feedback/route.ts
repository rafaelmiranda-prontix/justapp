import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const feedbackSchema = z.object({
  tipo: z.enum(['BUG', 'MELHORIA', 'SUGESTAO', 'OUTRO']),
  categoria: z.enum(['USABILIDADE', 'FUNCIONALIDADE', 'DESIGN', 'PERFORMANCE', 'OUTRO']),
  titulo: z.string().min(5).max(100),
  descricao: z.string().min(10).max(1000),
  url: z.string().url().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    const body = await req.json()
    const data = feedbackSchema.parse(body)

    // Cria feedback no banco (ou envia para serviço externo)
    // Por enquanto, apenas loga
    console.log('Feedback recebido:', {
      userId: session?.user?.id,
      ...data,
      timestamp: new Date().toISOString(),
    })

    // TODO: Salvar no banco ou enviar para serviço de feedback
    // Pode criar uma tabela Feedback no Prisma se necessário

    return NextResponse.json({
      success: true,
      message: 'Feedback enviado com sucesso! Obrigado pela contribuição.',
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao enviar feedback' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // TODO: Buscar feedbacks do banco
    // Por enquanto retorna vazio
    return NextResponse.json({
      success: true,
      data: [],
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feedback' },
      { status: 500 }
    )
  }
}
