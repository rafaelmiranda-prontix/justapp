'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { AudioPreview } from '@/components/chat/audio-preview'
import { Send, Loader2, Mic, Square, X } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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

    console.log('[ChatInput] Sending text message:', message.trim())
    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
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

    console.log('[ChatInput] Sending audio:', {
      blob: audioBlob,
      size: audioBlob.size,
      type: audioBlob.type,
    })

    // Por enquanto, apenas console.log
    // TODO: Implementar envio de áudio quando a API estiver pronta
    // setIsSending(true)
    // try {
    //   await onSendAudio(audioBlob)
    //   cancelRecording()
    // } catch (error) {
    //   console.error('Error sending audio:', error)
    // } finally {
    //   setIsSending(false)
    // }
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
                "{speechTranscript}"
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

      {/* Input de texto */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          disabled={disabled || isSending || isRecording}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        {/* Botão de microfone ou enviar */}
        {!message.trim() && !isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={disabled || isSending}
            size="icon"
            className="h-11 w-11 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            title="Gravar áudio"
          >
            <Mic className="h-5 w-5" />
          </Button>
        ) : message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isSending}
            size="icon"
            className="h-11 w-11 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
