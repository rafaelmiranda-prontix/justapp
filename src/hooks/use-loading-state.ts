'use client'

import { useState, useCallback } from 'react'

export function useLoadingState(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const startLoading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])
  const toggleLoading = useCallback(() => setIsLoading((prev) => !prev), [])

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        startLoading()
        return await asyncFn()
      } catch (error) {
        console.error('Error in withLoading:', error)
        return null
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    withLoading,
  }
}
