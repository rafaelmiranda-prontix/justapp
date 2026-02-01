'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'
import dynamic from 'next/dynamic'

// Importação dinâmica do Lottie para evitar problemas de SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  useLottie?: boolean
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, useLottie = false, children, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={loading || disabled} {...props}>
        {loading ? (
          <div className="flex items-center gap-2">
            {useLottie ? (
              <div className="w-6 h-6">
                <Lottie
                  animationData={require('../../../public/animations/loading-dots.json')}
                  loop={true}
                />
              </div>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{loadingText || 'Carregando...'}</span>
          </div>
        ) : (
          children
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'
