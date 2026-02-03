import { prisma } from './prisma'

/**
 * Serviço para gerenciar configurações da aplicação
 * Todas as configurações são armazenadas no banco e podem ser alteradas sem redeploy
 */

// Cache em memória para evitar queries repetidas
const configCache = new Map<string, { value: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export class ConfigService {
  /**
   * Busca uma configuração por chave
   */
  static async get<T = string>(
    chave: string,
    defaultValue?: T
  ): Promise<T> {
    // Verifica cache
    const cached = configCache.get(chave)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value as T
    }

    try {
      const config = await prisma.configuracoes.findUnique({
        where: { chave },
      })

      if (!config) {
        if (defaultValue !== undefined) {
          return defaultValue
        }
        throw new Error(`Configuração não encontrada: ${chave}`)
      }

      // Converte valor baseado no tipo
      const value = this.convertValue(config.valor, config.tipo) as T

      // Atualiza cache
      configCache.set(chave, { value, timestamp: Date.now() })

      return value
    } catch (error) {
      console.error(`Erro ao buscar configuração ${chave}:`, error)
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw error
    }
  }

  /**
   * Busca múltiplas configurações de uma categoria
   */
  static async getByCategory(categoria: string): Promise<Record<string, any>> {
      const configs = await prisma.configuracoes.findMany({
      where: { categoria },
    })

    const result: Record<string, any> = {}
    for (const config of configs) {
      result[config.chave] = this.convertValue(config.valor, config.tipo)
    }

    return result
  }

  /**
   * Atualiza uma configuração
   */
  static async set(chave: string, valor: string): Promise<void> {
    await prisma.configuracoes.update({
      where: { chave },
      data: { valor },
    })

    // Limpa cache
    configCache.delete(chave)
  }

  /**
   * Limpa todo o cache
   */
  static clearCache(): void {
    configCache.clear()
  }

  /**
   * Converte valor baseado no tipo
   */
  private static convertValue(valor: string, tipo: string): any {
    switch (tipo) {
      case 'NUMBER':
        return Number(valor)
      case 'BOOLEAN':
        return valor === 'true'
      case 'JSON':
        return JSON.parse(valor)
      case 'STRING':
      default:
        return valor
    }
  }

  // ============ Helpers para configurações específicas ============

  /**
   * Retorna tempo de expiração de matches em horas
   */
  static async getMatchExpirationHours(): Promise<number> {
    return this.get<number>('match_expiration_hours', 48)
  }

  /**
   * Retorna número máximo de matches por caso
   */
  static async getMaxMatchesPerCaso(): Promise<number> {
    return this.get<number>('max_matches_per_caso', 5)
  }

  /**
   * Retorna score mínimo para criar match
   */
  static async getMinMatchScore(): Promise<number> {
    return this.get<number>('min_match_score', 60)
  }

  /**
   * Verifica se deve expirar matches automaticamente
   */
  static async shouldAutoExpireMatches(): Promise<boolean> {
    return this.get<boolean>('auto_expire_matches', true)
  }

  /**
   * Retorna limite de leads para um plano específico
   */
  static async getPlanLeadsLimit(plano: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<number> {
    const chave = `${plano.toLowerCase()}_plan_monthly_leads`
    return this.get<number>(chave, plano === 'FREE' ? 3 : plano === 'BASIC' ? 10 : 50)
  }

  /**
   * Verifica se chat só funciona após aceitar
   */
  static async isChatOnlyAfterAccept(): Promise<boolean> {
    return this.get<boolean>('chat_only_after_accept', true)
  }

  /**
   * Retorna tamanho máximo de anexo em MB
   */
  static async getMaxAttachmentSizeMb(): Promise<number> {
    return this.get<number>('max_attachment_size_mb', 20)
  }

  /**
   * Retorna horas para lembrete de expiração
   */
  static async getMatchExpiringReminderHours(): Promise<number> {
    return this.get<number>('notify_match_expiring_hours', 6)
  }

  /**
   * Verifica se deve enviar notificação de novo match
   */
  static async shouldNotifyMatchCreated(): Promise<boolean> {
    return this.get<boolean>('notify_match_created', true)
  }

  /**
   * Verifica se deve enviar notificação de match aceito
   */
  static async shouldNotifyMatchAccepted(): Promise<boolean> {
    return this.get<boolean>('notify_match_accepted', true)
  }

  /**
   * Verifica se está em modo manutenção
   */
  static async isMaintenanceMode(): Promise<boolean> {
    return this.get<boolean>('maintenance_mode', false)
  }

  /**
   * Verifica se está em modo beta
   */
  static async isBetaMode(): Promise<boolean> {
    return this.get<boolean>('beta_mode', true)
  }

  /**
   * Retorna dias necessários após aceitar para permitir avaliação
   */
  static async getAllowReviewsAfterDays(): Promise<number> {
    return this.get<number>('allow_reviews_after_days', 1)
  }

  /**
   * Verifica se comentário é obrigatório nas avaliações
   */
  static async isReviewCommentRequired(): Promise<boolean> {
    return this.get<boolean>('require_review_comment', false)
  }

  /**
   * Retorna o número máximo de redistribuições permitidas por caso
   */
  static async getMaxRedistributionsPerCase(): Promise<number> {
    return this.get<number>('max_redistributions_per_case', 3)
  }
}

// Exporta instância padrão e helpers individuais
export const getConfig = ConfigService.get.bind(ConfigService)
export const setConfig = ConfigService.set.bind(ConfigService)
export const getConfigByCategory = ConfigService.getByCategory.bind(ConfigService)
export const clearConfigCache = ConfigService.clearCache.bind(ConfigService)
