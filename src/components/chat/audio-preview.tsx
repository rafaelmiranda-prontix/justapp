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
    // Verificar se o blob tem um tipo válido
    if (!audioBlob || audioBlob.size === 0) {
      console.error('[AudioPreview] Invalid audio blob:', audioBlob)
      return
    }

    // Resetar estados
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)

    // Criar URL do blob de áudio
    const url = URL.createObjectURL(audioBlob)
    audioUrlRef.current = url

    if (audioRef.current) {
      // Limpar src anterior se existir
      audioRef.current.src = ''
      
      // Definir novo src
      audioRef.current.src = url
      
      // Carregar o áudio
      try {
        audioRef.current.load()
        
        // Tentar carregar metadata de forma assíncrona
        const loadMetadata = () => {
          if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration)
            console.log('[AudioPreview] Duration loaded:', audioRef.current.duration)
          }
        }
        
        // Tentar múltiplas vezes para garantir que a metadata seja carregada
        audioRef.current.addEventListener('loadedmetadata', loadMetadata)
        audioRef.current.addEventListener('canplay', loadMetadata)
        audioRef.current.addEventListener('durationchange', loadMetadata)
        
        // Timeout para tentar carregar após um delay
        const timeout = setTimeout(() => {
          loadMetadata()
        }, 100)
        
        return () => {
          clearTimeout(timeout)
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', loadMetadata)
            audioRef.current.removeEventListener('canplay', loadMetadata)
            audioRef.current.removeEventListener('durationchange', loadMetadata)
          }
        }
      } catch (error) {
        console.error('[AudioPreview] Error loading audio:', error)
        console.error('[AudioPreview] Blob type:', audioBlob.type)
        console.error('[AudioPreview] Blob size:', audioBlob.size)
      }
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.src = ''
      }
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('[AudioPreview] Error playing audio:', error)
        console.error('[AudioPreview] Audio src:', audioRef.current.src)
        console.error('[AudioPreview] Audio readyState:', audioRef.current.readyState)
        alert('Erro ao reproduzir áudio. O formato pode não ser suportado pelo navegador.')
        setIsPlaying(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0 && dur !== Infinity) {
        setDuration(dur)
        console.log('[AudioPreview] Metadata loaded, duration:', dur)
      } else {
        console.warn('[AudioPreview] Invalid duration:', dur)
        // Tentar obter duração de outra forma
        if (audioRef.current.readyState >= 2) {
          // Se o áudio já está carregado, tentar obter duração novamente
          setTimeout(() => {
            const newDur = audioRef.current?.duration
            if (newDur && !isNaN(newDur) && isFinite(newDur) && newDur > 0 && newDur !== Infinity) {
              setDuration(newDur)
            }
          }, 100)
        }
      }
    }
  }
  
  const handleCanPlay = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0 && dur !== Infinity) {
        setDuration(dur)
        console.log('[AudioPreview] Can play, duration:', dur)
      }
    }
  }
  
  const handleDurationChange = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0 && dur !== Infinity) {
        setDuration(dur)
        console.log('[AudioPreview] Duration changed:', dur)
      }
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
              {formatTime(currentTime)} / {formatTime(duration || 0)}
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
        onCanPlay={handleCanPlay}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        onError={(e) => {
          console.error('[AudioPreview] Audio element error:', e)
          const audio = e.currentTarget
          console.error('[AudioPreview] Error code:', audio.error?.code)
          console.error('[AudioPreview] Error message:', audio.error?.message)
          console.error('[AudioPreview] Audio src:', audio.src)
          console.error('[AudioPreview] Audio networkState:', audio.networkState)
          console.error('[AudioPreview] Audio readyState:', audio.readyState)
        }}
        preload="auto"
        style={{ display: 'none' }}
      />
    </div>
  )
}
