import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  cancelListening: () => void
  isSupported: boolean
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<any>(null)

  // Verificar suporte do navegador
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      // Configurar reconhecimento
      recognitionRef.current.continuous = true // Continuar ouvindo
      recognitionRef.current.interimResults = true // Resultados parciais
      recognitionRef.current.lang = 'pt-BR' // Português do Brasil
      recognitionRef.current.maxAlternatives = 1

      // Eventos
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Atualizar transcript
        setTranscript((prev) => {
          const newTranscript = prev + finalTranscript
          return newTranscript.trim()
        })
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        if (event.error === 'no-speech') {
          setError('Nenhuma fala detectada. Tente novamente.')
        } else if (event.error === 'audio-capture') {
          setError('Microfone não encontrado. Verifique as configurações.')
        } else if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada.')
        } else {
          setError(`Erro no reconhecimento de voz: ${event.error}`)
        }

        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      setError('Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.')
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Reconhecimento de voz não disponível')
      return
    }

    setError(null)
    setTranscript('')
    setIsListening(true)

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('Error starting recognition:', err)
      setError('Erro ao iniciar reconhecimento. Tente novamente.')
      setIsListening(false)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const cancelListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setTranscript('')
    }
  }, [isListening])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    isSupported,
  }
}
