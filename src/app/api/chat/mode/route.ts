import { NextResponse } from 'next/server'
import { getChatMode } from '@/lib/config'

/**
 * GET /api/chat/mode
 * API pública para obter o modo de chat configurado
 * Retorna apenas o modo atual (sem informações sensíveis)
 */
export async function GET() {
  try {
    const mode = await getChatMode()

    return NextResponse.json({
      success: true,
      currentMode: mode,
    })
  } catch (error) {
    console.error('Error fetching chat mode:', error)
    // Fallback para MVP em caso de erro
    return NextResponse.json({
      success: true,
      currentMode: 'MVP',
    })
  }
}
