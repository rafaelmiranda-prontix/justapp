import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ avaliacaoId: string }> }
) {
  try {
    const { avaliacaoId } = await params

    const avaliacao = await prisma.avaliacoes.findUnique({
      where: { id: avaliacaoId },
      include: {
        cidadaos: {
          include: {
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        advogados: {
          include: {
            users: {
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
  { params }: { params: Promise<{ avaliacaoId: string }> }
) {
  try {
    const { avaliacaoId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { nota, comentario } = body

    // Busca a avaliação
    const avaliacao = await prisma.avaliacoes.findUnique({
      where: { id: avaliacaoId },
      include: {
        cidadaos: {
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
      avaliacao.cidadaos.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Atualiza a avaliação
    const updated = await prisma.avaliacoes.update({
      where: { id: avaliacaoId },
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
  { params }: { params: Promise<{ avaliacaoId: string }> }
) {
  try {
    const { avaliacaoId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Busca a avaliação
    const avaliacao = await prisma.avaliacoes.findUnique({
      where: { id: avaliacaoId },
      include: {
        cidadaos: {
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
      avaliacao.cidadaos.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deleta a avaliação
    await prisma.avaliacoes.delete({
      where: { id: avaliacaoId },
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
