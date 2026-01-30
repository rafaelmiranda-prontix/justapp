import { prisma } from './prisma'
import { calculateDistance } from './geo-service'
import { canAdvogadoReceiveLead, resetMonthlyLeadsIfNeeded } from './subscription-service'

interface MatchingCriteria {
  especialidade: string
  cidadeUsuario?: string
  latitudeUsuario?: number
  longitudeUsuario?: number
  urgencia?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
}

interface AdvogadoMatch {
  id: string
  nome: string
  foto: string | null
  bio: string | null
  cidade: string
  estado: string
  especialidades: string[]
  precoConsulta: number | null
  aceitaOnline: boolean
  avaliacaoMedia: number
  totalAvaliacoes: number
  distanciaKm: number | null
  score: number
}

/**
 * Busca advogados compatíveis com score de matching
 *
 * Score baseado em:
 * - Especialidade: 40% (match exato = 40 pontos)
 * - Distância: 30% (quanto mais perto, melhor)
 * - Avaliação: 20% (rating médio * 4)
 * - Disponibilidade: 10% (aceita online = +10)
 */
export async function findMatchingAdvogados(
  criteria: MatchingCriteria,
  limit: number = 10
): Promise<AdvogadoMatch[]> {
  // Busca especialidade no banco
  const especialidade = await prisma.especialidade.findFirst({
    where: {
      OR: [
        { nome: { contains: criteria.especialidade, mode: 'insensitive' } },
        { slug: { contains: criteria.especialidade, mode: 'insensitive' } },
      ],
    },
  })

  if (!especialidade) {
    return []
  }

  // Busca advogados com a especialidade
  const advogados = await prisma.advogados.findMany({
    where: {
      especialidades: {
        some: {
          especialidadeId: especialidade.id,
        },
      },
      // Apenas advogados com plano ativo (depois implementar lógica de plano)
    },
    include: {
      user: true,
      especialidades: {
        include: {
          especialidade: true,
        },
      },
      avaliacoes: {
        select: {
          nota: true,
        },
      },
    },
    take: 50, // Busca mais para depois rankear
  })

  // Filtra advogados que podem receber leads e calcula score
  const advogadosComScore = await Promise.all(
    advogados.map(async (advogado) => {
      // Reseta leads se necessário
      await resetMonthlyLeadsIfNeeded(advogado.id)

      // Verifica se pode receber lead
      const { canReceive } = await canAdvogadoReceiveLead(advogado.id)
      if (!canReceive) {
        return null // Filtra fora depois
      }
    let score = 0

    // 1. Especialidade (40 pontos)
    score += 40

    // 2. Distância (30 pontos)
    let distanciaKm: number | null = null

    if (
      criteria.latitudeUsuario &&
      criteria.longitudeUsuario &&
      advogado.latitude &&
      advogado.longitude
    ) {
      distanciaKm = calculateDistance(
        criteria.latitudeUsuario,
        criteria.longitudeUsuario,
        advogado.latitude,
        advogado.longitude
      )

      // Quanto mais perto, maior o score
      // 0-5km = 30 pontos
      // 5-15km = 20 pontos
      // 15-30km = 10 pontos
      // 30+ km = 5 pontos
      if (distanciaKm <= 5) {
        score += 30
      } else if (distanciaKm <= 15) {
        score += 20
      } else if (distanciaKm <= 30) {
        score += 10
      } else {
        score += 5
      }
    } else if (
      criteria.cidadeUsuario &&
      advogado.cidade.toLowerCase() === criteria.cidadeUsuario.toLowerCase()
    ) {
      // Mesma cidade sem coordenadas exatas
      score += 25
    }

    // 3. Avaliação (20 pontos)
    const avaliacoes = advogado.avaliacoes
    if (avaliacoes.length > 0) {
      const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0)
      const media = soma / avaliacoes.length
      score += (media / 5) * 20 // Converte para escala de 20 pontos
    }

    // 4. Disponibilidade (10 pontos)
    if (advogado.aceitaOnline) {
      score += 10
    }

    // Bonus: urgência e disponibilidade imediata
    if (criteria.urgencia === 'URGENTE' && advogado.aceitaOnline) {
      score += 5
    }

    // Calcula avaliação média
    const avaliacaoMedia =
      avaliacoes.length > 0
        ? avaliacoes.reduce((acc, av) => acc + av.nota, 0) / avaliacoes.length
        : 0

    return {
      id: advogado.id,
      nome: advogado.user.name,
      foto: advogado.fotoUrl,
      bio: advogado.bio,
      cidade: advogado.cidade,
      estado: advogado.estado,
      especialidades: advogado.especialidades.map((e) => e.especialidade.nome),
      precoConsulta: advogado.precoConsulta,
      aceitaOnline: advogado.aceitaOnline,
      avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
      totalAvaliacoes: avaliacoes.length,
      distanciaKm,
      score: Math.round(score),
    }
    })
  )

  // Filtra nulls e ordena por score (maior primeiro)
  const advogadosFiltrados = advogadosComScore.filter(
    (a): a is AdvogadoMatch => a !== null
  )
  advogadosFiltrados.sort((a, b) => b.score - a.score)

  // Retorna os top matches
  return advogadosFiltrados.slice(0, limit)
}
