'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { AudioPreview } from '@/components/chat/audio-preview'
import { Send, Loader2, Mic, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clientLogger } from '@/lib/client-logger'

interface ChatInputProps {
  onSend: (message: string, audioUrl?: string) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  casoId?: string // ID do caso para upload de áudio
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = 2000,
  casoId,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const audioUrlRef = useRef<string | null>(null)

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordingError,
  } = useAudioRecorder()

  // Web Speech API para transcrição em tempo real
  const {
    isListening,
    transcript: speechTranscript,
    error: speechError,
    startListening,
    stopListening,
    cancelListening,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition()

  // Iniciar gravação de áudio e transcrição simultaneamente
  const handleStartRecording = async () => {
    await startRecording()
    if (isSpeechSupported) {
      startListening()
    }
  }

  // Parar gravação e transcrição
  const handleStopRecording = () => {
    stopRecording()
    if (isListening) {
      stopListening()
    }
  }

  // Cancelar gravação e transcrição
  const handleCancelRecording = () => {
    cancelRecording()
    if (isListening) {
      cancelListening()
    }
    setTranscript('')
  }

  // Atualizar transcript em tempo real durante a gravação
  useEffect(() => {
    if (speechTranscript) {
      setTranscript(speechTranscript)
    }
  }, [speechTranscript])

  // Limpar transcript quando cancelar
  useEffect(() => {
    if (!isRecording && !audioBlob && !isListening) {
      setTranscript('')
    }
  }, [isRecording, audioBlob, isListening])

  // Criar URL do áudio quando houver blob
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      audioUrlRef.current = url
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
      setAudioUrl(null)
    }
  }, [audioBlob])

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage('')
    } catch (error) {
      clientLogger.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSendAudio = async () => {
    if (!audioBlob || isSending || disabled) return

    setIsSending(true)

    try {
      // 1. Fazer upload do áudio para Supabase
      const formData = new FormData()
      
      // Usar o tipo MIME do blob original (já detectado pelo hook)
      const blobType = audioBlob.type || 'audio/webm'
      const extension = blobType.includes('ogg') ? 'ogg' : blobType.includes('mp4') ? 'mp4' : 'webm'
      const fileName = `audio.${extension}`
      
      clientLogger.log('[ChatInput] Creating audio file:', {
        blobType,
        blobSize: audioBlob.size,
        fileName,
      })
      
      const audioFile = new File([audioBlob], fileName, {
        type: blobType,
      })
      formData.append('audio', audioFile)
      
      // Usar casoId se disponível, senão enviar vazio (API usará userId)
      if (casoId) {
        formData.append('casoId', casoId)
      }

      clientLogger.log('[ChatInput] Uploading audio to /api/casos/audio...')
      const uploadResponse = await fetch('/api/casos/audio', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        clientLogger.error('[ChatInput] Upload error:', error)
        throw new Error(error.error || 'Erro ao fazer upload do áudio')
      }

      const uploadData = await uploadResponse.json()
      const audioUrl = uploadData.data.url

      clientLogger.log('[ChatInput] Audio uploaded successfully:', audioUrl)
      clientLogger.log('[ChatInput] Sending message with transcript:', transcript || '🎤 Mensagem de áudio')

      // 2. Enviar mensagem com áudio e transcrição
      await onSend(transcript || '🎤 Mensagem de áudio', audioUrl)

      // 3. Limpar estado
      handleCancelRecording()
      setAudioUrl(null)
    } catch (error) {
      clientLogger.error('[ChatInput] Error sending audio:', error)
      alert(error instanceof Error ? error.message : 'Erro ao enviar áudio')
    } finally {
      setIsSending(false)
    }
  }

  const handleCancelAudio = () => {
    handleCancelRecording()
    setAudioUrl(null)
  }

  const handleRestartAudio = () => {
    handleCancelRecording()
    setAudioUrl(null)
    handleStartRecording()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingChars = maxLength - message.length
  const isNearLimit = remainingChars < 100

  return (
    <div className="space-y-2">
      {/* Preview do áudio gravado */}
      {audioBlob && audioUrl && (
        <AudioPreview
          audioBlob={audioBlob}
          transcript={transcript}
          onSend={handleSendAudio}
          onCancel={handleCancelAudio}
          onRestart={handleRestartAudio}
        />
      )}

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="flex items-center gap-2 w-full bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 flex-1">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Gravando... {formatTime(recordingTime)}
            </span>
            {speechTranscript && (
              <span className="text-xs text-muted-foreground italic truncate">
                &quot;{speechTranscript}&quot;
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelRecording}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleStopRecording}
            className="bg-red-600 hover:bg-red-700"
            title="Parar gravação"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      )}

      {/* Erro de gravação */}
      {(recordingError || speechError) && (
        <div className="flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded">
          <X className="h-4 w-4" />
          <span>{recordingError || speechError}</span>
        </div>
      )}

      {isNearLimit && (
        <div className="text-xs text-muted-foreground text-right">
          {remainingChars} caracteres restantes
        </div>
      )}

      {/* Input de texto */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending || isRecording}
          className={cn(
            'min-h-[60px] max-h-[200px] resize-none',
            isNearLimit && 'border-yellow-500'
          )}
        />

        {/* Botão de microfone ou enviar */}
        {!message.trim() && !isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={disabled || isSending}
            size="icon"
            className="h-[60px] w-[60px] shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            title="Gravar áudio"
          >
            <Mic className="h-5 w-5" />
          </Button>
        ) : message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isSending}
            size="icon"
            className="h-[60px] w-[60px] shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </p>
    </div>
  )
}
