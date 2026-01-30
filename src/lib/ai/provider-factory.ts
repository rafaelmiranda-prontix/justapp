import { AIProvider, AIProviderType } from './types'
import { AnthropicProvider } from './providers/anthropic-provider'
import { OpenAIProvider } from './providers/openai-provider'
import { GeminiProvider } from './providers/gemini-provider'

/**
 * Factory para criar instâncias de providers de IA
 * Configuração via variáveis de ambiente
 */
export class AIProviderFactory {
  private static instances: Map<AIProviderType, AIProvider> = new Map()

  /**
   * Retorna o provider configurado nas variáveis de ambiente
   */
  static getProvider(): AIProvider {
    const providerType = this.getProviderTypeFromEnv()

    // Retornar instância cacheada se existir
    if (this.instances.has(providerType)) {
      return this.instances.get(providerType)!
    }

    // Criar nova instância
    const provider = this.createProvider(providerType)
    this.instances.set(providerType, provider)

    return provider
  }

  /**
   * Limpa cache de instâncias (útil para testes)
   */
  static clearCache(): void {
    this.instances.clear()
  }

  /**
   * Determina qual provider usar baseado em ENV
   */
  private static getProviderTypeFromEnv(): AIProviderType {
    const provider = process.env.AI_PROVIDER?.toLowerCase()

    switch (provider) {
      case 'openai':
        return 'openai'
      case 'gemini':
        return 'gemini'
      case 'anthropic':
      default:
        return 'anthropic' // Default
    }
  }

  /**
   * Cria instância do provider baseado no tipo
   */
  private static createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'anthropic':
        return this.createAnthropicProvider()
      case 'openai':
        return this.createOpenAIProvider()
      case 'gemini':
        return this.createGeminiProvider()
      default:
        throw new Error(`Provider desconhecido: ${type}`)
    }
  }

  /**
   * Cria provider Anthropic
   */
  private static createAnthropicProvider(): AIProvider {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada')
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    const fallbackModel = process.env.ANTHROPIC_FALLBACK_MODEL || 'claude-3-5-haiku-20241022'

    return new AnthropicProvider(apiKey, model, fallbackModel)
  }

  /**
   * Cria provider OpenAI
   */
  private static createOpenAIProvider(): AIProvider {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o'
    const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini'

    return new OpenAIProvider(apiKey, model, fallbackModel)
  }

  /**
   * Cria provider Gemini
   */
  private static createGeminiProvider(): AIProvider {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada')
    }

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash'

    return new GeminiProvider(apiKey, model, fallbackModel)
  }

  /**
   * Retorna informações sobre o provider ativo
   */
  static getActiveProviderInfo(): {
    type: AIProviderType
    name: string
    model: string
  } {
    const type = this.getProviderTypeFromEnv()
    const provider = this.getProvider()

    let model = 'unknown'
    switch (type) {
      case 'anthropic':
        model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
        break
      case 'openai':
        model = process.env.OPENAI_MODEL || 'gpt-4o'
        break
      case 'gemini':
        model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
        break
    }

    return {
      type,
      name: provider.name,
      model,
    }
  }
}
