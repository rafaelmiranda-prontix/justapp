import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { z } from 'zod'

const updateCasoSchema = z.object({
  status: z.enum(['ABERTO', 'EM_MEDIACAO', 'EM_ANDAMENTO', 'FECHADO', 'CANCELADO']).optional(),
  descricao: z.string().min(10).optional(),
  urgencia: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  checklist: z
    .object({
      documentosRecebidos: z.boolean().optional(),
      informacoesMinimas: z.boolean().optional(),
      orientacaoEnviada: z.boolean().optional(),
      encaminhadoAdvogado: z.boolean().optional(),
    })
    .optional(),
})

// GET - Buscar um caso específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { casoId } = await params

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        especialidades: true,
        cidadaos: {
          select: {
            id: true,
            cidade: true,
            estado: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
        matches: {
          include: {
            advogados: {
              include: {
                users: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            mensagens: {
              include: {
                remetente: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            enviadoEm: 'desc',
          },
        },
        case_messages: {
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        mediatedByAdmin: { select: { id: true, name: true, email: true } },
        closedByAdmin: { select: { id: true, name: true, email: true } },
      },
    })

    if (!caso) {
      return NextResponse.json(
        { success: false, error: 'Caso não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: caso,
    })
  } catch (error) {
    console.error('Error fetching caso:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar caso' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar um caso
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { casoId } = await params
    const body = await req.json()

    const validatedData = updateCasoSchema.parse(body)

    const caso = await prisma.casos.update({
      where: { id: casoId },
      data: validatedData,
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Caso atualizado com sucesso',
      data: caso,
    })
  } catch (error) {
    console.error('Error updating caso:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar caso' },
      { status: 500 }
    )
  }
}
