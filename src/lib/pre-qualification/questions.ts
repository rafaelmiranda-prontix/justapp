import { QuestionFlow, ScoringRule } from './types'

/**
 * Fluxo de perguntas pré-definido
 * Sistema baseado em regras - SEM custos de IA
 */
export const PRE_QUALIFICATION_FLOW: QuestionFlow = {
  welcome: {
    id: 'welcome',
    text: 'Olá! Vou fazer algumas perguntas rápidas para entender melhor seu caso. Qual tipo de problema você está enfrentando?',
    type: 'choice',
    options: [
      'Problema com compra ou serviço',
      'Questão trabalhista',
      'Assunto de família (divórcio, pensão, guarda)',
      'Problema com contrato ou indenização',
      'Questão de aluguel ou imóvel',
      'Outro tipo de problema',
    ],
    nextQuestion: (answer) => {
      if (answer.includes('compra') || answer.includes('serviço')) return 'consumidor_details'
      if (answer.includes('trabalhista')) return 'trabalhista_details'
      if (answer.includes('família')) return 'familia_details'
      if (answer.includes('contrato') || answer.includes('indenização')) return 'civil_details'
      if (answer.includes('aluguel') || answer.includes('imóvel')) return 'imovel_details'
      return 'other_description'
    },
    scoringRules: [
      {
        field: 'especialidade',
        condition: (a) => a.includes('compra') || a.includes('serviço'),
        value: 'Direito do Consumidor',
        confidence: 95,
      },
      {
        field: 'especialidade',
        condition: (a) => a.includes('trabalhista'),
        value: 'Direito Trabalhista',
        confidence: 95,
      },
      {
        field: 'especialidade',
        condition: (a) => a.includes('família'),
        value: 'Direito de Família',
        confidence: 95,
      },
      {
        field: 'especialidade',
        condition: (a) => a.includes('contrato') || a.includes('indenização'),
        value: 'Direito Civil',
        confidence: 90,
      },
      {
        field: 'especialidade',
        condition: (a) => a.includes('aluguel') || a.includes('imóvel'),
        value: 'Direito Imobiliário',
        confidence: 95,
      },
    ],
  },

  consumidor_details: {
    id: 'consumidor_details',
    text: 'Entendi que é um problema de consumo. Você já tentou resolver diretamente com a empresa?',
    type: 'choice',
    options: ['Sim, mas não resolveram', 'Não, ainda não tentei', 'Tentei mas me ignoraram'],
    nextQuestion: 'urgency',
    scoringRules: [
      {
        field: 'viabilidade',
        condition: (a) => a.includes('não resolveram') || a.includes('ignoraram'),
        value: '80',
        confidence: 85,
      },
      {
        field: 'viabilidade',
        condition: (a) => a.includes('ainda não'),
        value: '60',
        confidence: 70,
      },
    ],
  },

  trabalhista_details: {
    id: 'trabalhista_details',
    text: 'Sobre a questão trabalhista, você foi demitido ou ainda está empregado?',
    type: 'choice',
    options: ['Fui demitido', 'Ainda estou empregado', 'Estou pedindo demissão'],
    nextQuestion: 'urgency',
    scoringRules: [
      {
        field: 'urgencia',
        condition: (a) => a.includes('demitido'),
        value: 'ALTA',
        confidence: 85,
      },
      {
        field: 'viabilidade',
        condition: (a) => a.includes('demitido'),
        value: '75',
        confidence: 80,
      },
    ],
  },

  familia_details: {
    id: 'familia_details',
    text: 'Entendo. É sobre divórcio, pensão alimentícia ou guarda de filhos?',
    type: 'choice',
    options: ['Divórcio', 'Pensão alimentícia', 'Guarda de filhos', 'Outro assunto familiar'],
    nextQuestion: 'urgency',
    scoringRules: [
      {
        field: 'urgencia',
        condition: (a) => a.includes('Guarda'),
        value: 'ALTA',
        confidence: 90,
      },
      {
        field: 'viabilidade',
        condition: () => true,
        value: '70',
        confidence: 75,
      },
    ],
  },

  civil_details: {
    id: 'civil_details',
    text: 'Você tem algum contrato por escrito ou provas do ocorrido?',
    type: 'choice',
    options: [
      'Sim, tenho contrato/documentos',
      'Tenho algumas provas (fotos, mensagens)',
      'Não tenho nada por escrito',
    ],
    nextQuestion: 'urgency',
    scoringRules: [
      {
        field: 'viabilidade',
        condition: (a) => a.includes('contrato/documentos'),
        value: '90',
        confidence: 95,
      },
      {
        field: 'viabilidade',
        condition: (a) => a.includes('algumas provas'),
        value: '70',
        confidence: 80,
      },
      {
        field: 'viabilidade',
        condition: (a) => a.includes('nada por escrito'),
        value: '40',
        confidence: 70,
      },
    ],
  },

  imovel_details: {
    id: 'imovel_details',
    text: 'Você é inquilino, proprietário ou outro?',
    type: 'choice',
    options: ['Sou inquilino', 'Sou proprietário', 'Outro'],
    nextQuestion: 'urgency',
  },

  other_description: {
    id: 'other_description',
    text: 'Por favor, descreva brevemente seu problema em poucas palavras. Você pode escrever ou enviar um áudio.',
    type: 'text',
    nextQuestion: 'urgency',
  },

  urgency: {
    id: 'urgency',
    text: 'Qual é a urgência do seu caso?',
    type: 'choice',
    options: [
      'Muito urgente (prazo curto, situação crítica)',
      'Urgente (preciso resolver logo)',
      'Normal (posso esperar alguns dias)',
      'Baixa urgência (só quero orientação)',
    ],
    nextQuestion: 'location',
    scoringRules: [
      {
        field: 'urgencia',
        condition: (a) => a.includes('Muito urgente'),
        value: 'ALTA',
        confidence: 95,
      },
      {
        field: 'urgencia',
        condition: (a) => a.includes('Urgente'),
        value: 'MEDIA',
        confidence: 90,
      },
      {
        field: 'urgencia',
        condition: (a) => a.includes('Normal') || a.includes('Baixa'),
        value: 'BAIXA',
        confidence: 95,
      },
    ],
  },

  location: {
    id: 'location',
    text: 'Em qual cidade e estado você está? (Ex: Rio de Janeiro, RJ)',
    type: 'location',
    nextQuestion: undefined, // Fim do fluxo
  },
}

