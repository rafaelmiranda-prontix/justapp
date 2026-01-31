'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, X, Send, RotateCcw } from 'lucide-react'

interface AudioPreviewProps {
  audioBlob: Blob
  transcript: string
  onSend: () => void
  onCancel: () => void
  onRestart: () => void
}

export function AudioPreview({
  audioBlob,
  transcript,
  onSend,
  onCancel,
  onRestart,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioUrlRef = useRef<string>('')

  useEffect(() => {
    // Criar URL do blob de áudio
    const url = URL.createObjectURL(audioBlob)
    audioUrlRef.current = url

    if (audioRef.current) {
      audioRef.current.src = url
    }

    // Cleanup
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendClick = () => {
    console.log('[AudioPreview] Transcript:', transcript)
    onSend()
  }

  return (
    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3">
        {/* Botão Play/Pause */}
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>

        {/* Barra de progresso e tempo */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-green-700 dark:text-green-400 font-mono min-w-[40px]">
              {formatTime(currentTime)}
            </span>
          </div>
          {transcript ? (
            <p className="text-xs text-green-700 dark:text-green-400 italic line-clamp-1">
              &quot;{transcript}&quot;
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Áudio gravado</p>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRestart}
            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20"
            title="Gravar novamente"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSendClick}
            className="h-8 w-8 bg-green-600 hover:bg-green-700"
            title="Enviar áudio"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
    </div>
  )
}
