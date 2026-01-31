import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChatMode, setChatMode, isPusherConfigured } from '@/lib/config'
import { z } from 'zod'

const updateChatModeSchema = z.object({
  mode: z.enum(['MVP', 'PUSHER']),
})

// GET - Obter configuração atual do chat
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const mode = await getChatMode()
    const pusherConfigured = isPusherConfigured()

    return NextResponse.json({
      success: true,
      data: {
        currentMode: mode,
        pusherConfigured,
        availableModes: [
          {
            value: 'MVP',
            label: 'MVP (Polling Otimizado)',
            description: 'Sem dependências externas, polling a cada 5s, busca incremental',
            recommended: !pusherConfigured,
          },
          {
            value: 'PUSHER',
            label: 'Pusher (WebSocket em Tempo Real)',
            description: 'Mensagens instantâneas, indicador de digitação, máxima performance',
            recommended: pusherConfigured,
            requiresConfig: !pusherConfigured,
          },
        ],
      },
    })
  } catch (error) {
    console.error('Error fetching chat config:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

// POST - Atualizar configuração do chat
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { mode } = updateChatModeSchema.parse(body)

    // Verificar se Pusher está configurado antes de ativar
    if (mode === 'PUSHER' && !isPusherConfigured()) {
      return NextResponse.json(
        {
          error: 'Pusher não configurado',
          details:
            'Configure as variáveis PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET e NEXT_PUBLIC_PUSHER_KEY no .env',
        },
        { status: 400 }
      )
    }

    await setChatMode(mode)

    return NextResponse.json({
      success: true,
      message: `Modo de chat alterado para ${mode}`,
      data: { mode },
    })
  } catch (error) {
    console.error('Error updating chat config:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}
