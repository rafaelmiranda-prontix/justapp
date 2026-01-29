import { z } from 'zod'

// Schema para a resposta da IA
const aiAnalysisSchema = z.object({
  especialidade: z.string(),
  especialidadeId: z.string().optional(),
  urgencia: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']),
  resumo: z.string(),
  complexidade: z.number().min(1).max(5),
  perguntasAdicionais: z.array(z.string()).optional(),
})

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>

/**
 * Analisa a descrição do caso usando IA (OpenAI/Claude)
 */
export async function analyzeCaseWithAI(description: string): Promise<AIAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('No AI API key found, using fallback rule-based analysis')
    return analyzeCaseRuleBased(description)
  }

  try {
    // Implementação com Claude/OpenAI
    // Por enquanto, retorna fallback
    return analyzeCaseRuleBased(description)
  } catch (error) {
    console.error('Error analyzing with AI:', error)
    return analyzeCaseRuleBased(description)
  }
}

/**
 * Fallback: Análise baseada em regras (sem IA)
 */
export function analyzeCaseRuleBased(description: string): AIAnalysis {
  const lowerDesc = description.toLowerCase()

  // Palavras-chave por especialidade
  const keywords = {
    consumidor: [
      'produto',
      'defeito',
      'loja',
      'compra',
      'venda',
      'garantia',
      'troca',
      'devolução',
      'cobrança indevida',
      'atendimento',
      'sac',
      'empresa',
    ],
    trabalhista: [
      'trabalho',
      'emprego',
      'demissão',
      'rescisão',
      'salário',
      'horas extras',
      'férias',
      'justa causa',
      'clt',
      'carteira',
      'patrão',
    ],
    familia: [
      'divórcio',
      'separação',
      'pensão',
      'alimentos',
      'guarda',
      'filho',
      'partilha',
      'bens',
      'casamento',
      'união estável',
    ],
    imobiliario: [
      'imóvel',
      'casa',
      'apartamento',
      'aluguel',
      'locação',
      'despejo',
      'proprietário',
      'inquilino',
      'financiamento',
    ],
  }

  // Detectar especialidade
  let especialidade = 'Direito do Consumidor' // default
  let maxMatches = 0

  for (const [area, words] of Object.entries(keywords)) {
    const matches = words.filter((word) => lowerDesc.includes(word)).length
    if (matches > maxMatches) {
      maxMatches = matches
      especialidade =
        area === 'consumidor'
          ? 'Direito do Consumidor'
          : area === 'trabalhista'
            ? 'Direito Trabalhista'
            : area === 'familia'
              ? 'Direito de Família'
              : 'Direito Imobiliário'
    }
  }

  // Detectar urgência
  const urgentWords = ['urgente', 'rápido', 'imediato', 'hoje', 'agora']
  const highWords = ['preciso', 'importante', 'logo', 'breve']

  let urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE' = 'NORMAL'

  if (urgentWords.some((word) => lowerDesc.includes(word))) {
    urgencia = 'URGENTE'
  } else if (highWords.some((word) => lowerDesc.includes(word))) {
    urgencia = 'ALTA'
  }

  // Complexidade baseada no tamanho e detalhes
  const wordCount = description.split(/\s+/).length
  let complexidade = 1

  if (wordCount > 200) complexidade = 5
  else if (wordCount > 100) complexidade = 4
  else if (wordCount > 50) complexidade = 3
  else if (wordCount > 20) complexidade = 2

  // Resumo (primeiras 150 chars)
  const resumo = description.substring(0, 150) + (description.length > 150 ? '...' : '')

  return {
    especialidade,
    urgencia,
    resumo,
    complexidade,
  }
}
