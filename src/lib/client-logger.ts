/**
 * Logger client-side que remove logs em produção
 * Use este logger ao invés de console.log/error/warn diretamente
 */

const isDevelopment = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
const isProduction = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'

/**
 * Logger seguro para o frontend
 * Remove todos os logs em produção
 */
export const clientLogger = {
  /**
   * Log de informação (apenas em desenvolvimento)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  },

  /**
   * Log de erro (apenas em desenvolvimento)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(...args)
    }
  },

  /**
   * Log de warning (apenas em desenvolvimento)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(...args)
    }
  },

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(...args)
    }
  },

  /**
   * Log de informação (apenas em desenvolvimento)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(...args)
    }
  },
}

/**
 * Substitui console global em produção (opcional, use com cuidado)
 * Descomente apenas se quiser bloquear TODOS os console.log do código
 */
if (isProduction && typeof window !== 'undefined') {
  // Opcional: desabilitar console completamente em produção
  // window.console = {
  //   ...console,
  //   log: () => {},
  //   debug: () => {},
  //   info: () => {},
  //   warn: () => {},
  //   error: () => {}, // Manter error pode ser útil para debugging em produção
  // }
}
