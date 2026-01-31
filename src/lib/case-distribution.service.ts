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
    const maxMatches = await ConfigService.get<number>('max_matches_per_caso', 5)
    const minScore = await ConfigService.get<number>('min_match_score', 60)
    const expirationHours = await ConfigService.get<number>('match_expiration_hours', 48)

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
   *
   * Estratégia em camadas:
   * 1. Busca normal: especialidade + localização + score >= minScore
   * 2. Fallback 1: Mesmo estado + maior número de especialidades
   * 3. Fallback 2: Mesmo estado + aleatório
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

    // TIER 1: Busca normal com todas as regras
    console.log('[Distribution] Tier 1: Trying strict matching...')
    const advogadosCompativeis = this.strictMatching(advogados, caso, minScore)

    if (advogadosCompativeis.length > 0) {
      console.log(`[Distribution] Tier 1: Found ${advogadosCompativeis.length} strict matches`)
      return advogadosCompativeis
    }

    // TIER 2: Fallback - Mesmo estado + ordenar por número de especialidades
    console.log('[Distribution] Tier 2: Trying same state + most specialties...')
    const fallback1 = this.fallbackBySpecialties(advogados, caso)

    if (fallback1.length > 0) {
      console.log(`[Distribution] Tier 2: Found ${fallback1.length} matches by specialties`)
      return fallback1
    }

    // TIER 3: Fallback - Mesmo estado + aleatório
    console.log('[Distribution] Tier 3: Trying random from same state...')
    const fallback2 = this.fallbackRandomSameState(advogados, caso)

    if (fallback2.length > 0) {
      console.log(`[Distribution] Tier 3: Found ${fallback2.length} random matches`)
      return fallback2
    }

    console.log('[Distribution] No compatible lawyers found in any tier')
    return []
  }

  /**
   * Tier 1: Matching estrito com todas as regras
   */
  private static strictMatching(
    advogados: any[],
    caso: any,
    minScore: number
  ): Array<{
    id: string
    matchScore: number
    distanciaKm: number | null
  }> {
    const advogadosCompativeis: Array<{
      id: string
      matchScore: number
      distanciaKm: number | null
    }> = []

    for (const advogado of advogados) {
      // 1. Verificar limite de leads
      if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
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
   * Tier 2: Mesmo estado + ordenar por número de especialidades
   * Ignora minScore e raioAtuacao, mas respeita limite de leads
   */
  private static fallbackBySpecialties(
    advogados: any[],
    caso: any
  ): Array<{
    id: string
    matchScore: number
    distanciaKm: number | null
  }> {
    const advogadosMesmoEstado: Array<{
      id: string
      matchScore: number
      distanciaKm: number | null
      numEspecialidades: number
    }> = []

    for (const advogado of advogados) {
      // Verificar limite de leads
      if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
        continue
      }

      // Verificar se está no mesmo estado
      if (caso.cidadaos.estado !== advogado.estado) {
        continue
      }

      // Calcular score (mesmo que não atinja minScore)
      const score = this.calculateMatchScore(caso, advogado)

      // Calcular distância se possível
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
      }

      advogadosMesmoEstado.push({
        id: advogado.id,
        matchScore: score,
        distanciaKm,
        numEspecialidades: advogado.advogado_especialidades.length,
      })
    }

    // Ordenar por: 1) número de especialidades (desc), 2) score (desc)
    advogadosMesmoEstado.sort((a, b) => {
      if (b.numEspecialidades !== a.numEspecialidades) {
        return b.numEspecialidades - a.numEspecialidades
      }
      return b.matchScore - a.matchScore
    })

    // Remover campo auxiliar antes de retornar
    return advogadosMesmoEstado.map(({ id, matchScore, distanciaKm }) => ({
      id,
      matchScore,
      distanciaKm,
    }))
  }

  /**
   * Tier 3: Mesmo estado + aleatório
   * Última tentativa - ignora score, raio, especialidades
   */
  private static fallbackRandomSameState(
    advogados: any[],
    caso: any
  ): Array<{
    id: string
    matchScore: number
    distanciaKm: number | null
  }> {
    const advogadosMesmoEstado: Array<{
      id: string
      matchScore: number
      distanciaKm: number | null
    }> = []

    for (const advogado of advogados) {
      // Verificar limite de leads
      if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
        continue
      }

      // Verificar se está no mesmo estado
      if (caso.cidadaos.estado !== advogado.estado) {
        continue
      }

      // Calcular score e distância
      const score = this.calculateMatchScore(caso, advogado)

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
      }

      advogadosMesmoEstado.push({
        id: advogado.id,
        matchScore: score,
        distanciaKm,
      })
    }

    // Embaralhar aleatoriamente
    for (let i = advogadosMesmoEstado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[advogadosMesmoEstado[i], advogadosMesmoEstado[j]] = [
        advogadosMesmoEstado[j],
        advogadosMesmoEstado[i],
      ]
    }

    return advogadosMesmoEstado
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
   * Redistribui casos ABERTOS sem matches quando advogado está disponível
   * Chamado no login do advogado
   *
   * Regras:
   * - Advogado não pode ter mais de 2 matches PENDENTES
   * - Advogado deve ter cota de leads disponível
   * - Apenas casos ABERTOS sem nenhum match
   */
  static async redistributeCasesForLawyer(advogadoId: string): Promise<{
    casosDistribuidos: number
    matchesCriados: number
  }> {
    console.log(`[Redistribution] Checking cases for lawyer ${advogadoId}`)

    // 1. Verificar se advogado está elegível
    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: true,
        matches: {
          where: { status: 'PENDENTE' },
        },
      },
    })

    if (!advogado) {
      console.log('[Redistribution] Lawyer not found')
      return { casosDistribuidos: 0, matchesCriados: 0 }
    }

    // Verificar se tem mais de 2 pendentes
    if (advogado.matches.length >= 2) {
      console.log(
        `[Redistribution] Lawyer has ${advogado.matches.length} pending matches (max 2)`
      )
      return { casosDistribuidos: 0, matchesCriados: 0 }
    }

    // Verificar cota de leads
    if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
      console.log(
        `[Redistribution] Lawyer reached monthly limit (${advogado.leadsRecebidosMes}/${advogado.leadsLimiteMes})`
      )
      return { casosDistribuidos: 0, matchesCriados: 0 }
    }

    // 2. Buscar casos ABERTOS sem matches no mesmo estado
    const casosOrfaos = await prisma.casos.findMany({
      where: {
        status: 'ABERTO',
        matches: {
          none: {}, // Casos sem nenhum match
        },
        cidadaos: {
          estado: advogado.estado, // Mesmo estado do advogado
        },
      },
      include: {
        cidadaos: true,
        especialidades: true,
      },
      orderBy: {
        createdAt: 'asc', // Casos mais antigos primeiro
      },
    })

    console.log(
      `[Redistribution] Found ${casosOrfaos.length} orphan cases in state ${advogado.estado}`
    )

    if (casosOrfaos.length === 0) {
      return { casosDistribuidos: 0, matchesCriados: 0 }
    }

    // 3. Tentar distribuir cada caso
    let casosDistribuidos = 0
    let matchesCriados = 0

    for (const caso of casosOrfaos) {
      try {
        console.log(`[Redistribution] Attempting to distribute case ${caso.id}`)

        const result = await this.distributeCase(caso.id)

        if (result.matchesCreated > 0) {
          casosDistribuidos++
          matchesCriados += result.matchesCreated
          console.log(`[Redistribution] Case ${caso.id} distributed successfully`)
        }
      } catch (error) {
        console.error(`[Redistribution] Failed to distribute case ${caso.id}:`, error)
      }
    }

    console.log(
      `[Redistribution] Completed for lawyer ${advogadoId}: ${casosDistribuidos} cases, ${matchesCriados} matches`
    )

    return { casosDistribuidos, matchesCriados }
  }

  /**
   * Expira matches pendentes que passaram do prazo
   * Executado por cron job
   */
  static async expireOldMatches(): Promise<number> {
    const autoExpire = await ConfigService.get<boolean>('auto_expire_matches', true)

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
