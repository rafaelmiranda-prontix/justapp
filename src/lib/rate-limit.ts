/**
 * Rate limiting simples usando Map em memória
 * Para produção, considere usar Redis (@upstash/ratelimit)
 */

interface RateLimitOptions {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Número máximo de requisições
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Armazenamento em memória (será limpo quando o servidor reiniciar)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas periodicamente (a cada 5 minutos)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000) // 5 minutos
}

/**
 * Verifica se uma requisição deve ser bloqueada por rate limiting
 * @param identifier Identificador único (IP, userId, sessionId, etc)
 * @param options Opções de rate limiting
 * @returns true se deve bloquear, false se permitir
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `${identifier}:${options.windowMs}:${options.maxRequests}`
  const entry = rateLimitStore.get(key)

  // Se não existe entrada ou expirou, criar nova
  if (!entry || entry.resetAt < now) {
    const resetAt = now + options.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    })
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt,
    }
  }

  // Se excedeu o limite, bloquear
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Incrementar contador
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Obtém IP do cliente da requisição
 */
export function getClientIP(request: Request): string {
  // Tentar obter IP de headers comuns de proxy
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (não confiável em produção)
  return 'unknown'
}

/**
 * Presets de rate limiting comuns
 */
export const RateLimitPresets = {
  // Rate limiting para cadastro (5 requisições por hora por IP)
  SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5,
  },
  // Rate limiting para conversão de sessão (3 requisições por hora por IP)
  CONVERT: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3,
  },
  // Rate limiting para ativação (10 requisições por hora por IP)
  ACTIVATE: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
  },
  // Rate limiting para login (10 requisições por 15 minutos por IP)
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10,
  },
  // Rate limiting para upload (20 requisições por hora por usuário)
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 20,
  },
} as const
