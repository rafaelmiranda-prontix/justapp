import { prisma } from '@/lib/prisma'

type ChatMode = 'MVP' | 'PUSHER'

/**
 * Obtém o modo de chat configurado no banco de dados
 * @returns 'MVP' ou 'PUSHER'
 */
export async function getChatMode(): Promise<ChatMode> {
  try {
    const config = await prisma.configuracoes.findUnique({
      where: { chave: 'chat_mode' },
      select: { valor: true },
    })

    return (config?.valor as ChatMode) || 'MVP'
  } catch (error) {
    console.error('Error fetching chat mode config:', error)
    // Fallback para MVP em caso de erro
    return 'MVP'
  }
}

/**
 * Atualiza o modo de chat
 * @param mode - 'MVP' ou 'PUSHER'
 */
export async function setChatMode(mode: ChatMode): Promise<void> {
  await prisma.configuracoes.upsert({
    where: { chave: 'chat_mode' },
    update: {
      valor: mode,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      chave: 'chat_mode',
      valor: mode,
      tipo: 'STRING',
      descricao: 'Modo de funcionamento do chat: MVP (polling otimizado) ou PUSHER (WebSocket em tempo real)',
      categoria: 'chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

/**
 * Verifica se o Pusher está configurado
 */
export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_KEY
  )
}
