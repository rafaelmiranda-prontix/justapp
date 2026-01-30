import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'

/**
 * Serviço de Distribuição Automática de Casos
 *
 * Responsável por:
 * - Encontrar advogados compatíveis
 * - Calcular score de compatibilidade
 * - Criar matches automáticos
 * - Respeitar limites de leads
 */
export class CaseDistributionService {
  /**
   * Distribui um caso para advogados compatíveis
   * Cria até N matches baseado em especialidade, localização e score
   */
  static async distributeCase(casoId: string): Promise<{
    matchesCreated: number
    advogadosNotificados: string[]
  }> {
    // Buscar caso com detalhes
    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: {
          include: {
            users: true,
          },
        },
        especialidades: true,
      },
    })

    if (!caso) {
      throw new Error('Caso não encontrado')
    }

    // Validar status
    if (caso.status !== 'ABERTO') {
      throw new Error('Apenas casos com status ABERTO podem ser distribuídos')
    }

    console.log(`[Distribution] Starting distribution for case ${casoId}`)
    console.log(`[Distribution] Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
    console.log(`[Distribution] Localização: ${caso.cidadaos.cidade}, ${caso.cidadaos.estado}`)

    // Buscar configurações
    const maxMatches = await ConfigService.getNumber('max_matches_per_caso', 5)
    const minScore = await ConfigService.getNumber('min_match_score', 60)
    const expirationHours = await ConfigService.getNumber('match_expiration_hours', 48)

    // Buscar advogados compatíveis
    const advogadosCompativeis = await this.findCompatibleLawyers(caso, minScore)

    console.log(`[Distribution] Found ${advogadosCompativeis.length} compatible lawyers`)

    // Limitar ao máximo configurado
    const advogadosParaMatch = advogadosCompativeis.slice(0, maxMatches)

    // Criar matches
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expirationHours)

    const matchesCreated: string[] = []

    for (const advogado of advogadosParaMatch) {
      try {
        // Verificar se já existe match
        const existingMatch = await prisma.matches.findUnique({
          where: {
            casoId_advogadoId: {
              casoId: caso.id,
              advogadoId: advogado.id,
            },
          },
        })

        if (existingMatch) {
          console.log(`[Distribution] Match already exists for lawyer ${advogado.id}`)
          continue
        }

        // Criar match
        const match = await prisma.matches.create({
          data: {
            id: nanoid(),
            casoId: caso.id,
            advogadoId: advogado.id,
            score: advogado.matchScore,
            distanciaKm: advogado.distanciaKm,
            status: 'PENDENTE',
            expiresAt,
          },
        })

        // Incrementar contador de leads do advogado
        await prisma.advogados.update({
          where: { id: advogado.id },
          data: {
            leadsRecebidosMes: {
              increment: 1,
            },
            updatedAt: new Date(),
          },
        })

        matchesCreated.push(match.id)
        console.log(
          `[Distribution] Match created: ${match.id} | Lawyer: ${advogado.id} | Score: ${advogado.matchScore}`
        )
      } catch (error) {
        console.error(`[Distribution] Error creating match for lawyer ${advogado.id}:`, error)
        // Continuar com próximo advogado
      }
    }

    console.log(`[Distribution] Created ${matchesCreated.length} matches for case ${casoId}`)

    return {
      matchesCreated: matchesCreated.length,
      advogadosNotificados: advogadosParaMatch.map((a) => a.id),
    }
  }

  /**
   * Encontra advogados compatíveis com o caso
   * Retorna lista ordenada por score (maior primeiro)
   */
  private static async findCompatibleLawyers(
    caso: any,
    minScore: number
  ): Promise<
    Array<{
      id: string
      matchScore: number
      distanciaKm: number | null
    }>
  > {
    // Buscar todos os advogados ativos
    const advogados = await prisma.advogados.findMany({
      where: {
        users: {
          status: 'ACTIVE',
        },
        onboardingCompleted: true,
      },
      include: {
        users: true,
        advogado_especialidades: {
          include: {
            especialidades: true,
          },
        },
      },
    })

    const advogadosCompativeis: Array<{
      id: string
      matchScore: number
      distanciaKm: number | null
    }> = []

    for (const advogado of advogados) {
      // 1. Verificar limite de leads
      if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
        console.log(`[Distribution] Lawyer ${advogado.id} reached monthly limit`)
        continue
      }

      // 2. Calcular score de compatibilidade
      const score = this.calculateMatchScore(caso, advogado)

      if (score < minScore) {
        continue
      }

      // 3. Calcular distância (se ambos têm coordenadas)
      let distanciaKm: number | null = null
      if (
        caso.cidadaos.latitude &&
        caso.cidadaos.longitude &&
        advogado.latitude &&
        advogado.longitude
      ) {
        distanciaKm = this.calculateDistance(
          caso.cidadaos.latitude,
          caso.cidadaos.longitude,
          advogado.latitude,
          advogado.longitude
        )

        // Verificar raio de atuação
        if (distanciaKm > advogado.raioAtuacao) {
          continue
        }
      } else {
        // Se não tem coordenadas, verificar se está no mesmo estado
        if (caso.cidadaos.estado !== advogado.estado) {
          continue
        }
      }

      advogadosCompativeis.push({
        id: advogado.id,
        matchScore: score,
        distanciaKm,
      })
    }

    // Ordenar por score (maior primeiro)
    advogadosCompativeis.sort((a, b) => b.matchScore - a.matchScore)

    return advogadosCompativeis
  }

  /**
   * Calcula score de compatibilidade (0-100)
   *
   * Fatores:
   * - Especialidade match (0-40 pontos)
   * - Localização (0-30 pontos)
   * - Urgência match (0-10 pontos)
   * - Histórico/avaliações (0-20 pontos)
   */
  private static calculateMatchScore(caso: any, advogado: any): number {
    let score = 0

    // 1. Especialidade (0-40 pontos)
    if (caso.especialidadeId) {
      const temEspecialidade = advogado.advogado_especialidades.some(
        (e: any) => e.especialidades.id === caso.especialidadeId
      )
      if (temEspecialidade) {
        score += 40 // Match perfeito
      } else {
        score += 10 // Pode atender mesmo sem especialidade específica
      }
    } else {
      score += 20 // Caso sem especialidade definida = score médio
    }

    // 2. Localização (0-30 pontos)
    if (caso.cidadaos.estado === advogado.estado) {
      score += 20 // Mesmo estado

      if (caso.cidadaos.cidade === advogado.cidade) {
        score += 10 // Mesma cidade = bonus
      }
    }

    // 3. Urgência (0-10 pontos)
    // Advogados premium/basic recebem bonus para casos urgentes
    if (caso.urgencia === 'ALTA' || caso.urgencia === 'URGENTE') {
      if (advogado.plano === 'PREMIUM') {
        score += 10
      } else if (advogado.plano === 'BASIC') {
        score += 5
      }
    }

    // 4. Histórico (0-20 pontos)
    // TODO: Implementar quando tivermos avaliações
    // Por enquanto, dar bonus baseado no plano
    if (advogado.plano === 'PREMIUM') {
      score += 15
    } else if (advogado.plano === 'BASIC') {
      score += 10
    } else {
      score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Calcula distância entre duas coordenadas (fórmula de Haversine)
   * Retorna distância em KM
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Arredondar para 1 casa decimal
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Expira matches pendentes que passaram do prazo
   * Executado por cron job
   */
  static async expireOldMatches(): Promise<number> {
    const autoExpire = await ConfigService.getBoolean('auto_expire_matches', true)

    if (!autoExpire) {
      return 0
    }

    const result = await prisma.matches.updateMany({
      where: {
        status: {
          in: ['PENDENTE', 'VISUALIZADO'],
        },
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: 'EXPIRADO',
      },
    })

    if (result.count > 0) {
      console.log(`[Distribution] Expired ${result.count} old matches`)
    }

    return result.count
  }

  /**
   * Reseta contador de leads mensais dos advogados
   * Executado por cron job no início de cada mês
   */
  static async resetMonthlyLeadCounters(): Promise<number> {
    const now = new Date()

    // Buscar advogados que precisam de reset (último reset foi há mais de 30 dias)
    const advogadosParaResetar = await prisma.advogados.findMany({
      where: {
        ultimoResetLeads: {
          lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        },
      },
    })

    for (const advogado of advogadosParaResetar) {
      // Determinar novo limite baseado no plano
      let novoLimite = 3 // FREE
      if (advogado.plano === 'BASIC') novoLimite = 10
      if (advogado.plano === 'PREMIUM') novoLimite = 50

      await prisma.advogados.update({
        where: { id: advogado.id },
        data: {
          leadsRecebidosMes: 0,
          leadsLimiteMes: novoLimite,
          ultimoResetLeads: now,
          updatedAt: now,
        },
      })
    }

    console.log(`[Distribution] Reset lead counters for ${advogadosParaResetar.length} lawyers`)

    return advogadosParaResetar.length
  }
}
