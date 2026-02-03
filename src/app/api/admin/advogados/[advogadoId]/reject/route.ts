import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

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
    const body = await req.json()
    const { motivo } = body

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: true,
      },
    })

    if (!advogado) {
      return NextResponse.json(
        { error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    // Marca como não aprovado e não verificado
    // Futuramente pode adicionar campo de motivo de rejeição
    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        aprovado: false,
        oabVerificado: false,
      },
    })

    // TODO: Enviar email ao advogado informando a rejeição

    return NextResponse.json({
      success: true,
      message: 'Advogado rejeitado',
    })
  } catch (error) {
    console.error('Error rejecting advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao rejeitar advogado' },
      { status: 500 }
    )
  }
}
