'use client'

import { useCallback } from 'react'
import { useToast } from './use-toast'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logError = true,
        fallbackMessage = 'Ocorreu um erro inesperado',
      } = options

      let errorMessage = fallbackMessage

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      if (logError) {
        console.error('Error:', error)
      }

      if (showToast) {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      return errorMessage
    },
    [toast]
  )

  const handleAsyncError = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options: ErrorHandlerOptions = {}
    ): Promise<T | null> => {
      try {
        return await asyncFn()
      } catch (error) {
        handleError(error, options)
        return null
      }
    },
    [handleError]
  )

  return {
    handleError,
    handleAsyncError,
  }
}
