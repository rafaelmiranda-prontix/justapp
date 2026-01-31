import { useState, useRef, useCallback } from 'react'

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

      // Solicitar permissão de áudio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)

        // Parar todas as tracks do stream
        stream.getTracks().forEach((track) => track.stop())
      }

      // Iniciar gravação
      mediaRecorder.start()
      setIsRecording(true)

      // Timer para mostrar duração
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permissão de microfone negada. Por favor, permita o acesso ao microfone.'
          : 'Erro ao iniciar gravação. Verifique se seu navegador suporta gravação de áudio.'
      )
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
