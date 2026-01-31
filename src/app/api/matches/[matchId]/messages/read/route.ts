import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

const readMessagesSchema = z.object({
  messageIds: z.array(z.string()),
})

// POST - Marca mensagens como lidas
export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await params
    const body = await req.json()
    const { messageIds } = readMessagesSchema.parse(body)

    if (messageIds.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Verificar autorização
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      select: {
        advogados: { select: { userId: true } },
        casos: { select: { cidadaos: { select: { userId: true } } } },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    const isAdvogado = match.advogados.userId === session.user.id
    const isCidadao = match.casos.cidadaos.userId === session.user.id

    if (!isAdvogado && !isCidadao) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Marcar como lidas (apenas mensagens que não são do próprio usuário)
    await prisma.mensagens.updateMany({
      where: {
        id: { in: messageIds },
        matchId,
        remetenteId: { not: session.user.id },
      },
      data: { lido: true },
    })

    // Notificar via Pusher
    try {
      await pusherServer.trigger(`match-${matchId}`, 'messages-read', {
        userId: session.user.id,
        messageIds,
      })
    } catch (error) {
      console.error('Error triggering Pusher event:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao marcar mensagens como lidas' }, { status: 500 })
  }
}
