'use client'

import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

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
  if (variant === 'large') {
    return (
      <div className="w-full sm:w-auto sm:max-w-none">
        <Button
          onClick={onClick}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[280px] h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Comece Agora - É Grátis
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
    <Button onClick={onClick} className="gap-2">
      <MessageSquare className="h-4 w-4" />
      Falar com Assistente
    </Button>
  )
}
