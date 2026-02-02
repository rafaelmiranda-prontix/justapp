'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
// import loadingDotsAnimation from '../../../public/animations/loading-dots.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface AnonymousChatButtonProps {
  onClick: () => void
  variant?: 'default' | 'large'
  showTrustIndicators?: boolean
}

export function AnonymousChatButton({
  onClick,
  variant = 'default',
  showTrustIndicators = true
}: AnonymousChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onClick()
    } finally {
      // Pequeno delay para garantir que a animação seja vista
      setTimeout(() => setIsLoading(false), 300)
    }
  }

  if (variant === 'large') {
    return (
      <div className="w-full sm:w-auto sm:max-w-none">
        <Button
          onClick={handleClick}
          disabled={isLoading}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[280px] h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5">
                <Lottie
                  animationData={require('../../../public/animations/loading-dots.json')}
                  loop={true}
                />
              </div>
              <span>Preparando...</span>
            </div>
          ) : (
            <>
              <MessageSquare className="mr-2 h-5 w-5" />
              Comece Agora - É Grátis
            </>
          )}
        </Button>

        {showTrustIndicators && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Sem cadastro inicial
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Resposta em minutos
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              100% gratuito
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} className="gap-2">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4">
            <Lottie
              animationData={require('../../../public/animations/loading-dots.json')}
              loop={true}
            />
          </div>
          <span>Carregando...</span>
        </div>
      ) : (
        <>
          <MessageSquare className="h-4 w-4" />
          Falar com Assistente
        </>
      )}
    </Button>
  )
}
