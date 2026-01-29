import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

export async function POST(
  req: Request,
  { params }: { params: { advogadoId: string } }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const advogado = await prisma.advogado.findUnique({
      where: { id: params.advogadoId },
    })

    if (!advogado) {
      return NextResponse.json(
        { error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    await prisma.advogado.update({
      where: { id: params.advogadoId },
      data: {
        oabVerificado: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Advogado aprovado com sucesso',
    })
  } catch (error) {
    console.error('Error approving advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar advogado' },
      { status: 500 }
    )
  }
}
