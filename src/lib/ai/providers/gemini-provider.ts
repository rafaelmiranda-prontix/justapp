import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, AICompletionRequest, AICompletionResponse } from '../types'

export class GeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini'
  private client: GoogleGenerativeAI
  private model: string
  private fallbackModel?: string

  constructor(apiKey: string, model: string = 'gemini-1.5-pro', fallbackModel?: string) {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
    this.fallbackModel = fallbackModel
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: request.systemPrompt,
      })

      // Construir histórico de chat
      const history = request.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7,
        },
      })

      // Última mensagem é a pergunta atual
      const lastMessage = request.messages[request.messages.length - 1]
      const result = await chat.sendMessage(lastMessage.content)
      const response = result.response

      return {
        content: response.text(),
        usage: response.usageMetadata ? {
          inputTokens: response.usageMetadata.promptTokenCount || 0,
          outputTokens: response.usageMetadata.candidatesTokenCount || 0,
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
