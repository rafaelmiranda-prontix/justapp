import { PreQualificationState, PreQualificationQuestion } from './types'
import { PRE_QUALIFICATION_FLOW, WELCOME_MESSAGE, COMPLETION_MESSAGE } from './questions'

/**
 * Serviço de pré-qualificação baseado em regras
 * SEM custos de IA - processamento local
 */
export class PreQualificationService {
  /**
   * Inicia novo fluxo de pré-qualificação
   */
  static initializeState(): PreQualificationState {
    return {
      currentQuestionId: 'welcome',
      answers: {},
      extractedData: {},
      completed: false,
      score: 0,
    }
  }

  /**
   * Processa resposta do usuário e retorna próxima pergunta
   */
  static processAnswer(
    state: PreQualificationState,
    answer: string
  ): {
    nextMessage: string
    updatedState: PreQualificationState
    isComplete: boolean
  } {
    const currentQuestion = PRE_QUALIFICATION_FLOW[state.currentQuestionId]

    if (!currentQuestion) {
      throw new Error(`Pergunta não encontrada: ${state.currentQuestionId}`)
    }

    // Salvar resposta
    const updatedAnswers = {
      ...state.answers,
      [currentQuestion.id]: answer,
    }

    // Aplicar regras de scoring
    let updatedExtractedData = { ...state.extractedData }
    if (currentQuestion.scoringRules) {
      for (const rule of currentQuestion.scoringRules) {
        if (rule.condition(answer)) {
          if (rule.field === 'viabilidade') {
            updatedExtractedData.viabilidade = parseInt(rule.value)
          } else if (rule.field === 'localizacao') {
            // localizacao é tratada separadamente no processamento de localização
            // Não precisa ser armazenada em extractedData
          } else if (rule.field === 'especialidade' || rule.field === 'urgencia') {
            (updatedExtractedData as any)[rule.field] = rule.value
          }
        }
      }
    }

    // Processar localização
    if (currentQuestion.type === 'location') {
      const locationData = this.parseLocation(answer)
      updatedExtractedData = {
        ...updatedExtractedData,
        ...locationData,
      }
    }

    // Determinar próxima pergunta
    let nextQuestionId: string | null = null

    if (typeof currentQuestion.nextQuestion === 'function') {
      nextQuestionId = currentQuestion.nextQuestion(answer)
    } else {
      nextQuestionId = currentQuestion.nextQuestion || null
    }

    // Se não há próxima pergunta, fluxo completo
    if (!nextQuestionId) {
      const score = this.calculateScore(updatedExtractedData, updatedAnswers)

      return {
        nextMessage: COMPLETION_MESSAGE(score, updatedExtractedData.especialidade),
        updatedState: {
          currentQuestionId: '',
          answers: updatedAnswers,
          extractedData: updatedExtractedData,
          completed: true,
          score,
        },
        isComplete: true,
      }
    }

    // Retornar próxima pergunta
    const nextQuestion = PRE_QUALIFICATION_FLOW[nextQuestionId]

    const updatedState: PreQualificationState = {
      currentQuestionId: nextQuestionId,
      answers: updatedAnswers,
      extractedData: updatedExtractedData,
      completed: false,
      score: 0,
    }

    return {
      nextMessage: this.formatQuestion(nextQuestion),
      updatedState,
      isComplete: false,
    }
  }

  /**
   * Formata pergunta com opções (se houver)
   */
  private static formatQuestion(question: PreQualificationQuestion): string {
    if (question.type === 'choice' && question.options) {
      const optionsList = question.options
        .map((opt, idx) => `${idx + 1}. ${opt}`)
        .join('\n')

      return `${question.text}\n\n${optionsList}\n\n💬 Responda com o número ou texto da opção.`
    }

    return question.text
  }

  /**
   * Processa resposta de escolha múltipla
   */
  static normalizeChoiceAnswer(answer: string, question: PreQualificationQuestion): string {
    if (question.type !== 'choice' || !question.options) {
      return answer
    }

    // Se resposta é um número
    const numMatch = answer.match(/^(\d+)/)
    if (numMatch) {
      const index = parseInt(numMatch[1]) - 1
      if (index >= 0 && index < question.options.length) {
        return question.options[index]
      }
    }

    // Procurar por match parcial nas opções
    const lowerAnswer = answer.toLowerCase()
    for (const option of question.options) {
      if (option.toLowerCase().includes(lowerAnswer) || lowerAnswer.includes(option.toLowerCase())) {
        return option
      }
    }

    return answer
  }

  /**
   * Faz parse de localização no formato "Cidade, UF"
   */
  private static parseLocation(location: string): {
    cidade?: string
    estado?: string
  } {
    const parts = location.split(',').map(p => p.trim())

    if (parts.length >= 2) {
      return {
        cidade: parts[0],
        estado: this.normalizeEstado(parts[1]),
      }
    }

    return {}
  }

  /**
   * Normaliza sigla de estado
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
   * Calcula score final (0-100)
   */
  private static calculateScore(
    extractedData: PreQualificationState['extractedData'],
    answers: Record<string, string>
  ): number {
    let score = 50 // Base score

    // Bonus por especialidade identificada (+15)
    if (extractedData.especialidade) {
      score += 15
    }

    // Bonus por viabilidade
    if (extractedData.viabilidade) {
      score = Math.max(score, extractedData.viabilidade)
    }

    // Bonus por urgência definida (+10)
    if (extractedData.urgencia) {
      score += 10
    }

    // Bonus por localização (+5)
    if (extractedData.cidade && extractedData.estado) {
      score += 5
    }

    // Bonus por respostas completas
    const totalQuestions = Object.keys(answers).length
    if (totalQuestions >= 4) {
      score += 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Retorna mensagem de boas-vindas
   */
  static getWelcomeMessage(): string {
    return WELCOME_MESSAGE
  }
}
