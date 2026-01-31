import { getChatMode } from '@/lib/config'
import { ChatInterfaceMVP } from './chat-interface-mvp'
import { ChatInterfaceOptimized } from './chat-interface-optimized'

interface ChatAdaptiveProps {
  matchId: string
  currentUserId: string
  currentUserName: string
  currentUserImage: string | null
  otherUserName: string
  otherUserImage: string | null
}

/**
 * Componente adaptativo que escolhe entre Chat MVP ou Pusher
 * baseado na configuração do banco de dados
 */
export async function ChatAdaptive({
  matchId,
  currentUserId,
  currentUserName,
  currentUserImage,
  otherUserName,
  otherUserImage,
}: ChatAdaptiveProps) {
  const chatMode = await getChatMode()

  // Escolher componente baseado na configuração
  const ChatComponent = chatMode === 'PUSHER' ? ChatInterfaceOptimized : ChatInterfaceMVP

  return (
    <ChatComponent
      matchId={matchId}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserImage={currentUserImage}
      otherUserName={otherUserName}
      otherUserImage={otherUserImage}
    />
  )
}
