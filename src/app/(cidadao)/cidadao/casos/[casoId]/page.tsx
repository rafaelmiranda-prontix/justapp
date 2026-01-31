'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CaseDetails } from '@/components/casos/case-details'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CidadaoCasoDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCasoDetails()
  }, [casoId])

  const fetchCasoDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cidadao/casos/${casoId}`)
      const result = await res.json()

      if (result.success) {
        setCaso(result.data)
      } else {
        setError(result.error || 'Erro ao buscar caso')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      setError('Erro ao carregar detalhes do caso')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || 'Caso não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <CaseDetails caso={caso} showCidadaoInfo={false} />
    </div>
  )
}
