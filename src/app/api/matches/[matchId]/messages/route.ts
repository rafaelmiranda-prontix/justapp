import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const createMessageSchema = z.object({
  conteudo: z.string().min(1).max(2000),
  anexoUrl: z.string().url().optional(),
})

// GET - Lista mensagens de um match
export async function GET(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca o match para verificar autorização
    const match = await prisma.matches.findUnique({
      where: { id: params.matchId },
      include: {
        advogados: {
          include: { user: true },
        },
        casos: {
          include: {
            cidadaos: {
              include: { user: true },
            },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    // Verifica se o usuário é parte do match
    const isAdvogado = match.advogados.userId === session.user.id
    const isCidadao = match.casos.cidadaos.userId === session.user.id

    if (!isAdvogado && !isCidadao) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca as mensagens
    const mensagens = await prisma.mensagens.findMany({
      where: { matchId: params.matchId },
      include: {
        remetente: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    })

    // Marca mensagens como lidas
    const messageIdsToMarkAsRead = mensagens
      .filter((m) => !m.lido && m.remetenteId !== session.user.id)
      .map((m) => m.id)

    if (messageIdsToMarkAsRead.length > 0) {
      await prisma.mensagens.updateMany({
        where: { id: { in: messageIdsToMarkAsRead } },
        data: { lido: true },
      })
    }

    return NextResponse.json({
      success: true,
      data: mensagens,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
  }
}

// POST - Cria nova mensagem
export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { conteudo, anexoUrl } = createMessageSchema.parse(body)

    // Busca o match para verificar autorização
    const match = await prisma.matches.findUnique({
      where: { id: params.matchId },
      include: {
        advogados: {
          include: { user: true },
        },
        casos: {
          include: {
            cidadaos: {
              include: { user: true },
            },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    // Verifica se o match foi aceito
    if (match.status !== 'ACEITO') {
      return NextResponse.json(
        { error: 'Só é possível enviar mensagens em matches aceitos' },
        { status: 403 }
      )
    }

    // Verifica se o usuário é parte do match
    const isAdvogado = match.advogados.userId === session.user.id
    const isCidadao = match.casos.cidadaos.userId === session.user.id

    if (!isAdvogado && !isCidadao) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Rate limiting simples - verifica mensagens recentes do usuário
    const recentMessages = await prisma.mensagens.count({
      where: {
        matchId: params.matchId,
        remetenteId: session.user.id,
        criadoEm: {
          gte: new Date(Date.now() - 60000), // Últimos 60 segundos
        },
      },
    })

    if (recentMessages >= 10) {
      return NextResponse.json(
        { error: 'Limite de mensagens excedido. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // Cria a mensagem
    const mensagem = await prisma.mensagens.create({
      data: {
        matchId: params.matchId,
        remetenteId: session.user.id,
        conteudo,
        anexoUrl,
      },
      include: {
        remetente: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // TODO: Enviar notificação push/email para o destinatário

    return NextResponse.json({
      success: true,
      data: mensagem,
    })
  } catch (error) {
    console.error('Error creating message:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
