import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function integrationApiKeys(): string[] {
  return [process.env.N8N_API_KEY, process.env.INTEGRATION_API_KEY].filter(
    (k): k is string => typeof k === 'string' && k.length >= 16
  )
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

/**
 * Autenticação para integrações (n8n, bot WhatsApp): API Key e/ou JWT de serviço.
 * - Header `X-API-Key` com N8N_API_KEY ou INTEGRATION_API_KEY (mín. 16 caracteres)
 * - `Authorization: Bearer <apiKey>` (quando não parece JWT)
 * - `Authorization: Bearer <jwt>` com audience `integration`, HS256, secret INTEGRATION_JWT_SECRET (mín. 32 caracteres)
 */
export async function requireIntegrationAuth(req: Request): Promise<NextResponse | null> {
  const keys = integrationApiKeys()
  const jwtSecret = process.env.INTEGRATION_JWT_SECRET
  const hasJwt = typeof jwtSecret === 'string' && jwtSecret.length >= 32
  const hasApiKeys = keys.length > 0

  if (!hasApiKeys && !hasJwt) {
    return NextResponse.json(
      {
        error:
          'Integração não configurada. Defina N8N_API_KEY ou INTEGRATION_API_KEY (≥16 caracteres) e/ou INTEGRATION_JWT_SECRET (≥32 caracteres).',
      },
      { status: 503 }
    )
  }

  const xApiKey = req.headers.get('x-api-key')
  if (xApiKey) {
    if (!hasApiKeys || !keys.includes(xApiKey)) {
      return NextResponse.json({ error: 'API key inválida' }, { status: 401 })
    }
    return null
  }

  const auth = req.headers.get('authorization')
  const bearer = auth?.replace(/^Bearer\s+/i, '')?.trim()
  if (!bearer) {
    return NextResponse.json({ error: 'API key (X-API-Key) ou Bearer token ausente' }, { status: 401 })
  }

  if (looksLikeJwt(bearer)) {
    if (!hasJwt) {
      return NextResponse.json({ error: 'JWT de integração não configurado' }, { status: 503 })
    }
    try {
      await jwtVerify(bearer, new TextEncoder().encode(jwtSecret!), {
        audience: 'integration',
        algorithms: ['HS256'],
      })
      return null
    } catch {
      return NextResponse.json({ error: 'Token JWT inválido' }, { status: 401 })
    }
  }

  if (!hasApiKeys || !keys.includes(bearer)) {
    return NextResponse.json({ error: 'API key inválida' }, { status: 401 })
  }
  return null
}
