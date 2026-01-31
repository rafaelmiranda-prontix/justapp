import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { randomUUID } from 'crypto'

const createMessageSchema = z.object({
  conteudo: z.string().min(1).max(2000),
  anexoUrl: z
    .string()
    .refine(
      (val) => {
        // Aceitar null, undefined ou string vazia
        if (!val || val === '') return true
        // Se for string, deve ser URL válida
        return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')
      },
      { message: 'anexoUrl deve ser uma URL válida (relativa ou absoluta)' }
    )
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)), // Transformar string vazia em null
})

// GET - Lista mensagens de um match
export async function GET(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await params

    // OTIMIZAÇÃO: Verificar autorização apenas com select necessário
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        status: true,
        advogados: {
          select: { userId: true },
        },
        casos: {
          select: {
            cidadaos: {
              select: { userId: true },
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

    // OTIMIZAÇÃO: Busca mensagens com paginação (últimas 50 mensagens)
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const afterId = url.searchParams.get('after') // Para buscar apenas novas mensagens (MVP polling)

    // Se `after` é fornecido, buscar apenas mensagens mais recentes que este ID
    const whereClause: any = { matchId }
    if (afterId) {
      // Buscar mensagens criadas depois do ID fornecido
      const afterMessage = await prisma.mensagens.findUnique({
        where: { id: afterId },
        select: { createdAt: true },
      })

      if (afterMessage) {
        whereClause.createdAt = { gt: afterMessage.createdAt }
      }
    }

    const mensagens = await prisma.mensagens.findMany({
      where: whereClause,
      select: {
        id: true,
        conteudo: true,
        anexoUrl: true,
        lida: true,
        createdAt: true,
        remetente: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: afterId ? 'asc' : 'desc' },
      take: limit,
      skip: afterId ? 0 : offset,
    })

    // Reverter ordem para mostrar mais antigas primeiro (exceto quando busca novas)
    if (!afterId) {
      mensagens.reverse()
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
export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { matchId } = await params
    const body = await req.json()
    
    console.log('[API] Received message data:', { conteudo: body.conteudo, anexoUrl: body.anexoUrl })
    
    const { conteudo, anexoUrl } = createMessageSchema.parse(body)
    
    console.log('[API] Parsed message data:', { conteudo, anexoUrl })

    // Busca o match para verificar autorização
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: { users: true },
        },
        casos: {
          include: {
            cidadaos: {
              include: { users: true },
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
        matchId,
        remetenteId: session.user.id,
        createdAt: {
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
    console.log('[API] Creating message with data:', {
      matchId,
      remetenteId: session.user.id,
      conteudo,
      anexoUrl,
      hasAnexo: !!anexoUrl,
    })
    
    const mensagem = await prisma.mensagens.create({
      data: {
        id: randomUUID(),
        matchId,
        remetenteId: session.user.id,
        conteudo,
        anexoUrl: anexoUrl || null, // Garantir que seja null se vazio
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

    // Enviar evento em tempo real via Pusher
    try {
      await pusherServer.trigger(`match-${matchId}`, 'new-message', mensagem)
    } catch (error) {
      console.error('Error triggering Pusher event:', error)
      // Não falhar a requisição se Pusher falhar
    }

    // TODO: Enviar notificação push/email para o destinatário

    return NextResponse.json({
      success: true,
      data: mensagem,
    })
  } catch (error) {
    console.error('Error creating message:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidas', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
