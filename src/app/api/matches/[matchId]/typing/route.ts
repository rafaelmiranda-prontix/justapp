import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { prisma } from '@/lib/prisma'

// POST - Notifica que usuário está digitando
export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await params

    // Verificação rápida de autorização (sem includes desnecessários)
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

    // Enviar evento via Pusher
    try {
      await pusherServer.trigger(`match-${matchId}`, 'user-typing', {
        userId: session.user.id,
        userName: session.user.name,
      })
    } catch (error) {
      console.error('Error triggering Pusher event:', error)
      return NextResponse.json({ error: 'Erro ao enviar evento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending typing event:', error)
    return NextResponse.json({ error: 'Erro ao enviar evento' }, { status: 500 })
  }
}
