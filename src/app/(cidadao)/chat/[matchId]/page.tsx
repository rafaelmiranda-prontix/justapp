'use client'

import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChatWindow } from '@/components/chat/chat-window'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: string
  advogados: {
    users: {
      id: string
      name: string
      image: string | null
    }
  }
  casos: {
    cidadaos: {
      users: {
        id: string
        name: string
        image: string | null
      }
    }
  }
}

export default function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchMatch()
    }
  }, [status, matchId])

  const fetchMatch = async () => {
    try {
      const res = await fetch('/api/matches')
      const result = await res.json()

      if (result.success) {
        const foundMatch = result.data.find((m: Match) => m.id === matchId)
        if (foundMatch) {
          setMatch(foundMatch)
        } else {
          router.push('/cidadao/dashboard')
        }
      }
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!match || !session?.user) {
    return (
      <div className="container max-w-4xl py-8">
        <p>Match não encontrado</p>
      </div>
    )
  }

  const otherUser =
    session.user.role === 'CIDADAO' ? match.advogados.users : match.casos.cidadaos.users

  return (
    <div className="container max-w-4xl py-8">
      <Link
        href={session.user.role === 'CIDADAO' ? '/cidadao/dashboard' : '/advogado/dashboard'}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <ChatWindow
        matchId={matchId}
        currentUserId={session.user.id}
        otherUser={{
          name: otherUser.name,
          image: otherUser.image,
        }}
      />
    </div>
  )
}
