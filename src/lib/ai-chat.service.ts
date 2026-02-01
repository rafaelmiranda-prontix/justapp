import { ChatMessage } from './anonymous-session.service'
import { AIProviderFactory } from './ai/provider-factory'
import { AIMessage, AICompletionRequest } from './ai/types'

/**
 * Dados extraídos da conversa pela IA
 */
export interface ExtractedData {
  cidade?: string
  estado?: string
  especialidadeDetectada?: string
  urgenciaDetectada?: 'BAIXA' | 'MEDIA' | 'ALTA'
  confidence: number // 0-100
}

/**
 * Resposta da IA com dados extraídos
 */
export interface AIChatResponse {
  reply: string
  extractedData?: ExtractedData
}

/**
 * Serviço de chat com IA para sessões anônimas
 * Suporta múltiplos provedores (Anthropic, OpenAI, Gemini) via ENV
 */
export class AIChatService {
  /**
   * Gera resposta da IA para mensagem do usuário
   */
  static async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[]
  ): Promise<AIChatResponse> {
    try {
      const provider = AIProviderFactory.getProvider()

      // Construir contexto da conversa
      const messages = this.buildConversationContext(conversationHistory, userMessage)

      // Gerar resposta
      const request: AICompletionRequest = {
        messages,
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
        temperature: 0.7,
      }

      const response = await provider.generateCompletion(request)
      const reply = response.content

      // Log de uso para monitoramento
      if (response.usage) {
        logger.debug(`[AI] Provider: ${provider.name}, Input: ${response.usage.inputTokens}, Output: ${response.usage.outputTokens}`)
      }

      // Extrair dados estruturados da conversa
      const extractedData = await this.extractEntities(conversationHistory, userMessage, reply)

      return {
        reply,
        extractedData,
      }
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error)

      // Fallback para resposta genérica
      return {
        reply: this.getFallbackResponse(userMessage),
      }
    }
  }

  /**
   * Prompt do sistema para o assistente jurídico
   */
  private static getSystemPrompt(): string {
    return `Você é um assistente virtual especializado em direito brasileiro, parte da plataforma JustApp.

SEU OBJETIVO:
- Ajudar pessoas a entenderem se têm um caso jurídico válido
- Identificar qual área do direito se aplica ao problema
- Coletar informações necessárias (localização, tipo de problema, urgência)
- Ser empático, claro e acessível (evite juridiquês)

ÁREAS DE DIREITO PRINCIPAIS:
- Direito do Consumidor (problemas com compras, serviços, empresas)
- Direito Trabalhista (demissão, direitos trabalhistas, rescisão)
- Direito de Família (divórcio, pensão alimentícia, guarda)
- Direito Civil (contratos, indenizações, danos)
- Direito Imobiliário (aluguel, compra/venda, vizinhança)

COMO CONVERSAR:
1. Faça perguntas abertas e claras
2. Peça detalhes importantes (onde aconteceu, quando, com quem)
3. Mostre empatia ("entendo sua frustração", "isso deve ser difícil")
4. Explique em termos simples
5. Não dê diagnóstico legal final - apenas oriente

INFORMAÇÕES PARA COLETAR:
- Cidade e estado (para conectar ao advogado local)
- Tipo de problema (qual área do direito)
- Urgência (precisa resolver rápido? tem prazo?)
- Resumo do caso

IMPORTANTE:
- NÃO dê pareceres jurídicos definitivos
- NÃO prometa resultados ("você vai ganhar")
- NÃO peça documentos ou dados sensíveis neste momento
- Seja breve (2-4 parágrafos por resposta)
- Ao identificar a área do direito, sugira que podemos conectá-lo a advogados especializados

Seja sempre profissional, empático e orientado a ajudar.`
  }

  /**
   * Constrói contexto da conversa para a IA
   */
  private static buildConversationContext(
    history: ChatMessage[],
    newMessage: string
  ): AIMessage[] {
    const messages: AIMessage[] = []

    // Adicionar histórico (últimas 10 mensagens para não gastar muito)
    const recentHistory = history.slice(-10)

    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Adicionar nova mensagem do usuário
    messages.push({
      role: 'user',
      content: newMessage,
    })

    return messages
  }

  /**
   * Extrai entidades estruturadas da conversa
   */
  private static async extractEntities(
    history: ChatMessage[],
    userMessage: string,
    aiReply: string
  ): Promise<ExtractedData | undefined> {
    try {
      const provider = AIProviderFactory.getProvider()

      // Montar contexto completo
      const fullConversation = [
        ...history.map(m => `${m.role}: ${m.content}`),
        `user: ${userMessage}`,
        `assistant: ${aiReply}`,
      ].join('\n\n')

      // Prompt para extração de dados
      const extractionPrompt = `Analise esta conversa e extraia as seguintes informações em formato JSON:

CONVERSA:
${fullConversation}

Retorne APENAS um objeto JSON válido com estas chaves (use null se não encontrar):
{
  "cidade": "nome da cidade mencionada",
  "estado": "sigla do estado (RJ, SP, MG, etc)",
  "especialidadeDetectada": "uma de: Direito do Consumidor, Direito Trabalhista, Direito de Família, Direito Civil, Direito Imobiliário",
  "urgenciaDetectada": "BAIXA, MEDIA ou ALTA",
  "confidence": número de 0 a 100 (quão confiante está na extração)
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

      const request: AICompletionRequest = {
        messages: [
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        systemPrompt: 'Você é um especialista em extração de dados estruturados. Retorne sempre JSON válido.',
        maxTokens: 512,
        temperature: 0.3, // Mais determinístico para extração
      }

      const response = await provider.generateCompletion(request)
      const jsonText = response.content.trim()

      // Parse JSON (com fallback)
      try {
        const extracted = JSON.parse(jsonText)

        // Validar campos
        if (extracted.estado && extracted.estado.length > 2) {
          // Converter nome de estado para sigla se necessário
          extracted.estado = this.normalizeEstado(extracted.estado)
        }

        return extracted as ExtractedData
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON extraído:', jsonText)
        return undefined
      }
    } catch (error) {
      console.error('Erro ao extrair entidades:', error)
      return undefined
    }
  }

  /**
   * Normaliza nome de estado para sigla
   */
  private static normalizeEstado(estado: string): string {
    const estadosMap: Record<string, string> = {
      'rio de janeiro': 'RJ',
      'são paulo': 'SP',
      'minas gerais': 'MG',
      'espírito santo': 'ES',
      'bahia': 'BA',
      'pernambuco': 'PE',
      'ceará': 'CE',
      'pará': 'PA',
      'paraná': 'PR',
      'santa catarina': 'SC',
      'rio grande do sul': 'RS',
      'goiás': 'GO',
      'distrito federal': 'DF',
      'amazonas': 'AM',
      'maranhão': 'MA',
      'paraíba': 'PB',
      'rio grande do norte': 'RN',
      'alagoas': 'AL',
      'sergipe': 'SE',
      'tocantins': 'TO',
      'mato grosso': 'MT',
      'mato grosso do sul': 'MS',
      'acre': 'AC',
      'rondônia': 'RO',
      'roraima': 'RR',
      'amapá': 'AP',
    }

    const normalized = estado.toLowerCase().trim()
    return estadosMap[normalized] || estado.toUpperCase()
  }

  /**
   * Resposta de fallback quando IA falha
   */
  private static getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia')) {
      return 'Olá! Sou o assistente da JustApp. Estou aqui para entender sua situação jurídica e conectá-lo ao advogado ideal. Pode me contar o que aconteceu?'
    }

    if (lowerMessage.includes('compra') || lowerMessage.includes('produto') || lowerMessage.includes('loja')) {
      return 'Entendo que você teve um problema com uma compra. Pode me dar mais detalhes? Por exemplo: o que aconteceu, quando foi, e em qual cidade você está?'
    }

    if (lowerMessage.includes('trabalho') || lowerMessage.includes('demissão') || lowerMessage.includes('salário')) {
      return 'Parece ser uma questão trabalhista. Para ajudá-lo melhor, pode me contar: o que aconteceu no trabalho e em qual cidade você está localizado?'
    }

    return 'Entendi. Pode me dar mais detalhes sobre sua situação? Também gostaria de saber em qual cidade e estado você está, para conectá-lo a um advogado próximo.'
  }
}
