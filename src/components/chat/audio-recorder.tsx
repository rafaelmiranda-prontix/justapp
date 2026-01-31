'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { Mic, Square, X, Send } from 'lucide-react'

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void
  disabled?: boolean
}

export function AudioRecorder({ onAudioRecorded, disabled }: AudioRecorderProps) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  } = useAudioRecorder()

  // Quando terminar de gravar, enviar automaticamente
  useEffect(() => {
    if (audioBlob && !isRecording) {
      onAudioRecorded(audioBlob)
    }
  }, [audioBlob, isRecording, onAudioRecorded])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        <X className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 w-full bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
        {/* Indicador de gravação */}
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Gravando...
          </span>
          <span className="text-sm text-red-600 dark:text-red-500 font-mono">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelRecording}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={startRecording}
      disabled={disabled}
      className="h-10 w-10 rounded-full"
      title="Gravar áudio"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}
