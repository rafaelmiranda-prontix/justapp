/**
 * Sistema de pré-qualificação baseado em regras (SEM IA)
 * Reduz custos ao usar IA apenas quando necessário
 */

export interface PreQualificationQuestion {
  id: string
  text: string
  type: 'text' | 'choice' | 'location'
  options?: string[]
  nextQuestion?: string | ((answer: string) => string | null)
  scoringRules?: ScoringRule[]
}

export interface ScoringRule {
  field: 'especialidade' | 'urgencia' | 'localizacao' | 'viabilidade'
  condition: (answer: string) => boolean
  value: string
  confidence: number
}

export interface PreQualificationState {
  currentQuestionId: string
  answers: Record<string, string>
  extractedData: {
    especialidade?: string
    urgencia?: 'BAIXA' | 'MEDIA' | 'ALTA'
    cidade?: string
    estado?: string
    viabilidade?: number // 0-100
  }
  completed: boolean
  score: number // 0-100
}

export type QuestionFlow = Record<string, PreQualificationQuestion>
