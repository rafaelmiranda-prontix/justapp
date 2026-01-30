import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, AICompletionRequest, AICompletionResponse } from '../types'

export class AnthropicProvider implements AIProvider {
  public readonly name = 'Anthropic Claude'
  private client: Anthropic
  private model: string
  private fallbackModel?: string

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022', fallbackModel?: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
    this.fallbackModel = fallbackModel
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        system: request.systemPrompt,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      })

      const content = response.content[0].type === 'text' ? response.content[0].text : ''

      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    } catch (error: any) {
      // Tentar fallback se disponível
      if (this.fallbackModel && error.status === 429) {
        console.warn(`Rate limit no modelo ${this.model}, tentando ${this.fallbackModel}`)
        const originalModel = this.model
        this.model = this.fallbackModel
        try {
          return await this.generateCompletion(request)
        } finally {
          this.model = originalModel
        }
      }
      throw error
    }
  }

  supportsStreaming(): boolean {
    return true
  }
}
