'use client'

import { useEffect, useState } from 'react'
import { ChatInterfaceMVP } from './chat-interface-mvp'
import { ChatInterfaceOptimized } from './chat-interface-optimized'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatWrapperProps {
  matchId: string
  currentUserId: string
  currentUserName: string
  currentUserImage: string | null
  otherUserName: string
  otherUserImage: string | null
}

/**
 * Wrapper client-side que escolhe entre Chat MVP ou Pusher
 * baseado na configuração do banco de dados
 */
export function ChatWrapper({
  matchId,
  currentUserId,
  currentUserName,
  currentUserImage,
  otherUserName,
  otherUserImage,
}: ChatWrapperProps) {
  const [chatMode, setChatMode] = useState<'MVP' | 'PUSHER' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Buscar configuração do chat (API pública)
    fetch('/api/chat/mode')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.currentMode) {
          setChatMode(data.currentMode)
        } else {
          // Fallback para MVP em caso de erro
          setChatMode('MVP')
        }
      })
      .catch((error) => {
        console.error('Error fetching chat mode:', error)
        // Fallback para MVP em caso de erro
        setChatMode('MVP')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading || !chatMode) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

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
