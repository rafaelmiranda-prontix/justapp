import OpenAI from 'openai'
import { AIProvider, AICompletionRequest, AICompletionResponse } from '../types'

export class OpenAIProvider implements AIProvider {
  public readonly name = 'OpenAI GPT'
  private client: OpenAI
  private model: string
  private fallbackModel?: string

  constructor(apiKey: string, model: string = 'gpt-4o', fallbackModel?: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
    this.fallbackModel = fallbackModel
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: request.systemPrompt,
        },
        ...request.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ]

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
      })

      const content = response.choices[0]?.message?.content || ''

      return {
        content,
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
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
