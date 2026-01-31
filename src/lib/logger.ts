/**
 * Sistema de logging seguro para produção
 * Remove logs sensíveis em produção e mantém apenas em desenvolvimento
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Dados que não devem ser logados em produção
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /email/i, // Emails podem ser considerados sensíveis
  /phone/i,
  /cpf/i,
  /cnpj/i,
  /oab/i,
]

/**
 * Verifica se um valor contém dados sensíveis
 */
function containsSensitiveData(value: any): boolean {
  if (typeof value === 'string') {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value))
  }

  if (typeof value === 'object' && value !== null) {
    const stringified = JSON.stringify(value)
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(stringified))
  }

  return false
}

/**
 * Sanitiza dados sensíveis para logs
 */
function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    if (containsSensitiveData(data)) {
      return '[REDACTED]'
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging)
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (containsSensitiveData(key) || containsSensitiveData(value)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeForLogging(value)
      }
    }
    return sanitized
  }

  return data
}

/**
 * Logger seguro que remove logs em produção
 */
export const logger = {
  /**
   * Log de informação (apenas em desenvolvimento)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log de erro (sempre loga, mas sanitiza dados sensíveis em produção)
   */
  error: (...args: any[]) => {
    if (isProduction) {
      // Em produção, sanitizar dados sensíveis
      const sanitized = args.map(sanitizeForLogging)
      console.error(...sanitized)
    } else {
      // Em desenvolvimento, logar tudo
      console.error(...args)
    }
  },

  /**
   * Log de warning (apenas em desenvolvimento)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Log de sucesso (apenas em desenvolvimento)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args)
    }
  },
}

/**
 * Função helper para logar apenas em desenvolvimento
 * @deprecated Use logger.info() ao invés disso
 */
export function devLog(...args: any[]) {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * Função helper para logar erros de forma segura
 * @deprecated Use logger.error() ao invés disso
 */
export function safeErrorLog(...args: any[]) {
  if (isProduction) {
    const sanitized = args.map(sanitizeForLogging)
    console.error(...sanitized)
  } else {
    console.error(...args)
  }
}
