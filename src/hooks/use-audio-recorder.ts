import { useState, useRef, useCallback } from 'react'
import { clientLogger } from '@/lib/client-logger'

interface UseAudioRecorderReturn {
  isRecording: boolean
  recordingTime: number
  audioBlob: Blob | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      chunksRef.current = []
      setRecordingTime(0)

      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox, Edge ou Safari.')
        return
      }

      // Verificar se MediaRecorder está disponível
      if (!window.MediaRecorder) {
        setError('Seu navegador não suporta MediaRecorder. Use uma versão mais recente.')
        return
      }

      // Solicitar permissão de áudio com configurações otimizadas
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      // Verificar codecs suportados
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]

      let selectedMimeType = 'audio/webm'
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      })

      mediaRecorderRef.current = mediaRecorder

      // Coletar chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Quando parar a gravação
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType })
        console.log('[AudioRecorder] Recording stopped:', {
          blobSize: blob.size,
          blobType: blob.type,
          selectedMimeType,
          chunksCount: chunksRef.current.length,
        })
        setAudioBlob(blob)

        // Parar todas as tracks do stream
        stream.getTracks().forEach((track) => track.stop())
      }

      // Tratamento de erros do MediaRecorder
      mediaRecorder.onerror = (event: any) => {
        clientLogger.error('MediaRecorder error:', event)
        setError('Erro durante a gravação. Tente novamente.')
        setIsRecording(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }

      // Iniciar gravação
      mediaRecorder.start(1000) // Coletar dados a cada 1 segundo
      setIsRecording(true)

      // Timer para mostrar duração
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      clientLogger.error('Error starting recording:', err)
      
      let errorMessage = 'Erro ao iniciar gravação. Verifique se seu navegador suporta gravação de áudio.'
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereço e permita o acesso ao microfone, ou verifique as configurações do navegador.'
            break
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = 'Nenhum microfone encontrado. Verifique se há um microfone conectado e tente novamente.'
            break
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = 'O microfone está sendo usado por outro aplicativo. Feche outros aplicativos que possam estar usando o microfone e tente novamente.'
            break
          case 'OverconstrainedError':
          case 'ConstraintNotSatisfiedError':
            errorMessage = 'As configurações do microfone não são suportadas. Tente usar outro navegador.'
            break
          case 'SecurityError':
            errorMessage = 'Erro de segurança. Certifique-se de que está usando HTTPS ou localhost.'
            break
          default:
            errorMessage = `Erro ao acessar o microfone: ${err.message || err.name}`
        }
      }
      
      setError(errorMessage)
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioBlob(null)
      setRecordingTime(0)
      chunksRef.current = []

      // Parar todas as tracks do stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  return {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  }
}
