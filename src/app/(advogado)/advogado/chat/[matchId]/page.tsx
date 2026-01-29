'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: string
  advogado: {
    user: {
      id: string
      name: string
      image: string | null
    }
  }
  caso: {
    cidadao: {
      user: {
        id: string
        name: string
        image: string | null
      }
    }
  }
}

export default function AdvogadoChatPage({ params }: { params: { matchId: string } }) {
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
  }, [status])

  const fetchMatch = async () => {
    try {
      const res = await fetch('/api/matches')
      const result = await res.json()

      if (result.success) {
        const foundMatch = result.data.find((m: Match) => m.id === params.matchId)
        if (foundMatch) {
          setMatch(foundMatch)
        } else {
          router.push('/advogado/dashboard')
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
    session.user.role === 'CIDADAO' ? match.advogado.user : match.caso.cidadao.user

  return (
    <div className="container max-w-4xl py-8">
      <Link
        href="/advogado/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <ChatInterface
        matchId={params.matchId}
        currentUserId={session.user.id}
        otherUserName={otherUser.name}
        otherUserImage={otherUser.image}
      />
    </div>
  )
}
