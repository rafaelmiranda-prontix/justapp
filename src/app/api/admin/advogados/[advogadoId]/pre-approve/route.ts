import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * Pré-aprova o advogado após primeira análise.
 * Ele ainda não recebe leads; aguarda confirmação (ex.: via N8N) para aprovação final.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { advogadoId } = await params

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
    })

    if (!advogado) {
      return NextResponse.json(
        { error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    if (advogado.aprovado) {
      return NextResponse.json(
        { error: 'Advogado já está aprovado' },
        { status: 400 }
      )
    }

    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        preAprovado: true,
        oabVerificado: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Advogado pré-aprovado. Aguardando confirmação para liberar leads.',
    })
  } catch (error) {
    console.error('Error pre-approving advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao pré-aprovar advogado' },
      { status: 500 }
    )
  }
}
