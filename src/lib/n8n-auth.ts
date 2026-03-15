import { NextResponse } from 'next/server'

const N8N_API_KEY = process.env.N8N_API_KEY

/**
 * Verifica o header de API key para rotas N8N.
 * Aceita: X-API-Key ou Authorization: Bearer <key>
 */
export function requireN8nApiKey(req: Request): NextResponse | null {
  if (!N8N_API_KEY || N8N_API_KEY.length < 16) {
    return NextResponse.json(
      { error: 'Integração N8N não configurada (N8N_API_KEY)' },
      { status: 503 }
    )
  }

  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!apiKey || apiKey !== N8N_API_KEY) {
    return NextResponse.json(
      { error: 'API key inválida ou ausente' },
      { status: 401 }
    )
  }

  return null
}
