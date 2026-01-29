'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface ContactAdvogadoParams {
  advogadoId: string
  casoId: string
}

export function useContactAdvogado() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const contactAdvogado = async ({ advogadoId, casoId }: ContactAdvogadoParams) => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advogadoId, casoId }),
      })

      const result = await res.json()

      if (!res.ok) {
        // Se não autorizado, redireciona para login
        if (res.status === 401) {
          toast({
            title: 'Autenticação necessária',
            description: 'Faça login para contatar um advogado',
            variant: 'destructive',
          })
          router.push('/login')
          return { success: false }
        }

        throw new Error(result.error || 'Erro ao contatar advogado')
      }

      toast({
        title: 'Solicitação enviada!',
        description: 'O advogado receberá sua solicitação e entrará em contato em breve.',
      })

      return { success: true, data: result.data }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao contatar advogado',
        variant: 'destructive',
      })
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  return { contactAdvogado, isLoading }
}
