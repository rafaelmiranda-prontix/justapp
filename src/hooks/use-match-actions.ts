'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export function useMatchActions() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const visualizeMatch = async (matchId: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const res = await fetch(`/api/matches/${matchId}/visualize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao visualizar lead')
      }

      toast({
        title: 'Lead visualizado',
        description: 'O status do lead foi atualizado',
      })

      return true
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao visualizar lead',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const respondMatch = async (matchId: string, accepted: boolean): Promise<boolean> => {
    setIsLoading(true)

    try {
      const endpoint = accepted
        ? `/api/matches/${matchId}/accept`
        : `/api/matches/${matchId}/reject`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao responder lead')
      }

      toast({
        title: accepted ? 'Caso aceito!' : 'Caso recusado',
        description: accepted
          ? 'Você pode agora iniciar o contato com o cliente'
          : 'O lead foi marcado como recusado',
      })

      return true
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao responder lead',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { visualizeMatch, respondMatch, isLoading }
}