/**
 * Mensagem inicial do sistema
 */
export const WELCOME_MESSAGE = `Olá! Sou o assistente da JustApp. 👋

Vou fazer algumas perguntas rápidas (2-3 minutos) para entender seu caso e conectá-lo aos melhores advogados.

📋 Sem custo para você
⚡ Processo rápido e simples

Vamos começar?`

/**
 * Mensagem após completar pré-qualificação
 */
export const COMPLETION_MESSAGE = (score: number, especialidade?: string) => {
  if (score >= 70) {
    return `✅ Ótimo! Baseado nas suas respostas, identificamos que você tem um caso ${especialidade ? `de **${especialidade}**` : 'válido'} com boa viabilidade.

🎯 **Próximo passo:** Enviar seu caso para advogados especializados na sua região?

Ao confirmar, vamos:
1. Criar seu perfil
2. Distribuir para até 5 advogados qualificados
3. Você escolhe qual contratar

Deseja prosseguir?`
  } else if (score >= 50) {
    return `📋 Entendi sua situação. Você tem um caso ${especialidade ? `de **${especialidade}**` : 'que pode ter viabilidade'}.

💡 Recomendo conversar com um advogado para avaliar melhor suas chances.

Deseja que eu conecte você a advogados especializados?`
  } else {
    return `📋 Obrigado por compartilhar sua situação.

⚠️ Baseado nas informações, pode ser que seu caso precise de mais documentação ou análise detalhada.

Ainda assim, posso conectá-lo a advogados que podem te orientar melhor. Deseja prosseguir?`
  }
}
