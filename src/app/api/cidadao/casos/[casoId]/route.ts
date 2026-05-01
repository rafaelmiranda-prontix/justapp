import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCaseStatusSchema = z.object({
  action: z.enum(['CANCELAR', 'FECHAR']),
  reason: z.string().max(500).optional(),
})

/**
 * GET /api/cidadao/casos/[casoId]
 * Busca detalhes de um caso específico do cidadão
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params

    // Buscar cidadão
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Buscar caso (matches ativos para resumo do chat com advogados)
    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        matches: {
          where: { status: { in: ['ACEITO', 'CONTRATADO'] } },
          select: {
            id: true,
            status: true,
            advogados: {
              select: {
                users: { select: { name: true } },
              },
            },
            _count: { select: { mensagens: true } },
          },
        },
      },
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Verificar se o caso pertence ao cidadão
    if (caso.cidadaoId !== cidadao.id) {
      return NextResponse.json(
        { error: 'Você não tem acesso a este caso' },
        { status: 403 }
      )
    }

    const lawyerChats = caso.matches.map((m) => ({
      matchId: m.id,
      advogadoNome: m.advogados.users.name,
      status: m.status,
      messageCount: m._count.mensagens,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: caso.id,
        descricao: caso.descricao,
        descricaoIA: caso.descricaoIA,
        conversaHistorico: caso.conversaHistorico,
        urgencia: caso.urgencia,
        status: caso.status,
        createdAt: caso.createdAt.toISOString(),
        especialidades: caso.especialidades,
        cidadaos: caso.cidadaos,
        lawyerChats,
      },
    })
  } catch (error) {
    console.error('[Cidadao] Error fetching case details:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do caso' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/cidadao/casos/[casoId]
 * Permite ao cidadão cancelar/fechar um caso próprio.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params
    const payload = updateCaseStatusSchema.parse(await request.json())

    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ success: false, error: 'Cidadão não encontrado' }, { status: 404 })
    }

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      select: { id: true, cidadaoId: true, status: true },
    })

    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    if (caso.cidadaoId !== cidadao.id) {
      return NextResponse.json({ success: false, error: 'Você não tem acesso a este caso' }, { status: 403 })
    }

    if (caso.status === 'FECHADO' || caso.status === 'CANCELADO') {
      return NextResponse.json(
        { success: false, error: 'Este caso já está encerrado.' },
        { status: 400 }
      )
    }

    const nextStatus = payload.action === 'CANCELAR' ? 'CANCELADO' : 'FECHADO'
    const summaryPrefix = payload.action === 'CANCELAR' ? 'Cancelado pelo cidadão' : 'Fechado pelo cidadão'
    const closeSummary = payload.reason?.trim()
      ? `${summaryPrefix}: ${payload.reason.trim()}`
      : summaryPrefix

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCaso = await tx.casos.update({
        where: { id: casoId },
        data: {
          status: nextStatus,
          closedAt: new Date(),
          closeSummary,
          closeReason: payload.action === 'FECHAR' ? 'RESOLVIDO' : null,
          updatedAt: new Date(),
        },
        include: {
          especialidades: { select: { nome: true } },
        },
      })

      await tx.matches.updateMany({
        where: {
          casoId,
          status: { in: ['PENDENTE', 'ACEITO'] },
        },
        data: {
          status: 'EXPIRADO',
          respondidoEm: new Date(),
        },
      })

      return updatedCaso
    })

    return NextResponse.json({
      success: true,
      message: payload.action === 'CANCELAR' ? 'Caso cancelado com sucesso' : 'Caso fechado com sucesso',
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0]?.message }, { status: 400 })
    }

    console.error('[Cidadao] Error updating case status:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status do caso' },
      { status: 500 }
    )
  }
}
