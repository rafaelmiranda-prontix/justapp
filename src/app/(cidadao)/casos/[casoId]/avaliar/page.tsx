'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AvaliacaoForm } from '@/components/avaliacoes/avaliacao-form'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Match {
  id: string
  advogado: {
    id: string
    user: {
      name: string
    }
  }
  status: string
  caso?: {
    id: string
  }
}

export default function AvaliarAdvogadoPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const casoId = params.casoId as string
  const matchId = searchParams.get('matchId')
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMatch()
  }, [casoId, matchId])

  const fetchMatch = async () => {
    try {
      const res = await fetch('/api/matches')
      const result = await res.json()

      if (result.success) {
        // Se tem matchId, busca por ID, senão busca por caso
        let acceptedMatch: Match | undefined

        if (matchId) {
          acceptedMatch = result.data.find((m: Match) => m.id === matchId && m.status === 'ACEITO')
        } else {
          acceptedMatch = result.data.find(
            (m: Match) => m.caso?.id === casoId && m.status === 'ACEITO'
          )
        }

        if (acceptedMatch) {
          setMatch(acceptedMatch)
        } else {
          // Se não encontrou, redireciona para dashboard
          router.push('/cidadao/dashboard')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/cidadao/dashboard')
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum advogado aceito encontrado para este caso
            </p>
            <Button asChild>
              <Link href="/cidadao/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href="/cidadao/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Avaliar Advogado</CardTitle>
          <CardDescription>
            Avalie sua experiência com {match.advogado.user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvaliacaoForm
            advogadoId={match.advogado.id}
            matchId={match.id}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  )
}
