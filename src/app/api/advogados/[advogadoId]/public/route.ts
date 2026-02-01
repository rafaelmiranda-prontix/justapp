import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ advogadoId: string }> }
) {
  try {
    const { advogadoId } = await params

    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            name: true,
            email: true, // Pode remover se não quiser expor
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: {
                id: true,
                nome: true,
                slug: true,
              },
            },
          },
        },
        avaliacoes: {
          select: {
            nota: true,
          },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Calcula média de avaliações
    const totalAvaliacoes = advogado.avaliacoes.length
    const avaliacaoMedia =
      totalAvaliacoes > 0
        ? advogado.avaliacoes.reduce((acc, av) => acc + av.nota, 0) / totalAvaliacoes
        : 0

    // Formata dados públicos
    const advogadoPublic = {
      id: advogado.id,
      nome: advogado.users.name,
      foto: advogado.fotoUrl,
      bio: advogado.bio,
      oab: advogado.oab,
      oabVerificado: advogado.oabVerificado,
      cidade: advogado.cidade,
      estado: advogado.estado,
      especialidades: advogado.advogado_especialidades.map((e) => ({
        id: e.especialidades.id,
        nome: e.especialidades.nome,
        slug: e.especialidades.slug,
      })),
      precoConsulta: advogado.precoConsulta,
      aceitaOnline: advogado.aceitaOnline,
      avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
      totalAvaliacoes,
      createdAt: advogado.createdAt,
    }

    return NextResponse.json({
      success: true,
      data: advogadoPublic,
    })
  } catch (error) {
    console.error('Erro ao buscar advogado público:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar advogado' },
      { status: 500 }
    )
  }
}
