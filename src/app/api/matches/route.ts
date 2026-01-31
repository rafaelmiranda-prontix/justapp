import { NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  canAdvogadoReceiveLead,
  incrementLeadsReceived,
} from '@/lib/subscription-service'

const createMatchSchema = z.object({
  advogadoId: z.string(),
  casoId: z.string().optional(),
  descricao: z.string().min(10),
  especialidadeId: z.string().optional(),
  urgencia: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const data = createMatchSchema.parse(body)

    // Busca o cidadao
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Verifica se o advogado existe
    const advogado = await prisma.advogados.findUnique({
      where: { id: data.advogadoId },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Cria ou usa caso existente
    let caso
    if (data.casoId) {
      caso = await prisma.casos.findUnique({
        where: { id: data.casoId },
      })
    } else {
      // Cria novo caso
      const now = new Date()
      caso = await prisma.casos.create({
        data: {
          id: nanoid(),
          cidadaoId: cidadao.id,
          descricao: data.descricao,
          especialidadeId: data.especialidadeId,
          urgencia: data.urgencia || 'NORMAL',
          status: 'ABERTO',
          updatedAt: now,
        },
      })
    }

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Verifica se já existe match entre esse caso e advogado
    const existingMatch = await prisma.matches.findUnique({
      where: {
        casoId_advogadoId: {
          casoId: caso.id,
          advogadoId: data.advogadoId,
        },
      },
    })

    if (existingMatch) {
      return NextResponse.json({ error: 'Já existe uma solicitação para este advogado' }, { status: 400 })
    }

    // Verifica se o advogado pode receber o lead
    const { canReceive, reason } = await canAdvogadoReceiveLead(data.advogadoId)
    if (!canReceive) {
      return NextResponse.json(
        { error: reason || 'Advogado não pode receber leads no momento' },
        { status: 403 }
      )
    }

    // Cria o match com score simulado (depois calcular real)
    const match = await prisma.matches.create({
      data: {
        casoId: caso.id,
        advogadoId: data.advogadoId,
        score: 85, // Score simulado
        status: 'PENDENTE',
      },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
        casos: true,
      },
    })

    // Incrementa contador de leads recebidos
    await incrementLeadsReceived(data.advogadoId)

    // TODO: Enviar notificação para o advogado

    return NextResponse.json({
      success: true,
      data: {
        matchId: match.id,
        casoId: caso.id,
        status: match.status,
      },
    })
  } catch (error) {
    console.error('Error creating match:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 })
  }
}

// GET - Listar matches do usuário logado
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || session.user.role

    let matches

    if (role === 'CIDADAO') {
      const cidadao = await prisma.cidadaos.findUnique({
        where: { userId: session.user.id },
      })

      if (!cidadao) {
        return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
      }

      matches = await prisma.matches.findMany({
        where: {
          casos: {
            cidadaoId: cidadao.id,
          },
        },
        include: {
          advogados: {
            include: {
              users: true,
              advogado_especialidades: {
                include: {
                  especialidades: true,
                },
              },
            },
          },
          casos: true,
          mensagens: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          enviadoEm: 'desc',
        },
      })
    } else if (role === 'ADVOGADO') {
      const advogado = await prisma.advogados.findUnique({
        where: { userId: session.user.id },
      })

      if (!advogado) {
        return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
      }

      matches = await prisma.matches.findMany({
        where: {
          advogadoId: advogado.id,
        },
        include: {
          casos: {
            include: {
              cidadaos: {
                include: {
                  users: {
                    select: {
                      name: true,
                      // Email e outros dados sensíveis não são compartilhados com o advogado
                    },
                  },
                },
              },
              especialidades: true,
            },
          },
          mensagens: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          enviadoEm: 'desc',
        },
      })
    } else {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: matches,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Erro ao buscar matches' }, { status: 500 })
  }
}
