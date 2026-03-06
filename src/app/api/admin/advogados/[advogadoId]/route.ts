import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * GET - Retorna todos os dados cadastrais do advogado (para o painel admin).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { advogadoId } = await params

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: { id: true, nome: true, slug: true },
            },
          },
        },
        avaliacoes: {
          select: { nota: true, comentario: true, createdAt: true },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json(
        { success: false, error: 'Advogado não encontrado' },
        { status: 404 }
      )
    }

    const totalAvaliacoes = advogado.avaliacoes?.length ?? 0
    const avaliacaoMedia =
      totalAvaliacoes > 0
        ? advogado.avaliacoes!.reduce((acc, a) => acc + a.nota, 0) / totalAvaliacoes
        : 0

    const especialidades = (advogado.advogado_especialidades ?? []).map((ae) => ({
      id: ae.especialidades.id,
      nome: ae.especialidades.nome,
      slug: ae.especialidades.slug,
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...advogado,
        users: advogado.users,
        especialidades,
        avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
        totalAvaliacoes,
        avaliacoes: advogado.avaliacoes,
      },
    })
  } catch (err) {
    console.error('Error fetching advogado detail:', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar advogado' },
      { status: 500 }
    )
  }
}
