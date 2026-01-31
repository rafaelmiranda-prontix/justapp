'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { Mic, Square, X, Send, RotateCcw } from 'lucide-react'

interface SpeechRecorderProps {
  onTranscriptReady: (transcript: string) => void
  disabled?: boolean
}

export function SpeechRecorder({ onTranscriptReady, disabled }: SpeechRecorderProps) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    isSupported,
  } = useSpeechRecognition()

  const [savedTranscript, setSavedTranscript] = useState<string | null>(null)

  const handleStop = () => {
    stopListening()
    if (transcript) {
      setSavedTranscript(transcript)
    }
  }

  const handleCancel = () => {
    cancelListening()
    setSavedTranscript(null)
  }

  const handleSend = () => {
    if (savedTranscript) {
      onTranscriptReady(savedTranscript)
      setSavedTranscript(null)
    }
  }

  const handleRestart = () => {
    setSavedTranscript(null)
    startListening()
  }

  if (!isSupported) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        <X className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  // Mostrar preview do áudio gravado
  if (savedTranscript) {
    return (
      <div className="flex items-center gap-2 w-full bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
        {/* Preview do texto */}
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
            Mensagem gravada:
          </p>
          <p className="text-sm text-muted-foreground italic line-clamp-2">
            "{savedTranscript}"
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestart}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20"
            title="Gravar novamente"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-700"
            title="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Gravando
  if (isListening) {
    return (
      <div className="flex items-center gap-2 w-full bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
        {/* Indicador de escuta */}
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Escutando...
          </span>
          {transcript && (
            <span className="text-sm text-muted-foreground italic truncate">
              "{transcript}"
            </span>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleStop}
            className="bg-red-600 hover:bg-red-700"
            title="Parar gravação"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    )
  }

  // Botão inicial de gravar
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={startListening}
      disabled={disabled}
      className="h-10 w-10 rounded-full"
      title="Gravar mensagem de voz"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}
