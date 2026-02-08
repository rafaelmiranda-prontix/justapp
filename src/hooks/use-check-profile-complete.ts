'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function useCheckProfileComplete() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Só verificar se a sessão estiver carregada e o usuário for cidadão
    if (status !== 'authenticated' || session?.user?.role !== 'CIDADAO') {
      setIsChecking(false)
      return
    }

    // Não verificar se já estiver na página de completar perfil
    if (pathname === '/auth/complete-profile') {
      setIsChecking(false)
      return
    }

    // Verificar se o perfil está completo
    const checkProfile = async () => {
      try {
        const response = await fetch('/api/cidadao/perfil')
        
        if (!response.ok) {
          setIsChecking(false)
          return
        }

        const data = await response.json()
        
        // Se não tiver cidade ou estado, redirecionar para completar perfil
        if (data.success && data.data && (!data.data.cidade || !data.data.estado)) {
          router.push('/auth/complete-profile')
          return
        }

        setIsChecking(false)
      } catch (error) {
        console.error('Error checking profile completion:', error)
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [session, status, pathname, router])

  return { isChecking }
}
