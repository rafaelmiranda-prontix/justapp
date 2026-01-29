import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdvogadoProfile } from '@/components/advogado/advogado-profile'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: { advogadoId: string }
}

async function getAdvogadoPublic(advogadoId: string) {
  try {
    const advogado = await prisma.advogado.findUnique({
      where: { id: advogadoId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        especialidades: {
          include: {
            especialidade: {
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
      return null
    }

    // Calcula média de avaliações
    const totalAvaliacoes = advogado.avaliacoes.length
    const avaliacaoMedia =
      totalAvaliacoes > 0
        ? advogado.avaliacoes.reduce((acc, av) => acc + av.nota, 0) / totalAvaliacoes
        : 0

    // Formata dados públicos
    return {
      id: advogado.id,
      nome: advogado.user.name,
      foto: advogado.fotoUrl,
      bio: advogado.bio,
      oab: advogado.oab,
      oabVerificado: advogado.oabVerificado,
      cidade: advogado.cidade,
      estado: advogado.estado,
      especialidades: advogado.especialidades.map((e) => ({
        id: e.especialidade.id,
        nome: e.especialidade.nome,
        slug: e.especialidade.slug,
      })),
      precoConsulta: advogado.precoConsulta,
      aceitaOnline: advogado.aceitaOnline,
      avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
      totalAvaliacoes,
      createdAt: advogado.createdAt,
    }
  } catch (error) {
    console.error('Erro ao buscar advogado:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const advogado = await getAdvogadoPublic(params.advogadoId)

  if (!advogado) {
    return {
      title: 'Advogado não encontrado',
    }
  }

  return {
    title: `${advogado.nome} - Advogado em ${advogado.cidade}, ${advogado.estado}`,
    description:
      advogado.bio ||
      `Advogado especializado em ${advogado.especialidades.map((e: { nome: string }) => e.nome).join(', ')}. ${advogado.avaliacaoMedia > 0 ? `Avaliação média: ${advogado.avaliacaoMedia} estrelas.` : ''}`,
    openGraph: {
      title: advogado.nome,
      description: advogado.bio || `Advogado em ${advogado.cidade}, ${advogado.estado}`,
      images: advogado.foto ? [advogado.foto] : [],
    },
  }
}

export default async function AdvogadoPublicPage({ params }: PageProps) {
  const advogado = await getAdvogadoPublic(params.advogadoId)

  if (!advogado) {
    notFound()
  }

  return <AdvogadoProfile advogado={advogado} />
}
