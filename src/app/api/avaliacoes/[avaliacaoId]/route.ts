import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { avaliacaoId: string } }
) {
  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: params.avaliacaoId },
      include: {
        cidadao: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        advogado: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: avaliacao,
    })
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliação' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { avaliacaoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { nota, comentario } = body

    // Busca a avaliação
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: params.avaliacaoId },
      include: {
        cidadao: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Verifica se o usuário é o autor da avaliação ou admin
    if (
      avaliacao.cidadao.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Atualiza a avaliação
    const updated = await prisma.avaliacao.update({
      where: { id: params.avaliacaoId },
      data: {
        nota: nota ?? avaliacao.nota,
        comentario: comentario !== undefined ? comentario : avaliacao.comentario,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { avaliacaoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Busca a avaliação
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: params.avaliacaoId },
      include: {
        cidadao: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Verifica se o usuário é o autor da avaliação ou admin
    if (
      avaliacao.cidadao.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deleta a avaliação
    await prisma.avaliacao.delete({
      where: { id: params.avaliacaoId },
    })

    return NextResponse.json({
      success: true,
      message: 'Avaliação deletada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error)
    return NextResponse.json({ error: 'Erro ao deletar avaliação' }, { status: 500 })
  }
}
