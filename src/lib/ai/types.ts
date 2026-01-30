/**
 * Tipos compartilhados para provedores de IA
 */

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  systemPrompt: string
  maxTokens?: number
  temperature?: number
}

export interface AICompletionResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

/**
 * Interface base para provedores de IA
 */
export interface AIProvider {
  name: string
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>
  supportsStreaming(): boolean
}

/**
 * Tipos de provedores disponíveis
 */
export type AIProviderType = 'anthropic' | 'openai' | 'gemini'

/**
 * Configuração de provedor de IA
 */
export interface AIProviderConfig {
  type: AIProviderType
  apiKey: string
  model: string
  fallbackModel?: string
}
