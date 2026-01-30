import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const updateMatchSchema = z.object({
  status: z.enum(['VISUALIZADO', 'ACEITO', 'RECUSADO']),
})

export async function PATCH(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { status } = updateMatchSchema.parse(body)

    // Busca o match
    const match = await prisma.matches.findUnique({
      where: { id: params.matchId },
      include: {
        advogados: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    // Verifica se o advogado é o dono do match
    if (match.advogados.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Atualiza o match
    const updatedMatch = await prisma.matches.update({
      where: { id: params.matchId },
      data: {
        status,
        visualizadoEm: status === 'VISUALIZADO' ? new Date() : match.visualizadoEm,
        respondidoEm: status === 'ACEITO' || status === 'RECUSADO' ? new Date() : match.respondidoEm,
      },
    })

    // Se aceito, atualiza o status do caso
    if (status === 'ACEITO') {
      await prisma.casos.update({
        where: { id: match.casoId },
        data: { status: 'EM_ANDAMENTO' },
      })
    }

    // TODO: Enviar notificação para o cidadão

    return NextResponse.json({
      success: true,
      data: updatedMatch,
    })
  } catch (error) {
    console.error('Error updating match:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar match' }, { status: 500 })
  }
}
