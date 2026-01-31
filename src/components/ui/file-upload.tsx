'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, X, Loader2, File, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect?: (file: File) => void
  onUploadError?: (error: string) => void
  maxSize?: number
  accept?: string
  disabled?: boolean
  className?: string
  matchId?: string // ID do match para upload em bucket privado
  selectedFile?: File | null // Arquivo selecionado (controlado pelo pai)
  onClear?: () => void // Callback para limpar arquivo
}

export function FileUpload({
  onFileSelect,
  onUploadError,
  maxSize = 20 * 1024 * 1024, // 20MB
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  disabled = false,
  className,
  matchId,
  selectedFile: externalSelectedFile,
  onClear,
}: FileUploadProps) {
  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Usar arquivo externo se fornecido, senão usar interno
  const selectedFile = externalSelectedFile !== undefined ? externalSelectedFile : internalSelectedFile

  // Limpar preview quando selectedFile mudar para null
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
    }
  }, [selectedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valida tamanho
    if (file.size > maxSize) {
      onUploadError?.(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`)
      return
    }

    // Se não for controlado externamente, atualizar estado interno
    if (externalSelectedFile === undefined) {
      setInternalSelectedFile(file)
    }

    // Notificar componente pai
    console.log('[FileUpload] Notifying parent of file selection:', file.name)
    onFileSelect?.(file)

    // Gera preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleClear = () => {
    if (externalSelectedFile === undefined) {
      setInternalSelectedFile(null)
    }
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClear?.()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={accept}
        disabled={disabled}
        className="hidden"
      />

      {!selectedFile ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Anexar arquivo
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className="flex-1 min-w-0">
            {preview ? (
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 rounded overflow-hidden bg-background">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded bg-background">
                  <File className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
